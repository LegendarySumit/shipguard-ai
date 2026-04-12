import { getForecastByCoords } from '../lib/api/weatherApi';
import { geocodeRouteLocation, getAlternativeRoutes } from '../lib/api/mapsApi';

function parseCity(location) {
  if (!location) return null;
  return String(location).split(',')[0].trim();
}

function weatherSeverity(condition = '') {
  const c = condition.toLowerCase();
  const map = {
    clear: 5,
    clouds: 10,
    mist: 18,
    drizzle: 24,
    rain: 36,
    fog: 38,
    snow: 65,
    thunderstorm: 78,
    tornado: 95,
    hurricane: 98,
    squall: 70,
  };
  return map[c] ?? 20;
}

function weatherRiskScore(forecastPoint) {
  if (!forecastPoint) return 20;
  let score = weatherSeverity(forecastPoint.condition);
  if ((forecastPoint.windSpeed || 0) > 50) score += 15;
  else if ((forecastPoint.windSpeed || 0) > 30) score += 8;

  if ((forecastPoint.visibility || 10) < 2) score += 15;
  else if ((forecastPoint.visibility || 10) < 5) score += 8;

  if ((forecastPoint.precipProbability || 0) > 0.7) score += 12;
  return Math.min(100, Math.round(score));
}

function nearestForecast(forecastList, targetTimestampMs) {
  if (!forecastList?.length) return null;
  let best = forecastList[0];
  let bestDiff = Math.abs(new Date(best.timestamp).getTime() - targetTimestampMs);
  for (const point of forecastList) {
    const diff = Math.abs(new Date(point.timestamp).getTime() - targetTimestampMs);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }
  return best;
}

function describeRisk(score) {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export async function buildRouteIntelligence(shipment) {
  if (!shipment?.origin || !shipment?.destination) return null;

  const originCity = parseCity(shipment.origin);
  const destinationCity = parseCity(shipment.destination);
  let originGeo = null;
  let destinationGeo = null;
  let geocodeError = null;

  try {
    [originGeo, destinationGeo] = await Promise.all([
      geocodeRouteLocation(originCity),
      geocodeRouteLocation(destinationCity),
    ]);
  } catch (error) {
    geocodeError = error;
  }

  if (!originGeo || !destinationGeo) {
    return {
      source: 'limited',
      summary: geocodeError
        ? `Route intelligence unavailable due to geocoding issue: ${geocodeError.message}`
        : 'Route intelligence unavailable due to missing coordinates.',
      horizonRisk: [],
      overallWeatherRisk: 20,
      alternatives: [],
      recommendedRoute: null,
      generatedAt: new Date().toISOString(),
    };
  }

  let originForecast = [];
  let destinationForecast = [];
  let weatherUnavailableReason = null;
  try {
    [originForecast, destinationForecast] = await Promise.all([
      getForecastByCoords(originGeo.lat, originGeo.lon),
      getForecastByCoords(destinationGeo.lat, destinationGeo.lon),
    ]);
  } catch (error) {
    weatherUnavailableReason = error.message;
  }

  const now = Date.now();
  const etaTs = shipment.eta ? new Date(shipment.eta).getTime() : now + 24 * 3600 * 1000;
  const maxHorizonHours = Math.max(12, Math.min(120, Math.round((etaTs - now) / 3600000)));
  const horizons = [6, 12, 24, 48, 72].filter((h) => h <= maxHorizonHours || h <= 24);

  const horizonRisk = horizons.map((hours) => {
    const ts = now + hours * 3600000;
    const originPoint = nearestForecast(originForecast, ts);
    const destinationPoint = nearestForecast(destinationForecast, ts);
    const originRisk = weatherRiskScore(originPoint);
    const destinationRisk = weatherRiskScore(destinationPoint);
    const combined = Math.round(originRisk * 0.4 + destinationRisk * 0.6);

    return {
      horizonHours: hours,
      riskScore: combined,
      level: describeRisk(combined),
      originCondition: originPoint?.condition || 'Unknown',
      destinationCondition: destinationPoint?.condition || 'Unknown',
    };
  });

  const overallWeatherRisk = horizonRisk.length
    ? Math.max(...horizonRisk.map((r) => r.riskScore))
    : 20;

  let alternatives = [];
  try {
    alternatives = await getAlternativeRoutes({
      origin: originGeo,
      destination: destinationGeo,
      mode: shipment.mode,
    });
  } catch (error) {
    return {
      source: 'routing-unavailable',
      origin: originGeo,
      destination: destinationGeo,
      horizonRisk,
      overallWeatherRisk,
      alternatives: [],
      recommendedRoute: null,
      summary: `Routing provider error: ${error.message}`,
      generatedAt: new Date().toISOString(),
    };
  }

  const evaluatedAlternatives = alternatives
    .map((route, idx) => {
      const weatherPenalty = Math.round(overallWeatherRisk * (idx === 2 ? 0.22 : idx === 1 ? 0.15 : 0.18));
      const compositeScore = (route.durationMin || 0) + weatherPenalty;
      return {
        ...route,
        weatherPenalty,
        compositeScore,
      };
    })
    .sort((a, b) => a.compositeScore - b.compositeScore);

  const baseline = evaluatedAlternatives[0] || null;
  const recommendedRoute = baseline
    ? {
      ...baseline,
      recommendationReason:
        overallWeatherRisk >= 50
          ? 'Recommended due to elevated forecast risk on current corridor.'
          : 'Recommended for balanced ETA and disruption exposure.',
      weatherRiskLevel: describeRisk(overallWeatherRisk),
    }
    : null;

  return {
    source: evaluatedAlternatives.some((r) => r.source === 'google') ? 'google+weather' : 'osrm+weather',
    origin: originGeo,
    destination: destinationGeo,
    horizonRisk,
    overallWeatherRisk,
    alternatives: evaluatedAlternatives,
    recommendedRoute,
    summary: weatherUnavailableReason
      ? `Route alternatives available. Weather data unavailable: ${weatherUnavailableReason}`
      : overallWeatherRisk >= 60
      ? 'Severe weather risk expected on this route window. Rerouting is advised.'
      : overallWeatherRisk >= 35
      ? 'Moderate weather disruptions expected. Monitor and prepare alternate route.'
      : 'Weather risk is currently manageable along this route.',
    generatedAt: new Date().toISOString(),
  };
}
