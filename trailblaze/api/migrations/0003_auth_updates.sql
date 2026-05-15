-- Add auth columns to users
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN public_username TEXT;
ALTER TABLE users ADD COLUMN personal_username TEXT;

-- Verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  token       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'email',  -- email | password_reset
  expires_at  TEXT NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
