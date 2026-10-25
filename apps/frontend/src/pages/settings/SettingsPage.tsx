import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Building,
  Wrench,
  Users,
  Shield,
  FileText,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();

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
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMsg(null);
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
      setMsg({ type: 'error', text: err.message });
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
      setMsg({ type: 'success', text: 'Profil bengkel berhasil diperbarui' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
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
      setMsg({ type: 'success', text: 'Jasa servis baru berhasil ditambahkan' });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
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
      setMsg({ type: 'success', text: 'Mekanik berhasil didaftarkan' });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
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
      setMsg({ type: 'success', text: 'Akun pengguna berhasil dibuat' });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
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
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Pengaturan Bengkel
        </h1>
        <p className="text-xs text-slate-500">
          Konfigurasi profil bengkel, master jasa, mekanik, pengguna, dan audit
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-200 p-1 rounded-xl overflow-x-auto text-xs font-bold gap-1">
        <button
          onClick={() => setTab('WORKSHOP')}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
            tab === 'WORKSHOP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Profil Bengkel
        </button>
        <button
          onClick={() => setTab('SERVICES')}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
            tab === 'SERVICES' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Master Jasa
        </button>
        <button
          onClick={() => setTab('MECHANICS')}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
            tab === 'MECHANICS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Daftar Mekanik
        </button>
        {hasRole('OWNER') && (
          <>
            <button
              onClick={() => setTab('USERS')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                tab === 'USERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Pengguna Sistem
            </button>
            <button
              onClick={() => setTab('AUDIT')}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                tab === 'AUDIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Log Tindakan (Audit)
            </button>
          </>
        )}
      </div>

      {/* Tab: Workshop Profile */}
      {tab === 'WORKSHOP' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
          <form onSubmit={handleSaveWorkshop} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bengkel</label>
              <input
                type="text"
                required
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Bengkel</label>
              <input
                type="text"
                value={workshopAddress}
                onChange={(e) => setWorkshopAddress(e.target.value)}
                placeholder="Jl. Raya ..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={workshopPhone}
                onChange={(e) => setWorkshopPhone(e.target.value)}
                placeholder="0812-XXXX-XXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kaki Struk</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="misal: Garansi servis 7 hari kerja. Terima kasih."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab: Master Jasa */}
      {tab === 'SERVICES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Tarif Master Jasa</h3>
            <button
              onClick={() => setShowAddService(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
            >
              <Plus className="w-4 h-4" /> Tambah Jasa
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {servicesList.map((s) => (
              <div key={s.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 text-[10px]">{s.code}</span>
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Kategori: {s.category}</span>
                </div>
                <span className="font-black text-blue-700 text-sm">{formatCurrency(Number(s.price))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Mechanics */}
      {tab === 'MECHANICS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Mekanik Bengkel</h3>
            <button
              onClick={() => setShowAddMech(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
            >
              <Plus className="w-4 h-4" /> Tambah Mekanik
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {mechanicsList.map((m) => (
              <div key={m.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                  <p className="text-[11px] text-slate-500">Telp: {m.phone || '-'}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {m.isActive ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Users Management (Owner Only) */}
      {tab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Akun Pengguna Sistem</h3>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
            >
              <Plus className="w-4 h-4" /> Tambah Pengguna
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {usersList.map((u) => (
              <div key={u.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                    <span className="text-slate-400 text-xs">(@{u.username})</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {u.roles?.map((r: string) => (
                      <span
                        key={r}
                        className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Log Tindakan Penting (Audit Trail)</h3>
            <p className="text-xs text-slate-500">
              Jejak rekam pembayaran, pembatalan order lunas, dan penyesuaian stok
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {log.action}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Entitas: <strong>{log.entityType}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-slate-700 text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {JSON.stringify(log.details)}
                </div>
                <span className="text-[10px] text-slate-400">
                  Oleh: {log.user?.name || log.user?.username || 'Sistem'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Jasa Baru</h3>
            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Jasa</label>
                <input
                  type="text"
                  required
                  placeholder="SRV-08"
                  value={srvCode}
                  onChange={(e) => setSrvCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Jasa</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Gurah Mesin / Carbon Cleaner"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={srvCategory}
                  onChange={(e) => setSrvCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Jasa (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-blue-700 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Mekanik</h3>
            <form onSubmit={handleAddMechanic} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mekanik</label>
                <input
                  type="text"
                  required
                  placeholder="Nama mekanik"
                  value={mechName}
                  onChange={(e) => setMechName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP</label>
                <input
                  type="text"
                  placeholder="0813-XXXX-XXXX"
                  value={mechPhone}
                  onChange={(e) => setMechPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMech(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Akun Pengguna</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="username unik"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama staf bengkel"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="minimal 4 karakter"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none font-semibold"
                >
                  <option value="KASIR">Kasir (Bisa transaksi & bayar)</option>
                  <option value="MEKANIK">Mekanik (Bisa catat servis & status)</option>
                  <option value="OWNER">Owner (Akses penuh seluruh modul)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
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
