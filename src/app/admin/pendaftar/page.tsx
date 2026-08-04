'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search, Filter, Edit2, Trash2, RefreshCw, CreditCard, FileSpreadsheet, Eye, History, Calendar, CheckCircle2, X } from 'lucide-react';
import ModalCardAdmin from '@/components/admin/ModalCardAdmin';
import { exportPendaftarToExcel } from '@/lib/exportExcel';

export default function AdminPendaftarPage() {
  const [pendaftar, setPendaftar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Daftar Area untuk Dropdown Relokasi
  const [daftarArea, setDaftarArea] = useState<any[]>([]);

  // State untuk Modal Kartu ID Admin
  const [selectedCardData, setSelectedCardData] = useState<any | null>(null);

  // State untuk Modal Histori Presensi
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // State untuk data CMS (Logo, Nama Dinas, Background Kartu)
  const [cms, setCms] = useState<any>({
    nama_dinas: 'Dinas Perdagangan Kabupaten Kudus',
    logo_url: '',
    bg_card_url: '',
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [eventFilter, setEventFilter] = useState('Semua');

  // Modal Edit Status & Lokasi State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('Aktif');
  const [newLapak, setNewLapak] = useState('');
  const [newAreaId, setNewAreaId] = useState('');

  const fetchPendaftar = async () => {
    setLoading(true);
    let query = supabase
      .from('pendaftar')
      .select('*, konfigurasi_area:konfigurasi_area_id(nama_area)')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'Semua') query = query.eq('status', statusFilter);
    if (eventFilter !== 'Semua') query = query.eq('event_type', eventFilter);

    const { data, error } = await query;
    if (error) {
      const { data: fallbackData } = await supabase
        .from('pendaftar')
        .select('*')
        .order('created_at', { ascending: false });
      if (fallbackData) setPendaftar(fallbackData);
    } else if (data) {
      setPendaftar(data);
    }
    setLoading(false);
  };

  // Fetch Daftar Area untuk Dropdown Modal Edit
  const fetchDaftarArea = async () => {
    const { data } = await supabase.from('konfigurasi_area').select('id, nama_area, event_type').order('nama_area');
    if (data) setDaftarArea(data);
  };

  useEffect(() => {
    fetchPendaftar();
    fetchDaftarArea();

    // Fetch CMS Landingpage untuk Logo & Nama Dinas di Kartu ID
    async function fetchCms() {
      const { data } = await supabase.from('cms_landingpage').select('*').eq('id', 1).single();
      if (data) {
        setCms({
          nama_dinas: data.nama_dinas || 'Dinas Perdagangan Kabupaten Kudus',
          logo_url: data.logo_url || '',
          bg_card_url: data.bg_card_url || '',
        });
      }
    }
    fetchCms();
  }, [statusFilter, eventFilter]);

  // Fetch Histori Presensi Pedagang
  const handleOpenHistory = async (pedagang: any) => {
    setSelectedHistoryItem(pedagang);
    setLoadingHistory(true);

    const { data, error } = await supabase
      .from('log_absensi')
      .select('*')
      .eq('pendaftar_id', pedagang.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistoryLogs(data);
    } else {
      setHistoryLogs([]);
    }
    setLoadingHistory(false);
  };

  // Client-side Search Filtering
  const filteredData = pendaftar.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.nama_lengkap && p.nama_lengkap.toLowerCase().includes(q)) ||
      (p.whatsapp && p.whatsapp.includes(q)) ||
      (p.id_unik && p.id_unik.toLowerCase().includes(q))
    );
  });

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Pastikan ID area valid (bukan string kosong)
    const selectedAreaId = newAreaId && newAreaId.trim() !== '' ? newAreaId.trim() : null;

    console.log('--- DEBUG UPDATE ---');
    console.log('ID Pendaftar yang di-update:', editingItem.id);
    console.log('ID Area yang dipilih:', selectedAreaId);

    const payload = {
      status: newStatus,
      nomor_lapak: newStatus === 'Aktif' ? (newLapak ? Number(newLapak) : editingItem.nomor_lapak || 1) : null,
      konfigurasi_area_id: selectedAreaId,
      updated_at: new Date().toISOString(),
    };

    // Panggil update dengan .select() untuk mengecek apakah ada baris yang benar-benar ter-update
    const { data, error } = await supabase
      .from('pendaftar')
      .update(payload)
      .eq('id', editingItem.id)
      .select();

    if (error) {
      alert(`Gagal memperbarui di Supabase: ${error.message}`);
      console.error('Error Supabase:', error);
    } else if (!data || data.length === 0) {
      alert('PERINGATAN: Supabase tidak mengembalikan error, tetapi TIDAK ADA data yang ter-update! (Cek RLS / Primary Key ID)');
      console.warn('Data tidak terubah:', data);
    } else {
      alert('Data pendaftar & lokasi BERHASIL diperbarui!');
      console.log('Hasil Update:', data);
      setEditingItem(null);
      fetchPendaftar();
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pendaftar "${nama}"?`)) {
      const { error } = await supabase.from('pendaftar').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchPendaftar();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" /> Data Master Pendaftar Lapak
          </h1>
          <p className="text-xs text-slate-500 mt-1">Kelola status, nomor lapak, relokasi area, dan riwayat presensi pedagang</p>
        </div>

        {/* Tombol Aksi Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportPendaftarToExcel}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>

          <button onClick={fetchPendaftar} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama, No WA, atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Antri">Status: Antri</option>
            <option value="Tidak Aktif">Status: Tidak Aktif</option>
          </select>
        </div>

        {/* Filter Event */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
          >
            <option value="Semua">Semua Event (CFD/CFN)</option>
            <option value="CFD">Event: CFD</option>
            <option value="CFN">Event: CFN</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Master Pendaftar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat data pendaftar...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 px-2">ID Unik</th>
                  <th className="py-3 px-2">Nama Pedagang</th>
                  <th className="py-3 px-2">WhatsApp</th>
                  <th className="py-3 px-2">Alamat</th>
                  <th className="py-3 px-2">Event & Area</th>
                  <th className="py-3 px-2">Lapak</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-2 font-mono font-bold text-teal-700">{p.id_unik}</td>
                    <td className="py-3 px-2 font-bold text-slate-800">{p.nama_lengkap}</td>
                    <td className="py-3 px-2 font-mono text-slate-600">{p.whatsapp}</td>
                    <td className="py-3 px-2 text-slate-500 max-w-[150px] truncate">{p.alamat}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-slate-800">{p.event_type}</span> — {p.konfigurasi_area?.nama_area || '-'}
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
                    <td className="py-3 px-2 text-right space-x-1">
                      {/* Tombol Lihat Histori Presensi */}
                      <button
                        onClick={() => handleOpenHistory(p)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold"
                        title="Lihat Histori Presensi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Tombol Lihat & Cetak Kartu ID */}
                      <button
                        onClick={() => setSelectedCardData(p)}
                        className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-bold"
                        title="Lihat & Cetak Kartu ID"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>

                      {/* Tombol Edit Status & Relokasi Area */}
                      <button
                        onClick={() => {
                          setEditingItem(p);
                          setNewStatus(p.status || 'Aktif');
                          setNewLapak(p.nomor_lapak || '');
                          setNewAreaId(p.konfigurasi_area_id || '');
                        }}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold"
                        title="Edit Status & Lokasi Lapak"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        onClick={() => handleDelete(p.id, p.nama_lengkap)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold"
                        title="Hapus Data"
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
      </div>

      {/* MODAL EDIT STATUS & DROPDOWN LOKASI LAPAK */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-sm text-slate-800">Edit Data & Lokasi Pedagang</h3>
            <div className="p-3 bg-slate-50 rounded-xl space-y-0.5 border border-slate-200">
              <p className="text-slate-500">Nama: <b className="text-slate-800">{editingItem.nama_lengkap}</b></p>
              <p className="text-slate-500">ID Unik: <b className="font-mono text-teal-700">{editingItem.id_unik}</b></p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              {/* Dropdown Lokasi Lapak / Area */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Area Lapak (Relokasi)</label>
                <select
                  value={newAreaId}
                  onChange={(e) => setNewAreaId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Pilih Lokasi Area --</option>
                  {daftarArea.map((area) => (
                    <option key={area.id} value={area.id}>
                      [{area.event_type || 'EVENT'}] {area.nama_area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Pedagang */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Pedagang</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Antri">Antri</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>

              {/* Nomor Lapak */}
              {newStatus === 'Aktif' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Lapak</label>
                  <input
                    type="number"
                    value={newLapak}
                    onChange={(e) => setNewLapak(e.target.value)}
                    placeholder="Nomor Lapak"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow transition-all">
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL HISTORI PRESENSI PEDAGANG */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-xs relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Popup Histori */}
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Histori Presensi Pedagang</h3>
                <p className="text-[10px] text-slate-500">
                  {selectedHistoryItem.nama_lengkap} (<b className="font-mono text-teal-700">{selectedHistoryItem.id_unik}</b>)
                </p>
              </div>
            </div>

            {/* List Riwayat Presensi */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-slate-400">Memuat riwayat presensi...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">Belum ada catatan presensi untuk pedagang ini.</div>
              ) : (
                historyLogs.map((log) => {
                  const createdDate = new Date(log.created_at || log.tanggal_absen);
                  const formattedDate = createdDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = createdDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>{formattedDate}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Jam: <b>{formattedTime} WIB</b> | Minggu ke-<b>{log.minggu_ke || 1}</b>
                        </p>
                      </div>

                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {log.status_kehadiran || 'Hadir'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow"
            >
              Tutup Histori
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL KARTU ID PEDAGANG (ADMIN VIEW) */}
      {selectedCardData && (
        <ModalCardAdmin
          data={selectedCardData}
          namaDinas={cms.nama_dinas}
          logoUrl={cms.logo_url}
          bgCardUrl={cms.bg_card_url}
          onClose={() => setSelectedCardData(null)}
        />
      )}
    </div>
  );
}