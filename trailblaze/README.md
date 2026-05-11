# 🗺️ Trailblaze

Discover cool places near you — adventures, views, hiking trails, caves, forests, and more.
Add places, check in when you visit, and earn points.

## Stack
- **Frontend**: React + Vite + Leaflet (OpenStreetMap)
- **Backend**: Cloudflare Workers + Hono
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Auth**: JWT (signed with Web Crypto API)

---

## Setup

### 1. Prerequisites
```bash
npm install -g wrangler
wrangler login
```

### 2. Create the D1 database
```bash
wrangler d1 create trailblaze-db
# Copy the database_id output into api/wrangler.toml
```

### 3. Install & run the API
```bash
cd api
npm install
npm run db:migrate:local      # Apply migrations locally
npm run dev                   # Starts on http://localhost:8787
```

### 4. Install & run the frontend
```bash
cd web
npm install
npm run dev                   # Starts on http://localhost:5173
```

The Vite dev server proxies `/api` → `localhost:8787` automatically.

---

## Deploy to Production

### API
```bash
cd api
npm run db:migrate            # Apply migrations to production D1
wrangler secret put JWT_SECRET
wrangler secret put CORS_ORIGIN   # Set to your Cloudflare Pages URL
npm run deploy
```

### Frontend (Cloudflare Pages)
```bash
cd web
npm run build
# Deploy via Cloudflare Pages dashboard or:
wrangler pages deploy dist --project-name trailblaze
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/users/register | ❌ | Register |
| POST | /api/users/login    | ❌ | Login |
| GET  | /api/users/me       | ✅ | Current user |
| GET  | /api/places/nearby  | ❌ | Find places near lat/lng |
| GET  | /api/places/:id     | ❌ | Get place details |
| POST | /api/places         | ✅ | Add a place (+10 pts) |
| POST | /api/checkins/:id   | ✅ | Check in to a place (+5 pts) |
| GET  | /api/checkins/my    | ✅ | User's visited places |

---

## Points System (Phase 1)
| Action | Points |
|--------|--------|
| Add a place | +10 |
| Check in to a place | +5 |

---

## Project Structure
```
trailblaze/
├── api/                    ← Cloudflare Worker
│   ├── src/
│   │   ├── index.ts        ← App entry, middleware wiring
│   │   ├── routes/
│   │   │   ├── users.ts    ← Register, login, me
│   │   │   ├── places.ts   ← Add place, find nearby
│   │   │   └── checkins.ts ← Check in, my visits
│   │   ├── db/
│   │   │   ├── index.ts    ← Haversine query, helpers
│   │   │   └── migrations/
│   │   │       └── 0001_init.sql
│   │   └── middleware/
│   │       └── auth.ts     ← JWT sign/verify
│   └── wrangler.toml
└── web/                    ← React + Vite
    └── src/
        ├── pages/
        │   ├── Home.tsx     ← Map + nearby list
        │   ├── AddPlace.tsx ← Add place form
        │   ├── Profile.tsx  ← Points + visited list
        │   └── Auth.tsx     ← Login / Register
        ├── components/
        │   ├── Map.tsx      ← Leaflet + OSM
        │   ├── PlaceCard.tsx
        │   └── Navbar.tsx
        ├── hooks/
        │   ├── useLocation.ts  ← Browser geolocation
        │   └── usePlaces.ts
        ├── store/auth.ts    ← Zustand auth state
        ├── api/client.ts    ← Typed API wrapper
        └── types/index.ts
```
