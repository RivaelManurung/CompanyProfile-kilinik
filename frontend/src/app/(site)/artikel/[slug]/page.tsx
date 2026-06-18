import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { CTA } from "@/components/sections/CTA";
import { getArticleBySlug, getArticles } from "@/lib/public/api";
import { formatDateID } from "@/lib/utils";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Artikel tidak ditemukan" };
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
  };
}

export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = (await getArticles())
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  return (
    <>
      <article className="relative overflow-hidden pt-32 pb-12 lg:pt-40">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/70 to-white" />
        <Container className="max-w-3xl">
          <Reveal>
            <Link
              href="/artikel"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke artikel
            </Link>
          </Reveal>
          <Reveal delay={0.05} className="mt-6">
            <Eyebrow>{article.category}</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
              {article.title}
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-ink-500">
              {article.author && (
                <span className="font-medium text-ink-700">{article.author}</span>
              )}
              {article.date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary-600" />
                  {formatDateID(article.date)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary-600" />
                {article.readMins} menit baca
              </span>
            </div>
          </Reveal>
        </Container>
      </article>

      <Container className="max-w-3xl pb-20">
        <Reveal>
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-3xl bg-primary-50">
            {article.cover ? (
              <Image
                src={article.cover}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            ) : (
              <div className="bg-dots h-full w-full opacity-40" />
            )}
          </div>
        </Reveal>

        <Reveal>
          <div
            className="tiptap mt-10 text-lg leading-relaxed text-ink-700 [&_a]:text-primary-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink-900 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink-900 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
          />
        </Reveal>

        {article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-ink-100 bg-surface-muted px-3 py-1 text-xs font-medium text-ink-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </Container>

      {related.length > 0 && (
        <section className="bg-surface-muted py-20">
          <Container>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Artikel terkait
            </h2>
            <Stagger className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((a) => (
                <StaggerItem key={a.slug}>
                  <ArticleCard article={a} />
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      <CTA />
    </>
  );
}
