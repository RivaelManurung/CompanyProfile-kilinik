import type { Metadata } from "next";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { ArticleGrid } from "@/components/sections/ArticleGrid";
import { CTA } from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Berita & Artikel",
  description:
    "Wawasan, tips, dan edukasi kesehatan terbaru dari tim medis Klinik Sehat Nusantara.",
};

export default function ArtikelPage() {
  return (
    <>
      <PageBanner
        crumb="Berita & Artikel"
        eyebrow="Berita & Artikel"
        title="Wawasan kesehatan untuk hidup lebih baik"
        description="Artikel edukatif dan kabar terbaru seputar kesehatan, langsung dari tim medis kami."
      />
      <section className="pb-20 lg:pb-28">
        <Container>
          <ArticleGrid />
        </Container>
      </section>
      <CTA />
    </>
  );
}
