const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
import { fetchWithRetry } from './fetchWithRetry';

function mapNewsItems(articles = []) {
  return articles.map((a) => ({
    title: a.title,
    description: a.description,
    source: a.source?.name || a.source,
    url: a.url,
    publishedAt: a.publishedAt,
    isMock: Boolean(a.isMock),
    severity: classifyNewsSeverity(`${a.title || ''} ${a.description || ''}`),
  }));
}

export async function getLogisticsNews() {
  if (BACKEND_URL) {
    try {
      const res = await fetchWithRetry(`${BACKEND_URL}/api/news/logistics`);
      if (!res.ok) throw new Error('Backend News API proxy error');
      const data = await res.json();
      return mapNewsItems(data.articles || []);
    } catch (e) {
      console.warn('Backend News API failed, using mock logistics news:', e.message);
    }
  }

  return getMockNews();
}

function classifyNewsSeverity(text) {
  const t = text.toLowerCase();
  if (t.includes('hurricane') || t.includes('earthquake') || t.includes('war') || t.includes('shutdown') || t.includes('collapse')) return 'critical';
  if (t.includes('strike') || t.includes('flood') || t.includes('closure') || t.includes('embargo') || t.includes('severe')) return 'high';
  if (t.includes('delay') || t.includes('congestion') || t.includes('shortage') || t.includes('slowdown')) return 'moderate';
  return 'low';
}

function getMockNews() {
  return [
    { title: 'Port of Shanghai Reports 48-Hour Vessel Queue', description: 'Congestion at the world\'s busiest port continues as vessel queues extend to 48 hours.', source: 'Maritime Monitor', publishedAt: new Date().toISOString(), severity: 'high', url: '#', isMock: true },
    { title: 'Severe Weather Warning for North Atlantic Shipping Routes', description: 'Storm system expected to impact trans-Atlantic routes this week.', source: 'Shipping Gazette', publishedAt: new Date(Date.now() - 3600000).toISOString(), severity: 'high', url: '#', isMock: true },
    { title: 'New Customs Regulations to Affect EU-UK Trade', description: 'Updated customs requirements may cause delays at Channel crossings.', source: 'Trade Weekly', publishedAt: new Date(Date.now() - 7200000).toISOString(), severity: 'moderate', url: '#', isMock: true },
    { title: 'FedEx Expands Same-Day Delivery Network', description: 'FedEx announces expansion of its same-day delivery capabilities across 15 new cities.', source: 'Logistics Today', publishedAt: new Date(Date.now() - 10800000).toISOString(), severity: 'low', url: '#', isMock: true },
    { title: 'Panama Canal Water Levels Improving', description: 'Recent rainfall improves transit capacity at the Panama Canal.', source: 'Canal Authority', publishedAt: new Date(Date.now() - 14400000).toISOString(), severity: 'low', url: '#', isMock: true },
    { title: 'Dock Workers Union Threatens Strike at US West Coast Ports', description: 'Labor negotiations stall as union demands remain unmet.', source: 'Port Report', publishedAt: new Date(Date.now() - 18000000).toISOString(), severity: 'critical', url: '#', isMock: true },
  ];
}
