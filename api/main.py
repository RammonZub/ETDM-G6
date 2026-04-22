"""
FastAPI backend for the London Restaurant Recommender UI.

Wraps recommender_v2.py with:
- Natural language query parsing
- Nominatim geocoding (free, no API key)
- CORS for the Next.js frontend
"""

import os
import re
import sys
import time
import math
import random
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from recommender_v2 import RestaurantRecommender

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="London Restaurant Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "london_restaurant_scores.csv",
)
rec = RestaurantRecommender(CSV_PATH)

# ── Geocoding ────────────────────────────────────────────────────────────────

_geocache: dict[str, tuple[float, float]] = {}

# London bounding box — used for plausible fallback coords
LONDON_BOUNDS = {
    "lat_min": 51.46, "lat_max": 51.54,
    "lng_min": -0.20, "lng_max": -0.04,
}


def geocode(name: str) -> tuple[float, float]:
    """Return (lat, lng) for a restaurant name via Nominatim, with caching."""
    key = name.lower()
    if key in _geocache:
        return _geocache[key]

    display = name.replace("_", " ")
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": f"{display}, London", "format": "json", "limit": 1},
            headers={"User-Agent": "london-restaurant-recommender/1.0"},
            timeout=4,
        )
        data = resp.json()
        if data:
            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            # Validate it's inside Greater London
            if (LONDON_BOUNDS["lat_min"] <= lat <= LONDON_BOUNDS["lat_max"] and
                    LONDON_BOUNDS["lng_min"] <= lng <= LONDON_BOUNDS["lng_max"]):
                _geocache[key] = (lat, lng)
                time.sleep(0.12)  # Nominatim rate limit: max 1 req/s
                return lat, lng
    except Exception:
        pass

    # Scatter fallback within Zone 1 London
    lat = random.uniform(51.495, 51.525)
    lng = random.uniform(-0.155, -0.065)
    _geocache[key] = (lat, lng)
    return lat, lng


# ── NLP query parser ─────────────────────────────────────────────────────────

PREFERENCE_KEYWORDS: list[tuple[list[str], str]] = [
    (["romantic", "date night", "intimate", "cosy", "cozy", "couple"], "romantic_date"),
    (["cheap", "budget", "affordable", "value", "inexpensive", "bargain"], "best_value"),
    (["fine dining", "upscale", "fancy", "elegant", "luxury", "michelin", "gourmet"], "fine_dining"),
    (["family", "kids", "children", "child-friendly"], "family_friendly"),
    (["cocktail", "drinks", "bar", "nightlife", "wine"], "drinks_cocktails"),
    (["quick", "fast", "speedy", "grab and go", "takeaway", "lunch break"], "quick_bites"),
    (["location", "central", "convenient", "well-located", "near"], "great_location"),
    (["hidden gem", "undiscovered", "secret", "off the beaten", "local secret"], "hidden_gems"),
    (["clean", "hygiene", "hygienic", "spotless", "tidy"], "spotless_clean"),
    (["best", "top", "overall", "recommend", "popular", "good"], "best_overall"),
]

CUISINE_KEYWORDS = [
    "italian", "french", "japanese", "chinese", "indian", "british",
    "american", "mediterranean", "thai", "mexican", "vietnamese", "brunch",
]


def parse_query(query: str) -> dict:
    """Convert a natural language query into recommender parameters."""
    q = query.lower()

    # Preferences — collect all matches, deduplicate
    preferences: list[str] = []
    for keywords, tag in PREFERENCE_KEYWORDS:
        if any(kw in q for kw in keywords):
            if tag not in preferences:
                preferences.append(tag)

    # Only keep the most specific ones (skip best_overall if others found)
    if len(preferences) > 1 and "best_overall" in preferences:
        preferences.remove("best_overall")

    if not preferences:
        preferences = ["best_overall"]

    # Cuisine
    cuisine: str | None = None
    for c in CUISINE_KEYWORDS:
        if c in q:
            cuisine = c.capitalize()
            break

    # Minimum reviews — also apply a sensible default of 30 to filter
    # tiny restaurants that hit 5.0 on everything from only 3–5 reviews
    min_reviews = 30
    m = re.search(r"(\d[\d,]*)\s*\+?\s*reviews?", q)
    if m:
        min_reviews = max(30, int(m.group(1).replace(",", "")))
    elif any(w in q for w in ["popular", "well known", "established", "trusted"]):
        min_reviews = 300
    elif any(w in q for w in ["hidden gem", "undiscovered", "secret"]):
        min_reviews = 5  # hidden gems intentionally have few reviews

    # top_n
    top_n = 3
    m = re.search(r"top\s*(\d+)|(\d+)\s*(?:restaurant|recommendation|result|option|place)", q)
    if m:
        top_n = int(m.group(1) or m.group(2))
        top_n = max(1, min(top_n, 10))

    return {
        "preferences": preferences,
        "cuisine": cuisine,
        "min_reviews": min_reviews,
        "top_n": top_n,
    }


