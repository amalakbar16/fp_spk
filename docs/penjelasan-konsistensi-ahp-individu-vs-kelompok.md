# Mengapa AHP Responden Individu Banyak yang Tidak Konsisten (`CR > 0,10`), Sedangkan Saat Digabung Menjadi Konsisten (`CR = 0,0609`)?

Dokumen ini menjelaskan secara intuitif, matematis, dan berdasarkan **data nyata 10 responden** pada proyek SPK Pemilihan Smartphone (AHP + SAW) mengapa 9 dari 10 responden secara perorangan gagal uji konsistensi (`CR > 0,10`), tetapi saat digabung menghasilkan `CR = 0,0609 <= 0,10`, sekaligus meluruskan perbedaan antara **Rata-rata Bobot (AIP)** dan **Geometric Mean (AIJ)**.

---

## 1. Jawaban Singkat (Intinya)

Ada **dua hal penting** yang sering membuat bingung:

1. **`CR` kelompok (`0,0609`) BUKAN rata-rata dari `CR` individu.**
   Jika ke-10 nilai `CR` individu dirata-ratakan langsung, hasilnya memang **tidak lolos** (`0,3365`).
   Angka `0,0609` diperoleh dengan cara **menggabungkan dulu seluruh sel matriks ke-10 responden menggunakan *Geometric Mean* (AIJ)** menjadi **1 matriks kelompok**, lalu baru dihitung `CR`-nya dari matriks konsensus tersebut.
2. **Kesalahan inkonsistensi antar responden saling meniadakan (*noise cancellation*).**
   Secara individu, responden sering memberi angka ekstrem (misalnya skala `7` atau `9`) atau mengalami selip logika perbandingan pada beberapa pasangan saja. Karena arah selip tiap orang berbeda-beda (acak), ketika dikalikan dan diakarkan pangkat $10$ (*Geometric Mean*), bias ekstrem saling tarik ke tengah dan error logika saling meredam, sehingga matriks gabungannya menjadi jauh lebih konsisten (`CR = 0,0609 <= 0,10`).

> **Catatan Penting (AIP vs AIJ):**
> Pada aplikasi ini, mode **Rata-rata Bobot (AIP)** mengambil rata-rata vektor bobot per kriteria (mengikuti Tabel 2 paper Zulfahmi et al., 2026) — metode AIP **tidak** membentuk matriks baru, sehingga tidak punya `CR` sendiri. Angka `CR = 0,0609` sebenarnya adalah `CR` milik matriks **Geometric Mean (AIJ)** (yang kini bisa dilihat langsung perbandingannya pada menu **Geometric Mean** `/geometric-mean`).

---

## 2. Data Nyata 10 Responden di Proyek Ini

Dari hasil kuesioner 10 responden unik di [seed-data.ts](../src/lib/seed-data.ts):

| Kode | Nama Responden | $\lambda_{\text{maks}}$ | CR Individu | Status (`CR <= 0,10`) |
| :--- | :--- | ---: | ---: | :--- |
| `R1` | Farrel Ega Nur Royyan | 7,9929 | `0,3214` | Tidak Konsisten |
| `R2` | fawwaz | 9,1229 | `0,5037` | Tidak Konsisten |
| `R3` | caktadano | 6,6911 | `0,1115` | Tidak Konsisten |
| `R4` | Irfan | 7,3072 | `0,2108` | Tidak Konsisten |
| `R5` | Lingga Dwi Al Farizi | 8,8868 | `0,4656` | Tidak Konsisten |
| `R6` | Cogan | 10,6169 | `0,7447` | Tidak Konsisten |
| `R7` | Ahnaf | 8,9167 | `0,4704` | Tidak Konsisten |
| `R8` | Vano | 6,6176 | **`0,0996`** | **Konsisten** |
| `R9` | Zaki | 7,8714 | `0,3018` | Tidak Konsisten |
| `R10` | Glenn Aurora Arapenta Surbakti | 6,8415 | `0,1357` | Tidak Konsisten |
| **Rata-rata Aritmetika CR** | — | `8,0865` | **`0,3365`** | *(Tidak lolos jika di-rata-rata)* |
| **Matriks Geometric Mean (AIJ)** | — | **`6,3774`** | **`0,0609`** | **KONSISTEN (`<= 0,10`)** |

---

## 3. Kenapa Responden Individu Sulit Konsisten? (Contoh Nyata dari Data)

Dalam AHP dengan $6$ kriteria, responden harus mengisi $\frac{6 \times 5}{2} = 15$ pasangan perbandingan secara manual lewat Google Form tanpa bantuan kalkulator konsistensi *real-time*. Matriks disebut **konsisten sempurna** bila untuk setiap tiga kriteria $(A, B, C)$ berlaku aturan perkalian transitif:

$$a_{AC} = a_{AB} \times a_{BC}$$

Pada praktiknya, manusia sangat sering melanggar aturan perkalian ini karena tiga alasan:

### A. Kontradiksi Langsung / Selip Logika (*Transitivity Error*)
Ambil contoh 3 kriteria: **`C1` (Harga)**, **`C2` (Prosesor)**, dan **`C6` (Kamera)**.

