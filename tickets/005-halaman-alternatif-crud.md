# [005] Halaman Data Alternatif (CRUD + Kalkulator Sub-Kriteria Kamera)

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Menyediakan halaman manajemen data alternatif smartphone (Tambah, Edit, Hapus, Pencarian) yang terhubung ke MySQL serta mendukung kalkulator skor kamera otomatis sesuai rumus Excel Kelompok 12.

## Ruang Lingkup / Perubahan
- Membuat komponen `src/components/AlternativesClient.tsx` dan halaman `src/app/alternatif/page.tsx`:
  - Indikator jumlah alternatif tersimpan terhadap syarat minimal 30 alternatif pada panduan UAS.
  - Tabel daftar alternatif lengkap dengan kolom `C1` s.d. `C6` serta fitur pencarian kode/nama.
  - Modal Tambah dan Edit alternatif (`POST /api/alternatives`, `PUT /api/alternatives/[id]`) dengan mode **Otomatis** (menghitung `Skor Kamera` dari MP Utama, UW, Tele, Depan, Lensa, OIS, Video secara *live*) dan mode **Manual**.
  - Modal konfirmasi Hapus (`DELETE /api/alternatives/[id]`).

## File Terkait
- `web/src/components/AlternativesClient.tsx`
- `web/src/app/alternatif/page.tsx`

## Verifikasi
- Diverifikasi melalui `npx tsc --noEmit` dan `npm run build` pada Ticket 006.
