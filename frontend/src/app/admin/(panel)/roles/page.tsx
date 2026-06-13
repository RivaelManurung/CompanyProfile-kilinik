"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, Users, Loader2, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/admin/error-state";
import { PageSkeleton } from "@/components/admin/loading-state";
import { useAdminSession } from "@/components/admin/AdminShell";
import { can } from "@/lib/admin/permissions";
import { rolesApi, ApiError } from "@/lib/admin/api";
import type { RolesResponse } from "@/lib/admin/types";

function permissionLabel(p: string) {
  const [mod, action] = p.split(":");
  const modules: Record<string, string> = {
    dashboard: "Dashboard", appointments: "Janji Temu", content: "Konten",
    clinic: "Klinik", system: "Sistem", audit: "Audit Log",
  };
  const actions: Record<string, string> = { read: "Lihat", write: "Ubah", delete: "Hapus" };
  return `${modules[mod] ?? mod} · ${actions[action] ?? action}`;
}

/** draft[roleKey] = Set of granted permissions. */
type Draft = Record<string, Set<string>>;

function toDraft(data: RolesResponse): Draft {
  const d: Draft = {};
  for (const r of data.roles) d[r.key] = new Set(r.permissions);
  return d;
}

export default function RolesPage() {
  const session = useAdminSession();
  const canEdit = can(session, "system:write");

  const [data, setData] = useState<RolesResponse | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    rolesApi.list()
      .then((d) => {
        if (!active) return;
        setData(d);
        setDraft(toDraft(d));
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Gagal memuat data");
        setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  const dirty = useMemo(() => {
    if (!data) return {} as Record<string, boolean>;
    const out: Record<string, boolean> = {};
    for (const r of data.roles) {
      const original = new Set(r.permissions);
      const current = draft[r.key] ?? new Set<string>();
      out[r.key] = original.size !== current.size || [...current].some((p) => !original.has(p));
    }
    return out;
  }, [data, draft]);

  function toggle(roleKey: string, perm: string) {
    setDraft((prev) => {
      const next = { ...prev };
      const set = new Set(next[roleKey]);
      if (set.has(perm)) set.delete(perm);
      else set.add(perm);
      next[roleKey] = set;
      return next;
    });
  }

  async function saveRole(roleKey: string) {
    setSavingRole(roleKey);
    try {
      const updated = await rolesApi.updatePermissions(roleKey, [...(draft[roleKey] ?? [])]);
      setData(updated);
      setDraft(toDraft(updated));
      toast.success("Izin peran diperbarui");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menyimpan izin");
    } finally {
      setSavingRole(null);
    }
  }

  if (loading) return <PageSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="System" title="Roles & Permissions" description="Kontrol akses modul dan batasan operasional." />
        <ErrorState message={error ?? "Data tidak tersedia"} action={<Button onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}>Coba lagi</Button>} />
      </div>
    );
  }

  const { roles, allPermissions } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Roles & Permissions"
        description={
          canEdit
            ? "Centang untuk memberi atau mencabut izin per peran, lalu simpan. Super Admin selalu punya akses penuh."
            : "Matriks hak akses tiap peran. Hanya Super Admin yang dapat mengubahnya."
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const count = (draft[role.key] ?? new Set()).size;
          const editable = role.editable && canEdit;
          return (
            <Card key={role.key} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      {role.label}
                      {!role.editable && <Lock className="size-3 text-muted-foreground" aria-label="Tidak dapat diubah" />}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" /> {role.userCount} pengguna
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{role.editable ? count : allPermissions.length} izin</Badge>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{role.description}</p>
              {editable && dirty[role.key] && (
                <Button size="sm" className="mt-3 w-full" onClick={() => saveRole(role.key)} disabled={savingRole === role.key}>
                  {savingRole === role.key ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Simpan perubahan
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Matriks Izin</h2>
          <p className="text-xs text-muted-foreground">Hak akses tiap peran per kapabilitas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Izin
                </th>
                {roles.map((role) => (
                  <th key={role.key} scope="col" className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    <span className="flex items-center justify-center gap-1">
                      {role.label}
                      {!role.editable && <Lock className="size-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {allPermissions.map((perm) => (
                <tr key={perm} className="transition-colors hover:bg-muted/20">
                  <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-medium text-foreground">
                    {permissionLabel(perm)}
                  </th>
                  {roles.map((role) => {
                    const editable = role.editable && canEdit;
                    const checked = role.editable ? (draft[role.key]?.has(perm) ?? false) : true;
                    return (
                      <td key={role.key} className="px-3 py-2.5 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={checked}
                            disabled={!editable}
                            onCheckedChange={() => toggle(role.key, perm)}
                            aria-label={`${role.label} — ${permissionLabel(perm)}`}
                          />
                        </div>
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
