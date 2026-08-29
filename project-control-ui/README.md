# Project Control UI

Clean local-test frontend for the fresh Spring Modulith Project Control service.

This app is intentionally isolated from the legacy WhatsApp/CRM `/control` UI. It exists to prove Foundations 01-03 end-to-end before we build the production navigation, authentication and role-aware experience.

## What it tests

- Workspace / Project
- Global Organization + project participation
- Project Scope + Scope Capability
- Document numbering, document register and immutable revisions
- Generic workflow definition, activation and explicit scope binding
- Workflow instance progression, comments, returns, rejection and full action/step-visit history
- The real ITR-style flow is configuration only; there is no ITR/Inspection domain entity

## Run backend locally without Docker

From `whatsapp-bot/project-control-service` on branch `feature/project-control-modulith-foundation`:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The `local` profile uses a persistent H2 file directly under `project-control-service/` (`project-control-local.mv.db`) and runs the same Flyway V1-V3 migrations. PostgreSQL remains the production/CI database.

Backend runs on:

```text
http://localhost:8080
```

## Run this frontend

From `whatsapp-crm/project-control-ui` on branch `feature/project-control-modulith-ui`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5174
```

Vite proxies `/api/*` to `http://localhost:8080`, so no local CORS configuration is required.

## First test

Click **Create fresh demo**. The browser will create, through real backend APIs:

```text
Workspace
  -> Project
      -> Prime Mechanical as SUBCONTRACTOR
          -> Construction / MEP Scope
              -> DOCUMENT_CONTROL capability
              -> INSPECTION capability
              -> Shop Drawing + Revision A
              -> ITR_APPROVAL workflow binding
                  -> ITR workflow instance
```

Then use the UI to add document revisions, complete workflow steps, add comments, return to earlier steps, reject, refresh and inspect the persisted workflow history.

To reset the local backend completely, stop it and delete `project-control-local.mv.db` (and any adjacent H2 lock/trace file if present). Then start it again and click **Create fresh demo** because browser local storage may still contain IDs from the old local database.
