"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/brand-button";
import { TextField, FormError } from "@/components/ui/Field";
import { AuthShell, AuthFormSkeleton } from "@/components/patient/AuthShell";
import { PasswordStrength } from "@/components/patient/PasswordStrength";
import { patientApi, PatientApiError } from "@/lib/patient/api";

/** Maps reset error codes to a friendly Indonesian message. */
function mapResetError(err: PatientApiError): string {
  switch (err.code) {
    case "INVALID_TOKEN":
      return "Tautan reset tidak valid. Silakan minta tautan baru.";
    case "TOKEN_EXPIRED":
      return "Tautan reset telah kedaluwarsa. Silakan minta tautan baru.";
    default:
      return err.message || "Gagal mengatur ulang kata sandi.";
  }
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | undefined>();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  const passwordHint = useMemo(
    () => (password ? undefined : "Minimal 8 karakter."),
    [password],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Tautan reset tidak valid. Silakan minta tautan baru.");
      return;
    }
    if (password.length < 8) {
      setPwError("Kata sandi minimal 8 karakter.");
      return;
    }
    setPwError(undefined);

    setBusy(true);
    try {
      await patientApi.resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof PatientApiError ? mapResetError(err) : "Gagal mengatur ulang kata sandi.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold tracking-tight text-ink-900">
          Kata sandi diperbarui
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Kata sandi Anda berhasil diatur ulang. Silakan masuk dengan kata sandi baru Anda.
        </p>
        <Button href="/masuk" size="lg" className="mt-6 w-full">
          Masuk sekarang
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <FormError>Tautan reset tidak valid atau tidak lengkap.</FormError>
        <Button href="/lupa-password" size="lg" className="w-full">
          Minta tautan baru
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <FormError>{error}</FormError>}
      <div>
        <TextField
          label="Kata sandi baru"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          hint={passwordHint}
          error={pwError}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPwError(undefined);
          }}
        />
        <PasswordStrength value={password} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
        {busy ? "Memproses…" : "Atur ulang kata sandi"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Portal Pasien"
      title="Atur ulang kata sandi"
      description="Buat kata sandi baru untuk akun pasien Anda."
      footer={
        <>
          Sudah ingat kata sandi Anda?{" "}
          <Link href="/masuk" className="font-semibold text-primary-700 hover:text-primary-800">
            Masuk di sini
          </Link>
        </>
      }
    >
      <Suspense fallback={<AuthFormSkeleton fields={1} />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
