import React from 'react';

export type ServiceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'CANCELLED';

interface StatusBadgeProps {
  status: ServiceStatus | PaymentStatus | string;
  type?: 'service' | 'payment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'service' }) => {
  if (type === 'service') {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Menunggu
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Dikerjakan
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Selesai
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Batal
          </span>
        );
      default:
        return <span className="text-xs text-zinc-600">{status}</span>;
    }
  }

  // Payment status
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Lunas
        </span>
      );
    case 'UNPAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Belum Bayar
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
          Batal
        </span>
      );
    default:
      return <span className="text-xs">{status}</span>;
  }
};
