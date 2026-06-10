import {
  Stethoscope,
  Syringe,
  Pill,
  ClipboardCheck,
  Scissors,
  Activity,
  HeartPulse,
  Baby,
  Microscope,
  ShieldCheck,
  Ambulance,
  Brain,
  type LucideIcon,
} from "lucide-react";

/* ----------------------------- Services ----------------------------- */
export interface Service {
  slug: string;
  title: string;
  icon: LucideIcon;
  short: string;
  description: string;
  points: string[];
}

export const services: Service[] = [
  {
    slug: "konsultasi",
    title: "Konsultasi Primer",
    icon: Stethoscope,
    short: "Dokter umum & spesialis siap mendampingi keluhan Anda.",
    description:
      "Layanan konsultasi dokter umum dan spesialis dengan pendekatan personal. Diagnosis akurat, rencana perawatan jelas, dan tindak lanjut yang terjaga.",
    points: ["Dokter umum & spesialis", "Telekonsultasi tersedia", "Rekam medis digital"],
  },
  {
    slug: "vaksinasi",
    title: "Program Vaksinasi",
    icon: Syringe,
    short: "Imunisasi anak, dewasa, perjalanan, hingga vaksin haji & umroh.",
    description:
      "Program vaksinasi lengkap untuk segala usia — mulai imunisasi anak, vaksin dewasa, vaksin perjalanan internasional, hingga syarat vaksinasi haji & umroh.",
    points: ["Imunisasi anak & dewasa", "Vaksin perjalanan", "Sertifikat resmi"],
  },
  {
    slug: "farmasi",
    title: "Farmasi Ritel",
    icon: Pill,
    short: "Apotek lengkap dengan apoteker yang siap berkonsultasi.",
    description:
      "Apotek dengan ketersediaan obat lengkap dan apoteker berpengalaman. Konsultasi penggunaan obat dan layanan tebus resep yang cepat dan aman.",
    points: ["Obat resep & bebas", "Konsultasi apoteker", "Antar obat"],
  },
  {
    slug: "medical-check-up",
    title: "Medical Check-Up",
    icon: ClipboardCheck,
    short: "Paket skrining kesehatan untuk individu, pasangan, & korporat.",
    description:
      "Paket medical check-up komprehensif dengan laboratorium terintegrasi. Tersedia paket individu, pasangan, pra-nikah, hingga skrining karyawan korporat.",
    points: ["Paket individu & korporat", "Hasil cepat & akurat", "Konsultasi hasil"],
  },
  {
    slug: "bedah-minor",
    title: "Bedah Minor",
    icon: Scissors,
    short: "Tindakan bedah ringan dengan standar sterilitas tinggi.",
    description:
      "Tindakan bedah minor seperti pengangkatan kista, lipoma, kutil, dan penjahitan luka dengan prosedur steril serta pemulihan yang nyaman.",
    points: ["Tindakan steril", "Pemulihan nyaman", "Dokter berpengalaman"],
  },
  {
    slug: "terapi-tertarget",
    title: "Terapi Tertarget",
    icon: Activity,
    short: "Program terapi IV, GERD, dan pemulihan yang dipersonalisasi.",
    description:
      "Program terapi tertarget termasuk IV therapy, penanganan GERD, dan terapi pemulihan yang disesuaikan dengan kebutuhan spesifik setiap pasien.",
    points: ["IV therapy", "Penanganan GERD", "Program dipersonalisasi"],
  },
];

/* ----------------------- Hero promotional slides --------------------- */
export interface Slide {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  badge: string;
  icon: LucideIcon;
  image: string;
}

