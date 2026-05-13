// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CATEGORIES, KENYAN_COUNTIES } from "@/lib/data";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function EditPlace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    county: "",
    address: "",
  });

  useEffect(() => {
    if (!id) return;
    api.places.get(id)
      .then((p) => {
        // Only owner can edit
        if (user && p.user_id !== user.id) {
          navigate("/profile");
          return;
        }
        setForm({
          name: p.name ?? "",
          description: p.description ?? "",
          category: p.category ?? "",
          county: p.county ?? "",
          address: p.address ?? "",
        });
      })
      .catch(() => navigate("/profile"))
      .finally(() => setLoading(false));
  }, [id, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.category || !form.county) {
      setError("Name, category and county are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.places.patch(id, {
        name: form.name,
        description: form.description || undefined,
        category: form.category.toLowerCase(),
        county: form.county,
        address: form.address || undefined,
      });
      navigate(`/place/${id}`);
    } catch (err) {
      setError(err.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="px-5 pt-6 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Place</h1>
          <p className="text-sm text-muted-foreground">Update the details below</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <Field label="Place Name">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Sheldrick Falls"
            maxLength={100}
            className="input"
          />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input">
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="County">
          <select value={form.county} onChange={(e) => set("county", e.target.value)} className="input">
            <option value="">Select a county</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="What makes this place special?"
            className="input resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {form.description.length}/500
          </p>
        </Field>

        <Field label="Address (optional)">
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="e.g. Aberdare National Park"
            maxLength={200}
            className="input"
          />
        </Field>
      </div>

      {/* Note about photos */}
      <div className="mt-5 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
        📸 Photos cannot be changed after uploading. To update photos, delete this place and re-add it.
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}