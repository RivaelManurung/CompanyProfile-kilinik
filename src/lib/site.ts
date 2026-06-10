export const site = {
  name: "Klinik Sehat Nusantara",
  shortName: "Sehat Nusantara",
  tagline: "Perawatan kesehatan berstandar global",
  description:
    "Klinik Sehat Nusantara menghadirkan layanan kesehatan menyeluruh dengan standar global — konsultasi, vaksinasi, medical check-up, farmasi, hingga bedah minor dan terapi tertarget.",
  url: "https://sehatnusantara.id",
  email: "care@sehatnusantara.id",
  phoneDisplay: "+62 21 5050 1234",
  phone: "+622150501234",
  whatsapp: "6281200001234",
  whatsappText:
    "Halo Klinik Sehat Nusantara, saya ingin membuat janji konsultasi.",
  instagram: "https://instagram.com/sehat.nusantara",
  instagramHandle: "@sehat.nusantara",
  address: {
    line1: "Sinarmas Land Plaza, Tower 1, Lantai 10",
    line2: "Jl. M.H. Thamrin No. 51, Jakarta Pusat 10350",
  },
  hours: "Senin – Sabtu, 08.00 – 20.00 WIB",
};

export const nav = [
  { label: "Layanan Kami", href: "/layanan" },
  { label: "Kisah Kami", href: "/kisah-kami" },
  { label: "Dokter Kami", href: "/dokter" },
  { label: "Lokasi Kami", href: "/lokasi" },
  { label: "Berita & Artikel", href: "/artikel" },
] as const;
