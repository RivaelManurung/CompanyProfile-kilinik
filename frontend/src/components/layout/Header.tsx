"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Phone, CalendarCheck, UserRound } from "lucide-react";
import { nav, site } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/brand-button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { usePatientAuth } from "@/components/patient/PatientAuthProvider";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { patient } = usePatientAuth();
  const { scrollY } = useScroll();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 16);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus first drawer link on open; handle Escape to close.
  useEffect(() => {
    if (!open) return;
    const firstLink = drawerRef.current?.querySelector<HTMLAnchorElement>("a");
    firstLink?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
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
            {patient ? (
              <Link
                href="/akun"
                className="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-semibold text-ink-700 transition-colors hover:text-primary-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[0.7rem] font-bold text-white">
                  {patient.name.slice(0, 2).toUpperCase()}
                </span>
                Akun
              </Link>
            ) : (
              <Button href="/masuk" variant="ghost" size="sm">
                <UserRound className="h-4 w-4" />
                Masuk
              </Button>
            )}
            <Button href="/buat-janji" size="sm">
              <CalendarCheck className="h-4 w-4" />
              Buat Janji
            </Button>
          </div>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 lg:hidden"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
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
              ref={drawerRef}
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi utama"
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
                        aria-current={active ? "page" : undefined}
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
                <Button href="/buat-janji" className="w-full">
                  <CalendarCheck className="h-4 w-4" />
                  Buat Janji
                </Button>
                <Button href={patient ? "/akun" : "/masuk"} variant="outline" className="w-full">
                  <UserRound className="h-4 w-4" />
                  {patient ? "Akun Saya" : "Masuk / Daftar"}
                </Button>
                <Button href={`tel:${site.phone}`} variant="ghost" className="w-full">
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
