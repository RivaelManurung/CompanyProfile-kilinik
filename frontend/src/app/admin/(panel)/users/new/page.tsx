"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { usersApi } from "@/lib/admin/api";
import { ROLE_OPTIONS, userCreateSchema } from "@/lib/admin/schemas/user.schema";

const sections = [
  { key: "identity", label: "Identitas", description: "Nama, email, dan kontak pengguna." },
  { key: "access", label: "Akses & Keamanan", description: "Peran, kata sandi, dan status akun." },
];

const fields: Field[] = [
  { name: "name", label: "Nama Lengkap", placeholder: "Nama staf", section: "identity", required: true },
  { name: "email", label: "Email", type: "text", placeholder: "nama@sehatnusantara.id", section: "identity", required: true },
  { name: "phone", label: "Telepon", placeholder: "+62 8xx", section: "identity" },
  { name: "avatarUrl", label: "URL Avatar", type: "url", placeholder: "https://...", full: true, section: "identity" },
  { name: "role", label: "Peran", type: "select", options: [...ROLE_OPTIONS], section: "access", required: true },
  { name: "password", label: "Kata Sandi", type: "password", placeholder: "Minimal 8 karakter", section: "access", required: true },
  { name: "active", label: "Akun aktif", type: "checkbox", hint: "Nonaktifkan untuk memblokir login tanpa menghapus akun.", section: "access" },
];

function toForm(): FormState {
  return { name: "", email: "", phone: "", avatarUrl: "", role: "viewer", password: "", active: true };
}

export default function NewUserPage() {
  return (
    <FormPage
      title="Admin User"
      singular="Pengguna"
      api={usersApi}
      fields={fields}
      schema={userCreateSchema}
      toForm={toForm}
      backUrl="/admin/users"
      sections={sections}
    />
  );
}
