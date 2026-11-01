import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { Link, useLocation } from 'react-router-dom';
import {
  Wrench,
  LogOut,
  User,
  ShoppingBag,
  Package,
  Layers,
  BarChart2,
  Settings,
  Circle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [workshopName, setWorkshopName] = useState('BengkelOS');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    apiFetch<any>('/workshop')
      .then((data) => {
        if (data?.name) setWorkshopName(data.name);
      })
      .catch(() => {});

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/services', label: 'Servis' },
    { to: '/pos', label: 'Kasir POS' },
    { to: '/inventory', label: 'Inventori' },
    { to: '/customers', label: 'Pelanggan' },
    ...(hasRole('OWNER') || hasRole('KASIR')
      ? [
          { to: '/finance', label: 'Keuangan' },
          { to: '/reports', label: 'Laporan' },
        ]
      : []),
    ...(hasRole('OWNER') ? [{ to: '/settings', label: 'Pengaturan' }] : []),
  ];

  // Clean user display name: remove redundant role in parentheses if present
  const cleanName = (user?.name || user?.username || '')
    .replace(/\s*\((owner|kasir|admin|superadmin)\)/gi, '')
    .trim();
  const userInitial = cleanName.charAt(0).toUpperCase() || (user?.username?.charAt(0).toUpperCase() ?? 'U');

  const getRoleBadge = (roles?: string[]) => {
    if (!roles || roles.length === 0) return null;
    const primary = roles[0];
    const styles: Record<string, string> = {
      OWNER: 'bg-blue-950 text-blue-200 border-blue-800 shadow-xs',
      KASIR: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
    return (
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider whitespace-nowrap ${
          styles[primary] || 'bg-zinc-100 text-zinc-700'
        }`}
      >
        {primary}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-all">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-zinc-900 block leading-tight whitespace-nowrap">
                  {workshopName}
                </span>
                <span className="text-[10px] text-blue-600 font-medium block leading-none">
                  Workshop ERP Pro
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 pl-2 shrink-0">
              {navLinks.map((link) => {
                const isActive =
                  link.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/80 font-bold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Clock & User Session */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs text-zinc-600 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="tabular-nums font-medium whitespace-nowrap">{currentTime} WIB</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 shrink-0">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-800 text-xs font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-semibold text-zinc-900 whitespace-nowrap">
                    {cleanName}
                  </span>
                </div>
                {getRoleBadge(user?.roles)}
              </div>

              <button
                onClick={() => logout()}
                title="Keluar dari sistem"
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-1 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
