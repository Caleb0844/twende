import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, KENYAN_COUNTIES, type Category } from "@/lib/data";
import { Camera, MapPin, Pin, X, Loader2 } from "lucide-react";
import { api, uploadToCloudinary } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import AuthSheet from "@/components/AuthSheet";

const PinMap = lazy(() => import("@/components/PinMap"));
const MIN_IMAGES = 5;
const MAX_IMAGES = 17;

export default function AddPlace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [county, setCounty] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [locMode, setLocMode] = useState<"current" | "pin">("current");
  const [coords, setCoords] = useState({ lat: -1.2921, lng: 36.8219 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.slice(0, MAX_IMAGES - images.length).map((file) => ({ url: URL.createObjectURL(file), file }));
    setImages((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_, i) => i !== idx); });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Could not get your location")
    );
  }

  const missing = [
    !name.trim() && "Place name",
    !category && "Category",
    !county && "County",
    !description.trim() && "Description",
    images.length < MIN_IMAGES && `${MIN_IMAGES - images.length} more image(s)`,
  ].filter(Boolean);

  const valid = missing.length === 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Show auth sheet if not logged in
    if (!user) { setShowAuthSheet(true); return; }
    if (!valid) return;
    setUploading(true); setError(null);
    try {
      const imageUrls = await Promise.all(images.map((img) => uploadToCloudinary(img.file)));
      const result = await api.places.add({
        name, description,
        category: category.toLowerCase() as Category,
        county, lat: coords.lat, lng: coords.lng, images: imageUrls
      });
      setToast(result.message);
      setTimeout(() => navigate("/", { state: { refresh: Date.now() } }), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add place");
    } finally { setUploading(false); }
  }

  return (
    <>
      {showAuthSheet && (
        <AuthSheet
          message="Sign in to add a place and earn 10 points! 🗺️"
          onClose={() => setShowAuthSheet(false)}
        />
      )}

      <form onSubmit={submit} className="px-5 pt-12 pb-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Add a Place</h1>
          <p className="mt-1 text-sm text-muted-foreground">Share a hidden gem and earn points.</p>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <Field label="Place Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sheldrick Falls" className="input" />
          </Field>

          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="County">
            <select value={county} onChange={(e) => setCounty(e.target.value)} className="input">
              <option value="">Select a county</option>
              {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4} placeholder="What makes this place special?" className="input resize-none" />
          </Field>

          <Field label={`Images (${images.length}/${MAX_IMAGES} · min ${MIN_IMAGES})`}>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent transition">
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">Add</span>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                </label>
              )}
            </div>
            {images.length < MIN_IMAGES && (
              <p className="mt-1 text-xs text-muted-foreground">
                Add at least {MIN_IMAGES - images.length} more image(s)
              </p>
            )}
          </Field>

          <Field label="Location">
            <div className="mb-3 flex rounded-full border border-border bg-secondary p-1 text-sm font-semibold">
              <button type="button" onClick={() => setLocMode("current")}
                className={`flex-1 rounded-full py-2 transition ${locMode === "current" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <MapPin className="mr-1 inline h-4 w-4" /> Current
              </button>
              <button type="button" onClick={() => setLocMode("pin")}
                className={`flex-1 rounded-full py-2 transition ${locMode === "pin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                <Pin className="mr-1 inline h-4 w-4" /> Drop Pin
              </button>
            </div>
            {locMode === "current" ? (
              <button type="button" onClick={useMyLocation}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-info py-3 text-sm font-semibold text-info-foreground">
                <MapPin className="h-4 w-4" /> Use My Current Location
              </button>
            ) : (
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-secondary" />}>
                <PinMap value={coords} onChange={setCoords} />
              </Suspense>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          </Field>
        </div>

        {missing.length > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Still needed: {(missing as string[]).join(", ")}
          </p>
        )}

        <button type="submit" disabled={uploading}
          className="mt-8 w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none">
          {uploading
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span>
            : !user ? "Sign in to Add Place 🔒"
            : "Add Place · +10 pts 🎉"}
        </button>

        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg">
            {toast}
          </div>
        )}
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}