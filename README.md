# ShipGuard AI

ShipGuard AI is a shipment risk and logistics monitoring platform with a React frontend and Node.js backend.

## What This Project Does

- Tracks shipments in Firestore.
- Shows risk distribution, trends, alerts, and operational dashboards.
- Supports real-time updates from Firestore subscriptions.
- Ingests live shipment events from external systems (TMS/ERP/carrier webhooks).
- Proxies weather/news APIs through backend routes.

## Tech Stack

- Frontend: React, Vite, Tailwind, Recharts, Firebase Web SDK
- Backend: Node.js, Express, Firebase Admin SDK
- Data/Auth: Firebase Auth + Cloud Firestore

## Project Structure

- `src/`: frontend app source
- `backend/server.js`: backend API + webhook ingestion
- `.env` and `backend/.env`: runtime configuration

## Core Endpoints

- `GET /api/health`
- `GET /api/news/logistics`
- `GET /api/weather/by-city`
- `GET /api/weather/by-coords`
- `GET /api/weather/geocode`
- `GET /api/weather/forecast`
- `POST /api/webhooks/shipments`

## Webhook Ingestion (Production)

External source endpoint:

`https://your-backend-domain/api/webhooks/shipments`

Required auth header:

`x-webhook-secret: <WEBHOOK_SECRET>`

Accepted payload formats:

### Single shipment

```json
{
  "shipment": {
    "trackingId": "TMS-1002",
    "status": "in_transit",
    "origin": "Hamburg, DE",
    "destination": "Cologne, DE",
    "riskScore": 31
  }
}
```

### Batch shipments

```json
{
  "shipments": [
    {
      "trackingId": "TMS-1001",
      "status": "in_transit",
      "carrier": "DHL",
      "mode": "road",
      "origin": "Berlin, DE",
      "destination": "Munich, DE",
      "riskScore": 42,
      "riskLevel": "medium"
    }
  ]
}
```

## Required Environment Variables

Set in `.env` and `backend/.env` as needed:

```env
PORT=8787
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

WEBHOOK_SECRET=<at_least_32_characters>
WEBHOOK_URL=http://localhost:8787

OPENWEATHER_API_KEY=
NEWS_API_KEY=

FIREBASE_SERVICE_ACCOUNT_PATH=backend/service-account.json
# OR FIREBASE_SERVICE_ACCOUNT_JSON=
# OR FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=
# OR FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
# OR GOOGLE_APPLICATION_CREDENTIALS=
```

Frontend also needs Firebase client config (`VITE_FIREBASE_*`) in `.env`.

## Local Development

Install dependencies:

```bash
npm install
cd backend && npm install
```

Run frontend:

```bash
npm run dev
```

Run backend:

```bash
npm run backend:dev
```

Build frontend:

```bash
npm run build
```

## Useful Scripts

From project root:
- `npm run dev` -> run frontend dev server
- `npm run backend:dev` -> run backend server
- `npm run build` -> build frontend

Generate a strong webhook secret manually:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Send a test webhook manually:

```bash
curl -X POST http://localhost:8787/api/webhooks/shipments \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <WEBHOOK_SECRET>" \
  -d '{"shipment":{"trackingId":"TEST-1001","status":"in_transit","origin":"A","destination":"B","riskScore":25}}'
```

## Verification Checklist

- `GET /api/health` returns `ok: true`
- `integrations.firestoreIngestion` is `true`
- Webhook ingestion returns `HTTP 200` with `{ "ok": true, "written": <count> }`
- New shipment document appears in Firestore `shipments` collection

## Security Notes

- Never commit real service-account JSON keys.
- Keep `backend/service-account.json` ignored.
- Rotate webhook secret regularly.
- Use HTTPS in production.
- Restrict CORS to your frontend domain in production.

## Current Functional Status Summary

- Realtime shipment/alerts/analytics pages are wired to Firestore subscriptions.
- Trend analytics use Firestore aggregates (not random mock trends).
- Settings persistence is Firestore-backed.
- Backend webhook ingestion is active with Firebase Admin credentials.
- End-to-end webhook write to Firestore has been validated.
