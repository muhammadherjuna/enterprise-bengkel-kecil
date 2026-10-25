import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
      <WifiOff className="w-4 h-4 animate-pulse flex-shrink-0" />
      <span>
        <strong>Koneksi internet terputus.</strong> Input Anda tersimpan lokal. Transaksi membutuhkan koneksi server (Online-First).
      </span>
    </div>
  );
};
