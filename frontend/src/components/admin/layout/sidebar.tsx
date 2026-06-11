"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";
import { adminNavGroups } from "@/lib/admin/nav";
import { can } from "@/lib/admin/permissions";
import type { AdminSession } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

interface Props {
  session: AdminSession;
  onNavigate?: () => void;
}

export function AdminSidebar({ session, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-sidebar">
      <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary shadow-sm">
          <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground">SehatNusantara</p>
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[10px] text-sidebar-foreground/50">Clinic Operations</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {adminNavGroups.map((group) => {
            const visible = group.items.filter((item) => can(session, item.permission));
            if (visible.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                        )}
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/45")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 px-3 py-2.5 transition-colors hover:bg-sidebar-accent/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground shadow-sm">
            {session.admin.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{session.admin.name}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/45">{session.admin.email}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/35" />
        </div>
      </div>
    </aside>
  );
}
