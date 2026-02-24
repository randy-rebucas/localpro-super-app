# Providers Feature — Developer Reference

## Overview

The Providers feature manages the full lifecycle of service-provider profiles:
public browse and skill discovery, authenticated profile creation and onboarding,
dashboard analytics, review management, and admin operations.

All routes are covered by `providersLimiter` (60 req / min).  
Public routes (`GET /providers`, `GET /providers/skills`, `GET /providers/:id`)
are unauthenticated; all other routes require a valid auth token.

---

## Architecture

```
features/provider/
├── controllers/
│   └── providerController.js         # 22 handlers — browse, profile, dashboard, admin, reviews
├── models/
│   ├── Provider.js                   # Core provider document
│   ├── ProviderBusinessInfo.js
│   ├── ProviderProfessionalInfo.js
│   ├── ProviderVerification.js
│   ├── ProviderFinancialInfo.js
│   ├── ProviderPreferences.js
│   ├── ProviderPerformance.js
│   └── ProviderSkill.js
├── routes/
│   └── providers.js                  # 17 routes — providersLimiter applied globally
├── services/
│   ├── providerVerificationService.js
│   └── providerDashboardService.js
└── index.js

packages/localpro-sdk/lib/providers.js  # SDK ProvidersAPI class (15 methods)
```

---

## Endpoints

### Public (no auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/providers` | `getProviders` | Paginated provider list with filters |
| `GET` | `/api/providers/skills` | `getProviderSkills` | Skills list; filterable by category ID or key |
| `GET` | `/api/providers/:id` | `getProvider` | Provider detail by ID |

### Authenticated — Provider

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/providers/profile/me` | `getMyProviderProfile` | Own provider profile |
| `POST` | `/api/providers/profile` | `createProviderProfile` | Create / upgrade to provider |
| `PUT` | `/api/providers/profile` | `updateProviderProfile` | Full profile update |
| `PATCH` | `/api/providers/profile` | `patchProviderProfile` | Partial profile update |
| `PUT` | `/api/providers/onboarding/step` | `updateOnboardingStep` | Advance onboarding step |
| `POST` | `/api/providers/documents/upload` | `uploadDocuments` | Upload verification docs (max 5 × 10 MB) |
| `GET` | `/api/providers/dashboard/overview` | `getProviderDashboard` | Dashboard overview |
| `GET` | `/api/providers/dashboard/metrics` | `getProviderMetrics` | Real-time today/week metrics |
| `GET` | `/api/providers/dashboard/activity` | `getProviderActivity` | Activity feed |
| `GET` | `/api/providers/analytics/performance` | `getProviderAnalytics` | Performance analytics |
| `GET` | `/api/providers/reviews` | `getProviderReviews` | Own reviews |
| `POST` | `/api/providers/reviews/:reviewId/respond` | `respondToReview` | Respond to a review |

### Admin only

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/providers/admin/all` | `getProvidersForAdmin` | Full provider list with all statuses |
| `PUT` | `/api/providers/admin/:id/status` | `updateProviderStatus` | Update provider status |
| `PUT` | `/api/providers/:id/status` | `updateProviderStatus` | Alias (frontend compat) |
| `PUT` | `/api/providers/admin/:id` | `adminUpdateProvider` | Full admin update (all sub-documents) |

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `providersLimiter` | 60 s | 60 req | `PROVIDERS_RATE_LIMIT` |

Applied via `router.use(providersLimiter)` before all route definitions.

---

## Validation

The route file defines four `express-validator` middleware arrays:

| Name | Used on |
|------|---------|
| `validateProviderCreation` | `POST /profile` — requires `providerType`, specialties array, valid category keys |
| `validateProviderUpdate` | `PUT /profile` — optional fields including category key validation |
| `validateProviderPatch` | `PATCH /profile` — all fields optional; validates enums (status, visibility, booleans) |
| `validateOnboardingStep` | `PUT /onboarding/step` — step name enum + data object |

---

## Error Handling

The controller uses `logger.error` / `logger.warn` (from `src/utils/logger`) in all catch blocks.
The 500-path responses do **not** expose `error.message` to clients — all return generic messages
with a `code` field (e.g., `'SKILLS_RETRIEVAL_ERROR'`).

The `process.env.NODE_ENV === 'development' ? error.message : undefined` pattern is used on
lines 1149 and 1880 — this is safe (only visible in dev environments).

---

## SDK Usage (`sdk.providers`)

```js
const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });

// Public
const { data } = await sdk.providers.list({ providerType: 'individual', category: 'cleaning', page: 1 });
const provider  = await sdk.providers.getById('<providerId>');
const skills    = await sdk.providers.getSkills({ category: 'plumbing' });

// Own profile
const me = await sdk.providers.getMyProfile();
const created = await sdk.providers.createProfile({
  providerType: 'individual',
  professionalInfo: {
    specialties: [{ category: 'cleaning', serviceAreas: ['Manila'] }]
  }
});
await sdk.providers.updateProfile({ /* full update body */ });
await sdk.providers.patchProfile({ settings: { profileVisibility: 'public' } });
await sdk.providers.updateOnboardingStep({ step: 'business_info', data: { businessName: 'ABC Services' } });
await sdk.providers.uploadDocuments(formData);

// Dashboard & analytics
const dashboard = await sdk.providers.getDashboard();
const metrics   = await sdk.providers.getMetrics();
const activity  = await sdk.providers.getActivity({ page: 1, limit: 20, type: 'booking' });
const analytics = await sdk.providers.getAnalytics({ timeframe: '30d' });

// Reviews
const reviews = await sdk.providers.getReviews({ rating: 5, sortBy: 'createdAt' });
await sdk.providers.respondToReview('<reviewId>', { responseText: 'Thank you!' });
```

---

## v2 Fix Log

| Change | Detail |
|--------|--------|
| Added `providersLimiter` | 60 req/min added to `rateLimiter.js`; applied via `router.use(providersLimiter)` to all routes |
| Fixed `error.message` leak in `getProvider` | `res.status(500)` response included `error: error.message`; removed |
| Added 4 missing SDK methods | `getMetrics()`, `getActivity()`, `getReviews()`, `respondToReview()` — endpoints existed in routes/controller but were absent from the SDK |
| Added SDK `@classdesc`/`@example` | Class-level JSDoc added to `ProvidersAPI` |
