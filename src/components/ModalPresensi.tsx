'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ScanLine, Camera, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QRScanner from '@/components/QRScanner';

interface ModalPresensiProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalPresensi({ isOpen, onClose }: ModalPresensiProps) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [idUnik, setIdUnik] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // State GPS & Lokasi Pedagang
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);

  // Helper Menghitung Jarak Antara 2 Titik Koordinat GPS (Haversine Formula dalam Meter)
  const calculateDistanceMeter = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371000; // Radius bumi dalam meter
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Minta Akses GPS Realtime saat Modal Dibuka
  const requestGpsLocation = () => {
    setLoadingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Perangkat/Browser Anda tidak mendukung GPS.');
      setLoadingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setGpsError(null);
        setErrorMessage(''); // 👈 BERSIHKAN PESAN ERROR MERAH JIKA GPS SUDAH DIDAPAT
        setLoadingGps(false);
      },
      (error) => {
        console.warn('GPS Error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Izin GPS ditolak. Mohon izinkan akses lokasi pada browser HP Anda.');
        } else {
          setGpsError('GPS tidak aktif/lemah. Silakan aktifkan GPS HP Anda.');
        }
        setUserCoords(null);
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Reset state setiap kali modal dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      setMode('scan');
      setIdUnik('');
      setLoading(false);
      setSuccessData(null);
      setErrorMessage('');
      requestGpsLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Fungsi utama pencatatan presensi
  const handleProcessPresensi = async (scannedText: string) => {
    if (!scannedText || scannedText.trim() === '') return;

    // 1. VALIDASI WAJIB GPS HP TERDETEKSI
    if (!userCoords) {
      setErrorMessage('GPS belum terdeteksi! Mohon aktifkan GPS HP Anda dan berikan izin lokasi.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessData(null);

    // Bersihkan format ID Unik jika berupa link URL QR Code
    let cleanIdUnik = scannedText.trim();
    if (cleanIdUnik.includes('/')) {
      const parts = cleanIdUnik.split('/');
      cleanIdUnik = parts[parts.length - 1];
    }
    cleanIdUnik = cleanIdUnik.trim().toUpperCase();

    try {
      // 2. Query ke Supabase mengambil data pedagang + koordinat area (lat_start, lon_start, lat_end, lon_end)
      const { data: pedagang, error: pedagangError } = await supabase
        .from('pendaftar')
        .select(`
          *,
          konfigurasi_area:konfigurasi_area_id (
            nama_area,
            event_type,
            lat_start,
            lon_start,
            lat_end,
            lon_end
          )
        `)
        .eq('id_unik', cleanIdUnik)
        .maybeSingle();

      if (pedagangError) {
        setErrorMessage(`Error Database: ${pedagangError.message}`);
        setLoading(false);
        return;
      }

      if (!pedagang) {
        setErrorMessage(`ID Unik "${cleanIdUnik}" tidak ditemukan!`);
        setLoading(false);
        return;
      }

      // 3. HITUNG JARAK PEDAGANG KE AREA LAPAK PILIHANNYA
      const areaLatStart = pedagang.konfigurasi_area?.lat_start;
      const areaLonStart = pedagang.konfigurasi_area?.lon_start;
      const areaLatEnd = pedagang.konfigurasi_area?.lat_end;
      const areaLonEnd = pedagang.konfigurasi_area?.lon_end;

      // Hitung jarak ke titik awal dan titik akhir area jalan lapak
      const jarakKeStart = calculateDistanceMeter(userCoords.lat, userCoords.lon, areaLatStart, areaLonStart);
      const jarakKeEnd = calculateDistanceMeter(userCoords.lat, userCoords.lon, areaLatEnd, areaLonEnd);
      
      // Ambil jarak terdekat yang bisa dijangkau pedagang ke jalur lapaknya
      const jarakTerdekatMeter = Math.min(jarakKeStart, jarakKeEnd);
      
      // Batas Toleransi Jarak Radius (misal: 300 Meter dari jalur area lapak)
      const MAX_RADIUS_METER = 300; 

      // 🚨 TOLAK JIKA PEDAGANG BERADA DI LUAR LOKASI LAPAK YANG DIPILIH
      if (jarakTerdekatMeter > MAX_RADIUS_METER) {
        setErrorMessage(
          `PRESENSI DITOLAK! Anda berada di luar area lapak yang terdaftar (${pedagang.konfigurasi_area?.nama_area || 'Lapak Anda'}). Jarak Anda saat ini: ${jarakTerdekatMeter} meter dari lokasi.`
        );
        setLoading(false);
        return;
      }

      // =========================================================
      // 🚀 LOGIKA VALIDASI HARI, JAM & ABSEN GANDA HARI INI
      // =========================================================
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Minggu, 6 = Sabtu
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeDecimal = currentHour + currentMinute / 60;
      const eventType = pedagang.event_type || pedagang.konfigurasi_area?.event_type;

      // A. Validasi CFD (Khusus MINGGU jam 05:00 WIB)
      if (eventType === 'CFD') {
        if (currentDay !== 0) {
          setErrorMessage('Presensi lapak CFD hanya dibuka pada hari MINGGU!');
          setLoading(false);
          return;
        }
        if (currentTimeDecimal < 5.0) {
          setErrorMessage('Presensi CFD belum dibuka. Presensi dimulai pukul 05:00 WIB.');
          setLoading(false);
          return;
        }
      }

      // B. Validasi CFN (Khusus SABTU jam 17:30 WIB)
      if (eventType === 'CFN') {
        if (currentDay !== 6) {
          setErrorMessage('Presensi lapak CFN hanya dibuka pada hari SABTU!');
          setLoading(false);
          return;
        }
        if (currentTimeDecimal < 17.5) {
          setErrorMessage('Presensi CFN belum dibuka. Presensi dibuka mulai pukul 17:30 WIB.');
          setLoading(false);
          return;
        }
      }

      // C. Validasi Cek Absen Ganda Hari Ini
      const todayDate = now.toISOString().split('T')[0];
      const { data: existingAbsen } = await supabase
        .from('log_absensi')
        .select('id')
        .eq('pendaftar_id', pedagang.id)
        .eq('tanggal_absen', todayDate)
        .maybeSingle();

      if (existingAbsen) {
        setErrorMessage(`Pedagang ${pedagang.nama_lengkap} (${cleanIdUnik}) SUDAH presensi hari ini!`);
        setLoading(false);
        return;
      }
      // =========================================================

      // 4. SIMPAN KE TABEL log_absensi
      const payloadAbsen = {
        pendaftar_id: pedagang.id,
        tanggal_absen: todayDate,
        minggu_ke: 1,
        lat_user: userCoords.lat,
        lon_user: userCoords.lon,
        jarak_ke_midpoint_meter: jarakTerdekatMeter, // Mencatat jarak fisik asli ke Supabase
        status_kehadiran: 'Hadir',
      };

      const { error: presensiError } = await supabase.from('log_absensi').insert([payloadAbsen]);

      if (presensiError) {
        setErrorMessage(`Gagal mencatat presensi: ${presensiError.message}`);
      } else {
        setSuccessData({
          ...pedagang,
          jarak_terhitung: jarakTerdekatMeter,
        });
      }
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idUnik) handleProcessPresensi(idUnik);
  };

  const handleReset = () => {
    setIdUnik('');
    setErrorMessage('');
    setSuccessData(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4 text-xs relative border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
        
        {/* Tombol Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="space-y-1 pt-2">
          <span className="px-3 py-1 bg-teal-100 text-teal-800 font-extrabold text-[10px] rounded-full uppercase">
            Presensi Mandiri Pedagang
          </span>
          <h3 className="font-extrabold text-base text-slate-900 mt-2">Absensi Lapak Pedagang</h3>
        </div>

        {/* BUKTI / INDIKATOR STATUS GPS */}
        {gpsError ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-left space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">GPS / Lokasi Belum Aktif!</p>
                <p className="text-[10px] text-amber-700 leading-tight mt-0.5">{gpsError}</p>
              </div>
            </div>
            <button
              onClick={requestGpsLocation}
              disabled={loadingGps}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loadingGps ? 'animate-spin' : ''}`} />
              {loadingGps ? 'Mendeteksi Lokasi...' : 'Aktifkan / Coba Deteksi GPS'}
            </button>
          </div>
        ) : userCoords ? (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between text-[10px] px-3">
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> GPS Terdeteksi & Aktif
            </span>
            <span className="font-mono text-emerald-700 font-bold">OK</span>
          </div>
        ) : (
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[10px]">
            Memeriksa GPS HP Anda...
          </div>
        )}

        {/* TAMPILAN PRESENSI BERHASIL */}
        {successData ? (
          <div className="space-y-4 py-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">{successData.nama_lengkap}</h4>
              <p className="font-mono text-teal-700 font-bold mt-0.5">{successData.id_unik}</p>
              <p className="text-slate-500 text-[11px] mt-1">
                Area: <b>{successData.konfigurasi_area?.nama_area || '-'}</b>
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-center space-y-0.5">
              <p className="font-bold">Presensi Berhasil Dicatat!</p>
              <p className="text-[10px] text-emerald-600">
                Waktu: <b>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</b>
              </p>
              <p className="text-[10px] text-teal-700 font-semibold">
                Posisi: <b>{successData.jarak_terhitung} Meter dari Lapak</b>
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow transition-all"
            >
              Presensi Pedagang Lain
            </button>
          </div>
        ) : (
          /* POKOK PILIHAN (SCAN / MANUAL) */
          <div className="space-y-4 py-1">
            {/* Tab Navigasi */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('scan'); setErrorMessage(''); }}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'scan' ? 'bg-white text-teal-800 shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-4 h-4" /> Scan Kamera
              </button>

              <button
                type="button"
                onClick={() => { setMode('manual'); setErrorMessage(''); }}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'manual' ? 'bg-white text-teal-800 shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ScanLine className="w-4 h-4" /> Input Manual
              </button>
            </div>

            {/* NOTIFIKASI ERROR / PENOLAKAN */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2 text-left">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="font-bold text-[11px] leading-tight">{errorMessage}</p>
              </div>
            )}

            {/* MODE 1: SCAN KAMERA */}
            {mode === 'scan' && (
              <div className="space-y-2">
                {loading ? (
                  <div className="py-12 text-slate-500 font-bold">Memverifikasi Lokasi & ID...</div>
                ) : !userCoords ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="font-bold text-xs text-slate-700">Menunggu Lokasi GPS...</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Kamera akan aktif secara otomatis setelah lokasi GPS HP Anda terverifikasi.
                    </p>
                  </div>
                ) : (
                  <QRScanner onScanSuccess={(text) => handleProcessPresensi(text)} />
                )}
              </div>
            )}

            {/* INPUT MANUAL */}
            {mode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
                <div className="text-left space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Kode ID Unik Pedagang</label>
                  <input
                    type="text"
                    value={idUnik}
                    onChange={(e) => setIdUnik(e.target.value)}
                    placeholder="Contoh: CFD-96127"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !idUnik || !userCoords}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 text-white font-bold rounded-xl shadow transition-all"
                >
                  {loading ? 'Memproses...' : 'Proses Presensi'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}