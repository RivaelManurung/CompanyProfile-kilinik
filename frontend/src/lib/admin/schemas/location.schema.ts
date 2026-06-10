import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().min(2, "Nama lokasi wajib diisi").max(160),
  area: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(400, "Alamat maksimal 400 karakter").optional().or(z.literal("")),
  hours: z.string().max(160).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung").optional().or(z.literal("")),
});
