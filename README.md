<div align="center">

# 🚢 ShipGuard AI

**Real-time Shipment Risk Monitoring & Logistics Intelligence Platform**

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white&style=for-the-badge)

*Real-time Tracking • Risk Assessment • Intelligent Alerts • Analytics Dashboard • Webhook Integration*

[Live Demo](#) • [Features](#-features) • [Quick Start](#-quick-start) • [API Docs](#-api-reference)

</div>

---

## 📖 About

**ShipGuard AI** is an enterprise-grade logistics monitoring platform that provides real-time visibility into shipment operations, automated risk assessment, and predictive analytics. Built for modern supply chains, it seamlessly integrates with Transportation Management Systems (TMS), Enterprise Resource Planning (ERP) systems, and carrier APIs.

The platform leverages **Firebase Firestore** for real-time data synchronization, enabling instant updates across dashboards, alerts, and analytics. With intelligent webhook ingestion, weather integration, and logistics news aggregation, ShipGuard AI delivers actionable insights that help businesses proactively manage shipment risks and optimize operations.

Whether you're tracking a single shipment or managing thousands across multiple carriers and modes, ShipGuard AI provides the tools you need for complete logistics visibility and control.

---

## ✨ Features

- ✅ **Real-time Shipment Tracking** — Monitor shipments across multiple carriers and transport modes
- ✅ **Automated Risk Scoring** — Dynamic risk calculation with visual distribution analytics
- ✅ **Intelligent Alert System** — Proactive notifications for high-risk events and delays
- ✅ **Live Analytics Dashboard** — Trend analysis, operational metrics, and KPIs
- ✅ **Webhook Integration** — Seamless ingestion from TMS/ERP systems with secure authentication
- ✅ **Weather Monitoring** — Location-based weather forecasts for route planning
- ✅ **Logistics News Feed** — Real-time industry news aggregation
- ✅ **Firestore Real-time Sync** — Instant updates across all connected clients
- ✅ **Multi-carrier Support** — DHL, FedEx, UPS, and custom carrier integration
- ✅ **Custom Reporting** — Configurable views, filters, and data exports
- ✅ **User Settings Persistence** — Firestore-backed preferences and configurations
- ✅ **Secure API Routes** — Weather and news proxy with backend authentication

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Modern component-based UI framework
- **Vite** — Lightning-fast build tool and dev server
- **Tailwind CSS** — Utility-first styling with custom design system
- **Recharts** — Interactive data visualization and charting
- **Firebase Web SDK** — Client-side Firestore subscriptions and authentication

### Backend
- **Node.js** — JavaScript runtime for server-side logic
- **Express** — Minimal and flexible web application framework
- **Firebase Admin SDK** — Server-side Firestore operations and authentication
- **CORS** — Cross-origin resource sharing middleware

### Database & Authentication
- **Cloud Firestore** — Scalable NoSQL document database with real-time sync
- **Firebase Authentication** — Secure user authentication and authorization

### External Integrations
- **OpenWeather API** — Weather data and location-based forecasts
- **News API** — Logistics and supply chain news aggregation

---

## 📁 Project Structure

```
shipguard-ai/
├── backend/
│   ├── server.js                 # Express server, API routes, webhook handler
│   ├── .env                      # Backend environment variables
│   ├── .env.example              # Backend env template
│   ├── service-account.json      # Firebase Admin credentials (gitignored)
│   ├── package.json              # Backend dependencies
│   └── node_modules/
├── src/
│   ├── components/               # Reusable React components
│   ├── pages/                    # Page-level components (Dashboard, Analytics, Alerts)
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions and helpers
│   ├── lib/                      # Firebase client & API integrations
│   ├── App.jsx                   # Main application component
│   └── main.jsx                  # React entry point
├── public/                       # Static assets
├── .env                          # Frontend environment variables
├── .env.example                  # Frontend env template
├── .gitignore                    # Git ignore configuration
├── package.json                  # Frontend dependencies and scripts
├── vite.config.js                # Vite build configuration
├── tailwind.config.js            # Tailwind CSS customization
├── postcss.config.js             # PostCSS configuration
└── README.md                     # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** v16 or higher
- **npm** or **yarn**
- **Firebase project** with Firestore and Authentication enabled
- **API keys** for OpenWeather and News API

### Installation

```bash
# Clone the repository
git clone https://github.com/LegendarySumit/shipguard-ai.git
cd shipguard-ai

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Configuration

Create `.env` file in project root:

```env
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API URL
VITE_API_URL=http://localhost:8787
```

Create `backend/.env` file:

```env
# Server Configuration
PORT=8787
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Webhook Security
WEBHOOK_SECRET=your_secure_webhook_secret_min_32_chars
WEBHOOK_URL=http://localhost:8787

# External APIs
OPENWEATHER_API_KEY=your_openweather_api_key
NEWS_API_KEY=your_news_api_key

# Firebase Admin (choose one method)
FIREBASE_SERVICE_ACCOUNT_PATH=backend/service-account.json
# OR FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=base64_encoded_json
```

### Generate Webhook Secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Run the Application

**Terminal 1 — Start Frontend:**
```bash
npm run dev
```
Frontend available at `http://localhost:5173`

**Terminal 2 — Start Backend:**
```bash
npm run backend:dev
```
Backend available at `http://localhost:8787`

### Build for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview

# Run backend in production
cd backend
NODE_ENV=production node server.js
```

---

## 📚 Usage

### Dashboard
Access the main dashboard at `http://localhost:5173` to view:
- Real-time shipment risk distribution
- Active alerts and notifications
- Quick statistics and KPIs

### Analytics
Navigate to `/analytics` for:
- Trend analysis with historical data
- Carrier and mode performance metrics
- Risk score evolution over time

### Webhook Testing

Send a test shipment via webhook:

```bash
curl -X POST http://localhost:8787/api/webhooks/shipments \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_WEBHOOK_SECRET" \
  -d '{
    "shipment": {
      "trackingId": "TEST-1001",
      "status": "in_transit",
      "origin": "Berlin, DE",
      "destination": "Munich, DE",
      "riskScore": 25
    }
  }'
```

Verify the shipment appears in Firestore and updates the dashboard in real-time.

---

## 🔌 API Reference

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "ok": true,
  "timestamp": "2026-03-18T10:30:00.000Z",
  "integrations": {
    "firestoreIngestion": true,
    "weatherAPI": true,
    "newsAPI": true
  }
}
```

---

### Weather Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/weather/by-city` | GET | Get weather by city name |
| `/api/weather/by-coords` | GET | Get weather by coordinates |
| `/api/weather/geocode` | GET | Convert location to coordinates |
| `/api/weather/forecast` | GET | Get weather forecast |

