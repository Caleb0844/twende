# Trailblaze / Twende — Project Handoff Document v3

## What is this app?
A location-based discovery app for Kenya where users find and share cool places — adventures, views, hiking trails, caves, forests, waterfalls etc. Users earn points for adding places and checking in. Built using the Spiral SDLC model.

---

## Current Status
**Phase 1 — COMPLETE ✅**
**Phase 2 — COMPLETE ✅**
**Phase 3 — COMPLETE ✅**
**Phase 4 — IN PROGRESS 🔄** (Auth done, email verification pending domain)
**Phase 5 — NOT STARTED**

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
| Frontend | React + Vite + TypeScript + Tailwind CSS v3 |
| Maps | Leaflet.js + OpenStreetMap |
| Backend | Cloudflare Workers + Hono framework |
| Database | Cloudflare D1 (SQLite) |
| Image Storage | Cloudinary (cloud: dsjttk61k, preset: twendephotos) |
| Auth | JWT + Google OAuth |
| Email | Resend (pending domain verification) |
| Deployment | Cloudflare Pages + Workers |
| PWA | vite-plugin-pwa |

---

## Project Structure
```
~/Desktop/twend/
├── trailblaze/
│   ├── api/                          ← Cloudflare Worker
│   │   ├── src/
│   │   │   ├── index.ts              ← Entry, CORS, routing
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           ← Register, login, Google OAuth, verify email, set usernames
│   │   │   │   ├── users.ts          ← /me endpoint
│   │   │   │   ├── places.ts         ← CRUD places, nearby, by user, Cloudinary delete
│   │   │   │   └── checkins.ts       ← Check in, my visits
│   │   │   ├── db/index.ts           ← Haversine query
│   │   │   └── middleware/auth.ts    ← JWT sign/verify
│   │   ├── migrations/
│   │   │   ├── 0001_init.sql
│   │   │   ├── 0002_add_images_county.sql
│   │   │   └── 0003_auth_updates.sql ← email_verified, google_id, public/personal username
│   │   └── wrangler.toml
│   └── web/
│       └── src/
│           ├── pages/
│           │   ├── Home.tsx          ← Explore + nearby, refreshes after add
│           │   ├── AddPlace.tsx      ← Add place + AuthSheet for unauth users
│           │   ├── EditPlace.tsx     ← Edit place details
│           │   ├── PlaceDetail.tsx   ← Full detail, compass, Google Maps, photos, AuthSheet
│           │   ├── Profile.tsx       ← Points, my places grid, visited list
│           │   ├── MyPlaces.tsx      ← Full list of added + visited
│           │   ├── Auth.tsx          ← Multi-step: login/register/verify/set-usernames
│           │   ├── AuthCallback.tsx  ← Handles Google OAuth + email verify redirects
│           │   └── Rankings.tsx      ← Placeholder
│           ├── components/
│           │   ├── BottomNav.tsx
│           │   ├── CategoryBadge.tsx
│           │   ├── PinMap.tsx        ← Leaflet map for dropping pin
│           │   ├── CompassModal.tsx  ← Vintage compass with real device orientation
│           │   ├── PhotoViewer.tsx   ← Fullscreen photo gallery with swipe
│           │   └── AuthSheet.tsx     ← Non-intrusive auth bottom sheet
│           ├── store/auth.ts         ← Reactive auth store
│           ├── hooks/use-auth.ts
│           └── lib/
│               ├── api.ts            ← Full API client + Cloudinary upload
│               └── data.ts           ← 47 Kenyan counties + categories
```

---

## Database Schema
```sql
users    — id, email, password, username, public_username, personal_username,
           google_id, email_verified, points, created_at
places   — id, user_id, name, description, category, county, lat, lng,
           address, images(JSON), created_at
checkins — id, user_id, place_id, checked_in_at (unique per user+place)
verification_tokens — id, user_id, token, type, expires_at, used, created_at
```

### Username fields
- `username` — unique @handle (shown as profile link)
- `public_username` / `personal_username` — display name (not unique, shown as "Added by")

