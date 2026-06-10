import type { Metadata } from "next";
import { Locations } from "@/components/sections/Locations";
import { PageBanner } from "@/components/ui/PageBanner";
import { CTA } from "@/components/sections/CTA";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ClinicMap } from "@/components/sections/ClinicMap";

export const metadata: Metadata = {
  title: "Lokasi Kami",
  description:
    "Temukan klinik Sehat Nusantara terdekat di Jakarta Pusat dan Jakarta Selatan, lengkap dengan jam operasional dan kontak.",
};

export default function LokasiPage() {
  return (
    <>
      <PageBanner
        crumb="Lokasi Kami"
        eyebrow="Lokasi Kami"
        title="Selalu dekat dengan Anda di Jakarta"
        description="Empat lokasi strategis dengan akses mudah, fasilitas modern, dan jam operasional yang fleksibel."
      />
      <section className="pb-4">
        <Container>
          <Reveal>
            <ClinicMap />
          </Reveal>
        </Container>
      </section>

      <div className="-mt-4">
        <Locations />
      </div>
      <CTA />
    </>
  );
}
