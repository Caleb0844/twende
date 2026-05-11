import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Twende</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back 👋" : "Join Twende 🗺️"}
          </h1>
        </div>

        {error && <div className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <input className="input" placeholder="Username" value={form.username} onChange={(e) => set("username", e.target.value)} />
          )}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} />

          <button type="submit" disabled={isLoading}
            className="mt-2 w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.99] disabled:opacity-60">
            {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? "No account? " : "Already have one? "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-bold text-primary">
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
