import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, Clock, Truck, Plane, Ship, Train, Shuffle,
  Cloud, Wind, Eye, Thermometer, AlertTriangle, CheckCircle2, Circle,
  ChevronRight, Zap, Route, Phone, Bell, GitBranch, FileCheck, Activity, ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getShipmentById, upsertRouteRecommendationForShipment } from '../services/firestoreService';
import { predictDelay } from '../lib/ml/delayPredictor';
import { getRecommendations, getUrgencyLabel } from '../lib/ml/recommendationEngine';
import { getWeatherByCity } from '../lib/api/weatherApi';
import { buildRouteIntelligence } from '../services/routeIntelligenceService';
import toast from 'react-hot-toast';

const modeIcons = { air: Plane, sea: Ship, road: Truck, rail: Train, multimodal: Shuffle };
const interventionIcons = { Route, Truck, Bell, Zap, Phone, Package, GitBranch, FileCheck };

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const leftColumnRef = useRef(null);
  const aiCardRef = useRef(null);
  const [shipment, setShipment] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [weather, setWeather] = useState(null);
  const [routeIntelligence, setRouteIntelligence] = useState(null);
  const [routeIntelLoading, setRouteIntelLoading] = useState(false);
  const [routeCardHeight, setRouteCardHeight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getShipmentById(id);
        if (!data) {
          setShipment(null);
          setPrediction(null);
          setRecommendations([]);
          setWeather(null);
          return;
        }
        const pred = predictDelay(data);
        data.riskScore = pred.riskScore;
        data.riskLevel = pred.riskLevel;
        data.riskColor = pred.riskColor;
        data.estimatedDelay = pred.estimatedDelay;
        setShipment(data);
        setPrediction(pred);
        setRecommendations(getRecommendations(pred, data));

        // Fetch live weather for destination
        if (data.destination) {
          const city = data.destination.split(',')[0].trim();
          const w = await getWeatherByCity(city);
          setWeather(w);
        }
      } catch (e) {
        console.error(e);
        toast.error('Unable to load shipment details');
        setShipment(null);
        setPrediction(null);
        setRecommendations([]);
        setWeather(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!shipment || !prediction) return;
    let cancelled = false;

    async function runRouteIntelligence() {
      setRouteIntelLoading(true);
      try {
        const intelligence = await buildRouteIntelligence(shipment);
        if (cancelled) return;
        setRouteIntelligence(intelligence);

        if (intelligence?.recommendedRoute) {
          await upsertRouteRecommendationForShipment(shipment, intelligence, prediction);
        }
      } catch (e) {
        console.warn('Route intelligence generation failed:', e.message);
      } finally {
        if (!cancelled) setRouteIntelLoading(false);
      }
    }

    runRouteIntelligence();
    return () => {
      cancelled = true;
    };
  }, [shipment, prediction]);

  useEffect(() => {
    const GAP_PX = 24; // Matches gap-6 between right-column cards.
    const MIN_ROUTE_CARD_HEIGHT = 140;

    const measure = () => {
      if (window.innerWidth < 1024) {
        setRouteCardHeight(null);
        return;
      }

      const leftHeight = leftColumnRef.current?.offsetHeight || 0;
      const aiHeight = aiCardRef.current?.offsetHeight || 0;
      if (!leftHeight || !aiHeight) return;

      const nextHeight = Math.max(MIN_ROUTE_CARD_HEIGHT, leftHeight - aiHeight - GAP_PX);
      setRouteCardHeight(nextHeight);
    };

    const frame = requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(measure);
    if (leftColumnRef.current) resizeObserver.observe(leftColumnRef.current);
    if (aiCardRef.current) resizeObserver.observe(aiCardRef.current);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [shipment, routeIntelligence, routeIntelLoading, recommendations.length]);

  const urgency = useMemo(() => prediction ? getUrgencyLabel(prediction.riskScore) : null, [prediction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Analyzing shipment...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-lg font-medium text-slate-500">Shipment not found</p>
        <button onClick={() => navigate('/shipments')} className="btn-primary mt-4">Back to Shipments</button>
      </div>
    );
  }

  const ModeIcon = modeIcons[shipment.mode] || Package;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => navigate('/shipments')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 font-mono">{shipment.trackingId}</h1>
              <span className={`badge-${shipment.riskLevel}`}>{shipment.riskLevel} risk</span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{shipment.product} • {shipment.customer}</p>
          </div>
        </div>
        {urgency && (
          <div className={`px-4 py-2 rounded-xl ${urgency.bg}`}>
            <p className={`text-sm font-semibold ${urgency.color}`}>{urgency.label}</p>
          </div>
        )}
      </div>

      {/* Risk Score Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Risk Score */}
          <div className="p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={shipment.riskColor} strokeWidth="10"
                  strokeDasharray={`${(shipment.riskScore / 100) * 327} 327`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: shipment.riskColor }}>{shipment.riskScore}</span>
                <span className="text-xs text-slate-400">Risk Score</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {prediction?.confidence}% Confidence
            </p>
          </div>

          {/* Factor Breakdown */}
          <div className="p-6 col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Factor Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prediction?.factors?.slice(0, 8).map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 capitalize">{f.name}</span>
                      <span className="font-semibold text-slate-700">{f.score}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${f.score}%`,
                          backgroundColor: f.score >= 60 ? '#ef4444' : f.score >= 40 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start lg:items-stretch">
        {/* Left Column */}
        <div ref={leftColumnRef} className="lg:col-span-2 space-y-6">
          {/* Shipment Info */}
          <div className="stat-card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Shipment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Origin</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-sm font-medium text-slate-700 break-words">{shipment.origin}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Destination</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-sm font-medium text-slate-700 break-words">{shipment.destination}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Carrier</p>
                <p className="text-sm font-medium text-slate-700">{shipment.carrier}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Mode</p>
                <div className="flex items-center gap-1.5">
                  <ModeIcon className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm font-medium text-slate-700 capitalize">{shipment.mode}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">ETA</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm font-medium text-slate-700">
                    {shipment.eta ? new Date(shipment.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Estimated Delay</p>
                <p className={`text-sm font-semibold ${shipment.estimatedDelay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {shipment.estimatedDelay > 0 ? `+${shipment.estimatedDelay} hours` : 'On Time'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Priority</p>
                <span className={`badge ${shipment.priority === 'critical' ? 'bg-red-100 text-red-700' : shipment.priority === 'express' ? 'bg-purple-100 text-purple-700' : shipment.priority === 'priority' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                  {shipment.priority}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Weight</p>
                <p className="text-sm font-medium text-slate-700">{shipment.weight?.toLocaleString()} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Items</p>
                <p className="text-sm font-medium text-slate-700">{shipment.items?.toLocaleString()} units</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Transit Progress</p>
                <p className="text-xs font-semibold text-slate-600">{shipment.progress}%</p>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-brand-500 to-brand-400"
                  style={{ width: `${shipment.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="stat-card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Shipment Timeline</h3>
            <div className="space-y-0">
              {shipment.timeline?.map((event, i) => {
                const isCompleted = event.status === 'completed';
                const isActive = event.status === 'active';
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                      ) : isActive ? (
                        <div className="w-6 h-6 rounded-full border-2 border-brand-500 bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 flex-shrink-0" />
                      )}
                      {i < shipment.timeline.length - 1 && (
                        <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-300' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-slate-700' : isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                        {event.event}
                      </p>
                      {event.timestamp && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Route Intelligence */}
          <div
            className="stat-card border-l-4 border-l-indigo-500 flex flex-col min-h-0"
            style={routeCardHeight ? { height: `${routeCardHeight}px` } : undefined}
          >
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-700">Route Intelligence</h3>
              {routeIntelligence?.source && routeIntelligence.source.includes('heuristic') && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                  Fallback
                </span>
              )}
            </div>

            {routeIntelLoading ? (
              <div className="flex-1 min-h-0 flex items-center gap-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                Computing forecast-aware alternatives...
              </div>
            ) : routeIntelligence?.recommendedRoute ? (
              <div className="space-y-3 flex-1 min-h-0 lg:overflow-y-auto lg:pr-1">
                <p className="text-sm text-slate-600">{routeIntelligence.summary}</p>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Recommended</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(shipment.origin)}&destination=${encodeURIComponent(shipment.destination)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" /> View on map
                    </a>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{routeIntelligence.recommendedRoute.name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {routeIntelligence.recommendedRoute.distanceKm} km • {routeIntelligence.recommendedRoute.durationMin} min
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">{routeIntelligence.recommendedRoute.recommendationReason}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Forecast Risk Horizon</p>
                  <div className="flex flex-wrap gap-2">
                    {routeIntelligence.horizonRisk?.map((risk) => (
                      <span
                        key={risk.horizonHours}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                          risk.riskScore >= 75
                            ? 'bg-red-100 text-red-700'
                            : risk.riskScore >= 50
                            ? 'bg-orange-100 text-orange-700'
                            : risk.riskScore >= 30
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {risk.horizonHours}h: {risk.riskScore}%
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Alternative Paths</p>
                  <div className="space-y-2">
                    {(routeIntelligence.alternatives || []).slice(0, 3).map((route) => (
                      <div key={route.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-700">{route.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase">{route.source}</span>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(shipment.origin)}&destination=${encodeURIComponent(shipment.destination)}&waypoints=${encodeURIComponent(route.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[10px] text-indigo-500 hover:text-indigo-700"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Map
                            </a>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {route.distanceKm} km • {route.durationMin} min • fuel impact {route.fuelImpactPercent}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Route className="w-5 h-5 text-indigo-300" />
                </div>
                <p className="text-sm text-slate-400">No route alternatives available for this shipment yet.</p>
                <p className="text-xs text-slate-300">Route intelligence will appear once forecast data is available.</p>
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <motion.div
            ref={aiCardRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card border-l-4 border-l-brand-500"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-700">AI Recommendations</h3>
            </div>
            {recommendations.length === 0 ? (
              <p className="text-sm text-slate-400">No interventions needed at this time.</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, i) => {
                  const IconComp = interventionIcons[rec.icon] || Zap;
                  const impactColors = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50' };
                  return (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <IconComp className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{rec.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${impactColors[rec.impact] || impactColors.medium}`}>
                              Impact: {rec.impact}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {rec.timeToImplement}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* ── Bottom row: Weather + Traffic spanning full width ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Weather Card */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Weather at Destination</h3>
            {weather?.isMock && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                Mock
              </span>
            )}
          </div>
          {(() => {
            const temp    = weather ? weather.temperature   : (shipment.weather?.temperature ?? 20);
            const desc    = weather ? (weather.description || weather.condition) : (shipment.weather?.condition || 'Unknown');
            const city    = weather ? weather.city          : shipment.destination?.split(',')[0];
            const country = weather ? weather.country       : '';
            const wind    = weather ? weather.windSpeed     : (shipment.weather?.windSpeed ?? 0);
            const vis     = weather ? weather.visibility    : (shipment.weather?.visibility ?? 10);
            const hum     = weather ? weather.humidity      : (shipment.weather?.humidity ?? 50);
            return (
              <div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-4xl font-bold text-slate-800 leading-none">{temp}°C</p>
                    <p className="text-sm text-slate-500 capitalize mt-1">{desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-slate-700">{city}</p>
                    {country && <p className="text-xs text-slate-400">{country}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <Wind className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold text-slate-700">{wind} km/h</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Wind</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <Eye className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold text-slate-700">{vis} km</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Visibility</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <Thermometer className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold text-slate-700">{hum}%</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Humidity</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Traffic & Port Status */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Traffic & Port Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Traffic</p>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                shipment.traffic?.congestion === 'severe'   ? 'bg-red-100 text-red-700' :
                shipment.traffic?.congestion === 'high'     ? 'bg-orange-100 text-orange-700' :
                shipment.traffic?.congestion === 'moderate' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                {shipment.traffic?.congestion || 'low'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Incidents</p>
              <p className="text-lg font-bold text-slate-700">{shipment.traffic?.incidents ?? 0}</p>
            </div>

            {shipment.port ? (
              <>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Port Congestion</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    shipment.port.congestion === 'critical' ? 'bg-red-100 text-red-700' :
                    shipment.port.congestion === 'high'     ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {shipment.port.congestion}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Port Wait Time</p>
                  <p className="text-lg font-bold text-slate-700">{shipment.port.waitTime}h</p>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-xs text-slate-400">No port data for this route</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
