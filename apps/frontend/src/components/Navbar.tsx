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

  const getRoleBadge = (roles?: string[]) => {
    if (!roles || roles.length === 0) return null;
    const primary = roles[0];
    const styles: Record<string, string> = {
      OWNER: 'bg-zinc-900 text-zinc-100 border-zinc-700',
      KASIR: 'bg-blue-50 text-blue-800 border-blue-200',
      MEKANIK: 'bg-amber-50 text-amber-800 border-amber-200',
    };
    return (
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
          styles[primary] || 'bg-zinc-100 text-zinc-700'
        }`}
      >
        {primary}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-subtle group-hover:bg-blue-600 transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-zinc-900 leading-none">
                  {workshopName}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 leading-none mt-1 uppercase tracking-wider">
                  v1.1 • ENTERPRISE
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 pl-2">
              {navLinks.map((link) => {
                const isActive =
                  link.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 shadow-subtle'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Clock & User Session */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-zinc-50 rounded-md border text-xs text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="tabular-nums font-medium">{currentTime} WIB</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-100 border flex items-center justify-center text-zinc-700 text-xs font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-900 leading-tight">
                    {user?.name || user?.username}
                  </span>
                </div>
                {getRoleBadge(user?.roles)}
              </div>

              <button
                onClick={() => logout()}
                title="Keluar dari sistem"
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-1"
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
