'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Plus, Edit2, Trash2, RefreshCw, Navigation, Layers } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import komponen AreaMap secara dynamic agar 100% bebas dari SSR error
const AreaMap = dynamic(() => import('@/components/AreaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] w-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-400 border border-slate-200">
      Memuat Peta Interaktif...
    </div>
  ),
});

export default function AdminAreaPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState<'start' | 'end'>('start');
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formArea, setFormArea] = useState({
    nama_area: '',
    event_type: 'CFD',
    lat_start: -6.8048,
    lon_start: 110.8405,
    lat_end: -6.8062,
    lon_end: 110.8418,
    lebar_simpang_meter: 7,
    jumlah_simpang: 2,
    ukuran_lapak_meter: 3,
    kapasitas_custom: '',
  });

  const fetchAreas = async () => {
    setLoading(true);
    const { data } = await supabase.from('konfigurasi_area').select('*').order('created_at', { ascending: false });
    if (data) setAreas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // Fungsi otomatis mengambil nama jalan dari koordinat
  const fetchStreetName = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const road =
          data.address.road ||
          data.address.pedestrian ||
          data.address.suburb ||
          data.address.village ||
          data.address.footway ||
          data.display_name?.split(',')[0];

        if (road) {
          setFormArea((prev) => {
            if (!prev.nama_area.trim()) {
              return { ...prev, nama_area: road };
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('Gagal mengambil nama jalan otomatis:', err);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    const latFixed = parseFloat(lat.toFixed(6));
    const lonFixed = parseFloat(lng.toFixed(6));

    if (pickMode === 'start') {
      setFormArea((prev) => ({ ...prev, lat_start: latFixed, lon_start: lonFixed }));
    } else {
      setFormArea((prev) => ({ ...prev, lat_end: latFixed, lon_end: lonFixed }));
    }

    // Panggil pencarian nama jalan otomatis
    fetchStreetName(latFixed, lonFixed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalNamaArea = formArea.nama_area.trim();

    // 1. Cek apakah nama area sudah pernah terdaftar (hanya saat tambah baru, bukan edit)
    if (!editingId) {
      const { data: existingAreas } = await supabase
        .from('konfigurasi_area')
        .select('nama_area')
        .ilike('nama_area', `${finalNamaArea}%`)
        .eq('event_type', formArea.event_type);

      // Jika nama jalan yang sama sudah ada, tambahkan penanda blok otomatis (misal: Blok A, Blok B)
      if (existingAreas && existingAreas.length > 0) {
        const count = existingAreas.length;
        const alphabet = String.fromCharCode(65 + count); // 65 = 'A', 66 = 'B', dst.
        finalNamaArea = `${finalNamaArea} (Blok ${alphabet})`;
      }
    }

    const payload = {
      ...formArea,
      nama_area: finalNamaArea,
      kapasitas_custom: formArea.kapasitas_custom ? Number(formArea.kapasitas_custom) : null,
    };

    if (editingId) {
      const { error } = await supabase.from('konfigurasi_area').update(payload).eq('id', editingId);
      if (error) alert(error.message);
      else {
        alert('Area berhasil diperbarui!');
        resetForm();
        fetchAreas();
      }
    } else {
      const { error } = await supabase.from('konfigurasi_area').insert([payload]);
      if (error) alert(error.message);
      else {
        alert(`Area berhasil ditambahkan dengan nama: "${finalNamaArea}"`);
        resetForm();
        fetchAreas();
      }
    }
  };

  const handleEdit = (area: any) => {
    setEditingId(area.id);
    setFormArea({
      nama_area: area.nama_area,
      event_type: area.event_type,
      lat_start: area.lat_start,
      lon_start: area.lon_start,
      lat_end: area.lat_end,
      lon_end: area.lon_end,
      lebar_simpang_meter: area.lebar_simpang_meter,
      jumlah_simpang: area.jumlah_simpang,
      ukuran_lapak_meter: area.ukuran_lapak_meter,
      kapasitas_custom: area.kapasitas_custom || '',
    });

    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: string, nama: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus area "${nama}"?\n\nCatatan: Pedagang di area ini tidak akan terhapus, lokasi lapak mereka akan dikosongkan.`
      )
    ) {
      try {
        setLoading(true);

        // 1. Lepas ikatan area pada pedagang (set konfigurasi_area_id ke null)
        const { error: unassignError } = await supabase
          .from('pendaftar')
          .update({ konfigurasi_area_id: null })
          .eq('konfigurasi_area_id', id);

        if (unassignError) {
          alert(`Gagal melepas ikatan pedagang: ${unassignError.message}`);
          setLoading(false);
          return;
        }

        // 2. Hapus area dari tabel konfigurasi_area
        const { error: deleteError } = await supabase
          .from('konfigurasi_area')
          .delete()
          .eq('id', id);

        if (deleteError) {
          alert(`Gagal menghapus area: ${deleteError.message}`);
        } else {
          alert(`Area "${nama}" berhasil dihapus!`);
          fetchAreas();
        }
      } catch (err: any) {
        alert(`Terjadi kesalahan: ${err.message || 'Gagal menghapus.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormArea({
      nama_area: '',
      event_type: 'CFD',
      lat_start: -6.8048,
      lon_start: 110.8405,
      lat_end: -6.8062,
      lon_end: 110.8418,
      lebar_simpang_meter: 7,
      jumlah_simpang: 2,
      ukuran_lapak_meter: 3,
      kapasitas_custom: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" /> Kelola Area & Peta Lokasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">Atur koordinat geofencing dan kapasitas lapak per ruas jalan</p>
        </div>
        <button onClick={fetchAreas} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 1. FORM TAMBAH / EDIT AREA + PETA */}
      <div ref={formRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-teal-600" />}
            {editingId ? 'Edit Area Jalan' : 'Tambah Area Jalan Baru'}
          </h2>
          {editingId && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
              Mode Edit Aktif
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Area Jalan</label>
              <input
                type="text"
                placeholder="Contoh: Jl. Ahmad Yani (Alun-alun)"
                value={formArea.nama_area}
                onChange={(e) => setFormArea({ ...formArea, nama_area: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Event</label>
              <select
                value={formArea.event_type}
                onChange={(e) => setFormArea({ ...formArea, event_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="CFD">CFD (Minggu Pagi)</option>
                <option value="CFN">CFN (Sabtu Malam)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kapasitas Lapak (Opsional)</label>
              <input
                type="number"
                placeholder="Kosongkan jika ingin dihitung otomatis"
                value={formArea.kapasitas_custom}
                onChange={(e) => setFormArea({ ...formArea, kapasitas_custom: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" /> Tentukan Koordinat di Peta:
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickMode('start')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all ${
                    pickMode === 'start' ? 'bg-teal-700 text-white border-teal-700 shadow' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" /> Set Titik Awal
                </button>
                <button
                  type="button"
                  onClick={() => setPickMode('end')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all ${
                    pickMode === 'end' ? 'bg-amber-600 text-white border-amber-600 shadow' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" /> Set Titik Akhir
                </button>
              </div>
            </div>

            {/* Render Dynamic AreaMap Component */}
            <AreaMap
              latStart={formArea.lat_start}
              lonStart={formArea.lon_start}
              latEnd={formArea.lat_end}
              lonEnd={formArea.lon_end}
              pickMode={pickMode}
              onMapClick={handleMapClick}
            />

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div><span className="font-bold text-teal-700">Titik Awal:</span> {formArea.lat_start}, {formArea.lon_start}</div>
              <div><span className="font-bold text-amber-600">Titik Akhir:</span> {formArea.lat_end}, {formArea.lon_end}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="py-3 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
            >
              {editingId ? 'Update Area Jalan' : 'Simpan Area Jalan Baru'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2. TABEL DAFTAR AREA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="font-bold text-slate-800 text-base">Daftar Area Jalan Terdaftar</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat area...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 px-3">Nama Area</th>
                  <th className="py-3 px-3">Event</th>
                  <th className="py-3 px-3">Koordinat Awal</th>
                  <th className="py-3 px-3">Koordinat Akhir</th>
                  <th className="py-3 px-3">Kapasitas</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areas.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-bold text-slate-800">{a.nama_area}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 bg-teal-100 text-teal-800 font-bold text-[10px] rounded-md uppercase">
                        {a.event_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{a.lat_start}, {a.lon_start}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{a.lat_end}, {a.lon_end}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {a.kapasitas_custom ? `${a.kapasitas_custom} Lapak (Custom)` : 'Dihitung Otomatis'}
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(a)}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.nama_area)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors inline-flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}