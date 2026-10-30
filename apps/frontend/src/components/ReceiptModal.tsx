import React from 'react';
import { X, Printer } from 'lucide-react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ReceiptData {
  workshopName: string;
  workshopAddress?: string;
  workshopPhone?: string;
  receiptFooter?: string;
  transactionNumber: string;
  date: string;
  customerName?: string;
  plateNumber?: string;
  mechanicName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: string;
  amountPaid?: number;
  changeAmount?: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-modal overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 bg-zinc-50/70">
          <h3 className="font-semibold text-zinc-900 text-xs tracking-tight">Struk Kasir Digital</h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Thermal</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-200/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Content Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-[11px] text-zinc-800 leading-normal" id="printable-receipt">
          {/* Header Bengkel */}
          <div className="text-center pb-3 border-b border-dashed border-zinc-300">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">{receipt.workshopName}</h2>
            {receipt.workshopAddress && (
              <p className="text-[10px] text-zinc-600 mt-0.5 leading-snug">{receipt.workshopAddress}</p>
            )}
            {receipt.workshopPhone && (
              <p className="text-[10px] text-zinc-600">Telp: {receipt.workshopPhone}</p>
            )}
          </div>

          {/* Info Transaksi */}
          <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">NO. TRX:</span>
              <span className="font-bold text-zinc-900">{receipt.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TANGGAL:</span>
              <span>{new Date(receipt.date).toLocaleString('id-ID')}</span>
            </div>
            {receipt.customerName && (
              <div className="flex justify-between">
                <span className="text-zinc-500">PELANGGAN:</span>
                <span className="font-semibold text-zinc-900">{receipt.customerName}</span>
              </div>
            )}
            {receipt.plateNumber && (
              <div className="flex justify-between">
                <span className="text-zinc-500">NO. POLISI:</span>
                <span className="font-bold tracking-wider text-zinc-900">{receipt.plateNumber}</span>
              </div>
            )}
            {receipt.mechanicName && (
              <div className="flex justify-between">
                <span className="text-zinc-500">MEKANIK:</span>
                <span>{receipt.mechanicName}</span>
              </div>
            )}
          </div>

          {/* Item List */}
          <div className="py-2.5 border-b border-dashed border-zinc-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 pb-1 text-[10px]">
                  <th className="py-1 font-semibold">ITEM / DESKRIPSI</th>
                  <th className="py-1 text-center font-semibold">QTY</th>
                  <th className="py-1 text-right font-semibold">HARGA</th>
                  <th className="py-1 text-right font-semibold">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {receipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-2 font-medium text-zinc-900">{item.name}</td>
                    <td className="py-1.5 text-center text-zinc-600">{item.quantity}</td>
                    <td className="py-1.5 text-right tabular-nums text-zinc-600">{item.price.toLocaleString('id-ID')}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums text-zinc-900">{item.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">SUBTOTAL</span>
              <span className="tabular-nums">{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>DISKON</span>
                <span className="tabular-nums">-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-zinc-200 text-zinc-900">
              <span>TOTAL AKHIR</span>
              <span className="tabular-nums">{formatCurrency(receipt.totalAmount)}</span>
            </div>
            {receipt.amountPaid !== undefined && (
              <>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-500">BAYAR ({receipt.paymentMethod || 'TUNAI'})</span>
                  <span className="tabular-nums">{formatCurrency(receipt.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900">
                  <span>KEMBALIAN</span>
                  <span className="tabular-nums">{formatCurrency(receipt.changeAmount || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-[10px] text-zinc-500 space-y-1">
            <p className="font-medium text-zinc-700">{receipt.receiptFooter || 'Garansi pengerjaan 7 hari kerja. Terima kasih.'}</p>
            <p className="text-[9px] text-zinc-400">BengkelOS • Sistem Operasional Bengkel Terpadu</p>
          </div>
        </div>
      </div>
    </div>
  );
};
