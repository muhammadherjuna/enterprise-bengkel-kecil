import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Edit,
  Sliders,
  Check,
  X,
  ArrowUpDown,
} from 'lucide-react';

export const InventoryList: React.FC = () => {
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(searchParams.get('lowStock') === 'true');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showMovementsModal, setShowMovementsModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productMovements, setProductMovements] = useState<any[]>([]);

  // Adjustment Form
  const [newStockCount, setNewStockCount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Create Product Form
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Sparepart');
  const [newUnit, setNewUnit] = useState('Pcs');
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newSellPrice, setNewSellPrice] = useState<number>(0);
  const [newInitialStock, setNewInitialStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(5);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (lowStockFilter) params.set('lowStockOnly', 'true');

      const res = await apiFetch<any[]>(`/products?${params.toString()}`);
      setProducts(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, lowStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const openAdjustModal = (product: any) => {
    setSelectedProduct(product);
    setNewStockCount(product.stock);
    setAdjustReason('');
    setError(null);
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!adjustReason.trim()) {
      setError('Alasan penyesuaian wajib diisi (misal: Stock opname bulanan)');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await apiFetch(`/products/${selectedProduct.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          newStock: Number(newStockCount),
          reason: adjustReason,
        }),
      });

      setSuccessMsg(`Stok ${selectedProduct.name} berhasil disesuaikan menjadi ${newStockCount}`);
      setShowAdjustModal(false);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Gagal menyesuaikan stok');
    } finally {
      setActionLoading(false);
    }
  };

  const openMovementsModal = async (product: any) => {
    setSelectedProduct(product);
    setShowMovementsModal(true);
    try {
      const detail = await apiFetch<any>(`/products/${product.id}`);
      setProductMovements(detail.stockMovements || []);
    } catch {
      setProductMovements([]);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: newSku.trim().toUpperCase(),
          name: newName.trim(),
          category: newCategory,
          unit: newUnit,
          costPrice: Number(newCostPrice),
          sellPrice: Number(newSellPrice),
          initialStock: Number(newInitialStock),
          minStock: Number(newMinStock),
        }),
      });

      setSuccessMsg('Produk baru berhasil disimpan ke katalog');
      setShowCreateModal(false);
      // Reset form
      setNewSku('');
      setNewName('');
      setNewCostPrice(0);
      setNewSellPrice(0);
      setNewInitialStock(0);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat produk');
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Inventori & Stok</h1>
          <p className="text-xs text-slate-500">Katalog sparepart, mutasi pergerakan stok, dan stock opname</p>
        </div>

        {hasRole('OWNER') || hasRole('KASIR') ? (
          <button
            onClick={() => {
              setError(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sparepart</span>
          </button>
        ) : null}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari kode SKU atau nama sparepart..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition flex items-center gap-1.5 ${
              lowStockFilter
                ? 'bg-rose-100 border-rose-300 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Hanya Stok Menipis</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Memuat katalog sparepart...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada produk yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">SKU / Nama</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Beli (HPP)</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Stok Fisik</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-400 text-[10px] block">{p.sku}</span>
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">{p.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-medium">
                        {formatCurrency(Number(p.costPrice))}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatCurrency(Number(p.sellPrice))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                            isLow
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-rose-600 font-semibold mt-0.5">
                            Min: {p.minStock}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openMovementsModal(p)}
                            title="Riwayat Mutasi Stok"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {hasRole('OWNER') && (
                            <button
                              type="button"
                              onClick={() => openAdjustModal(p)}
                              title="Stock Opname / Penyesuaian"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal (Owner Only) */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Stock Opname / Penyesuaian</h3>
            <p className="text-xs text-slate-600">
              Ubah stok fisik untuk: <strong className="text-slate-900">{selectedProduct.name}</strong>
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Stok Sistem Saat Ini:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Selisih:</span>
                  <span
                    className={`text-sm font-bold ${
                      newStockCount - selectedProduct.stock >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {newStockCount - selectedProduct.stock > 0 ? '+' : ''}
                    {newStockCount - selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stok Fisik Baru (Hasil Hitung Manual):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockCount}
                  onChange={(e) => setNewStockCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penyesuaian (Wajib Diisi):
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Selisih stock opname akhir bulan / barang rusak"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movements Ledger Modal */}
      {showMovementsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Mutasi Stok</h3>
                <span className="text-xs text-slate-500">{selectedProduct.name}</span>
              </div>
              <button onClick={() => setShowMovementsModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {productMovements.length === 0 ? (
                <div className="p-6 text-center text-slate-400">Belum ada mutasi stok tercatat.</div>
              ) : (
                productMovements.map((m) => (
                  <div key={m.id} className="py-2.5 flex justify-between items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                            m.quantity > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.type}
                        </span>
                        <span className="font-bold text-slate-900">
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {selectedProduct.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.reason || '-'}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.createdAt).toLocaleString('id-ID')} • User: {m.user?.name || '-'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Sisa Stok</span>
                      <span className="font-black text-slate-800 text-sm">{m.balanceAfter}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Sparepart Baru</h3>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: OLI-CASTROL"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    placeholder="misal: Oli Mesin"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sparepart</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Oli Castrol Power 1 10W-40 0.8L"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Beli (HPP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newSellPrice}
                    onChange={(e) => setNewSellPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batas Min</label>
                  <input
                    type="number"
                    min="0"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
