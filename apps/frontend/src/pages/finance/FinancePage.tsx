import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
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
} from 'lucide-react';

export const FinancePage: React.FC = () => {
  const { hasRole } = useAuth();

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
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || 'Gagal memuat data keuangan');
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
      setError('Nominal pengeluaran harus lebih dari 0');
      return;
    }
    setActionLoading(true);
    setError(null);

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

      setShowExpenseModal(false);
      setExpAmount(0);
      setExpDesc('');
      setExpRecipient('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pengeluaran');
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
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Keuangan Sederhana
          </h1>
          <p className="text-xs text-slate-500">
            Arus kas laci kasir, pencatatan pengeluaran, dan estimasi laba kotor
          </p>
        </div>

        {hasRole('OWNER') && (
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran (Kas Keluar)</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-200 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setTab('LEDGER')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition ${
            tab === 'LEDGER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Buku Kas (Ledger)
        </button>
        <button
          onClick={() => setTab('EXPENSES')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition ${
            tab === 'EXPENSES' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Daftar Pengeluaran
        </button>
        {hasRole('OWNER') && (
          <button
            onClick={() => setTab('PROFIT')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition ${
              tab === 'PROFIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Laba Kotor Estimasi
          </button>
        )}
      </div>

      {/* Tab 1: Cash Ledger */}
      {tab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Current Balance Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
                Saldo Kas Saat Ini (Cash on Hand)
              </span>
              <div className="text-2xl sm:text-3xl font-black mt-1">
                {formatCurrency(currentCashBalance)}
              </div>
              <span className="text-xs text-emerald-100">Uang tunai fisik yang ada di register kasir</span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Riwayat Transaksi Kas</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat mutasi kas...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Belum ada transaksi kas tercatat.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isCashIn = tx.type === 'CASH_IN';
                  return (
                    <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-md ${
                              isCashIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isCashIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-bold text-slate-800">{tx.description}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase">
                            {tx.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleString('id-ID')} • Petugas: {tx.user?.name || '-'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            isCashIn ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCashIn ? '+' : '-'}
                          {formatCurrency(Number(tx.amount))}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Saldo: {formatCurrency(Number(tx.balanceAfter))}
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

      {/* Tab 2: Expenses */}
      {tab === 'EXPENSES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Pengeluaran Bengkel</h3>
            <span className="text-xs text-slate-500">{expenses.length} catatan</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat pengeluaran...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Belum ada catatan pengeluaran.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{exp.expenseNumber}</span>
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-slate-600">{exp.description}</p>
                    <div className="text-[11px] text-slate-400">
                      Tgl: {new Date(exp.date).toLocaleDateString('id-ID')} • Penerima: {exp.recipient || '-'} • Oleh: {exp.user?.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-rose-600 text-sm block">
                      {formatCurrency(Number(exp.amount))}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
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
          {/* Note Banner Required by PRD Section 5 / FR-05 */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
            <strong className="block font-bold mb-1">Catatan Penting PRD 1.1 (FR-05):</strong>
            Laporan laba kotor estimasi menggunakan perhitungan: <em>Pendapatan (Jasa + Sparepart) dikurangi HPP Sparepart berdasarkan snapshot biaya saat transaksi</em>.
            Laporan ini <strong>tidak boleh diberi label laba bersih</strong> karena sistem MVP belum memperhitungkan amortisasi, penyusutan alat, dan beban akuntansi double-entry penuh.
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Pendapatan (Revenue)
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(profitReport.totalRevenue)}
              </div>
              <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                <div>• Jasa: {formatCurrency(profitReport.serviceRevenue)}</div>
                <div>• Sparepart: {formatCurrency(profitReport.partsRevenue)}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                HPP Sparepart Terjual (COGS)
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(profitReport.partsCOGS)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-2">
                Total modal beli sparepart & oli yang keluar
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/30">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Laba Kotor Estimasi
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
                {formatCurrency(profitReport.estimatedGrossProfit)}
              </div>
              <span className="text-[11px] text-blue-600 block mt-2">
                Pendapatan dikurangi HPP sparepart
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-slate-800 block">Total Pengeluaran Kas Operasional:</span>
              <span className="text-slate-500">Biaya listrik, air, konsumsi mekanik, dll.</span>
            </div>
            <span className="text-base font-black text-rose-600">
              {formatCurrency(profitReport.totalExpenses)}
            </span>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Catat Pengeluaran Operasional</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Pengeluaran</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                >
                  <option value="OPERASIONAL">Operasional Umum</option>
                  <option value="LISTRIK_AIR">Listrik & Air Bengkel</option>
                  <option value="KONSUMSI">Konsumsi & Makan Mekanik</option>
                  <option value="ALAT_BENGKEL">Beli Perkakas / Alat Bengkel</option>
                  <option value="SEWA_TEMPAT">Sewa Tempat</option>
                  <option value="LAINNYA">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="50000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Keperluan</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Beli sabun cuci tangan & kopi mekanik"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penerima Uang (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nama toko / penerima uang"
                  value={expRecipient}
                  onChange={(e) => setExpRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                >
                  <option value="CASH">Tunai (Potong dari laci kasir)</option>
                  <option value="TRANSFER">Transfer Bank</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
