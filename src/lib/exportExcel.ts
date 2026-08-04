import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function exportPendaftarToExcel() {
  try {
    // 1. Ambil data Pendaftar lengkap
    const { data: pendaftarList, error: errPendaftar } = await supabase
      .from('pendaftar')
      .select('*, konfigurasi_area:konfigurasi_area_id(nama_area)');

    if (errPendaftar || !pendaftarList) {
      alert('Gagal mengambil data pendaftar untuk diexport.');
      return;
    }

    // 2. Ambil seluruh riwayat log absensi/kehadiran
    const { data: logAbsensi } = await supabase
      .from('log_absensi')
      .select('pendaftar_id, created_at, catatan');

    // 3. Mapping data menjadi format Excel
    const excelRows = pendaftarList.map((p, index) => {
      // Hitung total riwayat kehadiran pedagang ini
      const historyAbsen = logAbsensi?.filter((log) => log.pendaftar_id === p.id) || [];
      const totalHadir = historyAbsen.length;
      const lastAbsenDate = historyAbsen.length > 0 
        ? new Date(historyAbsen[historyAbsen.length - 1].created_at).toLocaleString('id-ID')
        : 'Belum Pernah Presensi';

      return {
        'No': index + 1,
        'ID Unik': p.id_unik,
        'Nama Pedagang': p.nama_lengkap,
        'WhatsApp': p.whatsapp || '-',
        'Alamat': p.alamat || '-',
        'Event': p.event_type,
        'Area Jalan': p.konfigurasi_area?.nama_area || '-',
        'Nomor Lapak': p.nomor_lapak ? `#${p.nomor_lapak}` : '-',
        'Status Keanggotaan': p.status || 'Aktif',
        'Total Kehadiran (Presensi)': `${totalHadir} Kali`,
        'Presensi Terakhir': lastAbsenDate,
        'Tanggal Pendaftaran': new Date(p.created_at).toLocaleDateString('id-ID'),
      };
    });

    // 4. Generate & Download File XLSX
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pedagang & Presensi');

    // Buat nama file berdasarkan tanggal ekspor
    const todayStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_Master_Pedagang_Kudus_${todayStr}.xlsx`);
  } catch (error: any) {
    alert(`Terjadi kesalahan saat export: ${error.message}`);
  }
}