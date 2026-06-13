"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";

const pinIcon = L.divIcon({
  className: "clinic-pin",
  html: `
    <span class="clinic-pin__wrap">
      <svg viewBox="0 0 24 36" width="34" height="50" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 24 12 24s12-15.5 12-24C24 5.4 18.6 0 12 0z"
          fill="#2e6f40" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
      </svg>
    </span>`,
  iconSize: [34, 50],
  iconAnchor: [17, 48],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Recenter the map when lat/lng change from outside (e.g. search result). */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const last = useRef<string>("");
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key === last.current) return;
    last.current = key;
    map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function MapPickerInner({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#f3f8f4" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
        maxZoom={20}
      />
      <ClickHandler onPick={onPick} />
      <Recenter lat={lat} lng={lng} />
      <Marker
        position={center}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend(e) {
            const { lat: nlat, lng: nlng } = e.target.getLatLng();
            onPick(nlat, nlng);
          },
        }}
      />
    </MapContainer>
  );
}
