# Existing Frontend + Embedded Node Backend Flow — whatsapp-crm

## Repository

- Repository: `Yashu7372/whatsapp-crm`
- Base branch reviewed: `master`
- Current purpose: WhatsApp CRM dashboard with React frontend and embedded Node/Express backend.
- Target future purpose: multi-platform marketing SaaS admin UI.

## Current Technology Stack

Frontend:

```text
React 19
TypeScript
Vite
React Router
Recharts
Lucide React
Axios/fetch wrapper
```

Embedded backend:

```text
Node.js
Express
better-sqlite3
Gemini SDK
Axios
ngrok/tunnel helper
```

Important files:

```text
src/App.tsx
src/services/api.ts
server/src/index.ts
server/src/routes/api.ts
server/src/routes/webhook.ts
server/src/services/geminiEngine.ts
server/src/services/whatsapp.ts
server/src/db/database.ts
```

## Current Frontend Routing

File:

```text
src/App.tsx
```

Current pages:

```text
/dashboard
/inbox
/contacts
/bookings
/campaigns
/analytics
/settings/bot
/settings/team
/settings/billing
/settings/webhook
/profile
/onboarding
```

Current structure:

```text
BrowserRouter
  ↓
Suspense lazy loading
  ↓
DashboardLayout
  ↓
Feature pages
```

The route structure is reusable. The product labels should be generalized from WhatsApp CRM to multi-platform marketing SaaS.

## Current Frontend API Client

File:

```text
src/services/api.ts
```

Current API base:

```text
/api
```

Current API calls:

```text
GET /workspace
PUT /workspace
GET /stats
GET /conversations
GET /conversations/{id}/messages
PUT /conversations/{id}/status
POST /conversations/{id}/send
GET /contacts
GET /bookings
GET /tunnel/status
POST /tunnel/start
POST /tunnel/stop
```

## Current Dashboard Flow

File:

```text
src/pages/Dashboard.tsx
```

Current flow:

```text
Dashboard component mounts
        ↓
api.getStats()
api.getConversations()
api.getWorkspace()
        ↓
Display WhatsApp connection banner when not connected
        ↓
Display stats
        ↓
Display recent conversations
        ↓
Poll every 10 seconds
```

Current dashboard metrics:

```text
leadsToday
messagesSent
totalContacts
totalBookings
```

For the new product, these become:

```text
leadsToday
contentPublished
platformReach
engagementRate
trendOpportunities
campaignsScheduled
```

## Current Campaign Screen

File:

```text
src/pages/Campaigns.tsx
```

Current behavior:

```text
Campaigns page is disabled / coming soon.
It explains that campaign broadcasts require Meta-approved WhatsApp templates.
```

Previewed features:

```text
Broadcast messages
Read receipts
Click tracking
Smart retargeting
```

This page should become the main multi-platform campaign workspace.

## Current Embedded Node Backend

File:

```text
server/src/index.ts
```

Current server flow:

```text
Express app
  ↓
CORS for localhost frontend
  ↓
JSON parsing
  ↓
GET /health
  ↓
/webhook routes
/api routes
/api/tunnel routes
  ↓
Initialize SQLite DB
```

Current limitation:

- This backend is useful for prototype/demo.
- It should not remain the final enterprise backend because it uses local SQLite and duplicates logic already present in the Java backend.

## Current SQLite Schema

File:

```text
server/src/db/database.ts
```

Current tables:

```text
workspaces
contacts
conversations
messages
bookings
```

Current workspace fields:

```text
name
business_type
whatsapp_number
whatsapp_phone_id
whatsapp_token
webhook_verify_token
plan
faq
business_hours
```

Current contact fields include automotive-specific metadata:

```text
car_details
vehicle_reg
last_service_date
```

This is useful as a domain example but must become configurable per client/industry.

## Current Node API Flow

File:

```text
server/src/routes/api.ts
```

Current responsibilities:

