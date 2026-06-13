import { Tag, ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { cn } from "@/lib/utils";
import type { PromotionVM } from "@/lib/public/api";

export function Promotions({ promotions }: { promotions: PromotionVM[] }) {
  const items = promotions.slice(0, 3);
  if (items.length === 0) return null;

  // Highlight the featured offer (or the first one) with the dark forest card.
  const featuredIndex = Math.max(
    0,
    items.findIndex((p) => p.featured),
  );

  return (
    <section className="bg-surface-muted py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Promo & Paket"
          title="Paket hemat untuk menjaga yang Anda sayangi"
          description="Pilihan paket bulan ini, dirancang agar perawatan berkualitas tetap terjangkau."
        />

        <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((p, i) => {
            const dark = i === featuredIndex;
            return (
              <StaggerItem key={p.slug}>
                <div
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-500 hover:-translate-y-1.5",
                    dark
                      ? "border-transparent bg-dark text-white shadow-card hover:shadow-lift"
                      : "border-ink-100 bg-white hover:border-primary-200 hover:shadow-card",
                  )}
                >
                  {dark && (
                    <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.15]" />
                  )}

                  <span
                    className={cn(
                      "relative inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                      dark
                        ? "bg-white/15 text-white ring-1 ring-white/20"
                        : "bg-accent-50 text-accent-700 ring-1 ring-accent-100",
                    )}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {p.tag}
                  </span>

                  <h3
                    className={cn(
                      "relative mt-5 text-xl font-bold tracking-tight",
                      dark ? "text-white" : "text-ink-900",
                    )}
                  >
                    {p.title}
                  </h3>
                  <p
                    className={cn(
                      "relative mt-2.5 flex-1 text-sm leading-relaxed",
                      dark ? "text-white/70" : "text-ink-500",
                    )}
                  >
                    {p.desc}
                  </p>

                  <div className="relative mt-6 flex items-end gap-2">
                    <span
                      className={cn(
                        "font-display text-2xl font-extrabold tracking-tight",
                        dark ? "text-white" : "text-primary-700",
                      )}
                    >
                      {p.price}
                    </span>
                    {p.oldPrice && (
                      <span
                        className={cn(
                          "mb-1 text-sm line-through",
                          dark ? "text-white/45" : "text-ink-400",
                        )}
                      >
                        {p.oldPrice}
                      </span>
                    )}
                  </div>

                  <Button
                    href="/kontak"
                    variant={dark ? "white" : "primary"}
                    className="relative mt-6 w-full"
                  >
                    Ambil Promo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
          <Check className="h-3.5 w-3.5 text-accent-600" />
          Harga sudah termasuk konsultasi awal. Syarat &amp; ketentuan berlaku.
        </p>
      </Container>
    </section>
  );
}
