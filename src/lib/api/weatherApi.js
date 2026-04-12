const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
import { fetchWithRetry } from './fetchWithRetry';

let backendCooldownUntil = 0;

function canUseBackend() {
  return Boolean(BACKEND_URL) && Date.now() >= backendCooldownUntil;
}

function markBackendTemporarilyUnavailable() {
  backendCooldownUntil = Date.now() + 30_000;
}

function mapWeatherPayload(data) {
  return {
    city: data.name,
    country: data.sys?.country,
    condition: data.weather?.[0]?.main || 'Clear',
    description: data.weather?.[0]?.description || '',
    icon: data.weather?.[0]?.icon,
    temperature: Math.round(data.main?.temp),
    feelsLike: Math.round(data.main?.feels_like),
    humidity: data.main?.humidity,
    windSpeed: Math.round((data.wind?.speed || 0) * 3.6),
    visibility: data.visibility ? data.visibility / 1000 : 10,
    pressure: data.main?.pressure,
    source: 'openweather',
  };
}

function mapForecastPayload(data) {
  return (data.list || []).map((item) => ({
    timestamp: new Date(item.dt * 1000).toISOString(),
    condition: item.weather?.[0]?.main || 'Clear',
    description: item.weather?.[0]?.description || '',
    temperature: Math.round(item.main?.temp),
    windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
    visibility: item.visibility ? item.visibility / 1000 : 10,
    humidity: item.main?.humidity,
    precipProbability: item.pop || 0,
    rainVolume: item.rain?.['3h'] || 0,
    source: 'openweather',
  }));
}

async function fetchJson(url, errorLabel) {
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    let reason = errorLabel;
    try {
      const payload = await res.json();
      reason = payload?.error || payload?.message || reason;
    } catch {
      // Keep generic reason when response body is not JSON.
    }
    throw new Error(`${errorLabel}: ${reason}`);
  }
  return res.json();
}

export async function getWeatherByCity(city) {
  if (!canUseBackend()) {
    throw new Error('Backend weather API unavailable. Ensure backend server is running.');
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/weather/by-city?city=${encodeURIComponent(city)}`,
      'Backend weather API error'
    );
    return mapWeatherPayload(data);
  } catch (e) {
    markBackendTemporarilyUnavailable();
    throw e;
  }
}

export async function getWeatherByCoords(lat, lon) {
  if (!canUseBackend()) {
    throw new Error('Backend weather API unavailable. Ensure backend server is running.');
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/weather/by-coords?lat=${lat}&lon=${lon}`,
      'Backend weather API error'
    );
    return mapWeatherPayload(data);
  } catch (e) {
    markBackendTemporarilyUnavailable();
    throw e;
  }
}

export async function geocodeCity(city) {
  if (!city) return null;
  if (!canUseBackend()) {
    throw new Error('Backend geocoding API unavailable. Ensure backend server is running.');
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/weather/geocode?city=${encodeURIComponent(city)}`,
      'Backend geocoding API error'
    );
    const match = data?.[0];
    if (!match) return null;
    return {
      name: match.name,
      country: match.country,
      lat: match.lat,
      lon: match.lon,
    };
  } catch (e) {
    markBackendTemporarilyUnavailable();
    throw e;
  }
}

export async function getForecastByCoords(lat, lon) {
  if (!canUseBackend()) {
    throw new Error('Backend forecast API unavailable. Ensure backend server is running.');
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/weather/forecast?lat=${lat}&lon=${lon}`,
      'Backend forecast API error'
    );
    return mapForecastPayload(data);
  } catch (e) {
    markBackendTemporarilyUnavailable();
    throw e;
  }
}
