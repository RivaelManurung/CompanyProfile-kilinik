"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { PatientApiError } from "@/lib/patient/api";

function safeRedirect(value: string | null, fallback = "/akun"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

const inputClass =
  "h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15";

function RegisterForm() {
  const { register } = usePatientAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await register({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        phone: String(fd.get("phone")),
        password: String(fd.get("password")),
      });
      router.push(redirect);
    } catch (err) {
      setError(err instanceof PatientApiError ? err.message : "Gagal mendaftar.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-ink-700">Nama lengkap</label>
        <input id="name" name="name" required autoComplete="name" placeholder="Nama Anda" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-ink-700">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="email@contoh.com" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-semibold text-ink-700">Nomor WhatsApp / HP</label>
        <input id="phone" name="phone" required autoComplete="tel" placeholder="08xx xxxx xxxx" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-ink-700">Kata sandi</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter" className={inputClass} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
        {busy ? "Memproses…" : "Buat Akun"}
      </Button>
    </form>
  );
}

export default function DaftarPage() {
  return (
    <section className="flex min-h-[70vh] items-center py-20 lg:py-28">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card sm:p-10">
          <p className="text-sm font-semibold tracking-wide text-primary-700">Portal Pasien</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Buat akun pasien
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Daftar sekali, lalu pesan janji temu kapan pun dengan mudah.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-80" />}>
              <RegisterForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-semibold text-primary-700 hover:text-primary-800">
              Masuk di sini
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
