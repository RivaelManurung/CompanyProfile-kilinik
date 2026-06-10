import { Tag, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { promotions } from "@/lib/data";

export function Promotions() {
  return (
    <section className="bg-surface-muted py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Promo & Paket"
          title="Promo kesehatan pilihan bulan ini"
          description="Manfaatkan paket hemat untuk menjaga kesehatan Anda dan keluarga."
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {promotions.map((p) => (
            <StaggerItem key={p.slug}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold text-accent-700">
                  <Tag className="h-3.5 w-3.5" />
                  {p.tag}
                </span>

                <h3 className="mt-2 max-w-[14ch] text-xl font-bold text-ink-900">{p.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{p.desc}</p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-2xl font-extrabold text-primary-700">{p.price}</span>
                  {p.oldPrice && (
                    <span className="mb-0.5 text-sm text-ink-400 line-through">{p.oldPrice}</span>
                  )}
                </div>

                <Button href="/kontak" className="mt-5 w-full">
                  Ambil Promo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
