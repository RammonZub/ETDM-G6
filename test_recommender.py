"""
Test suite for the Restaurant Recommender.

Generates synthetic test data and verifies the recommendation algorithm
works correctly across various scenarios.

Run: python test_recommender.py
"""

import os
import sys
import pandas as pd
import numpy as np

# ── Generate synthetic test CSV ──────────────────────────────────────────────

def generate_test_data(path: str) -> pd.DataFrame:
    """Create a small, deterministic test CSV with known scores."""
    np.random.seed(42)

    restaurants = [
        # name, cuisine, n_reviews, ta_rating, td_rating, comp_rating, nlp_comp,
        # food, service, ambiance, location, value, waiting, drinks, cleanliness
        ("The Velvet Room", "French", 450, 4.5, 4.6, 4.7, 0.88,
         4.8, 4.9, 4.9, 4.0, 3.5, 3.8, 4.7, 4.6),
        ("Burger Blitz", "American", 1200, 4.0, 3.9, 3.8, 0.72,
         3.5, 3.0, 2.5, 4.2, 4.8, 4.9, 2.0, 3.5),
        ("Sakura Sushi", "Japanese", 350, 4.3, 4.4, 4.5, 0.85,
         4.7, 4.5, 4.2, 3.8, 3.9, 3.5, 3.8, 4.8),
        ("Trattoria Bella", "Italian", 280, 4.2, 4.3, 4.4, 0.82,
         4.5, 4.0, 4.6, 3.5, 4.2, 3.0, 4.5, 4.0),
        ("The Hidden Nook", "British", 45, 4.8, 4.9, 4.9, 0.95,
         4.9, 4.8, 4.7, 3.0, 4.5, 4.2, 4.0, 4.9),
        ("Spice Route", "Indian", 600, 4.1, 4.0, 4.0, 0.78,
         4.3, 3.8, 3.5, 4.5, 4.6, 3.2, 3.0, 3.8),
        ("Le Petit Bistro", "French", 180, 4.4, 4.5, 4.6, 0.87,
         4.6, 4.7, 4.8, 4.2, 3.8, 3.5, 4.8, 4.5),
        ("Dragon Palace", "Chinese", 900, 3.8, 3.7, 3.6, 0.65,
         3.8, 3.2, 3.0, 4.0, 4.5, 4.0, 2.5, 3.2),
        ("The Cocktail Corner", "British", 320, 4.0, 4.1, 4.2, 0.80,
         3.5, 4.0, 4.5, 4.3, 3.5, 3.8, 4.9, 4.0),
        ("Clean Plate Club", "Mediterranean", 500, 4.3, 4.2, 4.3, 0.81,
         4.2, 4.4, 3.8, 3.5, 4.0, 3.5, 3.0, 4.95),
        ("Quick Wok", "Chinese", 150, 3.5, 3.4, 3.3, 0.60,
         3.2, 3.0, 2.0, 3.8, 4.7, 4.8, 2.0, 3.0),
        ("Nomad's Table", "Middle Eastern", 95, 4.6, 4.7, 4.8, 0.92,
         4.8, 4.6, 4.3, 3.2, 4.7, 3.8, 3.5, 4.7),
        ("Pasta Paradise", "Italian", 700, 4.1, 4.0, 3.9, 0.75,
         4.0, 3.8, 3.5, 4.0, 4.3, 3.8, 3.2, 3.8),
        ("Riverside Terrace", "British", 400, 4.2, 4.3, 4.4, 0.83,
         4.0, 4.2, 4.1, 4.9, 3.5, 3.0, 4.0, 4.2),
        ("The Greedy Goat", "Greek", 200, 4.0, 3.9, 3.8, 0.70,
         4.2, 3.5, 3.2, 3.0, 4.8, 4.5, 3.0, 3.5),
        # A restaurant with many NaN aspect scores
        ("Mystery Kitchen", "Unknown", 30, 3.5, 3.4, 3.3, 0.55,
         np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan, np.nan),
        # A restaurant with partial NaN
        ("Partial Pete's", "American", 100, 3.8, 3.7, 3.6, 0.68,
         4.0, np.nan, np.nan, 3.5, 4.2, np.nan, np.nan, 3.8),
    ]

    records = []
    for r in restaurants:
        name, cuisine, n_rev, ta, td, comp, nlp, *aspects = r
        record = {
            "restaurant_name": name,
            "cuisine": cuisine,
            "n_reviews": n_rev,
            "tripadvisor_rating": ta,
            "time_decay_rating": td,
            "composite_rating": comp,
            "nlp_composite_score": nlp,
            "score_food_quality": aspects[0],
            "score_service": aspects[1],
            "score_ambiance": aspects[2],
            "score_location": aspects[3],
            "score_value_for_money": aspects[4],
            "score_waiting_time": aspects[5],
            "score_drinks": aspects[6],
            "score_cleanliness": aspects[7],
        }
        # Add fake review columns
        has_scores = not (isinstance(aspects[0], float) and np.isnan(aspects[0]))
        for i in range(1, 6):
            record[f"positive_review_{i}"] = (
                f"Amazing {name} - great experience #{i}!"
                if has_scores else np.nan
            )
            record[f"negative_review_{i}"] = (
                f"Could improve at {name} - feedback #{i}."
                if has_scores else np.nan
            )
        record["url"] = f"https://tripadvisor.com/restaurant/{name.lower().replace(' ', '-')}"
        records.append(record)

    df = pd.DataFrame(records)
    df.to_csv(path, index=False)
    print(f"✅ Generated test data: {path} ({len(df)} restaurants)")
    return df


