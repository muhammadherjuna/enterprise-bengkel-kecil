import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import {
  Users,
  Search,
  Plus,
  Car,
  History,
  Phone,
  MapPin,
  Calendar,
  X,
  Wrench,
  CheckCircle,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Tab: Customers or Vehicles
  const [tab, setTab] = useState<'CUSTOMERS' | 'VEHICLES'>('VEHICLES');

  // History Modal (AC-18)
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Create Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Create Vehicle Modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehPlate, setVehPlate] = useState('');
  const [vehBrand, setVehBrand] = useState('Honda');
  const [vehModel, setVehModel] = useState('');
  const [vehCustomerId, setVehCustomerId] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, vRes] = await Promise.all([
        apiFetch<any[]>(`/customers${search ? `?search=${search}` : ''}`),
        apiFetch<any[]>(`/vehicles${search ? `?search=${search}` : ''}`),
      ]);
      setCustomers(cRes || []);
      setVehicles(vRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // AC-18: View Vehicle History
  const openVehicleHistory = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await apiFetch<any>(`/vehicles/${vehicle.id}/history`);
      setVehicleHistory(res.history || []);
    } catch {
      setVehicleHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: custName,
          phone: custPhone || undefined,
          address: custAddress || undefined,
        }),
      });
      setShowCustomerModal(false);
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          plateNumber: vehPlate.trim().toUpperCase(),
          brand: vehBrand,
          model: vehModel,
          customerId: vehCustomerId || undefined,
        }),
      });
      setShowVehicleModal(false);
      setVehPlate('');
      setVehModel('');
      await loadData();
    } catch (err) {
      console.error(err);
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
            Pelanggan & Kendaraan
          </h1>
          <p className="text-xs text-slate-500">
            Database pemilik motor dan riwayat rekam medis kendaraan (AC-18)
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowVehicleModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
          >
            <Car className="w-4 h-4" />
            <span>+ Motor</span>
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm transition"
          >
            <Users className="w-4 h-4" />
            <span>+ Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Tab & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTab('VEHICLES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === 'VEHICLES' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Daftar Motor ({vehicles.length})
            </button>
            <button
              onClick={() => setTab('CUSTOMERS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === 'CUSTOMERS' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Daftar Pelanggan ({customers.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                tab === 'VEHICLES'
                  ? 'Cari plat nomor motor atau model...'
                  : 'Cari nama atau telepon pelanggan...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Content View */}
      {tab === 'VEHICLES' ? (
        /* Vehicles List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat kendaraan...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Tidak ada motor ditemukan.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900 tracking-wide">
                        {v.plateNumber}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {v.brand}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{v.model}</p>
                    <p className="text-[11px] text-slate-400">
                      Pemilik: <strong className="text-slate-700">{v.customer?.name || 'Umum'}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openVehicleHistory(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold rounded-xl text-xs transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Lihat Riwayat Servis (AC-18)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Customers List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat pelanggan...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Tidak ada pelanggan ditemukan.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customers.map((c) => (
                <div key={c.id} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-50 transition">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {c.phone}
                        </span>
                      )}
                      {c.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {c.address}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-0.5">
                      Jumlah Motor: {c.vehicles?.length || 0} unit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vehicle Service History Modal (AC-18) */}
      {showHistoryModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{selectedVehicle.plateNumber}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemilik: {selectedVehicle.customer?.name || 'Pelanggan Umum'}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {historyLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Memuat rekam servis...</div>
              ) : vehicleHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada riwayat perbaikan untuk kendaraan ini.
                </div>
              ) : (
                vehicleHistory.map((h) => (
                  <div key={h.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{h.orderNumber}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(h.date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(Number(h.totalAmount))}</span>
                    </div>

                    <div className="flex gap-4 text-slate-600 text-[11px]">
                      <span>
                        Kilometer: <strong>{h.mileage ? `${h.mileage} km` : '-'}</strong>
                      </span>
                      <span>
                        Mekanik: <strong>{h.mechanic?.name || '-'}</strong>
                      </span>
                    </div>

                    {h.complaints && (
                      <p className="text-slate-500 italic">Keluhan: "{h.complaints}"</p>
                    )}

                    {/* Items */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-700 block mb-1">Pekerjaan & Sparepart:</span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        {h.items?.map((it: any) => (
                          <div key={it.id} className="flex justify-between pr-2">
                            <span>• {it.name} ({it.quantity}x)</span>
                            <span className="font-medium">{formatCurrency(Number(it.subtotal))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Pelanggan</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pelanggan"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="0812-XXXX-XXXX"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Singkat</label>
                <input
                  type="text"
                  placeholder="Alamat pelanggan"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Kendaraan Motor</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Polisi (Plat)</label>
                <input
                  type="text"
                  required
                  placeholder="misal: B 1234 ABC"
                  value={vehPlate}
                  onChange={(e) => setVehPlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merek</label>
                  <select
                    value={vehBrand}
                    onChange={(e) => setVehBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Kawasaki">Kawasaki</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model / Tipe</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Beat ESP 110"
                    value={vehModel}
                    onChange={(e) => setVehModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hubungkan ke Pelanggan</label>
                <select
                  value={vehCustomerId}
                  onChange={(e) => setVehCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                >
                  <option value="">-- Pelanggan Umum (Tanpa Akun) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Motor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
