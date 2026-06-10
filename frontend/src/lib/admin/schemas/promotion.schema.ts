import { z } from "zod";

export const promotionSchema = z.object({
  title: z.string().min(2, "Judul promo wajib diisi").max(160),
  tag: z.string().max(60).optional().or(z.literal("")),
  price: z.string().max(60).optional().or(z.literal("")),
  oldPrice: z.string().max(60).optional().or(z.literal("")),
  desc: z.string().max(600, "Deskripsi maksimal 600 karakter").optional().or(z.literal("")),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung").optional().or(z.literal("")),
  active: z.boolean(),
});
