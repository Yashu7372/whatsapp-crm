# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this is

The frontend dashboard and mobile app for the WhatsApp AI CRM platform. React 19 + TypeScript (Vite), deployed as a PWA and packaged as iOS/Android apps via Capacitor. All API traffic goes to the Spring Boot backend (`whatsapp-bot` repo) — the legacy Express.js server has been fully removed.

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
| Backend | Spring Boot (`whatsapp-bot` repo) — reached via `/api/v1/*` |

---

## Commands

```bash
npm install                     # Install dependencies

# Development
npm run dev                     # Vite dev server — port 5173, all API proxied to Spring Boot :8080

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
  },
}
```

In **Docker/production**, nginx serves the built `dist/` and proxies `/api/v1/*` and `/webhook` to the Spring Boot service (`nginx.conf`). There is no other backend.

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

## Backend API (Spring Boot)

Everything the dashboard needs is served by the Spring Boot backend in the `whatsapp-bot` repo:

| Route family | Description |
|---|---|
| `POST /api/v1/auth/login`, `/refresh` | JWT auth (`tenant_users` table) |
| `GET/PUT /api/v1/crm/workspace` | Tenant workspace settings |
| `GET /api/v1/crm/stats` | Dashboard counts |
| `GET /api/v1/crm/conversations` (+ `/{id}`, `/{id}/messages`) | Inbox |
| `PUT /api/v1/crm/conversations/{id}/status` | Handover: `bot` / `human` / `closed` |
| `POST /api/v1/crm/conversations/{id}/assign` | Assign an agent/employee |
| `POST /api/v1/crm/conversations/{id}/send` | Agent manual reply (Meta Graph API) |
| `GET /api/v1/crm/agents` | Active agents for assignment |
| `GET /api/v1/crm/contacts`, `/bookings` | Contacts and bookings |
| `GET/POST /webhook` | Meta webhook verification + inbound messages |

All routes except `/webhook` and `/api/v1/auth/*` require a JWT Bearer token; every query is tenant-scoped server-side.

---

## Environment variables

**`.env` (frontend build):**

| Variable | Purpose |
|---|---|
| `VITE_MOCK` | `true` = run the dashboard against MSW mock handlers with no backend |

The frontend has no other runtime env vars — it calls `localhost:8080` (via the Vite proxy in dev) or the relative `/api/v1` path (in production).

---

## Docker images

| Dockerfile | What it builds |
|---|---|
| `Dockerfile` | nginx serving the Vite `dist/` (static PWA) |
| `Dockerfile.android` | Android APK builder: npm install → build → cap sync → Gradle assembleDebug |
| `Dockerfile.mobile` | React web app variant for mobile context |

APK output after `docker compose run --rm android-builder`:
`android/app/build/outputs/apk/debug/app-debug.apk`
