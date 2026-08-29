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
- Generic workflow definition creation from a step-by-step visual builder
- Reusable workflow starter templates
- Workflow actions chosen from the supported action catalog
- Step `Can act` and `Can view` assignment from live scope responsibilities
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

Operational `APPROVE` access does not grant workflow-design authority. In the current foundation, workflow configuration requires Project Admin. A future delegated workflow administrator can be added explicitly rather than treating every approver as a process designer.

## Run backend locally without Docker

From `whatsapp-bot/project-control-service` on branch `feature/project-control-modulith-foundation`:

```bash
mvn -Dspring-boot.run.profiles=local spring-boot:run
```

The `local` profile uses a persistent H2 file directly under `project-control-service/` and applies the current Flyway migrations. PostgreSQL remains the CI/production database.

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

## Workflow configuration UI

Sign in as Project Admin. The workflow designer is intentionally step-by-step:

```text
Workflow details
  -> Step 1
       completion action
       responsibilities that can act
       responsibilities that can view
  -> + Add next step
  -> Step 2
       ...
  -> Create, activate and bind to the current scope
```

Responsibility choices come from active assignments on the selected project scope. They are not a hardcoded global construction-role enum. The initial reusable starter presets are:

- Simple document review
- Three-stage approval
- ITR / work verification

A preset only fills the generic workflow definition editor. The persisted result is still a reusable `WorkflowDefinition`; it does not create an ITR-specific backend engine or domain entity.

## Suggested authenticated ITR test

1. Sign in as `admin@local.demo` / `Project123!` and click **Create fresh demo**.
2. The demo ends authenticated as Site Team. Confirm **WORKFLOW CONFIGURE** is denied and complete **Site Team Raise**.
3. Try completing **QCE Verification** while still Site Team; the backend must deny it and explain the required responsibility.
4. Sign in as `qce@local.demo`; confirm **WORKFLOW CONFIGURE** is still denied, then complete QCE Verification.
5. Sign in as `qcdc@local.demo`; complete QC/DC Receiving.
6. Sign in as `inspector@local.demo`; comment and complete Consultant Inspector Review.
7. Try final approval while still Inspector; the backend must deny it and explain that Consultant RE is required.
8. Sign in as `re@local.demo`; complete Consultant RE Final Approval.
9. Sign in as `viewer@local.demo`; confirm the MEP document/PDF is visible but submission, workflow configuration and workflow action are denied.
10. Sign in as Project Admin. Apply a reusable workflow template, add/remove steps, select `Can act` / `Can view` responsibilities and create another reusable workflow definition.

## Playwright E2E verification

With the backend and frontend already running locally:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

GitHub Actions performs the complete version automatically. The `e2e` job:

1. Checks out this UI branch and the Project Control backend branch.
2. Starts the real Spring Boot backend with the `local` H2 profile.
3. Starts the real Vite UI.
4. Launches Chromium through Playwright.
5. Logs in with real server-side sessions as Site Team, QCE, QC/DC, Consultant Inspector, Consultant RE, Viewer and Project Admin.
6. Verifies workflow-design permissions, responsibility-based execution and the visual workflow builder.
7. Uploads Playwright report, trace/video/screenshots on failure, plus backend/UI runtime logs as the `project-control-playwright-evidence` artifact.

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

Restart the backend and sign in as Project Admin, then click **Create fresh demo**. The UI uses a v4 browser-storage key so older demo state is ignored.
