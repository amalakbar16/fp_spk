# [014] Penghapusan Geometric Mean (AIP Murni) & Penyederhanaan Teks UI Redundan

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Memisahkan perhitungan **Rata-rata Bobot Responden (AIP)** agar berdiri sendiri tanpa meminjam nilai `CR` dari *Geometric Mean*, menghapus seluruh fitur/menu/tampilan *Geometric Mean*, serta meringkas teks, badge, dan blok informasi yang terlalu panjang atau redundan di seluruh halaman.

## Ruang Lingkup / Perubahan
1. **AIP Murni Tanpa Geometric Mean di Engine, API, & State:**
   - Menghapus `computeGeometricMeanMatrix` dan `groupGeometricAhp` dari `src/lib/ahp.ts` dan `AhpAverageResult` di `src/lib/types.ts`, lalu menggantinya dengan `consistentCount` (jumlah responden yang lolos `CR <= 0,10` secara individu) agar mode AIP menampilkan status konsistensi apa adanya tanpa meminjam `CR = 0,0609` milik GeoMean.
   - Menghapus mode `"geomean"` dari `WeightSourceMode` (`src/lib/types.ts`), fallback ke `"average"` di `src/lib/use-weight-source.ts`, serta menghapus cabang `"geomean"` dan baris `GEO` dari `getFullSpkState` di `src/lib/spk-repository.ts`.
   - Menghapus menu navigasi `Geometric Mean` di `src/components/AppShell.tsx` beserta file `src/app/geometric-mean/page.tsx` dan `src/components/GeometricMeanClient.tsx`.
   - Memperbarui `tests/spk-engine.test.ts` agar memverifikasi `consistentCount = 1` dan bobot AIP 10 responden tanpa test GeoMean.
2. **Penyederhanaan Teks & Penghapusan Elemen Redundan di UI:**
   - **`WeightSourceBar.tsx`:** diringkas menjadi 1 baris *sticky* padat (`Sumber Bobot:`, tombol `Rata-rata N Resp. (AIP)`, dropdown `Responden`, dan badge `Metode AIP · 1/10 resp. CR <= 0,10`), menghapus baris keterangan duplikat di bawahnya.
   - **`OverviewClient.tsx`:** menghapus badge & banner kuning duplikat `< 30 alternatif` (cukup indikator tautan langsung di kartu `DATA ALTERNATIF`), serta menampilkan kartu `KONSISTENSI AIP` (`1 / 10 Lolos`, tanpa CR tunggal) saat mode AIP aktif.
   - **`AhpClient.tsx`:** menghapus bagian `Verifikasi Konsistensi Kelompok (Geometric Mean)` dan tombol terkait, serta meringkas judul & deskripsi bagian 1–2.
   - **`RespondentsClient.tsx`:** menghapus 2 kartu ringkasan berulang (termasuk kartu GeoMean) di atas tabel; ringkasan jumlah responden konsisten disatukan secara ringkas pada toolbar tabel.
   - **`AlternativesClient.tsx`:** menggabungkan indikator target minimal `30` alternatif ke toolbar tabel agar tidak memakan ruang banner besar di atas daftar.
   - **`SawClient.tsx`:** menghapus pill bobot kriteria duplikat pada header (karena bobot per kriteria sudah tampil di kolom `Tahap 3`) dan mengganti badge header AIP menjadi `Rata-rata AIP (10 Resp. · 1/10 CR <= 0,10)`.
   - **`EvaluationClient.tsx`:** meringkas teks header agar langsung menjelaskan isi halaman tanpa jargon teknis berulang.

## File Terkait
- `src/lib/types.ts`
- `src/lib/ahp.ts`
- `src/lib/use-weight-source.ts`
- `src/lib/spk-repository.ts`
- `src/components/AppShell.tsx`
- `src/components/WeightSourceBar.tsx`
- `src/components/OverviewClient.tsx`
- `src/components/AhpClient.tsx`
- `src/components/RespondentsClient.tsx`
- `src/components/AlternativesClient.tsx`
- `src/components/SawClient.tsx`
- `src/components/EvaluationClient.tsx`
- `tests/spk-engine.test.ts`
- `src/app/geometric-mean/page.tsx` *(dihapus)*
- `src/components/GeometricMeanClient.tsx` *(dihapus)*

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **6/6 test lulus**.
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (14/14 route terbentuk, tanpa `/geometric-mean`).
- Uji live server `npx next start -p 3199` terhadap **TiDB Cloud**: seluruh 6 halaman aktif (`/`, `/ahp`, `/responden`, `/alternatif`, `/saw`, `/evaluasi`) merespons HTTP `200`; `/geometric-mean` merespons `404`; `GET /api/spk?source=average` mengembalikan `consistentCount: 1/10` tanpa `groupGeometricAhp` maupun baris `GEO`; `GET /api/spk?source=geomean` fallback bersih ke `average`.
