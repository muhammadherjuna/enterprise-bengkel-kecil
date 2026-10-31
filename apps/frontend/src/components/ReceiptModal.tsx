import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Info } from 'lucide-react';

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
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('80mm');

  useEffect(() => {
    if (!isOpen) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isOpen]);

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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 !m-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl max-w-sm w-full shadow-modal overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 bg-zinc-50/70">
          <div>
            <h3 className="font-semibold text-zinc-900 text-xs tracking-tight">Struk Kasir Digital</h3>
            <p className="text-[10px] text-zinc-500">Format kertas thermal</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`px-2 py-0.5 rounded-md transition ${
                  paperSize === '58mm' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Printer kasir mini / portable (58mm)"
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2 py-0.5 rounded-md transition ${
                  paperSize === '80mm' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Printer kasir desktop standar (80mm)"
              >
                80mm
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({paperSize})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-200/60 transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Content Printable Area */}
        <div
          className="p-6 overflow-y-auto flex-1 font-mono text-[11px] text-zinc-800 leading-normal"
          id="printable-receipt"
          data-paper={paperSize}
        >
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

        {/* Helper Note for Printer Setup */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Petunjuk:</strong> Pada jendela cetak browser, pastikan <em>Destination</em> memilih printer kasir Anda (bukan <em>Save as PDF</em>) agar tombol otomatis bertuliskan <strong>"Print"</strong>. Kertas thermal asli akan tercetak pas sesuai ukuran roll.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
