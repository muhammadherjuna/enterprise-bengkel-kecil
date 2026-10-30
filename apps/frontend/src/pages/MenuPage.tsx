import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Wrench,
  Wallet,
  FileText,
  Settings,
  Shield,
  LogOut,
  Car,
  Package,
  ShoppingBag,
  ChevronRight,
  User,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const menuSections = [
    {
      title: 'Operasional Harian',
      items: [
        { to: '/customers', label: 'Pelanggan & Kendaraan', desc: 'Riwayat servis & data unit motor', icon: Users },
        { to: '/services', label: 'Order Servis & Antrean', desc: 'Penerimaan unit & tracking status', icon: Wrench },
        { to: '/pos', label: 'Kasir & POS', desc: 'Penjualan retail langsung sparepart', icon: ShoppingBag },
        { to: '/inventory', label: 'Katalog Sparepart & Stok', desc: 'Mutasi inventori & stok opname', icon: Package },
      ],
    },
    ...((hasRole('OWNER') || hasRole('KASIR'))
      ? [
          {
            title: 'Keuangan & Laporan',
            items: [
              { to: '/finance', label: 'Buku Kas & Pengeluaran', desc: 'Catatan kas masuk & biaya operasional', icon: Wallet },
              { to: '/reports', label: 'Laporan Rekapitulasi', desc: 'Rekap harian & rekonsiliasi transaksi', icon: FileText },
            ],
          },
        ]
      : []),
    ...(hasRole('OWNER')
      ? [
          {
            title: 'Administrasi Bengkel',
            items: [
              { to: '/settings', label: 'Pengaturan Sistem', desc: 'Profil bengkel, tarif jasa, mekanik & akun staf', icon: Settings },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Active User Card */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-wider">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">{user?.name}</h2>
              <span className="font-mono text-[10px] text-zinc-400">@{user?.username}</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              {user?.roles?.map((role) => (
                <span
                  key={role}
                  className="bg-zinc-100 text-zinc-700 font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 rounded-lg text-xs font-semibold border border-zinc-200 hover:border-rose-200 transition"
          title="Keluar dari sistem"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>

      {/* Menu Categories */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
            {section.title}
          </h3>
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-subtle divide-y divide-zinc-100 overflow-hidden">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="p-4 flex items-center justify-between hover:bg-zinc-50/70 transition group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-zinc-900 block group-hover:text-zinc-950">
                        {item.label}
                      </span>
                      <span className="text-xs text-zinc-500">{item.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 transition" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
