import { z } from "zod";

export const doctorSchema = z.object({
  name: z.string().min(2, "Nama dokter wajib diisi").max(160),
  specialty: z.string().max(160).optional().or(z.literal("")),
  experience: z.string().max(60).optional().or(z.literal("")),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung").optional().or(z.literal("")),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
  accent: z.string().max(120).optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().min(0, "Urutan tidak boleh negatif"),
  active: z.boolean(),
});
