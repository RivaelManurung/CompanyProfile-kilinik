"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { doctorsApi } from "@/lib/admin/api";
import { doctorSchema } from "@/lib/admin/schemas/doctor.schema";

const sections = [
  { key: "basic", label: "Informasi Dasar", description: "Nama, spesialisasi, dan identitas dokter." },
  { key: "profile", label: "Profil Profesional", description: "Pengalaman, urutan tampil, dan status." },
  { key: "media", label: "Media & Tampilan", description: "URL foto dan aksen warna profil publik." },
];

const fields: Field[] = [
  { name: "name", label: "Nama Dokter", placeholder: "dr. Nama, Sp.XX", section: "basic" },
  { name: "specialty", label: "Spesialisasi", placeholder: "Penyakit Dalam", section: "basic" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama", section: "basic" },
  { name: "experience", label: "Pengalaman", placeholder: "10 tahun", section: "profile" },
  { name: "orderIndex", label: "Urutan", type: "number", hint: "Semakin kecil, semakin awal ditampilkan.", section: "profile" },
  { name: "active", label: "Aktif (tampil di situs)", type: "checkbox", hint: "Nonaktifkan untuk menyembunyikan profil dari situs publik.", section: "profile" },
  { name: "imageUrl", label: "Foto Dokter", type: "image", uploadFolder: "doctors", imageAspect: "square", full: true, section: "media", hint: "Unggah foto profil dokter (rasio 1:1 disarankan)." },
  { name: "accent", label: "Gradient Accent", placeholder: "from-primary-400 to-primary-600", full: true, section: "media", hint: "Kelas Tailwind gradient untuk kartu publik." },
];

function toForm(d?: unknown): FormState {
  const data = d as Record<string, unknown> | undefined;
  return {
    name: (data?.name as string) ?? "",
    specialty: (data?.specialty as string) ?? "",
    experience: (data?.experience as string) ?? "",
    slug: (data?.slug as string) ?? "",
    imageUrl: (data?.imageUrl as string) ?? "",
    accent: (data?.accent as string) ?? "from-primary-400 to-accent-500",
    orderIndex: (data?.orderIndex as number) ?? 0,
    active: (data?.active as boolean) ?? true,
  };
}

export default function EditDoctorPage() {
  return (
    <FormPage
      title="Dokter"
      singular="Dokter"
      api={doctorsApi}
      fields={fields}
      schema={doctorSchema}
      toForm={toForm}
      backUrl="/admin/doctors"
      sections={sections}
    />
  );
}
