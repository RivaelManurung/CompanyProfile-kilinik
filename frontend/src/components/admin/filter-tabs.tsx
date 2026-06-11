"use client";

import { cn } from "@/lib/utils";

export interface FilterTab {
  value: string;
  label: string;
}

interface Props {
  tabs: FilterTab[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterTabs({ tabs, active, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)} role="group" aria-label="Filter">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={
            active === tab.value
              ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
              : "rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
