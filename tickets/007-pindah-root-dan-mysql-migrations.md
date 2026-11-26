# [007] Pemindahan Proyek ke Root & Sistem Migration MySQL

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Menghilangkan nested folder `web/` dengan memindahkan seluruh proyek Next.js langsung ke root `c:\laragon\www\fp_spk\`, serta membangun sistem migration SQL terversi untuk tabel `criteria`, `ahp_comparisons`, dan `alternatives`.

## Ruang Lingkup / Perubahan
- Memindahkan seluruh file & folder dari `web/` ke root workspace (`c:\laragon\www\fp_spk\`) dan menghapus folder `web/` serta cache `.next`/`tsconfig.tsbuildinfo` lama.
- Membuat folder `database/migrations/` berisi file SQL terversi:
  - `001_create_criteria_table.sql` — Tabel `criteria`
  - `002_create_ahp_comparisons_table.sql` — Tabel `ahp_comparisons` beserta foreign key ke `criteria`
  - `003_create_alternatives_table.sql` — Tabel `alternatives` beserta sub-atribut kamera
- Membuat runner migration `src/lib/migrate.ts` & CLI `src/lib/migrate-cli.ts` dengan tabel pelacak `schema_migrations`.
- Mengintegrasikan `src/lib/seed.ts` agar menggunakan `runMigrations()` sebagai satu sumber DDL (menghindari duplikasi definisi tabel).
- Menambahkan skrip `db:migrate`, `db:migrate:status`, dan `db:fresh` di `package.json`, mengganti nama paket menjadi `fp-spk-smartphone`, serta memperbarui `README.md`, `.gitignore`, dan `database/schema.sql`.
- Menyesuaikan tipe props `RootLayout` pada `src/app/layout.tsx` (`Readonly<{ children: ReactNode }>`) agar `tsc --noEmit` lulus meski sebelum `.next/types` terbentuk.

## File Terkait
- `database/migrations/001_create_criteria_table.sql`
- `database/migrations/002_create_ahp_comparisons_table.sql`
- `database/migrations/003_create_alternatives_table.sql`
- `database/schema.sql`
- `src/lib/migrate.ts`
- `src/lib/migrate-cli.ts`
- `src/lib/seed.ts`
- `src/app/layout.tsx`
- `package.json`
- `.gitignore`
- `README.md`

## Verifikasi
- `npm run db:fresh` berhasil menghapus tabel lama, menjalankan seluruh 3 file migration berurutan, dan mengisi ulang seed (6 kriteria, 36 pasangan AHP, 20 alternatif).
- `npm run db:migrate:status` menampilkan `[APPLIED]` untuk ketiga file migration (`001`–`003`).
- `npm run db:migrate` ulang bersifat idempoten (`Tidak ada migration baru (3 sudah terpasang).`).
- `npm test` (4/4 test lulus), `npx tsc --noEmit` (0 error), `npm run lint` (0 error).
- `npm run build` (`next build` Turbopack) lulus untuk seluruh route dari root workspace.
- Uji live server `next start` dari root terhadap MySQL Laragon: `GET /api/spk` mengembalikan `6 kriteria`, `20 alternatif`, `CR = 0.089492`, Rank #1 `A11`.
