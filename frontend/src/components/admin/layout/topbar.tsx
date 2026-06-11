"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, Bell, Menu, Search, Settings, User } from "lucide-react";
import { authApi } from "@/lib/admin/api";
import { flatAdminNav } from "@/lib/admin/nav";
import { roleLabel } from "@/lib/admin/permissions";
import type { AdminSession } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

interface Props {
  session: AdminSession;
  onMenu: () => void;
}

export function AdminTopbar({ session, onMenu }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const current = flatAdminNav().find((item) => isActive(pathname, item.href, item.exact));

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Buka menu navigasi">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground/60">
            <span className="hidden sm:inline">Admin / </span>
            {current?.label ?? "Dashboard"}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {current?.label ?? "Dashboard"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Cari pasien, dokter, appointment..."
            className="h-9 w-56 border-muted/50 bg-muted/30 pl-9 text-sm placeholder:text-muted-foreground/45 focus-visible:w-72 transition-all"
          />
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/60 hover:text-foreground" aria-label="Notifikasi">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2.5 px-2 aria-expanded:bg-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                {session.admin.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-xs font-semibold leading-tight text-foreground">{session.admin.name}</span>
                <span className="block text-[10px] leading-tight text-muted-foreground/60">{roleLabel(session.admin.role)}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-semibold text-foreground">{session.admin.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{session.admin.email}</span>
              <span className="mt-1 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {roleLabel(session.admin.role)}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
