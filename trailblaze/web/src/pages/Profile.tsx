// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { CategoryBadge } from "@/components/CategoryBadge";
import { normalizeCategory } from "@/lib/data";
import { LogOut, MapPin, Pencil, Trash2, Loader2, ChevronRight } from "lucide-react";

const PREVIEW_LIMIT = 10;

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myPlaces, setMyPlaces] = useState([]);
  const [visited, setVisited] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.places.byUser(user.id).then((res) => setMyPlaces(res.places)).catch(() => {});
    api.checkins.mine().then((res) => setVisited(res.checkins)).catch(() => {});
  }, [user]);

  async function handleDelete(e, place) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    setDeleting(place.id);
    try {
      await api.places.delete(place.id);
      setMyPlaces((prev) => prev.filter((p) => p.id !== place.id));
      setToast("Place deleted · -10 pts");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err.message ?? "Failed to delete");
      setTimeout(() => setToast(null), 3000);
    } finally { setDeleting(null); }
  }

  if (!user) return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-4xl">👤</p>
      <p className="mt-3 font-bold">Sign in to view your profile</p>
      <button onClick={() => navigate("/login")}
        className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
        Sign In
      </button>
    </div>
  );

  const visitedPreview = visited.slice(0, PREVIEW_LIMIT);
  const hasMoreVisited = visited.length > PREVIEW_LIMIT;

  return (
    <div className="px-5 pt-12 pb-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">@{user.username}</h1>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </header>

      {/* Points card */}
      <div className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Total Points</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold">{user.points}</span>
          <span className="text-sm opacity-70">pts</span>
        </div>
        <div className="mt-4 flex gap-6 text-sm opacity-90">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span><strong>{visited.length}</strong> visited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span><strong>{myPlaces.length}</strong> added</span>
          </div>
        </div>
      </div>

      {/* My Added Places */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">My Places</h2>
          {myPlaces.length > 0 && (
            <Link to="/my-places" className="text-xs font-semibold text-accent">See all</Link>
          )}
        </div>
        {myPlaces.length === 0 && (
          <p className="text-sm text-muted-foreground">You haven't added any places yet. Tap + to add one!</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {myPlaces.slice(0, 4).map((p) => (
            <Link key={p.id} to={`/place/${p.id}`}
              className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/80 to-accent/60">
                {p.images?.[0] && (
                  <img loading="lazy" src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                )}
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit/${p.id}`); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, p)}
                    disabled={deleting === p.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-destructive shadow disabled:opacity-50">
                    {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 p-3">
                <h3 className="truncate text-sm font-bold">{p.name}</h3>
                <div className="flex items-center justify-between gap-1">
                  <CategoryBadge category={normalizeCategory(p.category)} />
                  <span className="truncate text-[10px] text-muted-foreground">{p.county}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {myPlaces.length > 4 && (
          <Link to="/my-places"
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-muted-foreground">
            View all {myPlaces.length} places <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      {/* Places Visited */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Places Visited</h2>
          {hasMoreVisited && (
            <Link to="/my-places" className="text-xs font-semibold text-accent">See all</Link>
          )}
        </div>

        {visited.length === 0 && (
          <p className="text-sm text-muted-foreground">No visited places yet. Go explore!</p>
        )}

        <div className="space-y-2">
          {visitedPreview.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground">{c.name}</span>
                <span className="text-sm text-muted-foreground"> · {c.county}</span>
              </div>
              <Link to={`/place/${c.place_id}`}
                className="ml-3 shrink-0 text-xs font-bold text-accent">
                View →
              </Link>
            </div>
          ))}
        </div>

        {hasMoreVisited && (
          <Link to="/my-places"
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-muted-foreground">
            {visited.length - PREVIEW_LIMIT} more places <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      {/* Sign out */}
      <button onClick={() => { logout(); navigate("/"); }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border-2 border-destructive py-3 text-sm font-semibold text-destructive transition active:scale-[0.99]">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}