# Sistem Ticketing Proyek SPK (AHP + SAW)

Folder `tickets/` digunakan untuk mendokumentasikan **setiap rencana, setup awal, penambahan fitur, perbaikan bug, dan perubahan** pada proyek web **Sistem Pendukung Keputusan Pemilihan Smartphone Bagi Mahasiswa (AHP & SAW)**.

## Aturan Penamaan & Alur Kerja
1. **Format nama file:** `NNN-judul-singkat.md` (contoh: `001-setup-nextjs-sqlite.md`, `002-ahp-saw-engine.md`).
2. **Satu ticket untuk satu unit pekerjaan/perubahan** agar riwayat pengembangan mudah dilacak untuk kebutuhan laporan maupun persiapan ujian lisan UAS.
3. **Status ticket:**
   - `PLANNED` — sudah direncanakan, belum dikerjakan
   - `IN_PROGRESS` — sedang dikerjakan
   - `DONE` — selesai diimplementasikan dan terverifikasi
4. Setiap ticket `DONE` wajib mencatat daftar file yang dibuat/diubah serta hasil verifikasi (test/build).

## Template Ticket Standar
```markdown
# [NNN] Judul Ticket

- **Status:** PLANNED | IN_PROGRESS | DONE
- **Tanggal:** YYYY-MM-DD
- **Tujuan:** Penjelasan singkat tujuan ticket.

## Ruang Lingkup / Perubahan
- Poin pekerjaan...

## File Terkait
- `path/ke/file`

## Verifikasi
- Hasil test / build / pengecekan...
```

## Daftar Indeks Ticket

| Kode | Judul | Status | File |
| :--- | :--- | :--- | :--- |
| `000` | Master Plan Proyek Web SPK (Next.js + MySQL Laragon) | `DONE` | [000-plan-master.md](./000-plan-master.md) |
| `001` | Setup Proyek Next.js, Tailwind CSS, & Database MySQL Laragon + Seed Excel | `DONE` | [001-setup-nextjs-mysql.md](./001-setup-nextjs-mysql.md) |
| `002` | Engine Perhitungan AHP, SAW, Kalkulator Kamera, & REST API | `DONE` | [002-ahp-saw-engine-and-api.md](./002-ahp-saw-engine-and-api.md) |
| `003` | Layout Utama & Halaman Beranda (Ringkasan Studi Kasus) | `DONE` | [003-ui-layout-dan-beranda.md](./003-ui-layout-dan-beranda.md) |
| `004` | Halaman Kriteria & Pembobotan AHP (Matriks + Tahapan + Uji CR) | `DONE` | [004-halaman-kriteria-ahp.md](./004-halaman-kriteria-ahp.md) |
| `005` | Halaman Data Alternatif (CRUD + Kalkulator Sub-Kriteria Kamera) | `DONE` | [005-halaman-alternatif-crud.md](./005-halaman-alternatif-crud.md) |
| `006` | Halaman Perhitungan SAW Step-by-Step, Evaluasi, & Analisis Sensitivitas | `DONE` | [006-halaman-saw-dan-evaluasi.md](./006-halaman-saw-dan-evaluasi.md) |
| `007` | Pemindahan Proyek ke Root & Sistem Migration MySQL | `DONE` | [007-pindah-root-dan-mysql-migrations.md](./007-pindah-root-dan-mysql-migrations.md) |
| `008` | Integrasi Data Kuesioner 10 Responden AHP, 3 Mode Sumber Bobot, & CRUD Responden | `DONE` | [008-responden-kuesioner-ahp-dan-crud.md](./008-responden-kuesioner-ahp-dan-crud.md) |
| `009` | Penghapusan Mode Matriks Manual & Penambahan Menu Khusus CRUD Responden | `DONE` | [009-hapus-matriks-manual-dan-menu-crud-responden.md](./009-hapus-matriks-manual-dan-menu-crud-responden.md) |
| `010` | Sticky / Fixed Dropdown Pemilih Sumber Bobot Saat Konten Di-scroll | `DONE` | [010-sticky-dropdown-sumber-bobot-saat-scroll.md](./010-sticky-dropdown-sumber-bobot-saat-scroll.md) |
| `011` | Audit & Verifikasi Selisih Rumus AHP Responden (Farrel) Antara Web dan Excel | `DONE` | [011-cek-selisih-rumus-ahp-responden-vs-excel.md](./011-cek-selisih-rumus-ahp-responden-vs-excel.md) |
| `012` | Konsistensi Tipe Cursor (Pointer / Not-Allowed) pada Elemen Interaktif | `DONE` | [012-konsistensi-cursor-pointer-interaktif.md](./012-konsistensi-cursor-pointer-interaktif.md) |
| `013` | Menu Khusus Geometric Mean (AIJ) & Perbandingan Terhadap Rata-rata Bobot AIP | `DONE` | [013-menu-geometric-mean-dan-perbandingan-aip.md](./013-menu-geometric-mean-dan-perbandingan-aip.md) |
| `014` | Penghapusan Geometric Mean (AIP Murni) & Penyederhanaan Teks UI Redundan | `DONE` | [014-hapus-geomean-dan-ringkas-ui.md](./014-hapus-geomean-dan-ringkas-ui.md) |
| `015` | Penyeragaman Tampilan CR (4 Desimal + Status Konsisten) & Penghapusan Keterangan Target 30 | `DONE` | [015-seragamkan-tampilan-cr-dan-hapus-target-30.md](./015-seragamkan-tampilan-cr-dan-hapus-target-30.md) |
| `016` | Penambahan Fitur & Menu Geometric Mean (AIJ) dengan Tampilan CR Seragam | `DONE` | [016-tambahkan-kembali-geometric-mean.md](./016-tambahkan-kembali-geometric-mean.md) |
| `017` | Tampilan Perhitungan Langkah Demi Langkah AIP pada Menu Kriteria & AHP | `DONE` | [017-tampilan-perhitungan-aip-di-menu-ahp.md](./017-tampilan-perhitungan-aip-di-menu-ahp.md) |
