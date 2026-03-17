// ShipGuard AI - Delay Prediction Engine
// Weighted multi-factor risk scoring model

const WEIGHTS = {
  weather: 0.20,
  traffic: 0.15,
  carrierReliability: 0.15,
  routeComplexity: 0.10,
  distanceTimeRatio: 0.15,
  historicalDelays: 0.10,
  portCongestion: 0.08,
  newsDisruptions: 0.07,
};

const CARRIER_RELIABILITY = {
  'FedEx': 0.92, 'UPS': 0.90, 'DHL': 0.88, 'Maersk': 0.85,
  'MSC': 0.83, 'CMA CGM': 0.82, 'Hapag-Lloyd': 0.80,
  'COSCO': 0.78, 'Evergreen': 0.81, 'Yang Ming': 0.79,
  'XPO Logistics': 0.86, 'DB Schenker': 0.84, 'Kuehne+Nagel': 0.87,
  default: 0.80,
};

const WEATHER_SEVERITY = {
  clear: 0, clouds: 5, mist: 10, drizzle: 15, rain: 30,
  snow: 55, thunderstorm: 70, tornado: 95, hurricane: 98,
  fog: 25, haze: 12, dust: 20, smoke: 18, squall: 60,
};

function calculateWeatherScore(weather) {
  if (!weather) return 20;
  const condition = weather.condition?.toLowerCase() || 'clear';
  let base = WEATHER_SEVERITY[condition] ?? 15;
  if (weather.temperature < -10) base += 15;
  else if (weather.temperature < 0) base += 8;
  if (weather.windSpeed > 60) base += 20;
  else if (weather.windSpeed > 40) base += 10;
  if (weather.visibility < 1) base += 15;
  else if (weather.visibility < 5) base += 8;
  return Math.min(base, 100);
}

function calculateTrafficScore(traffic) {
  if (!traffic) return 15;
  const congestionMap = { low: 10, moderate: 30, high: 55, severe: 80, gridlock: 95 };
  let base = congestionMap[traffic.congestion?.toLowerCase()] ?? 20;
  if (traffic.incidents > 3) base += 15;
  else if (traffic.incidents > 0) base += 8;
  if (traffic.roadClosures) base += 20;
  return Math.min(base, 100);
}

function calculateCarrierScore(carrier) {
  const reliability = CARRIER_RELIABILITY[carrier] || CARRIER_RELIABILITY.default;
  return Math.round((1 - reliability) * 100);
}

function calculateRouteComplexity(route) {
  if (!route) return 20;
  let score = 0;
  score += Math.min((route.stops || 0) * 8, 40);
  if (route.international) score += 20;
  if (route.customsClearance) score += 15;
  if (route.modeChanges > 1) score += (route.modeChanges - 1) * 10;
  return Math.min(score, 100);
}

function calculateDistanceTimeScore(shipment) {
  if (!shipment.distanceRemaining || !shipment.hoursRemaining) return 25;
  const requiredSpeed = shipment.distanceRemaining / shipment.hoursRemaining;
  const avgSpeed = shipment.mode === 'air' ? 800 : shipment.mode === 'sea' ? 25 : 60;
  const ratio = requiredSpeed / avgSpeed;
  if (ratio > 1.5) return 90;
  if (ratio > 1.2) return 65;
  if (ratio > 1.0) return 40;
  if (ratio > 0.8) return 20;
  return 5;
}

function calculateHistoricalScore(history) {
  if (!history) return 15;
  const delayRate = history.delayRate || 0;
  return Math.round(delayRate * 100);
}

function calculatePortCongestion(port) {
  if (!port) return 10;
  const levelMap = { low: 5, moderate: 25, high: 55, critical: 85 };
  return levelMap[port.congestion?.toLowerCase()] ?? 15;
}

function calculateNewsScore(news) {
  if (!news || !news.disruptions) return 0;
  let score = 0;
  for (const d of news.disruptions) {
    const severityMap = { low: 5, moderate: 15, high: 35, critical: 50 };
    score += severityMap[d.severity?.toLowerCase()] ?? 10;
  }
  return Math.min(score, 100);
}

export function predictDelay(shipment) {
  const scores = {
    weather: calculateWeatherScore(shipment.weather),
    traffic: calculateTrafficScore(shipment.traffic),
    carrierReliability: calculateCarrierScore(shipment.carrier),
    routeComplexity: calculateRouteComplexity(shipment.route),
    distanceTimeRatio: calculateDistanceTimeScore(shipment),
    historicalDelays: calculateHistoricalScore(shipment.history),
    portCongestion: calculatePortCongestion(shipment.port),
    newsDisruptions: calculateNewsScore(shipment.news),
  };

  let riskScore = 0;
  for (const [factor, weight] of Object.entries(WEIGHTS)) {
    riskScore += scores[factor] * weight;
  }
  riskScore = Math.round(Math.min(Math.max(riskScore, 0), 100));

  let riskLevel, riskColor;
  if (riskScore >= 75) { riskLevel = 'critical'; riskColor = '#ef4444'; }
  else if (riskScore >= 50) { riskLevel = 'high'; riskColor = '#f97316'; }
  else if (riskScore >= 30) { riskLevel = 'medium'; riskColor = '#f59e0b'; }
  else { riskLevel = 'low'; riskColor = '#22c55e'; }

  const eta = shipment.eta ? new Date(shipment.eta) : null;
  let estimatedDelay = 0;
  if (riskScore >= 75) estimatedDelay = Math.round(24 + (riskScore - 75) * 1.5);
  else if (riskScore >= 50) estimatedDelay = Math.round(8 + (riskScore - 50) * 0.64);
  else if (riskScore >= 30) estimatedDelay = Math.round(2 + (riskScore - 30) * 0.3);

  const adjustedEta = eta && estimatedDelay > 0
    ? new Date(eta.getTime() + estimatedDelay * 3600000)
    : eta;

  return {
    riskScore,
    riskLevel,
    riskColor,
    estimatedDelay,
    adjustedEta,
    factorScores: scores,
    factors: Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([name, score]) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(),
        score,
        weight: WEIGHTS[name],
        contribution: Math.round(score * WEIGHTS[name]),
      })),
    confidence: Math.min(95, 60 + Object.values(scores).filter(s => s > 0).length * 5),
  };
}

export function getRiskLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function getRiskColor(level) {
  const map = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };
  return map[level] || '#94a3b8';
}
