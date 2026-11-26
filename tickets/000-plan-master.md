# [000] Master Plan — Web SPK Pemilihan Smartphone Bagi Mahasiswa (AHP + SAW)

- **Status:** `DONE`
- **Tanggal:** 2026-11-25
- **Revisi:** Mengganti database dari SQLite ke **MySQL (Laragon)** sesuai permintaan.
- **Referensi Utama:**
  - Panduan UAS: `../Naskah UAS FP SPK D 2026.pdf`
  - Data & Perhitungan Excel: `../SPK - Kelompok 12 (1).xlsx`

---

## 1. Tujuan & Prinsip Pengembangan
Membangun aplikasi web **Sistem Pendukung Keputusan (SPK) Pemilihan Smartphone Bagi Mahasiswa** yang:
1. **Tepat sesuai standar panduan UAS** (tidak berlebihan/over-engineered, fokus pada kejelasan alur dan akurasi).
2. **Terintegrasi penuh antara AHP dan SAW:** bobot kriteria dihitung menggunakan *Analytical Hierarchy Process (AHP)* beserta uji konsistensi ($CR \le 0{,}10$), lalu langsung digunakan oleh metode *Simple Additive Weighting (SAW)* untuk pemeringkatan alternatif.
3. **Transparan dalam perhitungan:** seluruh tahapan matriks AHP dan SAW ditampilkan agar hasil keputusan dapat ditelusuri dan diverifikasi saat ujian lisan maupun di-screenshot untuk laporan.
4. **Mendukung Evaluasi Keputusan (Rubrik 20%):** mencakup analisis peringkat tertinggi/terendah, kontribusi kriteria, dan simulasi **Analisis Sensitivitas** dengan total bobot tetap $= 1$.

---

## 2. Arsitektur & Tech Stack

- **Framework:** Next.js (App Router, TypeScript) — menyatukan Frontend React dan Backend API dalam satu proyek.
- **Styling:** Tailwind CSS (tampilan bersih, kontras tinggi, nyaman dibaca & rapi saat di-screenshot untuk laporan).
- **Database:** **MySQL (Laragon)** dengan driver `mysql2` (`mysql2/promise`) dan connection pool di sisi server Next.js.
  - Konfigurasi disimpan di `web/.env.local` (bawaan Laragon: `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=fp_spk_smartphone`).
  - Menyediakan skrip `schema.sql` dan mekanisme auto-setup/seed (`npm run db:seed` serta pengecekan inisialisasi saat API berjalan) agar tabel dan 20 data awal Excel langsung siap di MySQL/phpMyAdmin Laragon.
- **Lokasi Kode Aplikasi:** `c:\laragon\www\fp_spk\web\` (terpisah dari file PDF, Excel, dan folder `tickets/` di root agar struktur proyek rapi).

### Struktur Folder Rencana
```text
c:\laragon\www\fp_spk\
├── Naskah UAS FP SPK D 2026.pdf
├── SPK - Kelompok 12 (1).xlsx
├── tickets/                         # Dokumentasi setiap setup & perubahan (.md)
│   ├── README.md
│   ├── 000-plan-master.md
│   ├── 001-...md
│   └── ...
└── web/                             # Aplikasi Next.js
    ├── .env.local                   # Konfigurasi koneksi MySQL Laragon
    ├── database/
    │   └── schema.sql               # DDL tabel MySQL (criteria, ahp_comparisons, alternatives)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Navigasi sidebar/header 5 menu utama
    │   │   ├── page.tsx             # Menu 1: Beranda / Ringkasan
    │   │   ├── ahp/page.tsx         # Menu 2: Kriteria & Pembobotan AHP
    │   │   ├── alternatif/page.tsx  # Menu 3: Data Alternatif (CRUD)
    │   │   ├── saw/page.tsx         # Menu 4: Perhitungan & Ranking SAW
    │   │   ├── evaluasi/page.tsx    # Menu 5: Evaluasi & Analisis Sensitivitas
    │   │   └── api/
    │   │       ├── overview/route.ts
    │   │       ├── criteria/route.ts
    │   │       ├── ahp/route.ts
    │   │       ├── alternatives/route.ts
    │   │       ├── alternatives/[id]/route.ts
    │   │       └── spk/route.ts
    │   └── lib/
    │       ├── db.ts                # Pool koneksi MySQL (mysql2/promise)
    │       ├── seed.ts              # Inisialisasi tabel & seed awal 20 data Excel
    │       ├── camera-score.ts      # Rumus skor sub-kriteria kamera (persis Excel)
    │       ├── ahp.ts               # Perhitungan AHP + Uji Konsistensi (CR <= 0.10)
    │       ├── saw.ts               # Perhitungan SAW (X, R, W*R, Vi, Ranking)
    │       └── sensitivity.ts       # Simulasi analisis sensitivitas (sum bobot = 1)
    └── tests/
        └── spk-engine.test.ts       # Verifikasi angka terhadap hasil Excel Kelompok 12
