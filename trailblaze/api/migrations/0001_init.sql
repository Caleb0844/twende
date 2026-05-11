-- Migration: 0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,          -- UUID
  username    TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,             -- bcrypt hash
  points      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS places (
  id          TEXT PRIMARY KEY,          -- UUID
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,             -- adventure | view | hiking | cave | forest | other
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  address     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS checkins (
  id          TEXT PRIMARY KEY,          -- UUID
  user_id     TEXT NOT NULL,
  place_id    TEXT NOT NULL,
  checked_in_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, place_id),             -- one check-in per place per user
  FOREIGN KEY (user_id)  REFERENCES users(id),
  FOREIGN KEY (place_id) REFERENCES places(id)
);

-- Indexes for geo queries and lookups
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON places(lat, lng);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_checkins_user   ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_place  ON checkins(place_id);
