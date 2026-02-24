# Partners Feature — Developer Reference

## Overview

The Partners feature manages third-party integration partners: their self-service
onboarding flow (public, step-by-step), admin management operations, document
verification, and analytics.

All routes are covered by `partnersLimiter` (30 req / min — tighter than other
features because this endpoint deals with API key generation and partner credentials).  
Public onboarding routes require no authentication; all admin and analytics routes
require a valid auth token.

---

## Architecture

```
features/partners/
├── controllers/
│   └── partnerController.js          # 14 handlers — onboarding, CRUD, notes, analytics, docs
├── models/
│   └── Partner.js                    # Partner document schema
├── routes/
│   └── partners.js                   # 17 routes — partnersLimiter applied globally
└── (no separate services dir — logic in controller)

packages/localpro-sdk/lib/partners.js  # SDK PartnersAPI class (16 methods)
```

---

## Onboarding Flow

```
POST /onboarding/start              ← public — creates partner in 'pending' state
         │
         ▼
PUT  /:id/business-info             ← public — business details
         │
         ▼
POST /:id/upload-documents          ← public — raw document upload (Cloudinary)
PUT  /:id/attach-document/:type     ← public — attach typed document to verification
         │
         ▼
PUT  /:id/verification              ← public — mark verification step complete
         │
         ▼
PUT  /:id/api-setup                 ← public — set webhook + callback URL
         │
         ▼
PUT  /:id/activate                  ← public — generates API key; status → active
```

---

## Endpoints

### Public (no auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/partners/onboarding/start` | `startPartnerOnboarding` | Create partner + begin onboarding |
| `PUT` | `/api/partners/:id/business-info` | `updateBusinessInfo` | Update business information |
| `POST` | `/api/partners/:id/upload-documents` | `uploadDocumentsForVerification` | Raw document upload |
| `PUT` | `/api/partners/:id/attach-document/:documentType` | `attachedDocumentForVerification` | Attach doc to verification |
| `DELETE` | `/api/partners/:id/delete-attach-document/:documentId` | `deleteAttachedDocumentForVerification` | Delete a verification doc |
| `PUT` | `/api/partners/:id/verification` | `completeVerification` | Complete verification step |
| `PUT` | `/api/partners/:id/api-setup` | `completeApiSetup` | Set webhook/callback URLs |
| `PUT` | `/api/partners/:id/activate` | `activatePartner` | Generate API key + activate |
| `GET` | `/api/partners/slug/:slug` | `getPartnerBySlug` | Lookup by slug (active only) |

### Authenticated (admin or managing partner)

| Method | Path | Roles | Handler | Description |
|--------|------|-------|---------|-------------|
| `GET` | `/api/partners/manage/:manageId` | admin, partner | `getPartnerByManageId` | Find partner by managing user |
| `GET` | `/api/partners/:id/analytics` | admin, partner | `getPartnerAnalytics` | Partner analytics data |
| `POST` | `/api/partners/:id/notes` | admin | `addPartnerNote` | Add an internal note |

### Admin only

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/partners` | `createPartner` | Admin-create a partner |
| `GET` | `/api/partners` | `getPartners` | Paginated partner list |
| `GET` | `/api/partners/:id` | `getPartnerById` | Partner detail |
| `PUT` | `/api/partners/:id` | `updatePartner` | Update partner fields |
| `DELETE` | `/api/partners/:id` | `deletePartner` | Soft-delete partner |

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `partnersLimiter` | 60 s | 30 req | `PARTNERS_RATE_LIMIT` |

Tighter than other features because the onboarding flow generates API keys and
handles sensitive credential data.

---

## Error Handling

The controller uses `logger.error` / `logger.info` (from `src/utils/logger`) in
all catch blocks. Structured error data (message, stack, name) is logged but
never sent to clients — all public-facing 500 responses use generic messages
with a `code` field.

`process.env.NODE_ENV === 'development'` spreads (`error`, `details`) are used in
some handlers — safe as they only appear in dev environments.

---

## SDK Usage (`sdk.partners`)

```js
const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });

// Public onboarding
const { data } = await sdk.partners.startOnboarding({
  name: 'Acme Corp', email: 'acme@example.com', phoneNumber: '+639001234567'
});
const id = data.partner.id;

await sdk.partners.updateBusinessInfo(id, {
  businessInfo: { companyName: 'Acme Corp', industry: 'Technology', website: 'https://acme.com' }
});
await sdk.partners.uploadDocument(id, formData);
await sdk.partners.attachDocument(id, 'business_permit', formData);
await sdk.partners.completeVerification(id);
await sdk.partners.completeApiSetup(id, {
  webhookUrl: 'https://acme.com/hooks/localpro',
  callbackUrl: 'https://acme.com/callbacks/localpro'
});
const activated = await sdk.partners.activate(id);
// activated.data.partner.apiCredentials.apiKey — store securely

// Public lookups
const partner = await sdk.partners.getBySlug('acme-corp');

// Authenticated
const mine    = await sdk.partners.getByManageId(userId);
const stats   = await sdk.partners.getAnalytics(id);

// Admin
const list    = await sdk.partners.list({ status: 'active', page: 1 });
const detail  = await sdk.partners.getById(id);
const created = await sdk.partners.create({ name: 'Beta Corp', email: 'beta@example.com', phoneNumber: '+639009999999' });
await sdk.partners.update(id, { status: 'suspended' });
await sdk.partners.addNote(id, { content: 'Follow up next month.' });
await sdk.partners.delete(id);
```

---

## v2 Fix Log

| Change | Detail |
|--------|--------|
| Added `partnersLimiter` | 30 req/min added to `rateLimiter.js`; applied via `router.use(partnersLimiter)` |
| Removed debug `console.log` calls | `console.log(existingPartner)` (createPartner), `console.log('Manual save successful')` (updateBusinessInfo), `console.log('Fetching analytics...')` (getAnalytics) |
| Removed debug `console.error` blocks | Duplicate `console.error(...)` in `updatePartner` and `updateBusinessInfo` — `logger.error` already follows each; removed the `console.error` blocks |
| Fixed `error.message` leak | `getPartnerAnalytics` was returning `error: error.message` in 500 response; replaced with generic code-only response + `logger.error` |
| Rewrote SDK from scratch | Old SDK had wrong URL prefix (`/partners` instead of `/api/partners`), `{ params }` wrapper bug in `list()`, no JSDoc, no guards, and was missing 10 of 16 methods: `startOnboarding`, `updateBusinessInfo`, `uploadDocument`, `attachDocument`, `deleteDocument`, `completeVerification`, `completeApiSetup`, `activate`, `getBySlug`, `getByManageId`, `addNote` |
