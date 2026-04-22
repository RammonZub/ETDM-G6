"use client";

import { motion } from "framer-motion";
import { ExternalLink, Star, Users, Info } from "lucide-react";
import type { Restaurant } from "@/lib/types";

// Curated Unsplash images per cuisine (same set as the modal)
const CUISINE_IMAGES: Record<string, string> = {
  Italian:       "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=70&fit=crop",
  French:        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70&fit=crop",
  Japanese:      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=70&fit=crop",
  Chinese:       "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=70&fit=crop",
  Indian:        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=70&fit=crop",
  British:       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=70&fit=crop",
  American:      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=70&fit=crop",
  Mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=70&fit=crop",
  Thai:          "https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=70&fit=crop",
  Mexican:       "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=70&fit=crop",
  Vietnamese:    "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=70&fit=crop",
  Brunch:        "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=70&fit=crop",
};
const DEFAULT_IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=70&fit=crop";

interface Props {
  restaurant: Restaurant;
  isSelected: boolean;
  onSelect: () => void;
  onOpenModal: () => void;
}

export function RestaurantCard({ restaurant: r, isSelected, onSelect, onOpenModal }: Props) {
  const heroImg = CUISINE_IMAGES[r.cuisine] ?? DEFAULT_IMG;
  const scorePercent = Math.round(r.score * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onSelect}
      className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
        isSelected
          ? "border-slate-300 shadow-md"
          : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      {/* Hero image */}
      <div className="relative h-28 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt={r.cuisine}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Rank chip */}
        <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-900 shadow">
          {r.rank}
        </span>

        {/* Score chip */}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-900 backdrop-blur-sm">
          {scorePercent}%
        </span>

        {/* Name overlay */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="truncate text-sm font-semibold leading-tight text-white drop-shadow">
            {r.restaurant_name.replace(/_/g, " ")}
          </p>
          <p className="text-[11px] text-white/70">{r.cuisine}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 py-3">
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-slate-700">{r.composite_rating}</span>
            <span>/5</span>
          </span>
          <span className="text-slate-200">·</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {r.n_reviews.toLocaleString()}
          </span>
          {Math.abs(r.rating_change_vs_tripadvisor) > 0.05 && (
            <>
              <span className="text-slate-200">·</span>
              <span className={r.rating_change_vs_tripadvisor > 0 ? "text-emerald-600 font-medium" : "text-rose-500 font-medium"}>
                {r.rating_change_vs_tripadvisor > 0 ? "▲" : "▼"} vs TA
              </span>
            </>
          )}
        </div>

        {/* Review excerpt */}
        {r.positive_review && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-400 italic">
            &ldquo;{r.positive_review}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Info className="h-3 w-3" />
            Details & reviews
          </button>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
          >
            TripAdvisor
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
