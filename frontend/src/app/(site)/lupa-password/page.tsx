"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/brand-button";
import { TextField, FormError } from "@/components/ui/Field";
import { AuthShell } from "@/components/patient/AuthShell";
import { patientApi, PatientApiError } from "@/lib/patient/api";

function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Masukkan alamat email yang valid.");
      return;
    }
    setEmailError(undefined);

    setBusy(true);
    try {
      // Backend always responds 200 (no account enumeration).
      await patientApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof PatientApiError ? err.message : "Gagal mengirim permintaan.");
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <MailCheck className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold tracking-tight text-ink-900">
          Periksa email Anda
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Jika email terdaftar, tautan untuk mengatur ulang kata sandi telah dikirim.
          Periksa juga folder spam Anda.
        </p>
        <Button href="/masuk" size="lg" className="mt-6 w-full">
          Kembali ke halaman masuk
        </Button>
      </div>
    );
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
        error={emailError}
        onChange={() => setEmailError(undefined)}
      />
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {busy ? "Mengirim…" : "Kirim tautan reset"}
      </Button>
    </form>
  );
}

export default function LupaPasswordPage() {
  return (
    <AuthShell
      eyebrow="Portal Pasien"
      title="Lupa kata sandi?"
      description="Masukkan email akun Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
      footer={
        <>
          Ingat kata sandi Anda?{" "}
          <Link href="/masuk" className="font-semibold text-primary-700 hover:text-primary-800">
            Masuk di sini
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
