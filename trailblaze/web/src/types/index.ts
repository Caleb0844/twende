export type Category = "adventure" | "view" | "hiking" | "cave" | "forest" | "waterfall" | "other";

export type User = {
  id: string;
  username: string;
  email: string;
  points: number;
  created_at: string;
};

export type Place = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: Category;
  lat: number;
  lng: number;
  address: string | null;
  created_at: string;
  distance_km?: number;
  checked_in?: boolean;
  added_by?: string;
  checkin_count?: number;
};

export type Checkin = {
  id: string;
  user_id: string;
  place_id: string;
  checked_in_at: string;
  name?: string;
  category?: Category;
  lat?: number;
  lng?: number;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  adventure: "🧗 Adventure",
  view:      "🌅 View",
  hiking:    "🥾 Hiking",
  cave:      "🦇 Cave",
  forest:    "🌲 Forest",
  waterfall: "💧 Waterfall",
  other:     "📍 Other",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  adventure: "#ef4444",
  view:      "#f97316",
  hiking:    "#22c55e",
  cave:      "#8b5cf6",
  forest:    "#16a34a",
  waterfall: "#0ea5e9",
  other:     "#64748b",
};