# ── Test Cases ───────────────────────────────────────────────────────────────

def test_single_preference_romantic():
    """Romantic Date should favor ambiance + service + drinks."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["romantic_date"])
    assert len(results) == 3, f"Expected 3, got {len(results)}"
    # The Velvet Room and Le Petit Bistro have highest ambiance scores
    names = [r["restaurant_name"] for r in results]
    print(f"  Romantic Date top 3: {names}")
    assert "The Velvet Room" in names or "Le Petit Bistro" in names, \
        "Expected high-ambiance restaurants in top 3"
    print("  ✅ PASSED")


def test_single_preference_best_value():
    """Best Value should favor value_for_money + food_quality."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["best_value"])
    assert len(results) == 3
    names = [r["restaurant_name"] for r in results]
    print(f"  Best Value top 3: {names}")
    # All top-3 results should have high value_for_money aspect contribution
    for r in results:
        value_aspects = [a for a in r["top_aspects"] if a["aspect"] == "Value for Money"]
        if value_aspects:
            assert value_aspects[0]["score"] >= 4.0, \
                f"{r['restaurant_name']} has low value score: {value_aspects[0]['score']}"
    print("  ✅ PASSED")


def test_multi_preference():
    """Combining preferences should blend weight vectors."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["romantic_date", "best_value"])
    assert len(results) == 3
    names = [r["restaurant_name"] for r in results]
    print(f"  Romantic + Value top 3: {names}")
    print("  ✅ PASSED")


def test_cuisine_filter():
    """Cuisine filter should restrict results."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["fine_dining"], cuisine_filter="Italian")
    assert all(r["cuisine"] == "Italian" for r in results), \
        "All results should be Italian"
    print(f"  Fine Dining (Italian only): {[r['restaurant_name'] for r in results]}")
    print("  ✅ PASSED")


def test_cuisine_filter_no_results():
    """Cuisine filter with no matches should return empty."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["fine_dining"], cuisine_filter="Martian")
    assert len(results) == 0, "Should return empty for nonexistent cuisine"
    print("  Martian cuisine: [] (as expected)")
    print("  ✅ PASSED")


def test_nan_handling():
    """Restaurants with all-NaN aspects should not crash."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["best_overall"])
    assert len(results) == 3
    # Mystery Kitchen has all NaN aspects — shouldn't crash
    print(f"  Best Overall top 3: {[r['restaurant_name'] for r in results]}")
    print("  ✅ PASSED")