export const slides: Slide[] = [
  {
    id: 1,
    eyebrow: "Asuransi Cashless",
    title: "Berobat tanpa repot, langsung tanpa tunai",
    subtitle:
      "Bekerja sama dengan lebih dari 30 mitra asuransi untuk layanan cashless yang cepat dan mudah.",
    cta: "Lihat mitra asuransi",
    href: "/layanan",
    badge: "Cashless",
    icon: ShieldCheck,
    image: "/hero/slide-cashless.jpg",
  },
  {
    id: 2,
    eyebrow: "Vaksinasi Haji & Umroh",
    title: "Penuhi syarat vaksinasi perjalanan ibadah Anda",
    subtitle:
      "Vaksin meningitis dan influenza lengkap dengan sertifikat resmi yang diakui secara internasional.",
    cta: "Jadwalkan vaksinasi",
    href: "/layanan",
    badge: "Vaksin",
    icon: Syringe,
    image: "/hero/slide-vaccine.jpg",
  },
  {
    id: 3,
    eyebrow: "Program Korporat",
    title: "Jaga kesehatan tim, tingkatkan produktivitas",
    subtitle:
      "Paket medical check-up dan layanan kesehatan karyawan yang dapat disesuaikan dengan kebutuhan perusahaan.",
    cta: "Konsultasi korporat",
    href: "/kontak",
    badge: "Korporat",
    icon: ClipboardCheck,
    image: "/hero/slide-corporate.jpg",
  },
];

/* -------------------------------- Stats ------------------------------ */
export const stats = [
  { value: 120, suffix: "K+", label: "Pasien dilayani" },
  { value: 45, suffix: "+", label: "Dokter & spesialis" },
  { value: 4, suffix: "", label: "Lokasi klinik" },
  { value: 98, suffix: "%", label: "Kepuasan pasien" },
];

/* ------------------------------- Doctors ----------------------------- */
export interface Doctor {
  slug: string;
  name: string;
  specialty: string;
  initials: string;
  experience: string;
  accent: string;
  image: string;
}

export const doctors: Doctor[] = [
  { slug: "agnes-pratiwi", name: "dr. Agnes Pratiwi, Sp.PD", specialty: "Penyakit Dalam", initials: "AP", experience: "12 tahun", accent: "from-primary-400 to-primary-600", image: "/doctors/agnes-pratiwi.jpg" },
  { slug: "yoga-kurniawan", name: "dr. Yoga D. S. Kurniawan", specialty: "Dokter Umum", initials: "YK", experience: "8 tahun", accent: "from-accent-400 to-accent-600", image: "/doctors/yoga-kurniawan.jpg" },
  { slug: "siti-rahmadani", name: "dr. Siti Rahmadani, Sp.A", specialty: "Spesialis Anak", initials: "SR", experience: "10 tahun", accent: "from-primary-500 to-accent-500", image: "/doctors/siti-rahmadani.jpg" },
  { slug: "bayu-santoso", name: "dr. Bayu Santoso, Sp.B", specialty: "Bedah Umum", initials: "BS", experience: "15 tahun", accent: "from-accent-500 to-primary-600", image: "/doctors/bayu-santoso.jpg" },
  { slug: "maria-lestari", name: "dr. Maria Lestari, Sp.OG", specialty: "Kebidanan & Kandungan", initials: "ML", experience: "11 tahun", accent: "from-primary-400 to-accent-500", image: "/doctors/maria-lestari.jpg" },
  { slug: "rendra-wijaya", name: "dr. Rendra Wijaya, Sp.KK", specialty: "Kulit & Kelamin", initials: "RW", experience: "9 tahun", accent: "from-accent-400 to-primary-500", image: "/doctors/rendra-wijaya.jpg" },
];

/* ------------------------------ Locations ---------------------------- */
export interface ClinicLocation {
  slug: string;
  name: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  position: { lat: number; lng: number };
}

