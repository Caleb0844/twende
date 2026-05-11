import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import users from "./routes/users";
import places from "./routes/places";
import checkins from "./routes/checkins";

export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  const allowed =
    origin.endsWith(".twende.pages.dev") ||
    origin === "https://twende.pages.dev" ||
    origin === "http://localhost:5173" ||
    origin === "http://localhost:8080";

  return cors({
    origin: allowed ? origin : "https://twende.pages.dev",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })(c, next);
});

app.get("/", (c) => c.json({ status: "ok", app: "Trailblaze API", version: "1.0.0" }));

app.route("/api/users", users);
app.route("/api/places", places);

app.use("/api/checkins/*", authMiddleware);
app.route("/api/checkins", checkins);
app.use("/api/users/me", authMiddleware);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
