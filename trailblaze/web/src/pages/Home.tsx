import { Link } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { api, type Place } from "@/lib/api";
import { normalizeCategory } from "@/lib/data";
import { useLocation } from "react-router-dom";

export default function Home() {
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [locError, setLocError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const { places } = await api.places.nearby(lat, lng, 50);
      setPlaces(places);
    } catch { } finally { setLoading(false); }
  }, []);
  const location = useLocation();

useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoords(c); fetchNearby(c.lat, c.lng); },
      () => {}
    );
  }
}, [fetchNearby, location.state]);

  function useMyLocation() {
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    setLoading(true); setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoords(c); fetchNearby(c.lat, c.lng); },
      () => { setLocError("Could not get your location."); setLoading(false); }
    );
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoords(c); fetchNearby(c.lat, c.lng); },
        () => {}
      );
    }
  }, [fetchNearby]);

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.county?.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-5 pt-12">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Twende</p>
        <h1 className="text-3xl font-bold tracking-tight">Explore Kenya</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="search" placeholder="Search places, county, category..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:bg-background" />
      </div>

      <button onClick={useMyLocation} disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-info py-3 text-sm font-semibold text-info-foreground shadow-sm transition active:scale-[0.99] disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {loading ? "Finding places..." : "Use My Location"}
      </button>

      {locError && <p className="mt-2 text-center text-xs text-destructive">{locError}</p>}
      {coords && !loading && <p className="mt-1 text-center text-xs text-muted-foreground">Showing places within 50km · {filtered.length} found</p>}

      {filtered.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Nearby Places</h2>
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 no-scrollbar">
            {filtered.slice(0, 10).map((p) => (
              <Link key={p.id} to={`/place/${p.id}`} className="w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm block">
                <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/80 to-accent/60">
                  {p.images?.[0] && <img loading="lazy" src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
                </div>
                <div className="space-y-1.5 p-3">
                  <h3 className="truncate text-sm font-bold">{p.name}</h3>
                  <CategoryBadge category={normalizeCategory(p.category)} />
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span>{p.county}</span>
                    {p.distance_km != null && <span>{p.distance_km.toFixed(1)} km</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filtered.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">All Places</h2>
          <div className="space-y-3">
            {filtered.map((p) => (
              <Link key={p.id} to={`/place/${p.id}`} className="block">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/80 to-accent/60">
                    {p.images?.[0] && <img loading="lazy" src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <CategoryBadge category={normalizeCategory(p.category)} />
                      <span className="text-[11px] text-muted-foreground">{p.county}</span>
                    </div>
                  </div>
                  {p.distance_km != null && <span className="text-xs font-semibold text-muted-foreground">{p.distance_km.toFixed(1)} km</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-20 text-center">
          <p className="text-4xl">🗺️</p>
          <p className="mt-3 font-bold">No places found yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {coords ? "Be the first to add a place near you!" : "Tap 'Use My Location' to find places near you"}
          </p>
        </div>
      )}
    </div>
  );
}
