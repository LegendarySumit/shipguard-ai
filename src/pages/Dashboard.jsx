import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, AlertTriangle, TrendingUp, Clock, Shield, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight, Zap, Eye,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { getShipments, getAlerts, getRouteRecommendations, subscribeToShipments, subscribeToAlerts, subscribeToRouteRecommendations, upsertRouteRecommendationForShipment, getDailyShipmentAggregates } from '../services/firestoreService';
import { predictDelay } from '../lib/ml/delayPredictor';
import { buildRouteIntelligence } from '../services/routeIntelligenceService';
import toast from 'react-hot-toast';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

function toJsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildLocalTrendData(shipments, days = 7) {
  const safeDays = Math.max(1, days);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));

  const rows = [];
  const rowsByKey = new Map();
  for (let i = 0; i < safeDays; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = dateKey(day);
    const row = {
      date: day.toLocaleDateString('en-US', { weekday: 'short' }),
      shipments: 0,
      atRisk: 0,
    };
    rows.push(row);
    rowsByKey.set(key, row);
  }

  shipments.forEach((shipment) => {
    const sourceDate = toJsDate(shipment.createdAt) || toJsDate(shipment.departureDate) || toJsDate(shipment.eta);
    if (!sourceDate) return;
    const row = rowsByKey.get(dateKey(sourceDate));
    if (!row) return;
    row.shipments += 1;
    if ((shipment.riskScore || 0) >= 50) row.atRisk += 1;
  });

  return rows;
}

function decorateShipments(shipments) {
  return shipments.map((shipment) => {
    const pred = predictDelay(shipment);
    return {
      ...shipment,
      riskScore: pred.riskScore,
      riskLevel: pred.riskLevel,
      riskColor: pred.riskColor,
      estimatedDelay: pred.estimatedDelay,
      prediction: pred,
    };
  });
}

