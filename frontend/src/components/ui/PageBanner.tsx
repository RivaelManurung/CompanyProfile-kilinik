import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";

export function PageBanner({
  eyebrow,
  title,
  description,
  crumb,
}: {
  eyebrow: string;
  title: string;
  description: string;
  crumb: string;
}) {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-28 lg:pb-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/80 via-white to-white" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" />
      <div className="animate-blob absolute -right-20 -top-10 -z-10 h-72 w-72 bg-accent-200/40 blur-3xl" />

      <Container>
        <Reveal>
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-400">
            <Link href="/" className="transition-colors hover:text-primary-600">Beranda</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-ink-700">{crumb}</span>
          </nav>
        </Reveal>
        <Reveal delay={0.05}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] text-ink-900 sm:text-5xl">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">{description}</p>
        </Reveal>
      </Container>
    </section>
  );
}
