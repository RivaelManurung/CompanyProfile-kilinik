"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/brand-button";
import { TextField, FormError } from "@/components/ui/Field";
import { AuthShell, AuthFormSkeleton } from "@/components/patient/AuthShell";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";
import { PatientApiError } from "@/lib/patient/api";

function safeRedirect(value: string | null, fallback = "/akun"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

type FieldErrors = { email?: string; password?: string };

function LoginForm() {
  const { login } = usePatientAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(email: string, password: string): FieldErrors {
    const errors: FieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Masukkan alamat email yang valid.";
    if (password.length < 1) errors.password = "Kata sandi wajib diisi.";
    return errors;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof PatientApiError ? err.message : "Gagal masuk.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <FormError>{error}</FormError>}
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="email@contoh.com"
        error={fieldErrors.email}
        onChange={() => setFieldErrors((p) => ({ ...p, email: undefined }))}
      />
      <div>
        <TextField
          label="Kata sandi"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          error={fieldErrors.password}
          onChange={() => setFieldErrors((p) => ({ ...p, password: undefined }))}
        />
        <div className="mt-2 text-right">
          <Link
            href="/lupa-password"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            Lupa kata sandi?
          </Link>
        </div>
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
    <AuthShell
      eyebrow="Portal Pasien"
      title="Masuk ke akun Anda"
      description="Masuk untuk membuat janji temu dan melihat riwayat kunjungan Anda."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-primary-700 hover:text-primary-800">
            Daftar di sini
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
