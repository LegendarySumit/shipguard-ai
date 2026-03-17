import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, AlertTriangle, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shipments', label: 'Shipments', icon: Package },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, userProfile } = useAuth();
  const location = useLocation();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className={`relative flex items-center h-16 border-b border-slate-800 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="ShipGuard" className="w-9 h-9 flex-shrink-0" />
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-white tracking-tight">ShipGuard</h1>
              <p className="text-[10px] text-brand-400 font-medium -mt-0.5">AI Early Warning</p>
            </div>
          </div>
        )}

        <div className={`flex items-center ${collapsed ? 'w-full justify-center' : ''}`}>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-8 h-8 rounded-lg border items-center justify-center transition-all duration-200 ${
              collapsed
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 hover:bg-brand-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
          return (
            <NavLink
              key={path}
              to={path}
              onClick={handleNavClick}
              className={`flex items-center py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                collapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 shadow-lg shadow-brand-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!collapsed && <span>{label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed && userProfile && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{userProfile.displayName || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`flex items-center w-full py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-3'
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

    </>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 flex flex-col bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-64'
        } h-screen sticky top-0 flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 hidden lg:flex`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
