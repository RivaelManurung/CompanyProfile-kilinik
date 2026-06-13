"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, X } from "lucide-react";
import { ApiError, authApi } from "@/lib/admin/api";
import type { AdminSession } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin/layout/sidebar";
import { AdminTopbar } from "@/components/admin/layout/topbar";
import { ErrorState } from "@/components/admin/error-state";

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((next) => { if (active) setSession(next); })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/admin/login");
          return;
        }
        setSessionError(err instanceof Error ? err.message : "Tidak bisa memuat sesi admin.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, retryCount]);

  const value = useMemo(() => session, [session]);

  function retrySession() {
    setSessionError(null);
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  if (loading) {
    return (
      <div className="grid min-h-screen bg-muted lg:grid-cols-[16rem_1fr]">
        <div className="hidden border-r border-border bg-background p-4 lg:block">
          <Skeleton className="h-8 w-36" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <main className="p-6 lg:p-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-8 w-56" />
          <Skeleton className="mt-1 h-4 w-80" />
          <Skeleton className="mt-8 h-80 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/60 px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardContent>
            <ErrorState
              title="Backend tidak tersedia"
              message={sessionError}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={retrySession}>
                    <RefreshCw className="size-4" />
                    Coba lagi
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/login?force=1&next=/admin">Ke login</Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!session) return null;

  return (
    <AdminSessionContext.Provider value={value}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-primary"
      >
        Loncat ke konten utama
      </a>
      <div className="min-h-screen bg-muted/60 text-foreground lg:grid lg:grid-cols-[16rem_1fr]">
        <div className="hidden lg:block">
          <div className="fixed top-0 left-0 z-20 h-full w-[16rem]">
            <AdminSidebar session={session} />
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-72 gap-0 border-0 bg-sidebar p-0 sm:max-w-72 lg:hidden"
          >
            <SheetTitle className="sr-only">Menu admin</SheetTitle>
            <div className="flex justify-end p-2">
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Tutup sidebar">
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </div>
            <AdminSidebar session={session} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-screen flex-col lg:col-start-2">
          <AdminTopbar session={session} onMenu={() => setMobileOpen(true)} />
          <main
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
            id="main-content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </AdminSessionContext.Provider>
  );
}
