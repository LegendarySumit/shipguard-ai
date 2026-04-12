const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

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
  }));
}

async function fetchJson(url, errorLabel) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errorLabel);
  return res.json();
}

export async function getWeatherByCity(city) {
  if (BACKEND_URL) {
    try {
      const data = await fetchJson(
        `${BACKEND_URL}/api/weather/by-city?city=${encodeURIComponent(city)}`,
        'Backend weather API error'
      );
      return mapWeatherPayload(data);
    } catch (e) {
      console.warn('Backend weather API failed, using mock weather:', e.message);
    }
  }

  return getMockWeather(city);
}

export async function getWeatherByCoords(lat, lon) {
  if (BACKEND_URL) {
    try {
      const data = await fetchJson(
        `${BACKEND_URL}/api/weather/by-coords?lat=${lat}&lon=${lon}`,
        'Backend weather API error'
      );
      return mapWeatherPayload(data);
    } catch (e) {
      console.warn('Backend weather-by-coords failed, using mock weather:', e.message);
    }
  }

  return getMockWeather('Unknown');
}

export async function geocodeCity(city) {
  if (!city) return null;

  if (BACKEND_URL) {
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
      console.warn('Backend geocoding failed:', e.message);
    }
  }

  return null;
}

export async function getForecastByCoords(lat, lon) {
  if (BACKEND_URL) {
    try {
      const data = await fetchJson(
        `${BACKEND_URL}/api/weather/forecast?lat=${lat}&lon=${lon}`,
        'Backend forecast API error'
      );
      return mapForecastPayload(data);
    } catch (e) {
      console.warn('Backend forecast API failed, using mock forecast:', e.message);
    }
  }

  return getMockForecast();
}

function getMockWeather(city) {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm', 'Mist', 'Drizzle'];
  const cond = conditions[Math.floor(Math.random() * conditions.length)];
  return {
    city,
    country: 'XX',
    condition: cond,
    description: cond.toLowerCase(),
    temperature: Math.round(Math.random() * 35 - 5),
    feelsLike: Math.round(Math.random() * 35 - 5),
    humidity: Math.round(Math.random() * 60 + 30),
    windSpeed: Math.round(Math.random() * 50),
    visibility: Math.round(Math.random() * 10 + 2),
    pressure: Math.round(Math.random() * 30 + 1000),
    isMock: true,
  };
}

function getMockForecast() {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Mist'];
  return Array.from({ length: 12 }, (_, i) => {
    const ts = new Date(Date.now() + i * 3 * 3600000).toISOString();
    const cond = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      timestamp: ts,
      condition: cond,
      description: cond.toLowerCase(),
      temperature: Math.round(Math.random() * 30),
      windSpeed: Math.round(Math.random() * 55),
      visibility: Math.round(Math.random() * 10 + 1),
      humidity: Math.round(Math.random() * 60 + 30),
      precipProbability: Math.random(),
      rainVolume: Math.round(Math.random() * 8),
      isMock: true,
    };
  });
}
