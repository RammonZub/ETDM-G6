import type { RecommendResponse, Preference } from "./types";

const BASE = "http://localhost:8000";

export async function recommend(query: string): Promise<RecommendResponse> {
  const res = await fetch(`${BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getPreferences(): Promise<Preference[]> {
  const res = await fetch(`${BASE}/preferences`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getCuisines(): Promise<string[]> {
  const res = await fetch(`${BASE}/cuisines`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
