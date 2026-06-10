"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut, Menu, X } from "lucide-react";
import { authApi } from "@/lib/admin/api";
import { adminNavGroups, flatAdminNav } from "@/lib/admin/nav";
import { can, roleLabel } from "@/lib/admin/permissions";
import type { AdminSession } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession() {
  return useContext(AdminSessionContext);
}

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function AdminSidebar({
  session,
  onNavigate,
}: {
  session: AdminSession;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">SehatNusantara</p>
          <p className="truncate text-xs text-muted-foreground">Clinic Operations</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <div className="space-y-5">
          {adminNavGroups.map((group) => {
            const items = group.items.filter((item) => can(session, item.permission));
            if (!items.length) return null;
            return (
              <div key={group.label}>
                <p className="px-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {items.map((item) => {
                    const active = isActive(pathname, item.href, item.exact);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

function AdminTopbar({
  session,
  onMenu,
}: {
  session: AdminSession;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const current = flatAdminNav().find((item) => isActive(pathname, item.href, item.exact));
  const title = current?.label ?? "Admin";

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open sidebar">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Admin / {title}</p>
          <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold">
              {session.admin.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-none">{session.admin.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{roleLabel(session.admin.role)}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <span className="block">{session.admin.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{session.admin.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((next) => {
        if (active) setSession(next);
      })
      .catch(() => {
        router.replace("/admin/login");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const value = useMemo(() => session, [session]);

  if (loading) {
    return (
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <div className="hidden border-r border-border bg-background p-4 lg:block">
          <Skeleton className="h-10 w-44" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <main className="p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-8 h-80 w-full" />
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <AdminSessionContext.Provider value={value}>
      <div className="min-h-screen bg-muted/30 text-foreground lg:grid lg:grid-cols-[17rem_1fr]">
        <div className="hidden lg:block">
          <AdminSidebar session={session} />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close sidebar overlay"
              className="absolute inset-0 bg-black/35"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 bg-background shadow-xl">
              <div className="absolute right-3 top-3 z-10">
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <AdminSidebar session={session} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="min-w-0">
          <AdminTopbar session={session} onMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </AdminSessionContext.Provider>
  );
}
