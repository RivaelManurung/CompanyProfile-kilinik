import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { advantages, specialties } from "@/lib/data";

export function WhyChoose() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        {/* Left visual */}
        <Reveal direction="right" className="relative order-2 lg:order-1">
          <div className="relative rounded-[2rem] bg-gradient-to-br from-primary-50 to-accent-50 p-8 ring-1 ring-primary-100">
            <div className="grid grid-cols-2 gap-4">
              {specialties.map((sp, i) => {
                const Icon = sp.icon;
                return (
                  <div
                    key={sp.label}
                    className={`flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-soft ${
                      i % 2 === 1 ? "translate-y-5" : ""
                    }`}
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold text-ink-800">{sp.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="animate-float absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-dark px-5 py-3.5 shadow-lift">
              <span className="flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="h-2 w-2 rounded-full bg-accent-400" />
              </span>
              <span className="text-sm font-semibold text-white">Terakreditasi Nasional</span>
            </div>
          </div>
        </Reveal>

        {/* Right copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <Eyebrow>Mengapa Sehat Nusantara</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-3xl font-bold leading-[1.1] text-ink-900 sm:text-4xl">
              Standar layanan global, sentuhan yang manusiawi
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg leading-relaxed text-ink-500">
              Kami memadukan protokol klinis berstandar internasional dengan pelayanan yang hangat
              dan personal — agar setiap kunjungan terasa nyaman dan terpercaya.
            </p>
          </Reveal>

          <Stagger className="mt-8 grid gap-5 sm:grid-cols-2">
            {advantages.map((a) => {
              const Icon = a.icon;
              return (
                <StaggerItem key={a.title} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink-900">{a.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{a.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>

          <Reveal delay={0.2}>
            <div className="mt-9 flex items-center gap-4">
              <Button href="/kisah-kami" size="lg">Kenali Kami Lebih Dekat</Button>
              <span className="flex items-center gap-2 text-sm font-medium text-ink-600">
                <CheckCircle2 className="h-5 w-5 text-accent-500" />
                10+ tahun pengalaman
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
