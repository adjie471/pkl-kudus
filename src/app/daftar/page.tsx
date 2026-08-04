'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, Store, MapPin, Phone, User, Home, Sparkles } from 'lucide-react';

interface Area {
  id: string;
  nama_area: string;
  event_type: string;
}

export default function DaftarPage() {
  const [eventType, setEventType] = useState<'CFD' | 'CFN'>('CFD');
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [formData, setFormData] = useState({ nama: '', whatsapp: '', alamat: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; id_unik?: string } | null>(null);

  useEffect(() => {
    async function fetchAreas() {
      const { data } = await supabase
        .from('konfigurasi_area')
        .select('id, nama_area, event_type')
        .eq('event_type', eventType);
      
      if (data) {
        setAreas(data);
        if (data.length > 0) setSelectedArea(data[0].id);
      }
    }
    fetchAreas();
  }, [eventType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase
      .from('pendaftar')
      .insert([
        {
          nama_lengkap: formData.nama,
          whatsapp: formData.whatsapp,
          alamat: formData.alamat,
          event_type: eventType,
          area_id: selectedArea,
        },
      ])
      .select('id_unik, status, nomor_lapak')
      .single();

    setLoading(false);

    if (error) {
      setResult({ success: false, message: error.message });
    } else {
      const msg = data.status === 'Aktif' 
        ? `Pendaftaran Berhasil! Lapak Nomor: ${data.nomor_lapak}`
        : `Kuota Aktif Penuh. Anda masuk ke daftar ANTREAN.`;
      setResult({ success: true, message: msg, id_unik: data.id_unik });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Form */}
        <div className="bg-teal-700 p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-teal-600/50 rounded-xl mb-3">
            <Store className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-xl font-bold">Pendaftaran Lapak PKL</h2>
          <p className="text-teal-100 text-xs mt-1">Dinas Perdagangan Kabupaten Kudus</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Toggle Event */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Pilih Event</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setEventType('CFD')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  eventType === 'CFD' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                CFD (Minggu Pagi)
              </button>
              <button
                type="button"
                onClick={() => setEventType('CFN')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  eventType === 'CFN' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                CFN (Sabtu Malam)
              </button>
            </div>
          </div>

          {/* Pilih Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Area / Ruas Jalan</label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
                required
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nama_area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Sesuai KTP"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Nomor WhatsApp</label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="628123456789"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Alamat Lengkap</label>
            <div className="relative">
              <Home className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <textarea
                required
                rows={2}
                placeholder="Desa/Kelurahan, Kecamatan"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses...' : 'Daftar Lapak Sekarang'}
          </button>
        </form>

        {/* Notifikasi Hasil */}
        {result && (
          <div className={`p-4 mx-6 mb-6 rounded-xl text-sm ${result.success ? 'bg-teal-50 border border-teal-200 text-teal-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
            <p className="font-semibold">{result.message}</p>
            {result.id_unik && (
              <a
                href={`/card/${result.id_unik}`}
                className="inline-block mt-3 px-4 py-2 bg-teal-700 text-white font-medium text-xs rounded-lg shadow"
              >
                Lihat ID Card Publik
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}