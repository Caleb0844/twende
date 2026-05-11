import type { Place, User, Checkin, Category } from "../types";

const BASE = "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers ?? {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

// Auth
export const api = {
  auth: {
    register: (username: string, email: string, password: string) =>
      request<{ token: string; user: User }>("/users/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      }),

    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    me: () => request<User>("/users/me"),
  },

  places: {
    nearby: (lat: number, lng: number, radius = 25, category?: Category) => {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
      if (category) params.set("category", category);
      return request<{ places: Place[]; count: number }>(`/places/nearby?${params}`);
    },

    get: (id: string) => request<Place>(`/places/${id}`),

    add: (data: {
      name: string;
      description?: string;
      category: Category;
      lat: number;
      lng: number;
      address?: string;
    }) =>
      request<{ place: Place; points_earned: number; message: string }>("/places", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  checkins: {
    checkIn: (placeId: string) =>
      request<{ checkin: Checkin; points_earned: number; message: string }>(`/checkins/${placeId}`, {
        method: "POST",
      }),

    mine: () => request<{ checkins: Checkin[] }>("/checkins/my"),
  },
};
