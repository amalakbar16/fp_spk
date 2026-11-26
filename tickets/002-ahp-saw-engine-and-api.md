# [002] Engine Perhitungan AHP, SAW, Kalkulator Kamera, & REST API

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Mengimplementasikan logika perhitungan murni AHP, SAW, Analisis Sensitivitas, serta endpoint REST API Next.js yang terhubung ke database MySQL Laragon.

## Ruang Lingkup / Perubahan
- Definisi tipe data bersama di `src/lib/types.ts`.
- Modul engine `src/lib/ahp.ts`: matriks perbandingan berpasangan, jumlah kolom, normalisasi, bobot prioritas, *weighted sum*, *consistency vector*, $\lambda_{\text{maks}}$, $CI$, tabel $RI$, dan uji konsistensi $CR \le 0{,}10$.
- Modul engine `src/lib/saw.ts`: matriks keputusan ($X$), normalisasi *Cost* ($\min/x_{ij}$) & *Benefit* ($x_{ij}/\max$), perkalian bobot ($W \times R$), nilai preferensi ($V_i$), dan pemeringkatan.
- Modul engine `src/lib/sensitivity.ts`: uji ubah bobot satu kriteria sambil menyesuaikan bobot kriteria lain secara proporsional agar total bobot tetap $= 1$.
- Repository MySQL & orkestrasi di `src/lib/spk-repository.ts` dan helper error API `src/lib/api-error.ts`.
- Endpoint API:
  - `GET /api/spk`
  - `GET / PUT /api/criteria`
  - `GET / PUT /api/ahp`
  - `GET / POST /api/alternatives`
  - `PUT / DELETE /api/alternatives/[id]`
- Unit test `tests/spk-engine.test.ts` untuk mencocokkan perhitungan terhadap Excel Kelompok 12.

## File Terkait
- `web/src/lib/types.ts`
- `web/src/lib/ahp.ts`
- `web/src/lib/saw.ts`
- `web/src/lib/sensitivity.ts`
- `web/src/lib/spk-repository.ts`
- `web/src/lib/api-error.ts`
- `web/src/app/api/spk/route.ts`
- `web/src/app/api/criteria/route.ts`
- `web/src/app/api/ahp/route.ts`
- `web/src/app/api/alternatives/route.ts`
- `web/src/app/api/alternatives/[id]/route.ts`
- `web/tests/spk-engine.test.ts`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **4/4 test lulus** (Skor kamera 20 alternatif, bobot & CR AHP `0.0894917`, nilai $V_i$ & ranking SAW 20 alternatif, serta simulasi sensitivitas total bobot = 1).
- `npx tsc --noEmit` lulus tanpa error.
