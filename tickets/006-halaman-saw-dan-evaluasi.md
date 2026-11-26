# [006] Halaman Perhitungan SAW Step-by-Step, Evaluasi, & Analisis Sensitivitas

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Membangun halaman tahapan perhitungan SAW yang dapat ditelusuri, halaman Evaluasi & Analisis Sensitivitas sesuai Bagian E Panduan UAS, serta memverifikasi seluruh aplikasi secara menyeluruh.

## Ruang Lingkup / Perubahan
- Membuat halaman Perhitungan & Pemeringkatan SAW (`src/components/SawClient.tsx`, `src/app/saw/page.tsx`):
  - Tahap 1: Matriks Keputusan ($X$) + baris Nilai Minimum (Cost) & Maksimum (Benefit).
  - Tahap 2: Matriks Ternormalisasi ($R$).
  - Tahap 3: Matriks Terbobot ($W \times R$) & Nilai Preferensi ($V_i$).
  - Tahap 4: Hasil Pemeringkatan Akhir.
- Membuat halaman Evaluasi & Analisis Sensitivitas (`src/components/EvaluationClient.tsx`, `src/app/evaluasi/page.tsx`):
  - Analisis peringkat tertinggi (#1) vs terendah.
  - Analisis kontribusi masing-masing kriteria terhadap skor akhir.
  - Simulasi Analisis Sensitivitas interaktif (ubah bobot 1 kriteria dengan total bobot tetap $= 1{,}0000$) beserta tabel perubahan ranking.
  - Ringkasan evaluasi kesesuaian keputusan dengan studi kasus mahasiswa.
- Penyesuaian font sistem pada `src/app/layout.tsx` & `src/app/globals.css` agar `next build` berjalan 100% offline tanpa bergantung koneksi Google Fonts, serta perbaikan aturan ESLint `react-hooks/set-state-in-effect` pada `AhpClient.tsx` & `AlternativesClient.tsx`.

## File Terkait
- `web/src/components/SawClient.tsx`
- `web/src/app/saw/page.tsx`
- `web/src/components/EvaluationClient.tsx`
- `web/src/app/evaluasi/page.tsx`
- `web/src/app/layout.tsx`
- `web/src/app/globals.css`
- `web/src/components/AhpClient.tsx`
- `web/src/components/AlternativesClient.tsx`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **4/4 test lulus**.
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint`: lulus (0 error, 0 warning).
- `npm run build` (`next build` Turbopack): lulus, seluruh 12 worker static pages dan 5 route API terbentuk.
- Uji live server `next start` + MySQL Laragon:
  - `GET /api/spk` mengembalikan 6 kriteria, 20 alternatif, `CR = 0.089492`, Rank #1 `A11`.
  - Seluruh halaman (`/`, `/ahp`, `/alternatif`, `/saw`, `/evaluasi`) dan API (`/api/ahp`, `/api/criteria`, `/api/alternatives`) merespons HTTP `200`.
  - Uji `POST /api/alternatives` (`A999`, skor kamera otomatis `65`) -> `201`, dan `DELETE` bersih kembali ke 20 alternatif.
