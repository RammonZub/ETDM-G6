"""
Restaurant Recommendation Engine
=================================
A creative, multi-criteria recommendation algorithm that reads
`london_restaurant_scores.csv` (produced by final.ipynb) and recommends
the best restaurants based on user-selected preference tags.

Each preference tag (e.g. "Romantic Date", "Best Value") maps to a
weighted blend of NLP-derived aspect scores, enabling nuanced,
explainable recommendations.
"""

import math
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import Optional


# ── Aspect score column names in the CSV ─────────────────────────────────────
ASPECT_COLUMNS = [
    "score_food_quality",
    "score_service",
    "score_ambiance",
    "score_location",
    "score_value_for_money",
    "score_waiting_time",
    "score_drinks",
    "score_cleanliness",
]

# ── Human-readable aspect labels ─────────────────────────────────────────────
ASPECT_LABELS = {
    "score_food_quality": "Food Quality",
    "score_service": "Service",
    "score_ambiance": "Ambiance",
    "score_location": "Location",
    "score_value_for_money": "Value for Money",
    "score_waiting_time": "Waiting Time",
    "score_drinks": "Drinks",
    "score_cleanliness": "Cleanliness",
}


@dataclass
class PreferenceProfile:
    """Defines how a user-friendly preference tag maps to aspect weights."""
    tag: str
    emoji: str
    description: str
    aspect_weights: dict = field(default_factory=dict)
    use_composite_directly: bool = False
    hidden_gem_mode: bool = False


# ── Preference Profiles ──────────────────────────────────────────────────────
PREFERENCE_PROFILES: dict[str, PreferenceProfile] = {
    "romantic_date": PreferenceProfile(
        tag="romantic_date",
        emoji="🌹",
        description="Romantic Date",
        aspect_weights={
            "score_ambiance": 3.0,
            "score_service": 1.5,
            "score_drinks": 1.5,
            "score_food_quality": 1.0,
        },
    ),
    "best_value": PreferenceProfile(
        tag="best_value",
        emoji="💰",
        description="Best Value",
        aspect_weights={
            "score_value_for_money": 3.0,
            "score_food_quality": 1.5,
        },
    ),
    "fine_dining": PreferenceProfile(
        tag="fine_dining",
        emoji="🍽️",
        description="Fine Dining",
        aspect_weights={
            "score_food_quality": 3.0,
            "score_service": 2.0,
            "score_ambiance": 2.0,
            "score_drinks": 1.5,
        },
    ),
    "family_friendly": PreferenceProfile(
        tag="family_friendly",
        emoji="👨‍👩‍👧‍👦",
        description="Family Friendly",
        aspect_weights={
            "score_service": 2.0,
            "score_cleanliness": 2.0,
            "score_waiting_time": 1.5,
            "score_value_for_money": 1.0,
        },
    ),
    "drinks_cocktails": PreferenceProfile(
        tag="drinks_cocktails",
        emoji="🍸",
        description="Drinks & Cocktails",
        aspect_weights={
            "score_drinks": 3.0,
            "score_ambiance": 1.5,
        },
    ),
    "quick_bites": PreferenceProfile(
        tag="quick_bites",
        emoji="⚡",
        description="Quick Bites",
        aspect_weights={
            "score_waiting_time": 3.0,
            "score_value_for_money": 1.5,
        },
    ),
    "great_location": PreferenceProfile(
        tag="great_location",
        emoji="📍",
        description="Great Location",
        aspect_weights={
            "score_location": 3.0,
            "score_ambiance": 1.0,
        },
    ),
    "best_overall": PreferenceProfile(
        tag="best_overall",
        emoji="✨",
        description="Best Overall",
        use_composite_directly=True,
    ),
    "spotless_clean": PreferenceProfile(
        tag="spotless_clean",
        emoji="🧹",
        description="Spotless & Clean",
        aspect_weights={
            "score_cleanliness": 3.0,
            "score_service": 1.0,
        },
    ),
    "hidden_gems": PreferenceProfile(
        tag="hidden_gems",
        emoji="💎",
        description="Hidden Gems",
        hidden_gem_mode=True,
    ),
}


