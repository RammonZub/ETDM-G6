"use client";

import dynamic from "next/dynamic";
import { RestaurantCard } from "@/components/restaurant-card";
import type { Restaurant } from "@/lib/types";

// Leaflet requires client-only rendering
const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 rounded-xl">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
    </div>
  ),
});

interface Props {
  restaurants: Restaurant[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  onOpenModal: (i: number) => void;
}

export function MapPanel({ restaurants, selectedIndex, onSelect, onOpenModal }: Props) {
  const hasResults = restaurants.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Map */}
      <div className="h-[280px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <LeafletMap
          restaurants={restaurants}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
        />
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
        {!hasResults && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-3xl">🗺️</div>
            <p className="text-sm font-medium text-slate-500">Ask for recommendations</p>
            <p className="mt-1 text-xs text-slate-400">
              Results will appear here with a map
            </p>
          </div>
        )}
        {restaurants.map((r, i) => (
          <RestaurantCard
            key={r.restaurant_name}
            restaurant={r}
            isSelected={selectedIndex === i}
            onSelect={() => onSelect(i)}
            onOpenModal={() => onOpenModal(i)}
          />
        ))}
      </div>
    </div>
  );
}
