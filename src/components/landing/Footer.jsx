import { Link } from 'react-router-dom';

const footerLinks = {
  Explore: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
  ],
  Resources: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Shipments', href: '/shipments' },
    { label: 'Alerts', href: '/alerts' },
  ],
};

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'GitHub', href: 'https://github.com/LegendarySumit/shipguard-ai' },
  { label: 'X / Twitter', href: 'https://x.com/' },
];

export default function Footer() {
  const scrollTo = (href) => {
    if (href.startsWith('#') && href !== '#') {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 sm:py-16 grid gap-10 lg:grid-cols-[1.4fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="ShipGuard" className="w-9 h-9 rounded-xl" />
              <span className="text-lg font-bold text-white">
                Ship<span className="text-brand-400">Guard</span> AI
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              AI-powered early warning system for shipment delays. Predict, prevent, and protect your supply chain.
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-4">{heading}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <button
                        onClick={() => scrollTo(href)}
                        className="text-sm text-slate-500 hover:text-white transition-colors"
                      >
                        {label}
                      </button>
                    ) : (
                      <Link to={href} className="text-sm text-slate-500 hover:text-white transition-colors">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-4">Social</h4>
            <ul className="space-y-3">
              {socialLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ShipGuard AI. Predict delays before they become problems.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => scrollTo('#pricing')} className="text-xs text-slate-500 hover:text-white transition-colors">
              Pricing
            </button>
            <button onClick={() => scrollTo('#features')} className="text-xs text-slate-500 hover:text-white transition-colors">
              Features
            </button>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
