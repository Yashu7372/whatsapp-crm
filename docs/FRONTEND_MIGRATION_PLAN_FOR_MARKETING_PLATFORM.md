# Frontend Migration Plan — From WhatsApp CRM to Multi-Platform Marketing SaaS

## Goal

Convert the current WhatsApp CRM dashboard into a frontend for a multi-platform AI marketing and lead intelligence platform.

Current frontend should be reused, but product concepts should be generalized.

## Current Product Shape

Current screens:

```text
Dashboard
Inbox
Contacts
Bookings
Campaigns
Analytics
Bot Settings
Team Settings
Billing Settings
Webhook Setup
Profile
Onboarding
```

Current frontend API calls a local `/api` backend.

The local Node backend currently owns:

```text
Workspace settings
WhatsApp webhook
SQLite database
Gemini AI reply generation
WhatsApp send functions
Conversation APIs
Contact APIs
Booking APIs
Tunnel/ngrok APIs
```

## Target Product Shape

New screens:

```text
Dashboard
Unified Inbox
Leads
Contacts
Campaigns
Trend Intelligence
Content Studio
Content Calendar
Approvals
Platform Integrations
Analytics
Learning Insights
AI Settings
Team Settings
Billing
Tenant Settings
```

## Required Navigation Changes

Current route mapping:

```text
/dashboard              -> Dashboard
/inbox                  -> Unified Inbox
/contacts               -> Contacts / Leads
/bookings               -> Appointments / Deals
/campaigns              -> Multi-platform Campaigns
/analytics              -> Analytics
/settings/bot           -> AI Settings
/settings/webhook       -> Platform Integrations
/settings/team          -> Team Settings
/settings/billing       -> Billing
/onboarding             -> Tenant Onboarding
```

New routes to add:

```text
/trends
/content-studio
/content-calendar
/approvals
/leads
/platforms
/learning
```

## API Client Refactor

Current file:

```text
src/services/api.ts
```

Replace with typed API modules:

```text
src/api/client.ts
src/api/tenantApi.ts
src/api/platformApi.ts
src/api/inboxApi.ts
src/api/leadApi.ts
src/api/trendApi.ts
src/api/contentApi.ts
src/api/campaignApi.ts
src/api/approvalApi.ts
src/api/publishingApi.ts
src/api/analyticsApi.ts
```

Target API base:

```text
/api/v1
```

## New Feature Folder Structure

```text
src/features/
  dashboard/
  unified-inbox/
  leads/
  contacts/
  campaigns/
  trend-intelligence/
  content-studio/
  content-calendar/
  approvals/
  platform-integrations/
  analytics/
  learning-insights/
  ai-settings/
  team/
  billing/
```

## Dashboard Migration

Current dashboard shows:

```text
Leads handled by AI today
AI messages sent
Total contacts
Total bookings
Recent conversations
WhatsApp not connected banner
```

New dashboard should show:

```text
Connected platforms
Trend opportunities today
Content ideas generated
Content awaiting approval
Scheduled posts
Published content
Reach
Engagement rate
Leads captured
Top performing platform
Recent lead signals
Recent campaign performance
```

## Campaign Screen Migration

Current campaign page is a WhatsApp broadcast coming-soon page.

New campaign page should support:

```text
Create campaign
Select goal: awareness / leads / engagement / traffic
Select platforms
Select audience persona
Attach trend signal
Generate content ideas
Review content variants
Approve content
Schedule publishing
Track performance
```

## Trend Intelligence Screen

New screen requirements:

```text
List trends by platform
Filter by industry
Filter by country/city
Filter by freshness score
Filter by final score
Show brand safety score
Show client relevance score
Generate content from selected trend
Mark trend as ignored
Add manual trend
```

Columns:

```text
Platform
Topic
Keyword/Hashtag/Audio
Industry
Location
Freshness
Growth
Relevance
Brand Safety
Final Score
Detected At
Expires At
Action
```

## Content Studio Screen

Purpose:

```text
Generate platform-specific content from trends, client profile, and audience persona.
```

Should support:

```text
Hook
POV angle
Script
Caption
Hashtags
CTA
Thumbnail text
Voiceover
Shot list
Platform variants
AI regenerate
Send for approval
```

## Approval Screen

Status flow:

```text
GENERATED
REVIEW
APPROVED
REJECTED
NEEDS_CHANGES
SCHEDULED
PUBLISHED
ANALYZED
```

Screen actions:

```text
Approve
Reject
Request changes
Edit caption
Edit hashtags
Change schedule
Assign reviewer
View AI prompt/audit notes
```

## Platform Integrations Screen

Replace WhatsApp-only webhook setup with generic integrations.

Platforms:

```text
WhatsApp
Instagram
Facebook
TikTok
YouTube
LinkedIn
Pinterest
Google Business Profile
X / Twitter
Reddit
Website Forms
```

Each integration should display:

```text
Connection status
Account name
Account handle
Permissions
Token expiry
Last sync
Capabilities
Webhook status
Rate limit status
Actions: connect, reconnect, disconnect, test
```

## Unified Inbox Migration

Current inbox is WhatsApp conversation-based.

New inbox should support:

```text
WhatsApp messages
Website form leads
Instagram comments/DM opt-ins where allowed
LinkedIn comments/messages where allowed
Manual lead imports
```

Conversation status:

```text
BOT
HUMAN
OPEN
CLOSED
QUALIFIED
DISQUALIFIED
FOLLOW_UP_REQUIRED
```

Lead intent badges:

```text
PRICE_INQUIRY
LOCATION_INQUIRY
SERVICE_REQUEST
BOOKING_REQUEST
DEMO_REQUEST
SUPPORT_REQUEST
COMPLAINT
GENERAL_QUESTION
```

## Analytics Screen Migration

Current analytics should be extended to:

```text
Platform performance
Campaign performance
Content performance
Trend-to-content conversion
Content-to-lead conversion
Lead source attribution
Best posting time
Best hook patterns
Best CTA patterns
Audience persona response
```

## Temporary Node Backend Strategy

Short term:

```text
Keep server/ for local demo only.
```

Medium term:

```text
Move all production API logic to Java backend.
```

Final target:

```text
React frontend -> Java Spring Boot API -> PostgreSQL / Queue / Platform Plugins
```

The Node backend should not own production webhook processing, tokens, WhatsApp sending, or AI logic after migration.

## Implementation Order

```text
1. Keep existing UI running
2. Add docs
3. Create typed API client structure
4. Add Platform Integrations screen shell
5. Add Trend Intelligence screen shell
6. Add Content Studio shell
7. Add Approval screen shell
8. Point Dashboard to Java backend stats
9. Point Inbox to Java backend conversations
10. Decommission duplicate Node WhatsApp webhook logic
```

## Enterprise Frontend Rules

```text
No hardcoded platform names in business logic
Use platform capabilities from backend
Use typed API clients
Keep components reusable
Keep platform-specific rendering behind config
Never expose full tokens
Never store secrets in localStorage
Use role-based actions for approval/publishing
Show audit trail for AI-generated content
```
