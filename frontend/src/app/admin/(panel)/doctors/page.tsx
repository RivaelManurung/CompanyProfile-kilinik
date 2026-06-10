"use client";

import { CrudManager, type Column, type Field, type FormState } from "@/components/admin/CrudManager";
import { useAdminSession } from "@/components/admin/AdminShell";
import { doctorsApi } from "@/lib/admin/api";
import { can, permissions } from "@/lib/admin/permissions";
import { doctorSchema } from "@/lib/admin/schemas/doctor.schema";
import type { Doctor } from "@/lib/admin/types";

const columns: Column<Doctor>[] = [
  {
    header: "Nama",
    cell: (d) => (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.imageUrl || "/doctors/agnes-pratiwi.jpg"} alt="" className="h-9 w-9 rounded-full object-cover object-top" />
        <span className="font-medium text-foreground">{d.name}</span>
      </div>
    ),
  },
  { header: "Spesialisasi", cell: (d) => d.specialty },
  { header: "Pengalaman", cell: (d) => d.experience },
  {
    header: "Status",
    cell: (d) => (
      <span className={d.active ? "text-emerald-600" : "text-muted-foreground"}>
        {d.active ? "Aktif" : "Nonaktif"}
      </span>
    ),
  },
];

const fields: Field[] = [
  { name: "name", label: "Nama Dokter", placeholder: "dr. Nama, Sp.XX" },
  { name: "specialty", label: "Spesialisasi", placeholder: "Penyakit Dalam" },
  { name: "experience", label: "Pengalaman", placeholder: "10 tahun" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama" },
  { name: "imageUrl", label: "URL Foto", placeholder: "/doctors/nama.jpg", full: true },
  { name: "accent", label: "Gradient Accent", placeholder: "from-primary-400 to-primary-600", full: true },
  { name: "orderIndex", label: "Urutan", type: "number" },
  { name: "active", label: "Aktif (tampil di situs)", type: "checkbox" },
];

function toForm(d?: Doctor): FormState {
  return {
    name: d?.name ?? "",
    specialty: d?.specialty ?? "",
    experience: d?.experience ?? "",
    slug: d?.slug ?? "",
    imageUrl: d?.imageUrl ?? "",
    accent: d?.accent ?? "from-primary-400 to-accent-500",
    orderIndex: d?.orderIndex ?? 0,
    active: d?.active ?? true,
  };
}

export default function DoctorsPage() {
  const session = useAdminSession();
  return (
    <CrudManager<Doctor>
      title="Dokter"
      singular="Dokter"
      api={doctorsApi}
      columns={columns}
      fields={fields}
      schema={doctorSchema}
      toForm={toForm}
      searchPlaceholder="Cari nama, spesialisasi, atau slug..."
      defaultSort="order_index"
      filters={[
        { value: "", label: "Semua" },
        { value: "active", label: "Aktif" },
        { value: "inactive", label: "Nonaktif" },
      ]}
      canCreate={can(session, permissions.clinicWrite)}
      canEdit={can(session, permissions.clinicWrite)}
      canDelete={can(session, permissions.clinicDelete)}
    />
  );
}