**Example — Weather by City:**
```http
GET /api/weather/by-city?city=London&units=metric
```

**Query Parameters:**
- `city` (required) — City name
- `units` (optional) — `metric`, `imperial`, or `standard` (default: `metric`)

**Example — Weather by Coordinates:**
```http
GET /api/weather/by-coords?lat=51.5074&lon=-0.1278&units=metric
```

**Query Parameters:**
- `lat` (required) — Latitude
- `lon` (required) — Longitude
- `units` (optional) — Temperature units

---

### News Endpoint

```http
GET /api/news/logistics
```

**Response:**
```json
{
  "articles": [
    {
      "title": "Global Shipping Disruptions Continue",
      "description": "Latest updates on supply chain issues...",
      "url": "https://example.com/article",
      "publishedAt": "2026-03-18T10:00:00Z",
      "source": { "name": "Logistics Weekly" }
    }
  ]
}
```

---

### Webhook Ingestion

```http
POST /api/webhooks/shipments
```

**Headers:**
```
Content-Type: application/json
x-webhook-secret: your_webhook_secret
```

**Single Shipment Payload:**
```json
{
  "shipment": {
    "trackingId": "TMS-1002",
    "status": "in_transit",
    "carrier": "DHL",
    "mode": "road",
    "origin": "Hamburg, DE",
    "destination": "Cologne, DE",
    "riskScore": 31,
    "riskLevel": "low"
  }
}
```

**Batch Shipments Payload:**
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
    },
    {
      "trackingId": "TMS-1002",
      "status": "delivered",
      "carrier": "FedEx",
      "mode": "air",
      "origin": "London, UK",
      "destination": "Paris, FR",
      "riskScore": 15,
      "riskLevel": "low"
    }
  ]
}
```

**Shipment Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trackingId` | string | ✅ | Unique tracking identifier |
| `status` | string | ✅ | `pending`, `in_transit`, `delivered`, `delayed` |
| `carrier` | string | ❌ | Carrier name (DHL, FedEx, UPS) |
| `mode` | string | ❌ | Transport mode: `road`, `air`, `sea`, `rail` |
| `origin` | string | ✅ | Origin location |
| `destination` | string | ✅ | Destination location |
| `riskScore` | number | ✅ | Risk score (0-100) |
| `riskLevel` | string | ❌ | `low`, `medium`, `high` (auto-calculated) |

