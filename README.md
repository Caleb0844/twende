# Trailblaze / Twende — Project Handoff Document

## What is this app?
A location-based app where users discover cool places near them (adventures, views, hiking trails, caves, forests, waterfalls etc). Users can add places and earn points, and mark places as visited to earn more points. Built using the Spiral SDLC model.

---

## Current Status
**Phase 1 — COMPLETE ✅**
**Phase 2 — NOT STARTED**

---

## Live URLs
| Service | URL |
|---------|-----|
| Frontend (Cloudflare Pages) | https://twende.pages.dev |
| Backend API (Cloudflare Workers) | https://trailblaze-api.twendeke.workers.dev |
| GitHub Repo | https://github.com/Caleb0844/twende |

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| Maps | Leaflet.js + OpenStreetMap (free, no API key) |
| State Management | Zustand |
| Backend | Cloudflare Workers + Hono framework |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (signed with Web Crypto API, no libraries) |
| Deployment | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| PWA | vite-plugin-pwa (app installable on phone) |

---

## Project Structure
```
~/Desktop/twend/trailblaze/
├── api/                          ← Cloudflare Worker (backend)
│   ├── src/
│   │   ├── index.ts              ← App entry, CORS, routing
│   │   ├── routes/
│   │   │   ├── users.ts          ← Register, login, /me
│   │   │   ├── places.ts         ← Add place, find nearby
│   │   │   └── checkins.ts       ← Check in, my visits
│   │   ├── db/
│   │   │   ├── index.ts          ← Haversine distance query
│   │   │   └── migrations/
│   │   │       └── 0001_init.sql ← DB schema
│   │   └── middleware/
│   │       └── auth.ts           ← JWT sign/verify
│   ├── migrations/
│   │   └── 0001_init.sql         ← Copy here for wrangler to find
│   ├── wrangler.toml             ← Cloudflare config
│   └── package.json
└── web/                          ← React frontend
    ├── public/
    │   ├── pwa-192x192.png       ← PWA icon
    │   └── pwa-512x512.png       ← PWA icon
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx          ← Map + nearby places list
    │   │   ├── AddPlace.tsx      ← Add place form
    │   │   ├── Profile.tsx       ← Points + visited places
    │   │   └── Auth.tsx          ← Login / Register
    │   ├── components/
    │   │   ├── Map.tsx           ← Leaflet + OSM map
    │   │   ├── PlaceCard.tsx     ← Place card with check-in button
    │   │   └── Navbar.tsx        ← Navigation bar
    │   ├── hooks/
    │   │   ├── useLocation.ts    ← Browser Geolocation API
    │   │   └── usePlaces.ts      ← Places state + API calls
    │   ├── store/
    │   │   └── auth.ts           ← Zustand auth store
    │   ├── api/
    │   │   └── client.ts         ← Typed API wrapper
    │   ├── types/
    │   │   └── index.ts          ← Shared TypeScript types
    │   ├── vite-env.d.ts         ← __API_URL__ global declaration
    │   ├── App.tsx               ← Router + layout
    │   └── main.tsx              ← Entry point
    ├── vite.config.ts            ← Vite + PWA config
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── package.json
```

---

## Database Schema
```sql
users    — id, username, email, password, points, created_at
places   — id, user_id, name, description, category, lat, lng, address, created_at
checkins — id, user_id, place_id, checked_in_at (unique per user+place)
```

### Place Categories
`adventure` | `view` | `hiking` | `cave` | `forest` | `waterfall` | `other`

---

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | ❌ | Health check |
| POST | /api/users/register | ❌ | Register new user |
| POST | /api/users/login | ❌ | Login |
| GET | /api/users/me | ✅ | Get current user |
| GET | /api/places/nearby?lat=&lng=&radius=&category= | ❌ | Find nearby places |
| GET | /api/places/:id | ❌ | Get place details |
| POST | /api/places | ✅ | Add a place (+10 pts) |
| POST | /api/checkins/:placeId | ✅ | Check in to place (+5 pts) |
| GET | /api/checkins/my | ✅ | Get user's visited places |

---

## Points System
| Action | Points |
|--------|--------|
| Add a place | +10 |
| Check in to a place | +5 |

---

## Important Config Details

### api/wrangler.toml
```toml
name = "trailblaze-api"
main = "src/index.ts"
compatibility_date = "2024-05-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "trailblaze-db"
database_id = "112764e0-74e2-460e-9c64-65568fd8c533"

[vars]
JWT_SECRET = "change-this-in-production"
CORS_ORIGIN = "https://twende.pages.dev"

[observability.logs]
enabled = true
```

### web/vite.config.ts key setting
```ts
__API_URL__: JSON.stringify("https://trailblaze-api.twendeke.workers.dev")
```
This is how the frontend knows the API URL in production.

### Known quirks
- Wrangler v3 is installed locally (older). Most commands work but use `npx wrangler` to run them.
- Migrations folder must be at `api/migrations/` (not `api/src/db/migrations/`) for wrangler v3 to find it.
- When deploying DB changes always use `--remote` flag: `npx wrangler d1 execute trailblaze-db --remote --file migrations/0001_init.sql`

---

## How to Run Locally
```bash
# Terminal 1 — API
cd ~/Desktop/twend/trailblaze/api
npm run dev                        # Runs on http://localhost:8787

# Terminal 2 — Frontend
cd ~/Desktop/twend/trailblaze/web
npm run dev                        # Runs on http://localhost:5173
```
Vite proxies `/api` → `localhost:8787` automatically in dev mode.

---

## How to Deploy
```bash
# Deploy API
cd ~/Desktop/twend/trailblaze/api
npx wrangler deploy

# Deploy Frontend
cd ~/Desktop/twend/trailblaze/web
npm run build
npx wrangler pages deploy dist --project-name twende
```

---

## Phase 1 Features (DONE ✅)
- User registration and login with JWT auth
- Add a place with GPS coordinates and category
- Find places nearby using Haversine distance formula
- Map view with color-coded pins per category (Leaflet + OpenStreetMap)
- Mark a place as visited (check-in)
- Points system (add place = +10, check in = +5)
- Profile page showing points and visited places
- Category filter on the explore page
- PWA support (installable on phone from browser)
- Deployed live on Cloudflare

---

## Phase 2 Ideas (NOT STARTED)
To be planned. Possible features:
- Photos on places
- Leaderboard
- Place ratings / reviews
- Search by name
- User profiles (public)
- Place verification system
- Badges / achievements
- Notifications

---

## Cloudflare Account
- Email: calebmachariawachira@gmail.com
- Workers subdomain: twendeke.workers.dev
- Pages project: twende
  
