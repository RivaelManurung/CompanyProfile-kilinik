"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { doctorsApi } from "@/lib/admin/api";
import { doctorSchema } from "@/lib/admin/schemas/doctor.schema";

const sections = [
  { key: "basic", label: "Informasi Dasar", description: "Nama, spesialisasi, dan identitas dokter." },
  { key: "profile", label: "Profil Profesional", description: "Pengalaman, urutan tampil, dan status." },
  { key: "practice", label: "Praktik & Tarif", description: "Nomor registrasi praktik dan tarif konsultasi." },
  { key: "media", label: "Media & Tampilan", description: "URL foto dan aksen warna profil publik." },
];

const fields: Field[] = [
  { name: "name", label: "Nama Dokter", placeholder: "dr. Nama, Sp.XX", section: "basic" },
  { name: "specialty", label: "Spesialisasi", placeholder: "Penyakit Dalam", section: "basic" },
  { name: "slug", label: "Slug (opsional)", placeholder: "otomatis dari nama", section: "basic" },
  { name: "experience", label: "Pengalaman", placeholder: "10 tahun", section: "profile" },
  { name: "orderIndex", label: "Urutan", type: "number", hint: "Semakin kecil, semakin awal ditampilkan.", section: "profile" },
  { name: "active", label: "Aktif (tampil di situs)", type: "checkbox", hint: "Nonaktifkan untuk menyembunyikan profil dari situs publik.", section: "profile" },
  { name: "strNumber", label: "No. STR", placeholder: "Surat Tanda Registrasi", section: "practice", hint: "Nomor Surat Tanda Registrasi dokter." },
  { name: "sipNumber", label: "No. SIP", placeholder: "Surat Izin Praktik", section: "practice", hint: "Nomor Surat Izin Praktik dokter." },
  { name: "consultationFee", label: "Tarif Konsultasi (Rp)", type: "number", placeholder: "150000", section: "practice", hint: "Biaya konsultasi dalam Rupiah. Kosongkan jika tidak ditampilkan." },
  { name: "imageUrl", label: "Foto Dokter", type: "image", uploadFolder: "doctors", imageAspect: "square", full: true, section: "media", hint: "Unggah foto profil dokter (rasio 1:1 disarankan)." },
  { name: "accent", label: "Gradient Accent", placeholder: "from-primary-400 to-primary-600", full: true, section: "media", hint: "Kelas Tailwind gradient untuk kartu publik." },
];

function toForm(): FormState {
  return {
    name: "", specialty: "", experience: "", slug: "",
    imageUrl: "", accent: "from-primary-400 to-accent-500",
    strNumber: "", sipNumber: "", consultationFee: "",
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