class RestaurantRecommender:
    """
    A multi-criteria restaurant recommendation engine.

    Usage:
        recommender = RestaurantRecommender("london_restaurant_scores.csv")
        results = recommender.recommend(["romantic_date", "best_value"])
        for r in results:
            print(r)
    """

    # Global tuning knobs
    TIME_DECAY_WEIGHT = 0.3       # α — how much time_decay_rating matters
    REVIEW_CONFIDENCE_WEIGHT = 0.2  # β — how much review count matters
    CONFIDENCE_PLATEAU = 500       # n_reviews at which confidence reaches 1.0
    HIDDEN_GEM_REVIEW_CAP = 200    # "Hidden gems" have ≤ this many reviews

    def __init__(self, csv_path: str):
        """Load and preprocess the restaurant scores CSV."""
        self.df = pd.read_csv(csv_path)
        self._validate_columns()
        self._preprocess()

    def _validate_columns(self):
        """Ensure the CSV has the expected columns."""
        required = [
            "restaurant_name", "cuisine", "n_reviews",
            "tripadvisor_rating", "time_decay_rating",
            "composite_rating", "nlp_composite_score",
        ] + ASPECT_COLUMNS
        missing = [c for c in required if c not in self.df.columns]
        if missing:
            raise ValueError(
                f"CSV is missing required columns: {missing}"
            )

    def _preprocess(self):
        """Normalize aspect scores to [0, 1] and compute confidence."""
        # Normalize aspect scores (originally 0–5)
        for col in ASPECT_COLUMNS:
            self.df[f"{col}_norm"] = self.df[col] / 5.0

        # Time-decay bonus normalized to [0, 1]
        self.df["time_decay_norm"] = self.df["time_decay_rating"] / 5.0

        # Composite rating normalized to [0, 1]
        self.df["composite_norm"] = self.df["composite_rating"] / 5.0

        # Review confidence: logarithmic curve, reaches 1.0 at CONFIDENCE_PLATEAU
        plateau_log = math.log2(self.CONFIDENCE_PLATEAU)
        self.df["review_confidence"] = self.df["n_reviews"].apply(
            lambda n: min(1.0, math.log2(max(n, 1)) / plateau_log)
        )

    # ── Public API ───────────────────────────────────────────────────────────

    def get_available_preferences(self) -> list[dict]:
        """Return list of available preference profiles for UI display."""
        return [
            {
                "key": key,
                "emoji": p.emoji,
                "description": p.description,
            }
            for key, p in PREFERENCE_PROFILES.items()
        ]

    def get_available_cuisines(self) -> list[str]:
        """Return sorted list of unique cuisines in the dataset."""
        cuisines = self.df["cuisine"].dropna().unique().tolist()
        return sorted(cuisines)

    def recommend(
        self,
        preferences: list[str],
        cuisine_filter: Optional[str] = None,
        min_reviews: int = 0,
        top_n: int = 3,
    ) -> list[dict]:
        """
        Recommend the top-N restaurants for the given preferences.

        Args:
            preferences: list of preference tag keys (e.g. ["romantic_date", "best_value"])
            cuisine_filter: optional cuisine string to filter by (case-insensitive)
            min_reviews: minimum number of reviews required
            top_n: how many restaurants to return (default 3)

        Returns:
            List of dicts, each with: name, cuisine, score, top_aspects,
            positive_review, url, and score breakdown.
        """
        if not preferences:
            raise ValueError("Please select at least one preference.")

        # Validate preference keys
        invalid = [p for p in preferences if p not in PREFERENCE_PROFILES]
        if invalid:
            raise ValueError(f"Unknown preference(s): {invalid}")

        # Start with full dataset
        df = self.df.copy()

        # Apply cuisine filter
        if cuisine_filter:
            mask = df["cuisine"].str.lower() == cuisine_filter.lower()
            df = df[mask]
            if df.empty:
                return []

        # Apply minimum reviews filter
        if min_reviews > 0:
            df = df[df["n_reviews"] >= min_reviews]
            if df.empty:
                return []

        # Compute scores
        scores = self._compute_scores(df, preferences)
        df = df.copy()
        df["_recommendation_score"] = scores

        # Sort descending by score
        df = df.sort_values("_recommendation_score", ascending=False)

        # Take top N
        top = df.head(top_n)

        # Build result dicts
        results = []
        for _, row in top.iterrows():
            result = self._build_result_dict(row, preferences)
            results.append(result)

        return results

    # ── Internal Scoring ─────────────────────────────────────────────────────

    def _compute_scores(
        self, df: pd.DataFrame, preferences: list[str]
    ) -> pd.Series:
        """Compute the recommendation score for each row in df."""
        profiles = [PREFERENCE_PROFILES[p] for p in preferences]

        # Check for special modes
        use_composite = any(p.use_composite_directly for p in profiles)
        hidden_gem = any(p.hidden_gem_mode for p in profiles)

        if use_composite and len(profiles) == 1:
            # Pure "Best Overall" — use composite_rating directly + confidence
            return (
                df["composite_norm"] * 0.8
                + df["review_confidence"] * 0.2
            )

        # Build merged weight vector
        weight_vector = self._build_weight_vector(profiles)

        # Compute weighted aspect score per restaurant
        aspect_scores = pd.Series(0.0, index=df.index)
        total_weight = pd.Series(0.0, index=df.index)

        for col, weight in weight_vector.items():
            norm_col = f"{col}_norm"
            if norm_col not in df.columns:
                continue
            valid = df[norm_col].notna()
            aspect_scores = aspect_scores + (
                df[norm_col].fillna(0) * weight * valid.astype(float)
            )
            total_weight = total_weight + (weight * valid.astype(float))

        # Avoid division by zero — if no aspect data available, fall back to
        # composite rating
        has_aspects = total_weight > 0
        normalized_aspect = pd.Series(0.0, index=df.index)
        normalized_aspect[has_aspects] = (
            aspect_scores[has_aspects] / total_weight[has_aspects]
        )
        normalized_aspect[~has_aspects] = df.loc[~has_aspects, "composite_norm"]

        # Compose final score
        α = self.TIME_DECAY_WEIGHT
        β = self.REVIEW_CONFIDENCE_WEIGHT
        aspect_w = 1.0 - α - β  # remaining weight goes to aspect score

        score = (
            aspect_w * normalized_aspect
            + α * df["time_decay_norm"]
            + β * df["review_confidence"]
        )

        # If "Best Overall" is combined with other preferences, blend in
        # the composite rating
        if use_composite and len(profiles) > 1:
            score = 0.6 * score + 0.4 * df["composite_norm"]

        # Hidden gem mode: penalize popularity, boost quality of lesser-known
        if hidden_gem:
            popularity_penalty = df["n_reviews"].apply(
                lambda n: max(0.0, 1.0 - n / self.HIDDEN_GEM_REVIEW_CAP)
            )
            score = 0.5 * score + 0.5 * popularity_penalty * df["composite_norm"]

        return score

    def _build_weight_vector(
        self, profiles: list[PreferenceProfile]
    ) -> dict[str, float]:
        """Merge weight vectors from multiple preference profiles."""
        merged: dict[str, float] = {}
        for profile in profiles:
            for col, w in profile.aspect_weights.items():
                merged[col] = merged.get(col, 0.0) + w
        return merged

    def _build_result_dict(
        self, row: pd.Series, preferences: list[str]
    ) -> dict:
        """Build a rich result dictionary for a single restaurant."""
        # Find the top aspects that drove this recommendation
        weight_vector = self._build_weight_vector(
            [PREFERENCE_PROFILES[p] for p in preferences]
        )
        top_aspects = []
        for col in ASPECT_COLUMNS:
            score_val = row.get(col)
            if pd.notna(score_val):
                weight = weight_vector.get(col, 0.0)
                top_aspects.append({
                    "aspect": ASPECT_LABELS.get(col, col),
                    "score": round(float(score_val), 2),
                    "weight": weight,
                    "contribution": round(float(score_val) / 5.0 * weight, 3),
                })

        # Sort by contribution descending, keep top 3
        top_aspects.sort(key=lambda x: x["contribution"], reverse=True)
        top_aspects = top_aspects[:3]

        # Grab a positive review excerpt if available
        positive_review = None
        for i in range(1, 6):
            col_name = f"positive_review_{i}"
            if col_name in row.index and pd.notna(row.get(col_name)):
                review_text = str(row[col_name])
                # Take first 200 chars as excerpt
                if len(review_text) > 200:
                    positive_review = review_text[:200] + "…"
                else:
                    positive_review = review_text
                break

        return {
            "rank": None,  # will be set by caller
            "restaurant_name": row["restaurant_name"],
            "cuisine": row.get("cuisine", "Unknown"),
            "score": round(float(row["_recommendation_score"]), 4),
            "n_reviews": int(row["n_reviews"]),
            "composite_rating": round(float(row.get("composite_rating", 0)), 2),
            "time_decay_rating": round(float(row.get("time_decay_rating", 0)), 2),
            "top_aspects": top_aspects,
            "positive_review": positive_review,
            "url": row.get("url", ""),
            "preferences_used": [
                PREFERENCE_PROFILES[p].description for p in preferences
            ],
        }


