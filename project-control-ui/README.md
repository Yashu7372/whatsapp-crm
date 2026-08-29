# Project Control UI

Clean local-test frontend for the fresh Spring Modulith Project Control service.

This app is intentionally isolated from the legacy WhatsApp/CRM `/control` UI. It proves the clean Project Control foundations through the real backend before production navigation and enterprise SSO are introduced.

## What it tests

- Workspace / Project
- Global organizations + contextual project participation
- Project Scope + Scope Capability
- Persisted users, organization memberships and scope assignments
- Spring Security username/password authentication using a server-side session
- CSRF-protected state-changing requests
- Relationship-driven authorization through `ProjectAccessService`
- Document originator anti-spoof protection
- Document numbering and document register
- Real local PDF upload, immutable revisions and authorized PDF viewing
- Generic workflow definition creation from the UI
- Workflow activation + explicit scope binding
- Typed Document -> Workflow Instance linkage
- Current-step responsibility enforcement against the authenticated actor
- Workflow progression, comments, returns, rejection and full action/step-visit history
- Scope-limited VIEW behavior
- The ITR-style flow remains configuration only; there is no ITR/Inspection domain entity

## Local authenticated users

The backend `local` profile creates these credential users. All use password:

```text
Project123!
```

- `admin@local.demo` — Project Admin
- `site@local.demo` — Site Team (`SITE_TEAM`)
- `qce@local.demo` — QCE (`QCE`)
- `qcdc@local.demo` — QC/DC (`QC_DC`)
- `inspector@local.demo` — Consultant Inspector (`CONSULTANT_INSPECTOR`)
- `re@local.demo` — Consultant RE (`CONSULTANT_RE`)
- `viewer@local.demo` — scope-limited Viewer (`VIEW`)

The quick account buttons in the UI perform a real password login. They do not send or override a user id.

## Run backend locally without Docker

From `whatsapp-bot/project-control-service` on branch `feature/project-control-modulith-foundation`:

```bash
mvn -Dspring-boot.run.profiles=local spring-boot:run
```

The `local` profile uses a persistent H2 file directly under `project-control-service/` and applies the current Flyway migrations V1-V6. PostgreSQL remains the CI/production database.

Uploaded local PDFs are stored under:

```text
project-control-service/project-control-files/
```

Backend runs on `http://localhost:8080`.

## Run this frontend

From `whatsapp-crm/project-control-ui` on branch `feature/project-control-modulith-ui`:

```bash
npm install
npm run dev
```

Open `http://localhost:5174`.

Vite proxies `/api/*` to `http://localhost:8080`, so the session cookie and CSRF flow remain same-origin from the browser's point of view.

## Suggested authenticated ITR test

1. Sign in as `admin@local.demo` / `Project123!` and click **Create fresh demo**.
2. The demo ends authenticated as Site Team. Complete **Site Team Raise**.
3. Try completing **QCE Verification** while still Site Team; the backend must deny it.
4. Sign in as `qce@local.demo`; complete QCE Verification.
5. Sign in as `qcdc@local.demo`; complete QC/DC Receiving.
6. Sign in as `inspector@local.demo`; comment and complete Consultant Inspector Review.
7. Try final approval while still Inspector; the backend must deny it.
8. Sign in as `re@local.demo`; complete Consultant RE Final Approval.
9. Sign in as `viewer@local.demo`; confirm the MEP document/PDF is visible but submission and workflow action are denied.
10. Sign in as Project Admin to create another generic workflow with `STEP_CODE|Step name|ACTION|RESPONSIBILITY` lines and bind it to the MEP scope.

## Authentication boundary

The local foundation uses Spring Security username/password authentication with a server-side session. The browser does not send `X-Project-Control-User` anymore. Later, enterprise OIDC/SSO can replace the credential source while the authorization model stays:

```text
authenticated principal
  -> user_accounts
  -> ActorContext
  -> ProjectAccessService
```

## Reset local state

Stop the backend and delete:

```text
project-control-local.mv.db
project-control-local.trace.db   # only if present
project-control-files/           # if you also want uploaded PDFs removed
```

Restart the backend and sign in as Project Admin, then click **Create fresh demo**. The UI uses a v3 browser-storage key so older actor-switcher demo state is ignored.
