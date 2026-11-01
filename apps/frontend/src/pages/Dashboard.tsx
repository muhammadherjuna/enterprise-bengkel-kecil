import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PlateBadge } from '../components/PlateBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Wrench,
  Banknote,
  Wallet,
  Package,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  Clock,
  ChevronRight,
  CheckCircle2,
  Users,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = hasRole('OWNER');
  const isKasirOnly = hasRole('KASIR') && !isOwner;

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any>('/dashboard/summary');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin"></div>
        <span className="text-xs font-medium text-zinc-500">Menyinkronkan data bengkel...</span>
      </div>
    );
  }

  // ==========================================
  // 1. DASHBOARD KHUSUS KASIR (FRONT DESK & POS)
  // ==========================================
  if (isKasirOnly) {
    return (
      <div className="space-y-6">
        {/* Kasir Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                Front Desk & Kasir Register
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Cashier Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Terminal transaksi penjualan langsung, pelunasan servis masuk, dan posisi saldo kas register.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/pos"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-subtle transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buka POS Kasir</span>
            </Link>
            <Link
              to="/services/new"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 shadow-subtle transition"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-600" />
              <span>Buat Servis</span>
            </Link>
          </div>
        </div>

        {/* Kasir KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Omzet Kasir Hari Ini */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Omzet Diterima Hari Ini
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Banknote className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
                {formatCurrency(data?.todayRevenue || 0)}
              </div>
              <span className="text-[11px] text-zinc-500 font-medium block mt-1">
                {data?.todayPaymentsCount || 0} pembayaran selesai
              </span>
            </div>
          </div>

          {/* Saldo Laci Kasir */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Saldo Laci Kasir (Cash)
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
                {formatCurrency(data?.cashDrawerBalance || 0)}
              </div>
              <Link
                to="/finance"
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 mt-1"
              >
                <span>Buku Kas & Pengeluaran</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Servis Aktif */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Servis Berjalan
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
                {data?.activeServicesCount || 0} <span className="text-xs font-normal text-zinc-500">Unit</span>
              </div>
              <Link
                to="/services"
                className="text-[11px] text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1 mt-1"
              >
                <span>Lihat tagihan servis</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Penjualan POS Eceran */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Penjualan Eceran POS
              </span>
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
                {data?.directSalesTodayCount || 0} <span className="text-xs font-normal text-zinc-500">Trx</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium block mt-1">
                Nota retail langsung hari ini
              </span>
            </div>
          </div>
        </div>

        {/* Antrean Servis yang Siap Dibayar */}
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Tagihan Servis Berjalan</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Daftar pekerjaan aktif yang dapat diproses pelunasan kasirnya
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition"
            >
              <span>Semua Order Servis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {!data?.recentActiveServices || data.recentActiveServices.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Tidak ada servis yang aktif saat ini.
              </div>
            ) : (
              data.recentActiveServices.map((order: any) => (
                <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/60 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-900">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <PlateBadge plate={order.vehicle?.plateNumber} size="sm" />
                      <span className="text-xs font-semibold text-zinc-800">
                        {order.customer?.name || 'Pelanggan Umum'}
                      </span>
                      <span className="text-zinc-400 text-xs">•</span>
                      <span className="text-xs text-zinc-500 font-medium tabular-nums">
                        Estimasi: {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/services/${order.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-subtle transition self-start sm:self-center"
                  >
                    <span>Buka & Pelunasan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. DASHBOARD OWNER (EXECUTIVE CONTROL)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Overview Operasional Bengkel
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Executive
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Ringkasan omzet harian, arus kas kasir, beban kerja mekanik, dan kesehatan inventori bengkel.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/pos"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/25 active:scale-[0.98] transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buka Kasir POS</span>
          </Link>
          <Link
            to="/services/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-blue-50/70 text-blue-700 hover:text-blue-800 text-xs font-semibold rounded-lg border border-blue-200/80 shadow-subtle active:scale-[0.98] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Intake Servis Baru</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 border-t-2 border-t-emerald-500 shadow-card flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Omzet Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
              {formatCurrency(data?.todayRevenue || 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span className="font-semibold text-emerald-700">{data?.todayPaymentsCount || 0}</span>
              <span>pembayaran sah</span>
              <span className="text-zinc-300">•</span>
              <span className="text-emerald-700 font-medium">100% lunas</span>
            </div>
          </div>
        </div>

        {/* Servis Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 border-t-2 border-t-blue-600 shadow-card flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Servis Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
              {data?.activeServicesCount || 0} <span className="text-xs font-normal text-zinc-500">Motor</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span className="text-amber-700 font-semibold">{data?.inProgressServicesCount || 0}</span>
              <span>pengerjaan</span>
              <span className="text-zinc-300">•</span>
              <span className="text-blue-700 font-semibold">{data?.pendingServicesCount || 0}</span>
              <span>antrean</span>
            </div>
          </div>
        </div>

        {/* Saldo Laci Kasir */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 border-t-2 border-t-indigo-600 shadow-card flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Saldo Laci Kasir
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
              {formatCurrency(data?.cashDrawerBalance || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-zinc-500">Posisi kas fisik register</span>
              <Link to="/finance" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
                Buku Kas <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Stok Batas Minimum
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight tabular-nums">
              {data?.lowStockCount || 0} <span className="text-xs font-normal text-zinc-500">SKU</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-amber-700 font-semibold">Perlu restock</span>
              <Link to="/inventory?lowStock=true" className="text-zinc-700 hover:text-zinc-900 font-semibold flex items-center gap-0.5">
                Periksa <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {data?.lowStockCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-amber-900 font-semibold">Peringatan Stok Suku Cadang:</strong>
              <p className="text-amber-800 text-[11px] mt-0.5">
                {data.lowStockProducts.map((p: any) => `${p.name} (${p.stock} ${p.unit})`).slice(0, 5).join(', ')}
                {data.lowStockProducts.length > 5 ? `, dan ${data.lowStockProducts.length - 5} lainnya.` : '.'}
              </p>
            </div>
          </div>
          <Link
            to="/inventory?lowStock=true"
            className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold rounded-lg text-xs transition shadow-subtle flex-shrink-0"
          >
            Buka Inventori
          </Link>
        </div>
      )}

      {/* Active Services Queue */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Pekerjaan Servis Berjalan</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Antrean motor yang sedang berada di stall mekanik</p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition"
          >
            <span>Semua Servis</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">No. Order</th>
                <th className="py-2.5 px-4 font-medium">Kendaraan / Plat</th>
                <th className="py-2.5 px-4 font-medium">Pelanggan & Keluhan</th>
                <th className="py-2.5 px-4 font-medium">Mekanik</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Perkiraan Biaya</th>
                <th className="py-2.5 px-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {!data?.recentActiveServices || data.recentActiveServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    Tidak ada antrean servis yang aktif saat ini.
                  </td>
                </tr>
              ) : (
                data.recentActiveServices.map((order: any) => (
                  <tr key={order.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <PlateBadge plate={order.vehicle?.plateNumber} size="sm" />
                        <span className="text-[11px] text-zinc-600 block">
                          {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : 'Tanpa Unit Motor'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-zinc-900">
                          {order.customer?.name || 'Pelanggan Umum'}
                        </span>
                        {order.complaint && (
                          <p className="text-[11px] text-zinc-500 italic max-w-xs truncate">
                            "{order.complaint}"
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-zinc-700">
                      {order.mechanic ? (
                        <span className="inline-flex items-center gap-1 font-medium">
                          {order.mechanic.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Belum assign</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-zinc-900 tabular-nums">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/services/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 rounded-md text-xs font-semibold transition"
                      >
                        <span>Kelola</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
