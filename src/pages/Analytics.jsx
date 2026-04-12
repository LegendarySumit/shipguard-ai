import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Package, AlertTriangle,
  Clock, CheckCircle2, Truck, ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { getShipments, subscribeToShipments, getDailyShipmentAggregates } from '../services/firestoreService';
import { predictDelay } from '../lib/ml/delayPredictor';
import { getLogisticsNews } from '../lib/api/newsApi';
import toast from 'react-hot-toast';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'];

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

function buildLocalWeeklyTrend(shipments, days = 7) {
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
      total: 0,
      delayed: 0,
      onTime: 0,
      riskAvg: 0,
      riskTotal: 0,
      riskCount: 0,
    };
    rows.push(row);
    rowsByKey.set(key, row);
  }

  shipments.forEach((shipment) => {
    const sourceDate = toJsDate(shipment.createdAt) || toJsDate(shipment.departureDate) || toJsDate(shipment.eta);
    if (!sourceDate) return;
    const row = rowsByKey.get(dateKey(sourceDate));
    if (!row) return;

    const risk = Number(shipment.riskScore) || 0;
    const delayed = Boolean(shipment.isDelayed);
    row.total += 1;
    row.delayed += delayed ? 1 : 0;
    row.onTime += delayed ? 0 : 1;
    if (risk > 0) {
      row.riskTotal += risk;
      row.riskCount += 1;
    }
  });

  return rows.map((row) => ({
    date: row.date,
    total: row.total,
    delayed: row.delayed,
    onTime: row.onTime,
    riskAvg: row.riskCount > 0 ? Math.round(row.riskTotal / row.riskCount) : 0,
  }));
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

