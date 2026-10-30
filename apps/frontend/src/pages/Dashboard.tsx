import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { Link } from 'react-router-dom';
import { PlateBadge } from '../components/PlateBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Wrench,
  DollarSign,
  Package,
  TrendingUp,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <span className="text-xs font-mono text-zinc-500">Menyinkronkan data bengkel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Overview Operasional
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Workshop
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Ringkasan omzet kasir, beban kerja mekanik, dan status persediaan hari ini.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/services/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-subtle transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Servis Baru</span>
          </Link>
          <Link
            to="/pos"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 shadow-subtle transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-zinc-600" />
            <span>Buka Kasir POS</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
              Omzet Hari Ini
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {formatCurrency(data?.todayRevenue)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
              <span>{data?.todayTransactionsCount || 0} pembayaran sah</span>
              <span className="font-mono text-zinc-400">100% lunas</span>
            </div>
          </div>
        </div>

        {/* Servis Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
              Servis Aktif
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {data?.activeServicesCount || 0}{' '}
              <span className="text-sm font-medium text-zinc-500">Motor</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
              <span>{data?.inProgressServicesCount || 0} pengerjaan</span>
              <span>{data?.pendingServicesCount || 0} antrean</span>
            </div>
          </div>
        </div>

        {/* Kas Fisik Kasir */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
              Saldo Laci Kasir
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {formatCurrency(data?.cashOnHand)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
              <span>Posisi kas fisik register</span>
              <Link to="/finance" className="text-blue-600 hover:underline font-medium">
                Buku Kas
              </Link>
            </div>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
              Stok Batas Minimum
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {data?.lowStockCount || 0}{' '}
              <span className="text-sm font-medium text-zinc-500">SKU</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[11px]">
              <span className="text-zinc-500">Perlu restock</span>
              <Link to="/inventory?lowStock=true" className="text-blue-600 hover:underline font-medium">
                Periksa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <div>
              <span className="font-semibold text-amber-900">
                Peringatan Stok Suku Cadang:
              </span>{' '}
              <span className="text-amber-800">
                {data.lowStockProducts.map((p: any) => `${p.name} (${p.stock} ${p.unit})`).join(', ')}
              </span>
            </div>
          </div>
          <Link
            to="/inventory?lowStock=true"
            className="flex-shrink-0 text-xs font-semibold text-amber-900 hover:text-amber-950 underline"
          >
            Buka Inventori
          </Link>
        </div>
      )}

      {/* Active Work Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-sm tracking-tight text-zinc-900">
              Pekerjaan Servis Berjalan
            </h2>
            <p className="text-xs text-zinc-500">Antrean motor yang sedang berada di stall mekanik</p>
          </div>
          <Link
            to="/services"
            className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 group"
          >
            <span>Semua Servis</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {data?.recentActiveServices?.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-xs">
              Tidak ada servis aktif saat ini. Stall mekanik siap menerima order baru.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">No. Order</th>
                  <th className="py-2.5 px-4 font-medium">Kendaraan / Plat</th>
                  <th className="py-2.5 px-4 font-medium">Pelanggan & Keluhan</th>
                  <th className="py-2.5 px-4 font-medium">Mekanik</th>
                  <th className="py-2.5 px-4 font-medium text-center">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Perkiraan Biaya</th>
                  <th className="py-2.5 px-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data?.recentActiveServices?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <PlateBadge plate={order.vehicle?.plateNumber} size="sm" />
                        <span className="text-zinc-700 font-medium truncate max-w-[120px]">
                          {order.vehicle?.brand} {order.vehicle?.model}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-zinc-900 truncate">
                        {order.customer?.name || 'Pelanggan Umum'}
                      </div>
                      {order.complaints && (
                        <div className="text-[11px] text-zinc-500 truncate italic">
                          "{order.complaints}"
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 font-medium">
                      {order.mechanic?.name || <span className="text-zinc-400 italic">Belum assign</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={order.status} type="service" />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 tabular-nums">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/services/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold transition"
                      >
                        <span>Kelola</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
