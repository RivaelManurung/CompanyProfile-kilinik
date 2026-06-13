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

function toForm(): FormState {
  return { name: "", area: "", phone: "", address: "", hours: "", lat: -6.2235, lng: 106.8205, slug: "" };
}

export default function NewLocationPage() {
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
