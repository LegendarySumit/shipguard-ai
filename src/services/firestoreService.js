import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

function toJsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initTrendBuckets(days) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = [];
  const byKey = new Map();

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = dayKey(date);
    const row = {
      key,
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      shipments: 0,
      atRisk: 0,
      delayed: 0,
      riskTotal: 0,
      riskCount: 0,
    };
    buckets.push(row);
    byKey.set(key, row);
  }

  return { start, buckets, byKey };
}

export async function getDailyShipmentAggregates(options = {}) {
  const days = Math.max(1, Math.min(90, Number(options.days) || 7));
  const atRiskThreshold = Number(options.atRiskThreshold) || 50;
  const { start, buckets, byKey } = initTrendBuckets(days);

  const q = query(
    collection(db, 'shipments'),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    orderBy('createdAt', 'asc')
  );

  const snap = await getDocs(q);
  snap.docs.forEach((d) => {
    const shipment = d.data();
    const createdAt = toJsDate(shipment.createdAt);
    if (!createdAt) return;

    const bucket = byKey.get(dayKey(createdAt));
    if (!bucket) return;

    const risk = Number(shipment.riskScore) || 0;
    bucket.shipments += 1;
    if (risk >= atRiskThreshold) bucket.atRisk += 1;
    if (shipment.isDelayed) bucket.delayed += 1;
    if (risk > 0) {
      bucket.riskTotal += risk;
      bucket.riskCount += 1;
    }
  });

  return buckets.map((row) => ({
    date: row.date,
    shipments: row.shipments,
    atRisk: row.atRisk,
    delayed: row.delayed,
    riskAvg: row.riskCount > 0 ? Math.round(row.riskTotal / row.riskCount) : 0,
  }));
}

