import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarCheck, ShieldCheck, Stethoscope } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

const trustPoints = [
  {
    icon: CalendarCheck,
    title: "Janji temu dalam hitungan menit",
    desc: "Pilih layanan, dokter, dan jadwal — semua dari satu portal.",
  },
  {
    icon: Stethoscope,
    title: "Riwayat kunjungan tersimpan rapi",
    desc: "Pantau status janji temu pending, terkonfirmasi, hingga selesai.",
  },
  {
    icon: ShieldCheck,
    title: "Data pasien terlindungi",
    desc: "Akses aman dengan kontrol penuh atas janji temu Anda.",
  },
];

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Two-column patient auth layout: an art-directed forest-green brand panel on
 * the left (lg+) and the form card on the right. Shared by masuk & daftar.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <section className="py-12 lg:py-20">
      <Container className="max-w-5xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-card lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-dark px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div
          className="bg-grid absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_top_left,#000_20%,transparent_75%)]"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-600/30 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Link href="/" className="inline-flex">
            <Logo light />
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            Perawatan kesehatan keluarga, kini cukup dari satu portal.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-100/80">
            Masuk untuk mengelola janji temu Anda di SehatNusantara — cepat,
            jelas, dan terkendali.
          </p>

          <ul className="mt-9 space-y-5">
            {trustPoints.map(({ icon: Icon, title: t, desc }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent-300 ring-1 ring-inset ring-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold leading-tight">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-primary-100/70">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-primary-100/70">
          <ShieldCheck className="h-4 w-4 text-accent-300" />
          Klinik Pratama Rawat Jalan • Terakreditasi Paripurna Kemenkes
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-12">
        <div className="w-full max-w-sm">
          <p className="text-sm font-semibold tracking-wide text-primary-700">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {description}
          </p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>
        </div>
      </div>
        </div>
      </Container>
    </section>
  );
}

/** Skeleton matching the auth form shape — replaces blank Suspense fallbacks. */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-ink-100" />
          <div className="h-12 w-full rounded-xl bg-ink-100" />
        </div>
      ))}
      <div className="h-13 w-full rounded-full bg-ink-100" />
    </div>
  );
}
