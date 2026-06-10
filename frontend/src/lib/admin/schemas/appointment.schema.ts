import { z } from "zod";

export const appointmentStatusSchema = z.enum(["pending", "confirmed", "done", "cancelled"]);

export const appointmentSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  service: z.string().max(120).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  status: appointmentStatusSchema,
});
