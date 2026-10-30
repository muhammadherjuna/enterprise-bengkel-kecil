import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Link } from 'react-router-dom';
import { PlateBadge } from '../../components/PlateBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { Plus, Search, Filter, Wrench, ChevronRight } from 'lucide-react';

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

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Daftar Order Servis
            </h1>
            <span className="font-mono text-xs text-zinc-400">/ WORK ORDERS</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manajemen antrean motor, penugasan mekanik, dan pelacakan pekerjaan bengkel.
          </p>
        </div>

        <Link
          to="/services/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-subtle transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Order Servis</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari plat nomor motor, kode order, atau nama pelanggan..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 outline-none font-medium"
          >
            <option value="">Semua Status Servis</option>
            <option value="PENDING">Menunggu</option>
            <option value="IN_PROGRESS">Dikerjakan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 outline-none font-medium"
          >
            <option value="">Semua Status Bayar</option>
            <option value="UNPAID">Belum Lunas</option>
            <option value="PAID">Lunas</option>
          </select>
        </div>
      </div>

      {/* High-Density Work Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-mono">
            Memuat data servis...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            Tidak ada order servis yang sesuai filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">No. Order & Tgl</th>
                  <th className="py-2.5 px-4 font-medium">Kendaraan / Plat</th>
                  <th className="py-2.5 px-4 font-medium">Pelanggan & Keluhan</th>
                  <th className="py-2.5 px-4 font-medium">Mekanik</th>
                  <th className="py-2.5 px-4 font-medium text-center">Pekerjaan</th>
                  <th className="py-2.5 px-4 font-medium text-center">Faktur</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Biaya</th>
                  <th className="py-2.5 px-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-zinc-900 block leading-tight">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(order.date).toLocaleDateString('id-ID')}
                      </span>
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
                      <span className="font-medium text-zinc-900 block truncate">
                        {order.customer?.name || 'Pelanggan Umum'}
                      </span>
                      {order.complaints ? (
                        <span className="text-[11px] text-zinc-500 italic block truncate">
                          "{order.complaints}"
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic block">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-zinc-700">
                      {order.mechanic?.name || <span className="text-zinc-400 italic">Belum assign</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={order.status} type="service" />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={order.paymentStatus} type="payment" />
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 tabular-nums">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/services/${order.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold transition"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
