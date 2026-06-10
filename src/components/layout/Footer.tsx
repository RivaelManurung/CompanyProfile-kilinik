import Link from "next/link";
import { Mail, Phone, MapPin, Camera, Clock, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { nav, site } from "@/lib/site";
import { services } from "@/lib/data";

export function Footer() {
  const year = 2026;
  return (
    <footer className="relative overflow-hidden bg-dark text-primary-100/80">
      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />

      <Container className="relative">
        {/* CTA band */}
        <div className="grid gap-6 border-b border-white/10 py-12 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Siap memulai perjalanan sehat Anda?
            </h2>
            <p className="mt-2 max-w-lg text-primary-100/70">
              Buat janji konsultasi atau hubungi tim kami. Kami siap membantu setiap langkah perawatan Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              href="/kontak"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-transform hover:-translate-y-0.5"
            >
              Buat Janji <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Logo light />
            <p className="max-w-xs text-sm leading-relaxed text-primary-100/70">
              {site.description}
            </p>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-100 hover:text-white"
            >
              <Camera className="h-4 w-4" /> {site.instagramHandle}
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Navigasi</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Layanan</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {services.slice(0, 5).map((s) => (
                <li key={s.slug}>
                  <Link href="/layanan" className="transition-colors hover:text-white">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Kontak</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                <span>
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-4 w-4 shrink-0 text-accent-400" />
                <a href={`tel:${site.phone}`} className="hover:text-white">
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="h-4 w-4 shrink-0 text-accent-400" />
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="h-4 w-4 shrink-0 text-accent-400" />
                <span>{site.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-primary-100/60 sm:flex-row">
          <p>© {year} PT Sehat Era Nusantara. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6">
            <Link href="/kisah-kami" className="hover:text-white">Kebijakan Privasi</Link>
            <Link href="/kisah-kami" className="hover:text-white">Syarat & Ketentuan</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
