import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { ArticleCard } from "@/components/ui/ArticleCard";
import type { ArticleVM } from "@/lib/public/api";

export function Articles({ articles }: { articles: ArticleVM[] }) {
  const items = articles.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="bg-surface-muted py-20 lg:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Reveal>
              <Eyebrow>Berita &amp; Artikel</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
                Edukasi kesehatan yang bisa Anda percaya.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                Tips praktis dan wawasan medis, ditulis dan ditinjau oleh tim
                dokter kami.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <Button
              href="/artikel"
              variant="outline"
              className="hidden shrink-0 sm:inline-flex"
            >
              Semua Artikel
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((a) => (
            <StaggerItem key={a.slug}>
              <ArticleCard article={a} />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-8 sm:hidden">
          <Button href="/artikel" variant="outline" className="w-full">
            Semua Artikel
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
