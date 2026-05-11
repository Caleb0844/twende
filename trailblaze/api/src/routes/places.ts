import { Hono } from "hono";
import { generateId, findNearbyPlaces } from "../db";
import { authMiddleware } from "../middleware/auth";

const places = new Hono<{ Bindings: Env }>();

const VALID_CATEGORIES = ["adventure", "view", "hiking", "cave", "forest", "waterfall", "other",
  "Adventure", "View", "Hiking", "Cave", "Forest", "Waterfall", "Other"];
const ADD_PLACE_POINTS = 10;

function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

places.get("/nearby", async (c) => {
  const lat = parseFloat(c.req.query("lat") ?? "");
  const lng = parseFloat(c.req.query("lng") ?? "");
  const radius = parseFloat(c.req.query("radius") ?? "25");
  const category = c.req.query("category");
  if (isNaN(lat) || isNaN(lng)) return c.json({ error: "lat and lng required" }, 400);

  let userId: string | undefined;
  try {
    const auth = c.req.header("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const { verifyJWT } = await import("../middleware/auth");
      const payload = await verifyJWT(auth.slice(7), c.env.JWT_SECRET);
      userId = payload?.sub;
    }
  } catch {}

  const nearby = await findNearbyPlaces(c.env.DB, lat, lng, radius, category, userId);
  const parsed = nearby.map((p: Record<string, unknown>) => ({ ...p, images: parseImages(p.images) }));
  return c.json({ places: parsed, count: parsed.length });
});

places.get("/:id", async (c) => {
  const place = await c.env.DB.prepare(
    `SELECT p.*, u.username as added_by,
      (SELECT COUNT(*) FROM checkins WHERE place_id = p.id) as checkin_count
     FROM places p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
  ).bind(c.req.param("id")).first<Record<string, unknown>>();
  if (!place) return c.json({ error: "Place not found" }, 404);
  return c.json({ ...place, images: parseImages(place.images) });
});

places.post("/", authMiddleware, async (c) => {
  const user = c.get("user") as { sub: string };
  const body = await c.req.json();
  const { name, description, category, county, lat, lng, address, images } = body;

  if (!name || !category || !county || lat == null || lng == null)
    return c.json({ error: "name, category, county, lat and lng are required" }, 400);
  if (!VALID_CATEGORIES.includes(category))
    return c.json({ error: "Invalid category" }, 400);

  const id = generateId();
  const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO places (id, user_id, name, description, category, county, lat, lng, address, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, user.sub, name, description ?? null, category, county, lat, lng, address ?? null, imagesJson),
    c.env.DB.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(ADD_PLACE_POINTS, user.sub),
  ]);

  return c.json({
    place: { id, user_id: user.sub, name, description, category, county, lat, lng, images: images ?? [] },
    points_earned: ADD_PLACE_POINTS,
    message: `Place added! You earned ${ADD_PLACE_POINTS} points. 🎉`,
  }, 201);
});

export default places;