```

---

## 3. Skema Database MySQL (`fp_spk_smartphone`)

1. **`criteria`**
   - `id` (`INT AUTO_INCREMENT PRIMARY KEY`)
   - `code` (`VARCHAR(10) NOT NULL UNIQUE` — `C1` s.d. `C6`)
   - `name` (`VARCHAR(100) NOT NULL` — e.g., `Harga`, `Prosesor (Benchmark)`, `RAM`, `Penyimpanan`, `Kapasitas Baterai`, `Kamera`)
   - `attribute_type` (`ENUM('benefit','cost') NOT NULL`)
   - `unit` (`VARCHAR(50) NOT NULL` — `Rp`, `Ribu Poin`, `GB`, `GB`, `mAh`, `Skor 0-100`)
   - `scale_description` (`TEXT NOT NULL` — penjelasan definisi & skala penilaian sesuai Ketentuan B.7)
   - `sort_order` (`INT NOT NULL`)

2. **`ahp_comparisons`**
   - `row_criterion_id` (`INT NOT NULL`)
   - `col_criterion_id` (`INT NOT NULL`)
   - `value` (`DOUBLE NOT NULL` — skala Saaty 1..9 atau resiprokal `1/9..1`)
   - `PRIMARY KEY (row_criterion_id, col_criterion_id)`
   - `FOREIGN KEY` ke `criteria(id)` ON DELETE CASCADE

3. **`alternatives`**
   - `id` (`INT AUTO_INCREMENT PRIMARY KEY`)
   - `code` (`VARCHAR(10) NOT NULL UNIQUE` — `A1`, `A2`, ...)
   - `name` (`VARCHAR(150) NOT NULL` — nama smartphone)
   - `price` (`DOUBLE NOT NULL` — C1, Rupiah penuh, e.g. `5599000`)
   - `processor_score` (`DOUBLE NOT NULL` — C2, benchmark dalam ribu, e.g. `903`)
   - `ram_gb` (`DOUBLE NOT NULL` — C3, e.g. `8`)
   - `storage_gb` (`DOUBLE NOT NULL` — C4, e.g. `256`)
   - `battery_mah` (`DOUBLE NOT NULL` — C5, e.g. `5000`)
   - `camera_score` (`DOUBLE NOT NULL` — C6, hasil hitung otomatis atau input manual)
   - Sub-atribut kamera (agar form bisa menghitung `camera_score` otomatis persis seperti Excel):
     - `cam_main_mp` (`DOUBLE NULL`)
     - `cam_uw_mp` (`DOUBLE NULL`)
     - `cam_tele_mp` (`DOUBLE NULL`)
     - `cam_front_mp` (`DOUBLE NULL`)
     - `cam_lens` (`VARCHAR(50) NULL`)
     - `cam_ois` (`VARCHAR(30) NULL`)
     - `cam_video` (`VARCHAR(30) NULL`)
   - `created_at` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
   - `updated_at` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)

---

## 4. Spesifikasi Logika Perhitungan (Sinkron dengan Excel Kelompok 12)

### A. Kriteria & Bobot Awal (Seed dari Excel)
| Kode | Kriteria | Jenis | Satuan | Bobot Awal AHP |
| :--- | :--- | :--- | :--- | :--- |
| `C1` | Harga | Cost | Rupiah (`Rp`) | `0.3857521231` |
| `C2` | Prosesor (Benchmark) | Benefit | Ribu Poin | `0.1789186827` |
| `C3` | RAM | Benefit | GB | `0.1445885104` |
| `C4` | Penyimpanan | Benefit | GB | `0.1694455547` |
| `C5` | Kapasitas Baterai | Benefit | mAh | `0.08305320239` |
| `C6` | Kamera | Benefit | Skor (0–100) | `0.03824192665` |

### B. Rumus Skor Kamera (`C6`)
Mengikuti rumus pada sheet `PERHITUNGAN SAW-WP` kolom `T:AD`:
- Konversi resolusi MP ke skala 1–5: `>64 → 5`, `>48 → 4`, `>12 → 3`, `>5 → 2`, `≤5 → 1`.
- `Skor Utama` = `(skor(Utama) + (UW>0 ? skor(UW) : 0) + (Tele>0 ? skor(Tele) : 0) + skor(Depan)) / (2 + (UW>0 ? 1 : 0) + (Tele>0 ? 1 : 0))`
- `Skor Lensa`: `Utama+UW+Tele = 5`, `Utama+UW+Makro = 4`, `Utama+UW = 3`, `Utama+Makro = 2`, `Utama = 1`
- `Skor OIS`: `Utama+Tele = 5`, `Utama = 4`, `Tidak = 1`
- `Skor Video`: `4K 60 fps = 5`, `4K 30 fps = 3`, `1080p 30 fps = 1`
- **Skor Kamera** = `20 * (0.20 * Skor Utama + 0.30 * Skor Lensa + 0.25 * Skor OIS + 0.25 * Skor Video)`

### C. Tahapan AHP
1. Matriks Perbandingan Berpasangan $A = [a_{ij}]$ ($n \times n$, dengan $a_{ji} = 1/a_{ij}$) dan jumlah tiap kolom.
2. Normalisasi matriks ($n_{ij} = a_{ij} / \sum_k a_{kj}$) dan rata-rata baris sebagai Bobot Prioritas ($w_i$).
3. *Weighted Sum Vector* ($A \cdot w$), *Consistency Vector* ($WS_i / w_i$), dan $\lambda_{\text{maks}}$ (rata-rata *Consistency Vector*).
4. $CI = \frac{\lambda_{\text{maks}} - n}{n - 1}$, $RI$ berdasarkan $n$ (untuk $n=6$, $RI = 1{,}24$), dan $CR = \frac{CI}{RI}$.
5. Validasi otomatis: **KONSISTEN** jika $CR \le 0{,}10$ (nilai seed awal: $\lambda_{\text{maks}} = 6{,}5548487$, $CI = 0{,}1109697$, $CR = 0{,}0894917$).

### D. Tahapan SAW
1. Matriks Keputusan ($X$) dari seluruh alternatif di MySQL dan bobot aktif ($w$) dari hasil AHP.
2. Matriks Ternormalisasi ($R$):
   - **Cost:** $r_{ij} = \frac{\min(x_j)}{x_{ij}}$
   - **Benefit:** $r_{ij} = \frac{x_{ij}}{\max(x_j)}$
3. Matriks Terbobot ($w_j \cdot r_{ij}$) dan Nilai Preferensi ($V_i = \sum_j w_j \cdot r_{ij}$).
4. Pemeringkatan alternatif dari $V_i$ tertinggi ke terendah.

### E. Evaluasi & Analisis Sensitivitas
1. Ringkasan pemenang (Rank 1) vs peringkat terbawah dan kontribusi masing-masing kriteria.
2. Simulasi pengubahan bobot 1 kriteria $w'_k$ dengan penyesuaian proporsional kriteria lain ($w'_j = w_j \cdot \frac{1 - w'_k}{1 - w_k}$) sehingga $\sum w' = 1$, lalu menampilkan tabel perbandingan **Peringkat Awal vs Peringkat Baru**.

---

## 5. Rancangan 5 Halaman Aplikasi (Pemetaan ke Rubrik UAS)

| Menu | Fitur Utama | Pemenuhan Panduan UAS |
| :--- | :--- | :--- |
| **1. Beranda** | Ringkasan studi kasus, statistik kriteria & alternatif (termasuk indikator target minimal 30 alternatif), status konsistensi AHP, dan Top 3 rekomendasi. | Bagian B & F.3 (menu utama) |
| **2. Kriteria & AHP** | Tabel definisi kriteria (`Cost`/`Benefit`, satuan, skala), input *Pairwise Comparison* interaktif, tombol *Reset ke Data Awal*, serta seluruh tabel tahapan perhitungan AHP + badge `CR ≤ 0.10`. | Bagian B.7, C.1, C.2, D.1, D.2 |
| **3. Data Alternatif** | Tabel alternatif (awal: 20 data dari Excel), fitur Tambah, Edit, Hapus data smartphone, serta kalkulator sub-kriteria Kamera otomatis saat input/edit. | Bagian D.1 & mempermudah input hingga 30 data |
| **4. Perhitungan SAW** | Tampilan 4 tahap berurutan yang dapat ditelusuri: (1) Matriks Keputusan $X$, (2) Matriks Ternormalisasi $R$, (3) Perkalian Bobot $W \times R$, (4) Nilai Preferensi $V_i$ & Ranking Akhir. | Bagian C.3, D.1, D.2, F.3 |
| **5. Evaluasi & Sensitivitas** | Perbandingan profil peringkat tertinggi vs terendah, kontribusi bobot kriteria, dan simulator Analisis Sensitivitas (geser/ubah bobot 1 kriteria sambil menjaga total bobot = 1). | Bagian E.1, E.2, E.3, E.4 (Bobot Rubrik 20%) |

---

## 6. Roadmap Eksekusi Ticket

1. **Ticket 001 — Setup Next.js & Database MySQL Laragon (`001-setup-nextjs-mysql.md`)**
   - Inisialisasi Next.js App Router + TypeScript + Tailwind CSS di `web/`.
   - Setup driver `mysql2`, file `schema.sql`, konfigurasi `.env.local`, dan seed otomatis 6 kriteria, matriks AHP, serta 20 alternatif dari Excel Kelompok 12 ke database `fp_spk_smartphone`.
2. **Ticket 002 — Engine AHP/SAW & REST API (`002-ahp-saw-engine-and-api.md`)**
   - Tulis fungsi perhitungan murni (`ahp.ts`, `saw.ts`, `camera-score.ts`, `sensitivity.ts`).
   - Buat unit test untuk memastikan hasil persis sama dengan Excel (`CR = 0.08949...`, Rank 1 `A11 = 0.83823...`, Rank 20 `A19 = 0.57395...`).
   - Buat API Routes Next.js terhubung ke MySQL untuk baca/ubah kriteria, pairwise AHP, dan CRUD alternatif.
3. **Ticket 003 — Layout & Halaman Beranda (`003-ui-layout-dan-beranda.md`)**
   - Desain navigasi bersih & konsisten untuk 5 menu utama + halaman Beranda.
4. **Ticket 004 — Halaman Kriteria & Pembobotan AHP (`004-halaman-kriteria-ahp.md`)**
   - UI matriks pairwise + seluruh tahapan perhitungan AHP & validasi `CR ≤ 0.10`.
5. **Ticket 005 — Halaman Data Alternatif CRUD (`005-halaman-alternatif-crud.md`)**
   - UI tabel alternatif + form Tambah/Edit (dengan kalkulator sub-kriteria Kamera) & Hapus.
6. **Ticket 006 — Halaman Perhitungan SAW & Evaluasi Sensitivitas (`006-halaman-saw-dan-evaluasi.md`)**
   - UI 4 tahap SAW + UI Analisis Evaluasi & Sensitivitas + verifikasi `npm run build` dan uji alur aplikasi secara menyeluruh.

---

## 7. Catatan Sebelum Eksekusi & Persiapan Laporan
- **Layanan MySQL Laragon:** Pastikan tombol **Start All / MySQL** di Laragon aktif sebelum menjalankan aplikasi atau seeding database.
- **Data 20 vs 30 Alternatif:** Database diisi awal dengan 20 data Excel (`A1`–`A20`). Melalui menu **Data Alternatif**, Anda bisa menambahkan 10 smartphone lagi sebelum pengumpulan agar memenuhi syarat minimal 30 alternatif pada Bagian B poin 6.
- **Perbaikan Excel & Laporan:** Sebelum dikumpulkan, file Excel disarankan dibersihkan (hapus sheet `TOPSIS` yang masih `#REF!`, rapikan duplikasi nama `A6`/`A20` *Redmi Note 17 Pro*, dan lengkapi link referensi paper).
