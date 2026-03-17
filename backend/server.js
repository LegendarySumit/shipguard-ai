import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDir, '..');
const envFiles = [
  path.resolve(projectRoot, '.env'),
  path.resolve(serverDir, '.env'),
];

const fileEnv = envFiles.reduce((acc, envPath) => ({
  ...acc,
  ...parseEnvFile(envPath),
}), {});
const env = {
  ...fileEnv,
  ...process.env,
};

const OPENWEATHER_KEY = env.OPENWEATHER_API_KEY || env.VITE_OPENWEATHER_API_KEY || '';
const NEWS_KEY = env.NEWS_API_KEY || env.VITE_NEWS_API_KEY || '';

const app = express();
const port = Number(env.PORT) || 8787;
const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS policy'));
  },
}));
app.use(express.json({ limit: '2mb' }));

function sanitizeNewsQuery(query) {
  return String(query || 'shipping delay OR port congestion OR supply chain disruption').trim();
}

function normalizeShipment(input) {
  return {
    trackingId: String(input.trackingId || '').trim(),
    status: input.status || 'in_transit',
    carrier: input.carrier || 'unknown',
    mode: input.mode || 'road',
    origin: input.origin || 'Unknown',
    destination: input.destination || 'Unknown',
    eta: input.eta || null,
    departureDate: input.departureDate || null,
    progress: Number.isFinite(Number(input.progress)) ? Number(input.progress) : 0,
    isDelayed: Boolean(input.isDelayed),
    delayHours: Number.isFinite(Number(input.delayHours)) ? Number(input.delayHours) : 0,
    riskScore: Number.isFinite(Number(input.riskScore)) ? Number(input.riskScore) : 0,
    riskLevel: input.riskLevel || 'low',
    priority: input.priority || 'standard',
    weather: input.weather || null,
    traffic: input.traffic || null,
    port: input.port || null,
    route: input.route || null,
    product: input.product || 'Unspecified goods',
    customer: input.customer || 'Unknown customer',
    items: Number.isFinite(Number(input.items)) ? Number(input.items) : 0,
    weight: Number.isFinite(Number(input.weight)) ? Number(input.weight) : 0,
    source: input.source || 'webhook',
  };
}

function getServiceAccount() {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
    const decoded = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(projectRoot, env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      type: 'service_account',
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: String(env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    };
  }

  return null;
}

let db = null;
try {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    db = admin.firestore();
    console.log('Firebase Admin initialized for ingestion/webhooks.');
  } else if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID,
    });
    db = admin.firestore();
    console.log('Firebase Admin initialized with application default credentials.');
  } else {
    console.warn('Firebase Admin credentials not configured. Webhook ingestion is disabled.');
  }
} catch (e) {
  console.error('Failed to initialize Firebase Admin:', e.message);
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'shipguard-backend',
    integrations: {
      openWeather: Boolean(OPENWEATHER_KEY),
      newsApi: Boolean(NEWS_KEY),
      firestoreIngestion: Boolean(db),
    },
  });
});

app.get('/api/news/logistics', async (req, res) => {
  if (!NEWS_KEY) {
    res.status(503).json({ error: 'NEWS_API_KEY is not configured on backend' });
    return;
  }

  const q = sanitizeNewsQuery(req.query.q);
  const pageSize = Number(req.query.pageSize) || 10;
  const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=${Math.max(1, Math.min(20, pageSize))}&apiKey=${NEWS_KEY}`;

  try {
    const upstream = await fetch(apiUrl);
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: data.message || 'News API request failed',
        code: data.code || 'news_upstream_error',
      });
      return;
    }

    res.json({
      status: data.status,
      totalResults: data.totalResults,
      articles: (data.articles || []).map((article) => ({
        title: article.title,
        description: article.description,
        source: article.source?.name,
        url: article.url,
        publishedAt: article.publishedAt,
      })),
    });
  } catch (e) {
    res.status(502).json({ error: 'News proxy failed', detail: e.message });
  }
});

app.get('/api/weather/by-city', async (req, res) => {
  if (!OPENWEATHER_KEY) {
    res.status(503).json({ error: 'OPENWEATHER_API_KEY is not configured on backend' });
    return;
  }

  const city = String(req.query.city || '').trim();
  if (!city) {
    res.status(400).json({ error: 'city query parameter is required' });
    return;
  }

  const uri = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_KEY}&units=metric`;
  try {
    const upstream = await fetch(uri);
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.message || 'Weather API request failed' });
      return;
    }
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Weather proxy failed', detail: e.message });
  }
});

