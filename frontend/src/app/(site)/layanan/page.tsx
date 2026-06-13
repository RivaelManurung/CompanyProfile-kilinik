import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { CTA } from "@/components/sections/CTA";
import { PartnersMarquee } from "@/components/sections/PartnersMarquee";
import { ServiceIcon } from "@/lib/public/icons";
import { getServices } from "@/lib/public/api";

export const metadata: Metadata = {
  title: "Layanan Kami",
  description:
    "Layanan kesehatan lengkap di Klinik Sehat Nusantara: konsultasi, vaksinasi, farmasi, medical check-up, bedah minor, dan terapi tertarget.",
};

export default async function LayananPage() {
  const services = await getServices();
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
              return (
                <StaggerItem key={s.slug}>
                  <article
                    id={s.slug}
                    className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border border-ink-100 bg-white p-8 transition-all duration-500 hover:border-primary-200 hover:shadow-card sm:flex-row"
                  >
                    <div className="relative shrink-0">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 transition-colors duration-500 group-hover:bg-primary-600 group-hover:text-white group-hover:ring-primary-600">
                        <ServiceIcon name={s.icon} className="h-7 w-7" />
                      </span>
                    </div>
                    <div className="relative">
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-ink-300">
                        {String(i + 1).padStart(2, "0")}
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
