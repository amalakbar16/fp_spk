# [017] Tampilan Perhitungan Langkah Demi Langkah AIP pada Menu Kriteria & AHP

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Mengubah tampilan mode **Rata-rata 10 Resp. (AIP)** pada halaman **Kriteria & AHP** (`/ahp`) agar tidak sekadar menduplikasi tabel rekap responden dari menu `/responden`, melainkan menampilkan **perhitungan langkah demi langkah metode AIP** (penjumlahan bobot, pembagian rata-rata, normalisasi akhir, serta perhitungan rata-rata $\lambda_{\text{maks}}$, $CI$, dan $CR$).

## Ruang Lingkup / Perubahan
- Memperbarui `src/components/AhpClient.tsx` pada mode `activeSource.mode === "average"` (`Rata-rata 10 Resp. (AIP)`):
  - **Bagian 2 — Perhitungan Rata-rata Bobot Prioritas (Metode AIP):** menampilkan kontribusi bobot masing-masing responden (`R1`–`Rn`) beserta baris perhitungan **TOTAL KOLOM ($\Sigma w_{k,j}$)**, **RATA-RATA ($\Sigma w_{k,j} / n$)**, dan **BOBOT AKHIR AIP (Normalisasi + Persentase)** dengan jumlah akhir `1,0000 (100%)`.
  - **Bagian 3 — Perhitungan Rata-rata Consistency Ratio (CR) Metode AIP:** menampilkan tabel $\lambda_{\text{maks}}$, $CI$, $RI$, $CR$, dan status `KONSISTEN` / `TIDAK KONSISTEN` tiap responden beserta baris rata-rata AIP dan panel ringkasan perhitungan ($\sum CR_k$, $\sum CR_k / n$, rata-rata $\lambda_{\text{maks}}$, rata-rata $CI$, serta jumlah responden lolos `CR <= 0,10`).

## File Terkait
- `src/components/AhpClient.tsx`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **7/7 test lulus**.
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (15/15 route terbentuk termasuk `/ahp`).
