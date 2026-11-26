# [012] Konsistensi Tipe Cursor (Pointer / Not-Allowed) pada Elemen Interaktif

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Memastikan seluruh elemen interaktif di aplikasi (tombol `<button>`, tautan, `<select>`, slider, checkbox/radio, serta item tabel yang dapat diklik) menampilkan `cursor: pointer` saat diarahkan kursor, dan `cursor: not-allowed` saat dalam kondisi `disabled` — mengatasi perilaku bawaan Tailwind CSS v4 yang menjadikan `<button>` ber-cursor `default`.

## Ruang Lingkup / Perubahan
1. **Aturan Global di `src/app/globals.css`:**
   - Menambahkan blok `@layer base` di `src/app/globals.css`:
     - `button:not(:disabled)`, `[role="button"]:not([aria-disabled="true"])`, `a[href]`, `select:not(:disabled)`, `summary`, `input[type="checkbox"]:not(:disabled)`, `input[type="radio"]:not(:disabled)`, dan `input[type="range"]:not(:disabled)` menggunakan `cursor: pointer`.
     - `button:disabled:not(.cursor-default)`, `select:disabled`, `input:disabled`, dan `[aria-disabled="true"]` menggunakan `cursor: not-allowed`.
2. **Audit Konsistensi Per Komponen:**
   - Memastikan tombol aktif dan dropdown pada `WeightSourceBar.tsx`, `AhpClient.tsx`, `RespondentsClient.tsx`, `RespondentModal.tsx`, `AlternativesClient.tsx`, `EvaluationClient.tsx`, `AhpCalculationView.tsx`, dan `AppShell.tsx` mewarisi aturan `cursor: pointer` (serta `cursor-pointer` eksplisit pada kontrol utama `WeightSourceBar.tsx`), tombol yang dinonaktifkan (seperti tombol `Hapus` ketika tersisa 1 responden atau tombol saat `saving`) memakai `cursor: not-allowed`, sementara tombol status `"Sedang Aktif"` pada `SawClient.tsx` mempertahankan `cursor-default`.

## File Terkait
- `src/app/globals.css`
- `src/components/WeightSourceBar.tsx`
- `src/components/RespondentsClient.tsx`
- `src/components/AhpClient.tsx`
- `src/components/SawClient.tsx`

## Verifikasi
- `npm run lint` (`eslint`) lulus (0 error, 0 warning).
- `npx next build --webpack` lulus dan seluruh 6 halaman (`/`, `/ahp`, `/responden`, `/alternatif`, `/saw`, `/evaluasi`) merespons HTTP `200` pada `next start -p 3199`.
- *(Catatan: inspeksi visual interaktif melalui subagent `browser` gagal terhubung ke Chrome karena fitur remote debugging Chrome lokal belum aktif; aturan CSS `@layer base` pada `src/app/globals.css` dan kelas utility `cursor-default`/`cursor-pointer` terverifikasi melalui source dan build CSS produksi.)*
