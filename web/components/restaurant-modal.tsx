"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Restaurant } from "@/lib/types";

// ── Curated Unsplash hero images per cuisine ─────────────────────────────────
const CUISINE_IMAGES: Record<string, string> = {
  Italian:
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80&fit=crop",
  French:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&fit=crop",
  Japanese:
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=900&q=80&fit=crop",
  Chinese:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=900&q=80&fit=crop",
  Indian:
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=80&fit=crop",
  British:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80&fit=crop",
  American:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=80&fit=crop",
  Mediterranean:
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80&fit=crop",
  Thai:
    "https://images.unsplash.com/photo-1562802378-063ec186a863?w=900&q=80&fit=crop",
  Mexican:
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&q=80&fit=crop",
  Vietnamese:
    "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=900&q=80&fit=crop",
  Brunch:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=900&q=80&fit=crop",
  default:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80&fit=crop",
};

const ALL_ASPECTS = [
  { key: "score_food_quality", label: "Food Quality" },
  { key: "score_service", label: "Service" },
  { key: "score_ambiance", label: "Ambiance" },
  { key: "score_location", label: "Location" },
  { key: "score_value_for_money", label: "Value for Money" },
  { key: "score_waiting_time", label: "Waiting Time" },
  { key: "score_drinks", label: "Drinks" },
  { key: "score_cleanliness", label: "Cleanliness" },
];

interface Props {
  restaurant: Restaurant | null;
  onClose: () => void;
}

export function RestaurantModal({ restaurant: r, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (r) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [r]);

  const heroImg = CUISINE_IMAGES[r?.cuisine ?? ""] ?? CUISINE_IMAGES.default;
  const delta = r?.rating_change_vs_tripadvisor ?? 0;
  const DeltaIcon = delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus;
  const deltaColor = delta > 0.05 ? "text-emerald-600" : delta < -0.05 ? "text-rose-500" : "text-slate-400";

  return (
    <AnimatePresence>
      {r && (
        <>
          {/* Backdrop — z-[9999] clears Leaflet's max internal z-index of ~1000 */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-8 z-[10000] mx-auto flex max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:max-h-[90vh] sm:-translate-y-1/2 sm:rounded-3xl"
          >
            {/* Hero image */}
            <div className="relative h-52 w-full shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImg}
                alt={r.cuisine}
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Rank badge */}
              <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900 shadow">
                #{r.rank}
              </span>

              {/* Name + cuisine over image */}
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="text-xl font-bold text-white leading-tight">
                  {r.restaurant_name.replace(/_/g, " ")}
                </h2>
                <p className="mt-0.5 text-sm text-white/70">{r.cuisine} · London</p>
              </div>
            </div>

            {/* Scrollable content */}
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-5">

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  <StatBlock
                    label="NLP Score"
                    value={`${Math.round(r.score * 100)}%`}
                    sub="match"
                  />
                  <StatBlock
                    label="Composite"
                    value={`${r.composite_rating}`}
                    sub="/ 5.0"
                    highlight
                  />
                  <StatBlock
                    label="TripAdvisor"
                    value={`${r.tripadvisor_rating}`}
                    sub="/ 5.0"
                  />
                  <StatBlock
                    label="Reviews"
                    value={r.n_reviews.toLocaleString()}
                    sub="total"
                  />
                </div>

                {/* vs TripAdvisor delta */}
                <div
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${
                    delta > 0.05
                      ? "border-emerald-100 bg-emerald-50"
                      : delta < -0.05
                      ? "border-rose-100 bg-rose-50"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <DeltaIcon className={`h-4 w-4 ${deltaColor}`} />
                  <p className={`text-sm font-medium ${deltaColor}`}>
                    {delta > 0.05
                      ? `NLP analysis rates this ${Math.abs(delta).toFixed(2)} pts above TripAdvisor`
                      : delta < -0.05
                      ? `NLP analysis rates this ${Math.abs(delta).toFixed(2)} pts below TripAdvisor`
                      : "Closely aligned with TripAdvisor rating"}
                  </p>
                </div>

                {/* Aspect scores */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Aspect Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {r.top_aspects.map((a) => (
                      <AspectBar key={a.aspect} label={a.aspect} score={a.score} weight={a.weight} />
                    ))}
                  </div>
                </div>

                {/* Preferences & tags */}
                {r.preferences_used.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.preferences_used.map((p) => (
                      <Badge
                        key={p}
                        variant="secondary"
                        className="rounded-full text-[11px]"
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Positive reviews */}
                {r.positive_reviews?.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                      What guests loved
                    </h3>
                    <div className="space-y-2.5">
                      {r.positive_reviews.map((review, i) => (
                        <ReviewCard key={i} text={review} sentiment="positive" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative reviews */}
                {r.negative_reviews?.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <ThumbsDown className="h-3.5 w-3.5 text-rose-400" />
                      What could improve
                    </h3>
                    <div className="space-y-2.5">
                      {r.negative_reviews.map((review, i) => (
                        <ReviewCard key={i} text={review} sentiment="negative" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer link */}
                <div className="pb-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    View on TripAdvisor
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </div>

              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBlock({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl py-3 px-2 ${
        highlight ? "bg-slate-900 text-white" : "bg-slate-50"
      }`}
    >
      <span className={`text-lg font-bold ${highlight ? "text-white" : "text-slate-900"}`}>
        {value}
      </span>
      <span className={`text-[10px] ${highlight ? "text-slate-400" : "text-slate-400"}`}>
        {sub}
      </span>
      <span className={`mt-0.5 text-[10px] font-medium ${highlight ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}

function AspectBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  const pct = Math.round((score / 5) * 100);
  const isHighWeight = weight >= 2;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-slate-600">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${isHighWeight ? "bg-slate-900" : "bg-slate-400"}`}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-700">
        {score.toFixed(1)}/5
      </span>
    </div>
  );
}

function ReviewCard({
  text,
  sentiment,
}: {
  text: string;
  sentiment: "positive" | "negative";
}) {
  return (
    <div
      className={`rounded-xl p-3.5 text-xs leading-relaxed text-slate-600 ${
        sentiment === "positive" ? "bg-slate-50" : "bg-rose-50/50"
      }`}
    >
      <span className="mr-1.5 opacity-40">{sentiment === "positive" ? "❝" : "❝"}</span>
      {text}
    </div>
  );
}
