import type { Metadata } from "next";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { BookingWizard } from "@/components/patient/BookingWizard";
import { getServices, getDoctors } from "@/lib/public/api";

export const metadata: Metadata = {
  title: "Buat Janji Temu",
  description:
    "Pesan janji temu dengan dokter pilihan Anda — pilih layanan, dokter, tanggal, dan jam yang tersedia.",
};

export default async function BuatJanjiPage() {
  const [services, doctors] = await Promise.all([getServices(), getDoctors()]);

  return (
    <>
      <PageBanner
        crumb="Buat Janji Temu"
        eyebrow="Janji Temu"
        title="Pesan janji dalam beberapa langkah"
        description="Pilih layanan, dokter, lalu jadwal yang tersedia. Anda akan mendapat konfirmasi dari tim kami."
      />
      <section className="pb-20 lg:pb-28">
        <Container>
          <BookingWizard services={services} doctors={doctors} />
        </Container>
      </section>
    </>
  );
}
