import type { Metadata } from "next";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { DoctorCard } from "@/components/ui/DoctorCard";
import { CTA } from "@/components/sections/CTA";
import { doctors, specialties } from "@/lib/data";

export const metadata: Metadata = {
  title: "Dokter Kami",
  description:
    "Temui tim dokter umum dan spesialis berpengalaman di Klinik Sehat Nusantara yang siap mendampingi kesehatan Anda.",
};

export default function DokterPage() {
  return (
    <>
      <PageBanner
        crumb="Dokter Kami"
        eyebrow="Dokter Kami"
        title="Tim medis berpengalaman dan tepercaya"
        description="Dokter umum dan spesialis kami berkomitmen memberikan diagnosis akurat dan perawatan yang berpusat pada pasien."
      />

      <section className="pb-12">
        <Container>
          <div className="flex flex-wrap justify-center gap-2.5">
            {specialties.map((sp) => {
              const Icon = sp.icon;
              return (
                <span
                  key={sp.label}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-soft"
                >
                  <Icon className="h-4 w-4 text-primary-500" />
                  {sp.label}
                </span>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="pb-20 lg:pb-28">
        <Container>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <StaggerItem key={d.slug}>
                <DoctorCard doctor={d} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <CTA />
    </>
  );
}
