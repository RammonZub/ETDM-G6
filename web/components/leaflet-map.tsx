"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Restaurant } from "@/lib/types";

// Fix Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeNumberedIcon(rank: number, isSelected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 28px; height: 28px;
      background: ${isSelected ? "#0f172a" : "#334155"};
      border: 2px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 11px; font-weight: 700;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
      transition: background 0.2s;
    ">${rank}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function FlyTo({ restaurants, selectedIndex }: { restaurants: Restaurant[]; selectedIndex: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (restaurants.length === 0) {
      map.setView([51.505, -0.11], 12);
      return;
    }
    if (selectedIndex !== null && restaurants[selectedIndex]) {
      const r = restaurants[selectedIndex];
      map.flyTo([r.lat, r.lng], 15, { duration: 0.8 });
      return;
    }
    // Fit all markers
    const bounds = L.latLngBounds(restaurants.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [restaurants, selectedIndex, map]);

  return null;
}

interface Props {
  restaurants: Restaurant[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}

export default function LeafletMap({ restaurants, selectedIndex, onSelect }: Props) {
  return (
    <MapContainer
      center={[51.505, -0.11]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      {/* Carto Positron — clean minimal light tiles, no API key */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <FlyTo restaurants={restaurants} selectedIndex={selectedIndex} />
      {restaurants.map((r, i) => (
        <Marker
          key={r.restaurant_name}
          position={[r.lat, r.lng]}
          icon={makeNumberedIcon(r.rank, selectedIndex === i)}
          eventHandlers={{ click: () => onSelect(i) }}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{r.restaurant_name.replace(/_/g, " ")}</p>
              <p className="text-slate-500">{r.cuisine} · {r.composite_rating}/5 ⭐</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
