"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, CalendarPlus } from "lucide-react";
import { TextField, TextAreaField, fieldControlClass } from "@/components/ui/Field";
import { site } from "@/lib/site";

const topics = [
  "Pertanyaan umum",
  "Informasi layanan",
  "Kerja sama / korporat",
  "Lainnya",
];

type FieldErrors = { name?: string; phone?: string; message?: string };

/**
 * General inquiry form. Booking lives entirely in the authenticated wizard
 * (/buat-janji) — this form composes a WhatsApp message for questions, so
 * there is no longer a second, anonymous appointment-creation path.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const topic = String(fd.get("topic") ?? "Pertanyaan umum");
    const message = String(fd.get("message") ?? "").trim();

    const next: FieldErrors = {};
    if (name.length < 2) next.name = "Nama wajib diisi.";
    if (phone.replace(/\D/g, "").length < 9)
      next.phone = "Masukkan nomor WhatsApp yang valid.";
    if (message.length < 5) next.message = "Tuliskan pesan Anda.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const text = `Halo ${site.shortName}, saya ${name}.\nTopik: ${topic}\n\n${message}\n\nNo. HP: ${phone}`;
    window.open(
      `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  const clear = (key: keyof FieldErrors) =>
    setErrors((p) => ({ ...p, [key]: undefined }));

  return (
    <div className="relative rounded-3xl border border-ink-100 bg-white p-7 shadow-card sm:p-9">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-ink-900">
              Pesan Anda dibuka di WhatsApp
            </h3>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Tekan kirim di WhatsApp untuk menyelesaikan. Tim kami akan
              membalas pada jam operasional.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Tulis pesan lain
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Booking is a separate, dedicated flow */}
            <Link
              href="/buat-janji"
              className="group mb-6 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
                <CalendarPlus className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink-900">
                  Mau membuat janji temu?
                </span>
                <span className="block text-xs text-ink-500">
                  Pilih dokter & jadwal lewat portal janji temu →
                </span>
              </span>
            </Link>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nama lengkap"
                  name="name"
                  autoComplete="name"
                  placeholder="Nama Anda"
                  required
                  error={errors.name}
                  onChange={() => clear("name")}
                />
                <TextField
                  label="No. WhatsApp"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="08xx xxxx xxxx"
                  required
                  error={errors.phone}
                  onChange={() => clear("phone")}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-topic"
                  className="text-sm font-semibold text-ink-700"
                >
                  Topik
                </label>
                <select
                  id="contact-topic"
                  name="topic"
                  className={`${fieldControlClass} h-12`}
                  defaultValue={topics[0]}
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <TextAreaField
                label="Pesan"
                name="message"
                rows={4}
                placeholder="Ceritakan pertanyaan atau kebutuhan Anda…"
                className="resize-none"
                required
                error={errors.message}
                onChange={() => clear("message")}
              />

              <button
                type="submit"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-600 font-semibold text-white shadow-soft transition-all hover:bg-primary-700 hover:shadow-glow"
              >
                Kirim via WhatsApp
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p className="text-center text-xs text-ink-400">
                Dengan mengirim, Anda menyetujui kebijakan privasi kami.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
