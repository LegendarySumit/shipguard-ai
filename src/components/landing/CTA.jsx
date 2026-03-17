import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative overflow-hidden bg-[#f4f7ff] py-16 sm:py-24" ref={ref}>
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative py-16 sm:py-20 lg:py-24">
            <div className="max-w-3xl mx-auto text-center">
              {/* Animated badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-brand-100 rounded-full mb-8 backdrop-blur-sm shadow-sm shadow-brand-100/40"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-4 h-4 text-brand-500" />
                </motion.div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">
                  Start in 60 seconds
                </span>
              </motion.div>

              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                Stop Reacting.<br />
                <span className="text-brand-600">Start Predicting.</span>
              </motion.h2>

              <motion.p
                className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
              >
                Join 2,500+ logistics teams using ShipGuard AI to predict delays, reduce costs,
                and deliver on time. Every time.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
              >
                <Link
                  to="/register"
                  className="w-full sm:w-auto group relative px-8 py-4 bg-brand-600 text-white font-black rounded-2xl transition-all hover:bg-brand-500 hover:shadow-[0_0_24px_rgba(99,102,241,0.28)] flex items-center justify-center gap-3 text-sm sm:text-base overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white/85 text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-white backdrop-blur-sm transition-all flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm shadow-slate-200/50"
                >
                  <Shield className="w-5 h-5 text-brand-500" /> Sign In
                </Link>
              </motion.div>

              <motion.p
                className="mt-6 text-xs text-slate-500"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
              >
                No credit card required. Free plan available forever.
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
