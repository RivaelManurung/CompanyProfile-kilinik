import { z } from "zod";

function parseNumeric(s: string): number {
  return Number(s.replace(/[^0-9]/g, ""));
}

export const promotionSchema = z.object({
  title: z.string().min(2, "Judul promo wajib diisi").max(160),
  tag: z.string().max(20, "Tag maksimal 20 karakter").optional().or(z.literal("")),
  price: z.string().optional().or(z.literal("")),
  oldPrice: z.string().optional().or(z.literal("")),
  desc: z.string().min(10, "Deskripsi minimal 10 karakter").max(600, "Deskripsi maksimal 600 karakter"),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung").optional().or(z.literal("")),
  status: z.enum(["draft", "scheduled", "active", "expired", "hidden"]).default("draft"),
  campaignType: z.enum(["discount", "bundle", "seasonal", "new_patient", "wellness"]).default("discount"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  coverImage: z.string().optional().or(z.literal("")),
  terms: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0).optional(),
  maxClaims: z.coerce.number().int().min(0).optional(),
  accentColor: z.string().optional().or(z.literal("")),
  currency: z.string().default("IDR").optional(),
  priceNote: z.string().optional().or(z.literal("")),
  fullDescription: z.string().optional().or(z.literal("")),
  targetAudience: z.enum(["general", "new_patient", "existing_patient", "family", "corporate"]).default("general"),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: "Tanggal akhir harus setelah tanggal mulai", path: ["endDate"] },
).refine(
  (data) => {
    if (data.price && data.oldPrice) {
      const p = parseNumeric(data.price);
      const op = parseNumeric(data.oldPrice);
      if (!isNaN(p) && !isNaN(op) && p > 0 && op > 0) {
        return op > p;
      }
    }
    return true;
  },
  { message: "Harga asli harus lebih besar dari harga promo", path: ["oldPrice"] },
);
