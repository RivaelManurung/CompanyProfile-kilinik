"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, ApiError } from "@/lib/admin/api";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginView />
    </Suspense>
  );
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/admin") || value === "/admin/login") {
    return "/admin";
  }
  return value;
}

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.login(email, password);
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-muted/30 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden border-r border-border bg-background p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-foreground">SehatNusantara</p>
            <p className="text-xs text-muted-foreground">Clinic Operations</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-foreground">
            Masuk untuk mengelola operasional klinik.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Akses ini digunakan untuk janji temu, konten kesehatan, lokasi klinik, layanan, dan audit aktivitas admin.
          </p>
          <div className="mt-8 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Sesi divalidasi melalui backend dan cookie httpOnly.
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 PT Sehat Era Nusantara</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-foreground">SehatNusantara</p>
              <p className="text-xs text-muted-foreground">Clinic Operations</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Masuk ke dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">Gunakan akun admin yang sudah diberikan oleh pengelola sistem.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email admin</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nama@sehatnusantara.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
