import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import type { LocationVM } from "@/lib/public/api";
import { ClinicMap } from "@/components/sections/ClinicMap";

export function LocationCard({ loc }: { loc: LocationVM }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card">
      <div className="relative h-44 overflow-hidden">
        <ClinicMap
          locations={[{ ...loc, position: { lat: loc.lat, lng: loc.lng } }]}
          zoom={15}
          className="h-full w-full rounded-none border-none shadow-none"
        />
        <span className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-soft backdrop-blur">
          <MapPin className="h-3.5 w-3.5" />
          {loc.area}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold tracking-tight text-ink-900">
          {loc.name}
        </h3>
        <ul className="mt-4 flex-1 space-y-3 text-sm text-ink-600">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <span className="leading-relaxed">{loc.address}</span>
          </li>
          <li className="flex gap-3">
            <Clock className="h-4 w-4 shrink-0 text-primary-600" />
            {loc.hours}
          </li>
          <li className="flex gap-3">
            <Phone className="h-4 w-4 shrink-0 text-primary-600" />
            {loc.phone}
          </li>
        </ul>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex w-fit items-center gap-1.5 border-b border-transparent text-sm font-semibold text-primary-700 transition-colors hover:border-primary-600"
        >
          <Navigation className="h-4 w-4" />
          Petunjuk arah
        </a>
      </div>
    </div>
  );
}
