// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import * as authStore from "@/store/auth";

type Step = "login" | "register" | "verify_email" | "set_usernames";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.17z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [pendingPassword, setPendingPassword] = useState(null);

  // Form state
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Handle query params (from email verify callback or Google)
  useEffect(() => {
    const stepParam = searchParams.get("step");
    const userId = searchParams.get("user_id");
    const mode = searchParams.get("mode");
    const errorParam = searchParams.get("error");

    if (errorParam === "google_failed") {
      setError("Google sign-in failed. Please try again.");
    }

    if (mode === "register") {
      setStep("register");
    }

    if (stepParam === "set_usernames" && userId) {
      setPendingUserId(userId);
      setStep("set_usernames");
    }
  }, [searchParams]);

  // Check username availability
  useEffect(() => {
    if (!username || username.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`${API_URL}/auth/check-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, user_id: pendingUserId }),
        });
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch { setUsernameAvailable(null); }
      finally { setCheckingUsername(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, pendingUserId]);

  const inputClass = "w-full rounded-2xl border border-border bg-secondary px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-background";

  function googleSignIn() {
    window.location.href = `${API_URL}/auth/google`;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);

      if (!data.email_verified) {
        // Not verified — send to verify screen
        setPendingEmail(emailOrUsername);
        setPendingPassword(password);
        setPendingUserId(data.user.id);
        setStep("verify_email");
        return;
      }

      if (data.needs_usernames) {
        setPendingUserId(data.user.id);
        setStep("set_usernames");
        return;
      }

      await authStore.initAuth();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPendingUserId(data.user_id);
      setPendingEmail(email);
      setPendingPassword(password);
      setStep("verify_email");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Email sent! Check your inbox and spam folder.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCheckVerified() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: pendingEmail, password: pendingPassword, rememberMe: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.email_verified) {
        setError("Email not verified yet. Check your inbox and spam folder.");
        return;
      }
      localStorage.setItem("token", data.token);
      setPendingUserId(data.user.id);
      setStep("set_usernames");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSetUsernames(e) {
    e.preventDefault();
    if (!usernameAvailable) { setError("Please choose an available @username"); return; }
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/set-usernames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: pendingUserId, display_name: displayName, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("token", data.token);
      await authStore.initAuth();
      navigate("/");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === "login" && "Welcome back"}
            {step === "register" && "Create account"}
            {step === "verify_email" && "Check your email"}
            {step === "set_usernames" && "Set up your profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "login" && "Sign in to explore Kenya"}
            {step === "register" && "Join Twende — discover hidden gems"}
            {step === "verify_email" && `We sent a verification link to ${pendingEmail}`}
            {step === "set_usernames" && "Just two more things and you're in!"}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" />{success}
          </div>
        )}

        {/* ── LOGIN ── */}
        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input className={inputClass} placeholder="Email or @username" value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)} autoComplete="username" />
            <div className="relative">
              <input className={inputClass} type={showPassword ? "text" : "password"} placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me for 30 days
            </label>
            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99] disabled:opacity-60">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Sign In"}
            </button>
            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="h-px flex-1 bg-border" />
            </div>
            <button type="button" onClick={googleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background py-4 text-sm font-semibold transition hover:bg-secondary active:scale-[0.99]">
              <GoogleIcon /> Continue with Google
            </button>
            <p className="text-center text-sm text-muted-foreground pt-2">
              No account?{" "}
              <button type="button" onClick={() => { setStep("register"); setError(null); setSuccess(null); }}
                className="font-bold text-primary">Sign up</button>
            </p>
          </form>
        )}

        {/* ── REGISTER ── */}
        {step === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input className={inputClass} type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <div className="relative">
              <input className={inputClass} type={showPassword ? "text" : "password"} placeholder="Password (min 6 characters)"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <input className={inputClass} type={showConfirm ? "text" : "password"} placeholder="Confirm password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-xs px-1 flex items-center gap-1 ${password === confirmPassword ? "text-green-600" : "text-destructive"}`}>
                {password === confirmPassword
                  ? <><CheckCircle className="h-3 w-3" /> Passwords match</>
                  : <><AlertCircle className="h-3 w-3" /> Passwords don't match</>}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99] disabled:opacity-60">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Continue →"}
            </button>
            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="h-px flex-1 bg-border" />
            </div>
            <button type="button" onClick={googleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background py-4 text-sm font-semibold transition hover:bg-secondary active:scale-[0.99]">
              <GoogleIcon /> Continue with Google
            </button>
            <p className="text-center text-sm text-muted-foreground pt-2">
              Have an account?{" "}
              <button type="button" onClick={() => { setStep("login"); setError(null); setSuccess(null); }}
                className="font-bold text-primary">Sign in</button>
            </p>
          </form>
        )}

        {/* ── VERIFY EMAIL ── */}
        {step === "verify_email" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">📧</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the link in your email to verify your account.<br />
              <span className="font-medium text-foreground">Don't see it? Check your spam folder.</span>
            </p>
            <button onClick={handleCheckVerified} disabled={loading}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg transition active:scale-[0.99] disabled:opacity-60">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "I've verified my email →"}
            </button>
            <button onClick={handleResend} disabled={loading}
              className="w-full rounded-full border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary transition">
              Resend verification email
            </button>
            <button onClick={() => { setStep("register"); setError(null); setSuccess(null); }}
              className="text-sm text-muted-foreground hover:underline underline-offset-2">
              ← Use a different email
            </button>
          </div>
        )}

        {/* ── SET USERNAMES ── */}
        {step === "set_usernames" && (
          <form onSubmit={handleSetUsernames} className="space-y-4">
            {/* Display name — not unique */}
            <div>
              <input className={inputClass} placeholder="Display name (e.g. Khalid)"
                value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
              <p className="mt-1 px-1 text-xs text-muted-foreground">
                Shown on places you add · Can be any name · Not unique
              </p>
            </div>

            {/* Unique @username */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">@</span>
                <input
                  className={`${inputClass} pl-8 pr-12`}
                  placeholder="unique_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                />
                {username.length >= 3 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {checkingUsername
                      ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      : usernameAvailable === true
                      ? <CheckCircle className="h-4 w-4 text-green-500" />
                      : usernameAvailable === false
                      ? <AlertCircle className="h-4 w-4 text-destructive" />
                      : null}
                  </div>
                )}
              </div>
              <p className="mt-1 px-1 text-xs text-muted-foreground">
                Your unique handle · Used to link to your public profile · Must be unique
                {usernameAvailable === false && <span className="text-destructive"> · Already taken</span>}
                {usernameAvailable === true && <span className="text-green-600"> · Available!</span>}
              </p>
            </div>

            {/* Preview */}
            {displayName && username && (
              <div className="rounded-2xl bg-secondary p-4 text-sm">
                <p className="text-muted-foreground text-xs mb-2 font-semibold uppercase tracking-wider">Preview on places:</p>
                <p className="text-foreground">
                  Added by <span className="font-bold">{displayName}</span>
                  <span className="text-muted-foreground"> · profile </span>
                  <span className="text-accent font-bold">@{username}</span>
                </p>
              </div>
            )}

            <button type="submit"
              disabled={loading || !usernameAvailable || !displayName.trim() || username.length < 3}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99] disabled:opacity-60">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Let's go 🗺️"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}