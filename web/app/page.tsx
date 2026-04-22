"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import { MapPanel } from "@/components/map-panel";
import { RestaurantModal } from "@/components/restaurant-modal";
import { InfoOverlay } from "@/components/info-overlay";
import type { Restaurant } from "@/lib/types";

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalRestaurant, setModalRestaurant] = useState<Restaurant | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const handleResults = (results: Restaurant[]) => {
    setRestaurants(results);
    setSelectedIndex(null);
  };

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
        {/* ── Left: chat panel ─────────────────────────────── */}
        <div className="flex w-[58%] flex-col border-r border-slate-100 bg-white">
          {/* Top bar with info button */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <button
              onClick={() => setInfoOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="How it works"
            >
              <Info className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-400">London Restaurant Finder</span>
          </div>
          <ChatInterface onResults={handleResults} />
        </div>

        {/* ── Right: map + results panel ───────────────────── */}
        <div className="flex w-[42%] flex-col overflow-hidden p-5">
          {/* Panel header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {restaurants.length > 0
                  ? `${restaurants.length} result${restaurants.length !== 1 ? "s" : ""}`
                  : "Map View"}
              </h2>
              <p className="text-xs text-slate-400">London restaurants</p>
            </div>
            {restaurants.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                {restaurants[0].preferences_used.join(" · ")}
              </span>
            )}
          </div>

          <MapPanel
            restaurants={restaurants}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onOpenModal={(i) => setModalRestaurant(restaurants[i])}
          />
        </div>
      </div>

      {/* ── Restaurant detail modal ──────────────────────── */}
      <RestaurantModal
        restaurant={modalRestaurant}
        onClose={() => setModalRestaurant(null)}
      />

      {/* ── Info overlay ─────────────────────────────────── */}
      <InfoOverlay open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}
