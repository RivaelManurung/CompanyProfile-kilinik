"use client";

import { FormPage } from "@/components/admin/FormPage";
import type { FormState, Field } from "@/components/admin/CrudManager";
import { usersApi } from "@/lib/admin/api";
import { ROLE_OPTIONS, userEditSchema } from "@/lib/admin/schemas/user.schema";
import type { Admin } from "@/lib/admin/types";

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
  { name: "password", label: "Kata Sandi Baru", type: "password", placeholder: "Kosongkan untuk tidak mengubah", hint: "Isi hanya jika ingin mengganti kata sandi.", section: "access" },
  { name: "active", label: "Akun aktif", type: "checkbox", hint: "Nonaktifkan untuk memblokir login tanpa menghapus akun.", section: "access" },
];

function toForm(row?: unknown): FormState {
  const u = (row ?? {}) as Partial<Admin>;
  return {
    name: u.name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    avatarUrl: u.avatarUrl ?? "",
    role: u.role ?? "viewer",
    password: "",
    active: u.active ?? true,
  };
}

export default function EditUserPage() {
  return (
    <FormPage
      title="Admin User"
      singular="Pengguna"
      api={usersApi}
      fields={fields}
      schema={userEditSchema}
      toForm={toForm}
      backUrl="/admin/users"
      sections={sections}
    />
  );
}
