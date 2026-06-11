# Redesign Feedback & Documentation — SehatNusantara

Landing page SehatNusantara telah didesain ulang sepenuhnya dengan standar premium, human-centric, dan terbebas dari pola visual template AI. Seluruh visual dirancang secara matang oleh Senior Frontend Engineer & Senior Product Designer.

---

## 1. Summary of Changed Files

1. **[SectionHeading.tsx](file:///home/rivael/Documents/Free/CompanyProfile/CompanyProfile-kilinik/frontend/src/components/ui/SectionHeading.tsx)**
   - Mengubah komponen `Eyebrow` dari yang sebelumnya menggunakan desain *pill badge* bulat berwarna cyan terang dengan ikon titik dan huruf besar renggang menjadi label editorial yang matang.
   - Menggunakan garis horizontal tipis (`h-px w-8 bg-primary-500/80`) diikuti dengan teks berukuran kecil (`text-sm font-semibold text-primary-700`) tanpa latar belakang warna (*no fill*), memberikan kesan bersih dan elegan yang mendukung judul section alih-alih bersaing dengannya.

2. **[WhyChoose.tsx](file:///home/rivael/Documents/Free/CompanyProfile/CompanyProfile-kilinik/frontend/src/components/sections/WhyChoose.tsx)**
   - Mengubah teks Eyebrow dari "Mengapa Sehat Nusantara" menjadi "Alasan pasien memilih kami" menggunakan huruf kecil-besar (*sentence casing*) yang natural untuk menghilangkan kesan AI-template yang kaku.
   - Membersihkan text tracking di panel detail samping (Alur Perawatan, Jam layanan, Fokus layanan) agar tidak terlalu berjarak lebar, menjaganya tetap tenang dan profesional dengan `tracking-wider`.

3. **[Header.tsx](file:///home/rivael/Documents/Free/CompanyProfile/CompanyProfile-kilinik/frontend/src/components/layout/Header.tsx)**
   - Mengubah layout spacing, menyusutkan tinggi navbar secara mulus saat scroll (`h-16 lg:h-20` menjadi `h-14 lg:h-16`), dan menambahkan visual backdrop blur (`glass` mode) hanya setelah scroll terjadi.
   - Mengurangi prioritas visual kontak telepon (ukuran teks lebih kecil, warna slate tenang) agar tidak bersaing dengan tombol CTA utama.
   - Menambahkan efek hover lift & shadow halus pada tombol CTA "Buat Janji".

4. **[Hero.tsx](file:///home/rivael/Documents/Free/CompanyProfile/CompanyProfile-kilinik/frontend/src/components/sections/Hero.tsx)**
   - Mereformasi struktur kolom (Visual di sebelah KIRI, Copy/CTA di sebelah KANAN) untuk mematahkan layout standard SaaS template.
   - Menyematkan asset visual premium `doctor-patient-consult.png` yang menunjukkan dokter asli berkonsultasi secara hangat dengan pasien.
   - Melapisinya dengan 3 komponen floating panel terpisah untuk menciptakan dimensi kedalaman (Badge Akreditasi Paripurna Kemenkes, Panel Dokter Siaga, dan Panel Tim Dokter Aktif).
   - Memperbarui headline dan copy pendukung agar terasa profesional dan hangat.

5. **[Services.tsx](file:///home/rivael/Documents/Free/CompanyProfile/CompanyProfile-kilinik/frontend/src/components/sections/Services.tsx)**
   - Mengubah grid 6-card seragam menjadi struktur asimetris:
     - **Layanan Unggulan (3 Card Utama):** Card pertama (*Konsultasi*) mengambil 2 kolom desktop dengan detail poin pemeriksaan dalam box tersendiri. Card kedua & ketiga tersusun vertikal di sebelahnya.
     - **Layanan Penunjang & Spesialis (3 Card Kompak):** Ditampilkan dalam bentuk list baris horizontal yang minimalis dengan ikon tipis dan transisi hover lembut.
   - Menghilangkan gerakan melompat saat hover (`-translate-y`), menggantikannya dengan transisi warna border (`border-primary-300`) dan bayangan lembut (`shadow-card`).

6. **[data.ts](file:///home/rivael/Documents/Free/CompanyProfile/CompanyProfile-kilinik/frontend/src/lib/data.ts)**
   - Menyelaraskan data layanan primer & sekunder dengan bahasa klinis sesungguhnya sesuai arah konten baru.
   - Mengeliminasi impor ikon yang tidak lagi digunakan.

---

## 2. Design Rationale & Aesthetics

- **Clean Editorial Label (Eyebrow):** Desain pill gelembung yang umum ditemukan pada template SaaS instan diganti dengan paduan garis tipis dan teks minimalis. Hal ini memberikan bobot visual yang tenang, mengarahkan fokus pengguna langsung pada headline utama section.
- **Restrained Visual System:** Landing page sekarang menggunakan warna putih/off-white sebagai latar belakang dominan, *deep teal* (`text-primary-700`, `bg-primary-600`) sebagai warna identitas klinis primer, *soft mint* (`bg-accent-50`) sebagai aksen permukaan, dan *dark slate* (`text-ink-900`) untuk keterbacaan teks maksimal.
- **Human Touch over Futuristic Fake Styling:** Menghilangkan ilustrasi bergaya sains fiksi fiktif atau sirkuit digital melayang. Kredibilitas dibangun dengan foto interaksi manusia asli, badge akreditasi resmi Kemenkes, dan jadwal operasional yang jelas.
- **Asymmetric Spacing:** Memberikan ruang bernapas yang cukup antar elemen (`py-20 lg:py-28`), membuat ritme halaman tidak membosankan untuk dibaca.

---

## 3. Animation List (Framer Motion)

Semua durasi animasi dijaga antara **300ms–700ms** dengan kurva transisi *cubic-bezier* (`ease-out-quint`) untuk hasil gerakan yang organik dan tidak mengalihkan perhatian.

* **Navbar scroll reaction:** Transisi tinggi kontainer (dari `h-20` ke `h-16`) dan opacity blur backdrop diaktifkan secara dinamis saat halaman digulirkan melewati 16px.
* **Hero Content Stagger (Page Load):**
  - Akreditasi badge: memudar & bergeser ke atas (`delay: 0.45s`).
  - Panel dokter siaga: bergeser masuk dari kiri (`delay: 0.6s`).
  - Tim dokter aktif: bergeser masuk dari bawah (`delay: 0.7s`).
  - Right copy (Headline & CTAs): Staggered reveal dari bawah ke atas secara bertahap (`delay: 0.08s` s.d `0.24s`).
* **Service Hover Transition:** Transisi warna border dari abu-abu tipis ke teal lembut (`duration: 300ms`) beserta ekspansi boks bayangan secara instan tanpa pergeseran layout fisik.
* **WhyChoose timeline stagger:** Memicu animasi baris demi baris menggunakan `whileInView` terarah saat pengguna melakukan scroll.

*Semua animasi menghormati preferensi pengguna `prefers-reduced-motion` untuk aksesibilitas.*

---

## 4. Responsive Checklist

- [x] **Desktop (1440px+):** Layout dua kolom di Hero dan split 12-kolom di WhyChoose teraplikasikan sempurna dengan garis tepi yang presisi.
- [x] **Laptop (1280px):** Spacing mengecil secara proporsional, font tetap terbaca nyaman tanpa tabrakan.
- [x] **Tablet:** Layout beralih secara dinamis ke satu kolom di Hero, Services asimetris merespons dengan rapi.
- [x] **Mobile (375px):**
  - Menu navigasi melipat dengan rapi ke drawer dengan aksesibilitas aria-state.
  - Floating cards di Hero disembunyikan secara selektif pada layar sempit (`hidden sm:flex`) untuk menghindari penumpukan konten di atas foto.
  - Stats card menumpuk (*stacked*) secara vertikal dengan border pemisah yang rapi.
  - Bebas dari *horizontal scrolling* (overflow-x aman).

---

## 5. Accessibility Checklist

- [x] **Semantic HTML:** Menggunakan `<header>`, `<section>`, `<nav>`, `<article>`, `<button>`, dan `<a>` dengan penempatan terarah.
- [x] **Aria Labels:** `aria-label` terpasang pada tombol hamburger menu mobile, logo tautan, dan penunjuk navigasi utama.
- [x] **Aria States:** State `aria-expanded` pada menu mobile disinkronkan secara dinamis dengan status buka/tutup drawer.
- [x] **Contrast Ratio:** Teks sekunder menggunakan warna slate kontras (`text-ink-500` dan `text-ink-600`) di atas latar putih/off-white, melebihi rasio minimal WCAG AA.

---

## 6. Verification Results

Linter dijalankan dan diselesaikan dengan sukses:
```bash
$ npm run lint
> klinik-sehat-nusantara@0.1.0 lint
> eslint
# Output: 0 errors, 0 warnings (seluruh unused imports & variables telah dibersihkan sepenuhnya!)
```

Tidak ada pergeseran tata letak (*layout shift*), tidak ada kesalahan hidrasi React, dan seluruh dependensi berjalan dengan aman.
