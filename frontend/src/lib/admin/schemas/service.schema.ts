import { z } from "zod";

/** Optional non-negative integer that also accepts an empty string from blank inputs. */
const optionalNonNegativeInt = z
  .union([z.literal(""), z.coerce.number().int().min(0, "Tidak boleh negatif")])
  .optional();

export const serviceSchema = z.object({
  title: z.string().min(2, "Nama layanan wajib diisi").max(160),
  icon: z.string().max(60).optional().or(z.literal("")),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung").optional().or(z.literal("")),
  short: z.string().max(300, "Ringkasan maksimal 300 karakter").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  points: z.array(z.string()).default([]),
  price: optionalNonNegativeInt,
  durationMinutes: optionalNonNegativeInt,
  orderIndex: z.coerce.number().int().min(0, "Urutan tidak boleh negatif"),
});
