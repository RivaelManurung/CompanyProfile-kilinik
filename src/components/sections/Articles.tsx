import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { articles } from "@/lib/data";

export function Articles() {
  return (
    <section className="bg-surface-muted py-20 lg:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Berita & Artikel"
            title="Wawasan kesehatan terbaru"
            description="Tips, edukasi, dan informasi kesehatan dari tim medis kami."
          />
          <Button href="/artikel" variant="outline" className="hidden shrink-0 sm:inline-flex">
            Semua Artikel
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <StaggerItem key={a.slug}>
              <ArticleCard article={a} />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-8 sm:hidden">
          <Button href="/artikel" variant="outline" className="w-full">
            Semua Artikel
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
