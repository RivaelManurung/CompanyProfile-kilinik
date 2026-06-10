import type { Metadata } from "next";
import { Target, Eye, Sparkles } from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Stats } from "@/components/sections/Stats";
import { CTA } from "@/components/sections/CTA";
import { milestones, values } from "@/lib/data";

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

      {/* Mission / Vision */}
      <section className="pb-16 lg:pb-24">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            <Reveal className="lg:col-span-1">
              <div className="flex h-full flex-col rounded-3xl bg-dark p-8 text-white shadow-card">
                <Sparkles className="h-9 w-9 text-accent-400" />
                <h2 className="mt-5 text-2xl font-bold">Cerita kami</h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-100/80">
                  Sejak 2016, Klinik Sehat Nusantara hadir dengan keyakinan bahwa layanan kesehatan
                  berkualitas adalah hak setiap orang. Kami terus tumbuh tanpa kehilangan nilai
                  inti: melayani dengan empati dan integritas.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-2">
              <div className="grid h-full gap-6 sm:grid-cols-2">
                <div className="flex flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Target className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink-900">Misi Kami</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Menyediakan layanan kesehatan menyeluruh, mudah diakses, dan berstandar global
                    bagi setiap keluarga Indonesia.
                  </p>
                </div>
                <div className="flex flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                    <Eye className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink-900">Visi Kami</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Menjadi jaringan klinik tepercaya yang menjadi rujukan utama masyarakat dalam
                    menjaga kesehatan secara berkelanjutan.
                  </p>
                </div>
              </div>
            </Reveal>
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
            {values.map((v, i) => (
              <StaggerItem key={v.title}>
                <div className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                  <span className="font-display text-4xl font-extrabold text-primary-100">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-ink-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{v.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <CTA />
    </>
  );
}
