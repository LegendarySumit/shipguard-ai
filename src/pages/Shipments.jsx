import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package, Search, Filter, ChevronDown, ChevronUp, ArrowUpDown,
  Plane, Ship, Truck, Train, Shuffle, Eye, MapPin, Clock, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShipments, subscribeToShipments } from '../services/firestoreService';
import { predictDelay } from '../lib/ml/delayPredictor';
import toast from 'react-hot-toast';

const modeIcons = { air: Plane, sea: Ship, road: Truck, rail: Train, multimodal: Shuffle };

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

export default function Shipments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterCarrier, setFilterCarrier] = useState('all');
  const [sortBy, setSortBy] = useState('riskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    async function load() {
      try {
        const data = await getShipments();
        setShipments(decorateShipments(data));
      } catch (e) {
        console.error('Shipments load failed:', e);
        toast.error('Unable to load live shipments');
        setShipments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const unsub = subscribeToShipments((docs) => {
      setShipments(decorateShipments(docs));
    });
    return () => unsub();
  }, [loading]);

  const carriers = useMemo(() => [...new Set(shipments.map(s => s.carrier))].sort(), [shipments]);

  const filtered = useMemo(() => {
    let result = [...shipments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.trackingId?.toLowerCase().includes(q) ||
        s.origin?.toLowerCase().includes(q) ||
        s.destination?.toLowerCase().includes(q) ||
        s.carrier?.toLowerCase().includes(q) ||
        s.product?.toLowerCase().includes(q) ||
        s.customer?.toLowerCase().includes(q)
      );
    }
    if (filterRisk !== 'all') result = result.filter(s => s.riskLevel === filterRisk);
    if (filterStatus !== 'all') result = result.filter(s => s.status === filterStatus);
    if (filterMode !== 'all') result = result.filter(s => s.mode === filterMode);
    if (filterCarrier !== 'all') result = result.filter(s => s.carrier === filterCarrier);
    result.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [shipments, search, filterRisk, filterStatus, filterMode, filterCarrier, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterRisk, filterStatus, filterMode, filterCarrier]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Shipments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} shipments found</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tracking ID, route, carrier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Risk Level</label>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All Risks</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All Statuses</option>
                  <option value="in_transit">In Transit</option>
                  <option value="at_port">At Port</option>
                  <option value="customs_clearance">Customs</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Mode</label>
                <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All Modes</option>
                  <option value="air">Air</option>
                  <option value="sea">Sea</option>
                  <option value="road">Road</option>
                  <option value="rail">Rail</option>
                  <option value="multimodal">Multimodal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Carrier</label>
                <select value={filterCarrier} onChange={e => setFilterCarrier(e.target.value)} className="input-field text-sm py-2">
                  <option value="all">All Carriers</option>
                  {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  { key: 'trackingId', label: 'Tracking ID' },
                  { key: 'origin', label: 'Route' },
                  { key: 'carrier', label: 'Carrier' },
                  { key: 'mode', label: 'Mode' },
                  { key: 'status', label: 'Status' },
                  { key: 'riskScore', label: 'Risk' },
                  { key: 'eta', label: 'ETA' },
                  { key: 'actions', label: '', noSort: true },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => !col.noSort && toggleSort(col.key)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${!col.noSort ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {!col.noSort && sortBy === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => {
                const ModeIcon = modeIcons[s.mode] || Package;
                const statusColors = {
                  in_transit: 'bg-blue-100 text-blue-700',
                  at_port: 'bg-purple-100 text-purple-700',
                  customs_clearance: 'bg-amber-100 text-amber-700',
                  out_for_delivery: 'bg-indigo-100 text-indigo-700',
                  delivered: 'bg-green-100 text-green-700',
                  delayed: 'bg-red-100 text-red-700',
                };
                return (
                  <tr
                    key={s.trackingId || i}
                    onClick={() => navigate(`/shipments/${s.id || s.trackingId}`)}
                    className="table-row cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-700 font-mono">{s.trackingId}</span>
                      <p className="text-xs text-slate-400">{s.product}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{s.origin?.split(',')[0]}</span>
                        <span className="text-slate-300">→</span>
                        <span className="truncate max-w-[100px]">{s.destination?.split(',')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.carrier}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ModeIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 capitalize">{s.mode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[s.status] || 'bg-slate-100 text-slate-600'}`}>
                        {s.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${s.riskScore}%`, backgroundColor: s.riskColor }}
                          />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: s.riskColor }}>
                          {s.riskScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-3 h-3" />
                        {s.eta ? new Date(s.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                      {s.estimatedDelay > 0 && (
                        <p className="text-xs text-red-500 flex items-center gap-0.5 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> +{s.estimatedDelay}h
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-500">
              Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm rounded-lg ${currentPage === page ? 'bg-brand-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">No shipments found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