function hasRouteContext(shipment) {
  const origin = String(shipment?.origin || '').trim();
  const destination = String(shipment?.destination || '').trim();
  return Boolean(origin && destination);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [routeRecommendations, setRouteRecommendations] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getShipments();
        let alertData = await getAlerts({ limit: 20 });
        const processed = decorateShipments(data);
        setShipments(processed);
        setAlerts(alertData);

        let routeRecs = await getRouteRecommendations({ status: 'active', limit: 8 });
        if (!routeRecs.length && processed.length) {
          const candidates = [...processed]
            .filter((s) => hasRouteContext(s))
            .filter((s) => s.riskScore >= 50)
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 3);

          await Promise.allSettled(
            candidates.map(async (shipment) => {
              const intelligence = await buildRouteIntelligence(shipment);
              if (intelligence?.recommendedRoute) {
                await upsertRouteRecommendationForShipment(shipment, intelligence, shipment.prediction);
              }
            })
          );

          routeRecs = await getRouteRecommendations({ status: 'active', limit: 8 });
        }

        setRouteRecommendations(routeRecs);

        const aggregateTrend = await getDailyShipmentAggregates({ days: 7, atRiskThreshold: 50 });
        if (aggregateTrend.some((row) => row.shipments > 0)) {
          setTrendData(aggregateTrend);
        } else {
          setTrendData(buildLocalTrendData(processed, 7));
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
        toast.error('Unable to load live dashboard data');
        setShipments([]);
        setAlerts([]);
        setRouteRecommendations([]);
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;

    const unsubShipments = subscribeToShipments(async (docs) => {
      const processed = decorateShipments(docs);
      setShipments(processed);

      try {
        const aggregateTrend = await getDailyShipmentAggregates({ days: 7, atRiskThreshold: 50 });
        setTrendData(aggregateTrend.some((row) => row.shipments > 0) ? aggregateTrend : buildLocalTrendData(processed, 7));
      } catch (e) {
        console.warn('Dashboard trend refresh failed:', e.message);
        setTrendData(buildLocalTrendData(processed, 7));
      }
    });

    const unsubAlerts = subscribeToAlerts((docs) => {
      setAlerts(docs);
    }, { limit: 20 });

    return () => {
      unsubShipments();
      unsubAlerts();
    };
  }, [loading]);

  // Real-time subscription for route recommendations — starts after initial bootstrap
  useEffect(() => {
    if (loading) return;
    const unsub = subscribeToRouteRecommendations(
      (recs) => setRouteRecommendations(recs),
      { status: 'active', limit: 8 }
    );
    return () => unsub();
  }, [loading]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const critical = shipments.filter(s => s.riskLevel === 'critical').length;
    const high = shipments.filter(s => s.riskLevel === 'high').length;
    const atRisk = shipments.filter(s => s.riskScore >= 50).length;
    const onTrack = shipments.filter(s => s.riskLevel === 'low').length;
    const avgRisk = total > 0 ? Math.round(shipments.reduce((a, s) => a + s.riskScore, 0) / total) : 0;
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    return { total, critical, high, atRisk, onTrack, avgRisk, activeAlerts };
  }, [shipments, alerts]);

  const riskDistribution = useMemo(() => [
    { name: 'Critical', value: shipments.filter(s => s.riskLevel === 'critical').length, color: '#ef4444' },
    { name: 'High', value: shipments.filter(s => s.riskLevel === 'high').length, color: '#f97316' },
    { name: 'Medium', value: shipments.filter(s => s.riskLevel === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: shipments.filter(s => s.riskLevel === 'low').length, color: '#22c55e' },
  ], [shipments]);

  const topRiskShipments = useMemo(() => {
    const sorted = [...shipments].sort((a, b) => b.riskScore - a.riskScore);
    const routeReady = sorted.filter((s) => hasRouteContext(s));

    const activeAlertShipmentIds = new Set(
      alerts
        .filter((a) => a.status === 'active')
        .flatMap((a) => [a.shipmentId, a.trackingId])
        .filter(Boolean)
        .map((id) => String(id))
    );

    const prioritized = routeReady.filter(
      (s) => activeAlertShipmentIds.has(String(s.id)) || activeAlertShipmentIds.has(String(s.trackingId))
    );

    const prioritizedKeys = new Set(prioritized.map((s) => String(s.id || s.trackingId)));
    const remaining = routeReady.filter((s) => !prioritizedKeys.has(String(s.id || s.trackingId)));
    const merged = [...prioritized, ...remaining];

    // Fallback to risk-sorted rows if route-ready data is unavailable.
    return (merged.length ? merged : sorted).slice(0, 6);
  }, [shipments, alerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Analyzing shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Command Center</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">AI-powered shipment delay risk overview</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> System Online
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div {...fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
            </div>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-green-600">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs sm:text-sm text-slate-500">Total Shipments</p>
        </div>

        <div className="stat-card p-4 sm:p-6 border-l-4 border-l-red-400">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-red-600">
              <ArrowUpRight className="w-3 h-3" /> {stats.critical + stats.high}
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.atRisk}</p>
          <p className="text-xs sm:text-sm text-slate-500">At Risk</p>
        </div>

        <div className="stat-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <span className={`text-[10px] sm:text-xs font-medium ${stats.avgRisk >= 50 ? 'text-red-600' : stats.avgRisk >= 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {stats.avgRisk >= 50 ? 'High' : stats.avgRisk >= 30 ? 'Moderate' : 'Healthy'}
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.avgRisk}%</p>
          <p className="text-xs sm:text-sm text-slate-500">Avg Risk Score</p>
        </div>

        <div className="stat-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-green-600">
              <ArrowDownRight className="w-3 h-3" /> -8%
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-800">{stats.onTrack}</p>
          <p className="text-xs sm:text-sm text-slate-500">On Track</p>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Risk Distribution Pie */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Distribution</h3>
          <div className="h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {riskDistribution.map(r => (
              <div key={r.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-xs text-slate-500">{r.name} ({r.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shipment Trend */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="stat-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Shipment Volume & Risk Trend</h3>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="shipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="shipments" stroke="#6366f1" fill="url(#shipGrad)" strokeWidth={2} name="Shipments" />
                <Area type="monotone" dataKey="atRisk" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2} name="At Risk" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Top Risk Shipments */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="lg:col-span-3 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Highest Risk Shipments</h3>
            <button onClick={() => navigate('/shipments')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {topRiskShipments.map((s, i) => (
              <div
                key={s.trackingId || i}
                onClick={() => navigate(`/shipments/${s.id || s.trackingId}`)}
                className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: s.riskColor }}>
                  {s.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 font-mono">{s.trackingId}</p>
                    <span className={`badge-${s.riskLevel} hidden sm:inline-flex`}>{s.riskLevel}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{s.origin?.split(',')[0]} → {s.destination?.split(',')[0]}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">{s.carrier}</p>
                  <p className="text-xs text-slate-400">{s.estimatedDelay > 0 ? `~${s.estimatedDelay}h delay` : 'On time'}</p>
                </div>
                <Eye className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors hidden sm:block" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Active Alerts</h3>
            <button onClick={() => navigate('/alerts')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {alerts.filter(a => a.status === 'active').length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Shield className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {alerts.filter(a => a.status === 'active').slice(0, 8).map((a, i) => {
                const severityColors = {
                  critical: 'border-l-red-500 bg-red-50/50',
                  high: 'border-l-orange-500 bg-orange-50/50',
                  medium: 'border-l-amber-500 bg-amber-50/50',
                  low: 'border-l-green-500 bg-green-50/50',
                };
                return (
                  <div key={a.id || i} className={`p-3 rounded-xl border-l-4 ${severityColors[a.severity] || severityColors.medium}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{a.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{a.message}</p>
                      </div>
                      <span className={`badge-${a.severity} flex-shrink-0`}>{a.severity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {routeRecommendations.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Route Alternatives Suggested for Operators</h3>
            <span className="text-xs text-slate-500">{routeRecommendations.length} active</span>
          </div>
          <div className="space-y-2">
            {routeRecommendations.slice(0, 5).map((rec) => (
              <button
                key={rec.id}
                onClick={() => navigate(`/shipments/${rec.shipmentId}`)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {rec.trackingId || rec.shipmentId}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {rec.origin} → {rec.destination}
                    </p>
                    <p className="text-xs text-brand-700 mt-1 truncate">
                      {rec.recommendedRoute?.recommendationReason || rec.summary}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">Weather Risk</p>
                    <p className="text-sm font-bold text-slate-700">{rec.weatherRiskScore || 0}%</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
