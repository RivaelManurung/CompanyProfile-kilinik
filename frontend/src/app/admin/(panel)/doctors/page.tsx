"use client";

import { CrudManager, type Column } from "@/components/admin/CrudManager";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminSession } from "@/components/admin/AdminShell";
import { doctorsApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import type { Doctor } from "@/lib/admin/types";

const columns: Column<Doctor>[] = [
  {
    header: "Dokter",
    cell: (d) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {d.name?.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-foreground">{d.name}</p>
          <p className="text-xs text-muted-foreground">{d.specialty}</p>
        </div>
      </div>
    ),
  },
  { header: "Pengalaman", cell: (d) => <span className="text-sm text-muted-foreground">{d.experience}</span> },
  { header: "Urutan", cell: (d) => <span className="text-sm text-muted-foreground">{d.orderIndex}</span> },
  {
    header: "Status",
    cell: (d) => <StatusBadge status={d.active ? "active" : "inactive"} />,
  },
];

export default function DoctorsPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Doctor>
      title="Doctors"
      singular="Doctor"
      api={doctorsApi}
      columns={columns}
      searchPlaceholder="Cari nama, spesialisasi, atau slug..."
      defaultSort="order_index"
      basePath="/admin/doctors"
      eyebrow="Clinic Management"
      description="Manage doctor profiles, specializations, public visibility, and display order."
      filters={[
        { value: "", label: "All" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]}
      canCreate={can(session, permissions.clinicWrite)}
      canEdit={can(session, permissions.clinicWrite)}
      canDelete={can(session, permissions.clinicDelete)}
    />
  );
}
