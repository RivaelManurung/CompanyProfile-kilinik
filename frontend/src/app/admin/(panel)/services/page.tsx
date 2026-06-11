"use client";

import { CrudManager, type Column } from "@/components/admin/CrudManager";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminSession } from "@/components/admin/AdminShell";
import { servicesApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Service } from "@/lib/admin/types";

const columns: Column<Service>[] = [
  { header: "Service", cell: (s) => <span className="font-medium text-foreground">{s.title}</span> },
  { header: "Ringkasan", cell: (s) => <span className="line-clamp-1 text-sm text-muted-foreground">{s.short}</span> },
  { header: "Ikon", cell: (s) => <code className="text-xs text-muted-foreground">{s.icon}</code> },
  { header: "Urutan", cell: (s) => <span className="text-sm text-muted-foreground">{s.orderIndex}</span> },
  {
    header: "Status",
    cell: () => <StatusBadge status="active" />,
  },
];

export default function ServicesPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Service>
      title="Services"
      singular="Service"
      api={servicesApi}
      columns={columns}
      searchPlaceholder="Cari layanan, ringkasan, atau slug..."
      defaultSort="order_index"
      basePath="/admin/services"
      eyebrow="Clinic Management"
      description="Manage medical services, pricing, duration, and public availability."
      canCreate={can(session, permissions.clinicWrite)}
      canEdit={can(session, permissions.clinicWrite)}
      canDelete={can(session, permissions.clinicDelete)}
    />
  );
}
