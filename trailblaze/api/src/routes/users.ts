import { Hono } from "hono";
import { generateId } from "../db";
import { signJWT } from "../middleware/auth";

const users = new Hono<{ Bindings: Env }>();

// Simple password hashing using Web Crypto (SHA-256 + salt)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(salt + password)
  );
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const check = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(salt + password)
  );
  const checkHex = Array.from(new Uint8Array(check))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return checkHex === hash;
}

// POST /api/users/register
users.post("/register", async (c) => {
  const { username, email, password } = await c.req.json();

  if (!username || !email || !password) {
    return c.json({ error: "username, email and password are required" }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ? OR username = ?"
  ).bind(email, username).first();

  if (existing) return c.json({ error: "Email or username already taken" }, 409);

  const id = generateId();
  const hashed = await hashPassword(password);

  await c.env.DB.prepare(
    "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)"
  ).bind(id, username, email, hashed).run();

  const token = await signJWT({ sub: id, username }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, username, email, points: 0 } }, 201);
});

// POST /api/users/login
users.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) return c.json({ error: "Email and password required" }, 400);

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).bind(email).first<{ id: string; username: string; email: string; password: string; points: number }>();

  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const token = await signJWT({ sub: user.id, username: user.username }, c.env.JWT_SECRET);
  return c.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, points: user.points }
  });
});

// GET /api/users/me  (protected — called with token)
users.get("/me", async (c) => {
  const authUser = c.get("user") as { sub: string };
  const user = await c.env.DB.prepare(
    "SELECT id, username, email, points, created_at FROM users WHERE id = ?"
  ).bind(authUser.sub).first();

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

export default users;
