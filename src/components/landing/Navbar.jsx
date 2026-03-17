import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = ['features', 'how-it-works', 'pricing', 'testimonials'];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection('');
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/40 border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:shadow-brand-500/40 transition-all">
              <Shield className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                Ship<span className="text-brand-600">Guard</span> AI
              </span>
              <span className="text-[9px] font-semibold text-brand-400 uppercase tracking-widest leading-none hidden sm:block">
                Early Warning System
              </span>
            </div>
          </Link>

          {/* Center: Desktop nav links */}
          <div className="hidden md:flex items-center">
            <div className={`flex items-center gap-0.5 p-1 rounded-full transition-all duration-300 ${
              scrolled ? 'bg-brand-50 ring-1 ring-brand-200/60' : 'bg-white/80 backdrop-blur-sm ring-1 ring-brand-200/70 shadow-sm'
            }`}>
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className={`relative px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? 'text-brand-700'
                        : 'text-slate-500 hover:text-brand-600'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-white rounded-full shadow-sm ring-1 ring-brand-100/80"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="btn-primary flex items-center gap-2 text-sm !py-2 !px-5"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary flex items-center gap-1.5 text-sm !py-2.5 !px-5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-brand-100/50 shadow-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                      isActive
                        ? 'text-brand-700 bg-brand-50'
                        : 'text-slate-600 hover:text-brand-600 hover:bg-brand-50/50'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="inline-block w-1.5 h-1.5 bg-brand-500 rounded-full ml-2" />
                    )}
                  </button>
                );
              })}
              <div className="pt-3 mt-2 border-t border-slate-100 space-y-2">
                {currentUser ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2 text-sm"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full py-3 text-center text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full text-center flex items-center justify-center gap-2 text-sm"
                    >
                      <Zap className="w-4 h-4" />
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
