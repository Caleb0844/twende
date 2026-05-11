// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Users, CheckCircle, Loader2 } from "lucide-react";
import { api, type Place } from "@/lib/api";
import { CategoryBadge } from "@/components/CategoryBadge";
import { normalizeCategory } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.places.get(id)
  .then((p) => {
    setPlace(p);
    setCheckedIn(!!p.checked_in);
  })
  .catch((err) => {
    console.error("Failed to load place:", err);
    setLoading(false);
  })
  .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleCheckIn() {
    if (!user) { navigate("/login"); return; }
    setCheckingIn(true);
    try {
      const result = await api.checkins.checkIn(id!);
      setCheckedIn(true);
      setPlace((prev) => prev ? { ...prev, checkin_count: (prev.checkin_count ?? 0) + 1 } : prev);
      setToast(result.message);
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Check-in failed");
      setTimeout(() => setToast(null), 3000);
    } finally { setCheckingIn(false); }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

    if (!loading && !place) return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <p className="text-4xl">😕</p>
          <p className="mt-3 font-bold">Place not found</p>
          <button onClick={() => navigate("/")} className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Go Home</button>
        </div>
      </div>
);

  const images = place!.images ?? [];

  return (
    <div className="pb-24">
      {/* Image gallery */}
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/80 to-accent/60">
          {images.length > 0 ? (
            <img src={images[activeImg]} alt={place.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl opacity-30">🗺️</div>
          )}
        </div>

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Image count badge */}
        {images.length > 1 && (
          <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {activeImg + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === activeImg ? "border-white" : "border-transparent opacity-60"}`}>
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Place info */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{place.name}</h1>
          <CategoryBadge category={normalizeCategory(place.category)} />
        </div>

        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{place.county}{place.address ? ` · ${place.address}` : ""}</span>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{place.checkin_count ?? 0}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> Visits
            </p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{images.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Photos</p>
          </div>
          {place.distance_km != null && (
            <>
              <div className="w-px bg-border" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold">{place.distance_km.toFixed(1)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">km away</p>
              </div>
            </>
          )}
        </div>

        {/* Added by */}
        {place.added_by && (
          <p className="mt-4 text-sm text-muted-foreground">
            Added by <span className="font-semibold text-foreground">@{place.added_by}</span>
          </p>
        )}

        {/* Description */}
        {place.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground">{place.description}</p>
        )}

        {/* Check in button */}
        <div className="mt-6">
          {checkedIn ? (
            <div className="flex items-center justify-center gap-2 rounded-full bg-green-50 py-4 text-sm font-bold text-green-600">
              <CheckCircle className="h-5 w-5" /> You've visited this place!
            </div>
          ) : (
            <button onClick={handleCheckIn} disabled={checkingIn}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.99] disabled:opacity-60">
              {checkingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {checkingIn ? "Checking in..." : "Mark as Visited · +5 pts"}
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}