**Success Response:**
```json
{
  "ok": true,
  "written": 2,
  "message": "Shipments processed successfully"
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": "Invalid webhook secret"
}
```

---

## 📊 Project Status

### Current Implementation

| Feature | Status |
|---------|--------|
| Real-time Firestore Subscriptions | ✅ Complete |
| Webhook Ingestion | ✅ Complete |
| Risk Analytics Dashboard | ✅ Complete |
| Trend Analysis (Firestore Aggregates) | ✅ Complete |
| Weather API Integration | ✅ Complete |
| News API Integration | ✅ Complete |
| Settings Persistence | ✅ Complete |
| Firebase Authentication | ✅ Complete |
| Multi-carrier Support | ✅ Complete |

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error:** `Cannot find module 'firebase-admin'`

**Solution:**
```bash
cd backend
npm install
```

---

### Webhook Returns 401 Unauthorized

**Error:** `Invalid webhook secret`

**Solution:**
- Verify `x-webhook-secret` header matches `WEBHOOK_SECRET` in `backend/.env`
- Ensure secret is at least 32 characters
- Check for extra spaces or line breaks in the secret

---

### Firestore Permission Denied

**Error:** `Missing or insufficient permissions`

**Solution:**
1. Check Firebase security rules
2. Verify user is authenticated
3. Ensure service account has Firestore read/write permissions
4. Update security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shipments/{shipmentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### Frontend Can't Connect to Backend

**Error:** `Network Error` or CORS error

**Solution:**
- Verify backend is running on port 8787
- Check `VITE_API_URL=http://localhost:8787` in frontend `.env`
- Verify `ALLOWED_ORIGINS` in `backend/.env` includes `http://localhost:5173`

---

### Weather/News API Not Working

**Error:** `401 Unauthorized` or `403 Forbidden`

**Solution:**
- Verify API keys are correct in `backend/.env`
- Check API key restrictions in provider dashboards
- Ensure API usage limits haven't been exceeded
- Test API keys directly: `curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY"`

---

## 🔮 Future Enhancements

- [ ] Machine learning-based risk prediction
- [ ] Advanced route optimization algorithms
- [ ] Mobile app for iOS and Android
- [ ] Email/SMS notification system
- [ ] Custom alert rules engine
- [ ] Multi-language support
- [ ] Shipment cost tracking and analytics
- [ ] Carrier performance benchmarking
- [ ] Export reports to PDF/Excel
- [ ] GraphQL API option
- [ ] Role-based access control (RBAC)
- [ ] Integration with more carrier APIs
- [ ] Geofencing and zone-based alerts
- [ ] Carbon footprint tracking

---

## 🔒 Security

### Best Practices

- 🔐 **Never commit credentials** — Keep `.env` files out of version control
- 🔑 **Service account protection** — Ensure `backend/service-account.json` is gitignored
- 🔄 **Rotate secrets regularly** — Update webhook secret every 90 days
- 🔒 **Use HTTPS in production** — Always use SSL/TLS certificates
- 🚪 **Restrict CORS** — Limit `ALLOWED_ORIGINS` to your frontend domain only
- 🛡️ **Firebase security rules** — Implement proper read/write restrictions
- 🔐 **Environment variables** — Use secret management in production (Railway, Render, etc.)
- 🚫 **API key restrictions** — Restrict keys by domain/IP in provider dashboards

### Security Checklist

- [ ] `.env` and `backend/.env` are in `.gitignore`
- [ ] Service account JSON is not committed to repository
- [ ] Webhook secret is strong (48+ characters, generated cryptographically)
- [ ] CORS is restricted to frontend domain in production
- [ ] HTTPS is enabled for production deployment
- [ ] Firebase security rules enforce authentication
- [ ] API keys have domain/IP restrictions configured
- [ ] Rate limiting is enabled on webhook endpoint

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**LegendarySumit**

- GitHub: [@LegendarySumit](https://github.com/LegendarySumit)
- Project Repository: [ShipGuard AI](https://github.com/LegendarySumit/shipguard-ai)
- Live Demo: [Launch Platform](https://shipguard-ai.vercel.app)

---

<div align="center">

**🚢 Revolutionizing Logistics with Real-time Intelligence**

*Built with React, Node.js, Firebase, and dedication to supply chain excellence*

---

**⭐ Star this repo if you find it helpful!**

</div>
