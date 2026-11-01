import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, generateIdempotencyKey } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ReceiptModal } from '../../components/ReceiptModal';
import { PlateBadge } from '../../components/PlateBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { CurrencyInput } from '../../components/CurrencyInput';
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Clock,
  Printer,
  Banknote,
  ShieldAlert,
  Car,
  User,
  AlertCircle,
} from 'lucide-react';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS_MANUAL'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any>(`/service-orders/${id}`);
      setOrder(res);
      setAmountPaid('');

      const ws = await apiFetch<any>('/workshop').catch(() => null);
      setWorkshop(ws);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat detail servis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoading(true);
    try {
      await apiFetch(`/service-orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('success', `Status diperbarui menjadi ${newStatus}`);
      await fetchDetail();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memperbarui status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!order) return;
    setActionLoading(true);

    const idempotencyKey = generateIdempotencyKey();

    try {
      await apiFetch('/payments', {
        method: 'POST',
        idempotencyKey,
        body: JSON.stringify({
          serviceOrderId: order.id,
          method: paymentMethod,
          amountPaid: Number(amountPaid),
          idempotencyKey,
        }),
      });

      setShowPaymentModal(false);
      showToast('success', 'Pembayaran kasir berhasil diselesaikan');
      await fetchDetail();
      setShowReceiptModal(true);
    } catch (err: any) {
      showToast('error', err.message || 'Pembayaran gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      showToast('error', 'Alasan pembatalan harus diisi');
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/service-orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      showToast('success', 'Order servis berhasil dibatalkan. Stok pembalik telah dikembalikan.');
      setShowCancelModal(false);
      await fetchDetail();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membatalkan order');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin"></div>
        <span className="text-xs font-mono text-zinc-500">Memuat rincian order servis...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs">
        Order servis tidak ditemukan.
      </div>
    );
  }

  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, Number(amountPaid || 0) - Number(order.totalAmount)) : 0;

  const receiptData = {
    workshopName: workshop?.name || 'Bengkel Motor',
    workshopAddress: workshop?.address,
    workshopPhone: workshop?.phone,
    receiptFooter: workshop?.receiptFooter,
    transactionNumber: order.orderNumber,
    date: order.date,
    customerName: order.customer?.name || 'Pelanggan Umum',
    plateNumber: order.vehicle?.plateNumber,
    mechanicName: order.mechanic?.name,
    items: order.items.map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      price: Number(i.price),
      subtotal: Number(i.subtotal),
    })),
    subtotal: Number(order.subtotalServices) + Number(order.subtotalProducts),
    discount: Number(order.discount),
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.payments?.[0]?.method || 'CASH',
    amountPaid: order.payments?.[0] ? Number(order.payments[0].amountPaid) : undefined,
    changeAmount: order.payments?.[0] ? Number(order.payments[0].changeAmount) : undefined,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} type="service" />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Dibuat: {new Date(order.date).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleStatusUpdate('IN_PROGRESS')}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-subtle transition disabled:opacity-50"
            >
              Mulai Pengerjaan
            </button>
          )}

          {order.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-subtle transition disabled:opacity-50"
            >
              Tandai Selesai
            </button>
          )}

          {order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                setPaymentMethod('CASH');
                setAmountPaid('');
                setShowPaymentModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white rounded-lg text-xs font-semibold shadow-sm shadow-emerald-500/25 active:scale-[0.98] transition flex items-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Bayar Kasir</span>
            </button>
          )}

          {order.paymentStatus === 'PAID' && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-3.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shadow-subtle transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Cetak Struk</span>
            </button>
          )}

          {/* Tombol Batalkan:
              - Jika BELUM selesai (PENDING / IN_PROGRESS): Kasir & Owner bisa batalkan (karena pengerjaan fisik belum rampung & sparepart utuh belum terpakai).
              - Jika SUDAH SELESAI (COMPLETED): Kasir TIDAK BISA batalkan (karena oli sudah dituang ke mesin & pengerjaan fisik tuntas). Hanya Owner yang berwenang jika ada kebutuhan void sengketa/kesalahan administratif.
          */}
          {order.status !== 'CANCELLED' && (
            order.status !== 'COMPLETED' ? (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Batalkan
              </button>
            ) : hasRole('OWNER') ? (
              <button
                onClick={() => setShowCancelModal(true)}
                title="Khusus Owner: Pembatalan administratif order yang telah selesai"
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Batalkan (Owner)
              </button>
            ) : null
          )}
        </div>
      </div>

      {/* Info Cards Grid: Motor & Customer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Motor Card */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
              Data Kendaraan
            </span>
            <PlateBadge plate={order.vehicle?.plateNumber} size="sm" />
          </div>
          <div className="text-sm font-bold text-zinc-900">
            {order.vehicle?.brand} {order.vehicle?.model}
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            Odometer Saat Ini:{' '}
            <strong className="text-zinc-800 font-bold">{order.mileage ? `${order.mileage.toLocaleString('id-ID')} km` : '-'}</strong>
          </div>
        </div>

        {/* Pelanggan & Mekanik */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
              Pelanggan & Mekanik
            </span>
            <span className="text-xs font-mono text-zinc-400">ID: {order.customerId?.slice(0, 8) || 'Walk-in'}</span>
          </div>
          <div className="text-sm font-bold text-zinc-900">
            {order.customer?.name || 'Pelanggan Umum'}
          </div>
          <div className="text-xs text-zinc-500">
            Mekanik Penanggung Jawab:{' '}
            <strong className="text-zinc-900 font-semibold">{order.mechanic?.name || 'Belum ditugaskan'}</strong>
          </div>
        </div>
      </div>

      {/* Complaints note */}
      {order.complaints && (
        <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs">
          <span className="font-semibold text-zinc-700 font-mono text-[11px] uppercase block mb-0.5">
            Keluhan Pengendara:
          </span>
          <p className="text-zinc-800 italic whitespace-pre-wrap leading-relaxed">"{order.complaints}"</p>
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h2 className="font-bold text-xs uppercase font-mono tracking-wider text-zinc-900">
            Daftar Jasa Servis & Suku Cadang Terpakai
          </h2>
          <span className="text-xs text-zinc-500">{order.items.length} item</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Tipe</th>
                <th className="py-2.5 px-4">Nama Item Pekerjaan</th>
                <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-zinc-50/50">
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        item.itemType === 'SERVICE'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {item.itemType === 'SERVICE' ? 'Jasa' : 'Barang'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-zinc-900">{item.name}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-zinc-600">
                    {formatCurrency(Number(item.price))}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-zinc-900 tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-zinc-900 tabular-nums">
                    {formatCurrency(Number(item.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal Jasa:</span>
            <span className="tabular-nums font-medium">{formatCurrency(Number(order.subtotalServices))}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal Sparepart:</span>
            <span className="tabular-nums font-medium">{formatCurrency(Number(order.subtotalProducts))}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Potongan Diskon:</span>
              <span className="tabular-nums font-medium">-{formatCurrency(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200">
            <span>TOTAL TAGIHAN:</span>
            <span className="text-base tabular-nums font-bold">{formatCurrency(Number(order.totalAmount))}</span>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Pelunasan Kasir — ${order.orderNumber}`}
        subtitle="Konfirmasi pembayaran tagihan servis motor dan cetak bukti transaksi"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-xl text-white text-center border border-blue-900/60 shadow-sm">
            <span className="text-[11px] uppercase text-blue-300 font-semibold tracking-wider block">
              Total Tagihan
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-0.5 tabular-nums">
              {formatCurrency(Number(order.totalAmount))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-xs uppercase text-zinc-500 font-semibold block">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'TRANSFER', 'QRIS_MANUAL'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(m);
                    if (m !== 'CASH') {
                      setAmountPaid(Number(order.totalAmount));
                    } else {
                      setAmountPaid('');
                    }
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition ${
                    paymentMethod === m
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-subtle'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer' : 'QRIS Manual'}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Tendered */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-2 pt-1 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase text-zinc-500 font-semibold block">
                  Uang Diterima (Rp)
                </label>
                <button
                  type="button"
                  onClick={() => setAmountPaid(Number(order.totalAmount))}
                  className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded transition"
                  title="Klik jika pelanggan membayar dengan uang pas"
                >
                  Uang Pas
                </button>
              </div>
              <CurrencyInput
                placeholder="Ketik uang tunai dari pelanggan..."
                value={amountPaid}
                onChange={(val) => setAmountPaid(val)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-lg font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white tabular-nums"
                autoFocus
              />

              {/* Quick Cash Presets */}
              <div className="flex gap-1.5 flex-wrap">
                {[20000, 50000, 100000, 150000, 200000, 500000].map((amt) => {
                  if (amt >= Number(order.totalAmount)) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountPaid(amt)}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-md tabular-nums transition"
                      >
                        {formatCurrency(amt)}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-600">Uang Kembalian:</span>
                <span className={`font-bold tabular-nums text-sm ${changeAmount > 0 ? 'text-emerald-700' : 'text-zinc-900'}`}>
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={
                actionLoading ||
                (paymentMethod === 'CASH' && (amountPaid === '' || Number(amountPaid) < Number(order.totalAmount)))
              }
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-500/25 transition disabled:opacity-40"
            >
              {actionLoading ? 'Memproses...' : 'Konfirmasi Lunas'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Dialog (Owner Guarded AC-11) */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Batalkan Order Servis"
        subtitle={
          order.status === 'COMPLETED'
            ? 'Pembatalan darurat administratif khusus Owner'
            : 'Pembatalan order dan pengembalian suku cadang ke inventori'
        }
      >
        <div className="space-y-3.5">
          {order.status === 'COMPLETED' ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <strong className="block font-semibold">
                PERINGATAN: Pengerjaan servis motor ini sudah berstatus SELESAI.
              </strong>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Secara fisik, oli dan suku cadang telah terpasang/dituang ke dalam mesin motor pelanggan.
                Pembatalan ini hanya diizinkan untuk koreksi administratif khusus Owner dan akan dicatat lengkap pada audit log.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 leading-relaxed">
              Order servis akan dibatalkan sebelum pengerjaan selesai. Suku cadang fisik yang belum terpakai akan dikembalikan ke inventori via mutasi balik.
            </p>
          )}

          {order.paymentStatus === 'PAID' && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Transaksi Telah Lunas:</strong> Pembatalan akan membalikkan catatan penerimaan kas dan hanya berwenang dilakukan oleh Owner.
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-600 block mb-1 font-semibold">
              Alasan Pembatalan:
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="misal: Pelanggan tidak setuju estimasi biaya tambahan"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500 focus:bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={actionLoading || !cancelReason.trim()}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-subtle transition disabled:opacity-40"
            >
              {actionLoading ? 'Membatalkan...' : 'Konfirmasi Batal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={receiptData}
      />
    </div>
  );
};
