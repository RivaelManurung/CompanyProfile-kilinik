import type { Metadata } from "next";
import {
  Target,
  Eye,
  Sparkles,
  ShieldCheck,
  Heart,
  Award,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Stats } from "@/components/sections/Stats";
import { CTA } from "@/components/sections/CTA";
import { milestones, values } from "@/lib/data";

const valueIcons: LucideIcon[] = [ShieldCheck, Heart, Award, Users];

export const metadata: Metadata = {
  title: "Kisah Kami",
  description:
    "Perjalanan Klinik Sehat Nusantara menghadirkan layanan kesehatan berstandar global dengan sentuhan yang manusiawi sejak 2016.",
};

export default function KisahKamiPage() {
  return (
    <>
      <PageBanner
        crumb="Kisah Kami"
        eyebrow="Kisah Kami"
        title="Menghadirkan kesehatan berkualitas, dengan hati"
        description="Berawal dari satu klinik, kini berkembang menjadi jaringan layanan kesehatan tepercaya di Jakarta."
      />

      {/* Story / Mission / Vision */}
      <section className="pb-16 lg:pb-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Story — given the most weight, editorial pull-quote */}
            <Reveal className="lg:col-span-3">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-dark p-8 text-white shadow-lift sm:p-10">
                <div
                  className="bg-grid absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_at_bottom_left,#000_10%,transparent_70%)]"
                  aria-hidden
                />
                <div
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-600/30 blur-3xl"
                  aria-hidden
                />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-300 ring-1 ring-inset ring-white/15">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sejak 2016
                  </span>
                  <h2 className="mt-6 max-w-md font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                    Berawal dari satu klinik, tumbuh karena satu keyakinan.
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-100/80">
                    Klinik Sehat Nusantara hadir dengan keyakinan bahwa layanan
                    kesehatan berkualitas adalah hak setiap orang. Kami terus
                    tumbuh tanpa kehilangan nilai inti: melayani dengan empati
                    dan integritas.
                  </p>
                </div>
                <blockquote className="relative mt-8 border-l-2 border-accent-400/60 pl-5 font-display text-lg font-medium italic leading-snug text-white/90">
                  “Kami tidak sekadar merawat penyakit — kami merawat orang.”
                </blockquote>
              </div>
            </Reveal>

            {/* Mission & Vision stacked */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Reveal delay={0.08}>
                <div className="flex flex-col rounded-[2rem] border border-ink-100 bg-white p-7 shadow-soft">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                    <Target className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink-900">Misi Kami</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Menyediakan layanan kesehatan menyeluruh, mudah diakses, dan
                    berstandar global bagi setiap keluarga Indonesia.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.14}>
                <div className="flex flex-col rounded-[2rem] border border-ink-100 bg-white p-7 shadow-soft">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 ring-1 ring-accent-100">
                    <Eye className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink-900">Visi Kami</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Menjadi jaringan klinik tepercaya yang menjadi rujukan utama
                    masyarakat dalam menjaga kesehatan secara berkelanjutan.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <Stats />

      {/* Timeline */}
      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="Perjalanan Kami"
            title="Tonggak penting sepanjang perjalanan"
            description="Setiap langkah membawa kami lebih dekat pada misi memberikan layanan kesehatan terbaik."
          />

          <div className="relative mt-16">
            <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-primary-300 via-accent-300 to-transparent md:left-1/2" />
            <Stagger className="space-y-10">
              {milestones.map((m, i) => (
                <StaggerItem key={m.year}>
                  <div
                    className={`relative flex flex-col gap-4 pl-12 md:w-1/2 md:pl-0 ${
                      i % 2 === 0 ? "md:ml-0 md:pr-12 md:text-right" : "md:ml-auto md:pl-12"
                    }`}
                  >
                    <span
                      className={`absolute left-4 top-1.5 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-primary-500 ring-4 ring-primary-100 md:left-auto ${
                        i % 2 === 0 ? "md:-right-1.5 md:left-auto md:translate-x-1/2" : "md:-left-1.5 md:translate-x-[-50%]"
                      }`}
                    />
                    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-shadow hover:shadow-card">
                      <span className="font-display text-3xl font-extrabold text-gradient">{m.year}</span>
                      <h3 className="mt-2 text-lg font-bold text-ink-900">{m.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{m.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-surface-muted py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow="Nilai Kami"
            title="Prinsip yang memandu setiap layanan"
          />
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => {
              const Icon = valueIcons[i] ?? ShieldCheck;
              return (
                <StaggerItem key={v.title}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card">
                    <span
                      className="pointer-events-none absolute -right-2 -top-3 font-display text-7xl font-extrabold text-primary-50 transition-colors duration-500 group-hover:text-primary-100"
                      aria-hidden
                    >
                      0{i + 1}
                    </span>
                    <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-colors duration-500 group-hover:bg-primary-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="relative mt-4 text-lg font-bold text-ink-900">
                      {v.title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-ink-500">
                      {v.desc}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Container>
      </section>

      <CTA />
    </>
  );
}
