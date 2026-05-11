import { useState, useCallback } from "react";
import { api } from "../api/client";
import type { Place, Category } from "../types";

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(
    async (lat: number, lng: number, radius = 25, category?: Category) => {
      setLoading(true);
      setError(null);
      try {
        const { places } = await api.places.nearby(lat, lng, radius, category);
        setPlaces(places);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load places");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addPlace = useCallback(async (data: Parameters<typeof api.places.add>[0]) => {
    const result = await api.places.add(data);
    setPlaces((prev) => [result.place, ...prev]);
    return result;
  }, []);

  const checkIn = useCallback(async (placeId: string) => {
    const result = await api.checkins.checkIn(placeId);
    setPlaces((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, checked_in: true } : p))
    );
    return result;
  }, []);

  return { places, loading, error, fetchNearby, addPlace, checkIn };
}
