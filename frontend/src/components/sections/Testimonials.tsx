import { Quote, Star } from "lucide-react";
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
          description="Cerita nyata dari mereka yang telah merasakan layanan Klinik Sehat Nusantara."
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="relative flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-soft transition-shadow duration-500 hover:shadow-card">
                <Quote className="h-9 w-9 text-primary-200" />
                <div className="mt-3 flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[0.97rem] leading-relaxed text-ink-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-900">{t.name}</span>
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
