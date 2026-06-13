"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArticleCard, type ArticleCardData } from "@/components/ui/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";

const PER_PAGE = 9;

export function ArticleGrid({ articles }: { articles: ArticleCardData[] }) {
  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(articles.map((a) => a.category)))],
    [articles],
  );
  const [active, setActive] = useState("Semua");
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const filtered =
    active === "Semua"
      ? articles
      : articles.filter((a) => a.category === active);

  // Reset to first page whenever the filter narrows the result set.
  useEffect(() => {
    setPage(1);
  }, [active]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(page, totalPages || 1);
  const start = (safePage - 1) * PER_PAGE;
  const visible = filtered.slice(start, start + PER_PAGE);

  const handleChange = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={topRef} className="scroll-mt-28">
      <div className="flex flex-wrap gap-2.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              active === c
                ? "bg-primary-600 text-white shadow-soft"
                : "border border-ink-100 bg-white text-ink-600 hover:border-primary-200 hover:text-primary-700",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <motion.div
        layout
        className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {visible.map((a) => (
            <motion.div
              key={a.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ArticleCard article={a} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onChange={handleChange}
        className="mt-12"
      />
    </div>
  );
}
