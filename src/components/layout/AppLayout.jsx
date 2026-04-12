import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {!isOnline && (
          <div className="mx-3 sm:mx-4 md:mx-6 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2 text-amber-800">
            <WifiOff className="w-4 h-4" />
            <p className="text-xs sm:text-sm font-medium">Offline mode: live updates may be delayed until connection is restored.</p>
          </div>
        )}
        {isOnline && (
          <div className="mx-3 sm:mx-4 md:mx-6 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2 text-emerald-700">
            <Wifi className="w-4 h-4" />
            <p className="text-xs sm:text-sm font-medium">Connection restored. Real-time sync is active.</p>
          </div>
        )}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
