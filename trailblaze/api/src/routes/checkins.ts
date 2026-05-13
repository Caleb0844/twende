// @ts-nocheck
import { Hono } from "hono";
import { generateId } from "../db";
import { authMiddleware } from "../middleware/auth";

const checkins = new Hono();
const CHECKIN_POINTS = 5;

// POST /api/checkins/:placeId
checkins.post("/:placeId", authMiddleware, async (c) => {
  const userId = c.get("user").sub;
  const placeId = c.req.param("placeId");

  const place = await c.env.DB.prepare(
    "SELECT id, name FROM places WHERE id = ?"
  ).bind(placeId).first();

  if (!place) return c.json({ error: "Place not found" }, 404);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM checkins WHERE user_id = ? AND place_id = ?"
  ).bind(userId, placeId).first();

  if (existing) return c.json({ error: "You already checked in here!" }, 409);

  const id = generateId();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO checkins (id, user_id, place_id) VALUES (?, ?, ?)"
    ).bind(id, userId, placeId),
    c.env.DB.prepare(
      "UPDATE users SET points = points + ? WHERE id = ?"
    ).bind(CHECKIN_POINTS, userId),
  ]);

  return c.json({
    checkin: { id, user_id: userId, place_id: placeId },
    points_earned: CHECKIN_POINTS,
    message: `Checked in to "${place.name}"! You earned ${CHECKIN_POINTS} points.`
  }, 201);
});

// GET /api/checkins/my
checkins.get("/my", authMiddleware, async (c) => {
  const userId = c.get("user").sub;

  const result = await c.env.DB.prepare(
    `SELECT c.id, c.place_id, c.checked_in_at,
            p.name, p.category, p.county, p.lat, p.lng, p.images
     FROM checkins c
     JOIN places p ON p.id = c.place_id
     WHERE c.user_id = ?
     ORDER BY c.checked_in_at DESC`
  ).bind(userId).all();

  const checkins = result.results.map((r) => ({
    ...r,
    images: (() => {
      try { return JSON.parse(r.images ?? "[]"); } catch { return []; }
    })(),
  }));

  return c.json({ checkins });
});

export default checkins;