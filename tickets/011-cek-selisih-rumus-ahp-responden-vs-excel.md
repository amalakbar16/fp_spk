# [011] Audit & Verifikasi Selisih Rumus AHP Responden (Farrel) Antara Web dan Excel

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Menginvestigasi dan menyelaraskan perbedaan hasil perhitungan AHP responden `R1` (`Farrel Ega Nur Royyan`) antara aplikasi web (`src/lib/ahp.ts` + `src/lib/seed-data.ts`) dengan file perhitungan Excel milik pengguna, sehingga seluruh tahapan angka (matriks, bobot prioritas, $\lambda_{\text{maks}}$, $CI$, dan $CR$) dapat diverifikasi dan konsisten.

## Hasil Audit & Temuan
1. **Audit Input Matriks `R1` (`Farrel Ega Nur Royyan`) CSV vs Seed vs MySQL:**
   - Seluruh **15 pasangan perbandingan** baris 2 `Kuesioner SPK_ AHP Smartphone - Form Responses 1.csv` (`Farrel Ega Nur Royyan`) sudah **100% cocok** (`0` selisih) dengan `SEED_AHP_RESPONDENTS[0]` (`R1`) di `src/lib/seed-data.ts` maupun tabel `ahp_respondent_comparisons` di MySQL (termasuk `C1:C2 = 1/7` dari `Kriteria Kedua (Skala 7)` dan `C1:C6 = 1` dari `Sama Penting (Skala 1)`).
2. **Sumber Selisih dengan Sheet `PERHITUNGAN AHP` pada `SPK - Kelompok 12 (1).xlsx`:**
   - Setelah membandingkan isi XML sheet `PERHITUNGAN AHP` di `file tambahan/SPK - Kelompok 12 (1).xlsx` terhadap jawaban CSV Farrel (`R1`): **13 dari 15 pasangan identik**, namun ada **2 pasangan yang diubah pada Excel Kelompok 12** agar matriks menjadi konsisten:
     - `C1:C2` (`Harga` vs `Prosesor`): CSV Farrel = `1/7` (`0.142857`), sedangkan Excel `PERHITUNGAN AHP` = `3`.
     - `C1:C6` (`Harga` vs `Kamera`): CSV Farrel = `1`, sedangkan Excel `PERHITUNGAN AHP` = `7`.
   - Karena perbedaan 2 input tersebut:
     - **Sheet `PERHITUNGAN AHP` Excel Kelompok 12** menghasilkan bobot `[0.385752, 0.178919, 0.144589, 0.169446, 0.083053, 0.038242]`, $\lambda_{\text{maks}} = 6.554849$, $CI = 0.110970$, $CR = 0.089492$ (`KONSISTEN <= 0,10`).
     - **Data asli CSV Farrel (`R1`) di web** menghasilkan `columnSums = [9.866667, 3.676190, 8.533333, 6.533333, 15.333333, 18.000000]`, `weights = [0.222100, 0.304850, 0.144689, 0.178134, 0.098975, 0.051251]`, $\lambda_{\text{maks}} = 7.992893$, $CI = 0.398579$, $RI = 1.24$, dan $CR = 0.321434$ (`> 0,10`).
3. **Audit Rumus `computeAhp` di `src/lib/ahp.ts` vs Formula Excel:**
   - Rumus di `src/lib/ahp.ts` sudah **identik** dengan formula sheet `PERHITUNGAN AHP` Excel Kelompok 12:
     - Normalisasi sel: `a_ij / SUM(kolom j)`
     - Bobot prioritas ($w_i$): `AVERAGE(baris ternormalisasi i)`
     - *Weighted Sum*: `(A · w)_i`, *Consistency Vector*: `(A · w)_i / w_i`
     - $\lambda_{\text{maks}}$: `AVERAGE(Consistency Vector)` (Catatan: jika Excel lain memakai formula alternatif `SUMPRODUCT(JumlahKolom, Bobot)`, untuk `R1` akan menghasilkan $\lambda_{\text{maks}} = 8.150708$ dan $CR = 0.346888$ karena matriks `R1` tidak konsisten; proyek ini tetap mengikuti formula resmi Kelompok 12 yaitu `AVERAGE(Consistency Vector)` yang konsisten dengan hasil paper acuan).
     - $CI = (\lambda_{\text{maks}} - n) / (n - 1)$ dengan $n = 6$, $RI = 1.24$, $CR = CI / RI$.
4. **Penguncian Unit Test:**
   - Menambahkan unit test khusus pada `tests/spk-engine.test.ts` untuk mengunci seluruh angka `R1` (`Farrel Ega Nur Royyan`) (`columnSums`, `weights`, `lambdaMax`, `ci`, `ri`, `cr = 0.32143442`, dan `isConsistent = false`).

## File Terkait
- `Kuesioner SPK_ AHP Smartphone - Form Responses 1.csv`
- `file tambahan/SPK - Kelompok 12 (1).xlsx`
- `src/lib/ahp.ts`
- `src/lib/seed-data.ts`
- `tests/spk-engine.test.ts`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **6/6 test lulus**, termasuk test audit `R1 (Farrel Ega Nur Royyan)`.
- `GET /api/spk?source=R1` pada live server `next start -p 3199` mengembalikan `cr = 0.3214344247805744` yang identik dengan hasil perhitungan unit test.
- `npm run lint` dan `npx next build --webpack` lulus tanpa error.
