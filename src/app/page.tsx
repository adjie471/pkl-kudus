'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, ShieldCheck, Lock, MapPin } from 'lucide-react';
import Link from 'next/link';

// Import Komponen Modal Modular
import ModalPresensi from '@/components/ModalPresensi';
import ModalPendaftaran from '@/components/ModalPendaftaran';
import ModalCardPedagang from '@/components/ModalCardPedagang';

export default function LandingPage() {
  const [cms, setCms] = useState({
    nama_dinas: 'Dinas Perdagangan Kabupaten Kudus',
    logo_url: '',
    bg_color_hero: 'bg-teal-800',
    bg_image_url: '',
    bg_opacity: 80,
    running_text: 'Selamat Datang di Portal Resmi Pendaftaran Lapak CFD & CFN.',
    pengumuman_kegiatan: 'Pendaftaran lapak dibuka secara online. Pastikan presensi dilakukan saat berjualan di lokasi.',
    kontak_wa: '628123456789',
  });

  const [areas, setAreas] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'CFD' | 'CFN' | 'SEMUA'>('CFD');

  // State Modal Controls
  const [showDaftarModal, setShowDaftarModal] = useState(false);
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [daftarSuccessData, setDaftarSuccessData] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Fetch CMS
      const { data: cmsData } = await supabase.from('cms_landingpage').select('*').eq('id', 1).single();
      if (cmsData) {
        setCms({
          nama_dinas: cmsData.nama_dinas || 'Dinas Perdagangan Kabupaten Kudus',
          logo_url: cmsData.logo_url || '',
          bg_color_hero: cmsData.bg_color_hero || 'bg-teal-800',
          bg_image_url: cmsData.bg_image_url || '',
          bg_opacity: cmsData.bg_opacity ?? 80,
          running_text: cmsData.running_text || '',
          pengumuman_kegiatan: cmsData.pengumuman_kegiatan || '',
          kontak_wa: cmsData.kontak_wa || '628123456789',
        });
      }

      // 2. Fetch Area & Data Pendaftar
      const { data: areaData } = await supabase.from('konfigurasi_area').select('*').order('nama_area', { ascending: true });
      const { data: pendaftarData } = await supabase.from('pendaftar').select('konfigurasi_area_id, area_id, status');

      if (areaData) {
        const mappedAreas = areaData.map((area) => {
          // Cocokkan ID area dengan pendaftar (mendukung UUID / Number)
          const pendaftarArea = pendaftarData?.filter((p) => {
            const targetAreaId = p.konfigurasi_area_id || p.area_id;
            if (!targetAreaId || !area.id) return false;
            return String(targetAreaId).trim() === String(area.id).trim();
          }) || [];

          const terisi = pendaftarArea.filter((p) => p.status === 'Aktif').length;
          const antrean = pendaftarArea.filter((p) => p.status === 'Antri').length;
          const kapasitasTotal = area.kapasitas_custom || area.kuota || 10;

          return {
            ...area,
            kapasitasTotal,
            terisi,
            antrean,
            sisa: Math.max(0, kapasitasTotal - terisi),
          };
        });

        setAreas(mappedAreas);
      }
    }
    loadData();
  }, []);

  // Filter Area berdasarkan Tab CFD / CFN
  const filteredAreas = areas.filter((a) => {
    if (selectedTab === 'SEMUA') return true;
    return a.event_type === selectedTab;
  });

  return (
    <div className="min-h-screen relative bg-slate-900 text-slate-800">
      {/* OVERLAY BACKGROUND */}
      {cms.bg_image_url ? (
        <div className="fixed inset-0 z-0">
          <img src={cms.bg_image_url} alt="Background Full" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950/90 backdrop-blur-[1px]"
            style={{ opacity: (cms.bg_opacity ?? 80) / 100 }}
          />
        </div>
      ) : (
        <div className={`fixed inset-0 z-0 ${cms.bg_color_hero}`} />
      )}

      {/* WRAPPER KONTEN UTAMA */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* TOP RUNNING TEXT BAR */}
        {cms.running_text && (
          <div className="bg-amber-400 text-slate-900 font-bold text-xs py-2 px-4 overflow-hidden whitespace-nowrap shadow-sm">
            <div className="inline-block animate-marquee">{cms.running_text}</div>
          </div>
        )}

        {/* NAVBAR */}
        <nav className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {cms.logo_url ? (
                <img src={cms.logo_url} alt="Logo Instansi" className="w-10 h-10 object-contain" />
              ) : (
                <div className="p-2 bg-teal-700 text-white rounded-xl">
                  <Store className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-sm text-slate-900 leading-tight">{cms.nama_dinas}</h1>
                <p className="text-[10px] text-slate-500 font-medium">Sistem Pelayanan Pedagang Kaki Lima (PKL)</p>
              </div>
            </div>

            <Link href="/admin/login" className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Admin
            </Link>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="text-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <span className="px-3 py-1 bg-amber-400 text-slate-900 font-bold text-[11px] rounded-full uppercase tracking-wider shadow-lg">
              Portal Resepsi Lapak CFD & CFN
            </span>

            <h2
              className="text-2xl sm:text-4xl font-extrabold leading-tight text-white"
              style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.9)' }}
            >
              Pendaftaran Lapak CFD dan CFN
            </h2>

            <div className="bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl max-w-2xl mx-auto border border-white/20 shadow-xl">
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                {cms.pengumuman_kegiatan}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDaftarModal(true)}
                className="py-3 px-6 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" /> Daftar Lapak Baru
              </button>
              <button
                onClick={() => setShowAbsenModal(true)}
                className="py-3 px-6 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs rounded-xl border border-white/30 backdrop-blur shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-teal-300" /> Presensi Mandiri
              </button>
            </div>
          </div>
        </section>

        {/* SEKSI DAFTAR AREA JALAN TERSEDIA */}
        <section className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg drop-shadow">Area & Ketersediaan Lapak</h3>
              <p className="text-xs text-slate-300 drop-shadow">Pantau jumlah terisi, sisa kuota, dan antrean pedagang</p>
            </div>

            {/* TAB FILTER CFD / CFN */}
            <div className="flex p-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/20 text-xs font-bold">
              <button
                onClick={() => setSelectedTab('CFD')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedTab === 'CFD' ? 'bg-amber-400 text-slate-900 shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Event CFD (Minggu)
              </button>
              <button
                onClick={() => setSelectedTab('CFN')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedTab === 'CFN' ? 'bg-amber-400 text-slate-900 shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Event CFN (Sabtu)
              </button>
              <button
                onClick={() => setSelectedTab('SEMUA')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedTab === 'SEMUA' ? 'bg-amber-400 text-slate-900 shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Semua Area
              </button>
            </div>
          </div>

          {/* GRID KARTU AREA */}
          {filteredAreas.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-white/10 text-xs">
              Belum ada area jalan yang dikonfigurasi untuk event ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAreas.map((area) => (
                <div key={area.id} className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-teal-700 text-white font-bold text-[10px] rounded-lg uppercase">
                      {area.event_type}
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      Total: {area.kapasitasTotal} Lapak
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" /> {area.nama_area}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-200 text-[11px]">
                    <div className="bg-teal-50 p-2 rounded-xl border border-teal-100">
                      <p className="text-teal-700 font-medium">Terisi</p>
                      <p className="font-black text-teal-800 text-sm">{area.terisi}</p>
                    </div>

                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                      <p className="text-amber-700 font-medium">Sisa Lapak</p>
                      <p className="font-black text-amber-800 text-sm">{area.sisa}</p>
                    </div>

                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                      <p className="text-slate-600 font-medium">Antrean</p>
                      <p className="font-black text-slate-800 text-sm">{area.antrean}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-950/90 backdrop-blur-md text-slate-400 text-xs py-8 border-t border-white/10 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
            <p className="font-bold text-white">{cms.nama_dinas}</p>
            <p>
              Layanan Bantuan WhatsApp:{' '}
              <a href={`https://wa.me/${cms.kontak_wa}`} target="_blank" className="text-teal-400 font-mono font-bold">
                +{cms.kontak_wa}
              </a>
            </p>
            <p className="text-[10px] text-slate-500">© 2026 Pemerintah Kabupaten Kudus. All Rights Reserved.</p>
          </div>
        </footer>
      </div>

      {/* MODAL 1: FORM PENDAFTARAN */}
      <ModalPendaftaran
        isOpen={showDaftarModal}
        onClose={() => setShowDaftarModal(false)}
        areas={areas}
        onSuccess={(data) => setDaftarSuccessData(data)}
      />

      {/* MODAL 2: PRESENSI MANDIRI */}
      <ModalPresensi
        isOpen={showAbsenModal}
        onClose={() => setShowAbsenModal(false)}
      />

      {/* MODAL 3: KARTU ID PEDAGANG (SETELAH DAFTAR SUKSES) */}
      <ModalCardPedagang
        data={daftarSuccessData}
        namaDinas={cms.nama_dinas}
        onClose={() => {
          setDaftarSuccessData(null);
          window.location.reload();
        }}
      />
    </div>
  );
}