# AI Feature — Developer Reference

> **Applies to:** LocalPro API v2 · SDK `lib/ai.js`  
> **Last updated:** 2026-02-25

This document covers the AI feature: marketplace intelligence tools, user bio generation, and the AI Bot event/escalation system. It also documents the v2 hardening fixes applied to the backend.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Configuration](#2-configuration)
3. [AI Marketplace Tools](#3-ai-marketplace-tools)
4. [AI User Tools](#4-ai-user-tools)
5. [AI Bot — Events](#5-ai-bot--events)
6. [AI Bot — Interactions & Escalations](#6-ai-bot--interactions--escalations)
7. [Rate Limiting](#7-rate-limiting)
8. [v2 Bug Fixes & Security Hardening](#8-v2-bug-fixes--security-hardening)
9. [SDK Methods](#9-sdk-methods)

---

## 1. Architecture Overview

```
features/ai/
  controllers/
    aiMarketplaceController.js   — 14 marketplace AI handlers (1038 lines)
    aiUserController.js          — user bio generation
    aiBotController.js           — AI Bot event + escalation handlers
  services/
    aiService.js                 — OpenAI wrapper + all prompt methods
    aiBotService.js              — interaction storage + escalation logic
    aiBotEventListener.js        — event emitter bridge
    subAgents/                   — domain-specific AI sub-agents
      bookingAgent.js
      escrowAgent.js
      paymentAgent.js
      supportAgent.js
      analyticsAgent.js
      auditAgent.js
      marketingAgent.js
      operationsAgent.js
      providerAgent.js
  models/
    AIBot.js                     — AIBotInteraction Mongoose model
  routes/
    aiMarketplace.js             — /api/ai/marketplace/*
    aiUsers.js                   — /api/ai/users/*
    aiBot.js                     — /api/ai-bot/*
```

**Base URLs:**
| Group | Base |
|---|---|
| Marketplace AI | `/api/ai/marketplace` |
| User AI | `/api/ai/users` |
| AI Bot | `/api/ai-bot` |

---

## 2. Configuration

| Env var | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes (for live AI) | — | OpenAI authentication |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Override for alternative OpenAI-compatible endpoints |
| `AI_MODEL` | No | `gpt-4o-mini` | Model to use for all completions |
| `AI_PROVIDER` | No | `openai` | Provider identifier (informational) |

When `OPENAI_API_KEY` is not set, all AI endpoints return **fallback/mock responses** rather than failing — the server logs a `warn` and continues. This allows development without credentials.

---

## 3. AI Marketplace Tools

All routes require authentication (`Bearer` token). Provider/Admin-only routes are noted.

### Natural language search

```
POST /api/ai/marketplace/recommendations
{ "query": "affordable house cleaning near Manila", "context": {} }
```

Returns matched services filtered by AI-extracted parameters (category, location, price range, keywords). Uses MongoDB `$text` search for keywords — no `$regex` on user input.

### Price estimator

```
POST /api/ai/marketplace/price-estimator
{
  "serviceType": "deep cleaning",
  "category": "cleaning",
  "location": "Manila",
  "duration": 3,
  "complexity": "high"
}
```

Returns `{ estimatedPrice, priceRange: { min, max }, confidence, factors[] }` backed by live market data from the `Service` collection.

### Service matcher

```
POST /api/ai/marketplace/service-matcher
{
  "requirements": "I need a licensed plumber available weekends under PHP 1000",
  "filters": { "category": "plumbing", "location": "Quezon City" }
}
```

Returns top 10 scored matches. Each service is trimmed to essential fields (`_id`, `title`, `category`, `subcategory`, `basePrice`, `ratingAvg`) before being sent to OpenAI to prevent token bloat.

### Review sentiment

```
POST /api/ai/marketplace/review-sentiment
{ "reviewText": "Great work but arrived 30 minutes late" }
// or fetch by booking ID:
{ "reviewId": "<bookingObjectId>" }
```

Returns `{ sentiment, score, themes[], actionableInsights[], summary }`.

### Booking assistant

```
POST /api/ai/marketplace/booking-assistant
{ "query": "Can I reschedule for next week?", "serviceId": "<id>", "bookingId": "<id>" }
```

Context is auto-enriched with service and booking data when IDs are provided.

### Description generator _(Provider/Admin)_

```
POST /api/ai/marketplace/description-generator
{ "title": "AC Installation", "category": "hvac", "features": ["inverter", "split-type"] }
```

### Description from title _(any authenticated user)_

```
POST /api/ai/marketplace/description-from-title
{
  "title": "Pet Grooming",
  "options": { "length": "medium", "tone": "friendly", "includeFeatures": true }
}
```

Returns `{ description, keyFeatures[], benefits[], tags[], wordCount }`.

Add `?debug=true` (admin only) to include raw AI response metadata in the reply.

### Pricing optimizer _(Provider/Admin)_

```
POST /api/ai/marketplace/pricing-optimizer
{ "serviceId": "<id>" }
```

### Demand forecast _(Provider/Admin)_

```
POST /api/ai/marketplace/demand-forecast
{ "serviceId": "<id>", "period": "30 days" }
```

### Review insights _(Provider/Admin)_

```
POST /api/ai/marketplace/review-insights
{ "serviceId": "<id>", "limit": 50 }
```

`limit` is server-side capped at 50 regardless of request value.

### Response assistant _(Provider/Admin)_

```
POST /api/ai/marketplace/response-assistant
{ "reviewId": "<bookingId>", "messageType": "review" }
```

### Listing optimizer _(Provider/Admin)_

```
POST /api/ai/marketplace/listing-optimizer
{ "serviceId": "<id>" }
```

### Scheduling assistant

```
POST /api/ai/marketplace/scheduling-assistant
{ "query": "Best slot this Friday afternoon", "serviceId": "<id>" }
```

### Form pre-filler

```
POST /api/ai/marketplace/form-prefiller
{ "input": "I offer residential deep cleaning in BGC area, PHP 600/hr" }
```

Returns suggested field values for the service creation form (title, category, pricing, serviceArea, etc.).

---

## 4. AI User Tools

### Generate user bio

```
POST /api/ai/users/bio-generator
{
  "userId": "<ObjectId>",        // optional — admin only, defaults to own user
  "preferences": {
    "tone": "professional",      // professional | friendly | casual | formal
    "length": "medium",          // short | medium | long
    "focus": "skills"            // general | skills | experience | business | achievements
  }
}
```

Auto-fetches the target user's `firstName`, `lastName`, `roles`, `skills`, `experience`, `certifications`, and `profile` fields to build the prompt.

---

## 5. AI Bot — Events

The AI Bot listens to application events and routes them to domain-specific sub-agents.

| Endpoint | Sub-agent triggered |
|---|---|
| `POST /api/ai-bot/events` | Generic — routes by `type` field |
| `POST /api/ai-bot/events/app` | Application-level events |
| `POST /api/ai-bot/events/pos` | POS events |
| `POST /api/ai-bot/events/payment` | PaymentAgent |
| `POST /api/ai-bot/events/gps` | GPS/location events |
| `POST /api/ai-bot/events/crm` | CRM events |

**Process a generic event:**
```json
POST /api/ai-bot/events
{
  "type": "booking_created",
  "source": "marketplace",
  "data": { "bookingId": "<id>", "amount": 500 },
  "context": {}
}
```

---

## 6. AI Bot — Interactions & Escalations

### Get interaction history

```
GET /api/ai-bot/interactions?userId=<id>&status=escalated&page=1&limit=50
```

### Get interaction by ID

```
GET /api/ai-bot/interactions/:eventId
```

### AI Bot analytics _(Admin)_

```
GET /api/ai-bot/analytics?timeRange=7d
```

`timeRange` values: `1h` | `24h` | `7d` | `30d`

### Escalation management _(Admin)_

| Action | Endpoint |
|---|---|
| List escalations | `GET /api/ai-bot/escalations` |
| Assign to admin | `POST /api/ai-bot/interactions/:eventId/assign` |
| Resolve | `POST /api/ai-bot/interactions/:eventId/resolve` |

```json
// Assign
{ "adminId": "<ObjectId>" }

// Resolve
{ "resolution": "Refund issued — provider confirmed no-show" }
```

---

## 7. Rate Limiting

All three AI route groups share the `aiLimiter`:

| Limiter | Window | Max requests | Applied to |
|---|---|---|---|
| `aiLimiter` | 10 min | 20 | `/api/ai/*` and `/api/ai-bot/*` |

This is intentionally strict — every request triggers a paid OpenAI API call.

Set `DISABLE_RATE_LIMIT=true` in `.env` to bypass during development.

---

## 8. v2 Bug Fixes & Security Hardening

### Security fixes

| # | Issue | Fix |
|---|---|---|
| 1 | `aiNaturalLanguageSearch` built `$regex` from joined user keywords — ReDoS vector | Replaced with `$text: { $search: keywords.join(' ') }` using existing text index |
| 2 | `serviceMatcher` built `$regex(filters.location)` from raw user string — ReDoS vector | Passed through `escapeRegex()` helper before use in regex |
| 3 | `makeAICall` debug log emitted first 7 chars of API key (`apiKeyPrefix`) | Field removed entirely from log output |
| 4 | `?debug=true` in `generateDescriptionFromTitle` returned raw AI internals to any authenticated user | Now restricted to admin role only |

### Rate limiting

| # | Addition |
|---|---|
| 5 | Added `aiLimiter` (20 req / 10 min) to `src/middleware/rateLimiter.js` |
| 6 | Applied `aiLimiter` to `/api/ai/marketplace/*` route file |
| 7 | Applied `aiLimiter` to `/api/ai/users/*` route file |
| 8 | Applied `aiLimiter` to `/api/ai-bot/*` route file |

### Architecture fixes

| # | Issue | Fix |
|---|---|---|
| 9 | `formPrefiller` had inline `require(User)` inside the handler function | Moved to top of `aiMarketplaceController.js` |
| 10 | `serviceMatcher` serialised full service documents (title, description, images, etc.) to OpenAI | Now trimmed to `{_id, title, category, subcategory, basePrice, ratingAvg}` — prevents token exhaustion |
| 11 | `reviewInsights` `limit` was entirely client-controlled — could send thousands of reviews to OpenAI | Server-side cap added at 50 |
| 12 | All 12 `res.status(500).json()` in `aiBotController` had inconsistent shape | Replaced with `sendServerError()` for uniform error responses |
| 13 | ~5 `logger.info` debug calls in `generateDescriptionFromTitle` fire in all environments | Replaced with `debugLog` (no-op in production) |
| 14 | `aiService.js` had a `logger.info` call logging raw AI request details | Replaced with `debugLog` |

### SDK rewrite

| # | Issue | Fix |
|---|---|---|
| 15 | `lib/ai.js` was a 2-method placeholder (`getBotResponse`, `getMarketplaceItems`) with broken client call pattern (`this.client.client.post`) | Fully rewritten: 30 methods across all three route groups, consistent use of `this.client.post/get`, input validation, JSDoc on every method |

---

## 9. SDK Methods

All methods are available as `client.ai.*`.

### AI Marketplace

| Method | Endpoint | Access |
|---|---|---|
| `naturalLanguageSearch(data)` | `POST /api/ai/marketplace/recommendations` | Authenticated |
| `estimatePrice(data)` | `POST /api/ai/marketplace/price-estimator` | Authenticated |
| `matchService(data)` | `POST /api/ai/marketplace/service-matcher` | Authenticated |
| `analyzeReviewSentiment(data)` | `POST /api/ai/marketplace/review-sentiment` | Authenticated |
| `assistBooking(data)` | `POST /api/ai/marketplace/booking-assistant` | Authenticated |
| `generateDescription(data)` | `POST /api/ai/marketplace/description-generator` | Provider/Admin |
| `generateDescriptionFromTitle(data)` | `POST /api/ai/marketplace/description-from-title` | Authenticated |
| `optimizePricing(data)` | `POST /api/ai/marketplace/pricing-optimizer` | Provider/Admin |
| `forecastDemand(data)` | `POST /api/ai/marketplace/demand-forecast` | Provider/Admin |
| `getReviewInsights(data)` | `POST /api/ai/marketplace/review-insights` | Provider/Admin |
| `assistResponse(data)` | `POST /api/ai/marketplace/response-assistant` | Provider/Admin |
| `optimizeListing(data)` | `POST /api/ai/marketplace/listing-optimizer` | Provider/Admin |
| `assistScheduling(data)` | `POST /api/ai/marketplace/scheduling-assistant` | Authenticated |
| `prefillForm(data)` | `POST /api/ai/marketplace/form-prefiller` | Authenticated |

### AI Users

| Method | Endpoint | Access |
|---|---|---|
| `generateUserBio(data)` | `POST /api/ai/users/bio-generator` | Authenticated |

### AI Bot — Events

| Method | Endpoint | Access |
|---|---|---|
| `processEvent(data)` | `POST /api/ai-bot/events` | Authenticated |
| `emitAppEvent(eventData)` | `POST /api/ai-bot/events/app` | Authenticated |
| `emitPOSEvent(eventData)` | `POST /api/ai-bot/events/pos` | Authenticated |
| `emitPaymentEvent(eventData)` | `POST /api/ai-bot/events/payment` | Authenticated |
| `emitGPSEvent(eventData)` | `POST /api/ai-bot/events/gps` | Authenticated |
| `emitCRMEvent(eventData)` | `POST /api/ai-bot/events/crm` | Authenticated |

### AI Bot — Interactions & Escalations

| Method | Endpoint | Access |
|---|---|---|
| `getInteractions(params)` | `GET /api/ai-bot/interactions` | Authenticated |
| `getInteractionById(eventId)` | `GET /api/ai-bot/interactions/:eventId` | Authenticated |
| `getAnalytics(params)` | `GET /api/ai-bot/analytics` | Admin |
| `getEscalatedInteractions(params)` | `GET /api/ai-bot/escalations` | Admin |
| `assignEscalation(eventId, adminId)` | `POST /api/ai-bot/interactions/:eventId/assign` | Admin |
| `resolveEscalation(eventId, resolution)` | `POST /api/ai-bot/interactions/:eventId/resolve` | Admin |

---

### SDK Usage Examples

```js
const client = new LocalPro({ apiKey, apiSecret });

// ── Marketplace AI ────────────────────────────────────────────────────────────

// Natural language search
const results = await client.ai.naturalLanguageSearch({
  query: 'affordable plumber in Makati available this weekend',
});

// Generate description from title only
const desc = await client.ai.generateDescriptionFromTitle({
  title: 'Aircon Cleaning & Servicing',
  options: { length: 'medium', tone: 'professional' }
});
console.log(desc.data.description);

// Match service to requirements
const matches = await client.ai.matchService({
  requirements: 'Licensed electrician for panel upgrade, budget PHP 3000',
  filters: { category: 'electrical', location: 'BGC' }
});

// Pre-fill form before creating a service
const prefill = await client.ai.prefillForm({
  input: 'Residential painting, interior walls, PHP 350/sqm, available Metro Manila'
});
// Use prefill.data.suggestions to populate the createService call

// ── User AI ───────────────────────────────────────────────────────────────────

// Generate bio for currently authenticated user
const bio = await client.ai.generateUserBio({
  preferences: { tone: 'professional', length: 'medium', focus: 'skills' }
});

// ── AI Bot ────────────────────────────────────────────────────────────────────

// Emit a payment event
await client.ai.emitPaymentEvent({
  type: 'payment_received',
  bookingId: '<id>',
  amount: 1500
});

// List escalations (admin)
const escalations = await client.ai.getEscalatedInteractions({
  resolved: false,
  page: 1,
  limit: 20
});

// Resolve an escalation (admin)
await client.ai.resolveEscalation('<eventId>', 'Refund processed — provider confirmed no-show');
```
