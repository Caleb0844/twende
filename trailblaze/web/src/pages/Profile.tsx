// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { CategoryBadge } from "@/components/CategoryBadge";
import { normalizeCategory } from "@/lib/data";
import { LogOut, MapPin, Trash2 } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [visitedCount, setVisitedCount] = useState(0);
  const [myPlaces, setMyPlaces] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.checkins.mine().then((res) => setVisitedCount(res.checkins.length)).catch(() => {});
    api.places.byUser(user.id).then((res) => setMyPlaces(res.places)).catch(() => {});
  }, [user]);

  async function handleDelete(place) {
    if (!confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    setDeleting(place.id);
    try {
      await api.places.delete(place.id);
      setMyPlaces((prev) => prev.filter((p) => p.id !== place.id));
      setToast("Place deleted. -10 pts");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err.message ?? "Failed to delete");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(null);
    }
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

  return (
    <div className="px-5 pt-12 pb-8">
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

      <div className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Total Points</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold">{user.points}</span>
          <span className="text-sm opacity-70">pts</span>
        </div>
        <div className="mt-4 flex gap-6 text-sm opacity-90">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span><strong>{visitedCount}</strong> visited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span><strong>{myPlaces.length}</strong> added</span>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">My Places</h2>
        {myPlaces.length === 0 && (
          <p className="text-sm text-muted-foreground">You haven't added any places yet. Tap + to add one!</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {myPlaces.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/80 to-accent/60">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />}
                <button
                  onClick={() => handleDelete(p)}
                  disabled={deleting === p.id}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-destructive disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5 p-3">
                <h3 className="truncate text-sm font-bold">{p.name}</h3>
                <div className="flex items-center justify-between gap-1">
                  <CategoryBadge category={normalizeCategory(p.category)} />
                  <span className="truncate text-[10px] text-muted-foreground">{p.county}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <button
        onClick={() => { logout(); navigate("/"); }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border-2 border-destructive py-3 text-sm font-semibold text-destructive transition active:scale-[0.99]">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
