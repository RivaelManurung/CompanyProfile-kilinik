"use client";

import { CrudManager, type Column } from "@/components/admin/CrudManager";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminSession } from "@/components/admin/AdminShell";
import { usersApi } from "@/lib/admin/api";
import { can, permissions, roleLabel } from "@/lib/admin/permissions";
import type { Admin } from "@/lib/admin/types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function fmtLogin(iso?: string | null) {
  if (!iso) return "Belum pernah";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const columns: Column<Admin>[] = [
  {
    header: "User",
    cell: (u) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials(u.name)}
        </div>
        <div>
          <p className="font-medium text-foreground">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    header: "Role",
    cell: (u) => <StatusBadge status={u.role === "super_admin" ? "info" : "active"} label={roleLabel(u.role)} />,
  },
  {
    header: "Status",
    cell: (u) => <StatusBadge status={u.active ? "active" : "inactive"} label={u.active ? "Aktif" : "Nonaktif"} />,
  },
  {
    header: "Last Login",
    cell: (u) => <span className="text-sm text-muted-foreground">{fmtLogin(u.lastLoginAt)}</span>,
  },
];

export default function AdminUsersPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Admin>
      title="Admin Users"
      singular="Pengguna"
      api={usersApi}
      columns={columns}
      searchPlaceholder="Cari nama atau email..."
      defaultSort="created_at"
      basePath="/admin/users"
      eyebrow="System"
      description="Kelola akun internal, penetapan peran, status akun, dan cakupan akses."
      filters={[
        { value: "", label: "Semua" },
        { value: "active", label: "Aktif" },
        { value: "inactive", label: "Nonaktif" },
        { value: "super_admin", label: "Super Admin" },
        { value: "clinic_admin", label: "Clinic Admin" },
        { value: "receptionist", label: "Receptionist" },
        { value: "content_editor", label: "Content Editor" },
        { value: "viewer", label: "Viewer" },
      ]}
      canCreate={can(session, permissions.systemWrite)}
      canEdit={can(session, permissions.systemWrite)}
      canDelete={can(session, permissions.systemWrite)}
    />
  );
}
