# [003] Layout Utama & Halaman Beranda (Ringkasan Studi Kasus)

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Membangun kerangka navigasi utama 5 menu yang rapi dan responsif serta halaman Beranda yang merangkum status studi kasus, bobot AHP, konsistensi, dan 5 besar rekomendasi SAW.

## Ruang Lingkup / Perubahan
- Mengatur tema terang bersih di `src/app/globals.css` dan metadata Bahasa Indonesia di `src/app/layout.tsx`.
- Membuat helper pemformatan angka, Rupiah, persentase, dan nilai Saaty di `src/lib/format.ts`.
- Membuat komponen navigasi `src/components/AppShell.tsx` dengan 5 menu utama:
  1. Beranda (`/`)
  2. Kriteria & AHP (`/ahp`)
  3. Data Alternatif (`/alternatif`)
  4. Perhitungan SAW (`/saw`)
  5. Evaluasi & Sensitivitas (`/evaluasi`)
- Membuat `src/components/OverviewClient.tsx` dan `src/app/page.tsx` yang menampilkan KPI studi kasus, pengingat target minimal 30 alternatif UAS, grafik batang bobot kriteria AHP, serta Top 5 smartphone rekomendasi SAW.

## File Terkait
- `web/src/app/globals.css`
- `web/src/app/layout.tsx`
- `web/src/app/page.tsx`
- `web/src/lib/format.ts`
- `web/src/components/AppShell.tsx`
- `web/src/components/OverviewClient.tsx`

## Verifikasi
- Diverifikasi lewat pengecekan struktur tipe TypeScript & build akhir pada Ticket 006.
