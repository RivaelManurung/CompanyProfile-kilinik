import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { CTA } from "@/components/sections/CTA";
import { articles } from "@/lib/data";
import { formatDateID } from "@/lib/utils";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "Artikel tidak ditemukan" };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.slug !== slug).slice(0, 3);

  const paragraphs = [
    `${article.excerpt} Topik ini menjadi perhatian banyak orang, namun sering kali masih disertai pemahaman yang keliru. Pada artikel ini, tim medis Klinik Sehat Nusantara merangkum informasi penting yang perlu Anda ketahui.`,
    "Memahami kondisi sejak dini adalah langkah pertama menuju penanganan yang tepat. Gejala awal kerap diabaikan karena dianggap ringan, padahal deteksi dini dapat membuat penanganan jauh lebih efektif dan mengurangi risiko komplikasi di kemudian hari.",
    "Konsultasikan kondisi Anda dengan tenaga medis profesional untuk mendapatkan diagnosis yang akurat. Setiap individu memiliki kondisi yang berbeda, sehingga rencana perawatan sebaiknya disesuaikan secara personal — bukan berdasarkan informasi umum semata.",
    "Jika Anda memiliki pertanyaan lebih lanjut, jangan ragu untuk menghubungi tim Klinik Sehat Nusantara. Kami siap mendampingi Anda dengan layanan konsultasi yang nyaman, baik secara langsung maupun melalui telekonsultasi.",
  ];

  return (
    <>
      <article className="relative overflow-hidden pt-32 pb-16 lg:pt-40">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/70 to-white" />
        <Container className="max-w-3xl">
          <Reveal>
            <Link
              href="/artikel"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke artikel
            </Link>
          </Reveal>
          <Reveal delay={0.05} className="mt-6">
            <Eyebrow>{article.category}</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] text-ink-900 sm:text-4xl lg:text-[2.75rem]">
              {article.title}
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary-500" />
                {formatDateID(article.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary-500" />
                {article.readMins} menit baca
              </span>
            </div>
          </Reveal>
        </Container>
      </article>

      <Container className="max-w-3xl pb-20">
        <Reveal>
          <div className="aspect-[16/8] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary-100 via-primary-50 to-accent-100">
            <div className="bg-dots h-full w-full opacity-40" />
          </div>
        </Reveal>

        <div className="prose-clinic mt-10 space-y-6">
          {paragraphs.map((p, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <p className="text-lg leading-relaxed text-ink-700">{p}</p>
            </Reveal>
          ))}

          <Reveal>
            <div className="my-8 rounded-3xl border-l-4 border-primary-500 bg-primary-50/60 p-6">
              <p className="text-base font-medium italic text-ink-700">
                “Pencegahan selalu lebih baik daripada pengobatan. Pemeriksaan rutin membantu Anda
                mengenali kondisi tubuh lebih dini.”
              </p>
              <p className="mt-3 text-sm font-semibold text-primary-700">— Tim Medis Sehat Nusantara</p>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* Related */}
      <section className="bg-surface-muted py-20">
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">Artikel terkait</h2>
          <Stagger className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((a) => (
              <StaggerItem key={a.slug}>
                <ArticleCard article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <CTA />
    </>
  );
}
