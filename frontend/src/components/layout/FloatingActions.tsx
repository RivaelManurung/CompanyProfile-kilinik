"use client";

import { useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { MessageCircle, ArrowUp, X, Phone, CalendarCheck } from "lucide-react";
import { site } from "@/lib/site";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setShowTop(latest > 600));

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="totop"
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-700 shadow-card transition-colors hover:text-primary-600"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            id="floating-contact-menu"
            role="menu"
            aria-label="Pilihan kontak cepat"
            className="flex w-60 flex-col gap-1 rounded-2xl border border-ink-100 bg-white p-2 shadow-lift"
          >
            <a
              href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-accent-50"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-white">
                <MessageCircle className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold text-ink-900">WhatsApp</span>
                <span className="text-xs text-ink-500">Chat dengan tim kami</span>
              </span>
            </a>
            <a
              href={`tel:${site.phone}`}
              role="menuitem"
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-primary-50"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold text-ink-900">Telepon</span>
                <span className="text-xs text-ink-500">{site.phoneDisplay}</span>
              </span>
            </a>
            <a
              href="/buat-janji"
              role="menuitem"
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-ink-50"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-white">
                <CalendarCheck className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold text-ink-900">Buat Janji</span>
                <span className="text-xs text-ink-500">Reservasi online</span>
              </span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="animate-pulse-ring relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-glow transition-transform hover:scale-105"
        aria-label={open ? "Tutup menu kontak" : "Hubungi kami"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="floating-contact-menu"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