- **Contoh `R6` (`Cogan`, `CR = 0,7447`):**
  - `C1:C2` (*Harga vs Prosesor*) = `1` (sama penting)
  - `C2:C6` (*Prosesor vs Kamera*) = `1` (sama penting)
  - Jika konsisten, seharusnya `C1:C6` (*Harga vs Kamera*) = `1 × 1 = 1`.
  - Namun `R6` mengisi `C1:C6 = 9` (Harga **9x** lebih penting dari Kamera). Kontradiksi tajam inilah yang melonjakkan `CR` ke `0,7447`.

- **Contoh `R1` (`Farrel`, `CR = 0,3214`):**
  - `C1:C2` = `1/7` (Prosesor 7x lebih penting dari Harga)
  - `C2:C6` = `5` (Prosesor 5x lebih penting dari Kamera)
  - Idealnya `C1:C6` = `(1/7) × 5 = 5/7 ≈ 0,71` (Kamera sedikit lebih penting dari Harga).
  - Namun `R1` mengisi `C1:C6 = 1` (sama penting).

- **Contoh `R9` (`Zaki`, `CR = 0,3018`):**
  - `C1:C2 = 1`, `C2:C6 = 1`, idealnya `C1:C6 = 1`, tetapi diisi `1/9` (`0,1111`).

### B. Batas Skala Saaty Mentok di Angka `9` (*Scale Ceiling Effect*)
- **Contoh `R5` (`Lingga`, `CR = 0,4656`):**
  - `C1:C2 = 9` (Harga 9x lebih penting dari Prosesor)
  - `C2:C6 = 9` (Prosesor 9x lebih penting dari Kamera)
  - Secara matematis agar konsisten sempurna, `C1:C6` harus bernilai `9 × 9 = 81`.
  - Karena skala Saaty hanya menyediakan nilai maksimal `9`, responden terpaksa mengisi `C1:C6 = 9`. Selisih rasio antara `81` dan `9` otomatis menciptakan inkonsistensi matematis, walaupun secara intuisi manusia pilihan tersebut terasa "masuk akal".

---

## 4. Kenapa Saat Digabung *Geometric Mean* Jadi Konsisten (`CR = 0,0609`)?

Perhatikan hasil pasangan yang sama (`C1, C2, C6`) pada seluruh 10 responden vs matriks **Geometric Mean**:

| Responden | `C1:C2` | `C2:C6` | `C1:C6` (Aktual) | Ideal (`C1:C2 × C2:C6`) |
| :--- | ---: | ---: | ---: | ---: |
| `R1` (Farrel) | 0,1429 | 5,0000 | 1,0000 | 0,7143 |
| `R2` (fawwaz) | 5,0000 | 0,3333 | 1,0000 | 1,6667 |
| `R3` (caktadano) | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| `R4` (Irfan) | 1,0000 | 9,0000 | 5,0000 | 9,0000 |
| `R5` (Lingga) | 9,0000 | 9,0000 | 9,0000 | 81,0000 |
| `R6` (Cogan) | 1,0000 | 1,0000 | 9,0000 | 1,0000 |
| `R7` (Ahnaf) | 3,0000 | 0,1429 | 5,0000 | 0,4286 |
| `R8` (Vano) | 0,3333 | 0,2000 | 0,1429 | 0,0667 |
| `R9` (Zaki) | 1,0000 | 1,0000 | 0,1111 | 1,0000 |
| `R10` (Glenn) | 0,2000 | 9,0000 | 5,0000 | 1,8000 |
| **Geometric Mean (AIJ)** | **`1,0254`** | **`1,4258`** | **`1,6619`** | **`1,4621`** |

Lihat perbedaannya:
- Di level individu, `C1:C6` aktual vs ideal bisa meleset jauh (misal `9` vs `81`, `9` vs `1`, atau `0,1111` vs `1`).
- Di level **Geometric Mean**, `C1:C2 = 1,0254`, `C2:C6 = 1,4258`, idealnya `1,0254 × 1,4258 = 1,4621`, dan nilai aktual hasil *Geometric Mean* adalah `1,6619` — **hampir cocok sempurna!**

### Bukti Matematis Singkat (Skala Logaritma)
Misalkan kita ubah setiap entri matriks menjadi logaritma: $x_{ij} = \ln(a_{ij})$.
- Kondisi konsistensi perkalian $a_{ik} = a_{ij} \cdot a_{jk}$ berubah menjadi penjumlahan linear:
  $$x_{ik} = x_{ij} + x_{jk}$$
- Setiap responden $k$ memiliki error ketidakkonsistenan $\varepsilon_k$, yaitu:
  $$x_{ik}^{(k)} - \left(x_{ij}^{(k)} + x_{jk}^{(k)}\right) = \varepsilon_k$$
- *Geometric Mean* pada nilai asli sama persis dengan **rata-rata aritmetika pada logaritma** ($\bar{x}_{ij} = \frac{1}{10}\sum_{k=1}^{10} x_{ij}^{(k)}$). Maka error ketidakkonsistenan matriks gabungan adalah **rata-rata dari error tiap responden**:
  $$\varepsilon_{\text{grup}} = \frac{1}{10}\sum_{k=1}^{10} \varepsilon_k$$
