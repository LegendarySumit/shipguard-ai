const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function mapMode(mode) {
  if (mode === 'road' || mode === 'rail' || mode === 'multimodal') return 'DRIVE';
  return null;
}

function supportsOsrm(mode) {
  return mode === 'road' || mode === 'rail' || mode === 'multimodal';
}

function parseDurationMinutes(durationText) {
  if (!durationText) return null;
  const seconds = Number(String(durationText).replace('s', ''));
  return Number.isFinite(seconds) ? Math.max(1, Math.round(seconds / 60)) : null;
}

function buildHeuristicAlternatives(origin, destination, mode) {
  const distanceKm = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const speedKmh = mode === 'air' ? 700 : mode === 'sea' ? 32 : mode === 'rail' ? 70 : 55;
  const baseMinutes = Math.max(30, Math.round((distanceKm / speedKmh) * 60));

  const variants = [
    { name: 'Primary Corridor', factor: 1.0, fuelFactor: 1.0 },
    { name: 'Balanced Alternate', factor: 0.92, fuelFactor: 1.08 },
    { name: 'Weather Avoidance Path', factor: 1.12, fuelFactor: 1.15 },
  ];

  return variants.map((variant, idx) => ({
    id: `heuristic-${idx}`,
    name: variant.name,
    source: 'heuristic',
    distanceKm: Math.round(distanceKm),
    durationMin: Math.max(25, Math.round(baseMinutes * variant.factor)),
    fuelImpactPercent: Math.round((variant.fuelFactor - 1) * 100),
    warnings: idx === 2 ? ['Longer travel time due to avoidance detour'] : [],
    polyline: null,
  }));
}

async function getOsrmRoutes({ origin, destination, mode }) {
  if (!supportsOsrm(mode)) return [];

  const coordinates = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const params = new URLSearchParams({
    alternatives: '3',
    overview: 'full',
    geometries: 'polyline',
    steps: 'false',
  });

  const res = await fetch(`${OSRM_API_URL}/${coordinates}?${params.toString()}`);
  if (!res.ok) throw new Error('OSRM route request failed');

  const data = await res.json();
  const routes = data.routes || [];
  return routes.map((route, idx) => ({
    id: `osrm-${idx}`,
    name: idx === 0 ? 'Primary Corridor' : `Alternate ${idx}`,
    source: 'osrm',
    distanceKm: Math.round((route.distance || 0) / 1000),
    durationMin: Math.max(1, Math.round((route.duration || 0) / 60)),
    fuelImpactPercent: idx === 0 ? 0 : Math.round(3 + idx * 4),
    warnings: [],
    polyline: route.geometry || null,
  }));
}

export async function getAlternativeRoutes({ origin, destination, mode = 'road' }) {
  if (!origin || !destination) return [];

  const travelMode = mapMode(mode);
  if (!travelMode || !GOOGLE_MAPS_API_KEY) {
    try {
      const osrmRoutes = await getOsrmRoutes({ origin, destination, mode });
      if (osrmRoutes.length) return osrmRoutes;
    } catch (e) {
      console.warn('OSRM routing failed, using heuristic alternatives:', e.message);
    }
    return buildHeuristicAlternatives(origin, destination, mode);
  }

  try {
    const body = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lon } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lon } } },
      travelMode,
      computeAlternativeRoutes: true,
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: 'en-US',
      units: 'METRIC',
    };

    const fieldMask = [
      'routes.duration',
      'routes.distanceMeters',
      'routes.polyline.encodedPolyline',
      'routes.legs',
      'routes.warnings',
      'routes.routeLabels',
    ].join(',');

    const res = await fetch(ROUTES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Google Routes API request failed');
    const data = await res.json();
    const routes = data.routes || [];

    if (!routes.length) return buildHeuristicAlternatives(origin, destination, mode);

    return routes.map((route, idx) => ({
      id: `google-${idx}`,
      name: route.routeLabels?.[0] || `Route ${idx + 1}`,
      source: 'google',
      distanceKm: Math.round((route.distanceMeters || 0) / 1000),
      durationMin: parseDurationMinutes(route.duration),
      fuelImpactPercent: idx === 0 ? 0 : Math.round(4 + idx * 3),
      warnings: route.warnings || [],
      polyline: route.polyline?.encodedPolyline || null,
    }));
  } catch (e) {
    console.warn('Google Routes API failed, trying OSRM alternatives:', e.message);
    try {
      const osrmRoutes = await getOsrmRoutes({ origin, destination, mode });
      if (osrmRoutes.length) return osrmRoutes;
    } catch (osrmError) {
      console.warn('OSRM routing failed, using heuristic alternatives:', osrmError.message);
    }
    return buildHeuristicAlternatives(origin, destination, mode);
  }
}
