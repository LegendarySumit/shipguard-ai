import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Brain, CloudLightning, Route, Bell, BarChart3, Radio,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    id: 'ai-risk',
    icon: Brain,
    title: 'AI Risk Prediction',
    headline: 'Know Before It Happens',
    desc: 'Multi-factor weighted ML model analyzes 8+ variables — weather, traffic, carrier history, port congestion, and global disruptions — to score delay probability with up to 94% accuracy.',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    lightBg: 'bg-indigo-50/80',
    visual: [
      { label: 'Weather Impact', score: 78, color: '#f59e0b' },
      { label: 'Traffic Score', score: 45, color: '#22c55e' },
      { label: 'Carrier Rating', score: 62, color: '#6366f1' },
      { label: 'Port Congestion', score: 89, color: '#ef4444' },
      { label: 'Route Risk', score: 34, color: '#06b6d4' },
      { label: 'News Disruption', score: 71, color: '#f97316' },
    ],
  },
  {
    id: 'weather',
    icon: CloudLightning,
    title: 'Weather Intelligence',
    headline: 'Route-Wide Weather Radar',
    desc: 'Real-time weather tracking along your entire shipment corridor. Automated severe weather impact scoring with dynamic route risk overlays updated every 15 minutes.',
    color: '#0ea5e9',
    gradient: 'from-sky-500 to-cyan-600',
    lightBg: 'bg-sky-50/80',
    visual: [
      { label: 'Temp (°F)', score: 42, color: '#0ea5e9' },
      { label: 'Wind Speed', score: 67, color: '#6366f1' },
      { label: 'Precipitation', score: 85, color: '#3b82f6' },
      { label: 'Visibility', score: 28, color: '#22c55e' },
      { label: 'Storm Risk', score: 73, color: '#ef4444' },
      { label: 'Snow Alert', score: 56, color: '#8b5cf6' },
    ],
  },
  {
    id: 'rerouting',
    icon: Route,
    title: 'Smart Rerouting',
    headline: 'Instant Alternative Paths',
    desc: 'When delays or disruptions are detected, ShipGuard generates alternative route suggestions with full cost-impact analysis and estimated time savings in seconds.',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50/80',
    visual: [
      { label: 'Time Saved', score: 82, color: '#10b981' },
      { label: 'Cost Impact', score: 35, color: '#f59e0b' },
      { label: 'Route Safety', score: 91, color: '#22c55e' },
      { label: 'Fuel Efficiency', score: 64, color: '#06b6d4' },
      { label: 'Carrier Avail.', score: 48, color: '#6366f1' },
      { label: 'ETA Certainty', score: 76, color: '#3b82f6' },
    ],
  },
  {
    id: 'alerts',
    icon: Bell,
    title: 'Early Alerts',
    headline: 'Days Ahead, Not Hours',
    desc: 'Get actionable warnings days before SLA breaches hit. Multi-channel notifications via email, push, SMS, and Slack with intelligent severity escalation chains.',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50/80',
    visual: [
      { label: 'SLA Risk', score: 88, color: '#ef4444' },
      { label: 'Escalation', score: 55, color: '#f59e0b' },
      { label: 'Lead Time', score: 72, color: '#6366f1' },
      { label: 'Alert Accuracy', score: 94, color: '#22c55e' },
      { label: 'Response Rate', score: 81, color: '#0ea5e9' },
      { label: 'Resolution', score: 67, color: '#8b5cf6' },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Deep Analytics',
    headline: 'Insights That Drive Action',
    desc: 'Carrier scorecards, route performance heatmaps, delay pattern analysis, and custom report builder. Turn your logistics data into competitive advantage.',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50/80',
    visual: [
      { label: 'On-Time Rate', score: 94, color: '#22c55e' },
      { label: 'Cost Savings', score: 37, color: '#10b981' },
      { label: 'Efficiency', score: 78, color: '#6366f1' },
      { label: 'Utilization', score: 86, color: '#0ea5e9' },
      { label: 'Carrier Score', score: 61, color: '#f59e0b' },
      { label: 'Risk Trend', score: 43, color: '#ef4444' },
    ],
  },
  {
    id: 'news',
    icon: Radio,
    title: 'Disruption Feed',
    headline: 'Global Pulse Monitoring',
    desc: 'AI-curated logistics news monitoring scanning 10,000+ sources for port closures, strikes, trade policy changes, natural disasters, and supply chain disruptions.',
    color: '#f43f5e',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50/80',
    visual: [
      { label: 'Port Closure', score: 92, color: '#ef4444' },
      { label: 'Labor Strike', score: 68, color: '#f59e0b' },
      { label: 'Policy Change', score: 41, color: '#6366f1' },
      { label: 'Nat. Disaster', score: 76, color: '#f43f5e' },
      { label: 'Demand Surge', score: 53, color: '#0ea5e9' },
      { label: 'Trade Tension', score: 34, color: '#8b5cf6' },
    ],
  },
];

function BarVisual({ data }) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[10px] sm:text-[11px] text-slate-500 w-20 sm:w-28 text-right flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-5 bg-slate-100/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${item.score}%` }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ backgroundColor: item.color, opacity: 0.85 }}
            />
          </div>
          <motion.span
            className="text-[11px] font-bold text-slate-600 w-7 text-right tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08 }}
          >
            {item.score}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

export default function Features() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const current = features[active];
  const Icon = current.icon;

  return (
    <section id="features" className="py-20 sm:py-32 bg-white relative overflow-hidden" ref={ref}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Core Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Six Engines.<br />
            <span className="text-gradient">One Mission.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
            Click each capability to explore its intelligence layer.
          </p>
        </motion.div>

        {/* Tab Pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {features.map((f, idx) => {
            const FIcon = f.icon;
            const isActive = idx === active;
            return (
              <button
                key={f.id}
                onClick={() => setActive(idx)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${f.color}dd, ${f.color})`, boxShadow: `0 8px 20px ${f.color}40` } : {}}
              >
                <FIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {f.title}
              </button>
            );
          })}
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className={`rounded-3xl border backdrop-blur-sm shadow-xl shadow-slate-200/30 overflow-hidden ${current.lightBg}`}
            style={{ borderColor: `${current.color}25` }}
          >
            <div className="grid md:grid-cols-2 gap-0">

              {/* Left: Text */}
              <div className="p-5 sm:p-7 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: current.color }}>
                      {current.title}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {current.headline}
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-6">
                  {current.desc}
                </p>

                {/* Feature highlights */}
                <div className="flex items-center gap-2 flex-wrap">
                  {['Real-time data', 'ML-powered', 'Actionable'].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-bold px-3 py-1 rounded-full"
                      style={{ color: current.color, backgroundColor: `${current.color}15` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Bar Chart */}
              <div className="p-5 sm:p-7 lg:p-10 bg-white/50 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/60">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Factor Analysis</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: current.color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: current.color }} />
                    Live
                  </span>
                </div>
                <BarVisual data={current.visual} />
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
