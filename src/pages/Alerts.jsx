import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Bell, BellOff, CheckCircle2, Clock, Filter,
  ChevronDown, ChevronUp, Search, Shield, X, Eye, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlerts, subscribeToAlerts, acknowledgeAlert, resolveAlert } from '../services/firestoreService';
import toast from 'react-hot-toast';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlerts();
        setAlerts(data);
      } catch (e) {
        console.error('Alerts load failed:', e);
        toast.error('Unable to load live alerts');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const unsub = subscribeToAlerts((docs) => {
      setAlerts(docs);
    });
    return () => unsub();
  }, [loading]);

  const filtered = useMemo(() => {
    let result = [...alerts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) ||
        a.shipmentId?.toLowerCase().includes(q)
      );
    }
    if (filterSeverity !== 'all') result = result.filter(a => a.severity === filterSeverity);
    if (filterStatus !== 'all') result = result.filter(a => a.status === filterStatus);
    if (filterType !== 'all') result = result.filter(a => a.type === filterType);
    return result;
  }, [alerts, search, filterSeverity, filterStatus, filterType]);

  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
  }), [alerts]);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' } : a));
      toast.success('Alert acknowledged');
    } catch (e) {
      console.error('Acknowledge failed:', e);
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId, 'Resolved by user');
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
      toast.success('Alert resolved');
    } catch (e) {
      console.error('Resolve failed:', e);
      toast.error('Failed to resolve alert');
    }
  };

  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', badge: 'badge-critical', ringColor: 'ring-red-500' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', badge: 'badge-high', ringColor: 'ring-orange-500' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'badge-medium', ringColor: 'ring-amber-500' },
    low: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', badge: 'badge-low', ringColor: 'ring-green-500' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Alerts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor and manage shipment warning alerts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.active}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.acknowledged}</p>
              <p className="text-xs text-slate-500">Acknowledged</p>
            </div>
          </div>
        </div>
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.resolved}</p>
              <p className="text-xs text-slate-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.critical}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center justify-center gap-2 text-sm w-full sm:w-auto ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Severity</label>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All</option>
                  <option value="sla_breach_imminent">SLA Breach</option>
                  <option value="delay_predicted">Delay Predicted</option>
                  <option value="weather_warning">Weather Warning</option>
                  <option value="route_alternative">Route Alternative</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BellOff className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No alerts found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filtered.map((alert, i) => {
            const config = severityConfig[alert.severity] || severityConfig.medium;
            const isActive = alert.status === 'active';
            const isAcknowledged = alert.status === 'acknowledged';
            return (
              <motion.div
                key={alert.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-4 rounded-2xl border ${config.border} ${config.bg} ${isActive ? 'ring-1 ' + config.ringColor + '/30' : ''} transition-all`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <AlertTriangle className={`w-5 h-5 ${config.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-slate-800">{alert.title}</h4>
                          <span className={config.badge}>{alert.severity}</span>
                          <span className={`badge ${
                            alert.status === 'active' ? 'bg-red-100 text-red-700' :
                            alert.status === 'acknowledged' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>{alert.status}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {alert.shipmentId && (
                            <button
                              onClick={() => navigate(`/shipments/${alert.shipmentId}`)}
                              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {alert.shipmentId}
                            </button>
                          )}
                          {alert.carrier && (
                            <span className="text-xs text-slate-500">Carrier: {alert.carrier}</span>
                          )}
                          {alert.riskScore && (
                            <span className="text-xs text-slate-500">Risk: {alert.riskScore}%</span>
                          )}
                          {alert.createdAt && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alert.createdAt.seconds ? alert.createdAt.seconds * 1000 : alert.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto mt-3 sm:mt-0">
                        {isActive && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex-1 sm:flex-none"
                          >
                            Acknowledge
                          </button>
                        )}
                        {(isActive || isAcknowledged) && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex-1 sm:flex-none"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