export const locations: ClinicLocation[] = [
  { slug: "thamrin", name: "Sehat Nusantara — Thamrin", area: "Jakarta Pusat", address: "Sinarmas Land Plaza Tower 1, Lt. 10, Jl. M.H. Thamrin No. 51", hours: "Senin–Sabtu, 08.00–20.00", phone: "+62 21 5050 1234", position: { lat: -6.1936, lng: 106.8229 } },
  { slug: "menteng", name: "Sehat Nusantara — Menteng", area: "Jakarta Pusat", address: "Jl. H.O.S. Cokroaminoto No. 12, Menteng", hours: "Senin–Sabtu, 08.00–20.00", phone: "+62 21 5050 2345", position: { lat: -6.1975, lng: 106.8305 } },
  { slug: "kebayoran", name: "Sehat Nusantara — Kebayoran", area: "Jakarta Selatan", address: "Jl. Senopati Raya No. 88, Kebayoran Baru", hours: "Senin–Minggu, 08.00–21.00", phone: "+62 21 5050 3456", position: { lat: -6.2297, lng: 106.8106 } },
  { slug: "tb-simatupang", name: "Sehat Nusantara — TB Simatupang", area: "Jakarta Selatan", address: "South Quarter Tower B, Lt. 3, Jl. R.A. Kartini Kav. 8", hours: "Senin–Sabtu, 08.00–20.00", phone: "+62 21 5050 4567", position: { lat: -6.2899, lng: 106.8194 } },
];

/* ------------------------------ Articles ----------------------------- */
export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMins: number;
}

export const articles: Article[] = [
  { slug: "memahami-pcos", title: "Memahami PCOS: Gejala, Penyebab, dan Penanganannya", excerpt: "Polycystic Ovary Syndrome memengaruhi banyak perempuan usia produktif. Kenali tanda-tandanya sejak dini.", category: "Kesehatan Wanita", date: "2026-05-28", readMins: 5 },
  { slug: "garam-dan-eksim", title: "Hubungan Asupan Garam dengan Kondisi Eksim", excerpt: "Penelitian terbaru menunjukkan asupan garam berlebih dapat memperburuk peradangan kulit. Ini penjelasannya.", category: "Dermatologi", date: "2026-05-21", readMins: 4 },
  { slug: "medical-check-up-visa-pelajar", title: "Persiapan Medical Check-Up untuk Visa Pelajar", excerpt: "Akan studi ke luar negeri? Pahami komponen pemeriksaan kesehatan yang umumnya dibutuhkan.", category: "Medical Check-Up", date: "2026-05-14", readMins: 6 },
  { slug: "kesehatan-dan-pakaian-dalam", title: "Pilihan Pakaian Dalam dan Dampaknya bagi Kesehatan", excerpt: "Bahan dan ukuran pakaian dalam ternyata berpengaruh pada kesehatan area intim. Simak tipsnya.", category: "Gaya Hidup", date: "2026-05-07", readMins: 4 },
  { slug: "kapan-waktu-tepat-ortodonti", title: "Kapan Waktu yang Tepat untuk Perawatan Ortodonti?", excerpt: "Pemasangan behel tidak hanya soal estetika. Pahami waktu ideal untuk hasil yang optimal.", category: "Gigi & Mulut", date: "2026-04-30", readMins: 5 },
  { slug: "mengelola-gerd", title: "Strategi Mengelola GERD agar Tak Mudah Kambuh", excerpt: "Dari pola makan hingga manajemen stres, ini langkah praktis menjaga GERD tetap terkendali.", category: "Penyakit Dalam", date: "2026-04-23", readMins: 6 },
];

/* ----------------------------- Promotions ---------------------------- */
export interface Promotion {
  slug: string;
  title: string;
  tag: string;
  price: string;
  oldPrice?: string;
  desc: string;
}

