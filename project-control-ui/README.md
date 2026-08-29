# Project Control UI

Clean local-test frontend for the fresh Spring Modulith Project Control service.

This app is intentionally isolated from the legacy WhatsApp/CRM `/control` UI. It proves the clean Project Control foundations end-to-end before production authentication/navigation is introduced.

## What it tests

- Workspace / Project
- Global organizations + contextual project participation
- Project Scope + Scope Capability
- Persisted users, organization/workspace memberships and scope assignments
- Relationship-driven access decisions through `ProjectAccessService`
- Document numbering and document register
- Real local PDF upload, immutable revisions and authorized PDF viewing
- Generic workflow definition creation from the UI
- Workflow activation + explicit scope binding
- Typed Document -> Workflow Instance linkage
- Workflow progression, comments, returns, rejection and full action/step-visit history
- The ITR-style flow remains configuration only; there is no ITR/Inspection domain entity

The UI user switcher is only a local authentication stand-in. It sends the persisted selected user in `X-Project-Control-User`; backend authorization still resolves the user's real workspace, organization, project and scope relationships.

## Demo users

A fresh demo creates four persisted users:

- **Project Admin** - configures numbering/workflows and can manage the project.
- **Aisha Khan · Site Submitter** - contractor scope contributor; can submit documents/PDFs and start/action workflows.
- **Omar Rahman · Consultant Reviewer** - consultant scope approver; can view PDFs and perform workflow review actions.
- **Maya Joseph · Read-only Viewer** - project viewer; can view documents/PDFs but cannot submit or action workflows.

## Run backend locally without Docker

From `whatsapp-bot/project-control-service` on branch `feature/project-control-modulith-foundation`:

```bash
mvn -Dspring-boot.run.profiles=local spring-boot:run
```

The `local` profile uses a persistent H2 file directly under `project-control-service/` (`project-control-local.mv.db`) and applies the same current Flyway migrations (V1-V5). PostgreSQL remains the CI/production database.

Uploaded local PDFs are stored under:

```text
project-control-service/project-control-files/
```

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

## Suggested local test

Click **Create fresh demo**. It creates the complete base through real backend APIs, including users and a submitted PDF.

Then try these checks:

1. Switch to **Read-only Viewer**. Open the submitted PDF. Confirm submit/review buttons are disabled.
2. Switch to **Site Submitter**. Submit another PDF document or upload a revision. Start an enabled workflow for the selected document.
3. Switch to **Consultant Reviewer**. View the same PDF, add a workflow comment, approve/return/reject as appropriate.
4. Switch to **Project Admin**. Create a new generic workflow in the UI using `STEP_CODE|Step name|ACTION`, activate/bind it, then switch back to an actionable user and start it for a document.
5. Inspect workflow history and confirm actions show the persisted acting user's name.

## Reset local state

Stop the backend and delete:

```text
project-control-local.mv.db
project-control-local.trace.db   # only if present
project-control-files/           # if you also want uploaded PDFs removed
```

Restart the backend and click **Create fresh demo**. Browser local storage can still contain IDs from the previous database, so always create a fresh demo after a backend reset.
