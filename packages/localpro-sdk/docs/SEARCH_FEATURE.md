# Search Feature — Developer Reference

## Overview

The Search feature provides cross-entity full-text search across all major LocalPro domains: users/providers, jobs, marketplace services, supplies, academy courses, rental items, and agencies. Search results are aggregated in parallel and ranked by a relevance score that weights title, category, description, verification, and rating.

---

## Architecture

```
features/search/
├── controllers/searchController.js   # 3 exported handlers + 7 entity-level helpers
├── routes/search.js                  # Express router; all routes use searchLimiter
└── index.js

packages/localpro-sdk/lib/search.js   # SDK SearchAPI class (9 methods)
src/services/queryOptimizationService # Used by searchUsers for compound query + caching
```

### Data flow — `globalSearch`

```
GET /api/search?q=plumbing
  └─> searchLimiter (60 req/min)
  └─> globalSearch handler
        ├─> searchUsers (queryOptimizationService, cache-backed)
        ├─> searchJobs
        ├─> searchServices
        ├─> searchSupplies
        ├─> searchCourses
        ├─> searchRentals
        └─> searchAgencies
              └─> Promise.all → merge + sort → paginate → respond
```

Each entity-level helper catches its own errors independently (returns `{ type, results: [] }`) so a single failing collection never kills the entire search response.

---

## Endpoints

### Public (no auth required — all use `searchLimiter`)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/search` | `globalSearch` | Full-text search across all entity types |
| `GET` | `/api/search/suggestions` | `getSearchSuggestions` | Autocomplete suggestions (users, jobs, services, courses) |
| `GET` | `/api/search/popular` | `getPopularSearches` | Popular search terms (static) |
| `GET` | `/api/search/advanced` | `globalSearch` | Alias with extended filter support |
| `GET` | `/api/search/entities/:type` | `globalSearch` | Search within one entity type |
| `GET` | `/api/search/categories` | inline | Static category lists by entity type |
| `GET` | `/api/search/locations` | inline | Location autocomplete (currently empty stub) |
| `GET` | `/api/search/trending` | inline | Trending search terms (static) |

### Authenticated (auth + `searchLimiter`)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/search/analytics` | inline | Record client-side search event |

### Query Parameters — `/api/search`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search query (min 2 chars) |
| `type` | string | all | Entity type filter: `users`, `jobs`, `services`, `supplies`, `courses`, `rentals`, `agencies` |
| `category` | string | — | Category slug |
| `location` | string | — | City/location name |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `rating` | number | — | Minimum average rating |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page |
| `sortBy` | string | `relevance` | `relevance`, `rating`, `price_low`, `price_high`, `newest` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `searchLimiter` | 60 s | 60 req | `SEARCH_RATE_LIMIT` |

All routes (including static `/categories`, `/locations`, `/trending`, `/popular`, `/entities/:type`, and authenticated `/analytics`) use `searchLimiter`.

---

## Error Handling

All three exported controller handlers and all four inline route handlers use `sendServerError(res, error, message, code)` from `src/utils/responseHelper`. Entity-level search helpers (`searchUsers`, `searchJobs`, etc.) use `logger.error` and return `{ type, results: [] }` — they never propagate errors to the main handler.

**Error codes:**

| Code | Handler |
|------|---------|
| `GLOBAL_SEARCH_ERROR` | `globalSearch` |
| `GET_SEARCH_SUGGESTIONS_ERROR` | `getSearchSuggestions` |
| `GET_POPULAR_SEARCHES_ERROR` | `getPopularSearches` |
| `GET_SEARCH_CATEGORIES_ERROR` | `GET /categories` inline |
| `GET_SEARCH_LOCATIONS_ERROR` | `GET /locations` inline |
| `GET_TRENDING_SEARCHES_ERROR` | `GET /trending` inline |
| `TRACK_SEARCH_ANALYTICS_ERROR` | `POST /analytics` inline |

---

## Relevance Scoring

`calculateRelevanceScore(query, item)` adds points for field matches:

