import { fetchWithRetry } from './fetchWithRetry';
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

let backendCooldownUntil = 0;

function canUseBackend() {
  return Boolean(BACKEND_URL) && Date.now() >= backendCooldownUntil;
}

function markBackendTemporarilyUnavailable() {
  backendCooldownUntil = Date.now() + 30_000;
}

function shouldCooldownForStatus(status) {
  // 4xx usually means request/input issue; keep backend available.
  return !status || status >= 500 || status === 429;
}

async function parseErrorResponse(res, fallbackMessage) {
  try {
    const data = await res.json();
    return data?.error || data?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function normalizeCoords(point) {
  if (!point) return null;
  const lat = Number(point.lat);
  const lon = Number(point.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    ...point,
    lat,
    lon,
  };
}

export async function geocodeRouteLocation(city) {
  if (!city) return null;
  if (!canUseBackend()) {
    throw new Error('Backend routing geocoder unavailable. Ensure backend server is running.');
  }

  try {
    const res = await fetchWithRetry(`${BACKEND_URL}/api/routes/geocode?city=${encodeURIComponent(city)}`);
    if (!res.ok) {
      const message = await parseErrorResponse(res, 'Backend routes geocode API request failed');
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    const data = await res.json();
    const match = data?.[0];
    if (!match) return null;
    return {
      name: match.name,
      lat: Number(match.lat),
      lon: Number(match.lon),
    };
  } catch (e) {
    if (shouldCooldownForStatus(e?.status)) {
      markBackendTemporarilyUnavailable();
    }
    throw e;
  }
}

export async function getAlternativeRoutes({ origin, destination, mode = 'road' }) {
  const safeOrigin = normalizeCoords(origin);
  const safeDestination = normalizeCoords(destination);
  if (!safeOrigin || !safeDestination) {
    throw new Error('Routing coordinates are invalid or missing for this shipment');
  }

  if (!canUseBackend()) {
    throw new Error('Backend routes API unavailable. Ensure backend server is running.');
  }

  try {
    // OSRM endpoint is road-network based; use road mode consistently.
    const payload = { origin: safeOrigin, destination: safeDestination, mode: 'road', requestedMode: mode };

    const res = await fetchWithRetry(`${BACKEND_URL}/api/routes/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const message = await parseErrorResponse(res, 'Backend routes API request failed');
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    const data = await res.json();
    return data.routes || [];
  } catch (e) {
    if (shouldCooldownForStatus(e?.status)) {
      markBackendTemporarilyUnavailable();
    }
    throw e;
  }
}
