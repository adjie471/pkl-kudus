'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Navigation, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';

export default function AbsenPage() {
  const [idUnik, setIdUnik] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success?: boolean; text: string } | null>(null);

  const handleAbsen = () => {
    if (!idUnik) {
      setStatusMsg({ success: false, text: 'Masukkan ID Unik Anda!' });
      return;
    }

    if (!navigator.geolocation) {
      setStatusMsg({ success: false, text: 'Browser/HP Anda tidak mendukung Geolocation.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: 'Mengambil koordinat GPS...' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Panggil Stored Procedure di Supabase
        const { data, error } = await supabase.rpc('submit_absensi_geofencing', {
          p_id_unik: idUnik,
          p_lat: lat,
          p_lon: lon,
        });

        setLoading(false);

        if (error) {
          setStatusMsg({ success: false, text: `Sistem Error: ${error.message}` });
        } else {
          setStatusMsg({ success: data.success, text: data.message });
        }
      },
      (err) => {
        setLoading(false);
        setStatusMsg({ success: false, text: `Gagal mengakses GPS: ${err.message}. Pastikan izin lokasi diaktifkan.` });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center items-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-amber-100 rounded-full mb-2">
            <Navigation className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Presensi Mandiri PKL</h1>
          <p className="text-xs text-slate-500 mt-1">Verifikasi Geofencing Lokasi Lapak</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">ID Unik Lapak</label>
            <div className="relative">
              <QrCode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Contoh: CFD-87432"
                value={idUnik}
                onChange={(e) => setIdUnik(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleAbsen}
            disabled={loading}
            className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Memverifikasi Lokasi...' : 'Absen Hadir Sekarang'}
          </button>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
            statusMsg.success === true ? 'bg-teal-50 border border-teal-200 text-teal-800' :
            statusMsg.success === false ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {statusMsg.success === true && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
            {statusMsg.success === false && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <p>{statusMsg.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}