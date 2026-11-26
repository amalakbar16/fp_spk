# [009] Penghapusan Mode Matriks Manual & Penambahan Menu Khusus CRUD Responden

- **Status:** `DONE`
- **Tanggal:** 2026-11-26
- **Tujuan:** Menyederhanakan alur pembobotan AHP menjadi hanya 2 sumber yang konsisten (**Rata-rata Responden** dan **Per Responden**) dengan menghapus mode **Matriks Manual (`custom`)**, serta memisahkan pengelolaan data responden kuesioner ke menu navigasi khusus **Data Responden** (`/responden`) dengan fitur CRUD lengkap.

## Ruang Lingkup / Perubahan
1. **Penghapusan Mode Matriks Manual (`custom`) dari Alur Utama:**
   - Menghapus opsi/tombol `Matriks Manual` dari `WeightSourceBar` (`src/components/WeightSourceBar.tsx`), `useWeightSource` (`src/lib/use-weight-source.ts`, termasuk normalisasi fallback ke `"average"` apabila nilai `"custom"` tersimpan di `localStorage` atau query URL `?source=custom`), `AhpClient.tsx`, dan `SawClient.tsx`.
   - Memperbarui tipe `WeightSourceMode` di `src/lib/types.ts` menjadi `"average" | "respondent"`, menghapus properti `customAhp` dari `SpkPayload`, serta menyederhanakan `getFullSpkState` di `src/lib/spk-repository.ts` (menghapus cabang `"custom"` dari `activeSource` maupun baris `MANUAL` dari `respondentTopSummaries`).
   - Tabel `ahp_comparisons` dan endpoint legacy `/api/ahp` tetap dipertahankan di backend agar fixture Excel pada `tests/spk-engine.test.ts` tidak rusak, sementara alur utama UI & `/api/spk` sepenuhnya fokus pada 2 sumber bobot responden.
   - Pada halaman `/ahp` (`AhpClient.tsx`), bagian edit matriks manual dan modal CRUD responden dipisahkan keluar sehingga `/ahp` berfokus pada definisi kriteria, rekap bobot responden, verifikasi *Geometric Mean*, dan penelusuran audit 4 tahap AHP per responden (`editable={false}`) dengan tautan ke `/responden`.
2. **Penambahan Menu Navigasi Baru: `Data Responden` (`/responden`):**
   - Menambahkan item navigasi `Data Responden` (`/responden`) di `src/components/AppShell.tsx` sejajar dengan `Data Alternatif`.
   - Membuat halaman `src/app/responden/page.tsx` dan `src/components/RespondentsClient.tsx` untuk CRUD penuh responden:
     - **Create:** Tambah responden baru beserta 15 pasangan perbandingan Saaty lewat `RespondentModal` (pratinjau bobot & `CR` live, serta tampilan pesan error `409` duplikat nama/kode langsung di dalam modal agar input tidak hilang).
     - **Read & Search:** Tabel daftar seluruh responden (`Kode`, `Nama & Peran`, `Waktu Pengisian`, bobot `C1`–`C6`, `CR Individu`, badge konsistensi, serta baris rekap `AVG`) dengan pencarian kode/nama/peran.
     - **Update:** Edit identitas responden (`kode`, `nama`, `peran`) dan 15 pasangan perbandingannya ke MySQL via `PUT /api/ahp/respondents/[id]`.
     - **Delete & Reset:** Hapus responden via modal konfirmasi (`DELETE /api/ahp/respondents/[id]`, tombol `Hapus` dinonaktifkan saat tersisa 1 responden) serta tombol `Reset 10 Responden` (`PUT /api/ahp/respondents` action `reset`).
     - **Shortcut Audit:** Tautan `Detail AHP` pada tiap baris mengarahkan ke `/ahp?source=R...` dan menyinkronkan `useWeightSource` (serta membersihkan query `?source=` di URL saat pengguna mengganti sumber bobot berikutnya).

## File Terkait
- `src/lib/types.ts`
- `src/lib/use-weight-source.ts`
- `src/lib/spk-repository.ts`
- `src/components/AppShell.tsx`
- `src/components/WeightSourceBar.tsx`
- `src/components/RespondentModal.tsx`
- `src/components/RespondentsClient.tsx` *(baru)*
- `src/app/responden/page.tsx` *(baru)*
- `src/components/AhpClient.tsx`
- `src/components/SawClient.tsx`

## Verifikasi
- `npm test` (`node --test tests/*.test.ts`): **6/6 test lulus**.
- `npm run lint` (`eslint`): lulus (0 error, 0 warning).
- `npx next build --webpack`: lulus (14/14 route statis & dinamis terbentuk, termasuk `/responden`).
- Uji live server `next start -p 3199` terhadap MySQL Laragon:
  - Semua 6 halaman (`/`, `/ahp`, `/responden`, `/alternatif`, `/saw`, `/evaluasi`) mengembalikan HTTP `200`.
  - `GET /api/spk?source=average` tidak lagi menyertakan `customAhp` maupun baris `MANUAL` di `respondentTopSummaries`.
  - `GET /api/spk?source=custom` otomatis fallback ke mode `average`.
  - Uji CRUD `/api/ahp/respondents`: `POST` (`201`), penolakan duplikat nama (`409`), `PUT` (`200`), dan `DELETE` (`200`) berhasil, dan jumlah responden kembali bersih ke `10`.
