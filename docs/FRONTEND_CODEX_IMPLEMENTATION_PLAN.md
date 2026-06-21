# Frontend Codex Implementation Plan

## Purpose

This file guides Codex changes for the `whatsapp-crm` repository.

The current repository is a React + TypeScript + Vite CRM dashboard. It also contains a local Node/Express server that should be treated as a temporary local/demo backend. The target frontend is a multi-platform AI marketing SaaS dashboard that will use the Java backend as the production API.

## Target Screens

Keep existing screens and add these new screens incrementally:

```text
/trends
/content-studio
/approvals
/calendar
/leads
/platforms
/learning
```

Create pages:

```text
src/pages/TrendIntelligence.tsx
src/pages/ContentStudio.tsx
src/pages/ApprovalQueue.tsx
src/pages/ContentCalendar.tsx
src/pages/LeadIntelligence.tsx
src/pages/PlatformIntegrations.tsx
src/pages/LearningInsights.tsx
```

## API Client Structure

Add centralized API clients:

```text
src/api/httpClient.ts
src/api/platformApi.ts
src/api/trendApi.ts
src/api/campaignApi.ts
src/api/contentApi.ts
src/api/approvalApi.ts
src/api/publishingApi.ts
src/api/leadApi.ts
src/api/analyticsApi.ts
src/api/learningApi.ts
```

Rules:

- Do not call `fetch` or `axios` directly from page components.
- Keep backend base URL in environment configuration.
- Keep local demo server calls isolated if still needed.

## Type Structure

Create shared API/domain types:

```text
src/types/platform.ts
src/types/trend.ts
src/types/campaign.ts
src/types/content.ts
src/types/approval.ts
src/types/publishing.ts
src/types/lead.ts
src/types/analytics.ts
src/types/learning.ts
```

## Implementation Phases

### Phase 1 - Navigation Shell

- Add placeholder pages.
- Add routes in `src/App.tsx`.
- Add sidebar entries.
- Preserve existing dashboard, inbox, contacts, campaigns, analytics, and settings routes.

### Phase 2 - Platform Integrations

- Display supported platform cards.
- Show connection status.
- Show platform capabilities.
- Add placeholder connect/disconnect actions.

### Phase 3 - Trend Intelligence

- Add trend list screen.
- Add filters by platform, location, industry, and score.
- Add manual trend import form.

### Phase 4 - Content Studio and Approvals

- Add content idea list.
- Add content variant view.
- Add approve/reject actions.
- Make approval mandatory before scheduling.

### Phase 5 - Calendar and Publishing Status

- Add content calendar.
- Add publish job status view.
- Only approved content can be scheduled.

### Phase 6 - Leads and Learning

- Add lead signal list.
- Add intent score and source platform.
- Add learning insights page.

## Codex Prompt

```text
You are the Frontend Agent for whatsapp-crm.

Scope:
Implement only the requested frontend phase.

Rules:
- Do not delete existing CRM screens.
- Add API clients under src/api.
- Add shared types under src/types.
- Keep changes small and buildable.
- Existing Node server is temporary/demo only.
- After changes, run npm run build or explain why it was not run.
```

## Validation

Before accepting changes:

```bash
npm run build
```

Also verify:

- Existing routes still open.
- New routes do not crash.
- API calls are centralized.
- Types are not scattered across pages.
- Local/demo backend is not treated as the final production backend.
