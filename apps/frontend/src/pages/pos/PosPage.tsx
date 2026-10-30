import React, { useState, useEffect } from 'react';
import { apiFetch, generateIdempotencyKey } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ReceiptModal } from '../../components/ReceiptModal';
import { PlateBadge } from '../../components/PlateBadge';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Wrench,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  unit: string;
}

export const PosPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Tab: Direct Sale ('DIRECT') or Unpaid Service Settlement ('SERVICE')
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'SERVICE'>('DIRECT');

  // Products & Cart
  const [products, setProducts] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0);

  // Unpaid Services
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS_MANUAL'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // State
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadData = async () => {
    try {
      const [prodRes, orderRes, wsRes] = await Promise.all([
        apiFetch<any[]>('/products'),
        apiFetch<any[]>('/service-orders?paymentStatus=UNPAID'),
        apiFetch<any>('/workshop').catch(() => null),
      ]);
      setProducts(prodRes || []);
      setUnpaidOrders(orderRes?.filter((o) => o.status !== 'CANCELLED') || []);
      setWorkshop(wsRes);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category || 'Sparepart')))];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.isActive &&
      (p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchProduct.toLowerCase())));
    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      showToast('error', `Stok barang "${product.name}" habis.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast('error', `Batas stok tercapai (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: Number(product.sellPrice),
          stock: product.stock,
          quantity: 1,
          unit: product.unit,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          if (qty > i.stock) {
            showToast('error', `Stok hanya tersedia ${i.stock}`);
            return { ...i, quantity: i.stock };
          }
          return { ...i, quantity: qty };
        }
        return i;
      }),
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Calculations for Direct Sale
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - Number(discount || 0));

  // Current Bill Target
  const currentTotal = activeTab === 'DIRECT' ? cartTotal : Number(selectedOrder?.totalAmount || 0);

  // Sync default tendered amount
  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setAmountPaid(currentTotal);
    } else if (amountPaid < currentTotal) {
      setAmountPaid(currentTotal);
    }
  }, [currentTotal, paymentMethod]);

  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, amountPaid - currentTotal) : 0;

  const handleCheckoutDirect = async () => {
    if (cart.length === 0) {
      showToast('error', 'Keranjang belanja masih kosong');
      return;
    }
    if (paymentMethod === 'CASH' && amountPaid < cartTotal) {
      showToast('error', 'Uang yang dibayarkan kurang dari total belanja');
      return;
    }

    setLoading(true);
    const idempotencyKey = generateIdempotencyKey();

    try {
      // 1. Create Sale
      const sale = await apiFetch<any>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          discount: Number(discount || 0),
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            price: c.price,
          })),
        }),
      });

      // 2. Process Payment immediately
      const payment = await apiFetch<any>('/payments', {
        method: 'POST',
        idempotencyKey,
        body: JSON.stringify({
          saleId: sale.id,
          method: paymentMethod,
          amountPaid: Number(amountPaid),
          idempotencyKey,
        }),
      });

      // Set receipt data
      setReceiptData({
        workshopName: workshop?.name || 'Bengkel Motor',
        workshopAddress: workshop?.address,
        workshopPhone: workshop?.phone,
        receiptFooter: workshop?.receiptFooter,
        transactionNumber: sale.saleNumber,
        date: new Date().toISOString(),
        customerName: sale.customerName || 'Pelanggan Umum',
        items: cart.map((c) => ({
          name: c.name,
          quantity: c.quantity,
          price: c.price,
          subtotal: c.price * c.quantity,
        })),
        subtotal: cartSubtotal,
        discount: Number(discount || 0),
        totalAmount: cartTotal,
        paymentMethod,
        amountPaid: Number(amountPaid),
        changeAmount,
      });

      showToast('success', `Transaksi ${sale.saleNumber} berhasil diproses.`);
      setCart([]);
      setCustomerName('');
      setDiscount(0);
      setShowReceipt(true);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Transaksi gagal diproses');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutService = async () => {
    if (!selectedOrder) {
      showToast('error', 'Pilih salah satu order servis terlebih dahulu');
      return;
    }
    if (paymentMethod === 'CASH' && amountPaid < Number(selectedOrder.totalAmount)) {
      showToast('error', 'Nominal uang bayar kurang dari total faktur');
      return;
    }

    setLoading(true);
    const idempotencyKey = generateIdempotencyKey();

    try {
      const payment = await apiFetch<any>('/payments', {
        method: 'POST',
        idempotencyKey,
        body: JSON.stringify({
          serviceOrderId: selectedOrder.id,
          method: paymentMethod,
          amountPaid: Number(amountPaid),
          idempotencyKey,
        }),
      });

      setReceiptData({
        workshopName: workshop?.name || 'Bengkel Motor',
        workshopAddress: workshop?.address,
        workshopPhone: workshop?.phone,
        receiptFooter: workshop?.receiptFooter,
        transactionNumber: selectedOrder.orderNumber,
        date: new Date().toISOString(),
        customerName: selectedOrder.customer?.name || 'Pelanggan Umum',
        plateNumber: selectedOrder.vehicle?.plateNumber,
        mechanicName: selectedOrder.mechanic?.name,
        items:
          selectedOrder.items?.map((i: any) => ({
            name: i.name,
            quantity: i.quantity,
            price: Number(i.price),
            subtotal: Number(i.subtotal),
          })) || [],
        subtotal: Number(selectedOrder.subtotalServices) + Number(selectedOrder.subtotalProducts),
        discount: Number(selectedOrder.discount),
        totalAmount: Number(selectedOrder.totalAmount),
        paymentMethod,
        amountPaid: Number(amountPaid),
        changeAmount,
      });

      showToast('success', `Pelunasan servis ${selectedOrder.orderNumber} berhasil.`);
      setSelectedOrder(null);
      setShowReceipt(true);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Pembayaran servis gagal');
    } finally {
      setLoading(false);
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
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Terminal Kasir POS
            </h1>
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">/ REG-01</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pencatatan penjualan suku cadang langsung dan pelunasan invoice servis.
          </p>
        </div>

        {/* Tab Segmented Control */}
        <div className="inline-flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('DIRECT')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'DIRECT'
                ? 'bg-white text-zinc-900 shadow-subtle'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Penjualan Eceran
          </button>
          <button
            onClick={() => setActiveTab('SERVICE')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SERVICE'
                ? 'bg-white text-zinc-900 shadow-subtle'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Pelunasan Servis</span>
            {unpaidOrders.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unpaidOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Split-Screen Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Catalog / Unpaid List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {activeTab === 'DIRECT' ? (
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card p-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari sparepart (Nama, SKU, atau Barcode)..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition font-sans"
                />
              </div>

              {/* Category Pills Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 text-white shadow-subtle'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const inCartItem = cart.find((c) => c.productId === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(p)}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 relative ${
                        isOutOfStock
                          ? 'bg-zinc-50 border-zinc-200/60 opacity-50 cursor-not-allowed'
                          : inCartItem
                          ? 'bg-blue-50/50 border-blue-300 shadow-subtle ring-1 ring-blue-300'
                          : 'bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-subtle active:scale-[0.99]'
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {inCartItem.quantity}
                        </span>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block tracking-wider uppercase">
                          {p.sku}
                        </span>
                        <span className="font-semibold text-zinc-900 text-xs line-clamp-2 mt-0.5 leading-snug">
                          {p.name}
                        </span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-900 tabular-nums">
                          {formatCurrency(Number(p.sellPrice))}
                        </span>
                        <span
                          className={`text-[10px] font-medium tabular-nums ${
                            p.stock <= p.minStock ? 'text-rose-600 font-bold' : 'text-zinc-500'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Unpaid Service Orders Queue */
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/60">
                <span className="text-xs font-semibold text-zinc-700">
                  Antrean Faktur Servis Menunggu Pelunasan
                </span>
                <span className="text-xs text-zinc-500">
                  {unpaidOrders.length} order
                </span>
              </div>

              <div className="divide-y divide-zinc-100 max-h-[560px] overflow-y-auto">
                {unpaidOrders.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400 text-xs">
                    Semua order servis telah lunas atau tidak ada transaksi tertunda.
                  </div>
                ) : (
                  unpaidOrders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`p-3.5 cursor-pointer transition-colors flex justify-between items-center ${
                          isSelected
                            ? 'bg-blue-50/60 border-l-4 border-blue-600'
                            : 'hover:bg-zinc-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-zinc-900">
                              {ord.orderNumber}
                            </span>
                            <PlateBadge plate={ord.vehicle?.plateNumber} size="sm" />
                          </div>
                          <p className="text-xs text-zinc-600 font-medium">
                            {ord.customer?.name || 'Pelanggan Umum'} • {ord.vehicle?.brand}{' '}
                            {ord.vehicle?.model}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Mekanik: {ord.mechanic?.name || 'Belum diisi'} • {ord.items?.length || 0} item pekerjaan
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-semibold text-sm text-zinc-900 block tabular-nums">
                            {formatCurrency(Number(ord.totalAmount))}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                            Belum Lunas
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Ticket / Payment Box (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200/90 shadow-card p-5 space-y-4 sticky top-16">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h2 className="font-bold text-sm text-zinc-900 tracking-tight">
                {activeTab === 'DIRECT' ? 'Tiket Belanja Kasir' : 'Pelunasan Faktur Servis'}
              </h2>
              <span className="text-[11px] text-zinc-400">
                Operator: {user?.name || user?.username}
              </span>
            </div>

            {activeTab === 'DIRECT' && cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-[11px] text-zinc-400 hover:text-rose-600 transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {activeTab === 'DIRECT' ? (
            /* Direct Cart Items List */
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Nama Pelanggan (opsional)..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
                />
              </div>

              {/* Cart List */}
              <div className="divide-y divide-zinc-100 max-h-52 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-xs">
                    Keranjang masih kosong. Pilih item sparepart di katalog sebelah kiri.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-zinc-900 block truncate">{item.name}</span>
                        <span className="text-[11px] text-zinc-500 tabular-nums">
                          {formatCurrency(item.price)} × {item.quantity} {item.unit}
                        </span>
                      </div>

                      {/* Qty Steppers */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-semibold text-xs tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount Input */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                <span>Potongan / Diskon (Rp)</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded font-semibold text-right text-xs focus:outline-none focus:border-zinc-400 tabular-nums"
                />
              </div>
            </div>
          ) : (
            /* Selected Service Invoice Details */
            <div className="space-y-3">
              {selectedOrder ? (
                <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-zinc-900">{selectedOrder.orderNumber}</span>
                    <PlateBadge plate={selectedOrder.vehicle?.plateNumber} size="sm" />
                  </div>
                  <div className="text-zinc-600 text-[11px]">
                    Pelanggan: <strong className="text-zinc-800">{selectedOrder.customer?.name || 'Umum'}</strong> • Mekanik: {selectedOrder.mechanic?.name || '-'}
                  </div>
                  <div className="pt-2 border-t border-zinc-200 space-y-1">
                    <span className="font-semibold text-zinc-700 block text-[11px]">Rincian Transaksi:</span>
                    {selectedOrder.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-[11px] text-zinc-600">
                        <span className="truncate pr-2">• {it.name} ({it.quantity}x)</span>
                        <span className="font-medium tabular-nums">{formatCurrency(Number(it.subtotal))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  Pilih salah satu faktur servis di sebelah kiri untuk diproses pelunasan.
                </div>
              )}
            </div>
          )}

          {/* Grand Total Display */}
          <div className="p-3.5 bg-zinc-900 rounded-lg text-white flex justify-between items-center shadow-subtle">
            <div>
              <span className="text-xs uppercase text-zinc-400 block font-semibold tracking-wider">
                Total Pembayaran
              </span>
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                {formatCurrency(currentTotal)}
              </span>
            </div>
            <span className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">NET TOTAL</span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 tracking-wider block font-semibold">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'TRANSFER', 'QRIS_MANUAL'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition ${
                    paymentMethod === m
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-subtle'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer' : 'QRIS Manual'}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Tender Input & Change */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-2 pt-1 border-t border-zinc-100">
              <label className="text-xs uppercase text-zinc-500 tracking-wider block font-semibold">
                Nominal Uang Diterima (Rp)
              </label>
              <input
                type="number"
                min={currentTotal}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-lg font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white transition tabular-nums"
              />

              {/* Quick Cash Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAmountPaid(currentTotal)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded tabular-nums"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000, 500000].map((amt) => {
                  if (amt >= currentTotal) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountPaid(amt)}
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded tabular-nums"
                      >
                        {formatCurrency(amt)}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Change Output */}
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-600">Uang Kembalian:</span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Checkout Action Button */}
          <button
            type="button"
            disabled={loading || currentTotal <= 0 || (paymentMethod === 'CASH' && amountPaid < currentTotal)}
            onClick={activeTab === 'DIRECT' ? handleCheckoutDirect : handleCheckoutService}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white font-semibold text-xs tracking-wide rounded-lg shadow-subtle transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? 'Memproses Transaksi...' : 'Konfirmasi Bayar & Cetak Nota'}</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receiptData}
      />
    </div>
  );
};