def test_hidden_gems():
    """Hidden gems should favor low-review-count restaurants."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["hidden_gems"])
    assert len(results) == 3
    names = [r["restaurant_name"] for r in results]
    print(f"  Hidden Gems top 3: {names}")
    # The Hidden Nook has only 45 reviews and highest composite — should be #1
    assert results[0]["restaurant_name"] == "The Hidden Nook", \
        f"Expected The Hidden Nook as #1 hidden gem, got {results[0]['restaurant_name']}"
    print("  ✅ PASSED")


def test_top_n():
    """top_n parameter should control result count."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["best_overall"], top_n=5)
    assert len(results) == 5, f"Expected 5, got {len(results)}"
    print(f"  Top 5 overall: {[r['restaurant_name'] for r in results]}")
    print("  ✅ PASSED")


def test_min_reviews():
    """min_reviews should filter out low-count restaurants."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    results = rec.recommend(["best_overall"], min_reviews=300)
    assert all(r["n_reviews"] >= 300 for r in results), \
        "All results should have ≥300 reviews"
    print(f"  Best Overall (≥300 reviews): {[r['restaurant_name'] for r in results]}")
    print("  ✅ PASSED")


def test_available_preferences():
    """Should return all 10 preference profiles."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    prefs = rec.get_available_preferences()
    assert len(prefs) == 10, f"Expected 10 profiles, got {len(prefs)}"
    print(f"  Available preferences: {[p['description'] for p in prefs]}")
    print("  ✅ PASSED")


def test_available_cuisines():
    """Should return sorted unique cuisines."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    cuisines = rec.get_available_cuisines()
    assert len(cuisines) > 0, "Should have cuisines"
    assert cuisines == sorted(cuisines), "Should be sorted"
    print(f"  Available cuisines: {cuisines}")
    print("  ✅ PASSED")


def test_invalid_preference():
    """Invalid preference should raise ValueError."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    try:
        rec.recommend(["nonexistent_preference"])
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"  Invalid preference error: {e}")
        print("  ✅ PASSED")


def test_empty_preferences():
    """Empty preferences list should raise ValueError."""
    from recommender import RestaurantRecommender
    rec = RestaurantRecommender(TEST_CSV)
    try:
        rec.recommend([])
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"  Empty preferences error: {e}")
        print("  ✅ PASSED")


# ── Runner ───────────────────────────────────────────────────────────────────

TEST_CSV = os.path.join(os.path.dirname(__file__), "test_data.csv")

if __name__ == "__main__":
    print("\n🧪 Restaurant Recommender — Test Suite\n")
    print("=" * 60)

    # Generate test data
    generate_test_data(TEST_CSV)
    print()

    tests = [
        ("Single preference: Romantic Date", test_single_preference_romantic),
        ("Single preference: Best Value", test_single_preference_best_value),
        ("Multi-preference: Romantic + Value", test_multi_preference),
        ("Cuisine filter: Italian", test_cuisine_filter),
        ("Cuisine filter: No results", test_cuisine_filter_no_results),
        ("NaN handling", test_nan_handling),
        ("Hidden gems", test_hidden_gems),
        ("Top N parameter", test_top_n),
        ("Min reviews filter", test_min_reviews),
        ("Available preferences", test_available_preferences),
        ("Available cuisines", test_available_cuisines),
        ("Invalid preference", test_invalid_preference),
        ("Empty preferences", test_empty_preferences),
    ]

    passed = 0
    failed = 0
    for name, test_fn in tests:
        print(f"📋 {name}")
        try:
            test_fn()
            passed += 1
        except Exception as e:
            print(f"  ❌ FAILED: {e}")
            failed += 1
        print()

    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed.")
        sys.exit(1)
