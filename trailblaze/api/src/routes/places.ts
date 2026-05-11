// @ts-nocheck
import { Hono } from "hono";
import { generateId, findNearbyPlaces } from "../db";
import { authMiddleware } from "../middleware/auth";

const places = new Hono();

const VALID_CATEGORIES = [
  "adventure", "view", "hiking", "cave", "forest", "waterfall", "other",
  "Adventure", "View", "Hiking", "Cave", "Forest", "Waterfall", "Other",
];
const ADD_PLACE_POINTS = 10;

function parseImages(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

// GET /api/places/nearby
places.get("/nearby", async (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "");
  const lng = parseFloat(c.req.query("lng") ?? "");
  const radius = parseFloat(c.req.query("radius") ?? "25");
  const category = c.req.query("category");
  if (isNaN(lat) || isNaN(lng)) return c.json({ error: "lat and lng required" }, 400);

  let userId;
  try {
    const auth = c.req.header("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const { verifyJWT } = await import("../middleware/auth");
      const payload = await verifyJWT(auth.slice(7), c.env.JWT_SECRET);
      userId = payload?.sub;
    }
  } catch {}

  const nearby = await findNearbyPlaces(c.env.DB, lat, lng, radius, category, userId);
  const parsed = nearby.map((p) => ({ ...p, images: parseImages(p.images) }));
  return c.json({ places: parsed, count: parsed.length });
});

// GET /api/places/user/:userId — must come before /:id
places.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const result = await c.env.DB.prepare(
    "SELECT * FROM places WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();

  const parsed = result.results.map((p) => ({ ...p, images: parseImages(p.images) }));
  return c.json({ places: parsed });
});

// GET /api/places/:id
places.get("/:id", async (c) => {
  const place = await c.env.DB.prepare(
    `SELECT p.*, u.username as added_by,
      (SELECT COUNT(*) FROM checkins WHERE place_id = p.id) as checkin_count
     FROM places p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
  ).bind(c.req.param("id")).first();
  if (!place) return c.json({ error: "Place not found" }, 404);
  return c.json({ ...place, images: parseImages(place.images) });
});

// POST /api/places
places.post("/", authMiddleware, async (c) => {
  const userId = c.get("user").sub;
  const body = await c.req.json();
  const { name, description, category, county, lat, lng, address, images } = body;

  if (!name || !category || !county || lat == null || lng == null)
    return c.json({ error: "name, category, county, lat and lng are required" }, 400);
  if (!VALID_CATEGORIES.includes(category))
    return c.json({ error: "Invalid category" }, 400);

  // Check for duplicate within 100 meters
  const duplicate = await c.env.DB.prepare(`
    SELECT id, name FROM places
    WHERE lower(category) = lower(?)
    AND (6371000 * acos(
      cos(radians(?)) * cos(radians(lat)) *
      cos(radians(lng) - radians(?)) +
      sin(radians(?)) * sin(radians(lat))
    )) < 100
  `).bind(category, lat, lng, lat).first();

  if (duplicate) {
    return c.json({
      error: `A similar place "${duplicate.name}" already exists within 100 meters.`
    }, 409);
  }

  const id = generateId();
  const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO places (id, user_id, name, description, category, county, lat, lng, address, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, name, description ?? null, category, county, lat, lng, address ?? null, imagesJson),
    c.env.DB.prepare(
      "UPDATE users SET points = points + ? WHERE id = ?"
    ).bind(ADD_PLACE_POINTS, userId),
  ]);

  return c.json({
    place: { id, user_id: userId, name, description, category, county, lat, lng, images: images ?? [] },
    points_earned: ADD_PLACE_POINTS,
    message: `Place added! You earned ${ADD_PLACE_POINTS} points. 🎉`,
  }, 201);
});

// DELETE /api/places/:id
places.delete("/:id", authMiddleware, async (c) => {
  const userId = c.get("user").sub;
  const placeId = c.req.param("id");

  const place = await c.env.DB.prepare(
    "SELECT id, user_id FROM places WHERE id = ?"
  ).bind(placeId).first();

  if (!place) return c.json({ error: "Place not found" }, 404);
  if (place.user_id !== userId) return c.json({ error: "Not your place" }, 403);

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM checkins WHERE place_id = ?").bind(placeId),
    c.env.DB.prepare("DELETE FROM places WHERE id = ?").bind(placeId),
    c.env.DB.prepare("UPDATE users SET points = points - 10 WHERE id = ?").bind(userId),
  ]);

  return c.json({ message: "Place deleted" });
});

export default places;