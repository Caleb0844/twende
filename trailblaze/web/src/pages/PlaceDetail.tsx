// @ts-nocheck
import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Users, CheckCircle, Loader2, Trash2, Navigation, Map } from "lucide-react";
import { api } from "@/lib/api";
import { CategoryBadge } from "@/components/CategoryBadge";
import { normalizeCategory } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";

const CompassModal = lazy(() => import("@/components/CompassModal"));

function getBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

function getCardinal(deg) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
}

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [showCompass, setShowCompass] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.places.get(id)
      .then((p) => { setPlace(p); setCheckedIn(!!p.checked_in); })
      .catch((err) => console.error("Failed to load place:", err))
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [id]);

  async function handleCheckIn() {
    if (!user) { navigate("/login"); return; }
    setCheckingIn(true);
    try {
      const result = await api.checkins.checkIn(id);
      setCheckedIn(true);
      setPlace((prev) => prev ? { ...prev, checkin_count: (prev.checkin_count ?? 0) + 1 } : prev);
      setToast(result.message);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err.message ?? "Check-in failed");
      setTimeout(() => setToast(null), 3000);
    } finally { setCheckingIn(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.places.delete(id);
      navigate("/profile");
    } catch (err) {
      setToast(err.message ?? "Failed to delete");
      setTimeout(() => setToast(null), 3000);
      setDeleting(false);
    }
  }

  function openGoogleMaps() {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, "_blank");
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
        <button onClick={() => navigate("/")}
          className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Go Home
        </button>
      </div>
    </div>
  );

  const images = place.images ?? [];
  const isOwner = user && user.id === place.user_id;
  const bearing = userCoords ? getBearing(userCoords.lat, userCoords.lng, place.lat, place.lng) : null;
  const cardinal = bearing !== null ? getCardinal(bearing) : null;

  return (
    <div className="pb-24">
      {/* Compass modal */}
      {showCompass && bearing !== null && (
        <Suspense fallback={null}>
          <CompassModal
            placeLat={place.lat}
            placeLng={place.lng}
            bearing={bearing}
            cardinal={cardinal}
            distance={place.distance_km}
            placeName={place.name}
            onClose={() => setShowCompass(false)}
          />
        </Suspense>
      )}

      {/* Image gallery */}
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/80 to-accent/60">
          {images.length > 0 ? (
            <img loading="lazy" src={images[activeImg]} alt={place.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl opacity-30">🗺️</div>
          )}
        </div>

        <button onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {images.length > 1 && (
          <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {activeImg + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === activeImg ? "border-white" : "border-transparent opacity-60"}`}>
                <img loading="lazy" src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{place.name}</h1>
          <CategoryBadge category={normalizeCategory(place.category)} />
        </div>

        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{place.county}{place.address ? ` · ${place.address}` : ""}</span>
        </div>

        {/* Stats */}
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

        {/* Bearing + Navigate */}
        <div className="mt-4 flex gap-3">
          {/* Bearing — clickable to open compass */}
          <button
            onClick={() => bearing !== null && setShowCompass(true)}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition active:scale-[0.98]"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
              style={{ transform: bearing !== null ? `rotate(${bearing}deg)` : "none" }}
            >
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bearing</p>
              {bearing !== null ? (
                <p className="text-base font-bold">{cardinal} · {bearing}°</p>
              ) : (
                <p className="text-sm text-muted-foreground">Allow location</p>
              )}
            </div>
          </button>

          {/* Navigate */}
          <button onClick={openGoogleMaps}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition active:scale-[0.98]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10">
              <Map className="h-5 w-5 text-info" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigate</p>
              <p className="text-base font-bold">Google Maps</p>
            </div>
          </button>
        </div>

        {/* Added by */}
        {place.added_by && (
          <p className="mt-4 text-sm text-muted-foreground">
            Added by <span className="font-semibold text-foreground">@{place.added_by}</span>
          </p>
        )}

        {/* Description */}
        {place.description && (
          <p className="mt-4 text-sm leading-relaxed">{place.description}</p>
        )}

        {/* Check in */}
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

        {/* Delete — owner only */}
        {isOwner && (
          <button onClick={handleDelete} disabled={deleting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-destructive py-3 text-sm font-semibold text-destructive transition active:scale-[0.99] disabled:opacity-50">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Deleting..." : "Remove This Place"}
          </button>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}