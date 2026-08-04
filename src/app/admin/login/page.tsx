'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-fill email jika sebelumnya dicentang "Ingat Saya"
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_admin_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Simpan/Hapus Email di LocalStorage sesuai centang "Ingat Saya"
      if (rememberMe) {
        localStorage.setItem('remembered_admin_email', email);
      } else {
        localStorage.removeItem('remembered_admin_email');
      }

      // 2. Autentikasi Menggunakan Supabase Auth Resmi
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        alert(`Gagal Login: ${error.message}`);
      } else if (data.user) {
        // 3. Set Cookie untuk Middleware Guard
        const maxAge = rememberMe ? 86400 * 30 : 86400; // 30 Hari vs 1 Hari
        document.cookie = `admin_session=true; path=/; max-age=${maxAge}; SameSite=Lax`;

        // 4. Redirect ke Dashboard Admin
        router.push(redirectPath);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6 relative">
        {/* Tombol Kembali ke Portal */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Portal
        </Link>

        {/* Header Form */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Login Petugas Dinas</h2>
          <p className="text-xs text-slate-500">Masuk untuk mengelola area lapak & pendaftar</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {/* Input Email */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Petugas</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="nama@lapak.pkl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Input Password + Ikon Mata */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Option Ingat Saya */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium cursor-pointer select-none"
            >
              {rememberMe ? (
                <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Ingat Saya di Perangkat Ini</span>
            </button>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:bg-slate-300"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}