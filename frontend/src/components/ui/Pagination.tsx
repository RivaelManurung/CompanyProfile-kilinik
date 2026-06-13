"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Build a compact page list with ellipses, e.g. 1 … 4 5 6 … 12 */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const go = (p: number) => onChange(Math.min(totalPages, Math.max(1, p)));
  const items = pageWindow(page, totalPages);

  const navBtn =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-ink-100 bg-white px-3 text-sm font-semibold text-ink-700 transition-colors hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-100 disabled:hover:text-ink-700";

  return (
    <nav
      aria-label="Navigasi halaman"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className={navBtn}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {items.map((it, i) =>
        it === "…" ? (
          <span
            key={`gap-${i}`}
            className="inline-flex h-10 w-8 items-center justify-center text-sm text-ink-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => go(it)}
            aria-current={it === page ? "page" : undefined}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold tabular-nums transition-colors",
              it === page
                ? "bg-primary-600 text-white shadow-soft"
                : "border border-ink-100 bg-white text-ink-700 hover:border-primary-200 hover:text-primary-700",
            )}
          >
            {it}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className={navBtn}
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
