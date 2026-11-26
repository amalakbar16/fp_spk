# [015] Penyeragaman Tampilan CR (4 Desimal + Status Konsisten) & Penghapusan Keterangan Target 30

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Menyeragamkan seluruh tampilan `CR` di aplikasi agar selalu menampilkan **4 angka di belakang koma** beserta status tegas **`KONSISTEN`** atau **`TIDAK KONSISTEN`** (termasuk pada mode `Rata-rata 10 Resp. (AIP)` dengan nilai rata-rata CR individu `0,3365`), serta menghapus keterangan `Kurang 10 dari target 30`.

## Ruang Lingkup / Perubahan
1. **Perhitungan & Penyediaan Nilai CR Rata-rata Mode AIP (`average`):**
   - Menambahkan `cr` (rata-rata aritmetika CR dari seluruh responden: $\overline{CR} = \frac{1}{n}\sum CR_k = 0,3365$) dan `isConsistent` (`cr <= 0,10`) pada `AhpAverageResult` di `src/lib/types.ts` dan `computeAhpAverageResult` di `src/lib/ahp.ts`.
   - Mengisi `activeSource.cr` & `activeSource.isConsistent` serta baris `AVG` pada `respondentTopSummaries` di `src/lib/spk-repository.ts` dengan nilai `average.cr` dan `average.isConsistent`.
2. **Penyeragaman Format CR 4 Desimal + Status `KONSISTEN` / `TIDAK KONSISTEN`:**
   - `src/components/WeightSourceBar.tsx`: opsi `<select>` kini memakai 4 desimal `(CR 0.xxxx)` dengan lebar lebih lega (`max-w-[260px] sm:max-w-[300px]`), dan badge kanan seragam untuk mode rata-rata maupun per responden (`CR = 0.xxxx · KONSISTEN` / `TIDAK KONSISTEN`).
   - `src/components/OverviewClient.tsx`: kartu KPI `CONSISTENCY RATIO (AHP)` seragam menampilkan `CR = 0.xxxx` dan status `KONSISTEN (CR <= 0,10)` / `TIDAK KONSISTEN (CR > 0,10)` untuk mode rata-rata maupun per responden.
   - `src/components/AhpClient.tsx`, `src/components/RespondentsClient.tsx`, `src/components/RespondentModal.tsx`, `src/components/AhpCalculationView.tsx`, dan `src/components/SawClient.tsx`: seluruh angka `CR` memakai 4 angka di belakang koma (`formatDecimal(..., 4)`) lengkap dengan label `KONSISTEN` / `TIDAK KONSISTEN` (termasuk baris `AVG` di Tahap 5 `/saw`, rekap `/ahp`, dan `/responden`).
3. **Penghapusan Keterangan Target 30 Alternatif:**
   - Menghapus pesan `Kurang ... dari target 30` / `Target minimal 30 terpenuhi` dari `src/components/OverviewClient.tsx` dan `src/components/AlternativesClient.tsx`.

## File Terkait
- `src/lib/types.ts`
- `src/lib/ahp.ts`
- `src/lib/spk-repository.ts`
- `src/components/WeightSourceBar.tsx`
- `src/components/OverviewClient.tsx`
- `src/components/AlternativesClient.tsx`
- `src/components/AhpClient.tsx`
- `src/components/RespondentsClient.tsx`
- `src/components/RespondentModal.tsx`
- `src/components/AhpCalculationView.tsx`
- `src/components/SawClient.tsx`
- `tests/spk-engine.test.ts`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **6/6 test lulus** (termasuk penguncian `avg.cr = 0.33651189` dan `avg.isConsistent = false`).
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (14/14 route terbentuk).
- Uji live server `npx next start -p 3199` terhadap **TiDB Cloud**: seluruh 6 halaman merespons HTTP `200`; `/api/spk?source=average` mengembalikan `CR = 0.3365`, `isConsistent = false` pada `activeSource` maupun ringkasan `AVG`; `/api/spk?source=R8` mengembalikan `CR = 0.0996`, `isConsistent = true`.
