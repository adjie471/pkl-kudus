'use client';

import { X } from 'lucide-react';

interface ModalCardPedagangProps {
  data: any | null;
  namaDinas: string;
  onClose: () => void;
}

export default function ModalCardPedagang({ data, namaDinas, onClose }: ModalCardPedagangProps) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4 text-xs relative border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
        {/* Tombol Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pt-2">
          <span className="px-3 py-1 bg-teal-100 text-teal-800 font-extrabold text-[10px] rounded-full uppercase">
            Pendaftaran Berhasil!
          </span>
          <h3 className="font-extrabold text-base text-slate-900 mt-2">Kartu Tanda Pedagang (ID Card)</h3>
          <p className="text-[11px] text-slate-500">Simpan atau screenshot kartu ini untuk presensi di lokasi.</p>
        </div>

        {/* DESIGN KARTU ID PEDAGANG */}
        <div className="bg-gradient-to-br from-teal-800 to-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4 text-left relative overflow-hidden border border-teal-500/30">
          <div className="flex justify-between items-start border-b border-white/20 pb-2">
            <div>
              <h4 className="font-bold text-xs leading-tight text-white">{namaDinas}</h4>
              <p className="text-[9px] text-teal-300 font-mono">Lapak {data.event_type}</p>
            </div>
            <span className="px-2 py-0.5 bg-amber-400 text-slate-900 font-black text-[9px] rounded uppercase shadow">
              {data.event_type}
            </span>
          </div>

          {/* GENERATE QR CODE ID CARD */}
          <div className="bg-white p-3 rounded-xl w-32 h-32 mx-auto flex items-center justify-center shadow-md">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                `https://sipedagang.kuduskab.go.id/card/${data.id_unik}`
              )}`}
              alt="QR Code Pedagang"
              className="w-full h-full object-contain"
            />
          </div>

          {/* RINCIAN DATA PEDAGANG */}
          <div className="space-y-1.5 text-center pt-1">
            <p className="text-[10px] text-slate-300 uppercase font-mono">ID Unik Pedagang</p>
            <p className="font-mono font-black text-xl text-amber-400 tracking-wider">{data.id_unik}</p>

            <div className="pt-2 border-t border-white/10 text-xs">
              <p className="font-bold text-white text-sm">{data.nama_lengkap}</p>
              <p className="text-[11px] text-teal-200">{data.nama_area}</p>
            </div>
          </div>
        </div>

        {/* TOMBOL AKSI */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
          >
            Cetak / Simpan Kartu ID
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
          >
            Tutup & Selesai
          </button>
        </div>
      </div>
    </div>
  );
}