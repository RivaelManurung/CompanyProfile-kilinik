"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { locationsApi } from "@/lib/admin/api";
import { locationSchema } from "@/lib/admin/schemas/location.schema";

const sections = [
  { key: "basic", label: "Informasi Dasar", description: "Nama dan identitas lokasi." },
  { key: "details", label: "Detail Lokasi", description: "Informasi kontak dan alamat." },
  { key: "coordinates", label: "Koordinat", description: "Titik peta untuk Google Maps embedding." },
];

const fields: Field[] = [
  { name: "name", label: "Nama Lokasi", placeholder: "Sehat Nusantara — Thamrin", full: true, section: "basic" },
  { name: "area", label: "Area", placeholder: "Jakarta Pusat", section: "basic" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama", full: true, section: "basic" },
  { name: "phone", label: "Telepon", placeholder: "+62 21 ...", section: "details" },
  { name: "address", label: "Alamat", type: "textarea", hint: "Alamat lengkap untuk peta dan arahan.", section: "details" },
  { name: "hours", label: "Jam Operasional", placeholder: "Senin–Sabtu, 08.00–20.00", full: true, hint: "Format bebas, ditampilkan di halaman lokasi.", section: "details" },
  { name: "lat", label: "Latitude", type: "number", section: "coordinates" },
  { name: "lng", label: "Longitude", type: "number", section: "coordinates" },
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
      sections={sections}
    />
  );
}
