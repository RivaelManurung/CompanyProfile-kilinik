"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { LocationCard } from "@/components/ui/LocationCard";
import { Pagination } from "@/components/ui/Pagination";
import type { LocationVM } from "@/lib/public/api";

const PER_PAGE = 9;

export function LocationsPaginated({ locations }: { locations: LocationVM[] }) {
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  if (locations.length === 0) return null;

  const totalPages = Math.ceil(locations.length / PER_PAGE);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const visible = locations.slice(start, start + PER_PAGE);

  const handleChange = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="py-16 lg:py-20">
      <Container>
        <div ref={topRef} className="scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Semua lokasi klinik
            </h2>
            <p className="text-sm text-ink-500">
              Menampilkan{" "}
              <span className="font-semibold text-ink-700">
                {start + 1}–{start + visible.length}
              </span>{" "}
              dari {locations.length} cabang
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={safePage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((loc) => (
                <LocationCard key={loc.slug} loc={loc} />
              ))}
            </motion.div>
          </AnimatePresence>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={handleChange}
            className="mt-12"
          />
        </div>
      </Container>
    </section>
  );
}
