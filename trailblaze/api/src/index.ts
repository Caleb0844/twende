// @ts-nocheck
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import users from "./routes/users";
import places from "./routes/places";
import checkins from "./routes/checkins";
import auth from "./routes/auth";

const app = new Hono();

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
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })(c, next);
});

app.get("/", (c) => c.json({ status: "ok", app: "Trailblaze API", version: "2.0.0" }));

// Auth middleware BEFORE protected routes
app.use("/api/users/me", authMiddleware);
app.use("/api/checkins/*", authMiddleware);

// Routes
app.route("/api/auth", auth);
app.route("/api/users", users);
app.route("/api/places", places);
app.route("/api/checkins", checkins);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;