```text
Workspace settings
Dashboard stats
Conversation listing
Message listing
Conversation status update
Manual agent send
Contact listing
Booking listing
```

Manual reply flow:

```text
POST /api/conversations/{id}/send
        ↓
Load conversation + contact + workspace WhatsApp credentials
        ↓
Insert outbound message into SQLite
        ↓
sendWhatsAppMessage(...)
        ↓
Update conversation last_message
        ↓
Return message id and WhatsApp message id
```

## Current Node Webhook Flow

File:

```text
server/src/routes/webhook.ts
```

Current verification flow:

```text
GET /webhook/whatsapp
        ↓
Compare hub.verify_token with workspace.webhook_verify_token
        ↓
Return challenge or 403
```

Current inbound flow:

```text
POST /webhook/whatsapp
        ↓
Immediately send HTTP 200 to Meta
        ↓
parseWebhookMessage(req.body)
        ↓
Resolve workspace by WhatsApp phone id
        ↓
Upsert contact
        ↓
Find or create active conversation
        ↓
Save inbound message
        ↓
Mark WhatsApp message as read
        ↓
Skip AI if conversation is human mode
        ↓
Build user metadata
        ↓
Load last 10 messages
        ↓
generateAiReply(...)
        ↓
Flag human mode if low confidence or shouldHandoff
        ↓
Update contact with extracted data
        ↓
Save outbound AI message
        ↓
Send interactive button message or plain text
        ↓
Update conversation last_message
```

## Current Gemini Engine Flow

File:

```text
server/src/services/geminiEngine.ts
```

Current AI behavior:

```text
Build automotive-focused system prompt
        ↓
Segment user as EXISTING_CUSTOMER or NEW_PROSPECT
        ↓
Inject FAQ, business hours, recent messages, customer metadata
        ↓
Ask Gemini model for strict JSON
        ↓
Parse response
        ↓
Validate buttons
        ↓
Return reply, intent, confidence, action type, extracted data, handoff flag, language
```

Current hardcoding to remove:

```text
Automotive-specific prompt
Car details
Vehicle registration
Test drive button
Book service button
Get brochure button
Speak to sales button
Gemini model hardcoded as gemini-2.0-flash
```

These should become tenant/client configurable prompt templates and industry playbooks.

## Current WhatsApp Service Flow

File:

```text
server/src/services/whatsapp.ts
```

Current capabilities:

```text
sendWhatsAppMessage
sendWhatsAppButtonMessage
markAsRead
parseWebhookMessage
```

Current Graph API version:

```text
v21.0
```

Current limitation:

- WhatsApp API calls exist in both Node CRM and Java backend.
- Final enterprise design should keep platform integrations in Java backend only.
- Frontend should call Java APIs, not call embedded Node server for production logic.

## What Is Reusable

Reusable frontend parts:

```text
Layout
Routing
Dashboard cards
Inbox UI concept
Contacts UI concept
Campaign page skeleton
Analytics page shell
Settings page structure
Webhook/platform setup UI idea
```

Reusable backend prototype ideas:

```text
Conversation status model: bot/human/closed
Immediate webhook 200 response pattern
Intent + confidence capture
Human handoff threshold
Button response model
Workspace setup flow
Dashboard stats shape
```

Not suitable for final production:

```text
SQLite database
WhatsApp token stored directly in workspace table
Automotive-only AI prompt
Node webhook as final webhook processor
Duplicate WhatsApp integration outside Java backend
Hardcoded single workspace assumption
Hardcoded WhatsApp-only platform model
```

## Recommended CRM Repo Direction

Keep this repo as frontend-first.

Target structure:

```text
src/
  api/
  app/
  components/
  features/
    dashboard/
    inbox/
    contacts/
    campaigns/
    content-calendar/
    trend-intelligence/
    lead-intelligence/
    platform-integrations/
    analytics/
    approvals/
    settings/
  layouts/
  routes/
```

Move or delete `server/` after Java backend endpoints are ready.

Short-term: keep `server/` only as demo/dev mock backend.
