'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QrCode, Keyboard, CheckCircle2, AlertCircle, X } from 'lucide-react';
import QRScanner from '@/components/QRScanner';

export default function AdminScanPage() {
  const [scanMode, setScanMode] = useState<'scan' | 'manual'>('scan');
  const [idUnik, setIdUnik] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupData, setPopupData] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const handlePresensiByAdmin = async (rawScannedText: string) => {
    if (!rawScannedText || !rawScannedText.trim()) {
      setPopupData({ success: false, message: 'Masukkan ID Unik Pedagang!' });
      return;
    }

    // Extract ID Unik jika teks QR berupa URL (contoh: https://.../card/CFD-96127)
    let cleanId = rawScannedText.trim();
    if (cleanId.includes('/')) {
      const parts = cleanId.split('/');
      cleanId = parts[parts.length - 1];
    }
    cleanId = cleanId.trim().toUpperCase();

    setLoading(true);

    try {
      // 1. Query ke Supabase mencari pendaftar berdasarkan ID Unik
      const { data: pendaftar, error: fetchErr } = await supabase
        .from('pendaftar')
        .select('*, konfigurasi_area:area_id(nama_area, event_type)')
        .eq('id_unik', cleanId)
        .maybeSingle();

      if (fetchErr) {
        setLoading(false);
        setPopupData({
          success: false,
          message: `Error Database: ${fetchErr.message}`,
        });
        return;
      }

      if (!pendaftar) {
        setLoading(false);
        setPopupData({
          success: false,
          message: `ID Unik "${cleanId}" tidak ditemukan di database!`,
        });
        return;
      }

      // 2. Cek Apakah Pedagang Sudah Absen Hari Ini
      const now = new Date();
      const todayDate = now.toISOString().split('T')[0];

      const { data: existingAbsen } = await supabase
        .from('log_absensi')
        .select('id')
        .eq('pendaftar_id', pendaftar.id)
        .eq('tanggal_absen', todayDate)
        .maybeSingle();

      if (existingAbsen) {
        setLoading(false);
        setPopupData({
          success: false,
          message: `Pedagang ${pendaftar.nama_lengkap} (${cleanId}) SUDAH melakukan presensi hari ini!`,
          data: pendaftar,
        });
        return;
      }

      // 3. Insert Presensi oleh Admin (disesuaikan dengan skema tabel log_absensi)
      const { error: insertErr } = await supabase.from('log_absensi').insert([
        {
          pendaftar_id: pendaftar.id,
          tanggal_absen: todayDate,
          minggu_ke: 1,
          lat_user: 0,
          lon_user: 0,
          jarak_ke_midpoint_meter: 0,
          status_kehadiran: 'Hadir',
        },
      ]);

      if (insertErr) {
        setPopupData({ success: false, message: `Gagal mencatat: ${insertErr.message}` });
      } else {
        setPopupData({
          success: true,
          message: 'Presensi Lapangan Berhasil Dicatat!',
          data: pendaftar,
        });
        setIdUnik('');
      }
    } catch (err: any) {
      setPopupData({ success: false, message: `Terjadi kesalahan: ${err.message || 'Silakan coba lagi.'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-600" /> Scan & Presensi Lapangan
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gunakan kamera HP petugas (dilengkapi Zoom) atau ketik ID Pedagang</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setScanMode('scan'); setPopupData(null); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              scanMode === 'scan' ? 'bg-white text-teal-800 shadow' : 'text-slate-500'
            }`}
          >
            <QrCode className="w-4 h-4" /> Scan QR Kamera
          </button>
          <button
            type="button"
            onClick={() => { setScanMode('manual'); setPopupData(null); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              scanMode === 'manual' ? 'bg-white text-teal-800 shadow' : 'text-slate-500'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Input ID Manual
          </button>
        </div>

        {/* Tab 1: Kamera Scanner */}
        {scanMode === 'scan' && (
          <QRScanner
            onScanSuccess={(decodedId) => {
              handlePresensiByAdmin(decodedId);
            }}
          />
        )}

        {/* Tab 2: Input ID Manual */}
        {scanMode === 'manual' && (
          <div className="space-y-3 text-xs">
            <label className="block font-bold text-slate-700">Masukkan ID Unik Pedagang:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: CFD-96127"
                value={idUnik}
                onChange={(e) => setIdUnik(e.target.value.toUpperCase())}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
              />
              <button
                onClick={() => handlePresensiByAdmin(idUnik)}
                disabled={loading}
                className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow transition-all"
              >
                {loading ? 'Memproses...' : 'Proses'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP MODAL SUKSES / DETAIL PEDAGANG KHUSUS PETUGAS ADMIN */}
      {popupData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-xs relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setPopupData(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b pb-3">
              <div className={`p-2.5 rounded-2xl ${popupData.success ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'}`}>
                {popupData.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{popupData.message}</h3>
                <p className="text-[10px] text-slate-400">Verifikasi Presensi Petugas Dinas</p>
              </div>
            </div>

            {/* DETAIL DATA LENGKAP PEDAGANG */}
            {popupData.data && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">ID Pedagang</span>
                    <b className="font-mono text-sm text-teal-700">{popupData.data.id_unik}</b>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-lg uppercase">
                    {popupData.data.event_type || 'LAPAK'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nama Lengkap:</span>
                    <b className="text-slate-900">{popupData.data.nama_lengkap}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                    <b className="font-mono">{popupData.data.whatsapp || '-'}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Area Jalan:</span>
                    <b>{popupData.data.konfigurasi_area?.nama_area || '-'}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nomor Lapak:</span>
                    <b className="text-teal-700 font-black">{popupData.data.nomor_lapak ? `#${popupData.data.nomor_lapak}` : 'Auto'}</b>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Alamat Domisili:</span>
                    <b>{popupData.data.alamat || '-'}</b>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setPopupData(null)}
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow"
            >
              Lanjutkan Scan Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}