// ─── Shipments ───
export async function getShipments(filters = {}) {
  let q = collection(db, 'shipments');
  const constraints = [];
  if (filters.status) constraints.push(where('status', '==', filters.status));
  if (filters.riskLevel) constraints.push(where('riskLevel', '==', filters.riskLevel));
  if (filters.carrier) constraints.push(where('carrier', '==', filters.carrier));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters.limit) constraints.push(limit(filters.limit));
  q = query(q, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getShipmentById(id) {
  const snap = await getDoc(doc(db, 'shipments', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addShipment(data) {
  return addDoc(collection(db, 'shipments'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateShipment(id, data) {
  return updateDoc(doc(db, 'shipments', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteShipment(id) {
  return deleteDoc(doc(db, 'shipments', id));
}

export function subscribeToShipments(callback, filters = {}) {
  let q = collection(db, 'shipments');
  const constraints = [];
  if (filters.status) constraints.push(where('status', '==', filters.status));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters.limit) constraints.push(limit(filters.limit));
  q = query(q, ...constraints);
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

// ─── Alerts ───
export async function getAlerts(filters = {}) {
  let q = collection(db, 'alerts');
  const constraints = [];
  if (filters.severity) constraints.push(where('severity', '==', filters.severity));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  if (filters.shipmentId) constraints.push(where('shipmentId', '==', filters.shipmentId));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters.limit) constraints.push(limit(filters.limit));
  q = query(q, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAlert(data) {
  return addDoc(collection(db, 'alerts'), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

export async function updateAlert(id, data) {
  return updateDoc(doc(db, 'alerts', id), { ...data, updatedAt: serverTimestamp() });
}

export async function acknowledgeAlert(id) {
  return updateDoc(doc(db, 'alerts', id), {
    status: 'acknowledged',
    acknowledgedAt: serverTimestamp(),
  });
}

export async function resolveAlert(id, resolution) {
  return updateDoc(doc(db, 'alerts', id), {
    status: 'resolved',
    resolution,
    resolvedAt: serverTimestamp(),
  });
}

export function subscribeToAlerts(callback, filters = {}) {
  let q = collection(db, 'alerts');
  const constraints = [];
  if (filters.severity) constraints.push(where('severity', '==', filters.severity));
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters.limit) constraints.push(limit(filters.limit));
  q = query(q, ...constraints);
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

// ─── Interventions / Recommendations ───
export async function getInterventions(shipmentId) {
  const q = query(
    collection(db, 'interventions'),
    where('shipmentId', '==', shipmentId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addIntervention(data) {
  return addDoc(collection(db, 'interventions'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function updateIntervention(id, data) {
  return updateDoc(doc(db, 'interventions', id), { ...data, updatedAt: serverTimestamp() });
}

// ─── Route Intelligence Recommendations ───
export async function getRouteRecommendations(filters = {}) {
  let qRef = collection(db, 'routeRecommendations');
  const constraints = [];
  if (filters.shipmentId) constraints.push(where('shipmentId', '==', filters.shipmentId));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  if (filters.limit) constraints.push(limit(filters.limit));
  if (constraints.length) qRef = query(qRef, ...constraints);
  const snap = await getDocs(qRef);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => {
    const at = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
    const bt = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
    return bt - at;
  });
}

export function subscribeToRouteRecommendations(callback, filters = {}) {
  let qRef = collection(db, 'routeRecommendations');
  const constraints = [];
  if (filters.shipmentId) constraints.push(where('shipmentId', '==', filters.shipmentId));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  if (filters.limit) constraints.push(limit(filters.limit));
  if (constraints.length) qRef = query(qRef, ...constraints);

  return onSnapshot(qRef, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => {
      const at = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bt = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bt - at;
    });
    callback(rows);
  });
}

export async function upsertRouteRecommendationForShipment(shipment, intelligence, prediction = null) {
  if (!shipment || !intelligence?.recommendedRoute) return null;

  const shipmentId = shipment.id || shipment.trackingId;
  const recommendation = {
    shipmentId,
    trackingId: shipment.trackingId || shipment.id,
    status: 'active',
    mode: shipment.mode || 'road',
    origin: shipment.origin,
    destination: shipment.destination,
    currentRiskScore: prediction?.riskScore || shipment.riskScore || intelligence.overallWeatherRisk || 0,
    weatherRiskScore: intelligence.overallWeatherRisk || 0,
    recommendedRoute: intelligence.recommendedRoute,
    alternatives: intelligence.alternatives || [],
    summary: intelligence.summary || 'Alternative route available.',
    source: intelligence.source || 'route-intelligence',
    generatedAt: intelligence.generatedAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };

  const qExisting = query(collection(db, 'routeRecommendations'), where('shipmentId', '==', shipmentId), limit(1));
  const snap = await getDocs(qExisting);

  let recommendationId;
  if (!snap.empty) {
    recommendationId = snap.docs[0].id;
    await updateDoc(doc(db, 'routeRecommendations', recommendationId), recommendation);
  } else {
    const ref = await addDoc(collection(db, 'routeRecommendations'), {
      ...recommendation,
      createdAt: serverTimestamp(),
    });
    recommendationId = ref.id;
  }

  const severity = recommendation.weatherRiskScore >= 75
    ? 'critical'
    : recommendation.weatherRiskScore >= 50
    ? 'high'
    : recommendation.weatherRiskScore >= 30
    ? 'medium'
    : 'low';

  const routeAlertPayload = {
    shipmentId,
    type: 'route_alternative',
    severity,
    title: `Alternative route suggested: ${shipment.trackingId || shipmentId}`,
    message: recommendation.recommendedRoute?.recommendationReason || 'Alternative route available for reduced delay risk.',
    riskScore: recommendation.weatherRiskScore,
    status: 'active',
    source: 'route-intelligence',
    updatedAt: serverTimestamp(),
  };

  const qAlert = query(
    collection(db, 'alerts'),
    where('shipmentId', '==', shipmentId),
    where('type', '==', 'route_alternative'),
    limit(1)
  );
  const alertSnap = await getDocs(qAlert);
  if (!alertSnap.empty) {
    await updateDoc(doc(db, 'alerts', alertSnap.docs[0].id), routeAlertPayload);
  } else {
    await addDoc(collection(db, 'alerts'), {
      ...routeAlertPayload,
      createdAt: serverTimestamp(),
    });
  }

  return recommendationId;
}

// ─── Analytics ───
export async function getAnalyticsData() {
  const shipmentsSnap = await getDocs(collection(db, 'shipments'));
  const shipments = shipmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const alertsSnap = await getDocs(collection(db, 'alerts'));
  const alerts = alertsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const totalShipments = shipments.length;
  const atRisk = shipments.filter(s => s.riskScore >= 60).length;
  const onTime = shipments.filter(s => s.status === 'delivered' && !s.isDelayed).length;
  const delayed = shipments.filter(s => s.isDelayed).length;
  const avgRiskScore = totalShipments > 0
    ? Math.round(shipments.reduce((a, s) => a + (s.riskScore || 0), 0) / totalShipments)
    : 0;

  // Risk distribution
  const riskDistribution = [
    { name: 'Critical', value: shipments.filter(s => s.riskLevel === 'critical').length, color: '#ef4444' },
    { name: 'High', value: shipments.filter(s => s.riskLevel === 'high').length, color: '#f97316' },
    { name: 'Medium', value: shipments.filter(s => s.riskLevel === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: shipments.filter(s => s.riskLevel === 'low').length, color: '#22c55e' },
  ];

  // Carrier performance
  const carriers = [...new Set(shipments.map(s => s.carrier))];
  const carrierPerformance = carriers.map(c => {
    const cShipments = shipments.filter(s => s.carrier === c);
    const onTimeCount = cShipments.filter(s => !s.isDelayed).length;
    return {
      carrier: c,
      total: cShipments.length,
      onTime: onTimeCount,
      delayed: cShipments.length - onTimeCount,
      onTimeRate: cShipments.length > 0 ? Math.round((onTimeCount / cShipments.length) * 100) : 0,
      avgRisk: cShipments.length > 0
        ? Math.round(cShipments.reduce((a, s) => a + (s.riskScore || 0), 0) / cShipments.length)
        : 0,
    };
  });

  const dailyVolume = await getDailyShipmentAggregates({ days: 7, atRiskThreshold: 60 });

  return {
    totalShipments,
    atRisk,
    onTime,
    delayed,
    avgRiskScore,
    riskDistribution,
    carrierPerformance,
    dailyVolume,
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
  };
}

// ─── Batch seed helper ───
export async function seedShipments(shipments) {
  const batch = writeBatch(db);
  shipments.forEach((s) => {
    const ref = doc(collection(db, 'shipments'));
    batch.set(ref, { ...s, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function seedAlerts(alerts) {
  const batch = writeBatch(db);
  alerts.forEach((a) => {
    const ref = doc(collection(db, 'alerts'));
    batch.set(ref, { ...a, createdAt: serverTimestamp() });
  });
  await batch.commit();
}
