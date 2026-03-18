import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Zap, Building2, Rocket, DollarSign } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    price: { monthly: 49, annual: 39 },
    desc: 'For small logistics teams getting started with AI-powered delay prediction.',
    features: [
      'Up to 500 shipments/month',
      '24h advance warnings',
      'Email notifications',
      'Basic analytics dashboard',
      'Weather data integration',
      '5 team members',
    ],
    color: '#64748b',
    gradient: 'from-slate-500 to-slate-700',
    accentBg: 'bg-slate-50/60',
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    icon: Rocket,
    price: { monthly: 149, annual: 119 },
    desc: 'For growing operations that need comprehensive delay prevention.',
    features: [
      'Up to 5,000 shipments/month',
      '48h advance warnings',
      'Email, push & SMS alerts',
      'Advanced analytics & reports',
      'Weather + news disruption feeds',
      'Smart rerouting engine',
      'Carrier scorecards',
      '25 team members',
      'API access',
    ],
    color: '#6366f1',
    gradient: 'from-brand-500 to-violet-600',
    accentBg: 'bg-indigo-50/60',
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: { monthly: null, annual: null },
    desc: 'For large-scale operations requiring unlimited scale and custom integrations.',
    features: [
      'Unlimited shipments',
      '72h advance warnings',
      'All notification channels',
      'Custom analytics & BI export',
      'All data integrations',
      'Auto-intervention playbooks',
      'TMS/ERP integration',
      'Unlimited team members',
      'Dedicated CSM + SLA guarantee',
    ],
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    accentBg: 'bg-violet-50/60',
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="py-20 sm:py-32 bg-white relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_90%,rgba(139,92,246,0.04),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-6">
            <DollarSign className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Invest in <span className="text-gradient">Prevention</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Start free. Scale when ready. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                !annual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                annual ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Annual
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-8 max-w-5xl mx-auto items-stretch">
          {plans.map(({ name, icon: Icon, price, desc, features, color, gradient, accentBg, cta, popular }, idx) => (
            <div key={name} className="relative pt-6 h-full">
              {/* Popular badge — straddles the top edge */}
              {popular && (
                <div
                  className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${color}ee, ${color})`, boxShadow: `0 4px 14px ${color}40` }}
                >
                  Most Popular
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + idx * 0.12 }}
                className={`relative rounded-3xl overflow-hidden flex flex-col backdrop-blur-lg transition-all duration-300 h-full ${
                  popular
                    ? 'bg-white/90 shadow-2xl shadow-indigo-200/40 ring-2 ring-brand-200/60 z-10'
                    : 'bg-white/70 border border-white/60 shadow-md hover:shadow-xl hover:shadow-slate-200/40'
                }`}
              >
              {/* Top accent gradient bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

              {/* Upper zone */}
              <div className={`p-6 sm:p-8 flex flex-col min-h-[380px] ${accentBg}`}>
                {/* Icon + plan name */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{name}</h3>
                </div>

                {/* Price */}
                <div className="mb-1">
                  {price.monthly ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-slate-400 text-lg font-semibold">$</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={annual ? 'annual' : 'monthly'}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.18 }}
                          className="text-5xl font-black text-slate-900 tabular-nums leading-none"
                        >
                          {annual ? price.annual : price.monthly}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-slate-400 text-sm ml-1">/mo</span>
                    </div>
                  ) : (
                    <span className="text-5xl font-black text-slate-900 leading-none">Custom</span>
                  )}
                </div>

                {/* Annual savings callout — fixed height to keep button aligned */}
                <div className="h-7 flex items-center mb-4">
                  {annual && price.monthly && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-[8px]">↓</span>
                      Save ${(price.monthly - price.annual) * 12} per year
                    </p>
                  )}
                </div>

                <p className="text-sm text-slate-500 leading-relaxed min-h-[88px]">{desc}</p>

                {/* CTA — wrapper handles spacing, button has symmetric padding */}
                <div className="mt-auto pt-6">
                  <Link
                    to="/register"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${color}ee, ${color})`,
                      boxShadow: `0 4px 16px ${color}30`,
                    }}
                  >
                    {cta} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Features zone */}
              <div className="px-6 sm:px-8 py-6 bg-white/50 backdrop-blur-md border-t border-slate-100/60 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  What's included
                </p>
                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Check className="w-3 h-3" style={{ color }} />
                      </div>
                      <span className="text-sm text-slate-600 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