# ── Models ───────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/recommend")
async def recommend(req: QueryRequest):
    parsed = parse_query(req.query)

    relaxation_note = ""
    try:
        results = rec.recommend(
            preferences=parsed["preferences"],
            cuisine_filter=parsed["cuisine"],
            min_reviews=parsed["min_reviews"],
            top_n=parsed["top_n"],
        )

        # ── Automatic query relaxation ──────────────────────────────────────
        # If no results, progressively loosen constraints so the user always
        # gets an answer rather than a blank screen.
        if not results and parsed["min_reviews"] > 30:
            results = rec.recommend(
                preferences=parsed["preferences"],
                cuisine_filter=parsed["cuisine"],
                min_reviews=30,
                top_n=parsed["top_n"],
            )
            if results:
                relaxation_note = f"No results with {parsed['min_reviews']}+ reviews — showing best matches with fewer reviews."
                parsed = {**parsed, "min_reviews": 30}

        if not results and parsed["cuisine"]:
            results = rec.recommend(
                preferences=parsed["preferences"],
                cuisine_filter=None,
                min_reviews=parsed["min_reviews"],
                top_n=parsed["top_n"],
            )
            if results:
                relaxation_note = f"No {parsed['cuisine']} results found — showing best matches across all cuisines."
                parsed = {**parsed, "cuisine": None}

        if not results and len(parsed["preferences"]) > 1:
            results = rec.recommend(
                preferences=[parsed["preferences"][0]],
                cuisine_filter=None,
                min_reviews=30,
                top_n=parsed["top_n"],
            )
            if results:
                relaxation_note = f"Relaxed filters — showing top results for '{parsed['preferences'][0].replace('_', ' ')}' only."
                parsed = {**parsed, "preferences": [parsed["preferences"][0]], "cuisine": None, "min_reviews": 30}

    except ValueError as e:
        return {"error": str(e), "results": [], "parsed": parsed}

    # Enrich with coordinates + full reviews from CSV
    name_to_row = {row["restaurant_name"]: row for _, row in rec.df.iterrows()}
    for i, r in enumerate(results):
        lat, lng = geocode(r["restaurant_name"])
        r["lat"] = lat
        r["lng"] = lng
        r["rank"] = i + 1

        # Attach all 5 positive and negative reviews
        row = name_to_row.get(r["restaurant_name"], {})
        r["positive_reviews"] = [
            str(row.get(f"positive_review_{j}", "") or "")
            for j in range(1, 6)
            if row.get(f"positive_review_{j}") and str(row.get(f"positive_review_{j}", "")) not in ("", "nan")
        ]
        r["negative_reviews"] = [
            str(row.get(f"negative_review_{j}", "") or "")
            for j in range(1, 6)
            if row.get(f"negative_review_{j}") and str(row.get(f"negative_review_{j}", "")) not in ("", "nan")
        ]

    # Build a human-readable note explaining what was understood
    pref_labels = [p.replace("_", " ") for p in parsed["preferences"]]
    note_parts = [f"preferences: {', '.join(pref_labels)}"]
    if parsed["cuisine"]:
        note_parts.append(f"cuisine: {parsed['cuisine']}")
    if parsed["min_reviews"] > 30:
        note_parts.append(f"min {parsed['min_reviews']} reviews")
    note_parts.append(f"top {parsed['top_n']}")

    full_note = " · ".join(note_parts)
    if relaxation_note:
        full_note = relaxation_note + " (" + full_note + ")"

    return {
        "results": results,
        "parsed": parsed,
        "query": req.query,
        "note": full_note,
    }


@app.get("/preferences")
async def get_preferences():
    return rec.get_available_preferences()


@app.get("/cuisines")
async def get_cuisines():
    return rec.get_available_cuisines()


@app.get("/health")
async def health():
    return {"status": "ok", "restaurants": len(rec.df)}
