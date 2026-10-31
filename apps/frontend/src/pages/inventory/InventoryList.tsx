import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { CurrencyInput } from '../../components/CurrencyInput';
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
  Sparkles,
} from 'lucide-react';

// Standard Workshop Inventory Presets
const STANDARD_CATEGORIES = [
  'Sparepart',
  'Oli Mesin',
  'Oli Transmisi',
  'Pengereman',
  'Pengapian & Kelistrikan',
  'Transmisi & CVT',
  'Roda & Ban',
  'Filter & Mesin',
  'Aksesoris & Baut',
];

const STANDARD_UNITS = [
  'Pcs',
  'Botol',
  'Set',
  'Liter',
  'Kaleng',
  'Dus',
  'Meter',
  'Roll',
  'Paket',
];

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
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newUnit, setNewUnit] = useState('Pcs');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [newCostPrice, setNewCostPrice] = useState<number | ''>(0);
  const [newSellPrice, setNewSellPrice] = useState<number | ''>(0);
  const [newInitialStock, setNewInitialStock] = useState<number | ''>(0);
  const [newMinStock, setNewMinStock] = useState<number | ''>(5);

  const [actionLoading, setActionLoading] = useState(false);

  // Available unique categories from preset + loaded products
  const availableCategories = useMemo(() => {
    const set = new Set(STANDARD_CATEGORIES);
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

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
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockFilter]);

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

  const resetCreateForm = () => {
    setNewSku('');
    setNewName('');
    setNewCategory('Sparepart');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setNewUnit('Pcs');
    setIsCustomUnit(false);
    setCustomUnitInput('');
    setNewCostPrice(0);
    setNewSellPrice(0);
    setNewInitialStock(0);
    setNewMinStock(5);
  };

  const handleGenerateAutoCode = () => {
    const cat = isCustomCategory ? customCategoryInput : newCategory;
    let prefix = 'BRG';
    const c = (cat || '').toLowerCase();
    if (c.includes('oli')) prefix = 'OLI';
    else if (c.includes('ban') || c.includes('roda')) prefix = 'BAN';
    else if (c.includes('rem')) prefix = 'REM';
    else if (c.includes('busi') || c.includes('pengapian')) prefix = 'BUSI';
    else if (c.includes('transmisi') || c.includes('cvt')) prefix = 'CVT';
    else if (c.includes('filter')) prefix = 'FLT';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNewSku(`${prefix}-${randomSuffix}`);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = (isCustomCategory ? customCategoryInput : newCategory).trim();
    const finalUnit = (isCustomUnit ? customUnitInput : newUnit).trim();

    if (!finalCategory) {
      showToast('error', 'Kategori suku cadang wajib dipilih atau diisi');
      return;
    }
    if (!finalUnit) {
      showToast('error', 'Satuan suku cadang wajib dipilih atau diisi');
      return;
    }

    setActionLoading(true);

    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: newSku.trim().toUpperCase(),
          name: newName.trim(),
          category: finalCategory,
          unit: finalUnit,
          costPrice: Number(newCostPrice),
          sellPrice: Number(newSellPrice),
          initialStock: Number(newInitialStock),
          minStock: Number(newMinStock),
        }),
      });

      showToast('success', `Suku cadang "${newName}" berhasil ditambahkan ke katalog`);
      setShowCreateModal(false);
      resetCreateForm();
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
            placeholder="Cari kode barang atau nama suku cadang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 font-medium outline-none focus:border-zinc-400 focus:bg-white transition"
          >
            <option value="">Semua Kategori</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

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
                  <th className="py-2.5 px-4 font-medium">Kode & Nama Sparepart</th>
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
              <CurrencyInput
                required
                value={newStockCount}
                onChange={(val) => setNewStockCount(val)}
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
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Tambah Sparepart ke Katalog"
        subtitle="Daftarkan master item suku cadang baru ke dalam inventori bengkel"
      >
        <form onSubmit={handleCreateProduct} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase text-zinc-600 font-semibold block">
                  Kode Barang / Part
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAutoCode}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded font-medium transition"
                  title="Klik untuk membuat kode unik otomatis"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Otomatis</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="misal: 08232-2MB atau OLI-MPX1"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono uppercase font-semibold focus:outline-none focus:border-zinc-500"
              />
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                No. part kemasan / barcode, atau klik Otomatis.
              </p>
            </div>
            <div className="min-w-0">
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Kategori
              </label>
              {!isCustomCategory ? (
                <select
                  value={newCategory}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomCategory(true);
                      setCustomCategoryInput('');
                    } else {
                      setNewCategory(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Kategori Baru...</option>
                </select>
              ) : (
                <div className="relative w-full min-w-0">
                  <input
                    type="text"
                    required
                    placeholder="Nama kategori baru..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full min-w-0 pl-2.5 pr-7 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs focus:outline-none focus:border-zinc-500 shadow-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setNewCategory('Sparepart');
                      setCustomCategoryInput('');
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition"
                    title="Batal kategori baru"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Kelompok jenis sparepart di bengkel.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Nama Sparepart
            </label>
            <input
              type="text"
              required
              placeholder="misal: Oli AHM MPX 1 0.8L Bebek/Sport"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
              Nama lengkap yang akan dicetak di struk kasir dan nota pelanggan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Harga Modal / Beli (Rp)
              </label>
              <CurrencyInput
                required
                value={newCostPrice}
                onChange={(val) => setNewCostPrice(val)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-500 tabular-nums"
              />
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Harga kulakan dari distributor/supplier.
              </p>
            </div>
            <div className="min-w-0">
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Harga Jual ke Pelanggan (Rp)
              </label>
              <CurrencyInput
                required
                value={newSellPrice}
                onChange={(val) => setNewSellPrice(val)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-500 tabular-nums"
              />
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Tarif harga yang ditagihkan ke konsumen.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Stok Awal di Rak
              </label>
              <CurrencyInput
                value={newInitialStock}
                onChange={(val) => setNewInitialStock(val)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium tabular-nums"
              />
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Jumlah fisik barang yang ada saat ini.
              </p>
            </div>
            <div className="min-w-0">
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Satuan
              </label>
              {!isCustomUnit ? (
                <select
                  value={newUnit}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCustomUnit(true);
                      setCustomUnitInput('');
                    } else {
                      setNewUnit(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
                >
                  {STANDARD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Lainnya...</option>
                </select>
              ) : (
                <div className="relative w-full min-w-0">
                  <input
                    type="text"
                    required
                    placeholder="Satuan baru..."
                    value={customUnitInput}
                    onChange={(e) => setCustomUnitInput(e.target.value)}
                    className="w-full min-w-0 pl-2.5 pr-7 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs focus:outline-none focus:border-zinc-500 shadow-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomUnit(false);
                      setNewUnit('Pcs');
                      setCustomUnitInput('');
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition"
                    title="Batal satuan baru"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Pcs, Botol, Set, dll.
              </p>
            </div>
            <div className="min-w-0">
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Batas Min Stok
              </label>
              <CurrencyInput
                value={newMinStock}
                onChange={(val) => setNewMinStock(val)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium tabular-nums"
              />
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                Alarm jika stok sisa ≤ nilai ini.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
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
