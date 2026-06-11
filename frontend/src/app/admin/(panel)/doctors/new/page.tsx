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
  { name: "imageUrl", label: "URL Foto", placeholder: "/doctors/nama.jpg", full: true, section: "media" },
  { name: "accent", label: "Gradient Accent", placeholder: "from-primary-400 to-primary-600", full: true, section: "media" },
];

function toForm(): FormState {
  return {
    name: "", specialty: "", experience: "", slug: "",
    imageUrl: "", accent: "from-primary-400 to-accent-500",
    orderIndex: 0, active: true,
  };
}

export default function NewDoctorPage() {
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
