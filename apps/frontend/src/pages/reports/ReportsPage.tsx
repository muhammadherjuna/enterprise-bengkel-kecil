import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import {
  FileText,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Download,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [dailyData, setDailyData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyReport = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/reports/daily?date=${dateStr}`);
      setDailyData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport(selectedDate);
  }, [selectedDate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan Operasional
          </h1>
          <p className="text-xs text-slate-500">
            Rekap transaksi harian, arus kas masuk/keluar, dan audit pembatalan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {loading && !dailyData ? (
        <div className="p-12 text-center text-slate-400 text-xs">Memuat laporan...</div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Omzet</span>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {formatCurrency(dailyData?.summary?.totalRevenue)}
              </div>
              <span className="text-[10px] text-slate-500">
                {dailyData?.summary?.transactionCount || 0} transaksi lunas
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Omzet Servis</span>
              <div className="text-lg sm:text-xl font-black text-blue-700 mt-1">
                {formatCurrency(dailyData?.summary?.serviceRevenue)}
              </div>
              <span className="text-[10px] text-slate-500">Jasa & sparepart pengerjaan</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Penjualan Langsung</span>
              <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                {formatCurrency(dailyData?.summary?.saleRevenue)}
              </div>
              <span className="text-[10px] text-slate-500">POS sparepart eceran</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Pengeluaran Kas</span>
              <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">
                {formatCurrency(dailyData?.summary?.totalExpenses)}
              </div>
              <span className="text-[10px] text-slate-500">Biaya operasional kasir</span>
            </div>
          </div>

          {/* Payments Detail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">
                Rincian Pembayaran Masuk ({dailyData?.details?.payments?.length || 0})
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {dailyData?.details?.payments?.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Tidak ada pembayaran pada tanggal ini.</div>
              ) : (
                dailyData?.details?.payments?.map((p: any) => (
                  <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.paymentNumber}</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {p.method}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        Ref: {p.serviceOrder ? p.serviceOrder.orderNumber : p.sale?.saleNumber} •{' '}
                        {p.serviceOrder
                          ? `${p.serviceOrder.vehicle?.plateNumber || ''} (${p.serviceOrder.customer?.name || 'Umum'})`
                          : p.sale?.customerName || 'Pelanggan Umum'}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.date).toLocaleTimeString('id-ID')} • Kasir: {p.receivedBy?.name}
                      </span>
                    </div>

                    <div className="text-right font-black text-sm text-slate-900">
                      {formatCurrency(Number(p.amountTotal))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cancellation Transparency (PRD Section 5 / FR-06) */}
          {dailyData?.summary?.cancelledCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <XCircle className="w-4 h-4" />
                <span>Transaksi Dibatalkan Pada Tanggal Ini ({dailyData.summary.cancelledCount})</span>
              </div>
              <p className="text-xs text-rose-700">
                Pembatalan transaksi tercatat transparan dan stok barang telah dikembalikan secara otomatis.
              </p>

              <div className="space-y-1.5">
                {dailyData.details.cancelledOrders?.map((ord: any) => (
                  <div key={ord.id} className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">{ord.orderNumber} (Servis)</span>
                      <p className="text-[11px] text-slate-500">
                        {ord.vehicle?.plateNumber} • {ord.notes || 'Dibatalkan'}
                      </p>
                    </div>
                    <span className="font-bold text-rose-600 line-through">
                      {formatCurrency(Number(ord.totalAmount))}
                    </span>
                  </div>
                ))}
                {dailyData.details.cancelledSales?.map((s: any) => (
                  <div key={s.id} className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900">{s.saleNumber} (Penjualan Langsung)</span>
                      <p className="text-[11px] text-slate-500">{s.notes || 'Dibatalkan'}</p>
                    </div>
                    <span className="font-bold text-rose-600 line-through">
                      {formatCurrency(Number(s.totalAmount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
