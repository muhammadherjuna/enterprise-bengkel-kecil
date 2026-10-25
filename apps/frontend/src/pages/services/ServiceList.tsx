import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Wrench, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';

export const ServiceList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);
      if (search) params.set('search', search);

      const res = await apiFetch<any[]>(`/service-orders?${params.toString()}`);
      setOrders(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Menunggu</span>;
      case 'IN_PROGRESS':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Dikerjakan</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Selesai</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Dibatalkan</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    if (status === 'PAID') {
      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">LUNAS</span>;
    }
    if (status === 'CANCELLED') {
      return <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">BATAL</span>;
    }
    return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">BELUM LUNAS</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Daftar Order Servis</h1>
          <p className="text-xs text-slate-500">Pencatatan dan riwayat perbaikan motor bengkel</p>
        </div>
        <Link
          to="/services/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Servis Baru</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari plat motor, nomor order, atau nama pelanggan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            Cari
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
          >
            <option value="">Semua Status Pekerjaan</option>
            <option value="PENDING">Menunggu</option>
            <option value="IN_PROGRESS">Dikerjakan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
          >
            <option value="">Semua Status Bayar</option>
            <option value="UNPAID">Belum Lunas</option>
            <option value="PAID">Lunas</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">
            Memuat daftar servis...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">
            Tidak ada order servis yang sesuai filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/services/${order.id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                    {getPaymentBadge(order.paymentStatus)}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">
                      {order.vehicle?.plateNumber || 'Plat Tanpa Data'}
                    </span>
                    <span>•</span>
                    <span>
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </span>
                    <span>•</span>
                    <span>Pelanggan: {order.customer?.name || 'Umum'}</span>
                  </div>
                  {order.complaints && (
                    <p className="text-xs text-slate-500 italic line-clamp-1">
                      Keluhan: "{order.complaints}"
                    </p>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Tgl: {new Date(order.date).toLocaleDateString('id-ID')} • Mekanik: {order.mechanic?.name || 'Belum dipilih'}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-1">
                    Detail <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
