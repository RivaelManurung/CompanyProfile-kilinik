"use client";

import { CrudManager, type Column } from "@/components/admin/CrudManager";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminSession } from "@/components/admin/AdminShell";
import { locationsApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { ClinicLocation } from "@/lib/admin/types";

const columns: Column<ClinicLocation>[] = [
  { header: "Location", cell: (l) => <span className="font-medium text-foreground">{l.name}</span> },
  { header: "Area", cell: (l) => <span className="text-sm text-muted-foreground">{l.area}</span> },
  { header: "Telepon", cell: (l) => <span className="text-sm text-muted-foreground">{l.phone}</span> },
  { header: "Jam Operasional", cell: (l) => <span className="text-sm text-muted-foreground line-clamp-1">{l.hours}</span> },
  {
    header: "Status",
    cell: () => <StatusBadge status="active" />,
  },
];

export default function LocationsPage() {
  const session = useAdminSession();
  return (
    <CrudManager<ClinicLocation>
      title="Locations"
      singular="Location"
      api={locationsApi}
      columns={columns}
      searchPlaceholder="Cari nama, area, alamat, atau slug..."
      defaultSort="name"
      basePath="/admin/locations"
      eyebrow="Clinic Management"
      description="Manage clinic branches, addresses, contact information, and operating hours."
      canCreate={can(session, permissions.clinicWrite)}
      canEdit={can(session, permissions.clinicWrite)}
      canDelete={can(session, permissions.clinicDelete)}
    />
  );
}
