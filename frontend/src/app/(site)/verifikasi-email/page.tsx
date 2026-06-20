"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/brand-button";
import { AuthShell } from "@/components/patient/AuthShell";
import { patientApi, PatientApiError } from "@/lib/patient/api";

type State = "loading" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "" : "Tautan verifikasi tidak valid.",
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    patientApi
      .verifyEmail(token)
      .then(() => {
        if (active) setState("success");
      })
      .catch((err) => {
        if (!active) return;
        setState("error");
        setMessage(
          err instanceof PatientApiError ? err.message : "Verifikasi gagal.",
        );
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="text-sm text-ink-500">Memverifikasi email Anda…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <p className="text-sm leading-relaxed text-ink-600">
          Email Anda berhasil diverifikasi. Terima kasih!
        </p>
        <Button href="/akun" size="lg" className="w-full">
          Ke Akun Saya
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <XCircle className="h-7 w-7" />
      </span>
      <p className="text-sm leading-relaxed text-ink-600">{message}</p>
      <Button href="/akun" variant="outline" size="lg" className="w-full">
        Kembali ke Akun
      </Button>
    </div>
  );
}

export default function VerifikasiEmailPage() {
  return (
    <AuthShell
      eyebrow="Portal Pasien"
      title="Verifikasi Email"
      description="Konfirmasi alamat email Anda untuk mengamankan akun pasien."
      footer={
        <Link href="/masuk" className="font-semibold text-primary-700 hover:text-primary-800">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        }
      >
        <VerifyInner />
      </Suspense>
    </AuthShell>
  );
}
