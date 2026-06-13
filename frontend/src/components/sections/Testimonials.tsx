import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Kata Mereka"
          title="Dipercaya ribuan pasien setiap bulan"
          description="Cerita nyata dari mereka yang telah merasakan layanan kami."
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-[1.02rem] leading-relaxed text-ink-800">
                  <span className="font-display text-primary-300">“</span>
                  {t.quote}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3 border-t border-ink-100 pt-5">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-900">
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
