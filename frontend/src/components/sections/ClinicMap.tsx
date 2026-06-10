"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { ClinicLocation } from "@/lib/data";
import { cn } from "@/lib/utils";

const ClinicMapInner = dynamic(() => import("./ClinicMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-muted">
      <span className="flex items-center gap-2 text-sm font-medium text-ink-400">
        <MapPin className="h-5 w-5 animate-pulse text-primary-400" />
        Memuat peta…
      </span>
    </div>
  ),
});

export function ClinicMap({
  locations,
  className,
  zoom,
}: {
  locations?: ClinicLocation[];
  className?: string;
  zoom?: number;
}) {
  return (
    <div
      className={cn(
        "relative z-0 h-[420px] w-full overflow-hidden rounded-3xl border border-ink-100 shadow-card",
        className,
      )}
    >
      <ClinicMapInner locations={locations} zoom={zoom} />
    </div>
  );
}
