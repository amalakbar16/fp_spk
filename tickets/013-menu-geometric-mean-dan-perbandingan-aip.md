# [013] Menu Khusus Geometric Mean (AIJ) & Perbandingan Terhadap Rata-rata Bobot AIP

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Menyediakan menu navigasi khusus **Geometric Mean** (`/geometric-mean`) beserta mode sumber bobot `geomean` (AIJ) agar pengguna dapat menelusuri perhitungan lengkap matriks konsensus *Geometric Mean* (`CR = 0,0609 <= 0,10`) dan membandingkan bobot kriteria serta hasil peringkat SAW secara langsung terhadap metode **Rata-rata Bobot per Kriteria (AIP)**.

## Ruang Lingkup / Perubahan
1. **Dukungan Mode Sumber Bobot `geomean` (AIJ) di Engine & State:**
   - Menambahkan nilai `"geomean"` pada tipe `WeightSourceMode` di `src/lib/types.ts` (`"average" | "geomean" | "respondent"`).
   - Memperbarui `getFullSpkState` di `src/lib/spk-repository.ts` untuk melayani `?source=geomean` menggunakan `average.groupGeometricAhp` (`weights`, `cr`, `isConsistent`, `ahp`) serta menyertakan baris `GEO` (AIJ) di `respondentTopSummaries` berdampingan dengan `AVG` (AIP).
   - Menambahkan tombol pilihan **Geometric Mean (AIJ)** pada `WeightSourceBar` (`src/components/WeightSourceBar.tsx`) serta menyesuaikan label status CR di `OverviewClient.tsx`, `SawClient.tsx`, dan `AhpClient.tsx` agar perbedaan antara uji pendukung AIP dan CR langsung AIJ tampil jelas.
2. **Halaman & Menu Khusus `/geometric-mean`:**
   - Menambahkan item navigasi `Geometric Mean` (`/geometric-mean`) di `src/components/AppShell.tsx`.
   - Membuat halaman `src/app/geometric-mean/page.tsx` dan komponen `src/components/GeometricMeanClient.tsx` yang menampilkan:
     - Tombol cepat mengaktifkan **Geometric Mean (AIJ)** atau **Rata-rata Bobot (AIP)** di SAW & Evaluasi, beserta kartu ringkasan konsistensi individu vs `CR = 0,0609` AIJ.
     - **Bagian 1 — Perbandingan Bobot Kriteria (AIJ vs AIP):** bobot, persentase, peringkat prioritas kriteria, selisih ($\Delta w$), dan bar visual perbandingan berdampingan.
     - **Bagian 2 — Perbandingan Hasil Peringkat Akhir SAW (AIJ vs AIP):** skor $V_i$, peringkat, dan pergeseran posisi seluruh alternatif smartphone.
     - **Bagian 3 — Penelusuran Pembentukan 15 Sel Geometric Mean:** nilai tiap responden (`R1`–`Rn`), hasil $(\prod a_{ij}^{(k)})^{1/n}$, serta resiprokalnya (`1 / a_ij`).
     - **Bagian 4–6 — Tahapan Lengkap AHP Matriks Geometric Mean:** matriks pairwise, normalisasi & bobot, serta uji konsistensi (`Weighted Sum`, `Consistency Vector`, $\lambda_{\text{maks}}$, `CI`, `CR`) melalui `AhpCalculationView`.
3. **Unit Test:**
   - Menambahkan test pada `tests/spk-engine.test.ts` untuk mengunci bobot prioritas *Geometric Mean* (AIJ) 10 responden (`[0.19613360, 0.28096761, 0.16477268, 0.17622815, 0.06726427, 0.11463368]`) dan `CR = 0.06087807 <= 0.10`.

## File Terkait
- `src/lib/types.ts`
- `src/lib/spk-repository.ts`
- `src/components/AppShell.tsx`
- `src/components/WeightSourceBar.tsx`
- `src/components/AhpClient.tsx`
- `src/components/OverviewClient.tsx`
- `src/components/SawClient.tsx`
- `src/components/GeometricMeanClient.tsx` *(baru)*
- `src/app/geometric-mean/page.tsx` *(baru)*
- `tests/spk-engine.test.ts`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **7/7 test lulus**.
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (15/15 route terbentuk, termasuk `/geometric-mean`).
- Uji live server `npx next start -p 3199` terhadap MySQL Laragon: seluruh 7 rute (`/`, `/ahp`, `/geometric-mean`, `/responden`, `/alternatif`, `/saw`, `/evaluasi`) mengembalikan HTTP `200`; `GET /api/spk?source=geomean` mengembalikan `mode = "geomean"`, `CR = 0.060878`, `isConsistent = true`, dan rekomendasi #1 `A11` (`Vi = 0.898789`) dibandingkan `AVG` (`A11`, `Vi = 0.889618`).
