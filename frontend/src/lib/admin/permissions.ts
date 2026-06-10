import type { AdminSession } from "./types";

export const permissions = {
  dashboardRead: "dashboard:read",
  appointmentsRead: "appointments:read",
  appointmentsWrite: "appointments:write",
  appointmentsDelete: "appointments:delete",
  contentRead: "content:read",
  contentWrite: "content:write",
  contentDelete: "content:delete",
  clinicRead: "clinic:read",
  clinicWrite: "clinic:write",
  clinicDelete: "clinic:delete",
  systemRead: "system:read",
  systemWrite: "system:write",
  auditRead: "audit:read",
} as const;

export function can(session: AdminSession | null | undefined, permission: string) {
  return Boolean(session?.permissions?.includes(permission));
}

export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    clinic_admin: "Clinic Admin",
    receptionist: "Receptionist",
    content_editor: "Content Editor",
    viewer: "Viewer",
  };
  return labels[role] ?? role;
}
