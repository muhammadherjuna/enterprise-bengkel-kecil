import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, generateIdempotencyKey } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ReceiptModal } from '../../components/ReceiptModal';
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  CreditCard,
  AlertCircle,
  DollarSign,
  User,
  ShieldAlert,
} from 'lucide-react';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS_MANUAL'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);

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
      setAmountPaid(Number(res.totalAmount));

      const ws = await apiFetch<any>('/workshop').catch(() => null);
      setWorkshop(ws);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail servis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch(`/service-orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!order) return;
    setActionLoading(true);
    setError(null);

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
      await fetchDetail();
      setShowReceiptModal(true); // Automatically show receipt upon payment
    } catch (err: any) {
      setError(err.message || 'Pembayaran gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setError('Alasan pembatalan harus diisi');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch(`/service-orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      setShowCancelModal(false);
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Gagal membatalkan order');
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-500">
        Order servis tidak ditemukan.
      </div>
    );
  }

  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, amountPaid - Number(order.totalAmount)) : 0;

  // Prepare receipt data
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {order.orderNumber}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  order.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.status === 'COMPLETED'
                  ? 'Selesai'
                  : order.status === 'IN_PROGRESS'
                  ? 'Dikerjakan'
                  : order.status === 'CANCELLED'
                  ? 'Dibatalkan'
                  : 'Menunggu'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanggal: {new Date(order.date).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleStatusUpdate('IN_PROGRESS')}
              disabled={actionLoading}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              Mulai Dikerjakan
            </button>
          )}

          {order.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={actionLoading}
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              Tandai Selesai
            </button>
          )}

          {order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Bayar Kasir</span>
            </button>
          )}

          {order.paymentStatus === 'PAID' && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
          )}

          {order.status !== 'CANCELLED' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition"
            >
              Batalkan
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Info: Vehicle & Customer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Info Motor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Data Kendaraan
          </span>
          <div className="text-base font-black text-slate-900">
            {order.vehicle?.plateNumber || 'Plat Tanpa Data'}
          </div>
          <p className="text-xs text-slate-600">
            {order.vehicle?.brand} {order.vehicle?.model} {order.vehicle?.year ? `(${order.vehicle.year})` : ''}
          </p>
          <div className="text-xs text-slate-500 pt-1">
            Kilometer: <strong className="text-slate-800">{order.mileage ? `${order.mileage} km` : '-'}</strong>
          </div>
        </div>

        {/* Info Pelanggan & Mekanik */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Pelanggan & Mekanik
          </span>
          <div className="text-base font-bold text-slate-900">
            {order.customer?.name || 'Pelanggan Umum'}
          </div>
          <p className="text-xs text-slate-600">
            Telepon: {order.customer?.phone || '-'}
          </p>
          <div className="text-xs text-slate-500 pt-1">
            Mekanik Penanggung Jawab: <strong className="text-blue-700">{order.mechanic?.name || 'Belum dipilih'}</strong>
          </div>
        </div>
      </div>

      {/* Complaints & Notes */}
      {(order.complaints || order.notes) && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
          {order.complaints && (
            <p className="text-slate-700">
              <strong className="text-slate-900">Keluhan:</strong> {order.complaints}
            </p>
          )}
          {order.notes && (
            <p className="text-slate-500 italic">
              <strong>Catatan:</strong> {order.notes}
            </p>
          )}
        </div>
      )}

      {/* Items Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Rincian Jasa & Sparepart</h3>
          <span className="text-xs text-slate-500">{order.items.length} item</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-4">Tipe</th>
                <th className="py-2.5 px-4">Nama</th>
                <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.itemType === 'SERVICE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.itemType === 'SERVICE' ? 'JASA' : 'SPAREPART'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(Number(item.price))}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(Number(item.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal Jasa:</span>
            <span className="font-semibold">{formatCurrency(Number(order.subtotalServices))}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal Sparepart:</span>
            <span className="font-semibold">{formatCurrency(Number(order.subtotalProducts))}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-xs text-red-600">
              <span>Diskon:</span>
              <span>-{formatCurrency(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>TOTAL TAGIHAN:</span>
            <span className="text-blue-700">{formatCurrency(Number(order.totalAmount))}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold pt-1">
            <span>Status Pembayaran:</span>
            <span
              className={`px-2 py-0.5 rounded ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {order.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Pembayaran Kasir — {order.orderNumber}</h3>

            <div className="p-3 bg-blue-50 rounded-xl text-center space-y-1">
              <span className="text-xs text-blue-700 font-semibold uppercase">Total Tagihan</span>
              <div className="text-2xl font-black text-blue-900">
                {formatCurrency(Number(order.totalAmount))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'TRANSFER', 'QRIS_MANUAL'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m);
                      if (m !== 'CASH') setAmountPaid(Number(order.totalAmount));
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                      paymentMethod === m
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer' : 'QRIS Manual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tendered Amount (Only for Cash) */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Uang Diterima (Rp)</label>
                <input
                  type="number"
                  min={Number(order.totalAmount)}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(Number(order.totalAmount))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000].map((amt) => {
                    if (amt >= Number(order.totalAmount)) {
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmountPaid(amt)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          {formatCurrency(amt)}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Kembalian (AC-08) */}
                <div className="p-3 bg-emerald-50 rounded-xl flex justify-between items-center text-xs font-bold text-emerald-900">
                  <span>Kembalian:</span>
                  <span className="text-sm font-black">{formatCurrency(changeAmount)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={actionLoading || amountPaid < Number(order.totalAmount)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : 'Konfirmasi Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Dialog (AC-11) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Batalkan Order Servis</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Order servis akan dibatalkan. Seluruh sparepart yang sudah dipakai akan dikembalikan ke stok inventori (AC-11).
              {order.paymentStatus === 'PAID' && (
                <strong className="block text-rose-600 mt-1">
                  Transaksi ini telah lunas. Hanya Owner yang berwenang membatalkan transaksi lunas.
                </strong>
              )}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Pembatalan (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="misal: Pelanggan tidak setuju estimasi biaya tambahan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason.trim()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? 'Membatalkan...' : 'Konfirmasi Batal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={receiptData}
      />
    </div>
  );
};
