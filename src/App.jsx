import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const AppLayout = lazy(() => import('./components/layout/AppLayout'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Shipments = lazy(() => import('./pages/Shipments'));
const ShipmentDetail = lazy(() => import('./pages/ShipmentDetail'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600 text-sm">
          Loading...
        </div>
      )}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
