// ShipGuard AI - Intervention Recommendation Engine

const INTERVENTIONS = [
  {
    id: 'reroute',
    name: 'Reroute Shipment',
    icon: 'Route',
    description: 'Redirect shipment through alternative route to avoid delays',
    applicableWhen: (pred, ship) => pred.factorScores?.weather > 40 || pred.factorScores?.traffic > 50,
    impact: 'high',
    costImpact: 'medium',
    timeToImplement: '2-4 hours',
    priority: (pred) => pred.factorScores?.weather > 60 || pred.factorScores?.traffic > 70 ? 1 : 3,
  },
  {
    id: 'alt_carrier',
    name: 'Assign Alternative Carrier',
    icon: 'Truck',
    description: 'Switch to a more reliable carrier for this shipment',
    applicableWhen: (pred, ship) => pred.factorScores?.carrierReliability > 25,
    impact: 'high',
    costImpact: 'high',
    timeToImplement: '4-8 hours',
    priority: (pred) => pred.factorScores?.carrierReliability > 40 ? 1 : 4,
  },
  {
    id: 'pre_alert',
    name: 'Send Pre-Alert to Customer',
    icon: 'Bell',
    description: 'Notify customer about potential delay and revised ETA',
    applicableWhen: (pred) => pred.riskScore >= 40,
    impact: 'medium',
    costImpact: 'none',
    timeToImplement: 'Immediate',
    priority: (pred) => pred.riskScore >= 60 ? 1 : 2,
  },
  {
    id: 'expedite',
    name: 'Expedite Processing',
    icon: 'Zap',
    description: 'Request priority handling at warehouses and transit hubs',
    applicableWhen: (pred, ship) => pred.factorScores?.portCongestion > 30 || pred.factorScores?.routeComplexity > 40,
    impact: 'medium',
    costImpact: 'medium',
    timeToImplement: '1-2 hours',
    priority: (pred) => pred.factorScores?.portCongestion > 50 ? 1 : 3,
  },
  {
    id: 'contact_carrier',
    name: 'Contact Carrier for Priority',
    icon: 'Phone',
    description: 'Escalate with carrier to prioritize this shipment',
    applicableWhen: (pred) => pred.riskScore >= 50,
    impact: 'medium',
    costImpact: 'low',
    timeToImplement: '30 minutes',
    priority: (pred) => pred.riskScore >= 70 ? 1 : 3,
  },
  {
    id: 'buffer_stock',
    name: 'Activate Buffer Stock',
    icon: 'Package',
    description: 'Release buffer inventory to prevent customer impact',
    applicableWhen: (pred) => pred.riskScore >= 60 && pred.estimatedDelay > 12,
    impact: 'high',
    costImpact: 'medium',
    timeToImplement: '1-3 hours',
    priority: (pred) => pred.estimatedDelay > 24 ? 1 : 2,
  },
  {
    id: 'split_shipment',
    name: 'Split Shipment',
    icon: 'GitBranch',
    description: 'Split into multiple shipments via different routes/carriers',
    applicableWhen: (pred, ship) => pred.riskScore >= 65 && (ship?.items > 1 || ship?.weight > 1000),
    impact: 'high',
    costImpact: 'high',
    timeToImplement: '4-6 hours',
    priority: () => 4,
  },
  {
    id: 'customs_pre_clear',
    name: 'Pre-Clear Customs',
    icon: 'FileCheck',
    description: 'Submit customs documentation early to avoid clearance delays',
    applicableWhen: (pred, ship) => ship?.route?.customsClearance && pred.factorScores?.routeComplexity > 30,
    impact: 'medium',
    costImpact: 'low',
    timeToImplement: '2-4 hours',
    priority: (pred) => pred.factorScores?.routeComplexity > 50 ? 2 : 4,
  },
];

export function getRecommendations(prediction, shipment = {}) {
  const applicable = INTERVENTIONS
    .filter(i => {
      try { return i.applicableWhen(prediction, shipment); }
      catch { return false; }
    })
    .map(i => ({
      ...i,
      priorityScore: typeof i.priority === 'function' ? i.priority(prediction) : 3,
      applicableWhen: undefined,
      priority: undefined,
    }))
    .sort((a, b) => a.priorityScore - b.priorityScore);

  return applicable.slice(0, 5);
}

export function getUrgencyLabel(riskScore) {
  if (riskScore >= 75) return { label: 'Immediate Action Required', color: 'text-red-600', bg: 'bg-red-50' };
  if (riskScore >= 50) return { label: 'Action Recommended', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (riskScore >= 30) return { label: 'Monitor Closely', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { label: 'On Track', color: 'text-green-600', bg: 'bg-green-50' };
}
