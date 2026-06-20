import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, MessageCircle, Camera } from "lucide-react";
import { PageBanner } from "@/components/ui/PageBanner";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/sections/ContactForm";
import { ClinicMap } from "@/components/sections/ClinicMap";
import { site } from "@/lib/site";
import { locations } from "@/lib/data";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi Klinik Sehat Nusantara — telepon, WhatsApp, email, atau kunjungi lokasi kami. Untuk membuat janji temu, gunakan portal janji temu.",
};

const contactItems = [
  { icon: MapPin, label: "Alamat", value: `${site.address.line1}, ${site.address.line2}`, href: `https://www.google.com/maps?q=${encodeURIComponent(`${site.address.line1}, ${site.address.line2}`)}` },
  { icon: Phone, label: "Telepon", value: site.phoneDisplay, href: `tel:${site.phone}` },
  { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
  { icon: Clock, label: "Jam Operasional", value: site.hours },
];

export default function KontakPage() {
  return (
    <>
      <PageBanner
        crumb="Kontak"
        eyebrow="Hubungi Kami"
        title="Ada pertanyaan? Kami siap membantu"
        description="Kirim pesan atau hubungi kami langsung. Untuk membuat janji temu, gunakan portal janji temu yang lebih cepat dan terjadwal."
      />

      <section className="pb-20 lg:pb-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            {/* Info column */}
            <div className="space-y-6">
              <Reveal>
                <div className="space-y-5">
                  {contactItems.map((c) => {
                    const Icon = c.icon;
                    const inner = (
                      <div className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition-colors hover:border-primary-200">
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{c.label}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{c.value}</p>
                        </div>
                      </div>
                    );
                    return c.href ? (
                      <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block">
                        {inner}
                      </a>
                    ) : (
                      <div key={c.label}>{inner}</div>
                    );
                  })}
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-primary-300 hover:text-primary-700"
                  >
                    <Camera className="h-4 w-4" /> Instagram
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <ClinicMap locations={locations.filter((l) => l.slug === "thamrin")} className="h-56" />
              </Reveal>
            </div>

            {/* Form column */}
            <Reveal direction="left">
              <ContactForm />
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
