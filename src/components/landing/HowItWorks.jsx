import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Database, Brain, BellRing, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Database,
    step: '01',
    title: 'Ingest',
    headline: 'Data Flows In',
    desc: 'Shipment ETAs, carrier feeds, weather APIs, traffic data, port congestion reports, and global news — all streaming in real time.',
    color: '#6366f1',
    gradient: 'from-brand-500 to-violet-600',
    lightBg: 'bg-indigo-50/70',
    borderColor: '#6366f120',
    tags: ['Real-time', 'Multi-source', 'Automated'],
  },
  {
    icon: Brain,
    step: '02',
    title: 'Analyze',
    headline: 'AI Scores Risk',
    desc: 'Weighted multi-factor ML engine scores each shipment across 8 risk dimensions, producing confidence-rated predictions.',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50/70',
    borderColor: '#8b5cf620',
    tags: ['ML Model', '8 Dimensions', '94% Accuracy'],
  },
  {
    icon: BellRing,
    step: '03',
    title: 'Alert',
    headline: 'Early Warning',
    desc: 'Alerts fire 48–72 hours before predicted SLA breaches with severity classification and intelligent escalation chains.',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50/70',
    borderColor: '#f59e0b20',
    tags: ['48-72h Early', 'Severity Ranked', 'Multi-channel'],
  },
  {
    icon: CheckCircle2,
    step: '04',
    title: 'Act',
    headline: 'Intervene Smart',
    desc: 'Ranked interventions — rerouting, carrier switching, pre-alerts — with cost and time impact shown. One click to execute.',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50/70',
    borderColor: '#10b98120',
    tags: ['Cost Analysis', 'One-click', 'Ranked Actions'],
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-6 border border-slate-200 shadow-sm">
            <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            From Data to <span className="text-gradient">Action</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            Four simple stages turn raw logistics data into proactive delay prevention.
          </p>
        </motion.div>

        {/* Step Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {steps.map(({ icon: Icon, step, headline, desc, color, gradient, lightBg, borderColor, tags }, idx) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + idx * 0.1 }}
              className={`rounded-2xl border backdrop-blur-sm shadow-lg shadow-slate-200/30 overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group ${lightBg}`}
              style={{ borderColor }}
            >
              {/* Card top strip */}
              <div className="px-5 pt-5 pb-4">
                {/* Step badge + icon row */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ color, backgroundColor: `${color}15` }}
                  >
                    Step {step}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-[18px] h-[18px] text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-black text-slate-900 mb-1">{headline}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>

              {/* Tags strip */}
              <div className="px-5 py-3 bg-white/50 backdrop-blur-md border-t flex flex-wrap gap-1.5" style={{ borderColor }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: `${color}12` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
