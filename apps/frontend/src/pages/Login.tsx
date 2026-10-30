import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      showToast('success', 'Autentikasi berhasil. Selamat datang di BengkelOS.');
      navigate('/');
    } catch (err: any) {
      showToast('error', err.message || 'Kredensial tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Top Brand Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-subtle">
            <Wrench className="w-4 h-4 text-zinc-100" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-none">
              BengkelOS
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-1">
              Workshop ERP • MVP v1.1
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 border border-zinc-800/80 px-3 py-1 rounded-full bg-zinc-900/60 backdrop-blur-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Online-First Engine Active</span>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-modal backdrop-blur-md">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Masuk ke Konsol Operasional
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Pusat kendali servis motor, stok sparepart, kasir kas, dan pembukuan harian.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                Username Operator
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: owner / kasir"
                className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 rounded-lg font-semibold text-xs tracking-wide shadow-subtle transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi Sesi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Access Role Badges (Real Workshop Fast Selector) */}
          <div className="mt-8 pt-5 border-t border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2.5">
              Pilih Akun Demo Cepat (1-Klik)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner', 'owner123')}
                className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/60 hover:border-zinc-700 transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white">Owner</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-blue-400"></span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">owner123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('kasir', 'kasir123')}
                className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/60 hover:border-zinc-700 transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white">Kasir</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-emerald-400"></span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">kasir123</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto w-full text-xs text-zinc-600 font-mono">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          <span>Sesi Server-Side Terenkripsi (HttpOnly HMAC-SHA256)</span>
        </div>
        <span>&copy; 2026 BengkelOS Inc.</span>
      </footer>
    </div>
  );
};
