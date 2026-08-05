'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LayoutDashboard, MapPin, Users, QrCode, Globe, LogOut, Store, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    }
    checkSession();
  }, [router, pathname]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // 1. Sign out dari Supabase
      await supabase.auth.signOut();

      // 2. Hapus Cookie Session Admin untuk Middleware
      document.cookie = 'admin_session=; path=/; max-age=0; SameSite=Lax';

      // 3. Hapus Email Terimpan di LocalStorage
      localStorage.removeItem('remembered_admin_email');

      // 4. Pindah ke Halaman Login & Refresh Router
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/admin/login';
    }
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
        Memeriksa Sesi Admin...
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard & Statistik', href: '/admin', icon: LayoutDashboard },
    { label: 'Kelola Area & Lokasi', href: '/admin/area', icon: MapPin },
    { label: 'Data Pendaftar (Master)', href: '/admin/pendaftar', icon: Users },
    { label: 'Scan & Presensi Petugas', href: '/admin/scan', icon: QrCode },
    { label: 'Pengaturan CMS Landing', href: '/admin/cms', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Top Navbar khusus Tampilan Ponsel */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-600 rounded-lg">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs">Admin PKL Kudus</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-all"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay Gelap di Ponsel saat Sidebar Terbuka */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Responsive */}
      <aside
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 fixed h-full z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-xl text-white">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">Admin PKL Kudus</h2>
                <p className="text-[10px] text-slate-400">Dinas Perdagangan</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-md'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Globe className="w-4 h-4" /> Lihat Landing Page
          </Link>
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Keluar / Logout
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}