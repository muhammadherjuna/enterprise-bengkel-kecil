import React, { useState, useEffect } from 'react';
import { apiFetch, generateIdempotencyKey } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ReceiptModal } from '../../components/ReceiptModal';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  unit: string;
}

export const PosPage: React.FC = () => {
  const { user } = useAuth();

  // Tab: Direct Sale ('DIRECT') or Unpaid Service Settlement ('SERVICE')
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'SERVICE'>('DIRECT');

  // Products & Cart
  const [products, setProducts] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
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
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase())),
  );

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      setError(`Stok barang "${product.name}" habis.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError(`Maksimal stok tercapai untuk "${product.name}" (${product.stock} ${product.unit})`);
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
          name: product.name,
          price: Number(product.sellPrice),
          stock: product.stock,
          quantity: 1,
          unit: product.unit,
        },
      ];
    });
    setError(null);
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
            setError(`Stok hanya ada ${i.stock}`);
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
      setError('Keranjang belanja kosong');
      return;
    }
    if (paymentMethod === 'CASH' && amountPaid < cartTotal) {
      setError('Uang yang dibayarkan kurang dari total belanja');
      return;
    }

    setLoading(true);
    setError(null);

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

      // Reset cart
      setCart([]);
      setCustomerName('');
      setDiscount(0);
      setShowReceipt(true);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Transaksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutService = async () => {
    if (!selectedOrder) {
      setError('Pilih order servis yang ingin dibayar');
      return;
    }
    if (paymentMethod === 'CASH' && amountPaid < Number(selectedOrder.totalAmount)) {
      setError('Uang yang dibayarkan kurang dari total tagihan');
      return;
    }

    setLoading(true);
    setError(null);
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
        items: selectedOrder.items?.map((i: any) => ({
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

      setSelectedOrder(null);
      setShowReceipt(true);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Pembayaran servis gagal');
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
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Kasir & POS</h1>
          <p className="text-xs text-slate-500">Penjualan sparepart langsung dan pelunasan servis</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-200 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('DIRECT');
              setError(null);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'DIRECT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Penjualan Sparepart
          </button>
          <button
            onClick={() => {
              setActiveTab('SERVICE');
              setError(null);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SERVICE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pelunasan Servis</span>
            {unpaidOrders.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unpaidOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Selector or Unpaid Orders list */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'DIRECT' ? (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ketik nama atau kode sparepart..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(p)}
                      className={`p-3 text-left rounded-xl border text-xs flex flex-col justify-between transition ${
                        isOutOfStock
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xs active:bg-blue-50'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{p.sku}</span>
                        <span className="font-bold text-slate-900 line-clamp-2 mt-0.5">{p.name}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-extrabold text-blue-700">{formatCurrency(Number(p.sellPrice))}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-500'
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
            /* Unpaid Services Tab */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Pilih Order Servis Belum Lunas</h3>
                <p className="text-xs text-slate-500">Pilih servis yang telah selesai untuk pembayaran kasir</p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {unpaidOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada order servis yang menunggu pembayaran.
                  </div>
                ) : (
                  unpaidOrders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`p-4 cursor-pointer transition flex justify-between items-center ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            <strong>{ord.vehicle?.plateNumber || 'Plat Tanpa Data'}</strong> •{' '}
                            {ord.customer?.name || 'Pelanggan Umum'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Mekanik: {ord.mechanic?.name || '-'}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-blue-700 block">
                            {formatCurrency(Number(ord.totalAmount))}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-600 uppercase">
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

        {/* Right Side: Cart & Cashier Checkout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Rincian Pembayaran</span>
              <span className="text-xs font-semibold text-slate-500">
                Kasir: {user?.name || user?.username}
              </span>
            </h3>

            {activeTab === 'DIRECT' ? (
              /* Direct Sale Items */
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Pelanggan (Opsional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Keranjang kosong. Pilih sparepart di sebelah kiri.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.productId} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-slate-800 block truncate">{item.name}</span>
                          <span className="text-[11px] text-slate-500">
                            {formatCurrency(item.price)} × {item.quantity}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQty(item.productId, parseInt(e.target.value) || 1)
                            }
                            className="w-12 px-1 py-0.5 text-center bg-slate-100 border border-slate-300 rounded font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal & Discount */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Diskon (Rp):</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Selected Service Details */
              <div className="space-y-3">
                {selectedOrder ? (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Order: {selectedOrder.orderNumber}</span>
                      <span>{selectedOrder.vehicle?.plateNumber}</span>
                    </div>
                    <p className="text-slate-500">Pelanggan: {selectedOrder.customer?.name || 'Umum'}</p>
                    <p className="text-slate-500">Mekanik: {selectedOrder.mechanic?.name || '-'}</p>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-700 block mb-1">Item Pekerjaan:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {selectedOrder.items?.map((it: any) => (
                          <li key={it.id}>
                            {it.name} ({it.quantity}x)
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Pilih salah satu order servis di sebelah kiri untuk diproses.
                  </div>
                )}
              </div>
            )}

            {/* Total Display */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-blue-900 uppercase">Total Tagihan</span>
              <span className="text-xl font-black text-blue-900">{formatCurrency(currentTotal)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'TRANSFER', 'QRIS_MANUAL'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                      paymentMethod === m
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer' : 'QRIS Manual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender Input & Change */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700">Uang Diterima (Rp)</label>
                <input
                  type="number"
                  min={currentTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(currentTotal)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
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
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          {formatCurrency(amt)}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Kembalian (AC-08) */}
                <div className="p-3 bg-emerald-50 rounded-xl flex justify-between items-center text-xs font-bold text-emerald-900">
                  <span>Kembalian:</span>
                  <span className="text-sm font-black">{formatCurrency(changeAmount)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={loading || currentTotal <= 0 || (paymentMethod === 'CASH' && amountPaid < currentTotal)}
              onClick={activeTab === 'DIRECT' ? handleCheckoutDirect : handleCheckoutService}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Memproses Transaksi...' : 'Bayar & Cetak Nota'}</span>
            </button>
          </div>
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
