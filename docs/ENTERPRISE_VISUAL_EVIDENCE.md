# Enterprise Project Delivery — Visual Verification

This document records reproducible visual evidence for the first enterprise project-delivery vertical slice.

The screenshots are generated from the **real React routes and enterprise components** in this repository. Playwright intercepts only the HTTP API boundary with deterministic Aurelia demo responses so the UI can be verified without depending on a running laptop, temporary Cloudflare tunnel, or external database.

This is deliberately separate from backend integration verification: the backend repository continues to verify Flyway/PostgreSQL/Hibernate/tests in its own CI. Once the GCP demo environment is registered, the same UI can be exercised against the live Spring Boot API.

## What the visual test verifies

`npm run e2e:visual` checks that:

- `/control/projects` renders **Aurelia Developments PJSC** as the enterprise portfolio;
- the portfolio contains **Aurelia Creek Residences**, **Aurelia Business District Tower**, and **Aurelia Marina Hotel**;
- the enterprise sidebar contains Delivery/Control/Admin navigation and keeps WhatsApp as a utility;
- project drill-down renders **Construction -> MEP Installation -> ME-301**;
- ME-301 is blocked for the expected IR-234 fire-damper clearance reason;
- assigned subcontractor/consultant people are visible with job titles and access roles;
- IR-234 and related controlled documents are visible in the work-item evidence panel;
- a restricted worker persona still sees work/hour/document context while budget/rates/cost are hidden;
- `/dashboard` redirects to the enterprise product;
- dormant `/video-generator` redirects to the enterprise product.

## Screenshots

### 1. Enterprise portfolio — tenant/client management view

![Enterprise portfolio](screenshots/01-portfolio-admin.png)

### 2. Project drill-down — Construction / MEP Installation / ME-301

![Project drill-down](screenshots/02-project-drilldown-admin.png)

### 3. Work-item evidence panel — blocker, team, cost/time and controlled documents

![Work-item evidence](screenshots/03-work-item-evidence-admin.png)

### 4. Worker/VIEWER authorization view — commercial information restricted

![Restricted worker view](screenshots/04-project-drilldown-worker-restricted.png)

## CI automation

Workflow: `.github/workflows/visual-evidence.yml`

The workflow:

1. builds the actual React/Vite application;
2. lints the enterprise application and evidence script;
3. installs Chromium through Playwright;
4. runs the deterministic project-delivery flow;
5. captures the four screenshots above;
6. uploads them as a GitHub Actions artifact;
7. commits refreshed PNGs back to `feature/enterprise-document-control` only when the rendered UI changes.

The workflow is scoped to the feature branch. It does not merge or write to `develop`/`main`.

## Relationship to the demo deployment

The separate backend workflow `Demo Environment - GCP` starts the on-demand Compute Engine VM, PostgreSQL, Spring Boot and Quick Tunnel, then rebuilds Cloudflare Pages with the current temporary backend URL. That environment remains the path for a true cloud-hosted demo once Google/Cloudflare secrets are registered.

The screenshot workflow exists so UI regressions and the intended enterprise story remain reviewable even when the demo VM is stopped.
