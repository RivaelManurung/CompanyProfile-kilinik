import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(4, "Judul minimal 4 karakter").max(200),
  category: z.string().max(80).optional().or(z.literal("")),
  readMins: z.coerce.number().int().min(1, "Menit baca minimal 1").max(90),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung").optional().or(z.literal("")),
  excerpt: z.string().max(500, "Ringkasan maksimal 500 karakter").optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  published: z.boolean(),
});
