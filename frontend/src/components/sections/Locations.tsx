import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { LocationCard } from "@/components/ui/LocationCard";
import type { LocationVM } from "@/lib/public/api";

const HOME_LIMIT = 8;

export function Locations({ locations }: { locations: LocationVM[] }) {
  if (locations.length === 0) return null;

  const items = locations.slice(0, HOME_LIMIT);
  const hasMore = locations.length > HOME_LIMIT;

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Lokasi Kami"
          title="Selalu ada cabang yang dekat dengan Anda"
          description={`Temukan klinik terdekat dari ${locations.length} lokasi strategis kami di Jakarta dan sekitarnya.`}
        />

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((loc) => (
            <StaggerItem key={loc.slug}>
              <LocationCard loc={loc} />
            </StaggerItem>
          ))}
        </Stagger>

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <Button href="/lokasi" variant="outline" size="lg">
              Tampilkan lebih banyak lokasi
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
