# [018] Penyederhanaan Alur Geometric Mean → AHP → SAW & Migration Excel Kelompok 12 (3)

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Menyederhanakan tampilan web dengan menghapus metode rata-rata AIP dan pemilih sumber bobot agar seluruh alur aplikasi fokus, runtut, dan terstruktur menggunakan **Geometric Mean** responden yang dimasukkan ke matriks **Pairwise Comparison** AHP hingga perhitungan **SAW** dan **Evaluasi**, serta menambahkan migration dan data seed yang mengacu penuh pada `file tambahan/SPK - Kelompok 12 (3).xlsx`.

## Ruang Lingkup / Perubahan
1. **Migration Baru & Sinkronisasi Seed Data Excel (`SPK - Kelompok 12 (3).xlsx`):**
   - Menambahkan `database/migrations/005_align_excel_geomean_schema.sql` untuk menghapus tabel legacy `ahp_comparisons` (matriks manual tunggal) sehingga seluruh pembobotan murni bersumber dari agregasi *Geometric Mean* responden.
   - Menambahkan skrip `db:migrate:fresh` di `package.json` (`node --env-file-if-exists=.env.local src/lib/migrate-cli.ts fresh`) agar pengguna dapat menjalankan `npm run db:migrate:fresh` lalu `npm run db:seed`.
   - Memperbarui `database/schema.sql`, `src/lib/seed-data.ts`, `src/lib/seed.ts`, dan `src/lib/seed-cli.ts`: menghapus `SEED_AHP_UPPER_PAIRS` dan menyelaraskan `SEED_AHP_RESPONDENTS` (`R1`–`R10`, termasuk `R10: Auf` dan tanpa `Cogan`) serta `SEED_ALTERNATIVES` (`A1`–`A20`) sesuai Excel `SPK - Kelompok 12 (3).xlsx`.
2. **Engine, Types, Repository, & API Khusus Geometric Mean:**
   - Menyederhanakan `src/lib/types.ts`, `src/lib/ahp.ts` (`computeGroupGeometricAhp`), dan `src/lib/spk-repository.ts` dengan menghapus seluruh perhitungan AIP (`computeAhpAverageResult`), mode sumber bobot multi-opsi, dan `ahp_comparisons`.
   - Menyederhanakan `/api/spk`, `/api/ahp`, dan `/api/ahp/respondents` agar selalu menghitung bobot secara runtut dari responden → *Geometric Mean* → *Pairwise Comparison* → AHP → SAW.
3. **Penyederhanaan Tampilan Web & Alur Runtut (6 Menu):**
   - Mengurangi menu navigasi di `src/components/AppShell.tsx` menjadi 6 menu berurutan: `Beranda`, `Data Responden`, `Geometric Mean & AHP`, `Data Alternatif`, `Perhitungan SAW`, dan `Evaluasi & Sensitivitas`.
   - Menghapus halaman duplikat `src/app/geometric-mean/page.tsx`, `src/components/GeometricMeanClient.tsx`, `src/components/WeightSourceBar.tsx`, dan `src/lib/use-weight-source.ts`.
   - Menyusun halaman `/ahp` (`AhpClient.tsx`) secara runtut: (1) Daftar Kriteria & Bobot Akhir, (2) Perhitungan *Geometric Mean* 15 pasangan dari 10 responden beserta resiprokalnya, (3) Matriks *Pairwise Comparison* yang diisi dari hasil *Geometric Mean*, (4) Matriks Normalisasi & Bobot Prioritas, dan (5) Uji Konsistensi AHP (`CR = 0,0551 ≤ 0,10`).
   - Merampingkan `/`, `/responden` (ditambah modal detail matriks individu), `/saw` (4 tahap sesuai Excel tanpa Tahap 5 perbandingan responden), dan `/evaluasi`.

## File Terkait
- `database/migrations/005_align_excel_geomean_schema.sql` *(baru)*
- `database/schema.sql`
- `package.json`
- `README.md`
- `src/lib/seed-data.ts`
- `src/lib/seed.ts`
- `src/lib/seed-cli.ts`
- `src/lib/types.ts`
- `src/lib/ahp.ts`
- `src/lib/spk-repository.ts`
- `src/app/api/spk/route.ts`
- `src/app/api/ahp/route.ts`
- `src/components/AppShell.tsx`
- `src/components/OverviewClient.tsx`
- `src/components/RespondentsClient.tsx`
- `src/components/AhpClient.tsx`
- `src/components/AhpCalculationView.tsx`
- `src/components/SawClient.tsx`
- `src/components/EvaluationClient.tsx`
- `tests/spk-engine.test.ts`
- `src/app/geometric-mean/page.tsx` *(dihapus)*
- `src/components/GeometricMeanClient.tsx` *(dihapus)*
- `src/components/WeightSourceBar.tsx` *(dihapus)*
- `src/lib/use-weight-source.ts` *(dihapus)*

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **6/6 test lulus** (skor kamera 20 alternatif, 15 nilai *Geometric Mean*, bobot AHP `C1`–`C6` + `lambda_max = 6.341903491` + `CI = 0.06838069812` + `CR = 0.05514572429`, seluruh 20 nilai `Vi` & ranking SAW Excel, audit `R1`, dan analisis sensitivitas).
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (14/14 route terbentuk; `/geometric-mean` dihapus).
- `npm run db:migrate:fresh && npm run db:seed && npm run db:migrate:status`: seluruh tabel dihapus lalu migration `001`–`005` berstatus `[APPLIED]`, database terisi bersih `6` kriteria, `10` responden Excel (`R1`–`R10`, termasuk `R10: Auf`), dan `20` alternatif.
- Uji live server `node node_modules/next/dist/bin/next start -p 3199`: seluruh 6 halaman aktif (`/`, `/responden`, `/ahp`, `/alternatif`, `/saw`, `/evaluasi`) mengembalikan HTTP `200`; `/geometric-mean` mengembalikan `404`; `GET /api/spk` mengembalikan `10` responden (`R10: Auf`), `CR = 0.0551457242872094` (`isConsistent = true`), bobot `[0.205607, 0.269777, 0.159307, 0.178994, 0.071101, 0.115214]`, Rank `#1 A11 · Infinix GT 50 Pro (Vi = 0.894225)`, Rank `#2 A8 · Poco X8 Pro (Vi = 0.847386)`, dan Rank `#20 A19 · Vivo V80 Lite 5G (Vi = 0.506707)`.
