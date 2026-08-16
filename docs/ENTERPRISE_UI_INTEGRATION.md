# Enterprise Project Control UI & Integration

## Purpose

The frontend originally grew around a CRM/content product. Enterprise Project Control is now the primary application experience. The old WhatsApp/CRM pages remain available as secondary operational utilities, while content studio, campaigns, trends, media and video-generation routes are intentionally hidden/redirected for this phase.

The enterprise UI should explain the project as a connected delivery story rather than present unrelated registers.

Primary hierarchy:

`Portfolio -> Project -> Stage -> Work Package -> Work Item -> Documents / Team / Time / Cost / Evidence`

## Primary routes

| Route | Purpose |
|---|---|
| `/control` | Portfolio landing page |
| `/control/projects` | All authorized projects |
| `/control/projects/:projectId` | Stage/package/work-item drill-down |
| `/control/documents` | Expert document register |
| `/control/approvals` | Assigned approval worklist |
| `/control/project-controls` | Budget/contract/forecast specialist view |
| `/control/commercial` | IPC/certification specialist view |
| `/control/resource-costs` | Resource/cost specialist view |
| `/control/time-log` | Individual/team time capture |
| `/control/workflows` | Workflow configuration/control |
| `/control/transmittals` | Formal document distribution |
| `/control/security` | Document/project access administration |
| `/control/roles` | Role/feature permission administration |
| `/control/communications` | Workflow notification center |

`/dashboard` now redirects to `/control`.

Content/video routes redirect to `/control` rather than deleting their code, so they can be re-enabled later as a separate product/module without influencing the enterprise information architecture.

## Secondary CRM / WhatsApp routes

The original WhatsApp operational surfaces are preserved:

- `/inbox`
- `/contacts`
- `/bookings`
- `/analytics`
- `/settings/bot`
- `/settings/webhook`
- `/settings/team`
- `/settings/billing`
- `/settings/storage`
- `/profile`

The enterprise sidebar provides explicit utility links to the WhatsApp Inbox and bot configuration. They are no longer presented as the product's primary navigation.

## New delivery API client

`src/enterprise/deliveryApi.ts` is intentionally separate from the older `enterpriseApi.ts` so the delivery hierarchy can evolve without destabilizing existing specialist screens.

Endpoints:

- `GET /api/v1/project-delivery/portfolio`
- `GET /api/v1/project-delivery/projects/{projectId}`

JWT/refresh behavior is inherited from `src/api/httpClient.ts`.

## ProjectPortfolio

`src/enterprise/ProjectPortfolio.tsx`

Responsibilities:

- show client/account portfolio summary;
- show total contract value and cross-project attention indicators;
- show authorized project cards only;
- show project progress, organizations, stage completion, captured actual cost, blocked work, overdue docs and approvals;
- navigate directly into the project delivery route.

The screen must stay suitable for Client/Consultant/tenant-level management but remains authorization-agnostic itself; server-side project filtering is authoritative.

## ProjectDelivery

`src/enterprise/ProjectDelivery.tsx`

Responsibilities:

1. project header and project-level control KPIs;
2. participating organization ribbon with party role;
3. lifecycle stage rail;
4. work-package selection inside a stage;
5. work-item list inside a package;
6. work-item detail panel with:
   - status/progress;
   - explicit blocker;
   - budget vs actual;
   - logged time;
   - responsible organization;
   - assigned staff, real job title and fixed application access role;
   - connected controlled documents, revision and status.

The drill-down is the primary product navigation pattern. Raw registers remain available for expert users but should not be required to understand why a project is delayed or over budget.

## EnterpriseLayout

`src/enterprise/EnterpriseLayout.tsx`

The shell is intentionally curated into:

- Delivery
- Control & intelligence
- Administration
- WhatsApp utility links

It no longer offers an "Existing CRM" escape as a primary action. The enterprise experience is the application, not a child demo nested inside the CRM.

Available feature-catalog routes are still used to hide unavailable specialist navigation where possible. This is usability only; backend authorization is the security boundary.

## CSS isolation

The main UI defect before this change was not simply one bad color palette. The enterprise views and legacy CRM loaded into the same page with broad global selectors for elements such as:

- `table`
- `th`
- `td`
- `tr`
- `button`
- `input`
- form controls

That allowed legacy/shared component styles to override enterprise intent.

`src/enterprise/enterprise.css` now treats `.ec-shell` as a design-system boundary and uses scoped selectors such as:

- `.ec-shell table.ec-table`
- `.ec-shell table.ec-table th`
- `.ec-shell table.ec-table td`
- `.ec-shell .ec-btn`
- `.ec-shell .form-input`
- `.ec-shell .form-select`

This is more reliable than continuing to add one-off inline styles. It also avoids depending on whether PrimeReact or another component library happens to be loaded on a page.

The enterprise design system uses:

- neutral light project workspace background;
- dark navigation shell;
- restrained teal status/accent color;
- compact high-density enterprise typography;
- scoped cards/tables/forms;
- responsive portfolio and delivery drill-down layouts;
- explicit red/amber/green status semantics.

## Existing specialist screens preserved

The following existing screens remain valid and are now treated as specialist views rather than the primary mental model:

- `DocumentRegister.tsx`
- `ApprovalInbox.tsx`
- `BudgetIpc.tsx`
- `ProjectControls.tsx`
- `ResourceCosts.tsx`
- `TimeLog.tsx`
- `CommercialFacts.tsx`
- `ForecastIntelligence.tsx`
- `WorkflowControl.tsx`
- `Transmittals.tsx`
- `SecurityAccess.tsx`
- `NotificationCenter.tsx`

Do not rewrite these simply to reproduce the same backend behavior. Instead, progressively link them from project/work context.

## Existing FE -> BE conventions

- Base URL: `VITE_API_BASE_URL` or `/api/v1`.
- JWT is stored as `accessToken`.
- Refresh token is stored as `refreshToken`.
- HTTP 401 attempts refresh once.
- Multipart document upload uses the shared upload helper.
- Project IDs are supplied by server-returned authorized project records, never inferred client-side.
- UI hiding is never treated as authorization.

## Next UI increments

1. Add `My Work` as the default landing experience for Reviewer/Viewer personas while managers can default to Portfolio.
2. Add work-item selection to Time Log; document selection becomes optional secondary evidence/context.
3. Add work-item context to document create/upload-link screens.
4. Add click-through from work-item connected documents into document detail/revisions/comments/approval history.
5. Add click-through from work-item actual cost into cost ledger/time/equipment evidence.
6. Make Project Controls cost-code rows drill into contributing work packages/items.
7. Make IPC lines drill into the approved work/document evidence that created the claim.
8. Add role-aware AI panel using server-prepared context; do not let UI send unrestricted project data to AI providers.

## Demo expectation

After backend V42 runs against the DEMO tenant, log in using any seeded enterprise persona (password `admin123`) and open `/control`.

Recommended demonstrations:

- `enterprise.admin@aurelia.demo` — all-project platform/tenant view;
- `director@aurelia.demo` — Client manager view;
- `design.manager@meridian.demo` — Consultant manager view;
- `pm@gulfbuild.demo` — Contractor manager scope;
- `mep.worker@apex.demo` — worker/VIEWER scope.

The showcase path is:

`Aurelia Creek Residences -> Construction -> MEP Installation -> Level 05 HVAC duct installation and inspection`.

That work item should expose its blocked reason, subcontractor/consultant team, time/cost metrics and linked IR document in one place.
