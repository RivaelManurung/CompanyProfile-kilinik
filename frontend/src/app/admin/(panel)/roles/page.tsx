"use client";

import { useEffect, useState } from "react";
import { Shield, Check, Minus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/admin/error-state";
import { PageSkeleton } from "@/components/admin/loading-state";
import { rolesApi, ApiError } from "@/lib/admin/api";
import type { RolesResponse } from "@/lib/admin/types";

function permissionLabel(p: string) {
  const [mod, action] = p.split(":");
  const modules: Record<string, string> = {
    dashboard: "Dashboard",
    appointments: "Janji Temu",
    content: "Konten",
    clinic: "Klinik",
    system: "Sistem",
    audit: "Audit Log",
  };
  const actions: Record<string, string> = {
    read: "Lihat",
    write: "Ubah",
    delete: "Hapus",
  };
  return `${modules[mod] ?? mod} · ${actions[action] ?? action}`;
}

export default function RolesPage() {
  const [data, setData] = useState<RolesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    rolesApi
      .list()
      .then((d) => {
        if (active) {
          setData(d);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat data");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  if (loading) return <PageSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="System" title="Roles & Permissions" description="Kontrol akses modul dan batasan operasional." />
        <ErrorState message={error ?? "Data tidak tersedia"} action={<Button onClick={retry}>Coba lagi</Button>} />
      </div>
    );
  }

  const { roles, allPermissions } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Roles & Permissions"
        description="Peran ditetapkan pada level sistem (RBAC). Matriks di bawah menampilkan hak akses tiap peran secara langsung dari backend."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{role.label}</h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {role.userCount} pengguna
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {role.permissions.length} izin
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{role.description}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Matriks Izin</h2>
          <p className="text-xs text-muted-foreground">Hak akses tiap peran per kapabilitas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Izin
                </th>
                {roles.map((role) => (
                  <th key={role.key} scope="col" className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allPermissions.map((perm) => (
                <tr key={perm} className="transition-colors hover:bg-muted/20">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-foreground">
                    {permissionLabel(perm)}
                  </th>
                  {roles.map((role) => {
                    const has = role.permissions.includes(perm);
                    return (
                      <td key={role.key} className="px-3 py-2.5 text-center">
                        {has ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Diizinkan" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/30" aria-label="Tidak diizinkan" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
