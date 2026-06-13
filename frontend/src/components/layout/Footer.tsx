import Link from "next/link";
import { Mail, Phone, MapPin, Camera, Clock } from "lucide-react";
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
        {/* Link columns */}
        <div className="grid gap-10 pt-16 pb-14 sm:grid-cols-2 lg:grid-cols-4">
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
