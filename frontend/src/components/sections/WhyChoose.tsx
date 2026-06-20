import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/brand-button";
import { advantages, specialties } from "@/lib/data";

const careSteps = [
  {
    step: "01",
    title: "Konsultasi awal",
    desc: "Pasien menjelaskan keluhan, riwayat kesehatan, dan kebutuhan perawatan.",
  },
  {
    step: "02",
    title: "Pemeriksaan terarah",
    desc: "Dokter menentukan pemeriksaan yang relevan tanpa membuat proses terasa rumit.",
  },
  {
    step: "03",
    title: "Tindak lanjut jelas",
    desc: "Pasien mendapat arahan perawatan, kontrol, atau rujukan sesuai kondisi.",
  },
];

export function WhyChoose() {
  const visibleSpecialties = specialties.slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Left UX panel */}
        <Reveal direction="right" className="order-2 lg:order-1">
          <aside className="rounded-[1.75rem] border border-primary-100 bg-white p-5 shadow-card sm:p-6">
            <div className="rounded-[1.25rem] border border-primary-100/80 bg-primary-50/40 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-700">
                Alur Perawatan
              </p>

              <h3 className="mt-3 max-w-sm text-2xl font-bold leading-tight tracking-tight text-ink-900">
                Dibuat sederhana agar pasien tahu harus mulai dari mana.
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-ink-500">
                Fokus kami bukan membuat layanan terlihat ramai, tapi membantu
                pasien memahami proses perawatan dengan jelas.
              </p>
            </div>

            <div className="mt-5 divide-y divide-primary-100 rounded-[1.25rem] border border-primary-100">
              {careSteps.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 p-5 sm:grid-cols-[48px_1fr]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-100">
                    {item.step}
                  </span>

                  <div>
                    <h4 className="font-bold text-ink-900">{item.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-ink-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-primary-100 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    Layanan yang tersedia
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Pilih layanan sesuai kebutuhan pemeriksaan.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 ring-1 ring-accent-100">
                  Terakreditasi
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {visibleSpecialties.map((sp) => (
                  <span
                    key={sp.label}
                    className="rounded-full border border-primary-100 bg-primary-50/50 px-3 py-1.5 text-xs font-medium text-ink-700"
                  >
                    {sp.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-primary-100 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                  Jam layanan
                </p>
                <p className="mt-2 text-sm font-bold text-ink-900">
                  Senin–Minggu
                </p>
                <p className="mt-1 text-sm text-ink-500">07.00–20.00</p>
              </div>

              <div className="rounded-[1.25rem] border border-primary-100 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                  Fokus layanan
                </p>
                <p className="mt-2 text-sm font-bold text-ink-900">
                  Keluarga & pasien umum
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Konsultasi sampai kontrol.
                </p>
              </div>
            </div>
          </aside>
        </Reveal>

        {/* Right copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <Eyebrow>Alasan pasien memilih kami</Eyebrow>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Perawatan kesehatan yang terasa dekat, aman, dan terarah.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-base leading-8 text-ink-500 sm:text-lg">
              Kami membantu pasien mendapatkan layanan klinis yang jelas dan
              nyaman — mulai dari konsultasi, pemeriksaan, hingga tindak lanjut
              perawatan.
            </p>
          </Reveal>

          <Stagger className="mt-9 divide-y divide-primary-100/80 border-y border-primary-100/80">
            {advantages.slice(0, 4).map((advantage) => {
              const Icon = advantage.icon;

              return (
                <StaggerItem
                  key={advantage.title}
                  className="group grid gap-4 py-5 sm:grid-cols-[44px_1fr]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 transition duration-300 group-hover:bg-primary-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:gap-6">
                    <h3 className="font-bold text-ink-900">
                      {advantage.title}
                    </h3>

                    <p className="text-sm leading-6 text-ink-500">
                      {advantage.desc}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>

          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href="/kisah-kami" size="lg">
                Kenali Kami Lebih Dekat
              </Button>

              <p className="flex items-center gap-2 text-sm font-medium text-ink-600">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-500" />
                10+ tahun pengalaman melayani pasien keluarga
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}