# ── Pretty Printing ──────────────────────────────────────────────────────────

def format_recommendation(result: dict, rank: int) -> str:
    """Format a single recommendation as a beautiful text card."""
    lines = []
    lines.append(f"")
    lines.append(f"  {'━' * 60}")
    lines.append(f"  🏆 #{rank}  {result['restaurant_name']}")
    lines.append(f"  {'━' * 60}")
    lines.append(f"  🍴 Cuisine: {result['cuisine']}")
    lines.append(f"  ⭐ Score: {result['score']:.4f}")
    lines.append(f"  📊 Composite Rating: {result['composite_rating']}/5")
    lines.append(f"  ⏱️  Time-Decay Rating: {result['time_decay_rating']}/5")
    lines.append(f"  📝 Reviews: {result['n_reviews']}")
    lines.append(f"")

    if result["top_aspects"]:
        lines.append(f"  📈 Top scoring aspects:")
        for asp in result["top_aspects"]:
            bar = "█" * int(asp["score"] * 2) + "░" * (10 - int(asp["score"] * 2))
            lines.append(
                f"     {asp['aspect']:20s} {bar} {asp['score']}/5.0"
            )
        lines.append(f"")

    if result["positive_review"]:
        lines.append(f"  💬 \"{result['positive_review']}\"")
        lines.append(f"")

    if result.get("url"):
        lines.append(f"  🔗 {result['url']}")

    lines.append(f"  {'━' * 60}")
    return "\n".join(lines)


def print_recommendations(results: list[dict]):
    """Print all recommendations beautifully."""
    if not results:
        print("\n  😔 No restaurants found matching your criteria.\n")
        return

    prefs = results[0].get("preferences_used", [])
    print(f"\n  🎯 Recommendations for: {' + '.join(prefs)}")

    for i, result in enumerate(results, 1):
        result["rank"] = i
        print(format_recommendation(result, i))
