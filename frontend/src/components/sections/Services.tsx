import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { ServiceIcon } from "@/lib/public/icons";
import type { ServiceVM } from "@/lib/public/api";

export function Services({ services }: { services: ServiceVM[] }) {
  const items = services.slice(0, 6);

  return (
    <section id="layanan" className="py-20 lg:py-28">
      <Container>
        {/* Editorial header: heading left, intro + action right */}
        <div className="grid gap-8 border-b border-ink-100 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow>Layanan Kami</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 max-w-xl text-3xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
                Perawatan lengkap, dalam satu klinik yang tenang.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:pb-2">
            <p className="text-base leading-relaxed text-ink-500">
              Enam pilar layanan inti yang dirancang menemani setiap tahap
              kesehatan Anda dan keluarga — dari konsultasi pertama hingga tindak
              lanjut perawatan.
            </p>
            <Button href="/layanan" variant="outline" size="sm" className="mt-5">
              Jelajahi semua layanan
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Reveal>
        </div>

        <Stagger className="grid border-l border-ink-100 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => (
            <StaggerItem key={s.slug}>
              <Link
                href="/layanan"
                className="group relative flex h-full flex-col border-b border-r border-ink-100 bg-white p-7 transition-colors duration-300 hover:bg-surface-muted lg:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white group-hover:ring-primary-600">
                    <ServiceIcon name={s.icon} className="h-6 w-6" />
                  </span>
                  <span className="font-display text-sm font-semibold tabular-nums text-ink-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-bold tracking-tight text-ink-900">
                  {s.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-500">
                  {s.short}
                </p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                  Selengkapnya
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>

                {/* hairline that grows on hover */}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-primary-600 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