export default function Analytics() {
  const [shipments, setShipments] = useState([]);
  const [news, setNews] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    async function load() {
      try {
        const data = await getShipments();
        const processed = decorateShipments(data);
        setShipments(processed);

        const aggregateTrend = await getDailyShipmentAggregates({ days: 7, atRiskThreshold: 60 });
        if (aggregateTrend.some((row) => row.shipments > 0)) {
          setWeeklyTrend(
            aggregateTrend.map((row) => ({
              date: row.date,
              total: row.shipments,
              delayed: row.delayed,
              onTime: Math.max(0, row.shipments - row.delayed),
              riskAvg: row.riskAvg,
            }))
          );
        } else {
          setWeeklyTrend(buildLocalWeeklyTrend(processed, 7));
        }

        const newsData = await getLogisticsNews();
        setNews(newsData);
      } catch (e) {
        console.error('Analytics load failed:', e);
        toast.error('Unable to load live analytics data');
        setShipments([]);
        setWeeklyTrend([]);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const unsub = subscribeToShipments(async (docs) => {
      const processed = decorateShipments(docs);
      setShipments(processed);

      try {
        const aggregateTrend = await getDailyShipmentAggregates({ days: 7, atRiskThreshold: 60 });
        setWeeklyTrend(
          aggregateTrend.some((row) => row.shipments > 0)
            ? aggregateTrend.map((row) => ({
                date: row.date,
                total: row.shipments,
                delayed: row.delayed,
                onTime: Math.max(0, row.shipments - row.delayed),
                riskAvg: row.riskAvg,
              }))
            : buildLocalWeeklyTrend(processed, 7)
        );
      } catch (e) {
        console.warn('Analytics trend refresh failed:', e.message);
        setWeeklyTrend(buildLocalWeeklyTrend(processed, 7));
      }
    });
    return () => unsub();
  }, [loading]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const delayed = shipments.filter(s => s.isDelayed || s.riskScore >= 60).length;
    const onTime = total - delayed;
    const avgDelay = total > 0 ? Math.round(shipments.reduce((a, s) => a + (s.estimatedDelay || 0), 0) / total) : 0;
    const slaAtRisk = shipments.filter(s => s.riskScore >= 75).length;
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;
    return { total, delayed, onTime, avgDelay, slaAtRisk, onTimeRate };
  }, [shipments]);

  const carrierData = useMemo(() => {
    const carriers = [...new Set(shipments.map(s => s.carrier))];
    return carriers.map(c => {
      const cs = shipments.filter(s => s.carrier === c);
      const onTime = cs.filter(s => !s.isDelayed && s.riskScore < 60).length;
      return {
        carrier: c.length > 12 ? c.substring(0, 10) + '..' : c,
        fullName: c,
        total: cs.length,
        onTime,
        delayed: cs.length - onTime,
        onTimeRate: cs.length > 0 ? Math.round((onTime / cs.length) * 100) : 0,
        avgRisk: cs.length > 0 ? Math.round(cs.reduce((a, s) => a + s.riskScore, 0) / cs.length) : 0,
      };
    }).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [shipments]);

  const riskDistribution = useMemo(() => [
    { name: 'Critical', value: shipments.filter(s => s.riskLevel === 'critical').length, color: '#ef4444' },
    { name: 'High', value: shipments.filter(s => s.riskLevel === 'high').length, color: '#f97316' },
    { name: 'Medium', value: shipments.filter(s => s.riskLevel === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: shipments.filter(s => s.riskLevel === 'low').length, color: '#22c55e' },
  ], [shipments]);

  const modeData = useMemo(() => {
    const modes = [...new Set(shipments.map(s => s.mode))];
    return modes.map(m => {
      const ms = shipments.filter(s => s.mode === m);
      return {
        mode: m.charAt(0).toUpperCase() + m.slice(1),
        count: ms.length,
        avgRisk: ms.length > 0 ? Math.round(ms.reduce((a, s) => a + s.riskScore, 0) / ms.length) : 0,
        avgDelay: ms.length > 0 ? Math.round(ms.reduce((a, s) => a + (s.estimatedDelay || 0), 0) / ms.length) : 0,
      };
    });
  }, [shipments]);

  const routeData = useMemo(() => {
    const routes = {};
    shipments.forEach(s => {
      const key = `${s.origin?.split(',')[0]} → ${s.destination?.split(',')[0]}`;
      if (!routes[key]) routes[key] = { route: key, count: 0, totalRisk: 0, delayed: 0 };
      routes[key].count++;
      routes[key].totalRisk += s.riskScore;
      if (s.isDelayed || s.riskScore >= 60) routes[key].delayed++;
    });
    return Object.values(routes)
      .map(r => ({ ...r, avgRisk: Math.round(r.totalRisk / r.count) }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 6);
  }, [shipments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Generating analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Shipment performance and risk analytics</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 w-full sm:w-auto overflow-x-auto">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                timeRange === range ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card py-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-brand-500" />
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stat-card py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.onTimeRate}%</p>
              <p className="text-xs text-slate-500">On-Time Rate</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.delayed}</p>
              <p className="text-xs text-slate-500">Delayed</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card py-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.avgDelay}h</p>
              <p className="text-xs text-slate-500">Avg Delay</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card py-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.slaAtRisk}</p>
              <p className="text-xs text-slate-500">SLA at Risk</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="stat-card py-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-xl font-bold text-slate-800">{news.length}</p>
              <p className="text-xs text-slate-500">News Alerts</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Weekly Delivery Trend</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#gradTotal)" strokeWidth={2} name="Total" />
                <Area type="monotone" dataKey="delayed" stroke="#ef4444" fill="url(#gradDelayed)" strokeWidth={2} name="Delayed" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Pie */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {riskDistribution.map(r => (
              <div key={r.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-slate-500">{r.name}</span>
                <span className="font-semibold text-slate-700 ml-auto">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Carrier Performance */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Carrier Performance</h3>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="carrier" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="onTime" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="On Time" />
                <Bar dataKey="delayed" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="Delayed" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transport Mode Analysis */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Transport Mode Analysis</h3>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={78} data={modeData}>
                <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="mode" tick={{ fontSize: 12, fill: '#64748b' }} />
                <Radar name="Avg Risk" dataKey="avgRisk" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Shipments" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
                <Legend />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* High-Risk Routes */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Highest Risk Routes</h3>
          <div className="space-y-3">
            {routeData.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{r.route}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.avgRisk}%`,
                          backgroundColor: r.avgRisk >= 60 ? '#ef4444' : r.avgRisk >= 40 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{r.avgRisk}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{r.count} shipments</p>
                  <p className="text-xs text-red-500">{r.delayed} delayed</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disruption News Feed */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Supply Chain Disruption Feed</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {news.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No disruption news available</p>
            ) : (
              news.map((item, i) => {
                const severityColors = {
                  critical: 'border-l-red-500', high: 'border-l-orange-500',
                  moderate: 'border-l-amber-500', low: 'border-l-green-500',
                };
                return (
                  <div key={i} className={`p-3 rounded-xl bg-slate-50 border-l-4 ${severityColors[item.severity] || severityColors.low}`}>
                    <p className="text-sm font-medium text-slate-700 line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">{item.source}</span>
                      {item.isMock && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                          Mock
                        </span>
                      )}
                      <span className={`badge-${item.severity === 'moderate' ? 'medium' : item.severity}`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
