import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { DoctorCard } from "@/components/ui/DoctorCard";
import { doctors } from "@/lib/data";

export function Doctors() {
  return (
    <section className="bg-surface-muted py-20 lg:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Dokter Kami"
            title="Tim dokter berpengalaman dan tepercaya"
            description="Didukung dokter umum dan spesialis yang siap mendampingi setiap kebutuhan kesehatan Anda."
          />
          <Button href="/dokter" variant="outline" className="hidden shrink-0 sm:inline-flex">
            Semua Dokter
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.slice(0, 4).map((d) => (
            <StaggerItem key={d.slug}>
              <DoctorCard doctor={d} />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-8 sm:hidden">
          <Button href="/dokter" variant="outline" className="w-full">
            Semua Dokter
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
