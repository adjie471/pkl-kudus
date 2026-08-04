'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, Save, RefreshCw, Upload, Building, Image as ImageIcon, Sliders } from 'lucide-react';

export default function AdminCmsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const [cmsData, setCmsData] = useState({
    nama_dinas: '',
    logo_url: '',
    bg_color_hero: 'bg-teal-800',
    bg_image_url: '',
    bg_opacity: 80, // Nilai default transparansi (80%)
    running_text: '',
    pengumuman_kegiatan: '',
    kontak_wa: '',
  });

  const fetchCmsData = async () => {
    setLoading(true);
    const { data } = await supabase.from('cms_landingpage').select('*').eq('id', 1).single();
    if (data) {
      setCmsData({
        nama_dinas: data.nama_dinas || 'Dinas Perdagangan Kabupaten Kudus',
        logo_url: data.logo_url || '',
        bg_color_hero: data.bg_color_hero || 'bg-teal-800',
        bg_image_url: data.bg_image_url || '',
        bg_opacity: data.bg_opacity ?? 80,
        running_text: data.running_text || '',
        pengumuman_kegiatan: data.pengumuman_kegiatan || '',
        kontak_wa: data.kontak_wa || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCmsData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBg(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `cms/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('cms-assets').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('cms-assets').getPublicUrl(filePath);

      if (type === 'logo') {
        setCmsData((prev) => ({ ...prev, logo_url: publicUrlData.publicUrl }));
      } else {
        setCmsData((prev) => ({ ...prev, bg_image_url: publicUrlData.publicUrl }));
      }
    } catch (err: any) {
      alert(`Gagal mengunggah file: ${err.message}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBg(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('cms_landingpage').upsert({
      id: 1,
      ...cmsData,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Pengaturan CMS Landing Page berhasil diperbarui!');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-xs text-slate-400">Memuat data CMS...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600" /> Pengaturan CMS Landing Page
          </h1>
          <p className="text-xs text-slate-500 mt-1">Atur nama dinas, upload logo, background foto kegiatan, dan pengumuman</p>
        </div>
        <button onClick={fetchCmsData} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* Identitas Dinas */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-teal-600" /> Identitas Instansi & Logo
            </h3>
            
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Instansi / Dinas</label>
              <input
                type="text"
                value={cmsData.nama_dinas}
                onChange={(e) => setCmsData({ ...cmsData, nama_dinas: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Upload Logo Dinas</label>
              <div className="flex items-center gap-3">
                {cmsData.logo_url && (
                  <img src={cmsData.logo_url} alt="Logo Preview" className="w-12 h-12 object-contain bg-white p-1 rounded-xl border" />
                )}
                <label className="cursor-pointer py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl border border-teal-200 flex items-center gap-2 transition-all">
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? 'Mengunggah Logo...' : 'Pilih File Logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                </label>
              </div>
            </div>
          </div>

          {/* Background & Slider Transparansi */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <ImageIcon className="w-4 h-4 text-teal-600" /> Background Landing Page
            </h3>
            
            <div>
              <label className="block font-bold text-slate-700 mb-2">Upload Foto Kegiatan CFD/CFN</label>
              {cmsData.bg_image_url && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 mb-2">
                  <img src={cmsData.bg_image_url} alt="Background Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCmsData({ ...cmsData, bg_image_url: '' })}
                    className="absolute top-2 right-2 px-2 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow"
                  >
                    Hapus Foto
                  </button>
                </div>
              )}

              <label className="cursor-pointer py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl border border-teal-200 inline-flex items-center gap-2 transition-all">
                <Upload className="w-4 h-4" />
                {uploadingBg ? 'Mengunggah Foto...' : 'Upload Foto Background'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'bg')} />
              </label>
            </div>

            {/* Slider Transparansi Overlay */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" /> Tingkat Kegelapan Overlay (Transparansi):
                </label>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {cmsData.bg_opacity}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="5"
                value={cmsData.bg_opacity}
                onChange={(e) => setCmsData({ ...cmsData, bg_opacity: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Semakin besar persentase (misal 85%), background akan semakin gelap agar teks di atasnya terlihat semakin kontras dan jelas.
              </p>
            </div>
          </div>

          {/* Pengumuman & Teks Running */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Running Text (Bar Atas Landing Page)</label>
              <textarea
                rows={2}
                value={cmsData.running_text}
                onChange={(e) => setCmsData({ ...cmsData, running_text: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pengumuman & Petunjuk Pendaftaran</label>
              <textarea
                rows={3}
                value={cmsData.pengumuman_kegiatan}
                onChange={(e) => setCmsData({ ...cmsData, pengumuman_kegiatan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Bantuan Dinas (Format 62...)</label>
              <input
                type="text"
                value={cmsData.kontak_wa}
                onChange={(e) => setCmsData({ ...cmsData, kontak_wa: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan CMS'}
          </button>
        </form>
      </div>
    </div>
  );
}