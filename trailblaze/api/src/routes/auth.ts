// @ts-nocheck
import { Hono } from "hono";
import { signJWT } from "../middleware/auth";
import { generateId } from "../db";

const auth = new Hono();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function hashPassword(password) {
  const salt = crypto.randomUUID();
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + password));
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
  return `${salt}:${hex}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const check = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + password));
  const hex = Array.from(new Uint8Array(check)).map(b => b.toString(16).padStart(2,"0")).join("");
  return hex === hash;
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function sendVerificationEmail(email, username, token, resendKey) {
  const verifyUrl = `https://trailblaze-api.twendeke.workers.dev/api/auth/verify-email?token=${token}`;
  
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Twende <onboarding@resend.dev>",
      to: email,
      subject: "Verify your Twende email",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h1 style="color:#1e293b;font-size:24px;margin-bottom:8px;">Welcome to Twende 🗺️</h1>
          <p style="color:#64748b;margin-bottom:24px;">Hi ${username}, please verify your email to start discovering places.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1e293b;color:white;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;">
            Verify Email
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        </div>
      `,
    }),
  });
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// POST /api/auth/register — step 1: email + password
auth.post("/register", async (c) => {
  const { email, password, confirmPassword } = await c.req.json();

  if (!email || !password) return c.json({ error: "Email and password required" }, 400);
  if (password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);
  if (password !== confirmPassword) return c.json({ error: "Passwords do not match" }, 400);

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const id = generateId();
  const hashed = await hashPassword(password);

  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password, username, points, email_verified) VALUES (?, ?, ?, ?, 0, 1)"
  ).bind(id, email, hashed, email.split("@")[0]).run();

  // Send verification email
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await c.env.DB.prepare(
    "INSERT INTO verification_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, 'email', ?)"
  ).bind(generateId(), id, token, expiresAt).run();

  await sendVerificationEmail(email, email.split("@")[0], token, c.env.RESEND_API_KEY);

  return c.json({ 
    message: "Verification email sent. Please check your inbox.",
    user_id: id,
    next: "verify_email"
  }, 201);
});

// POST /api/auth/set-usernames — step 2: set usernames after verification
auth.post("/set-usernames", async (c) => {
  const { user_id, display_name, username } = await c.req.json();

  if (!user_id || !display_name || !username)
    return c.json({ error: "All fields required" }, 400);

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return c.json({ error: "Username must be 3-20 characters, letters/numbers/underscores only" }, 400);

  const taken = await c.env.DB.prepare(
    "SELECT id FROM users WHERE username = ? AND id != ?"
  ).bind(username, user_id).first();
  if (taken) return c.json({ error: "Username already taken" }, 409);

  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user_id).first();
  if (!user) return c.json({ error: "User not found" }, 404);

  await c.env.DB.prepare(
    "UPDATE users SET username = ?, public_username = ?, personal_username = ? WHERE id = ?"
  ).bind(username, display_name, display_name, user_id).run();

  const token = await signJWT({ sub: user_id, username }, c.env.JWT_SECRET);
  const updatedUser = await c.env.DB.prepare(
    "SELECT id, email, username, public_username, personal_username, points, email_verified FROM users WHERE id = ?"
  ).bind(user_id).first();

  return c.json({ token, user: updatedUser });
});

// GET /api/auth/verify-email?token=
auth.get("/verify-email", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.text("Invalid link", 400);

  const record = await c.env.DB.prepare(
    "SELECT * FROM verification_tokens WHERE token = ? AND type = 'email' AND used = 0"
  ).bind(token).first();

  if (!record) return c.html(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2>❌ Invalid or expired link</h2>
      <p>This verification link has already been used or has expired.</p>
    </body></html>
  `, 400);

  if (new Date(record.expires_at) < new Date()) return c.html(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2>⏰ Link expired</h2>
      <p>Please sign up again to get a new verification email.</p>
    </body></html>
  `, 400);

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").bind(record.user_id),
    c.env.DB.prepare("UPDATE verification_tokens SET used = 1 WHERE id = ?").bind(record.id),
  ]);

  return c.html(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f8fafc;">
      <div style="max-width:400px;margin:0 auto;background:white;padding:40px;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <h1 style="font-size:48px;margin:0;">✅</h1>
        <h2 style="color:#1e293b;margin:16px 0 8px;">Email Verified!</h2>
        <p style="color:#64748b;">Your email has been verified. You can now go back to the app and complete your profile.</p>
        <a href="https://twende.pages.dev" style="display:inline-block;margin-top:24px;background:#1e293b;color:white;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;">
          Open Twende
        </a>
      </div>
    </body></html>
  `);
});

