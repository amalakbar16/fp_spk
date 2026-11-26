# [001] Setup Proyek Next.js, Tailwind CSS, & Database MySQL Laragon

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Tujuan:** Menyiapkan proyek Next.js App Router + TypeScript + Tailwind CSS di folder `web/` serta menghubungkannya dengan database MySQL Laragon (`fp_spk_smartphone`) dan seed data awal dari Excel Kelompok 12.

## Ruang Lingkup / Perubahan
- Inisialisasi proyek Next.js (`16.4.6`) dengan TypeScript, Tailwind CSS, ESLint, dan struktur `src/` di `web/`.
- Pemasangan paket `mysql2` (driver MySQL) dan `lucide-react` (ikon UI).
- Konfigurasi `.env.local` & `.env.example` untuk koneksi MySQL Laragon (`127.0.0.1:3306`, user `root`, database `fp_spk_smartphone`).
- Pembuatan skema SQL di `web/database/schema.sql` (`criteria`, `ahp_comparisons`, `alternatives`).
- Pembuatan modul koneksi pool (`src/lib/db.ts`), rumus skor kamera (`src/lib/camera-score.ts`), dataset seed (`src/lib/seed-data.ts`), dan inisialisasi otomatis (`src/lib/seed.ts`, `src/lib/seed-cli.ts`).
- Penambahan skrip `db:seed`, `db:reset`, dan `test` pada `web/package.json`.

## File Terkait
- `web/package.json`
- `web/tsconfig.json`
- `web/.env.local`
- `web/.env.example`
- `web/database/schema.sql`
- `web/src/lib/db.ts`
- `web/src/lib/camera-score.ts`
- `web/src/lib/seed-data.ts`
- `web/src/lib/seed.ts`
- `web/src/lib/seed-cli.ts`

## Verifikasi
- `npx tsc --noEmit` lulus (exit code 0).
- `npm run db:seed` berhasil membuat database `fp_spk_smartphone` di MySQL Laragon.
- Pengecekan jumlah baris tabel MySQL: `criteria=6`, `ahp_comparisons=36`, `alternatives=20`.
