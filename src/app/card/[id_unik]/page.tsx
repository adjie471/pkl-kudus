'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Printer, ArrowLeft, Clock, CheckCircle2, Search } from 'lucide-react';
import Link from 'next/link';

export default function CardPage() {
  const params = useParams();
  const rawQuery = (params.id_unik as string) || '';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getCardData() {
      setLoading(true);

      // Normalisasi input jika berupa nomor WA (misal: 08123 -> 628123)
      let queryVal = rawQuery.trim();
      let queryWa = queryVal;
      if (queryWa.startsWith('08')) {
        queryWa = '628' + queryWa.slice(2);
      } else if (queryWa.startsWith('+62')) {
        queryWa = queryWa.slice(1);
      }

      // Query fleksibel: Cek ID Unik ATAU Nomor WhatsApp
      const { data: pendaftar } = await supabase
        .from('pendaftar')
        .select('*, konfigurasi_area(nama_area)')
        .or(`id_unik.eq.${queryVal.toUpperCase()},whatsapp.eq.${queryWa}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setData(pendaftar);
      setLoading(false);
    }

    if (rawQuery) getCardData();
  }, [rawQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Mencari Data Pendaftaran...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-sm w-full bg-white p-6 rounded-2xl shadow-md text-center space-y-4">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-800">Data Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tidak ada data dengan ID Unik atau No. WhatsApp: <span className="font-mono font-bold text-slate-700">{rawQuery}</span>
            </p>
          </div>
          <Link
            href="/"
            className="inline-block w-full py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl shadow"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col justify-center items-center">
      <div className="max-w-sm w-full space-y-4">
        
        {/* Tombol Navigasi Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        {/* TAMPILAN JIKA STATUS: ANTREAN */}
        {data.status === 'Antri' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-amber-200 text-center space-y-4">
            <div className="inline-flex p-3 bg-amber-100 rounded-full text-amber-600">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Status: Dalam Antrean
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-3">{data.nama_lengkap}</h2>
              <p className="text-xs font-mono text-slate-400">ID: {data.id_unik}</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-amber-800/70">Event:</span>
                <span className="font-bold text-amber-900">{data.event_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800/70">Area Lapak:</span>
                <span className="font-semibold text-amber-900 text-right">{data.konfigurasi_area?.nama_area}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Kuota area saat ini penuh. Sistem akan mempromosikan status Anda menjadi <b>Aktif</b> dan memberikan nomor lapak secara otomatis jika ada lapak yang kosong.
            </p>
          </div>
        )}

        {/* TAMPILAN JIKA STATUS: AKTIF (ID CARD DIGITAL) */}
        {data.status === 'Aktif' && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative print:shadow-none">
            {/* Header ID Card */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-6 text-white text-center">
              <div className="flex justify-center items-center gap-1.5 mb-1">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span className="text-[10px] tracking-widest font-bold uppercase text-teal-200">
                  Kartu Tanda Pedagang Resmi
                </span>
              </div>
              <h2 className="text-base font-black uppercase tracking-wide">Dinas Perdagangan Kudus</h2>
            </div>

            {/* Content Body */}
            <div className="p-6 text-center space-y-4">
              <div className="inline-block">
                <span className="px-3 py-1 bg-teal-100 text-teal-800 border border-teal-300 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Status: Lapak Aktif
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800">{data.nama_lengkap}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {data.id_unik}</p>
              </div>

              {/* Box Rincian Lapak */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs border border-slate-100">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-bold text-slate-800">{data.event_type}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Nomor Lapak:</span>
                  <span className="font-black text-amber-600 text-base">#{data.nomor_lapak}</span>
                </div>
                <div className="flex justify-between items-start py-1">
                  <span className="text-slate-500 shrink-0">Area:</span>
                  <span className="font-semibold text-slate-800 text-right">{data.konfigurasi_area?.nama_area}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl shadow-inner">
                <QRCodeSVG value={`https://sipedagang.kuduskab.go.id/card/${data.id_unik}`} size={130} />
                <p className="text-[10px] text-slate-400 mt-2">Pindai QR untuk verifikasi identitas di lokasi</p>
              </div>
            </div>
          </div>
        )}

        {/* Tombol Cetak PDF / Printer (Hanya jika Aktif) */}
        {data.status === 'Aktif' && (
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak ID Card (PDF / Printer)
          </button>
        )}

      </div>
    </div>
  );
}