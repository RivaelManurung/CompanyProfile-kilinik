import type { Metadata } from "next";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi Klinik Sehat Nusantara mengenai pengumpulan, penggunaan, dan perlindungan data pribadi serta data kesehatan pasien sesuai UU PDP No. 27/2022.",
};

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: "Kami mengumpulkan data identitas (nama, NIK, tanggal lahir, jenis kelamin, alamat), data kontak (email, nomor telepon/WhatsApp), serta data terkait janji temu dan riwayat layanan Anda di klinik. Data kesehatan diperlakukan sebagai data pribadi bersifat spesifik.",
  },
  {
    title: "2. Dasar & Tujuan Pemrosesan",
    body: "Data diproses berdasarkan persetujuan Anda dan untuk kepentingan pelayanan kesehatan: pendaftaran akun pasien, penjadwalan dan konfirmasi janji temu, pengelolaan rekam medis, serta komunikasi terkait perawatan Anda.",
  },
  {
    title: "3. Persetujuan (Consent)",
    body: "Dengan membuat akun, Anda menyetujui pemrosesan data pribadi dan data kesehatan Anda sebagaimana dijelaskan di sini. Persetujuan dicatat beserta waktu dan versi kebijakan. Anda dapat menarik persetujuan dengan menghapus akun.",
  },
  {
    title: "4. Perlindungan Data",
    body: "Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data Anda — termasuk enkripsi kata sandi, kontrol akses berbasis peran, dan pencatatan audit. Akses ke data pasien dibatasi hanya untuk staf yang berwenang.",
  },
  {
    title: "5. Berbagi Data",
    body: "Kami tidak menjual data Anda. Data hanya dibagikan kepada tenaga kesehatan yang menangani Anda dan, bila diwajibkan, kepada otoritas sesuai ketentuan hukum yang berlaku.",
  },
  {
    title: "6. Hak Anda",
    body: "Sesuai UU Pelindungan Data Pribadi No. 27 Tahun 2022, Anda berhak mengakses, memperbarui, mengunduh, dan meminta penghapusan data Anda. Pengunduhan dan penghapusan akun tersedia melalui halaman Akun Saya.",
  },
  {
    title: "7. Penyimpanan & Retensi",
    body: "Data rekam medis disimpan sesuai ketentuan Permenkes tentang Rekam Medis. Saat akun dihapus, data identitas Anda dianonimkan sementara catatan kunjungan dipertahankan untuk kepatuhan rekam medis.",
  },
  {
    title: "8. Kontak",
    body: `Untuk pertanyaan terkait privasi atau pelaksanaan hak Anda, hubungi kami di ${site.email} atau ${site.phoneDisplay}.`,
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <>
      <PageBanner
        crumb="Kebijakan Privasi"
        eyebrow="Privasi & Data"
        title="Kebijakan Privasi"
        description="Bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi serta data kesehatan Anda."
      />
      <section className="py-16 lg:py-24">
        <Container className="max-w-3xl">
          <p className="text-sm text-ink-500">
            Berlaku sejak Juni 2026 · Versi v1
          </p>
          <div className="mt-8 space-y-8">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-bold tracking-tight text-ink-900">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
