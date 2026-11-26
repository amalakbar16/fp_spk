# [008] Integrasi Data Kuesioner 10 Responden AHP, 3 Mode Sumber Bobot, & CRUD Responden

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Mengintegrasikan hasil kuesioner AHP dari 10 responden valid (`Kuesioner SPK_ AHP Smartphone - Form Responses 1.csv`, mengecualikan entri duplikat tidak konsisten `Zakky`) ke database MySQL tanpa redundansi, menerapkan perhitungan rata-rata bobot per kriteria persis seperti paper acuan (Zulfahmi et al., 2026), menyediakan pemilih sumber bobot yang tersinkronisasi antar halaman, serta melengkapi fitur CRUD penuh untuk responden kuesioner.

## Ruang Lingkup / Perubahan
- **Analisis & Pembersihan Data Kuesioner:**
  - Memverifikasi 11 baris responden pada `Kuesioner SPK_ AHP Smartphone - Form Responses 1.csv`: entri `Zaki` (baris 10, `CR = 0,3018`, `0` pelanggaran transitivitas, *Group Geometric Mean CR* = `0,0609`) dipertahankan, sedangkan duplikat `Zakky` (baris 12, `CR = 0,7905`, kontradiksi siklik `Harga > Prosesor > Baterai > Harga`) dikecualikan.
- **Database MySQL Ternormalisasi & Seed (`004`):**
  - Menambahkan migration `database/migrations/004_create_ahp_respondents_tables.sql` untuk tabel `ahp_respondents` (`UNIQUE KEY` pada `code` dan `name`) serta `ahp_respondent_comparisons` (`15` pasangan segitiga atas per responden, `150` baris total untuk 10 responden, tanpa duplikasi diagonal/resiprokal).
  - Menambahkan `SEED_AHP_RESPONDENTS` (`R1`–`R10`) di `src/lib/seed-data.ts`, fungsi `seedDefaultAhpRespondents` di `src/lib/seed.ts`, pembersihan tabel pada `dropAllTablesForFreshMigration` di `src/lib/migrate.ts`, dan sinkronisasi ke `database/schema.sql`.
- **Engine AHP & REST API:**
  - Menambahkan `closestSaatyValue`, `buildMatrixFromUpperPairs`, `computeGeometricMeanMatrix`, dan `computeAhpAverageResult` di `src/lib/ahp.ts`: menghitung rata-rata aritmetika bobot prioritas per kriteria ala Tabel 2 paper acuan (`Harga = 0,2021`, `Prosesor = 0,2516`, `RAM = 0,1503`, `Penyimpanan = 0,1585`, `Baterai = 0,0724`, `Kamera = 0,1652`), beserta verifikasi pendukung *Geometric Mean* (`CR = 0,0609 <= 0,10`).
  - Menambahkan CRUD responden di `src/lib/spk-repository.ts`, endpoint `GET`/`POST`/`PUT` (reset 10 responden) di `src/app/api/ahp/respondents/route.ts`, endpoint `PUT`/`DELETE` di `src/app/api/ahp/respondents/[id]/route.ts`, pesan error duplikat nama (`409`) di `src/lib/api-error.ts`, dan dukungan parameter `?source=average|R1..Rn|custom` di `src/app/api/spk/route.ts`.
- **UI Tersinkronisasi & Transparan:**
  - Menambahkan hook `useWeightSource` (`src/lib/use-weight-source.ts`) dan komponen `WeightSourceBar` (`src/components/WeightSourceBar.tsx`) untuk memilih & menyinkronkan sumber bobot (**Rata-rata Responden [Default]**, **Per Responden `R1`–`R10`**, dan **Matriks Manual**) di halaman `/`, `/ahp`, `/saw`, dan `/evaluasi`.
  - Memperbarui `AhpClient.tsx` dengan komponen `AhpCalculationView.tsx` & `RespondentModal.tsx`: rekap Tabel 1 & 2 (plus tombol Tambah, Edit, Hapus, Reset 10 Responden, Detail AHP per responden, panel verifikasi `CR` kelompok, serta mode Edit Matriks Manual + Reset Excel Awal).
  - Memperbarui `SawClient.tsx` dengan **Tahap 5 — Perbandingan Top 3 Rekomendasi Antar Responden & Rekap Frekuensi Top 3** (mengikuti Tabel 3 & 4 paper acuan), serta memperbarui `OverviewClient.tsx` dan `EvaluationClient.tsx` agar menyesuaikan sumber bobot aktif secara dinamis.

## File Terkait
- `database/migrations/004_create_ahp_respondents_tables.sql`
- `database/schema.sql`
- `src/lib/migrate.ts`
- `src/lib/types.ts`
- `src/lib/ahp.ts`
- `src/lib/seed-data.ts`
- `src/lib/seed.ts`
- `src/lib/api-error.ts`
- `src/lib/spk-repository.ts`
- `src/lib/use-weight-source.ts`
- `src/app/api/ahp/respondents/route.ts`
- `src/app/api/ahp/respondents/[id]/route.ts`
- `src/app/api/spk/route.ts`
- `src/components/WeightSourceBar.tsx`
- `src/components/AhpCalculationView.tsx`
- `src/components/RespondentModal.tsx`
- `src/components/AhpClient.tsx`
- `src/components/SawClient.tsx`
- `src/components/EvaluationClient.tsx`
- `src/components/OverviewClient.tsx`
- `tests/spk-engine.test.ts`

## Verifikasi
- `npm run db:migrate && npm run db:seed` & `npm run db:migrate:status`: migration `001`–`004` berstatus `[APPLIED]`, tabel `ahp_respondents` berisi `10` responden unik (`R1`–`R10`, tanpa `Zakky`) dan `150` baris perbandingan di `ahp_respondent_comparisons`.
- `npm test` (`node --test tests/*.test.ts`): **5/5 test lulus** (termasuk verifikasi rata-rata AIP 10 responden dan *Geometric Mean CR* = `0.06087807`).
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (pengecekan TypeScript selesai `1375ms`, 13/13 route statis & dinamis terbentuk). *(Catatan: build default Turbopack sempat mengalami panic internal `@tailwindcss/turbopack` pada Node `v26.13.1`, sedangkan `--webpack` berhasil membangun produksi dengan bersih.)*
- Uji live server `next start` (port `3199`) terhadap MySQL Laragon: seluruh 5 halaman (`/`, `/ahp`, `/alternatif`, `/saw`, `/evaluasi`) merespons HTTP `200`; `GET /api/spk` (`average`, `R8`, `custom`) valid; serta uji lengkap CRUD Responden (termasuk penolakan duplikat nama HTTP `409`), CRUD Alternatif, CRUD Kriteria, dan Reset AHP Manual berhasil lalu database bersih kembali (`10` responden, `20` alternatif, `6` kriteria).
