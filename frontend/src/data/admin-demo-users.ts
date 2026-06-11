export interface DemoAdminUser {
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  lastLogin: string;
  createdAt: string;
}

export const demoAdminUsers: DemoAdminUser[] = [
  { name: "Rina Wijaya", email: "rina@kilinik.com", role: "super_admin", status: "active", lastLogin: "2026-06-10T08:30:00Z", createdAt: "2025-01-15T00:00:00Z" },
  { name: "Budi Santoso", email: "budi@kilinik.com", role: "clinic_admin", status: "active", lastLogin: "2026-06-09T14:22:00Z", createdAt: "2025-03-01T00:00:00Z" },
  { name: "Sari Dewi", email: "sari@kilinik.com", role: "receptionist", status: "active", lastLogin: "2026-06-10T07:45:00Z", createdAt: "2025-04-10T00:00:00Z" },
  { name: "Andi Pratama", email: "andi@kilinik.com", role: "receptionist", status: "suspended", lastLogin: "2026-05-20T16:10:00Z", createdAt: "2025-04-12T00:00:00Z" },
  { name: "Dian Permata", email: "dian@kilinik.com", role: "content_editor", status: "active", lastLogin: "2026-06-08T11:05:00Z", createdAt: "2025-06-01T00:00:00Z" },
  { name: "Eko Prasetyo", email: "eko@kilinik.com", role: "viewer", status: "active", lastLogin: "2026-06-07T09:30:00Z", createdAt: "2025-08-20T00:00:00Z" },
  { name: "Fitri Handayani", email: "fitri@kilinik.com", role: "content_editor", status: "suspended", lastLogin: "2026-04-15T10:00:00Z", createdAt: "2025-09-05T00:00:00Z" },
  { name: "Gilang Ramadhan", email: "gilang@kilinik.com", role: "viewer", status: "active", lastLogin: "2026-06-10T06:15:00Z", createdAt: "2025-11-12T00:00:00Z" },
];

export const demoAdminRoles = [
  { name: "super_admin", description: "Full system access. All modules, all operations.", users: 2, isSystem: true, modules: ["all"] },
  { name: "clinic_admin", description: "Operational management. Appointments, doctors, services, promotions.", users: 3, isSystem: true, modules: ["appointments", "doctors", "services", "promotions", "dashboard"] },
  { name: "receptionist", description: "Front desk operations. Manage appointments and patient queue.", users: 5, isSystem: true, modules: ["appointments", "dashboard"] },
  { name: "content_editor", description: "Manage articles, promotions, and public-facing content.", users: 2, isSystem: false, modules: ["articles", "promotions", "dashboard"] },
  { name: "viewer", description: "Read-only access to operational data and reports.", users: 4, isSystem: true, modules: ["dashboard", "appointments", "audit-logs"] },
];
