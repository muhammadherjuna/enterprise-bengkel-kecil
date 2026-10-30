import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <aside
      role="alert"
      className="bg-zinc-900 text-zinc-100 border-b border-zinc-800 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 shadow-subtle"
    >
      <div className="flex items-center gap-2 max-w-2xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-zinc-200">
            <strong className="text-white">Offline Mode.</strong> Transaksi membutuhkan koneksi server. Data formulir aman tersimpan di memori browser.
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-mono transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Cek Ulang</span>
        </button>
      </div>
    </aside>
  );
};
