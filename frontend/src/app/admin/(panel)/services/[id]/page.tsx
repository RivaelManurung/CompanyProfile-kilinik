"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { servicesApi } from "@/lib/admin/api";
import { serviceSchema } from "@/lib/admin/schemas/service.schema";

const sections = [
  { key: "basic", label: "Informasi Dasar", description: "Judul, ikon, dan slug layanan." },
  { key: "content", label: "Konten", description: "Ringkasan, deskripsi, dan poin layanan." },
  { key: "display", label: "Tampilan", description: "Urutan tampil di situs publik." },
];

const fields: Field[] = [
  { name: "title", label: "Nama Layanan", placeholder: "Konsultasi Primer", section: "basic" },
  { name: "icon", label: "Ikon (lucide)", placeholder: "Stethoscope", section: "basic" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama", full: true, section: "basic" },
  { name: "short", label: "Ringkasan singkat", type: "textarea", hint: "Ditampilkan di kartu layanan.", section: "content" },
  { name: "description", label: "Deskripsi", type: "textarea", hint: "Konten lengkap halaman layanan.", section: "content" },
  { name: "points", label: "Poin (pisahkan koma)", type: "tags", placeholder: "Poin 1, Poin 2, Poin 3", full: true, hint: "Ditampilkan sebagai bullet list.", section: "content" },
  { name: "orderIndex", label: "Urutan", type: "number", hint: "Semakin kecil, semakin awal ditampilkan.", section: "display" },
];

function toForm(d?: unknown): FormState {
  const data = d as Record<string, unknown> | undefined;
  return {
    title: (data?.title as string) ?? "",
    icon: (data?.icon as string) ?? "Activity",
    slug: (data?.slug as string) ?? "",
    short: (data?.short as string) ?? "",
    description: (data?.description as string) ?? "",
    points: Array.isArray(data?.points) ? (data?.points as string[]) : [],
    orderIndex: (data?.orderIndex as number) ?? 0,
  };
}

export default function EditServicePage() {
  return (
    <FormPage
      title="Layanan"
      singular="Layanan"
      api={servicesApi}
      fields={fields}
      schema={serviceSchema}
      toForm={toForm}
      backUrl="/admin/services"
      sections={sections}
    />
  );
}
