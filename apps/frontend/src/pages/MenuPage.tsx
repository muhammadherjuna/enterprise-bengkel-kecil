import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Wrench,
  DollarSign,
  FileText,
  Settings,
  Shield,
  LogOut,
  Car,
  Package,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const menuSections = [
    {
      title: 'Operasional Bengkel',
      items: [
        { to: '/customers', label: 'Pelanggan & Kendaraan', desc: 'Riwayat servis & motor', icon: Users, color: 'bg-blue-50 text-blue-700' },
        { to: '/services', label: 'Order Servis', desc: 'Pencatatan pekerjaan', icon: Wrench, color: 'bg-emerald-50 text-emerald-700' },
        { to: '/pos', label: 'Kasir & POS', desc: 'Penjualan eceran sparepart', icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-700' },
        { to: '/inventory', label: 'Katalog Sparepart & Stok', desc: 'Kelola stok & opname', icon: Package, color: 'bg-amber-50 text-amber-700' },
      ],
    },
    ...((hasRole('OWNER') || hasRole('KASIR'))
      ? [
          {
            title: 'Keuangan & Laporan',
            items: [
              { to: '/finance', label: 'Buku Kas & Pengeluaran', desc: 'Arus kas kasir & pengeluaran', icon: DollarSign, color: 'bg-teal-50 text-teal-700' },
              { to: '/reports', label: 'Laporan Rekap Harian', desc: 'Omzet & konsistensi', icon: FileText, color: 'bg-violet-50 text-violet-700' },
            ],
          },
        ]
      : []),
    ...(hasRole('OWNER')
      ? [
          {
            title: 'Administrasi Pemilik (Owner)',
            items: [
              { to: '/settings', label: 'Pengaturan Bengkel', desc: 'Profil, Jasa, Mekanik & Pengguna', icon: Settings, color: 'bg-slate-100 text-slate-800' },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* User Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Pengguna Aktif
          </span>
          <h2 className="text-base font-black text-slate-900 mt-0.5">{user?.name}</h2>
          <span className="text-xs text-slate-500">@{user?.username} • Peran: {user?.roles?.join(', ')}</span>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Menu Categories */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            {section.title}
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.desc}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
