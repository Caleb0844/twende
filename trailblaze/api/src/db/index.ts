import type { D1Database } from "@cloudflare/workers-types";

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
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  created_at: string;
  distance_km?: number;
  checked_in?: boolean;
};

export type Checkin = {
  id: string;
  user_id: string;
  place_id: string;
  checked_in_at: string;
};

// Haversine formula in SQL to find places within `radius` km
export async function findNearbyPlaces(
  db: D1Database,
  lat: number,
  lng: number,
  radiusKm: number = 25,
  category?: string,
  userId?: string
): Promise<Place[]> {
  const categoryFilter = category ? `AND p.category = ?` : "";
  const params: (number | string)[] = [lat, lng, lat, radiusKm];
  if (category) params.push(category);

  const checkinJoin = userId
    ? `LEFT JOIN checkins c ON c.place_id = p.id AND c.user_id = '${userId}'`
    : "";
  const checkinSelect = userId ? `, CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as checked_in` : "";

  const sql = `
    SELECT
      p.*
      ${checkinSelect},
      (6371 * acos(
        cos(radians(?)) * cos(radians(p.lat)) *
        cos(radians(p.lng) - radians(?)) +
        sin(radians(?)) * sin(radians(p.lat))
      )) AS distance_km
    FROM places p
    ${checkinJoin}
    WHERE (6371 * acos(
        cos(radians(?1)) * cos(radians(p.lat)) *
        cos(radians(p.lng) - radians(?2)) +
        sin(radians(?3)) * sin(radians(p.lat))
      )) < ?4
    ${categoryFilter}
    ORDER BY distance_km ASC
    LIMIT 50
  `;

  const result = await db.prepare(sql).bind(...params).all<Place>();
  return result.results;
}

export function generateId(): string {
  return crypto.randomUUID();
}
