import { API_URL } from "@/lib/api";

export type User = {
  id: string;
  email: string;
  username: string;
  public_username: string | null;
  personal_username: string | null;
  points: number;
  email_verified: boolean;
};

type Listener = () => void;
type AuthState = { user: User | null; token: string | null; isLoading: boolean; };
const listeners = new Set<Listener>();
let state: AuthState = { user: null, token: null, isLoading: false };

function setState(partial: Partial<AuthState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() { return state; }

export async function initAuth() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;
  setState({ isLoading: true });
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Invalid token");
    const user = await res.json();
    setState({ user, token, isLoading: false });
  } catch {
    localStorage.removeItem("token");
    setState({ user: null, token: null, isLoading: false });
  }
}

export async function login(emailOrUsername: string, password: string, rememberMe = true) {
  setState({ isLoading: true });
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername, password, rememberMe }),
  });
  const data = await res.json();
  if (!res.ok) { setState({ isLoading: false }); throw new Error(data.error); }
  localStorage.setItem("token", data.token);
  setState({ user: data.user, token: data.token, isLoading: false });
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  setState({ user: null, token: null });
}