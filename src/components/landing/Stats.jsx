import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Clock, DollarSign, Globe } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const num = parseFloat(target);
    if (isNaN(num)) { setCount(target); return; }
    let start = 0;
    const increment = num / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  const display = typeof count === 'number'
    ? (target.toString().includes('.') ? count.toFixed(1) : Math.floor(count))
    : count;

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

const stats = [
  {
    value: '94.2', suffix: '%', label: 'Prediction Accuracy', sub: 'Industry-leading AI precision',
    icon: TrendingUp, color: '#6366f1', ring: 94.2,
  },
  {
    value: '48', suffix: 'h+', label: 'Advance Warning', sub: 'Before SLA breaches occur',
    icon: Clock, color: '#f59e0b', ring: 67,
  },
  {
    value: '37', suffix: '%', label: 'Cost Reduction', sub: 'In delay-related expenses',
    icon: DollarSign, color: '#10b981', ring: 37,
  },
  {
    value: '190', suffix: '+', label: 'Countries Covered', sub: 'Global logistics network',
    icon: Globe, color: '#8b5cf6', ring: 95,
  },
];

function RingProgress({ percentage, color, size = 120, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <svg ref={ref} width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={isInView ? { strokeDashoffset: circumference * (1 - percentage / 100) } : {}}
        transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </svg>
  );
}

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden bg-white" ref={ref}>
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-50/50 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Results That <span className="text-gradient">Compound</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
            Proven impact from thousands of shipments monitored daily.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {stats.map(({ value, suffix, label, sub, icon: Icon, color, ring }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.12 }}
              className="relative group"
            >
              <div className="bg-white/70 backdrop-blur-lg rounded-3xl border border-white/60 shadow-md p-5 sm:p-6 text-center hover:shadow-2xl hover:shadow-slate-200/60 hover:bg-white/90 transition-all duration-500 hover:-translate-y-1">
                {/* Ring + Icon */}
                <div className="relative w-28 h-28 mx-auto mb-4">
                  <RingProgress percentage={ring} color={color} size={112} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                      style={{ backgroundColor: `${color}12` }}
                    >
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                  </div>
                </div>

                {/* Animated number */}
                <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                  <AnimatedCounter target={value} suffix={suffix} />
                </p>
                <p className="text-sm font-bold text-slate-700 mt-1.5">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
