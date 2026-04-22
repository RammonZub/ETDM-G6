"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const PREFERENCES = [
  { emoji: "🌹", name: "Romantic Date",     desc: "Ambiance, service & drinks — ideal for date nights" },
  { emoji: "💰", name: "Best Value",         desc: "Value for money + food quality — great bang for buck" },
  { emoji: "🍽️", name: "Fine Dining",        desc: "Food, service, ambiance & drinks — upscale experiences" },
  { emoji: "👨‍👩‍👧‍👦", name: "Family Friendly",  desc: "Cleanliness, service & short wait times" },
  { emoji: "🍸", name: "Drinks & Cocktails", desc: "Bar quality + ambiance — cocktail-forward venues" },
  { emoji: "⚡", name: "Quick Bites",        desc: "Short wait + value — fast casual & lunch spots" },
  { emoji: "📍", name: "Great Location",     desc: "Location score + ambiance — centrally placed venues" },
  { emoji: "✨", name: "Best Overall",       desc: "Uses the composite NLP score directly — no weighting" },
  { emoji: "🧹", name: "Spotless & Clean",   desc: "Cleanliness + service — hygiene-first picks" },
  { emoji: "💎", name: "Hidden Gems",        desc: "Penalises popularity — surfaces unknown great venues" },
];

const EXAMPLES = [
  { q: "Romantic French restaurant, 200+ reviews", tags: ["romantic date", "French", "≥200 reviews"] },
  { q: "Hidden gem Japanese nobody knows about",   tags: ["hidden gems", "Japanese"] },
  { q: "Cheap cheerful Indian, 500+ reviews top 5",tags: ["best value", "Indian", "≥500 reviews", "top 5"] },
  { q: "Fine dining Italian, top 3",               tags: ["fine dining", "Italian", "top 3"] },
  { q: "Best cocktail bar great location",          tags: ["drinks & cocktails", "great location"] },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InfoOverlay({ open, onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
          />

          {/* Panel — slides in from the left */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 bottom-0 z-[9999] w-full max-w-md bg-white shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">How it works</h2>
                <p className="text-xs text-slate-400">London Restaurant Finder · 1,833 venues</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-8">

              {/* What is this */}
              <section>
                <Tag label="Overview" />
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  This app analyses <strong className="text-slate-900">1,833 London restaurants</strong> scraped from TripAdvisor.
                  Each restaurant has been scored across 8 dimensions using{" "}
                  <strong className="text-slate-900">NLP sentiment analysis</strong> of real guest reviews —
                  not just the star rating.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Type a plain-English query in the chat. The engine extracts your intent, runs a
                  multi-criteria scoring algorithm, and returns ranked recommendations with a live map.
                </p>
              </section>

              {/* Score formula */}
              <section>
                <Tag label="How scores are calculated" />
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Aspect score (50%)", desc: "Weighted blend of the 8 NLP aspect scores for your chosen preference" },
                    { label: "Time-decay rating (30%)", desc: "Recency-weighted rating — recent reviews count more" },
                    { label: "Review confidence (15%)", desc: "Logarithmic trust curve — more reviews = more reliable score" },
                    { label: "Rating delta (10%)", desc: "Bonus if NLP scores higher than TripAdvisor's raw rating" },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900 mt-1.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 10 preferences */}
              <section>
                <Tag label="10 preference types" />
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {PREFERENCES.map(p => (
                    <div key={p.name} className="flex items-start gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5">
                      <span className="text-lg leading-none mt-0.5">{p.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Query filters */}
              <section>
                <Tag label="What you can filter by" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { icon: "🎯", label: "Preferences", desc: "One or more of the 10 types above" },
                    { icon: "🍴", label: "Cuisine", desc: "Italian, French, Japanese, Indian…" },
                    { icon: "👥", label: "Min reviews", desc: "e.g. '500+ reviews'" },
                    { icon: "🔢", label: "Top N", desc: "e.g. 'top 5'" },
                  ].map(f => (
                    <div key={f.label} className="rounded-xl border border-slate-100 px-3 py-2.5">
                      <p className="text-sm">{f.icon}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800">{f.label}</p>
                      <p className="text-[11px] text-slate-400">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Example queries */}
              <section>
                <Tag label="Example queries" />
                <div className="mt-3 space-y-2.5">
                  {EXAMPLES.map(ex => (
                    <div key={ex.q} className="rounded-xl border border-slate-100 px-3.5 py-3">
                      <p className="text-xs font-medium text-slate-700 italic">&ldquo;{ex.q}&rdquo;</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ex.tags.map(t => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Limitations */}
              <section className="pb-4">
                <Tag label="Limitations" />
                <div className="mt-3 space-y-1.5">
                  {[
                    "Cannot filter by neighbourhood or postcode",
                    "No real-time data — based on a static TripAdvisor scrape",
                    "Some cuisine labels come from TripAdvisor and may be inaccurate",
                    "Map coordinates come from Nominatim geocoding and may be approximate",
                  ].map(l => (
                    <p key={l} className="flex gap-2 text-xs text-slate-500">
                      <span className="text-slate-300">—</span> {l}
                    </p>
                  ))}
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
      {label}
    </span>
  );
}
