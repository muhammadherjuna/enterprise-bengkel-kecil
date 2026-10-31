import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PlateBadge } from '../../components/PlateBadge';
import { Modal } from '../../components/Modal';
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
  Clock,
  ChevronRight,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Tab: Customers or Vehicles
  const [tab, setTab] = useState<'VEHICLES' | 'CUSTOMERS'>('VEHICLES');

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
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data pelanggan');
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
      showToast('success', `Pelanggan "${custName}" berhasil didaftarkan`);
      setShowCustomerModal(false);
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan pelanggan');
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
      showToast('success', `Kendaraan ${vehPlate} berhasil didaftarkan`);
      setShowVehicleModal(false);
      setVehPlate('');
      setVehModel('');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan kendaraan');
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
            Pelanggan & Riwayat Kendaraan
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pencatatan profil pemilik kendaraan dan riwayat rekam medis servis motor (AC-18).
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowVehicleModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-subtle transition"
          >
            <Car className="w-3.5 h-3.5" />
            <span>+ Motor Baru</span>
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-lg shadow-subtle transition"
          >
            <Users className="w-3.5 h-3.5 text-zinc-600" />
            <span>+ Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Segmented Control & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-card space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
            <button
              onClick={() => setTab('VEHICLES')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                tab === 'VEHICLES' ? 'bg-white text-zinc-900 shadow-subtle' : 'text-zinc-600'
              }`}
            >
              Database Motor ({vehicles.length})
            </button>
            <button
              onClick={() => setTab('CUSTOMERS')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                tab === 'CUSTOMERS' ? 'bg-white text-zinc-900 shadow-subtle' : 'text-zinc-600'
              }`}
            >
              Data Pelanggan ({customers.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              tab === 'VEHICLES'
                ? 'Cari berdasarkan plat nomor motor atau model...'
                : 'Cari berdasarkan nama atau nomor telepon...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
          />
        </form>
      </div>

      {/* Main Content Table */}
      {tab === 'VEHICLES' ? (
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-mono">
              Memuat data kendaraan...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Tidak ada data motor ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-zinc-50/70 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Plat Nomor Kendaraan</th>
                    <th className="py-2.5 px-4 font-medium">Merek & Tipe</th>
                    <th className="py-2.5 px-4 font-medium">Pemilik Terdaftar</th>
                    <th className="py-2.5 px-4 font-medium text-center">Rekam Medis (AC-18)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <PlateBadge plate={v.plateNumber} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-900 block">{v.brand} {v.model}</span>
                        {v.year && <span className="text-[10px] text-zinc-500 tabular-nums">Tahun {v.year}</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-700">
                        {v.customer?.name || <span className="text-zinc-400 italic">Pelanggan Umum</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openVehicleHistory(v)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold transition"
                        >
                          <History className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Riwayat Servis</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Customers List */
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Memuat data pelanggan...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              Tidak ada pelanggan ditemukan.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {customers.map((c) => (
                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 transition text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-900 block text-sm">{c.name}</span>
                    <div className="flex items-center gap-3 text-zinc-500">
                      {c.phone && (
                        <span className="flex items-center gap-1 tabular-nums font-medium">
                          <Phone className="w-3.5 h-3.5" /> {c.phone}
                        </span>
                      )}
                      {c.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {c.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {c.vehicles?.length || 0} unit motor terdaftar
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vehicle Service Maintenance History Modal (AC-18) */}
      {selectedVehicle && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title={`Rekam Medis Perawatan Motor — ${selectedVehicle.brand} ${selectedVehicle.model}`}
          subtitle={`Plat: ${selectedVehicle.plateNumber} • Pemilik: ${selectedVehicle.customer?.name || 'Pelanggan Umum'}`}
          maxWidth="max-w-2xl"
        >
          <div className="overflow-y-auto max-h-[60vh] space-y-3 pr-1">
            {historyLoading ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                Memuat rekam servis kendaraan...
              </div>
            ) : vehicleHistory.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                Belum ada catatan riwayat perawatan servis untuk kendaraan ini.
              </div>
            ) : (
              vehicleHistory.map((h) => (
                <div key={h.id} className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-900">{h.orderNumber}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(h.date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <span className="font-semibold text-zinc-900 tabular-nums">
                      {formatCurrency(Number(h.totalAmount))}
                    </span>
                  </div>

                  <div className="flex gap-4 text-zinc-600 text-[11px]">
                    <span>Odo: <strong className="text-zinc-900 tabular-nums">{h.mileage ? `${h.mileage.toLocaleString('id-ID')} km` : '-'}</strong></span>
                    <span>Mekanik: <strong className="text-zinc-900">{h.mechanic?.name || '-'}</strong></span>
                  </div>

                  {h.complaints && (
                    <p className="text-zinc-600 italic text-[11px]">Keluhan: "{h.complaints}"</p>
                  )}

                  {/* Items */}
                  <div className="pt-2 border-t border-zinc-200">
                    <span className="font-semibold text-zinc-700 block text-[11px] uppercase mb-1">
                      Pekerjaan Jasa & Suku Cadang:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-600">
                      {h.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between pr-2">
                          <span className="truncate pr-1">• {it.name} ({it.quantity}x)</span>
                          <span className="tabular-nums font-medium text-zinc-800">{formatCurrency(Number(it.subtotal))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Daftarkan Pelanggan Baru"
        subtitle="Tambahkan data kontak pelanggan untuk riwayat servis kendaraan"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              placeholder="Nama pelanggan"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              placeholder="0812-XXXX-XXXX"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tabular-nums focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Alamat Singkat
            </label>
            <input
              type="text"
              placeholder="Alamat pelanggan"
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCustomerModal(false)}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-subtle"
            >
              Simpan Pelanggan
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Vehicle Modal */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Registrasi Kendaraan Motor"
        subtitle="Daftarkan plat nomor dan tipe motor ke database bengkel"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-3">
          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Nomor Polisi (Plat)
            </label>
            <input
              type="text"
              required
              placeholder="B 1234 ABC"
              value={vehPlate}
              onChange={(e) => setVehPlate(e.target.value.toUpperCase())}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Merek
              </label>
              <select
                value={vehBrand}
                onChange={(e) => setVehBrand(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
              >
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Suzuki">Suzuki</option>
                <option value="Kawasaki">Kawasaki</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
                Model / Tipe
              </label>
              <input
                type="text"
                required
                placeholder="Beat ESP 110"
                value={vehModel}
                onChange={(e) => setVehModel(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-zinc-600 font-semibold block mb-1">
              Hubungkan ke Pemilik
            </label>
            <select
              value={vehCustomerId}
              onChange={(e) => setVehCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
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
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-subtle"
            >
              Simpan Motor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