app.get('/api/weather/by-coords', async (req, res) => {
  if (!OPENWEATHER_KEY) {
    res.status(503).json({ error: 'OPENWEATHER_API_KEY is not configured on backend' });
    return;
  }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'lat and lon query parameters are required' });
    return;
  }

  const uri = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
  try {
    const upstream = await fetch(uri);
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.message || 'Weather API request failed' });
      return;
    }
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Weather proxy failed', detail: e.message });
  }
});

app.get('/api/weather/geocode', async (req, res) => {
  if (!OPENWEATHER_KEY) {
    res.status(503).json({ error: 'OPENWEATHER_API_KEY is not configured on backend' });
    return;
  }

  const city = String(req.query.city || '').trim();
  if (!city) {
    res.status(400).json({ error: 'city query parameter is required' });
    return;
  }

  const uri = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_KEY}`;
  try {
    const upstream = await fetch(uri);
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.message || 'Geocoding request failed' });
      return;
    }
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Geocoding proxy failed', detail: e.message });
  }
});

app.get('/api/weather/forecast', async (req, res) => {
  if (!OPENWEATHER_KEY) {
    res.status(503).json({ error: 'OPENWEATHER_API_KEY is not configured on backend' });
    return;
  }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'lat and lon query parameters are required' });
    return;
  }

  const uri = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
  try {
    const upstream = await fetch(uri);
    const data = await upstream.json();
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.message || 'Forecast request failed' });
      return;
    }
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Forecast proxy failed', detail: e.message });
  }
});

app.post('/api/webhooks/shipments', async (req, res) => {
  const secret = env.WEBHOOK_SECRET || '';
  if (!secret) {
    res.status(503).json({ error: 'WEBHOOK_SECRET is not configured' });
    return;
  }

  if (secret.length < 32) {
    res.status(503).json({ error: 'WEBHOOK_SECRET must be at least 32 characters long' });
    return;
  }

  const provided = req.headers['x-webhook-secret'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!provided || provided !== secret) {
    res.status(401).json({ error: 'Unauthorized webhook request' });
    return;
  }

  if (!db) {
    res.status(503).json({ error: 'Firestore ingestion is not configured on backend' });
    return;
  }

  const list = Array.isArray(req.body?.shipments)
    ? req.body.shipments
    : Array.isArray(req.body)
      ? req.body
      : req.body?.shipment
        ? [req.body.shipment]
        : null;
  if (!list || list.length === 0) {
    res.status(400).json({ error: 'Expected a non-empty shipments array, an array body, or shipment object' });
    return;
  }

  const valid = list.map(normalizeShipment).filter((shipment) => shipment.trackingId.length > 0);
  if (valid.length === 0) {
    res.status(400).json({ error: 'No valid shipments found (trackingId is required)' });
    return;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  let written = 0;

  for (let i = 0; i < valid.length; i += 400) {
    const chunk = valid.slice(i, i + 400);
    const batch = db.batch();
    chunk.forEach((shipment) => {
      const ref = db.collection('shipments').doc(shipment.trackingId);
      batch.set(ref, {
        ...shipment,
        updatedAt: now,
        createdAt: now,
      }, { merge: true });
    });
    await batch.commit();
    written += chunk.length;
  }

  res.json({ ok: true, written });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled backend error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`ShipGuard backend listening on http://localhost:${port}`);
});
