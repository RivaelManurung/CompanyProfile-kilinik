"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { locations as allLocations, type ClinicLocation } from "@/lib/data";

const JAKARTA_CENTER: [number, number] = [-6.2235, 106.8205];

/** Brand-colored teardrop pin as an inline-SVG div icon (no external assets needed). */
const pinIcon = L.divIcon({
  className: "clinic-pin",
  html: `
    <span class="clinic-pin__wrap">
      <svg viewBox="0 0 24 36" width="34" height="50" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 24 12 24s12-15.5 12-24C24 5.4 18.6 0 12 0z"
          fill="#0ea5a4" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
      </svg>
    </span>`,
  iconSize: [34, 50],
  iconAnchor: [17, 48],
  popupAnchor: [0, -44],
});

function osmLink(loc: ClinicLocation) {
  return `https://www.openstreetmap.org/?mlat=${loc.position.lat}&mlon=${loc.position.lng}#map=17/${loc.position.lat}/${loc.position.lng}`;
}
function directionsLink(loc: ClinicLocation) {
  return `https://www.google.com/maps/dir/?api=1&destination=${loc.position.lat},${loc.position.lng}`;
}

function FitToMarkers({ locations }: { locations: ClinicLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length <= 1) return;
    const bounds = L.latLngBounds(locations.map((l) => [l.position.lat, l.position.lng]));
    map.fitBounds(bounds, { padding: [56, 56] });
  }, [map, locations]);
  return null;
}

export default function ClinicMapInner({
  locations = allLocations,
  zoom,
}: {
  locations?: ClinicLocation[];
  zoom?: number;
}) {
  const single = locations.length === 1;
  const center: [number, number] = single
    ? [locations[0].position.lat, locations[0].position.lng]
    : JAKARTA_CENTER;
  const defaultZoom = zoom ?? (single ? 15 : 12);

  return (
    <MapContainer
      center={center}
      zoom={defaultZoom}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#f4f9f9" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={20}
      />
      <FitToMarkers locations={locations} />
      {locations.map((loc) => (
        <Marker key={loc.slug} position={[loc.position.lat, loc.position.lng]} icon={pinIcon}>
          <Popup>
            <span className="block text-sm font-bold text-ink-900">{loc.name}</span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-600">{loc.address}</span>
            <span className="mt-1 block text-xs text-ink-600">{loc.phone}</span>
            <span className="mt-2 flex gap-3">
              <a
                href={directionsLink(loc)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Rute
              </a>
              <a
                href={osmLink(loc)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Lihat peta
              </a>
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
