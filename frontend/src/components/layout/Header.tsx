"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Phone, CalendarCheck } from "lucide-react";
import { nav, site } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 16);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          "transition-all duration-500",
          scrolled
            ? "glass border-b border-ink-100/80 shadow-soft"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <Container className="flex h-16 items-center justify-between lg:h-20">
          <Link href="/" className="flex items-center" aria-label={site.name}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-primary-700" : "text-ink-600 hover:text-primary-700",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary-50"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-primary-700"
            >
              <Phone className="h-4 w-4" />
              {site.phoneDisplay}
            </a>
            <Button href="/kontak" size="sm">
              <CalendarCheck className="h-4 w-4" />
              Buat Janji
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 lg:hidden"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </Container>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 z-40 bg-ink-950/30 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-4 mt-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {nav.map((item, i) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-2xl px-4 py-3 text-base font-medium transition-colors",
                          active ? "bg-primary-50 text-primary-700" : "text-ink-700 hover:bg-ink-50",
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-ink-100 pt-3">
                <Button href="/kontak" className="w-full">
                  <CalendarCheck className="h-4 w-4" />
                  Buat Janji
                </Button>
                <Button href={`tel:${site.phone}`} variant="outline" className="w-full">
                  <Phone className="h-4 w-4" />
                  {site.phoneDisplay}
                </Button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
