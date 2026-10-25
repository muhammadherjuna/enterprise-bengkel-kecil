import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { Wrench, LogOut, UserCircle, Shield, ShoppingBag, Package, Menu as MenuIcon, BarChart3, Users, DollarSign } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [workshopName, setWorkshopName] = useState('BengkelOS');

  useEffect(() => {
    apiFetch<any>('/workshop')
      .then((data) => {
        if (data?.name) setWorkshopName(data.name);
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/services', label: 'Servis' },
    { to: '/pos', label: 'Kasir / POS' },
    { to: '/inventory', label: 'Stok' },
    { to: '/customers', label: 'Pelanggan' },
    ...(hasRole('OWNER') || hasRole('KASIR')
      ? [
          { to: '/finance', label: 'Keuangan' },
          { to: '/reports', label: 'Laporan' },
        ]
      : []),
    ...(hasRole('OWNER') ? [{ to: '/settings', label: 'Pengaturan' }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  {workshopName}
                </span>
                <span className="text-xs text-slate-500 font-medium">BengkelOS ERP</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center ml-8 space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
              <UserCircle className="w-4 h-4 text-slate-500" />
              <span className="max-w-[120px] truncate">{user?.name || user?.username}</span>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                {user?.roles?.[0]}
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Logout"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
