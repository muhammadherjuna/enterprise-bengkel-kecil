import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CreditCard,
  Info,
} from 'lucide-react';

export const FinancePage: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  // Tab: Cash Ledger, Operational Expenses, Estimated Profit
  const [tab, setTab] = useState<'LEDGER' | 'EXPENSES' | 'PROFIT'>('LEDGER');

  // Cash Ledger
  const [currentCashBalance, setCurrentCashBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Expenses
  const [expenses, setExpenses] = useState<any[]>([]);

  // Profit Estimate Report
  const [profitReport, setProfitReport] = useState<any | null>(null);

  // New Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('OPERASIONAL');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDesc, setExpDesc] = useState('');
  const [expRecipient, setExpRecipient] = useState('');
  const [expMethod, setExpMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'LEDGER') {
        const res = await apiFetch<any>('/finance/cash-ledger');
        setCurrentCashBalance(res.currentBalance || 0);
        setTransactions(res.transactions || []);
      } else if (tab === 'EXPENSES') {
        const res = await apiFetch<any[]>('/finance/expenses');
        setExpenses(res || []);
      } else if (tab === 'PROFIT') {
        const res = await apiFetch<any>('/finance/profit-estimate');
        setProfitReport(res);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) {
      showToast('error', 'Nominal pengeluaran harus lebih dari 0');
      return;
    }
    setActionLoading(true);

    try {
      await apiFetch('/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: expCategory,
          amount: Number(expAmount),
          description: expDesc,
          recipient: expRecipient || undefined,
          paymentMethod: expMethod,
        }),
      });

      showToast('success', 'Pengeluaran kas operasional berhasil dicatat');
      setShowExpenseModal(false);
      setExpAmount(0);
      setExpDesc('');
      setExpRecipient('');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mencatat pengeluaran');
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

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Keuangan & Buku Kas Bengkel
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Arus kas masuk dari pembayaran, pengeluaran operasional bengkel, dan analisis estimasi laba kotor.
          </p>
        </div>

        {hasRole('OWNER') && (
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-subtle transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Pengeluaran Kas</span>
          </button>
        )}
      </div>

      {/* Segmented Control */}
      <div className="inline-flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 text-xs font-semibold">
        <button
          onClick={() => setTab('LEDGER')}
          className={`px-3.5 py-1.5 rounded-md transition ${
            tab === 'LEDGER' ? 'bg-white text-zinc-900 shadow-subtle' : 'text-zinc-600'
          }`}
        >
          Buku Kas (Register)
        </button>
        <button
          onClick={() => setTab('EXPENSES')}
          className={`px-3.5 py-1.5 rounded-md transition ${
            tab === 'EXPENSES' ? 'bg-white text-zinc-900 shadow-subtle' : 'text-zinc-600'
          }`}
        >
          Pengeluaran Operasional
        </button>
        {hasRole('OWNER') && (
          <button
            onClick={() => setTab('PROFIT')}
            className={`px-3.5 py-1.5 rounded-md transition ${
              tab === 'PROFIT' ? 'bg-white text-zinc-900 shadow-subtle' : 'text-zinc-600'
            }`}
          >
            Laba Kotor Estimasi (FR-05)
          </button>
        )}
      </div>

      {/* Tab 1: Cash Ledger */}
      {tab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Current Balance Bar */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/90 shadow-card flex items-center justify-between">
            <div>
              <span className="text-xs uppercase text-zinc-500 font-semibold tracking-wider block">
                Total Saldo Kas Fisik (Cash in Drawer)
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-950 mt-1 tabular-nums">
                {formatCurrency(currentCashBalance)}
              </div>
              <span className="text-xs text-zinc-500 mt-0.5 block">
                Uang tunai fisik yang wajib ada di laci kasir saat pergantian shift
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-100 border flex items-center justify-center text-zinc-700">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                Mutasi Buku Kas Masuk & Keluar
              </h3>
              <span className="text-xs text-zinc-500">{transactions.length} mutasi</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-zinc-400 text-xs">Memuat mutasi kas...</div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs">Belum ada transaksi kas tercatat.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {transactions.map((tx) => {
                  const isCashIn = tx.type === 'CASH_IN';
                  return (
                    <div key={tx.id} className="p-3.5 flex justify-between items-center hover:bg-zinc-50/60 text-xs transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded text-[10px] font-bold ${
                              isCashIn
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isCashIn ? 'KAS MASUK' : 'KAS KELUAR'}
                          </span>
                          <span className="font-semibold text-zinc-900">{tx.description}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 block">
                          {new Date(tx.createdAt).toLocaleString('id-ID')} • Operator: {tx.user?.name || '-'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-semibold text-sm block tabular-nums ${
                            isCashIn ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isCashIn ? '+' : '-'}
                          {formatCurrency(Number(tx.amount))}
                        </span>
                        <span className="text-[10px] text-zinc-400 tabular-nums">
                          Saldo Sisa: {formatCurrency(Number(tx.balanceAfter))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Operational Expenses */}
      {tab === 'EXPENSES' && (
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
              Daftar Beban Pengeluaran Kasir
            </h3>
            <span className="text-xs text-zinc-500">{expenses.length} pengeluaran</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs">Memuat data pengeluaran...</div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">Belum ada catatan pengeluaran operasional.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-3.5 flex justify-between items-center hover:bg-zinc-50/60 text-xs transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-900">{exp.expenseNumber}</span>
                      <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-zinc-700">{exp.description}</p>
                    <span className="text-[11px] text-zinc-500 block">
                      Tgl: {new Date(exp.date).toLocaleDateString('id-ID')} • Penerima: {exp.recipient || '-'} • Petugas: {exp.user?.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-rose-600 text-sm block tabular-nums">
                      {formatCurrency(Number(exp.amount))}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      Via {exp.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Estimated Gross Profit Report (FR-05) */}
      {tab === 'PROFIT' && profitReport && (
        <div className="space-y-4">
          {/* PRD Regulatory Note (FR-05) */}
          <div className="p-3.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-700 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 block mb-0.5">Ketentuan Laporan PRD 1.1 (FR-05):</strong>
              Perhitungan Laba Kotor Estimasi: <code>Pendapatan Bersih (Jasa + Suku Cadang) - HPP Suku Cadang berdasarkan snapshot biaya saat transaksi</code>.
              Laporan ini <strong>tidak menggunakan label laba bersih</strong> karena sistem ERP MVP belum memperhitungkan amortisasi, depresiasi aset, dan double-entry ledger penuh.
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card">
              <span className="text-xs uppercase text-zinc-500 font-semibold tracking-wider block">
                Total Pendapatan (Gross)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                {formatCurrency(profitReport.totalRevenue)}
              </div>
              <div className="mt-2 text-xs text-zinc-500 space-y-0.5 tabular-nums text-[11px]">
                <div>• Jasa: {formatCurrency(profitReport.serviceRevenue)}</div>
                <div>• Suku Cadang: {formatCurrency(profitReport.partsRevenue)}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card">
              <span className="text-xs uppercase text-zinc-500 font-semibold tracking-wider block">
                HPP Suku Cadang (COGS)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1 tabular-nums">
                {formatCurrency(profitReport.partsCOGS)}
              </div>
              <span className="text-[11px] text-zinc-400 block mt-2">
                Total modal beli sparepart & oli keluar
              </span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-900 shadow-card bg-zinc-950 text-white">
              <span className="text-xs uppercase text-zinc-400 font-semibold tracking-wider block">
                Laba Kotor Estimasi
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                {formatCurrency(profitReport.estimatedGrossProfit)}
              </div>
              <span className="text-[11px] text-zinc-400 block mt-2">
                Pendapatan dikurangi HPP sparepart
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-zinc-900 block">Total Pengeluaran Kas Operasional:</span>
              <span className="text-zinc-500 text-[11px]">Listrik, air, konsumsi mekanik, dan perlengkapan bengkel</span>
            </div>
            <span className="text-base font-semibold text-rose-600 tabular-nums">
              {formatCurrency(profitReport.totalExpenses)}
            </span>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Catat Pengeluaran Operasional"
        subtitle="Pencatatan kas keluar harian bengkel untuk pembukuan laba-rugi"
      >
        <form onSubmit={handleCreateExpense} className="space-y-3">
          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Kategori Biaya
            </label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
            >
              <option value="OPERASIONAL">Operasional Umum</option>
              <option value="LISTRIK_AIR">Listrik & Air Bengkel</option>
              <option value="KONSUMSI">Konsumsi Mekanik</option>
              <option value="ALAT_BENGKEL">Beli Perkakas / Tooling</option>
              <option value="SEWA_TEMPAT">Sewa Tempat</option>
              <option value="LAINNYA">Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Nominal Pengeluaran (Rp)
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="50000"
              value={expAmount}
              onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-500 tabular-nums"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Keterangan / Keperluan
            </label>
            <input
              type="text"
              required
              placeholder="misal: Beli sabun cuci tangan & oli pembersih rantai"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Penerima Dana (Opsional)
            </label>
            <input
              type="text"
              placeholder="Nama toko / penerima uang"
              value={expRecipient}
              onChange={(e) => setExpRecipient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Metode Pembayaran
            </label>
            <select
              value={expMethod}
              onChange={(e) => setExpMethod(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
            >
              <option value="CASH">Tunai (Potong dari laci kas register)</option>
              <option value="TRANSFER">Transfer Bank Rekening</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-subtle"
            >
              {actionLoading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
