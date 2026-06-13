"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  sublabel?: string;
  leading?: React.ReactNode;
  keywords?: string;
}

export function Combobox({
  value,
  options,
  onChange,
  placeholder = "Pilih…",
  disabledPlaceholder,
  searchable = false,
  searchPlaceholder = "Cari…",
  disabled = false,
}: {
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabledPlaceholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, searchable]);

  const filtered =
    searchable && query.trim()
      ? options.filter((o) =>
          `${o.label} ${o.sublabel ?? ""} ${o.keywords ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
      : options;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-xl border bg-white px-4 text-left text-sm transition-colors",
          disabled
            ? "cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400"
            : open
              ? "border-primary-500 ring-2 ring-primary-500/15"
              : "border-ink-200 hover:border-primary-300",
        )}
      >
        {selected?.leading}
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate font-medium text-ink-900">{selected.label}</span>
              {selected.sublabel && (
                <span className="block truncate text-xs text-ink-400">{selected.sublabel}</span>
              )}
            </>
          ) : (
            <span className="font-medium text-ink-400">
              {disabled ? disabledPlaceholder ?? placeholder : placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-ink-400 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-ink-100 bg-white shadow-lift"
            role="listbox"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-ink-100 px-3">
                <Search className="h-4 w-4 shrink-0 text-ink-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{ outline: "none", boxShadow: "none" }}
                  className="h-11 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </div>
            )}
            <div className="max-h-72 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-400">Tidak ada hasil</p>
              ) : (
                filtered.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        active ? "bg-primary-50" : "hover:bg-surface-muted",
                      )}
                    >
                      {o.leading}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", active ? "text-primary-800" : "text-ink-900")}>
                          {o.label}
                        </span>
                        {o.sublabel && (
                          <span className="block truncate text-xs text-ink-400">{o.sublabel}</span>
                        )}
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-primary-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
