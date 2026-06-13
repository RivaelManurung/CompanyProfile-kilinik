"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { PatientApiError } from "@/lib/patient/api";

const inputClass =
  "h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15";

function LoginForm() {
  const { login } = usePatientAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/akun";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await login(String(fd.get("email")), String(fd.get("password")));
      router.push(redirect);
    } catch (err) {
      setError(err instanceof PatientApiError ? err.message : "Gagal masuk.");
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
        <label htmlFor="email" className="text-sm font-semibold text-ink-700">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="email@contoh.com" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-ink-700">
          Kata sandi
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
        {busy ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}

export default function MasukPage() {
  return (
    <section className="flex min-h-[70vh] items-center py-20 lg:py-28">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card sm:p-10">
          <p className="text-sm font-semibold tracking-wide text-primary-700">
            Portal Pasien
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Masuk ke akun Anda
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Masuk untuk membuat janji temu dan melihat riwayat kunjungan Anda.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500">
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-semibold text-primary-700 hover:text-primary-800">
              Daftar di sini
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
