import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(4, "Judul minimal 4 karakter").max(200, "Judul maksimal 200 karakter"),
  category: z.string().min(1, "Kategori wajib diisi").max(80),
  readMins: z.coerce.number().int().min(1, "Menit baca minimal 1").max(90),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung")
    .optional()
    .or(z.literal("")),
  excerpt: z.string().min(10, "Ringkasan minimal 10 karakter").max(500, "Ringkasan maksimal 500 karakter"),
  content: z
    .string()
    .refine(
      (v) => v.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length >= 20,
      "Konten minimal 20 karakter",
    ),
  status: z.enum(["draft", "published", "scheduled", "archived"]).default("draft"),
  scheduledAt: z.string().optional().or(z.literal("")),
  coverImage: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  author: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  // Recommended lengths (60 / 160) are advisory in the UI; hard caps here are
  // generous safety limits so existing/long values never block saving.
  seoTitle: z.string().max(150, "Judul SEO terlalu panjang").optional().or(z.literal("")),
  seoDescription: z.string().max(300, "Deskripsi SEO terlalu panjang").optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  canonicalUrl: z.string().optional().or(z.literal("")),
  focusKeyword: z.string().max(100).optional().or(z.literal("")),
});
