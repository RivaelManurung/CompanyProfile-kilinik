"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { articles } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ArticleGrid() {
  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(articles.map((a) => a.category)))],
    [],
  );
  const [active, setActive] = useState("Semua");

  const filtered = active === "Semua" ? articles : articles.filter((a) => a.category === active);

  return (
    <div>
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

      <motion.div layout className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((a) => (
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
    </div>
  );
}
