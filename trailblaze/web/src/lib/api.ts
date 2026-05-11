export const API_URL = "https://trailblaze-api.twendeke.workers.dev/api";

export type User = {
  id: string;
  username: string;
  email: string;
  points: number;
  created_at: string;
};

export type Place = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  county: string;
  lat: number;
  lng: number;
  address: string | null;
  images: string[];
  created_at: string;
  distance_km?: number;
  checked_in?: boolean;
  added_by?: string;
  checkin_count?: number;
};

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try { return JSON.parse(images); } catch { return []; }
  }
  return [];
}

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
    nearby: async (lat: number, lng: number, radius = 25, category?: string) => {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
      });
      if (category) params.set("category", category);
      const result = await request<{ places: Place[]; count: number }>(`/places/nearby?${params}`);
      return {
        ...result,
        places: result.places.map((p) => ({ ...p, images: parseImages(p.images) })),
      };
    },

    byUser: (userId: string) =>
      request<{ places: Place[] }>(`/places/user/${userId}`),

    delete: (placeId: string) =>
      request<{ message: string }>(`/places/${placeId}`, { method: "DELETE" }),

    get: async (id: string) => {
      const place = await request<Place>(`/places/${id}`);
      return { ...place, images: parseImages(place.images) };
    },

    add: (data: {
      name: string;
      description?: string;
      category: string;
      county: string;
      lat: number;
      lng: number;
      address?: string;
      images: string[];
    }) =>
      request<{ place: Place; points_earned: number; message: string }>("/places", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  checkins: {
    checkIn: (placeId: string) =>
      request<{ checkin: object; points_earned: number; message: string }>(
        `/checkins/${placeId}`,
        { method: "POST" }
      ),
    mine: () => request<{ checkins: Place[] }>("/checkins/my"),
  },
};

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "twendephotos");
  const res = await fetch("https://api.cloudinary.com/v1_1/dsjttk61k/image/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url as string;
}