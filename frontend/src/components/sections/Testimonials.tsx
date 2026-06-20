import { Quote, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { testimonials } from "@/lib/data";

function Stars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-0.5 text-warning ${className}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [featured, ...supporting] = testimonials;

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Kata Mereka"
          title="Dipercaya ribuan pasien setiap bulan"
          description="Cerita nyata dari mereka yang telah merasakan layanan kami."
        />

        <Stagger className="mt-14 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* Featured quote — dark, breaks the grid rhythm */}
          <StaggerItem className="lg:row-span-2">
            <figure className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-dark p-8 text-white shadow-lift sm:p-10">
              <div
                className="bg-dots absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_at_top_right,#000_10%,transparent_70%)]"
                aria-hidden
              />
              <Quote
                className="h-10 w-10 shrink-0 text-primary-400/70"
                aria-hidden
              />
              <blockquote className="relative mt-6 flex-1 font-display text-2xl font-semibold leading-snug tracking-tight sm:text-[1.7rem]">
                “{featured.quote}”
              </blockquote>
              <figcaption className="relative mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white ring-1 ring-white/20">
                  {featured.initials}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{featured.name}</span>
                  <span className="text-sm text-primary-100/70">
                    {featured.role}
                  </span>
                </span>
                <Stars />
              </figcaption>
            </figure>
          </StaggerItem>

          {/* Aggregate rating card */}
          <StaggerItem>
            <div className="flex h-full flex-col justify-center rounded-3xl border border-primary-100 bg-primary-50/50 p-7">
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-extrabold tracking-tight text-primary-700">
                  4.9
                </span>
                <div className="pb-1.5">
                  <Stars />
                  <p className="mt-1 text-xs font-medium text-ink-500">
                    dari 5.0
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-600">
                Penilaian rata-rata dari{" "}
                <span className="font-bold text-ink-900">12.000+</span> ulasan
                pasien terverifikasi setiap bulan.
              </p>
            </div>
          </StaggerItem>

          {/* Supporting quotes */}
          {supporting.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card">
                <Stars className="mb-4" />
                <blockquote className="flex-1 text-[0.98rem] leading-relaxed text-ink-700">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 ring-1 ring-primary-100">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">
                      {t.name}
                    </span>
                    <span className="text-xs text-ink-500">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
