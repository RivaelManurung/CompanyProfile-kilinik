import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { DoctorCard } from "@/components/ui/DoctorCard";
import type { DoctorVM } from "@/lib/public/api";

export function Doctors({ doctors }: { doctors: DoctorVM[] }) {
  const items = doctors.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="bg-surface-muted py-20 lg:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Reveal>
              <Eyebrow>Dokter Kami</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
                Tim yang Anda temui, bukan sekadar nama di daftar.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                Dokter umum dan spesialis berpengalaman yang mendampingi setiap
                kebutuhan kesehatan Anda dengan pendekatan personal.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <Button
              href="/dokter"
              variant="outline"
              className="hidden shrink-0 sm:inline-flex"
            >
              Semua Dokter
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((d) => (
            <StaggerItem key={d.slug}>
              <DoctorCard doctor={d} />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-8 sm:hidden">
          <Button href="/dokter" variant="outline" className="w-full">
            Semua Dokter
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
