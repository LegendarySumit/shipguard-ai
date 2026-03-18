import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, MessageSquareQuote } from 'lucide-react';

const row1 = [
  {
    quote: "ShipGuard AI transformed our operations. We went from firefighting delays to preventing them. The 48-hour early warnings have saved us millions.",
    name: 'Sarah Chen', role: 'VP Supply Chain', company: 'GlobalTech', avatar: 'SC', color: '#6366f1',
  },
  {
    quote: "The AI risk scoring is incredibly accurate. We reduced our SLA breach rate by 62% in just 3 months. The carrier analytics alone are worth it.",
    name: 'Marcus Johnson', role: 'Logistics Director', company: 'Pacific Freight', avatar: 'MJ', color: '#10b981',
  },
  {
    quote: "What sets ShipGuard apart is the intervention recommendations. It tells you exactly what to do and what it'll cost. Game changer.",
    name: 'Elena Rodriguez', role: 'Operations Manager', company: 'TransAtlantic', avatar: 'ER', color: '#f59e0b',
  },
  {
    quote: "We integrated in under a week. The weather and news disruption feeds caught issues our team would've missed completely.",
    name: 'David Park', role: 'CTO', company: 'QuickRoute', avatar: 'DP', color: '#8b5cf6',
  },
  {
    quote: "Customer satisfaction jumped 15 points. Proactive notifications to customers before delays hit make all the difference.",
    name: 'Amira Patel', role: 'Head of CX', company: 'EastWest Hub', avatar: 'AP', color: '#f43f5e',
  },
];

const row2 = [
  {
    quote: "The dashboard is beautiful and intuitive. Even our non-technical dispatchers picked it up in minutes. Best logistics intelligence tool.",
    name: 'Thomas Weber', role: 'Fleet Manager', company: 'EuroFreight', avatar: 'TW', color: '#0ea5e9',
  },
  {
    quote: "ROI was visible in the first month — fewer expediting costs, better carrier negotiations, and happier clients across the board.",
    name: 'Yuki Tanaka', role: 'Supply Chain Lead', company: 'NipponTrade', avatar: 'YT', color: '#10b981',
  },
  {
    quote: "ShipGuard's port congestion predictions are scary accurate. We've rerouted shipments proactively 200+ times this quarter.",
    name: 'Raj Mehta', role: 'VP Operations', company: 'IndiaShip', avatar: 'RM', color: '#6366f1',
  },
  {
    quote: "Finally, a logistics AI tool that's not just a dashboard of charts. ShipGuard actually tells you what action to take. Revolutionary stuff.",
    name: 'Lisa Andersen', role: 'COO', company: 'Nordic Cargo', avatar: 'LA', color: '#f59e0b',
  },
  {
    quote: "We process 50,000 shipments monthly. ShipGuard scales effortlessly and catches risks human analysts could never spot in time.",
    name: 'Carlos Rivera', role: 'Director', company: 'LatAm Logistics', avatar: 'CR', color: '#8b5cf6',
  },
];

function TestimonialCard({ quote, name, role, company, avatar, color }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[360px] bg-white/70 backdrop-blur-lg rounded-2xl border border-white/60 shadow-md p-5 sm:p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:bg-white/90 transition-all duration-300 group">
      <div className="flex items-center gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">"{quote}"</p>
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-md"
          style={{ backgroundColor: color }}
        >
          {avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-400">{role}, {company}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction = 'left', speed = 30 }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4 sm:gap-6"
        animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, idx) => (
          <TestimonialCard key={`${item.name}-${idx}`} {...item} />
        ))}
      </motion.div>
    </div>
  );
}

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-slate-50 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_50%)]" />

      <div className="relative">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20 px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full mb-6 shadow-sm">
            <MessageSquareQuote className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Wall of Love</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Teams Ship Smarter<br />
            <span className="text-gradient">With ShipGuard</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-500">
            Join 2,500+ logistics teams who've eliminated surprise delays.
          </p>
        </motion.div>

        {/* Marquee rows */}
        <div className="space-y-4 sm:space-y-6">
          <MarqueeRow items={row1} direction="left" speed={40} />
          <MarqueeRow items={row2} direction="right" speed={45} />
        </div>

        {/* Edge fades */}
        <div className="absolute top-0 bottom-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