| Match | Points |
|-------|--------|
| `title` or `name` exact substring | +10 |
| `profile.businessName` | +8 |
| `category` | +6 |
| `profile.skills` or `profile.specialties` | +5 |
| `description` | +4 |
| `isVerified === true` | +2 |
| `rating >= 4` | +2 |

---

## SDK — `SearchAPI`

```js
const sdk = new LocalProSDK({ baseURL: '...', token: 'JWT' });

// Full search
const res = await sdk.search.search({ q: 'plumbing', type: 'users', location: 'Manila' });

// Autocomplete
const s = await sdk.search.getSuggestions({ q: 'clean', limit: 5 });

// Popular terms (public, no auth)
const popular = await sdk.search.getPopular({ limit: 10 });

// Advanced search
const adv = await sdk.search.advancedSearch({ q: 'carpenter', verified: true, availability: 'available' });

// Search within one entity type
const jobs = await sdk.search.searchByType('jobs', { q: 'electrician', minPrice: 500 });

// Static data (public, no auth)
const cats = await sdk.search.getCategories();
const locs = await sdk.search.getLocations({ q: 'Man' });
const trend = await sdk.search.getTrending({ period: 'week' });

// Track analytics (auth required)
await sdk.search.trackAnalytics({ query: 'plumbing', results: 14 });
```

### SDK Method Reference

| Method | Parameters | Auth | Description |
|--------|-----------|------|-------------|
| `search(searchParams)` | `{ q, type?, category?, location?, minPrice?, maxPrice?, rating?, page?, limit?, sortBy?, sortOrder? }` | No | Cross-entity full-text search |
| `getSuggestions(params)` | `{ q, limit? }` | No | Autocomplete suggestions |
| `getPopular(filters?)` | `{ limit? }` | No | Popular search terms |
| `advancedSearch(searchParams)` | `{ q, type?, dateFrom?, dateTo?, verified?, availability?, jobType?, isRemote?, page?, limit? }` | No | Advanced search with extended filters |
| `searchByType(entityType, searchParams)` | `entityType: string`, `{ q, category?, location?, page?, limit? }` | No | Search within one entity type |
| `getCategories()` | — | No | All category lists by entity type |
| `getLocations(filters?)` | `{ q?, limit? }` | No | Location autocomplete |
| `getTrending(filters?)` | `{ period?, limit? }` | No | Trending search terms |
| `trackAnalytics(data)` | `{ query, results?, filters?, userId?, timestamp? }` | Yes | Record search analytics |

### Input Validation Guards

The SDK throws synchronously for invalid arguments:

| Method | Guard |
|--------|-------|
| `search(searchParams)` | `searchParams` non-null object; `q` ≥ 2 chars |
| `getSuggestions(params)` | `params` non-null object; `q` ≥ 2 chars |
| `advancedSearch(searchParams)` | `searchParams` non-null object; `q` ≥ 2 chars |
| `searchByType(entityType, searchParams)` | `entityType` non-empty string; `searchParams` non-null object; `q` ≥ 2 chars |
| `trackAnalytics(analyticsData)` | `analyticsData` non-null object; `query` non-empty |

---

## Hardening Changelog

| Version | Change |
|---------|--------|
| v2 | Added `searchLimiter` to `/popular`, `/entities/:type`, `/categories`, `/locations`, `/trending`, `/analytics` — all routes now rate-limited |
| v2 | Added `sendServerError` import to routes; replaced 4 inline catch blocks using `process.env.NODE_ENV` conditional `error.message` with `logger.error` + `sendServerError` |
| v2 | Added `sendServerError` import to controller; replaced 3 catch blocks (`globalSearch`, `getSearchSuggestions`, `getPopularSearches`) that used `process.env.NODE_ENV` conditional with `sendServerError` |
| v2 | SDK: added `@classdesc` + `@example` block to `SearchAPI`; added synchronous object-type guards to `search`, `getSuggestions`, `advancedSearch`, `searchByType`, `trackAnalytics` |
