import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronRight, Play, Shield, TrendingUp, Zap, Globe,
  Package, AlertTriangle, ArrowRight,
} from 'lucide-react';

export default function Hero() {
  const { currentUser } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50/30 to-white" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] bg-brand-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] bg-brand-100/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-30 lg:pt-32 pb-14 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-full mb-6 sm:mb-8">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-brand-700">
                AI-Powered Logistics Intelligence
              </span>
            </div>

            <h1 className="text-[1.95rem] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Predict Shipment{' '}
              <span className="relative">
                <span className="text-gradient">Delays Before</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8c50-6 100-6 148-2s100 4 148-2" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                </svg>
              </span>{' '}
              They Happen
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">
              ShipGuard AI analyzes weather, traffic, carrier performance, and global disruptions to predict SLA breaches
              <span className="font-semibold text-brand-600"> 48-72 hours in advance</span> — giving your team time to act.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {currentUser ? (
                <Link to="/dashboard" className="btn-primary w-full sm:w-auto text-center text-base px-8 py-3.5 flex items-center justify-center gap-2">
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary w-full sm:w-auto text-center text-base px-8 py-3.5 flex items-center justify-center gap-2 shadow-xl shadow-brand-500/30"
                  >
                    Start Free Trial <ChevronRight className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-secondary w-full sm:w-auto text-center text-base px-8 py-3.5 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 text-brand-600" />
                    See How It Works
                  </button>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className="mt-10 sm:mt-12 flex items-center gap-4 sm:gap-6 flex-wrap">
              <div className="flex -space-x-3">
                {['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'].map((color, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${color} ring-2 ring-white flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {['JD', 'AK', 'RS', 'ML', 'TW'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Trusted by <span className="font-semibold text-slate-700">2,500+</span> logistics teams
                </p>
              </div>
            </div>
          </div>

          {/* Right: Dashboard preview card */}
          <div className="relative hidden xl:block">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-indigo-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-300/50 border border-white/60 overflow-hidden">
              {/* Mini browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-3 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-400 truncate">
                  app.shipguard.ai/dashboard
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="p-5 space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Active Shipments', value: '1,247', icon: Package, color: 'text-brand-600 bg-brand-50' },
                    { label: 'At Risk', value: '23', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
                    { label: 'On-Time Rate', value: '94.2%', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="p-3 rounded-xl border border-white/50 bg-white/60 backdrop-blur-sm">
                      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">{value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Mock chart */}
                <div className="rounded-xl border border-white/50 p-3 bg-white/40 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-700">Risk Trend</p>
                    <p className="text-[10px] text-slate-400">Last 7 days</p>
                  </div>
                  {/* Bars with fixed pixel heights */}
                  <div className="flex items-end gap-1.5" style={{ height: '80px' }}>
                    {[
                      { v: 32, c: 'bg-brand-400' },
                      { v: 44, c: 'bg-amber-400' },
                      { v: 24, c: 'bg-brand-400' },
                      { v: 58, c: 'bg-red-400' },
                      { v: 38, c: 'bg-amber-400' },
                      { v: 68, c: 'bg-red-400' },
                      { v: 48, c: 'bg-amber-400' },
                    ].map(({ v, c }, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className={`w-full rounded-sm ${c}`} style={{ height: `${v}px` }} />
                      </div>
                    ))}
                  </div>
                  {/* X labels */}
                  <div className="flex gap-1.5 mt-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <span key={i} className="flex-1 text-center text-[8px] font-medium text-slate-400">{d}</span>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      <span className="text-[8px] text-slate-400">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[8px] text-slate-400">Med</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-[8px] text-slate-400">High</span>
                    </div>
                    <span className="ml-auto text-[8px] font-bold text-slate-500">Avg: 56%</span>
                  </div>
                </div>

                {/* Mock alerts */}
                <div className="space-y-2">
                  {[
                    { text: 'SH-4821 — severe weather warning', color: 'bg-red-500' },
                    { text: 'SH-3195 — port congestion delay', color: 'bg-amber-500' },
                    { text: 'SH-7720 — carrier reroute suggested', color: 'bg-brand-500' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40">
                      <div className={`w-2 h-2 rounded-full ${a.color} flex-shrink-0`} />
                      <p className="text-[11px] text-slate-600 truncate">{a.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -right-3 top-12 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 px-4 py-3 animate-bounce-slow">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-slate-800">48h Early</p>
                  <p className="text-[10px] text-slate-400">Warning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