---

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | ❌ | Register (auto-verified in test phase) |
| POST | /api/auth/login | ❌ | Login with email/username + password |
| GET | /api/auth/verify-email?token= | ❌ | Verify email (redirects to app) |
| POST | /api/auth/set-usernames | ❌ | Set display name + @username |
| POST | /api/auth/resend-verification | ❌ | Resend verification email |
| POST | /api/auth/check-username | ❌ | Check @username availability |
| GET | /api/auth/google | ❌ | Start Google OAuth flow |
| GET | /api/auth/google/callback | ❌ | Google OAuth callback |
| GET | /api/users/me | ✅ | Current user |
| GET | /api/places/nearby | ❌ | Find nearby places |
| GET | /api/places/user/:id | ❌ | Places added by user |
| GET | /api/places/:id | ❌ | Place details |
| POST | /api/places | ✅ | Add place (+10 pts) |
| PATCH | /api/places/:id | ✅ | Edit place |
| DELETE | /api/places/:id | ✅ | Delete place + Cloudinary images |
| POST | /api/checkins/:id | ✅ | Check in (+5 pts) |
| GET | /api/checkins/my | ✅ | My visited places |

---

## Cloudflare Worker Secrets
```
JWT_SECRET              — set via wrangler secret put
GOOGLE_CLIENT_ID        — Google OAuth client ID
GOOGLE_CLIENT_SECRET    — Google OAuth secret
RESEND_API_KEY          — re_3ZPwCH2D_... (needs domain verification for prod)
CLOUDINARY_API_KEY      — 392512745926453 (Root key)
CLOUDINARY_API_SECRET   — set via wrangler secret put
```

## wrangler.toml vars
```toml
CORS_ORIGIN = "https://twende.pages.dev"
CLOUDINARY_CLOUD_NAME = "dsjttk61k"
```

---

## Auth Flow

### Email signup
1. Register → auto-verified (test phase) → set display name + @username → explore
2. In production: register → verify email → set usernames → explore

### Google OAuth
1. Click "Continue with Google" → redirects to Google
2. Google → `/api/auth/google/callback` → creates/finds user
3. Redirects to `/auth/callback?token=...&needs_usernames=...&user_id=...`
4. If new user → `/login?step=set_usernames` → set usernames → explore
5. If returning user → explore

### Non-intrusive auth (AuthSheet)
- Tapping "Add Place" or "Mark as Visited" when not logged in shows a bottom sheet
- User can dismiss and keep browsing, or tap Sign In / Create Account

---

## Points System
| Action | Points |
|--------|--------|
| Add a place | +10 |
| Check in | +5 |
| Delete a place | -10 |

---

## Key Features Built
- ✅ Explore with location-based search
- ✅ Place detail with image gallery (fullscreen + swipe)
- ✅ Vintage compass with real device orientation
- ✅ Google Maps navigation
- ✅ Add/Edit/Delete places
- ✅ Cloudinary auto-delete on place removal
- ✅ Duplicate place detection (100m radius)
- ✅ Profile with my places + visited list
- ✅ MyPlaces full page
- ✅ AuthSheet (non-intrusive auth prompts)
- ✅ Google OAuth
- ✅ Password show/hide
- ✅ Remember me (30 days)
- ✅ Display name + unique @username
- ✅ PWA (installable)
- ✅ SPA routing fix

---

## Known Issues / TODO
- Email verification disabled in test phase (auto-verified). Re-enable when domain verified with Resend
- Rankings page is placeholder
- Public user profiles not built yet
- No password reset flow yet

---

## Phase 5 Ideas
- Rankings / leaderboard
- Public user profiles
- Password reset via email
- Place ratings / reviews
- Notifications
- Share place as link
- Report inappropriate places

---

## Cloudflare Account
- Email: calebmachariawachira@gmail.com
- Workers subdomain: twendeke.workers.dev
- Pages project: twende
- D1 database ID: 112764e0-74e2-460e-9c64-65568fd8c533

## Google OAuth
- Client ID: 3521626632-3mu64hk48foef4mmfnq146d1vcjl7vr4.apps.googleusercontent.com
- Redirect URI: https://trailblaze-api.twendeke.workers.dev/api/auth/google/callback

## Cloudinary
- Cloud name: dsjttk61k
- Upload preset: twendephotos (unsigned)
- API Key: 392512745926453 (Root)
