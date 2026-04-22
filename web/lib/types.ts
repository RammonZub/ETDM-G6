export interface AspectScore {
  aspect: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface Restaurant {
  rank: number;
  restaurant_name: string;
  cuisine: string;
  score: number;
  n_reviews: number;
  composite_rating: number;
  tripadvisor_rating: number;
  time_decay_rating: number;
  rating_change_vs_tripadvisor: number;
  top_aspects: AspectScore[];
  positive_review: string | null;
  positive_reviews: string[];
  negative_reviews: string[];
  url: string;
  preferences_used: string[];
  lat: number;
  lng: number;
}

export interface ParsedQuery {
  preferences: string[];
  cuisine: string | null;
  min_reviews: number;
  top_n: number;
}

export interface RecommendResponse {
  results: Restaurant[];
  parsed: ParsedQuery;
  query: string;
  note?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: Restaurant[];
  parsed?: ParsedQuery;
  note?: string;
  timestamp: Date;
}

export interface Preference {
  key: string;
  emoji: string;
  description: string;
}
