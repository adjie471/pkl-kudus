'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Store, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ total: 0, aktif: 0, antri: 0, areaCount: 0 });
  const [pendaftar, setPendaftar] = useState<any[]>([]);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);

    // 1. Fetch Stats
    const { count: totalCount } = await supabase.from('pendaftar').select('*', { count: 'exact', head: true });
    const { count: aktifCount } = await supabase.from('pendaftar').select('*', { count: 'exact', head: true }).eq('status', 'Aktif');
    const { count: antriCount } = await supabase.from('pendaftar').select('*', { count: 'exact', head: true }).eq('status', 'Antri');
    const { count: areaCount } = await supabase.from('konfigurasi_area').select('*', { count: 'exact', head: true });

    setStats({
      total: totalCount || 0,
      aktif: aktifCount || 0,
      antri: antriCount || 0,
      areaCount: areaCount || 0,
    });

    // 2. Fetch Pendaftar Terbaru berdasarkan Limit Dropdown (Dengan Fallback Handling)
    let query = supabase
      .from('pendaftar')
      .select('*, konfigurasi_area:konfigurasi_area_id(nama_area)')
      .order('created_at', { ascending: false });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: pendaftarData, error } = await query;

    if (error) {
      // Fallback jika query join relasi error
      let fallbackQuery = supabase
        .from('pendaftar')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit > 0) fallbackQuery = fallbackQuery.limit(limit);

      const { data: fallbackData } = await fallbackQuery;
      if (fallbackData) setPendaftar(fallbackData);
    } else if (pendaftarData) {
      setPendaftar(pendaftarData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Ringkasan Ringkas & Statistik</h1>
          <p className="text-xs text-slate-500 mt-1">Sistem Manajemen Pedagang Kreatif Lapangan Kudus</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Pendaftar</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Status Aktif</p>
            <h3 className="text-2xl font-black text-teal-600 mt-1">{stats.aktif}</h3>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><CheckCircle2 className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Dalam Antrean</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.antri}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Area Jalan</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.areaCount}</h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl"><Store className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Tabel Pendaftar Terbaru dengan Limit Select */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h2 className="font-bold text-slate-800 text-sm">Daftar Pendaftar Terbaru</h2>
          
          {/* Limit Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Tampilkan:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value={10}>10 Data</option>
              <option value={20}>20 Data</option>
              <option value={50}>50 Data</option>
              <option value={0}>Semua Data</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 px-2">ID Unik</th>
                  <th className="py-3 px-2">Nama Pedagang</th>
                  <th className="py-3 px-2">WhatsApp</th>
                  <th className="py-3 px-2">Event / Area</th>
                  <th className="py-3 px-2">No. Lapak</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendaftar.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                      Belum ada pendaftar terdaftar.
                    </td>
                  </tr>
                ) : (
                  pendaftar.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-2 font-mono font-bold text-teal-700">{p.id_unik}</td>
                      <td className="py-3 px-2 font-bold text-slate-800">{p.nama_lengkap}</td>
                      <td className="py-3 px-2 font-mono text-slate-600">{p.whatsapp}</td>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-800">{p.event_type}</span> — {p.konfigurasi_area?.nama_area || '-'}
                      </td>
                      <td className="py-3 px-2 font-black text-amber-600">{p.nomor_lapak ? `#${p.nomor_lapak}` : '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'Aktif' ? 'bg-teal-100 text-teal-800' :
                          p.status === 'Antri' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status || 'Aktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}