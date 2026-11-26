# [016] Penambahan Fitur & Menu Geometric Mean (AIJ) dengan Tampilan CR Seragam

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Menambahkan kembali menu khusus **Geometric Mean** (`/geometric-mean`) dan mode sumber bobot `"geomean"` (AIJ) setelah format tampilan `CR` 4 desimal + status `KONSISTEN` / `TIDAK KONSISTEN` seragam di seluruh halaman, sehingga perbandingan antara **Rata-rata AIP** (yang memiliki CR sendiri) dan **Geometric Mean (AIJ)** tampil bersih, konsisten, dan tidak ambigu.

## Ruang Lingkup / Perubahan
1. **Engine & Repository (`ahp.ts`, `types.ts`, `use-weight-source.ts`, `spk-repository.ts`):**
   - Menambahkan kembali `computeGeometricMeanMatrix` di `src/lib/ahp.ts` dan `groupGeometricAhp` pada `AhpAverageResult` di `src/lib/types.ts`, sambil tetap mempertahankan `cr` (`rata-rata CR responden`) dan `isConsistent` milik AIP sendiri.
   - Menambahkan `"geomean"` pada `WeightSourceMode` (`"average" | "geomean" | "respondent"`), mengizinkannya pada `src/lib/use-weight-source.ts`, dan melayani `?source=geomean` serta baris `GEO` di `respondentTopSummaries` pada `src/lib/spk-repository.ts`.
2. **UI & Menu Navigasi Khusus (`/geometric-mean`):**
   - Menambahkan item menu `Geometric Mean` di `src/components/AppShell.tsx`.
   - Menambahkan tombol `Geometric Mean (AIJ)` di `src/components/WeightSourceBar.tsx` dengan badge CR kanan yang seragam 4 desimal (`CR = 0.xxxx · KONSISTEN` / `TIDAK KONSISTEN`).
   - Membuat halaman `src/app/geometric-mean/page.tsx` dan `src/components/GeometricMeanClient.tsx` (versi ringkas tanpa `WeightSourceBar` agar tidak membingungkan dengan mode per responden; menampilkan status sumber SAW aktif di header, kartu CR AIP vs CR Geometric Mean, kartu `Perbandingan #1 SAW (AIJ vs AIP)` lengkap dengan skor $V_i$, perbandingan bobot kriteria, perbandingan peringkat SAW, penelusuran 15 sel responden, dan tahapan lengkap matriks AHP Geometric Mean 4 desimal).
   - Menambahkan tampilan mode `geomean` (4 tahap matriks Geometric Mean) dan baris ringkasan `GEO · Geometric Mean AIJ` beserta tombol `Detail` pada `src/components/AhpClient.tsx`, serta menyorot baris `GEO` pada Tahap 5 `src/components/SawClient.tsx`.
3. **Unit Test:**
   - Menambahkan kembali unit test pengunci bobot dan `CR` Geometric Mean (AIJ) di `tests/spk-engine.test.ts`.

## File Terkait
- `src/lib/types.ts`
- `src/lib/ahp.ts`
- `src/lib/use-weight-source.ts`
- `src/lib/spk-repository.ts`
- `src/components/AppShell.tsx`
- `src/components/WeightSourceBar.tsx`
- `src/components/AhpClient.tsx`
- `src/components/SawClient.tsx`
- `src/components/GeometricMeanClient.tsx` *(baru)*
- `src/app/geometric-mean/page.tsx` *(baru)*
- `tests/spk-engine.test.ts`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **7/7 test lulus**.
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (15/15 route terbentuk termasuk `/geometric-mean`).
- Uji live server `npx next start -p 3199` terhadap **TiDB Cloud**: seluruh 7 halaman (`/`, `/ahp`, `/geometric-mean`, `/responden`, `/alternatif`, `/saw`, `/evaluasi`) merespons HTTP `200`; `GET /api/spk?source=average` dan `GET /api/spk?source=geomean` berjalan normal dengan nilai `CR` terpisah masing-masing (`AIP` vs `GEO`).
