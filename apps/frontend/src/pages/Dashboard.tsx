import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { Link } from 'react-router-dom';
import {
  Wrench,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Beranda Bengkel</h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            Ringkasan operasional dan transaksi bengkel hari ini
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            to="/services/new"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-800 hover:bg-blue-50 font-bold rounded-xl text-xs sm:text-sm shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Servis Baru</span>
          </Link>
          <Link
            to="/pos"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Kasir / POS</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Omzet Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatCurrency(data?.todayRevenue)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {data?.todayTransactionsCount || 0} transaksi berhasil
            </span>
          </div>
        </div>

        {/* Servis Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Servis Aktif</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {data?.activeServicesCount || 0} Motor
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {data?.pendingServicesCount || 0} Menunggu • {data?.inProgressServicesCount || 0} Dikerjakan
            </span>
          </div>
        </div>

        {/* Kas di Kasir */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kas di Kasir</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatCurrency(data?.cashOnHand)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Saldo laci kasir saat ini</span>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stok Menipis</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {data?.lowStockCount || 0} Produk
            </div>
            <Link to="/inventory?lowStock=true" className="text-[11px] text-rose-600 font-semibold hover:underline">
              Periksa inventori &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Warning Alert if Low Stock */}
      {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase text-amber-900 tracking-wider">
              Perhatian: Stok Sparepart Mencapai Batas Minimum
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.lowStockProducts.map((p: any) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-medium text-amber-900 shadow-xs"
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-rose-600 font-bold">
                    ({p.stock} {p.unit})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Active Work Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Servis Sedang Berjalan</h3>
            <p className="text-xs text-slate-500">Antrean motor yang sedang dikerjakan mekanik</p>
          </div>
          <Link
            to="/services"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recentActiveServices?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tidak ada servis aktif saat ini.
            </div>
          ) : (
            data?.recentActiveServices?.map((order: any) => (
              <Link
                key={order.id}
                to={`/services/${order.id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status === 'IN_PROGRESS' ? 'Dikerjakan' : 'Menunggu'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      {order.vehicle?.plateNumber || 'Plat Tanpa Data'}
                    </span>
                    <span>•</span>
                    <span>{order.vehicle?.brand} {order.vehicle?.model}</span>
                    <span>•</span>
                    <span className="text-slate-500">
                      Pelanggan: {order.customer?.name || 'Umum'}
                    </span>
                  </div>
                  {order.complaints && (
                    <p className="text-xs text-slate-500 italic line-clamp-1">
                      "{order.complaints}"
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mekanik: {order.mechanic?.name || 'Belum dipilih'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