// POST /api/auth/login
auth.post("/login", async (c) => {
  const { emailOrUsername, password, rememberMe } = await c.req.json();

  if (!emailOrUsername || !password) return c.json({ error: "Email/username and password required" }, 400);

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE email = ? OR public_username = ? OR username = ?"
  ).bind(emailOrUsername, emailOrUsername, emailOrUsername).first();

  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  // Allow login even if not verified, but flag it
  const expiresIn = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days
  const token = await signJWT({ sub: user.id, username: user.public_username || user.username }, c.env.JWT_SECRET, expiresIn);

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.public_username || user.username,
      public_username: user.public_username,
      personal_username: user.personal_username,
      points: user.points,
      email_verified: !!user.email_verified,
    },
    needs_usernames: !user.public_username,
  });
});

// POST /api/auth/resend-verification
auth.post("/resend-verification", async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: "Email required" }, 400);

  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user) return c.json({ error: "No account with that email" }, 404);
  if (user.email_verified) return c.json({ error: "Email already verified" }, 400);

  // Invalidate old tokens
  await c.env.DB.prepare(
    "UPDATE verification_tokens SET used = 1 WHERE user_id = ? AND type = 'email'"
  ).bind(user.id).run();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await c.env.DB.prepare(
    "INSERT INTO verification_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, 'email', ?)"
  ).bind(generateId(), user.id, token, expiresAt).run();

  await sendVerificationEmail(email, user.username, token, c.env.RESEND_API_KEY);
  return c.json({ message: "Verification email resent" });
});

// GET /api/auth/google — redirect to Google
auth.get("/google", async (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: "https://trailblaze-api.twendeke.workers.dev/api/auth/google/callback",
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback
auth.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.redirect("https://twende.pages.dev/login?error=google_failed");

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://trailblaze-api.twendeke.workers.dev/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return c.redirect("https://twende.pages.dev/login?error=google_failed");

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Find or create user
    let user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE google_id = ? OR email = ?"
    ).bind(profile.id, profile.email).first();

    if (!user) {
      const id = generateId();
      const baseUsername = profile.name?.replace(/\s+/g, "").toLowerCase().slice(0, 15) || profile.email.split("@")[0];
      await c.env.DB.prepare(
        "INSERT INTO users (id, email, password, username, google_id, email_verified, points) VALUES (?, ?, '', ?, ?, 1, 0)"
      ).bind(id, profile.email, baseUsername, profile.id).run();
      user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    } else if (!user.google_id) {
      await c.env.DB.prepare("UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?")
        .bind(profile.id, user.id).run();
    }

    const jwtToken = await signJWT({ sub: user.id, username: user.public_username || user.username }, c.env.JWT_SECRET);
    const needsUsernames = !user.public_username;

    // Redirect to frontend with token
    return c.redirect(
      `https://twende.pages.dev/auth/callback?token=${jwtToken}&needs_usernames=${needsUsernames}&user_id=${user.id}`
    );
  } catch (e) {
    console.error("Google OAuth error:", e);
    return c.redirect("https://twende.pages.dev/login?error=google_failed");
  }
});

// POST /api/auth/check-username
auth.post("/check-username", async (c) => {
  const { username } = await c.req.json();
  if (!username) return c.json({ available: false });
  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE public_username = ?"
  ).bind(username).first();
  return c.json({ available: !existing });
});

export default auth;