"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { services } from "@/lib/data";

const fieldClass =
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("loading");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      service: String(fd.get("service") || ""),
      message: String(fd.get("message") || ""),
    };

    try {
      const res = await fetch(`${API}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || "Gagal mengirim permintaan");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
      setStatus("idle");
    }
  }

  return (
    <div className="relative rounded-3xl border border-ink-100 bg-white p-7 shadow-card sm:p-9">
      <AnimatePresence mode="wait">
        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-ink-900">Terima kasih!</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Permintaan janji Anda telah kami terima. Tim kami akan menghubungi Anda dalam waktu
              1×24 jam untuk konfirmasi.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Kirim permintaan lain
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Nama lengkap</label>
                <input required name="name" placeholder="Nama Anda" className={fieldClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">No. WhatsApp</label>
                <input required name="phone" placeholder="08xx xxxx xxxx" className={fieldClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
              <input required type="email" name="email" placeholder="email@contoh.com" className={fieldClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Layanan yang diminati</label>
              <select name="service" className={fieldClass} defaultValue="">
                <option value="" disabled>Pilih layanan</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.title}>{s.title}</option>
                ))}
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Pesan</label>
              <textarea
                name="message"
                rows={4}
                placeholder="Ceritakan kebutuhan Anda…"
                className={`${fieldClass} resize-none`}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-600 font-semibold text-white shadow-soft transition-all hover:bg-primary-700 hover:shadow-glow disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  Kirim Permintaan
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-ink-400">
              Dengan mengirim, Anda menyetujui kebijakan privasi kami.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
