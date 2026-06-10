import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { CTA } from "@/components/sections/CTA";
import { PartnersMarquee } from "@/components/sections/PartnersMarquee";
import { services } from "@/lib/data";

export const metadata: Metadata = {
  title: "Layanan Kami",
  description:
    "Layanan kesehatan lengkap di Klinik Sehat Nusantara: konsultasi, vaksinasi, farmasi, medical check-up, bedah minor, dan terapi tertarget.",
};

export default function LayananPage() {
  return (
    <>
      <PageBanner
        crumb="Layanan Kami"
        eyebrow="Layanan Kami"
        title="Layanan kesehatan menyeluruh untuk setiap kebutuhan"
        description="Dari pencegahan hingga pemulihan, kami menyediakan rangkaian layanan terpadu dengan standar klinis berstandar global."
      />

      <section className="pb-20 lg:pb-28">
        <Container>
          <Stagger className="grid gap-6 lg:grid-cols-2">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <StaggerItem key={s.slug}>
                  <article
                    id={s.slug}
                    className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 shadow-soft transition-all duration-500 hover:border-primary-200 hover:shadow-lift sm:flex-row"
                  >
                    <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative shrink-0">
                      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft transition-transform duration-500 group-hover:scale-110">
                        <Icon className="h-8 w-8" />
                      </span>
                    </div>
                    <div className="relative">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                        0{i + 1}
                      </span>
                      <h2 className="mt-1 text-xl font-bold text-ink-900">{s.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.description}</p>
                      <ul className="mt-4 space-y-2">
                        {s.points.map((p) => (
                          <li key={p} className="flex items-center gap-2 text-sm text-ink-700">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                              <Check className="h-3 w-3" />
                            </span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Container>
      </section>

      <PartnersMarquee />
      <CTA />
    </>
  );
}
