import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateID(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Build a WhatsApp deep link from a phone number.
 * Normalizes a leading `0` (Indonesian local format) to `62`, strips all
 * non-digits, and returns a `https://wa.me/<digits>` URL. Returns "" when empty.
 */
export function waLink(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}
