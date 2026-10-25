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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base">Struk Pembayaran</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800" id="printable-receipt">
          {/* Header Bengkel */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-bold uppercase tracking-wider">{receipt.workshopName}</h2>
            {receipt.workshopAddress && <p className="text-[11px] text-slate-600 mt-0.5">{receipt.workshopAddress}</p>}
            {receipt.workshopPhone && <p className="text-[11px] text-slate-600">Telp: {receipt.workshopPhone}</p>}
          </div>

          {/* Info Transaksi */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">No:</span>
              <span className="font-bold">{receipt.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tgl:</span>
              <span>{new Date(receipt.date).toLocaleString('id-ID')}</span>
            </div>
            {receipt.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span>{receipt.customerName}</span>
              </div>
            )}
            {receipt.plateNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">No. Polisi:</span>
                <span className="font-bold">{receipt.plateNumber}</span>
              </div>
            )}
            {receipt.mechanicName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Mekanik:</span>
                <span>{receipt.mechanicName}</span>
              </div>
            )}
          </div>

          {/* Item List */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 pb-1">
                  <th className="py-1 font-medium">Item</th>
                  <th className="py-1 text-center font-medium">Qty</th>
                  <th className="py-1 text-right font-medium">Harga</th>
                  <th className="py-1 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-2 font-medium">{item.name}</td>
                    <td className="py-1.5 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-1.5 text-right text-slate-600">{item.price.toLocaleString('id-ID')}</td>
                    <td className="py-1.5 text-right font-semibold">{item.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
              <span>TOTAL:</span>
              <span>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            {receipt.amountPaid !== undefined && (
              <>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Bayar ({receipt.paymentMethod || 'TUNAI'}):</span>
                  <span>{formatCurrency(receipt.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(receipt.changeAmount || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 text-[11px] text-slate-500 leading-tight">
            <p className="font-semibold text-slate-700">{receipt.receiptFooter || 'Terima kasih atas kunjungan Anda'}</p>
            <p className="mt-1 text-[10px] text-slate-400">BengkelOS • Sistem Operasional Bengkel</p>
          </div>
        </div>
      </div>
    </div>
  );
};
