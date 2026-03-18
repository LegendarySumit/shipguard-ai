import { Truck, Ship, Plane, Container, Warehouse, Package } from 'lucide-react';

export default function LogoCloud() {
  const partners = [
    { name: 'GlobalFreight', icon: Ship },
    { name: 'SwiftLogistics', icon: Truck },
    { name: 'AeroShip', icon: Plane },
    { name: 'PortMaster', icon: Container },
    { name: 'WareHQ', icon: Warehouse },
    { name: 'PacketFlow', icon: Package },
  ];

  return (
    <section className="relative py-12 sm:py-16 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-[0.15em] mb-8 sm:mb-10">
          Trusted by industry leaders worldwide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-7 items-center justify-items-center">
          {partners.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-2.5 text-slate-500 hover:text-slate-800 transition-colors cursor-default"
            >
              <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.8} />
              <span className="text-[11px] sm:text-base font-semibold sm:font-bold leading-tight">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
