import { api, type User } from "@/lib/api";

// Simple reactive store without zustand (avoids SSR issues)
type Listener = () => void;

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

const listeners = new Set<Listener>();
let state: AuthState = {
  user: null,
  token: null,
  isLoading: false,
};

function setState(partial: Partial<AuthState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export async function initAuth() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;
  setState({ isLoading: true });
  try {
    const user = await api.auth.me();
    setState({ user, token, isLoading: false });
  } catch {
    localStorage.removeItem("token");
    setState({ user: null, token: null, isLoading: false });
  }
}

export async function login(email: string, password: string) {
  setState({ isLoading: true });
  const { token, user } = await api.auth.login(email, password);
  localStorage.setItem("token", token);
  setState({ user, token, isLoading: false });
}

export async function register(username: string, email: string, password: string) {
  setState({ isLoading: true });
  const { token, user } = await api.auth.register(username, email, password);
  localStorage.setItem("token", token);
  setState({ user, token, isLoading: false });
}

export function logout() {
  localStorage.removeItem("token");
  setState({ user: null, token: null });
}
