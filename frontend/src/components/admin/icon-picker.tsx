"use client";

import { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Search, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Curated set of clinic/medical-relevant lucide icons offered in the picker. */
const ICON_NAMES = [
  "Stethoscope", "HeartPulse", "Heart", "Activity", "Pill", "Tablets", "Syringe",
  "Thermometer", "Microscope", "FlaskConical", "TestTube", "TestTubes", "Dna",
  "Brain", "Bone", "Eye", "Ear", "Baby", "Hand", "Footprints", "Smile",
  "Cross", "Plus", "ShieldCheck", "Shield", "Droplet", "Droplets", "Stethoscope",
  "Scan", "ScanLine", "ClipboardList", "ClipboardCheck", "FileText", "BookOpen",
  "Accessibility", "Bed", "Ambulance", "Hospital", "Building2", "Users", "User",
  "Clock", "CalendarClock", "CalendarHeart", "Phone", "MapPin", "Star", "Award",
  "Sparkles", "Zap", "Wind", "Waves", "Sun", "Moon", "Leaf", "Apple", "Glasses",
  "Weight", "Ruler", "Scale", "Bandage", "BriefcaseMedical", "Nfc",
];

/** Render any lucide icon by name (falls back to Activity). */
export function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && (LucideIcons as unknown as Record<string, LucideIcon>)[name]) || LucideIcons.Activity;
  return <Icon className={className} />;
}

interface Props {
  value?: string;
  onChange: (name: string) => void;
  id?: string;
  className?: string;
}

export function IconPicker({ value, onChange, id, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const icons = useMemo(() => {
    const seen = new Set<string>();
    return ICON_NAMES.filter((n) => {
      if (seen.has(n)) return false;
      seen.add(n);
      return Boolean((LucideIcons as unknown as Record<string, LucideIcon>)[n]);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? icons.filter((n) => n.toLowerCase().includes(q)) : icons;
  }, [icons, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className={cn("w-full justify-between font-normal", className)}>
          <span className="flex items-center gap-2">
            <DynamicIcon name={value} className="size-4 text-primary" />
            <span className={cn(!value && "text-muted-foreground")}>{value || "Pilih ikon"}</span>
          </span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari ikon…"
              className="h-9 pl-8"
            />
          </div>
        </div>
        <div className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto p-2">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              onClick={() => { onChange(name); setOpen(false); }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                value === name && "border-primary bg-accent text-primary",
              )}
            >
              <DynamicIcon name={name} className="size-4" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-6 py-6 text-center text-xs text-muted-foreground">Tidak ada ikon cocok.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
