# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this is

The frontend dashboard and mobile app for the WhatsApp AI CRM platform. React 19 + TypeScript (Vite), deployed as a PWA and packaged as iOS/Android apps via Capacitor. It also contains a legacy Express.js server that is being phased out in favour of the Spring Boot backend.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19.2.6, TypeScript 6, Vite 8 |
| Mobile | Capacitor 8.4.1 (iOS + Android) |
| PWA | vite-plugin-pwa + Workbox |
| Routing | React Router 6 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP | Axios |
| Testing | MSW 2 (mock service worker), Playwright |
| Legacy backend | Express 5 + better-sqlite3 (SQLite at `data/crm.db`) |

---

## Commands

```bash
npm install                     # Install all deps (frontend + server)

# Development
npm run dev                     # Vite only — port 5173, all API proxied to Spring Boot :8080
npm run server:dev              # Express legacy server only — port 3001, tsx watch
npm run dev:all                 # Both concurrently

# Production build
npm run build                   # tsc -b && vite build → dist/

# Lint
npm run lint                    # eslint .

# Mobile (requires Android Studio / Xcode)
npm run cap:sync                # Sync dist/ to android/ and ios/ native projects
npm run cap:android             # Open Android Studio
npm run cap:ios                 # Open Xcode
npm run generate-icons          # Generate icon PNGs from source SVG
```

---

## API routing — important

In **dev mode** (Vite dev server), all API calls go to Spring Boot:

```ts
// vite.config.ts
server: {
  proxy: {
    '/api/v1': { target: 'http://localhost:8080', changeOrigin: true },
    '/api':    { target: 'http://localhost:8080', changeOrigin: true },
  },
}
```

Both prefixes point to Spring Boot (`localhost:8080`). The Express server on port 3001 is **not reached by the frontend in dev mode**.

In **Docker/production** (nginx serves the built dist/), routing splits differently — see root `docker-compose.yml`. The Express server still runs there as a legacy service.

---

## Frontend structure

```
src/
├── pages/                      Route-level components (one file per route)
│   ├── Login.tsx, Onboarding.tsx
│   ├── Dashboard.tsx, Inbox.tsx, Contacts.tsx, Bookings.tsx
│   ├── Campaigns.tsx, Analytics.tsx, Documents.tsx
│   ├── ContentStudio.tsx, Approvals.tsx, Calendar.tsx
│   ├── Trends.tsx, Leads.tsx, Platforms.tsx, Learning.tsx
│   ├── Products.tsx, Orders.tsx, VideoGenerator.tsx, MediaLibrary.tsx
│   └── settings/ (Bot, Team, Billing, Webhook, Storage, Social, Profile)
│
├── components/                 Reusable UI components
├── contexts/                   React context providers (auth, theme, etc.)
├── api/                        API client interfaces — call Spring Boot /api/v1/* endpoints
├── services/                   Frontend business logic
├── types/                      TypeScript types
├── mocks/                      MSW handlers for local development without backend
└── utils/
```

### Routes (App.tsx)

Public: `/login`, `/onboarding`, `/platforms/callback`

Protected (require auth):
- `/dashboard`, `/inbox`, `/contacts`, `/bookings`
- `/campaigns`, `/analytics`, `/documents`
- `/settings/bot`, `/settings/team`, `/settings/billing`, `/settings/webhook`, `/settings/storage`, `/settings/social`, `/profile`
- `/trends`, `/content-studio`, `/approvals`, `/calendar`
- `/leads`, `/platforms`, `/learning`
- `/products`, `/orders`, `/video-generator`, `/media-library`

---

## PWA + Workbox

`vite.config.ts` configures `vite-plugin-pwa` with:
- `NetworkFirst` strategy for `/api/v1/*` (5-minute cache)
- Asset pre-caching for all `*.{js,css,html,ico,png,svg,woff2}`
- Auto-update registration

---

## Capacitor mobile

`capacitor.config.ts`:
- `appId: com.dhad.crm`
- `appName: Jeeva CRM`
- `webDir: dist` — the Vite build output is what Capacitor bundles

After every `npm run build`, run `npm run cap:sync` to push web code into the native Android/iOS projects.

---

## Legacy Express server

Located in `server/src/`. Still deployed as a Docker container in `docker-compose.yml` but **not reachable from the frontend in dev mode** (Vite proxies to Spring Boot instead).

### What it still handles (Docker only, via nginx `/api/*`)

| Route | Description |
|---|---|
| `GET /api/workspace` | Single-workspace config (SQLite) |
| `PUT /api/workspace` | Update workspace settings |
| `GET /api/stats` | Dashboard counts from SQLite |
| `GET /api/conversations` | Conversations list from SQLite |
| `GET /api/conversations/:id/messages` | Message history |
| `PUT /api/conversations/:id/status` | Update status (`bot`/`human`/`closed`) |
| `POST /api/conversations/:id/send` | Agent manual reply (calls Meta Graph API) |
| `GET /api/contacts` | Contacts list |
| `GET /api/bookings` | Bookings list |
| `GET /webhook` | Meta webhook verification |
| `POST /webhook` | Inbound messages → Gemini reply (separate from Spring flow) |

### SQLite schema (`data/crm.db`)

Tables: `workspaces`, `contacts`, `conversations`, `messages`, `bookings`

This is a single-workspace system with no multi-tenant isolation. New features should go into Spring Boot, not the Express server.

### Express server files

```
server/src/
├── index.ts              App entry, CORS, port config, graceful shutdown
├── routes/
│   ├── api.ts            CRM REST endpoints (workspace, contacts, convs, bookings)
│   ├── webhook.ts        WhatsApp inbound handler → Gemini → reply
│   └── tunnel.ts         Cloudflare tunnel management
├── services/
│   ├── whatsapp.ts       Meta Graph API calls (send text + button messages)
│   └── geminiEngine.ts   Google Generative AI SDK integration
└── db/database.ts        better-sqlite3 init, schema, seed data
```

---

## Environment variables

**`.env` (frontend build + Express server):**

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key — used by Express `geminiEngine.ts` |
| `PORT` | Express server port (default: 3001) |

The frontend itself (React) has no runtime env vars at build time — it calls `localhost:8080` (via proxy in dev) or the relative `/api/v1` path (in production).

---

## Docker images

| Dockerfile | What it builds |
|---|---|
| `Dockerfile` | nginx serving the Vite `dist/` (static PWA) |
| `Dockerfile.server` | Express server with better-sqlite3 native build |
| `Dockerfile.android` | Android APK builder: npm install → build → cap sync → Gradle assembleDebug |
| `Dockerfile.mobile` | React web app variant for mobile context |

APK output after `docker compose run --rm android-builder`:
`android/app/build/outputs/apk/debug/app-debug.apk`
