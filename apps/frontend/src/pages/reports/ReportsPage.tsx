import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import {
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Printer,
  XCircle,
  ArrowRight,
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
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Laporan Rekonsiliasi Harian
            </h1>
            <span className="font-mono text-xs text-zinc-400">/ RECAP</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit rincian transaksi kasir, omzet per kategori, beban pengeluaran, dan catatan pembatalan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-subtle">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-mono font-semibold text-zinc-800 outline-none bg-transparent"
            />
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-subtle transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {loading && !dailyData ? (
        <div className="p-12 text-center text-zinc-400 text-xs font-mono">
          Menyiapkan lembar rekap harian...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Total Omzet Bersih
              </span>
              <div className="text-lg sm:text-xl font-mono font-bold text-zinc-950 mt-1 tabular-nums">
                {formatCurrency(dailyData?.summary?.totalRevenue)}
              </div>
              <span className="text-[11px] font-mono text-zinc-500 mt-1 block">
                {dailyData?.summary?.transactionCount || 0} transaksi lunas
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Omzet Jasa Servis
              </span>
              <div className="text-lg sm:text-xl font-mono font-bold text-zinc-900 mt-1 tabular-nums">
                {formatCurrency(dailyData?.summary?.serviceRevenue)}
              </div>
              <span className="text-[11px] font-mono text-zinc-500 mt-1 block">Pengerjaan stall</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Penjualan Sparepart POS
              </span>
              <div className="text-lg sm:text-xl font-mono font-bold text-zinc-900 mt-1 tabular-nums">
                {formatCurrency(dailyData?.summary?.saleRevenue)}
              </div>
              <span className="text-[11px] font-mono text-zinc-500 mt-1 block">Penjualan eceran</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Beban Kas Operasional
              </span>
              <div className="text-lg sm:text-xl font-mono font-bold text-rose-600 mt-1 tabular-nums">
                {formatCurrency(dailyData?.summary?.totalExpenses)}
              </div>
              <span className="text-[11px] font-mono text-zinc-500 mt-1 block">Kas register keluar</span>
            </div>
          </div>

          {/* Payment Transactions Table */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="font-bold text-xs uppercase font-mono tracking-wider text-zinc-900">
                Daftar Pembayaran Selesai ({dailyData?.details?.payments?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-zinc-100 text-xs">
              {dailyData?.details?.payments?.length === 0 ? (
                <div className="p-8 text-center text-zinc-400">Tidak ada transaksi pembayaran pada tanggal ini.</div>
              ) : (
                dailyData?.details?.payments?.map((p: any) => (
                  <div key={p.id} className="p-3.5 flex justify-between items-center hover:bg-zinc-50/60 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900">{p.paymentNumber}</span>
                        <span className="bg-zinc-100 text-zinc-700 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border uppercase">
                          {p.method}
                        </span>
                      </div>
                      <p className="text-zinc-600 mt-0.5 text-xs">
                        Ref: {p.serviceOrder ? p.serviceOrder.orderNumber : p.sale?.saleNumber} •{' '}
                        {p.serviceOrder
                          ? `${p.serviceOrder.vehicle?.plateNumber || ''} (${p.serviceOrder.customer?.name || 'Umum'})`
                          : p.sale?.customerName || 'Pelanggan Umum'}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(p.date).toLocaleTimeString('id-ID')} • Kasir: {p.receivedBy?.name}
                      </span>
                    </div>

                    <div className="text-right font-mono font-bold text-sm text-zinc-900 tabular-nums">
                      {formatCurrency(Number(p.amountTotal))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cancellation Transparency Section */}
          {dailyData?.summary?.cancelledCount > 0 && (
            <div className="bg-zinc-50 rounded-xl border border-zinc-300 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs font-mono uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-zinc-600" />
                <span>Transaksi Dibatalkan Hari Ini ({dailyData.summary.cancelledCount})</span>
              </div>
              <p className="text-xs text-zinc-600">
                Audit transparansi: Seluruh pembatalan dicatat dan stok suku cadang dikembalikan ke ledger inventori.
              </p>

              <div className="space-y-1.5 pt-1">
                {dailyData.details.cancelledOrders?.map((ord: any) => (
                  <div key={ord.id} className="p-2.5 bg-white rounded-lg border border-zinc-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-zinc-900">{ord.orderNumber} (Servis)</span>
                      <span className="text-[11px] text-zinc-500 block">
                        Plat: {ord.vehicle?.plateNumber || '-'} • Alasan: {ord.notes || 'Dibatalkan'}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-400 line-through tabular-nums">
                      {formatCurrency(Number(ord.totalAmount))}
                    </span>
                  </div>
                ))}
                {dailyData.details.cancelledSales?.map((s: any) => (
                  <div key={s.id} className="p-2.5 bg-white rounded-lg border border-zinc-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-zinc-900">{s.saleNumber} (Penjualan Langsung)</span>
                      <span className="text-[11px] text-zinc-500 block">Alasan: {s.notes || 'Dibatalkan'}</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-400 line-through tabular-nums">
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
