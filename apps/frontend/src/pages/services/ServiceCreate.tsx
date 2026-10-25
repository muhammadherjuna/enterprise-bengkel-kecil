import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  ArrowLeft,
  User,
  Car,
  FileText,
} from 'lucide-react';

interface SelectedItem {
  id: string;
  itemType: 'SERVICE' | 'PRODUCT';
  serviceId?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
}

export const ServiceCreate: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [mileage, setMileage] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [complaints, setComplaints] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);

  const [items, setItems] = useState<SelectedItem[]>([]);
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS'>('IN_PROGRESS');

  // Master Data
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [mechanicsList, setMechanicsList] = useState<any[]>([]);

  // Picker selection state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load master data
    apiFetch<any[]>('/services').then((res) => setServicesList(res || [])).catch(() => {});
    apiFetch<any[]>('/products').then((res) => setProductsList(res || [])).catch(() => {});
    apiFetch<any[]>('/mechanics').then((res) => setMechanicsList(res?.filter((m) => m.isActive) || [])).catch(() => {});
  }, []);

  const handleAddService = () => {
    if (!selectedServiceId) return;
    const srv = servicesList.find((s) => s.id === selectedServiceId);
    if (!srv) return;

    setItems((prev) => [
      ...prev,
      {
        id: `srv-${Date.now()}-${Math.random()}`,
        itemType: 'SERVICE',
        serviceId: srv.id,
        name: srv.name,
        price: Number(srv.price),
        quantity: 1,
      },
    ]);
    setSelectedServiceId('');
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const prod = productsList.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (prod.stock <= 0) {
      setError(`Stok untuk "${prod.name}" habis (${prod.stock} ${prod.unit})`);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `prod-${Date.now()}-${Math.random()}`,
        itemType: 'PRODUCT',
        productId: prod.id,
        name: prod.name,
        price: Number(prod.sellPrice),
        quantity: 1,
        stock: prod.stock,
      },
    ]);
    setSelectedProductId('');
    setError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleQuantityChange = (id: string, qty: number) => {
    if (qty <= 0) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          if (i.stock !== undefined && qty > i.stock) {
            setError(`Stok "${i.name}" hanya tersedia ${i.stock}`);
            return { ...i, quantity: i.stock };
          }
          return { ...i, quantity: qty };
        }
        return i;
      }),
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - Number(discount || 0));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // AC-04 validation: at least 1 item
    if (items.length === 0) {
      setError('Order servis harus memiliki minimal 1 jasa atau sparepart (AC-04)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        plateNumber: plateNumber.trim().toUpperCase() || undefined,
        brand: brand || 'Honda',
        model: model.trim() || undefined,
        mileage: mileage ? parseInt(mileage, 10) : undefined,
        mechanicId: mechanicId || undefined,
        complaints: complaints.trim() || undefined,
        notes: notes.trim() || undefined,
        discount: Number(discount || 0),
        status,
        items: items.map((i) => ({
          itemType: i.itemType,
          serviceId: i.serviceId,
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      };

      const res = await apiFetch<any>('/service-orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      navigate(`/services/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan order servis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/services')}
          className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Buat Order Servis Baru
          </h1>
          <p className="text-xs text-slate-500">Form satu halaman pencatatan pekerjaan servis</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Kendaraan & Pelanggan (AC-03: Opsional) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <Car className="w-4 h-4 text-blue-600" />
            <span>Data Motor & Pelanggan (Boleh dikosongkan untuk walk-in cepat)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Polisi (Plat)</label>
              <input
                type="text"
                placeholder="misal: B 1234 XYZ"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm uppercase font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Merek & Tipe Motor</label>
              <input
                type="text"
                placeholder="misal: Honda Vario 125"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kilometer (Odometer)</label>
              <input
                type="number"
                placeholder="misal: 15400"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Pelanggan (Opsional)</label>
              <input
                type="text"
                placeholder="Nama pemilik / pembawa motor"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Mekanik</label>
              <select
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Belum Ditentukan --</option>
                {mechanicsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Keluhan Pelanggan</label>
            <input
              type="text"
              placeholder="misal: Tarikan gredeg di putaran bawah, rem depan bunyi"
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Section 2: Jasa & Sparepart (Wajib Minimal 1) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Jasa & Sparepart Yang Dikerjakan</span>
            </div>
            <span className="text-xs text-rose-600 font-semibold">* Minimal 1 item</span>
          </div>

          {/* Quick Item Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Service selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Tambah Jasa:</label>
              <div className="flex gap-2">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                >
                  <option value="">-- Pilih Jasa Bengkel --</option>
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrency(Number(s.price))})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  + Jasa
                </button>
              </div>
            </div>

            {/* Product / Sparepart selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Tambah Sparepart / Oli:</label>
              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                >
                  <option value="">-- Pilih Sparepart / Oli --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - {formatCurrency(Number(p.sellPrice))} (Stok: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  + Barang
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Belum ada item ditambahkan. Pilih jasa atau sparepart di atas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Tipe</th>
                    <th className="py-2">Nama Item</th>
                    <th className="py-2 text-right">Harga</th>
                    <th className="py-2 text-center">Jumlah</th>
                    <th className="py-2 text-right">Subtotal</th>
                    <th className="py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.itemType === 'SERVICE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.itemType === 'SERVICE' ? 'Jasa' : 'Barang'}
                        </span>
                      </td>
                      <td className="py-2 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-14 px-1.5 py-1 text-center bg-slate-100 border border-slate-300 rounded font-semibold"
                        />
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals & Discount */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal Item:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Potongan / Diskon (Rp):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-right font-semibold text-xs"
              />
            </div>
            <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Biaya Servis:</span>
              <span className="text-base text-blue-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Status Pekerjaan Awal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase">Status Pekerjaan:</span>
            <span className="text-xs text-slate-500">
              Pilih langsung 'Dikerjakan' jika motor langsung masuk ke stall mekanik
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                status === 'PENDING'
                  ? 'bg-amber-100 border-amber-400 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Menunggu Antrean
            </button>
            <button
              type="button"
              onClick={() => setStatus('IN_PROGRESS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                status === 'IN_PROGRESS'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Langsung Dikerjakan
            </button>
          </div>
        </div>

        {/* Mobile-Friendly Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 md:static z-30 bg-white md:bg-transparent border-t md:border-t-0 border-slate-200 p-4 md:p-0 shadow-lg md:shadow-none flex items-center justify-between gap-4">
          <div className="md:hidden">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Servis</span>
            <span className="text-sm font-black text-blue-700">{formatCurrency(totalAmount)}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto ml-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan Order...' : 'Simpan Order Servis'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
