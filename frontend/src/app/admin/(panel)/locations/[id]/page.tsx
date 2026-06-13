"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { locationsApi } from "@/lib/admin/api";
import { locationSchema } from "@/lib/admin/schemas/location.schema";

const fields: Field[] = [
  { name: "name", label: "Nama Lokasi", placeholder: "Sehat Nusantara — Thamrin", full: true, required: true },
  { name: "area", label: "Area", placeholder: "Jakarta Pusat" },
  { name: "phone", label: "Telepon", placeholder: "+62 21 ..." },
  { name: "slug", label: "Slug", placeholder: "otomatis dari nama", full: true, hint: "Kosongkan untuk dibuat otomatis." },
  { name: "address", label: "Alamat", type: "textarea", hint: "Alamat lengkap untuk peta dan arahan." },
  { name: "hours", label: "Jam Operasional", placeholder: "Senin–Sabtu, 08.00–20.00", full: true },
  { name: "lat", label: "Titik Peta", type: "map", lngName: "lng", full: true, hint: "Cari alamat, klik peta, atau geser pin." },
];

function toForm(d?: unknown): FormState {
  const data = d as Record<string, unknown> | undefined;
  return {
    name: (data?.name as string) ?? "",
    area: (data?.area as string) ?? "",
    phone: (data?.phone as string) ?? "",
    address: (data?.address as string) ?? "",
    hours: (data?.hours as string) ?? "",
    lat: (data?.lat as number) ?? -6.2235,
    lng: (data?.lng as number) ?? 106.8205,
    slug: (data?.slug as string) ?? "",
  };
}

export default function EditLocationPage() {
  return (
    <FormPage
      title="Lokasi"
      singular="Lokasi"
      api={locationsApi}
      fields={fields}
      schema={locationSchema}
      toForm={toForm}
      backUrl="/admin/locations"
    />
  );
}
