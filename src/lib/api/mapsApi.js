import { fetchWithRetry } from './fetchWithRetry';
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export async function getAlternativeRoutes({ origin, destination, mode = 'road' }) {
  if (!origin || !destination) return [];

  try {
    if (!BACKEND_URL) return [];

    const payload = { origin, destination, mode };

    const res = await fetchWithRetry(`${BACKEND_URL}/api/routes/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Backend routes API request failed');
    const data = await res.json();
    return data.routes || [];
  } catch (e) {
    console.warn('Backend routes API failed, using empty alternatives:', e.message);
    return [];
  }
}
