"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { servicesApi } from "@/lib/admin/api";
import { serviceSchema } from "@/lib/admin/schemas/service.schema";

const fields: Field[] = [
  { name: "title", label: "Nama Layanan", placeholder: "Konsultasi Primer", required: true },
  { name: "icon", label: "Ikon", type: "icon", hint: "Pilih ikon yang mewakili layanan." },
  { name: "slug", label: "Slug", placeholder: "otomatis dari nama", full: true, hint: "Kosongkan untuk dibuat otomatis." },
  { name: "short", label: "Ringkasan singkat", type: "textarea", hint: "Ditampilkan di kartu layanan." },
  { name: "description", label: "Deskripsi lengkap", type: "textarea", hint: "Konten halaman detail layanan." },
  { name: "points", label: "Poin layanan", type: "tags", placeholder: "Poin 1, Poin 2, Poin 3", full: true, hint: "Pisahkan dengan koma — tampil sebagai bullet." },
  { name: "price", label: "Harga (Rp)", type: "number", placeholder: "250000", hint: "Tarif layanan dalam Rupiah. Kosongkan jika gratis/tidak ditampilkan." },
  { name: "durationMinutes", label: "Durasi (menit)", type: "number", placeholder: "30", hint: "Estimasi durasi layanan dalam menit." },
  { name: "orderIndex", label: "Urutan tampil", type: "number", hint: "Makin kecil, makin awal." },
];

function toForm(): FormState {
  return { title: "", icon: "Activity", slug: "", short: "", description: "", points: [], price: "", durationMinutes: "", orderIndex: 0 };
}

export default function NewServicePage() {
  return (
    <FormPage
      title="Layanan"
      singular="Layanan"
      api={servicesApi}
      fields={fields}
      schema={serviceSchema}
      toForm={toForm}
      backUrl="/admin/services"
    />
  );
}
