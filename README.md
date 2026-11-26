# SPK Pemilihan Smartphone Bagi Mahasiswa (AHP & SAW)

Aplikasi web **Sistem Pendukung Keputusan (SPK)** untuk pemilihan smartphone bagi mahasiswa menggunakan metode **Analytical Hierarchy Process (AHP)** dan **Simple Additive Weighting (SAW)**.

## Persyaratan
- Node.js 20+ (terpasang v26)
- MySQL (Laragon) aktif pada `127.0.0.1:3306`

## Setup & Menjalankan Aplikasi

1. Salin `.env.example` ke `.env.local` jika belum ada, sesuaikan konfigurasi MySQL Laragon.
2. Jalankan migration & seed database awal (6 kriteria, 36 pasangan AHP, 20 alternatif):
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```
   Cek status migration:
   ```powershell
   npm run db:migrate:status
   ```
   Reset ulang tabel (drop, migrate ulang, dan seed ulang):
   ```powershell
   npm run db:fresh
   ```
3. Jalankan server pengembangan:
   ```powershell
   npm run dev
   ```
   Buka `http://localhost:3000`.

## Pengujian & Build
```powershell
npm test
npm run lint
npm run build
```

## Dokumentasi Ticketing
Seluruh rencana dan catatan perubahan proyek tersimpan di folder [`tickets/`](./tickets/README.md).
