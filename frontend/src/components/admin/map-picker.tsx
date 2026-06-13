"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MapPickerInner = dynamic(() => import("./map-picker-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="size-4 animate-pulse text-primary" />
        Memuat peta…
      </span>
    </div>
  ),
});

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export function MapPicker({ lat, lng, onChange, className }: Props) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      const data: { lat: string; lon: string }[] = await res.json();
      if (data.length) onChange(Number(data[0].lat), Number(data[0].lon));
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Cari alamat atau tempat…"
            className="pl-9"
            aria-label="Cari lokasi di peta"
          />
        </div>
        <Button type="button" variant="outline" onClick={search} disabled={searching}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : "Cari"}
        </Button>
      </div>

      {notFound && <p className="text-xs text-destructive">Lokasi tidak ditemukan. Coba kata kunci lain atau klik peta.</p>}

      <div className="h-64 w-full overflow-hidden rounded-lg border">
        <MapPickerInner lat={lat} lng={lng} onPick={(la, ln) => onChange(la, ln)} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" />
          Klik peta atau geser pin untuk menentukan titik.
        </span>
        <span className="font-mono tabular-nums">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </div>
    </div>
  );
}
