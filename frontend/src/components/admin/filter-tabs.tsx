"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
        <Button
          key={tab.value}
          type="button"
          variant={active === tab.value ? "default" : "outline"}
          size="sm"
          className="h-7 px-3 text-xs font-medium"
          aria-pressed={active === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