- Selama ke-10 responden tidak melakukan kesalahan kontradiksi pada pasangan dan arah yang sama persis, nilai $\varepsilon_k$ yang positif dan negatif **saling meniadakan**, sehingga $\varepsilon_{\text{grup}} \approx 0$. Akibatnya $\lambda_{\text{maks}}$ turun drastis dari rata-rata individu `8,0865` ke `6,3774` (sangat dekat dengan $n = 6$), dan `CR` turun menjadi **`0,0609 <= 0,10`**.

---

## 5. Analogi Sederhana
Bayangkan 10 orang diminta menggambar denah ruangan hanya dengan menebak jarak antar sudut secara terpisah:
- Orang A menebak jarak pintu–meja agak kepanjangan, meja–jendela kependekan.
- Orang B menebak pintu–meja kependekan, meja–jendela kepanjangan.
- Jika dicek satu per satu, hampir semua gambar orangnya "miring" (tidak konsisten).
- Namun jika ke-10 ukuran mereka dirata-ratakan (dengan *Geometric Mean* untuk rasio), tebakan yang kepanjangan dan kependekan saling menetralkan sehingga denah gabungannya justru akurat dan proporsional.

---

## 6. Perbedaan Penting: Rata-rata Bobot (AIP) vs Geometric Mean (AIJ)

Inilah poin paling krusial yang perlu dipahami agar tidak salah menafsirkan kata **"AVG / Rata-rata"**:

| Aspek | Rata-rata Bobot (`AVG` / AIP) | Geometric Mean (`GEO` / AIJ) |
| :--- | :--- | :--- |
| **Cara Hitung** | Hitung bobot AHP tiap responden $w_{k,j}$ dulu, lalu rata-rata aritmetika per kriteria: $\bar{w}_j = \frac{1}{n}\sum w_{k,j}$ | Gabungkan matriks pairwise dulu per sel: $a_{ij}^{\text{grup}} = (\prod a_{ij}^{(k)})^{1/n}$, lalu hitung bobot AHP 1 kali |
| **Acuan di Proyek** | Mengikuti **Tabel 2 paper Zulfahmi et al. (2026)** | Standar **Group AHP Saaty (AIJ)** |
| **Bobot (`C1`–`C6`)** | `[0,2021 ; 0,2516 ; 0,1503 ; 0,1585 ; 0,0724 ; 0,1652]` | `[0,1961 ; 0,2810 ; 0,1648 ; 0,1762 ; 0,0673 ; 0,1146]` |
| **Punya Matriks Tunggal & CR?** | **Tidak.** AIP tidak membentuk matriks baru, sehingga tidak punya `CR` sendiri. Karena 9/10 individu `CR > 0,10`, secara ketat AIP merata-ratakan bobot dari individu yang mayoritas belum konsisten. | **Ya.** Bobot dan uji `CR = 0,0609 <= 0,10` berasal dari **satu matriks konsensus yang sama** sehingga sah secara metodologi AHP murni. |
| **Pemenang SAW #1** | `A11 · Infinix GT 50 Pro` ($V_i = 0,889618$) | `A11 · Infinix GT 50 Pro` ($V_i = 0,898789$) |

---

## 7. Ringkasan Jawaban Jika Ditanya Saat Sidang / Ujian Lisan UAS

1. **Kenapa individu banyak tidak konsisten (`9/10` punya `CR > 0,10`)?**
   Karena pengisian 15 pasangan perbandingan untuk 6 kriteria di Google Form dilakukan secara subjektif tanpa validasi langsung, sehingga rentan terjadi selip transitivitas ($a_{AC} \neq a_{AB} \times a_{BC}$) dan efek batas skala maksimal `9` pada skala Saaty.
2. **Kenapa saat digabung dengan *Geometric Mean* menjadi konsisten (`CR = 0,0609 <= 0,10`)?**
   Karena `CR` kelompok tidak dihitung dari rata-rata `CR` individu (`0,3365`), melainkan dari matriks konsensus *Geometric Mean* per sel. Dalam skala logaritma, rata-rata geometrik meredam error acak yang berlawanan arah antar responden sehingga matriks gabungan menjadi harmonis ($\lambda_{\text{maks}} = 6,3774 \approx 6$).
3. **Kenapa disediakan dua mode (`Rata-rata AIP` dan `Geometric Mean AIJ`) di aplikasi?**
   - **Rata-rata AIP** dipakai untuk mereplikasi langsung metode **Tabel 2 paper acuan (Zulfahmi et al., 2026)**.
   - **Geometric Mean (AIJ)** disediakan di menu khusus `/geometric-mean` sebagai metode agregasi kelompok Saaty yang konsisten secara utuh (`CR = 0,0609 <= 0,10` pada matriks yang sama dengan bobotnya), dan hasilnya juga menguatkan keputusan karena peringkat #1 SAW tetap sama (`A11 · Infinix GT 50 Pro`).
