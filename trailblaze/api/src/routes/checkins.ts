import { Hono } from "hono";
import { generateId } from "../db";
import { authMiddleware } from "../middleware/auth";

const checkins = new Hono<{ Bindings: Env }>();

const CHECKIN_POINTS = 5;

// POST /api/checkins/:placeId  (protected)
checkins.post("/:placeId", authMiddleware, async (c) => {
  const user = c.get("user") as { sub: string };
  const placeId = c.req.param("placeId");

  // Verify place exists
  const place = await c.env.DB.prepare(
    "SELECT id, name FROM places WHERE id = ?"
  ).bind(placeId).first<{ id: string; name: string }>();

  if (!place) return c.json({ error: "Place not found" }, 404);

  // Check if already checked in
  const existing = await c.env.DB.prepare(
    "SELECT id FROM checkins WHERE user_id = ? AND place_id = ?"
  ).bind(user.sub, placeId).first();

  if (existing) return c.json({ error: "You already checked in here!" }, 409);

  const id = generateId();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO checkins (id, user_id, place_id) VALUES (?, ?, ?)"
    ).bind(id, user.sub, placeId),

    c.env.DB.prepare(
      "UPDATE users SET points = points + ? WHERE id = ?"
    ).bind(CHECKIN_POINTS, user.sub),
  ]);

  return c.json({
    checkin: { id, user_id: user.sub, place_id: placeId },
    points_earned: CHECKIN_POINTS,
    message: `Checked in to "${place.name}"! You earned ${CHECKIN_POINTS} points.`
  }, 201);
});

// GET /api/checkins/my  (protected) — user's visited places
checkins.get("/my", authMiddleware, async (c) => {
  const user = c.get("user") as { sub: string };

  const result = await c.env.DB.prepare(
    `SELECT c.*, p.name, p.category, p.lat, p.lng
     FROM checkins c
     JOIN places p ON p.id = c.place_id
     WHERE c.user_id = ?
     ORDER BY c.checked_in_at DESC`
  ).bind(user.sub).all();

  return c.json({ checkins: result.results });
});

export default checkins;
