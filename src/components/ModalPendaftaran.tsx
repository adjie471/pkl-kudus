'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AreaOption {
  id: string;
  nama_area: string;
  event_type: string;
}

interface ModalPendaftaranProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaOption[];
  onSuccess: (pendaftarData: any) => void;
}

export default function ModalPendaftaran({
  isOpen,
  onClose,
  areas,
  onSuccess,
}: ModalPendaftaranProps) {
  const [formDaftar, setFormDaftar] = useState({
    nama_lengkap: '',
    whatsapp: '',
    alamat: '',
    event_type: 'CFD',
    konfigurasi_area_id: '',
  });

  const [loading, setLoading] = useState(false);

  // Filter area yang sesuai dengan Event CFD/CFN yang dipilih
  const filteredAreas = areas.filter((a) => a.event_type === formDaftar.event_type);

  // Auto select area pertama yang cocok saat modal dibuka atau event berubah
  useEffect(() => {
    if (filteredAreas.length > 0) {
      setFormDaftar((prev) => ({
        ...prev,
        konfigurasi_area_id: filteredAreas[0].id,
      }));
    } else {
      setFormDaftar((prev) => ({
        ...prev,
        konfigurasi_area_id: '',
      }));
    }
  }, [formDaftar.event_type, areas]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const targetAreaId = formDaftar.konfigurasi_area_id || filteredAreas[0]?.id || null;

    if (!targetAreaId) {
      alert('Silakan pilih area jalan terlebih dahulu. Jika belum ada area, buat area terlebih dahulu di menu Admin.');
      setLoading(false);
      return;
    }

    const idUnik = `${formDaftar.event_type}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPendaftarData = {
      id_unik: idUnik,
      nama_lengkap: formDaftar.nama_lengkap,
      whatsapp: formDaftar.whatsapp,
      alamat: formDaftar.alamat,
      event_type: formDaftar.event_type,
      konfigurasi_area_id: targetAreaId,
      status: 'Aktif',
    };

    const { error } = await supabase.from('pendaftar').insert([newPendaftarData]);

    setLoading(false);

    if (error) {
      alert(`Gagal mendaftar: ${error.message}`);
    } else {
      const selectedAreaObj = areas.find((a) => a.id === targetAreaId);

      // Mengirimkan data pendaftar baru ke parent component
      onSuccess({
        ...newPendaftarData,
        nama_area: selectedAreaObj?.nama_area || 'Area Terdaftar',
      });

      // Reset form
      setFormDaftar({
        nama_lengkap: '',
        whatsapp: '',
        alamat: '',
        event_type: 'CFD',
        konfigurasi_area_id: '',
      });

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 text-xs relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-base text-slate-800">Form Pendaftaran Lapak</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Nama Pedagang"
              value={formDaftar.nama_lengkap}
              onChange={(e) => setFormDaftar({ ...formDaftar, nama_lengkap: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
            <input
              type="text"
              required
              placeholder="08123456789"
              value={formDaftar.whatsapp}
              onChange={(e) => setFormDaftar({ ...formDaftar, whatsapp: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Tinggal</label>
            <input
              type="text"
              required
              placeholder="Kecamatan / Desa"
              value={formDaftar.alamat}
              onChange={(e) => setFormDaftar({ ...formDaftar, alamat: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Event</label>
              <select
                value={formDaftar.event_type}
                onChange={(e) => setFormDaftar({ ...formDaftar, event_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
              >
                <option value="CFD">CFD (Minggu Pagi)</option>
                <option value="CFN">CFN (Sabtu Malam)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Area Jalan</label>
              <select
                value={formDaftar.konfigurasi_area_id}
                onChange={(e) => setFormDaftar({ ...formDaftar, konfigurasi_area_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                required
              >
                {filteredAreas.length === 0 ? (
                  <option value="">-- Area Tidak Tersedia --</option>
                ) : (
                  filteredAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama_area}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || filteredAreas.length === 0}
            className="w-full py-3 bg-teal-700 text-white font-bold rounded-xl shadow mt-2 hover:bg-teal-800 disabled:bg-slate-300"
          >
            {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
          </button>
        </form>
      </div>
    </div>
  );
}