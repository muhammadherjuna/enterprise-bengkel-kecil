import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Wrench,
  Users,
  ShieldCheck,
  Plus,
  Save,
  CheckCircle2,
  X,
  Phone,
  Tag,
  DollarSign,
  UserCheck,
  Clock,
  FileCode2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  // Tab: WORKSHOP, SERVICES, MECHANICS, USERS, AUDIT
  const [tab, setTab] = useState<'WORKSHOP' | 'SERVICES' | 'MECHANICS' | 'USERS' | 'AUDIT'>('WORKSHOP');

  // Workshop Profile State
  const [workshopName, setWorkshopName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [workshopPhone, setWorkshopPhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');

  // Services State
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [srvCode, setSrvCode] = useState('');
  const [srvName, setSrvName] = useState('');
  const [srvCategory, setSrvCategory] = useState('Servis Ringan');
  const [srvPrice, setSrvPrice] = useState<number>(0);

  // Mechanics State
  const [mechanicsList, setMechanicsList] = useState<any[]>([]);
  const [showAddMech, setShowAddMech] = useState(false);
  const [mechName, setMechName] = useState('');
  const [mechPhone, setMechPhone] = useState('');

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'OWNER' | 'KASIR' | 'MEKANIK'>('KASIR');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'WORKSHOP') {
        const ws = await apiFetch<any>('/workshop');
        if (ws) {
          setWorkshopName(ws.name || '');
          setWorkshopAddress(ws.address || '');
          setWorkshopPhone(ws.phone || '');
          setReceiptFooter(ws.receiptFooter || '');
        }
      } else if (tab === 'SERVICES') {
        const res = await apiFetch<any[]>('/services');
        setServicesList(res || []);
      } else if (tab === 'MECHANICS') {
        const res = await apiFetch<any[]>('/mechanics');
        setMechanicsList(res || []);
      } else if (tab === 'USERS') {
        const res = await apiFetch<any[]>('/users');
        setUsersList(res || []);
      } else if (tab === 'AUDIT') {
        const res = await apiFetch<any[]>('/audit-logs');
        setAuditLogs(res || []);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data pengaturan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/workshop', {
        method: 'PUT',
        body: JSON.stringify({
          name: workshopName,
          address: workshopAddress,
          phone: workshopPhone,
          receiptFooter,
        }),
      });
      showToast('success', 'Profil bengkel berhasil diperbarui');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan profil');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          code: srvCode.trim().toUpperCase(),
          name: srvName.trim(),
          category: srvCategory,
          price: Number(srvPrice),
        }),
      });
      setShowAddService(false);
      setSrvCode('');
      setSrvName('');
      setSrvPrice(0);
      showToast('success', 'Jasa servis baru berhasil ditambahkan');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambahkan jasa');
    }
  };

  const handleAddMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/mechanics', {
        method: 'POST',
        body: JSON.stringify({
          name: mechName.trim(),
          phone: mechPhone.trim() || undefined,
        }),
      });
      setShowAddMech(false);
      setMechName('');
      setMechPhone('');
      showToast('success', 'Mekanik berhasil didaftarkan');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambahkan mekanik');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newUserName.trim(),
          password: newUserPassword,
          roles: [newUserRole],
        }),
      });
      setShowAddUser(false);
      setNewUsername('');
      setNewUserName('');
      setNewUserPassword('');
      showToast('success', 'Akun pengguna berhasil dibuat');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membuat pengguna');
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
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Pengaturan Bengkel
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Konfigurasi profil bengkel, master tarif jasa, staf mekanik, otorisasi sistem, dan jejak audit
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-2">
        <button
          onClick={() => setTab('WORKSHOP')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            tab === 'WORKSHOP'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Profil Bengkel</span>
        </button>
        <button
          onClick={() => setTab('SERVICES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            tab === 'SERVICES'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Master Jasa</span>
        </button>
        <button
          onClick={() => setTab('MECHANICS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            tab === 'MECHANICS'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Daftar Mekanik</span>
        </button>
        {hasRole('OWNER') && (
          <>
            <button
              onClick={() => setTab('USERS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                tab === 'USERS'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pengguna Sistem</span>
            </button>
            <button
              onClick={() => setTab('AUDIT')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                tab === 'AUDIT'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Log Audit</span>
            </button>
          </>
        )}
      </div>

      {/* Tab: Workshop Profile */}
      {tab === 'WORKSHOP' && (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-subtle p-6 max-w-xl">
          <form onSubmit={handleSaveWorkshop} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Nama Bengkel <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-semibold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Alamat Fisik Bengkel
              </label>
              <input
                type="text"
                value={workshopAddress}
                onChange={(e) => setWorkshopAddress(e.target.value)}
                placeholder="Jl. Raya Otomotif No. 12, Kelurahan..."
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={workshopPhone}
                onChange={(e) => setWorkshopPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Catatan Kaki Struk (Receipt Footer)
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Garansi pengerjaan 7 hari kerja. Terima kasih atas kepercayaan Anda."
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg text-xs shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Profil Bengkel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Master Jasa */}
      {tab === 'SERVICES' && (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">Daftar Tarif Master Jasa</h3>
              <p className="text-xs text-zinc-500">Standarisasi ongkos perbaikan dan perawatan kendaraan</p>
            </div>
            <button
              onClick={() => setShowAddService(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg text-xs transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jasa</span>
            </button>
          </div>

          <div className="divide-y divide-zinc-200 text-xs">
            {servicesList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                Belum ada master jasa yang dikonfigurasi.
              </div>
            ) : (
              servicesList.map((s) => (
                <div key={s.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/60 transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-zinc-100 text-zinc-700 font-semibold px-1.5 py-0.5 rounded border border-zinc-200">
                        {s.code}
                      </span>
                      <span className="font-semibold text-zinc-900 text-sm">{s.name}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">Kategori: {s.category}</span>
                  </div>
                  <span className="font-semibold text-zinc-900 text-sm tabular-nums">
                    {formatCurrency(Number(s.price))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Mechanics */}
      {tab === 'MECHANICS' && (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">Daftar Mekanik Bengkel</h3>
              <p className="text-xs text-zinc-500">Staf mekanik yang menangani pengerjaan servis</p>
            </div>
            <button
              onClick={() => setShowAddMech(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg text-xs transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Mekanik</span>
            </button>
          </div>

          <div className="divide-y divide-zinc-200 text-xs">
            {mechanicsList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                Belum ada mekanik terdaftar.
              </div>
            ) : (
              mechanicsList.map((m) => (
                <div key={m.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/60 transition">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-zinc-900 text-sm">{m.name}</span>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {m.phone ? `Telp: ${m.phone}` : 'Tanpa nomor kontak'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      m.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {m.isActive ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Users Management (Owner Only) */}
      {tab === 'USERS' && (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">Akun Pengguna Sistem</h3>
              <p className="text-xs text-zinc-500">Otorisasi login untuk staf kasir, mekanik, dan pemilik</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg text-xs transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengguna</span>
            </button>
          </div>

          <div className="divide-y divide-zinc-200 text-xs">
            {usersList.map((u) => (
              <div key={u.id} className="p-4 flex justify-between items-center hover:bg-zinc-50/60 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 text-sm">{u.name}</span>
                    <span className="text-zinc-400 font-mono text-xs">(@{u.username})</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {u.roles?.map((r: string) => (
                      <span
                        key={r}
                        className="bg-zinc-100 text-zinc-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-200"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit Log (Owner Only) */}
      {tab === 'AUDIT' && (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="font-semibold text-zinc-900 text-sm">Log Tindakan Penting (Audit Trail)</h3>
            <p className="text-xs text-zinc-500">
              Jejak rekam pembayaran, pembatalan order lunas, dan penyesuaian mutasi stok
            </p>
          </div>

          <div className="divide-y divide-zinc-200 text-xs max-h-[600px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">Belum ada catatan log aktivitas.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-zinc-50/60 transition space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-900 text-white font-mono font-semibold px-2 py-0.5 rounded text-[10px] uppercase">
                        {log.action}
                      </span>
                      <span className="text-zinc-600 text-[11px]">
                        Entitas: <strong className="text-zinc-900">{log.entityType}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-zinc-800 text-[11px] font-mono bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    Pelaku: {log.user?.name || log.user?.username || 'Sistem'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-modal space-y-4 border border-zinc-200 animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Tambah Jasa Baru</h3>
              <button
                onClick={() => setShowAddService(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Kode Jasa</label>
                <input
                  type="text"
                  required
                  placeholder="misal: SRV-08"
                  value={srvCode}
                  onChange={(e) => setSrvCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs uppercase font-mono font-semibold text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Jasa</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Gurah Mesin / Carbon Cleaner"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={srvCategory}
                  onChange={(e) => setSrvCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Tarif Jasa (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs transition shadow-sm"
                >
                  Simpan Jasa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mechanic Modal */}
      {showAddMech && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-modal space-y-4 border border-zinc-200 animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Tambah Mekanik</h3>
              <button
                onClick={() => setShowAddMech(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddMechanic} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Mekanik</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap mekanik"
                  value={mechName}
                  onChange={(e) => setMechName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="0812-3456-7890"
                  value={mechPhone}
                  onChange={(e) => setMechPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMech(false)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs transition shadow-sm"
                >
                  Simpan Mekanik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-modal space-y-4 border border-zinc-200 animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Tambah Akun Pengguna</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="username unik (huruf kecil & angka)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama staf bengkel"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="minimal 4 karakter"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Peran (Role)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs outline-none font-medium text-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                >
                  <option value="KASIR">Kasir (Bisa transaksi & penerimaan kasir)</option>
                  <option value="MEKANIK">Mekanik (Bisa catat servis & status)</option>
                  <option value="OWNER">Owner (Akses penuh seluruh modul)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs transition shadow-sm"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
