import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Sliders,
  Check,
  X,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

export const InventoryList: React.FC = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
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
  const [newStockCount, setNewStockCount] = useState<number | ''>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Create Product Form
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Sparepart');
  const [newUnit, setNewUnit] = useState('Pcs');
  const [newCostPrice, setNewCostPrice] = useState<number | ''>(0);
  const [newSellPrice, setNewSellPrice] = useState<number | ''>(0);
  const [newInitialStock, setNewInitialStock] = useState<number | ''>(0);
  const [newMinStock, setNewMinStock] = useState<number | ''>(5);

  const [actionLoading, setActionLoading] = useState(false);

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
      showToast('error', err.message || 'Gagal memuat inventori');
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
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!adjustReason.trim()) {
      showToast('error', 'Alasan penyesuaian wajib diisi (misal: Stock opname bulanan)');
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch(`/products/${selectedProduct.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          newStock: Number(newStockCount),
          reason: adjustReason,
        }),
      });

      showToast('success', `Stok ${selectedProduct.name} disesuaikan menjadi ${newStockCount} ${selectedProduct.unit}`);
      setShowAdjustModal(false);
      await fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyesuaikan stok');
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

      showToast('success', `Suku cadang "${newName}" berhasil ditambahkan ke katalog`);
      setShowCreateModal(false);
      setNewSku('');
      setNewName('');
      setNewCostPrice(0);
      setNewSellPrice(0);
      setNewInitialStock(0);
      await fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membuat produk');
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
            Katalog Suku Cadang & Inventori
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manajemen persediaan suku cadang, pelacakan mutasi barang keluar/masuk, dan stock opname fisik.
          </p>
        </div>

        {hasRole('OWNER') || hasRole('KASIR') ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-subtle transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Sparepart</span>
          </button>
        ) : null}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-card flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode SKU atau nama suku cadang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              lowStockFilter
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Stok Menipis ({products.filter((p) => p.stock <= p.minStock).length})</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            Memuat data suku cadang...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            Tidak ada produk yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">SKU / Nama Sparepart</th>
                  <th className="py-2.5 px-4 font-medium">Kategori</th>
                  <th className="py-2.5 px-4 font-medium text-right">Harga Beli (HPP)</th>
                  <th className="py-2.5 px-4 font-medium text-right">Harga Jual</th>
                  <th className="py-2.5 px-4 font-medium text-center">Stok Sistem</th>
                  <th className="py-2.5 px-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const isOut = p.stock <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                          {p.sku}
                        </span>
                        <span className="font-semibold text-zinc-900 text-xs">{p.name}</span>
                      </td>

                      <td className="py-3 px-4 text-zinc-600 text-[11px] font-medium">
                        {p.category}
                      </td>

                      <td className="py-3 px-4 text-right text-zinc-500 font-medium tabular-nums">
                        {formatCurrency(Number(p.costPrice))}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-zinc-900 tabular-nums">
                        {formatCurrency(Number(p.sellPrice))}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center font-semibold px-2 py-0.5 rounded text-xs tabular-nums ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] font-medium text-amber-700 mt-0.5 tabular-nums">
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
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          {hasRole('OWNER') && (
                            <button
                              type="button"
                              onClick={() => openAdjustModal(p)}
                              title="Stock Opname Fisik"
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition"
                            >
                              <Sliders className="w-3.5 h-3.5" />
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

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          title="Penyesuaian Fisik (Stock Opname)"
          subtitle={`Produk: ${selectedProduct.name} (${selectedProduct.sku})`}
        >
          <form onSubmit={handleSaveAdjustment} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Stok Sistem:</span>
                <span className="font-semibold text-zinc-900 tabular-nums">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Selisih Stok:</span>
                <span
                  className={`font-semibold tabular-nums ${
                    Number(newStockCount || 0) - selectedProduct.stock >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {Number(newStockCount || 0) - selectedProduct.stock > 0 ? '+' : ''}
                  {Number(newStockCount || 0) - selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Stok Fisik Baru (Hasil Hitung Lapangan):
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={newStockCount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewStockCount(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                }}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-lg font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Alasan Penyesuaian:
              </label>
              <input
                type="text"
                required
                placeholder="misal: Selisih stock opname akhir bulan"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-subtle transition disabled:opacity-40"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Opname'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock Movements Ledger Modal */}
      {selectedProduct && (
        <Modal
          isOpen={showMovementsModal}
          onClose={() => setShowMovementsModal(false)}
          title="Buku Ledger Mutasi Suku Cadang"
          subtitle={`${selectedProduct.sku} • ${selectedProduct.name}`}
          maxWidth="max-w-lg"
        >
          <div className="overflow-y-auto max-h-[60vh] divide-y divide-zinc-100 text-xs pr-1">
            {productMovements.length === 0 ? (
              <div className="py-8 text-center text-zinc-400">Belum ada mutasi tercatat.</div>
            ) : (
              productMovements.map((m) => (
                <div key={m.id} className="py-2.5 flex justify-between items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          m.quantity > 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {m.type}
                      </span>
                      <span className="font-semibold text-zinc-900 tabular-nums">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {selectedProduct.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{m.reason || '-'}</p>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(m.createdAt).toLocaleString('id-ID')} • User: {m.user?.name || '-'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-400 block text-[10px]">Saldo Sisa</span>
                    <span className="font-semibold text-zinc-900 text-xs tabular-nums">
                      {m.balanceAfter} {selectedProduct.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Sparepart ke Katalog"
        subtitle="Daftarkan master item suku cadang baru ke dalam inventori bengkel"
      >
        <form onSubmit={handleCreateProduct} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Kode SKU
              </label>
              <input
                type="text"
                required
                placeholder="OLI-MPX1"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono uppercase font-semibold focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Kategori
              </label>
              <input
                type="text"
                placeholder="Oli Mesin"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Nama Sparepart
            </label>
            <input
              type="text"
              required
              placeholder="misal: Oli AHM MPX 1 0.8L"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Harga Beli HPP (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={newCostPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCostPrice(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-500 tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Harga Jual Eceran (Rp)
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={newSellPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewSellPrice(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-500 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newInitialStock}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewInitialStock(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Satuan
              </label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Min Stok
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newMinStock}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewMinStock(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium tabular-nums"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-subtle transition disabled:opacity-40"
            >
              {actionLoading ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
