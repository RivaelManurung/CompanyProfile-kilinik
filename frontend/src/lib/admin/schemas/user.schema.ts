import { z } from "zod";

export const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "clinic_admin", label: "Clinic Admin" },
  { value: "receptionist", label: "Receptionist" },
  { value: "content_editor", label: "Content Editor" },
  { value: "viewer", label: "Viewer" },
] as const;

const roleValues = ROLE_OPTIONS.map((r) => r.value) as [string, ...string[]];

const base = {
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().email("Email tidak valid"),
  role: z.enum(roleValues, { message: "Role wajib dipilih" }),
  phone: z.string().max(40).optional().or(z.literal("")),
  avatarUrl: z.string().url("URL avatar tidak valid").optional().or(z.literal("")),
  active: z.boolean(),
};

export const userCreateSchema = z.object({
  ...base,
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
});

export const userEditSchema = z.object({
  ...base,
  // On edit, an empty password means "keep the current password".
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72).optional().or(z.literal("")),
});
