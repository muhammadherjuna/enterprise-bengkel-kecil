import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  Wrench,
  Package,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Car,
  User,
  Info,
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
  const { showToast } = useToast();

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
  const [discount, setDiscount] = useState<number | ''>(0);

  const [items, setItems] = useState<SelectedItem[]>([]);
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS'>('IN_PROGRESS');

  // Master Data
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [mechanicsList, setMechanicsList] = useState<any[]>([]);

  // Picker selection state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      showToast('error', `Stok barang "${prod.name}" habis (${prod.stock} ${prod.unit})`);
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
            showToast('error', `Stok "${i.name}" hanya tersedia ${i.stock}`);
            return { ...i, quantity: i.stock };
          }
          return { ...i, quantity: qty };
        }
        return i;
      }),
    );
  };

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

    // AC-04 validation: at least 1 item
    if (items.length === 0) {
      showToast('error', 'Order servis harus memiliki minimal 1 jasa atau sparepart (AC-04)');
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

      showToast('success', `Order servis ${res.orderNumber} berhasil dibuat.`);
      navigate(`/services/${res.id}`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan order servis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => navigate('/services')}
          className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Formulir Intake Servis Baru
          </h1>
          <p className="text-xs text-zinc-500">
            Pencatatan data kendaraan, keluhan pemilik, jasa servis, dan estimasi pemakaian sparepart.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Kendaraan & Pelanggan */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/90 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-zinc-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                1. Identitas Kendaraan & Pelanggan (AC-03: Opsional)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Boleh dikosongkan untuk walk-in cepat</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 uppercase mb-1">
                Plat Nomor Motor
              </label>
              <input
                type="text"
                placeholder="B 1234 XYZ"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono font-bold uppercase placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-600 uppercase mb-1">
                Tipe & Model Motor
              </label>
              <input
                type="text"
                placeholder="misal: Vario 125 FI"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-600 uppercase mb-1">
                Kilometer (Odo)
              </label>
              <input
                type="number"
                placeholder="15000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 uppercase mb-1">
                Nama Pelanggan (Pemilik)
              </label>
              <input
                type="text"
                placeholder="Pelanggan Umum"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-600 uppercase mb-1">
                Penugasan Mekanik
              </label>
              <select
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none focus:border-zinc-500"
              >
                <option value="">-- Belum Ditentukan (Antrean Bebas) --</option>
                {mechanicsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-600 uppercase mb-1">
              Keluhan Pengendara
            </label>
            <input
              type="text"
              placeholder="misal: Rem depan bunyi mendecit, ganti oli mesin rutin"
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Section 2: Jasa & Sparepart Selector */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/90 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-zinc-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                2. Rincian Pekerjaan Jasa & Suku Cadang (AC-04: Min. 1 Item)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-rose-600 font-semibold">* Wajib Diisi</span>
          </div>

          {/* Quick Selectors Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200/80">
            {/* Service selector */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-600 uppercase block font-semibold">
                + Tambah Jasa Servis:
              </span>
              <div className="flex gap-2">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-xs outline-none"
                >
                  <option value="">-- Pilih Katalog Jasa --</option>
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrency(Number(s.price))})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Product selector */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-600 uppercase block font-semibold">
                + Tambah Sparepart / Oli:
              </span>
              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-xs outline-none"
                >
                  <option value="">-- Pilih Sparepart --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - {formatCurrency(Number(p.sellPrice))} (Stok: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-lg">
              Belum ada item ditambahkan. Pilih jasa atau suku cadang di panel atas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                    <th className="py-2 px-3">Tipe</th>
                    <th className="py-2 px-3">Nama Pekerjaan / Barang</th>
                    <th className="py-2 px-3 text-right">Harga Satuan</th>
                    <th className="py-2 px-3 text-center">Jumlah</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                    <th className="py-2 px-3 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            item.itemType === 'SERVICE'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.itemType === 'SERVICE' ? 'Jasa' : 'Barang'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-900">{item.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-600">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 px-1 py-0.5 text-center font-mono bg-zinc-100 border border-zinc-300 rounded font-semibold text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pricing Breakdown Summary */}
          <div className="bg-zinc-50 p-4 rounded-lg space-y-2 border border-zinc-200/80 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal Pekerjaan:</span>
              <span className="font-mono font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600">
              <span>Potongan Diskon (Rp):</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setDiscount(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                }}
                className="w-24 px-2 py-0.5 bg-white border border-zinc-300 rounded text-right font-mono font-semibold text-xs outline-none"
              />
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-200">
              <span>Total Estimasi Biaya:</span>
              <span className="font-mono text-base text-zinc-950 tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Status Awal */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/90 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-zinc-700">Status Pekerjaan:</span>
            <p className="text-xs text-zinc-500">Pilih 'Dikerjakan' jika motor langsung masuk ke bay mekanik.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                status === 'PENDING'
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-subtle'
                  : 'bg-white border-zinc-200 text-zinc-700'
              }`}
            >
              Menunggu Antrean
            </button>
            <button
              type="button"
              onClick={() => setStatus('IN_PROGRESS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                status === 'IN_PROGRESS'
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-subtle'
                  : 'bg-white border-zinc-200 text-zinc-700'
              }`}
            >
              Langsung Dikerjakan
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-subtle transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Menyimpan Order...' : 'Simpan Order Servis'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
