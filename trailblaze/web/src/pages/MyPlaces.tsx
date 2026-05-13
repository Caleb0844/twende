// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { normalizeCategory } from "@/lib/data";

export default function MyPlaces() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [added, setAdded] = useState([]);
  const [visited, setVisited] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.places.byUser(user.id),
      api.checkins.mine(),
    ]).then(([addedRes, visitedRes]) => {
      setAdded(addedRes.places);
      setVisited(visitedRes.checkins);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="flex min-h-screen items-center justify-center px-5 text-center">
      <div>
        <p className="text-4xl">👤</p>
        <p className="mt-3 font-bold">Sign in to view your places</p>
        <button onClick={() => navigate("/login")}
          className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Sign In
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/profile")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">My Places</h1>
      </div>

      {/* Places Added */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-muted-foreground uppercase tracking-wider text-xs">
          Places Added ({added.length})
        </h2>
        {added.length === 0 && (
          <p className="text-sm text-muted-foreground">You haven't added any places yet.</p>
        )}
        <div className="space-y-2">
          {added.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div className="min-w-0">
                <span className="truncate text-sm font-semibold text-foreground">{p.name}</span>
                <span className="text-sm text-muted-foreground"> · {p.county}</span>
                <span className="ml-2 text-xs text-muted-foreground">{normalizeCategory(p.category)}</span>
              </div>
              <Link to={`/place/${p.id}`}
                className="ml-3 shrink-0 text-xs font-bold text-accent underline-offset-2 hover:underline">
                View
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Places Visited */}
      <section>
        <h2 className="mb-3 text-base font-bold text-muted-foreground uppercase tracking-wider text-xs">
          Places Visited ({visited.length})
        </h2>
        {visited.length === 0 && (
          <p className="text-sm text-muted-foreground">You haven't visited any places yet.</p>
        )}
        <div className="space-y-2">
          {visited.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div className="min-w-0">
                <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                <span className="text-sm text-muted-foreground"> · {c.county}</span>
                <span className="ml-2 text-xs text-muted-foreground">{normalizeCategory(c.category)}</span>
              </div>
              <Link to={`/place/${c.place_id}`}
                className="ml-3 shrink-0 text-xs font-bold text-accent underline-offset-2 hover:underline">
                View
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}