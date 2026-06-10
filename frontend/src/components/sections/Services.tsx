import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { services } from "@/lib/data";

export function Services() {
  return (
    <section id="layanan" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Layanan Kami"
          title="Layanan kesehatan lengkap dalam satu tempat"
          description="Enam pilar layanan inti yang dirancang untuk menjaga kesehatan Anda dan keluarga pada setiap tahap kehidupan."
        />

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={s.slug}>
                <Link
                  href="/layanan"
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-lift"
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-7 w-7" />
                  </span>

                  <h3 className="relative mt-5 text-xl font-bold text-ink-900">{s.title}</h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                    {s.short}
                  </p>

                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                    Selengkapnya
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
