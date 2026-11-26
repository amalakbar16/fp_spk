# [010] Sticky / Fixed Dropdown Pemilih Sumber Bobot Saat Konten Di-scroll

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Membuat panel/dropdown pemilih sumber bobot (`WeightSourceBar` beserta dropdown pilih responden) tetap menempel (*sticky/fixed*) di bagian atas area tampilan saat isi halaman yang panjang (seperti tabel matriks AHP, 4 tahap perhitungan SAW, dan tabel analisis sensitivitas) di-scroll ke bawah, sehingga pengguna dapat mengganti responden kapan saja tanpa harus scroll kembali ke atas.

## Ruang Lingkup / Perubahan
1. **Membuat `WeightSourceBar` Menempel (`sticky`) Saat Scroll:**
   - Memperbarui kontainer `<section>` utama pada `src/components/WeightSourceBar.tsx` menggunakan `sticky top-2 sm:top-3 z-30` dengan latar `bg-white/95 backdrop-blur-sm`, border `border-slate-200`, dan `shadow-sm` agar tetap berada di atas konten tabel namun tetap di bawah overlay modal (`z-50`).
   - Memeriksa pembungkus layout pada `src/components/AppShell.tsx`: memastikan `<main>` dan ancestor kontainer tidak menggunakan `overflow-hidden` / `overflow-x-hidden` yang menghambat `position: sticky`, serta menambahkan `lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto` pada sidebar desktop `<aside>` agar navigasi tetap terjangkau saat scroll.
2. **Menjaga Keterbacaan & Ringkasnya Bar Sticky:**
   - Merapikan padding dan susunan vertikal `WeightSourceBar.tsx` (`p-3 sm:p-3.5`, deskripsi ringkas disembunyikan pada layar sangat kecil `hidden sm:block`) sehingga tinggi bar tetap ringkas di layar mobile maupun desktop.
3. **Konsistensi di Semua Halaman Pengguna `WeightSourceBar`:**
   - Digunakan bersama di `/`, `/ahp`, `/saw`, dan `/evaluasi` melalui `OverviewClient.tsx`, `AhpClient.tsx`, `SawClient.tsx`, dan `EvaluationClient.tsx`.

## File Terkait
- `src/components/WeightSourceBar.tsx`
- `src/components/AppShell.tsx`

## Verifikasi
- `npm run lint` (`eslint`) lulus (0 error, 0 warning).
- `npx next build --webpack` lulus dan seluruh rute (`/`, `/ahp`, `/saw`, `/evaluasi`) merespons HTTP `200` pada `next start -p 3199`.
- *(Catatan: inspeksi visual interaktif melalui subagent `browser` gagal terhubung ke Chrome karena fitur remote debugging Chrome lokal belum aktif; perilaku CSS `sticky top-2 sm:top-3 z-30` dan struktur layout tanpa `overflow-hidden` pada ancestor terverifikasi langsung pada kode dan hasil build produksi.)*
