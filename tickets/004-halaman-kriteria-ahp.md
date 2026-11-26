# [004] Halaman Kriteria & Pembobotan AHP

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Menyediakan halaman untuk mengelola definisi kriteria (Benefit/Cost, satuan, skala penilaian), mengisi matriks perbandingan berpasangan AHP, serta menelusuri seluruh tahapan perhitungan hingga uji konsistensi ($CR \le 0{,}10$).

## Ruang Lingkup / Perubahan
- Membuat komponen `src/components/AhpClient.tsx` dan halaman `src/app/ahp/page.tsx`:
  - Tabel daftar 6 kriteria dengan modal Edit kriteria (`PUT /api/criteria`).
  - Matriks *Pairwise Comparison* interaktif $6 \times 6$: dropdown skala Saaty pada segitiga atas dengan pengisian otomatis nilai resiprokal ($1/x$) pada segitiga bawah, tombol **Simpan Matriks AHP** (`PUT /api/ahp`), dan **Reset Excel Awal**.
  - Tampilan matriks normalisasi + Bobot Prioritas ($w_i$) + persentase.
  - Tampilan tabel *Weighted Sum Vector* ($A \cdot w$), *Consistency Vector*, $\lambda_{\text{maks}}$, $CI$, tabel $RI$, dan kesimpulan $CR \le 0{,}10$ (*KONSISTEN / TIDAK KONSISTEN*).

## File Terkait
- `web/src/components/AhpClient.tsx`
- `web/src/app/ahp/page.tsx`

## Verifikasi
- Diverifikasi melalui `npx tsc --noEmit` dan `npm run build` pada Ticket 006.
