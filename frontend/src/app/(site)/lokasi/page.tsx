import type { Metadata } from "next";
import { LocationsPaginated } from "@/components/sections/LocationsPaginated";
import { PageBanner } from "@/components/ui/PageBanner";
import { CTA } from "@/components/sections/CTA";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { getLocations } from "@/lib/public/api";
import { ClinicMap } from "@/components/sections/ClinicMapDynamic";

export const metadata: Metadata = {
  title: "Lokasi Kami",
  description:
    "Temukan klinik Sehat Nusantara terdekat di Jakarta Pusat dan Jakarta Selatan, lengkap dengan jam operasional dan kontak.",
};

export default async function LokasiPage() {
  const locations = await getLocations();
  const mapLocations = locations.map((l) => ({
    ...l,
    position: { lat: l.lat, lng: l.lng },
  }));

  return (
    <>
      <PageBanner
        crumb="Lokasi Kami"
        eyebrow="Lokasi Kami"
        title="Selalu dekat dengan Anda"
        description={`${locations.length} lokasi strategis dengan akses mudah, fasilitas modern, dan jam operasional yang fleksibel.`}
      />
      <section className="pb-4">
        <Container>
          <Reveal>
            <ClinicMap locations={mapLocations} />
          </Reveal>
        </Container>
      </section>

      <LocationsPaginated locations={locations} />
      <CTA />
    </>
  );
}
