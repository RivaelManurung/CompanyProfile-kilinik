"use client";

import { CrudManager, type Column, type Field, type FormState } from "@/components/admin/CrudManager";
import { useAdminSession } from "@/components/admin/AdminShell";
import { servicesApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import { serviceSchema } from "@/lib/admin/schemas/service.schema";
import type { Service } from "@/lib/admin/types";

const columns: Column<Service>[] = [
  { header: "Layanan", cell: (s) => <span className="font-medium text-foreground">{s.title}</span> },
  { header: "Ringkasan", cell: (s) => <span className="line-clamp-1 text-muted-foreground">{s.short}</span> },
  { header: "Ikon", cell: (s) => <code className="text-xs">{s.icon}</code> },
  { header: "Urutan", cell: (s) => s.orderIndex },
];

const fields: Field[] = [
  { name: "title", label: "Nama Layanan", placeholder: "Konsultasi Primer" },
  { name: "icon", label: "Ikon (lucide)", placeholder: "Stethoscope" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama", full: true },
  { name: "short", label: "Ringkasan singkat", type: "textarea" },
  { name: "description", label: "Deskripsi", type: "textarea" },
  { name: "points", label: "Poin (pisahkan koma)", type: "tags", placeholder: "Poin 1, Poin 2, Poin 3", full: true },
  { name: "orderIndex", label: "Urutan", type: "number" },
];

function toForm(s?: Service): FormState {
  return {
    title: s?.title ?? "",
    icon: s?.icon ?? "Activity",
    slug: s?.slug ?? "",
    short: s?.short ?? "",
    description: s?.description ?? "",
    points: s?.points ?? [],
    orderIndex: s?.orderIndex ?? 0,
  };
}

export default function ServicesPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Service>
      title="Layanan"
      singular="Layanan"
      api={servicesApi}
      columns={columns}
      fields={fields}
      schema={serviceSchema}
      toForm={toForm}
      searchPlaceholder="Cari layanan, ringkasan, atau slug..."
      defaultSort="order_index"
      canCreate={can(session, permissions.clinicWrite)}
      canEdit={can(session, permissions.clinicWrite)}
      canDelete={can(session, permissions.clinicDelete)}
    />
  );
}
