"use client";

import { CrudManager, type Column, type Field, type FormState } from "@/components/admin/CrudManager";
import { useAdminSession } from "@/components/admin/AdminShell";
import { locationsApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import { locationSchema } from "@/lib/admin/schemas/location.schema";
import type { ClinicLocation } from "@/lib/admin/types";

const columns: Column<ClinicLocation>[] = [
  { header: "Nama", cell: (l) => <span className="font-medium text-foreground">{l.name}</span> },
  { header: "Area", cell: (l) => l.area },
  { header: "Telepon", cell: (l) => l.phone },
  { header: "Koordinat", cell: (l) => <code className="text-xs">{l.lat.toFixed(3)}, {l.lng.toFixed(3)}</code> },
];

const fields: Field[] = [
  { name: "name", label: "Nama Lokasi", placeholder: "Sehat Nusantara — Thamrin", full: true },
  { name: "area", label: "Area", placeholder: "Jakarta Pusat" },
  { name: "phone", label: "Telepon", placeholder: "+62 21 ..." },
  { name: "address", label: "Alamat", type: "textarea" },
  { name: "hours", label: "Jam Operasional", placeholder: "Senin–Sabtu, 08.00–20.00", full: true },
  { name: "lat", label: "Latitude", type: "number" },
  { name: "lng", label: "Longitude", type: "number" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama", full: true },
];

function toForm(l?: ClinicLocation): FormState {
  return {
    name: l?.name ?? "",
    area: l?.area ?? "",
    phone: l?.phone ?? "",
    address: l?.address ?? "",
    hours: l?.hours ?? "",
    lat: l?.lat ?? -6.2235,
    lng: l?.lng ?? 106.8205,
    slug: l?.slug ?? "",
  };
}

export default function LocationsPage() {
  const session = useAdminSession();
  return (
    <CrudManager<ClinicLocation>
      title="Lokasi"
      singular="Lokasi"
      api={locationsApi}
      columns={columns}
      fields={fields}
      schema={locationSchema}
      toForm={toForm}
      searchPlaceholder="Cari nama, area, alamat, atau slug..."
      defaultSort="name"
      canCreate={can(session, permissions.clinicWrite)}
      canEdit={can(session, permissions.clinicWrite)}
      canDelete={can(session, permissions.clinicDelete)}
    />
  );
}