export const promotions: Promotion[] = [
  { slug: "iv-therapy-gerd", title: "IV Therapy untuk GERD", tag: "Hemat 20%", price: "Rp 480.000", oldPrice: "Rp 600.000", desc: "Bantu redakan gejala GERD dengan terapi cairan yang menutrisi tubuh." },
  { slug: "mcu-berpasangan", title: "Skrining Kesehatan Berpasangan", tag: "Paket Berdua", price: "Rp 1.350.000", oldPrice: "Rp 1.700.000", desc: "Periksa kesehatan bersama pasangan dengan rangkaian tes menyeluruh." },
  { slug: "vaksin-flu-pneumonia", title: "Vaksin Flu & Pneumonia", tag: "Bundling", price: "Rp 950.000", oldPrice: "Rp 1.150.000", desc: "Lindungi diri dari infeksi saluran napas dengan paket dua vaksin." },
];

/* ----------------------------- Why choose ---------------------------- */
export const advantages = [
  { icon: ShieldCheck, title: "Standar Global", desc: "Protokol layanan mengacu pada standar internasional dan terakreditasi." },
  { icon: HeartPulse, title: "Berpusat pada Pasien", desc: "Setiap rencana perawatan disesuaikan dengan kondisi dan kebutuhan Anda." },
  { icon: Microscope, title: "Teknologi Terkini", desc: "Laboratorium dan peralatan diagnostik modern untuk hasil yang akurat." },
  { icon: Ambulance, title: "Layanan Responsif", desc: "Jadwal fleksibel, telekonsultasi, dan tindak lanjut yang terjaga." },
];

/* --------------------------- Care specialties ------------------------ */
export const specialties = [
  { icon: HeartPulse, label: "Penyakit Dalam" },
  { icon: Baby, label: "Kesehatan Anak" },
  { icon: Brain, label: "Saraf & Neurologi" },
  { icon: Microscope, label: "Laboratorium" },
  { icon: Scissors, label: "Bedah Minor" },
  { icon: Activity, label: "Rehabilitasi" },
];

/* ----------------------------- Insurance ----------------------------- */
export const partners = [
  "Allianz", "Prudential", "AXA Mandiri", "BNI Life", "Mandiri Inhealth",
  "Great Eastern", "Cigna", "Sequis", "Manulife", "BPJS Kesehatan",
];

/* ----------------------------- Testimonials -------------------------- */
export const testimonials = [
  { name: "Dewi Anggraini", role: "Pasien Medical Check-Up", quote: "Prosesnya cepat dan rapi. Dokter menjelaskan hasil dengan sangat detail tanpa membuat saya cemas.", initials: "DA" },
  { name: "Hendra Gunawan", role: "Pasien Korporat", quote: "Program kesehatan karyawan di kantor kami berjalan mulus berkat tim Sehat Nusantara. Sangat profesional.", initials: "HG" },
  { name: "Putri Maharani", role: "Pasien Vaksinasi", quote: "Vaksin haji sekeluarga selesai dalam satu kunjungan, lengkap dengan sertifikatnya. Pelayanan ramah sekali.", initials: "PM" },
];

/* --------------------------- Story timeline -------------------------- */
export const milestones = [
  { year: "2016", title: "Klinik pertama dibuka", desc: "Memulai perjalanan dari satu klinik di kawasan Thamrin, Jakarta Pusat." },
  { year: "2019", title: "Ekspansi layanan", desc: "Menambah layanan vaksinasi perjalanan, farmasi ritel, dan medical check-up korporat." },
  { year: "2022", title: "Transformasi digital", desc: "Meluncurkan rekam medis digital dan layanan telekonsultasi untuk seluruh cabang." },
  { year: "2025", title: "Empat lokasi & terakreditasi", desc: "Beroperasi di empat lokasi strategis dengan standar layanan terakreditasi nasional." },
];

export const values = [
  { title: "Integritas", desc: "Mengutamakan kejujuran medis dan transparansi dalam setiap layanan." },
  { title: "Empati", desc: "Mendengarkan dan memahami setiap pasien sebagai individu." },
  { title: "Keunggulan", desc: "Berkomitmen pada mutu klinis dan perbaikan berkelanjutan." },
  { title: "Kolaborasi", desc: "Bekerja sebagai satu tim lintas disiplin demi hasil terbaik." },
];
