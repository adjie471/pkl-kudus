'use client';

import { X, Printer, Image as ImageIcon, Store } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { domToPng } from 'modern-screenshot';

interface ModalCardAdminProps {
  data: any;
  namaDinas?: string;
  logoUrl?: string;
  bgCardUrl?: string;
  onClose: () => void;
}

export default function ModalCardAdmin({
  data,
  namaDinas = 'Dinas Perdagangan Kabupaten Kudus',
  logoUrl,
  bgCardUrl,
  onClose,
}: ModalCardAdminProps) {
  if (!data) return null;

  // Fungsi mengunduh Gambar menggunakan modern-screenshot (Presisi 100%)
  const handleDownloadImage = async () => {
    const cardElement = document.getElementById('printable-card');
    if (!cardElement) return;

    try {
      const dataUrl = await domToPng(cardElement, {
        scale: 3, // Resolusi tinggi (jernih/tidak pecah)
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Kartu_Pedagang_${data.id_unik}_${data.nama_lengkap.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (error: any) {
      alert(`Gagal mengunduh gambar kartu ID: ${error.message || 'Silakan coba lagi.'}`);
    }
  };

  return (
    <>
      {/* CSS KHUSUS CETAK PDF / PRINT BROWSER */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-card,
          #printable-card * {
            visibility: visible !important;
          }
          #printable-card {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        {/* Container Modal */}
        <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-xs relative border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
          
          {/* Tombol Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Modal */}
          <div className="space-y-1 pt-2">
            <span className="px-3 py-1 bg-teal-100 text-teal-800 font-extrabold text-[10px] rounded-full uppercase">
              Kartu Tanda Pedagang (Admin View)
            </span>
            <h3 className="font-extrabold text-base text-slate-900 mt-2">{data.nama_lengkap}</h3>
            <p className="text-[11px] text-slate-500">Pilih format unduhan kartu sesuai kebutuhan pedagang.</p>
          </div>

          {/* ================= AREA KARTU ID ================= */}
          <div
            id="printable-card"
            className="w-[350px] h-[215px] mx-auto rounded-2xl p-4 text-white shadow-xl relative overflow-hidden border border-teal-500/30 flex flex-col justify-between text-left"
            style={{
              backgroundImage: bgCardUrl ? `url(${bgCardUrl})` : 'linear-gradient(135deg, #0f766e 0%, #0f172a 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Header Kartu */}
            <div className="flex justify-between items-center border-b border-white/20 pb-1.5 z-10">
              <div className="flex items-center gap-2 max-w-[240px]">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain shrink-0" />
                ) : (
                  <div className="p-1 bg-white/10 rounded-lg shrink-0">
                    <Store className="w-4 h-4 text-amber-400" />
                  </div>
                )}
                
                <div>
                  <h4 className="font-extrabold text-[9px] leading-tight text-white uppercase tracking-tight">{namaDinas}</h4>
                  <p className="text-[8px] text-teal-300 font-mono">Kartu Tanda Pedagang Lapak</p>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-amber-400 text-slate-900 font-black text-[9px] rounded uppercase shadow shrink-0">
                {data.event_type}
              </span>
            </div>

            {/* Body Kartu */}
            <div className="grid grid-cols-12 gap-2 items-center z-10 my-auto">
              <div className="col-span-7 space-y-1.5">
                <div>
                  <p className="text-[8px] text-teal-200 uppercase font-mono leading-none">ID Unik Pedagang</p>
                  <p className="font-mono font-black text-sm text-amber-400 tracking-wider leading-tight">{data.id_unik}</p>
                </div>

                <div>
                  <p className="text-[8px] text-teal-200 uppercase font-mono leading-none">Nama Pedagang</p>
                  <p className="font-bold text-white text-xs truncate leading-tight">{data.nama_lengkap}</p>
                </div>

                <div>
                  <p className="text-[8px] text-teal-200 uppercase font-mono leading-none">Area Jalan & Lapak</p>
                  <p className="text-[10px] text-slate-100 font-medium truncate leading-tight">
                    {data.konfigurasi_area?.nama_area || '-'} {data.nomor_lapak ? `(#${data.nomor_lapak})` : ''}
                  </p>
                </div>
              </div>

              {/* Sisi Kanan: QR Code SVG */}
              <div className="col-span-5 flex flex-col items-center justify-center">
                <div className="bg-white p-1.5 rounded-xl w-24 h-24 flex items-center justify-center shadow-md border border-white/40">
                  <QRCodeSVG
                    value={data.id_unik}
                    size={80}
                    level="H"
                  />
                </div>
                <span className="text-[7px] text-slate-300 font-mono mt-1">Scan untuk Presensi</span>
              </div>
            </div>

            {/* Footer Kartu */}
            <div className="flex justify-between items-center text-[7.5px] text-teal-200 border-t border-white/10 pt-1 z-10 font-medium">
              <span className="truncate pr-2">
                <b className="text-amber-300">Penting:</b> Lapak hangus jika tidak berjualan{' '}
                {data.event_type === 'CFN' ? '4x berturut-turut' : '4 minggu berturut-turut'}.
              </span>
              <span className="shrink-0 font-mono text-slate-300">Kab. Kudus</span>
            </div>
          </div>
          {/* ================= END KARTU ID ================= */}

          {/* DUA PILIHAN TOMBOL AKSI */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleDownloadImage}
              className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl shadow flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              <ImageIcon className="w-4 h-4" /> Download Gambar
            </button>

            <button
              onClick={() => window.print()}
              className="py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow flex items-center justify-center gap-1.5 transition-all text-xs"
            >
              <Printer className="w-4 h-4" /> Cetak / PDF
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}