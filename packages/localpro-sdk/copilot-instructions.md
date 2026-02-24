# Copilot Instructions — `@localpro/sdk`

These instructions apply when working inside `packages/localpro-sdk/`.
They supplement the root `.github/copilot-instructions.md`.

---

## Package at a Glance

| Item | Value |
|---|---|
| Package name | `@localpro/sdk` |
| Current version | `4.1.0` |
| Entry point | `index.js` |
| Runtime | Node ≥ 14 |
| Only dependency | `axios` |
| Publish commands | `npm run publish:patch / minor / major` |

---

## Folder Structure

```
packages/localpro-sdk/
  index.js              ← main entry; instantiates every API class
  lib/
    client.js           ← LocalProClient base (axios wrapper + error handling)
    errors.js           ← error hierarchy (LocalProError → …APIError, …AuthError, etc.)
    marketplace.js      ← MarketplaceAPI class
    auth.js             ← AuthAPI class
    jobs.js             ← JobsAPI class
    … (one file per domain)
  docs/
    AUTH_SECURITY.md    ← auth hardening reference
    MARKETPLACE_FEATURE.md ← marketplace endpoint + fix reference
  examples/             ← runnable usage examples
  MODULES.md            ← auto-generated module overview
  CHANGELOG.md
  PUBLISHING.md
  README.md
```

---

## Core Conventions

### 1. One class per domain, one file

Each `lib/<domain>.js` exports a single class (e.g. `MarketplaceAPI`).  
Constructor always receives the shared `client` instance:

```js
class MarketplaceAPI {
  constructor(client) {
    this.client = client;
  }
  async getServices(filters = {}) {
    return this.client.get('/api/marketplace/services', filters);
  }
}
module.exports = MarketplaceAPI;
```

### 2. Wire new modules in `index.js`

Adding a new domain requires two things in `index.js`:
1. `require` the class at the top.
2. Assign it to `this.<namespace>` inside the `LocalPro` constructor.

```js
// top of index.js
const WidgetsAPI = require('./lib/widgets');

// inside constructor
this.widgets = new WidgetsAPI(this);
```

### 3. HTTP helpers on `LocalProClient`

`lib/client.js` exposes `get`, `post`, `put`, `patch`, `delete`.  
All methods return the unwrapped `response.data` after interceptor processing.
Never reach for `axios` directly inside a module file.

### 4. Input validation before every request

Guard required fields at the top of each method before the `this.client.*` call:

```js
async createBooking(data) {
  if (!data.serviceId) throw new Error('serviceId is required');
  return this.client.post('/api/marketplace/bookings', data);
}
```

### 5. JSDoc on every public method

Every exported method must have `@param`, `@returns`, and at least one line description.  
Use `@throws {LocalProValidationError}` when the method validates input locally.

### 6. Error types (do not invent new ones)

| Class | When to use |
|---|---|
| `LocalProError` | Base — never throw directly |
| `LocalProAPIError` | General non-2xx response |
| `LocalProAuthenticationError` | 401 / 403 |
| `LocalProValidationError` | 422 / validation failure |
| `LocalProNotFoundError` | 404 |
| `LocalProRateLimitError` | 429 |

Import from `./errors` in `lib/client.js`; module files do not import errors directly.

---

## Adding a New Module

1. Create `lib/<domain>.js` following the class pattern above.
2. Add the `require` + `this.<namespace>` lines in `index.js`.
3. Add a section to `MODULES.md` with the key methods listed.
4. If there are notable security or behavioral details, create `docs/<DOMAIN>_FEATURE.md`.
5. Bump the patch version: `npm run publish:patch`.

---

## Updating an Existing Module

When the backend changes an endpoint (method, path, payload shape):

1. Find the corresponding method in `lib/<domain>.js`.
2. Update the path string, params, and JSDoc.
3. If a field is **removed or renamed**, note it as a breaking change in `CHANGELOG.md`.
4. Regenerate / update `MODULES.md` key-methods list if the public surface changed.
5. If the change warrants docs, update `docs/<DOMAIN>_FEATURE.md`.

---

## Sync Rules with the Backend

- The **source of truth for payload shapes** is `docs/` in the repo root (e.g. `docs/API_REFERENCE.md`).
- If an API reference doc conflicts with the live controller, flag it — do not silently pick one.
- ObjectId fields must be validated in the SDK method before the request if the API returns a 400 on invalid IDs (not 422). Pass them as strings; never coerce to `ObjectId` on the SDK side.
- `durationUnit` on marketplace bookings is `'minutes' | 'hours' | 'days'` — always document the unit alongside `duration` params.

---

## Rate Limits to Document

When a backend route gains a rate limiter, note the limit in the SDK method's JSDoc `@throws` and in the relevant `docs/` file.

| Limiter | Window | Limit | Applied to |
|---|---|---|---|
| `marketplaceLimiter` | 1 min | 120 req | `createBooking`, `openDispute`, `addClientReview` |
| `aiLimiter` | 10 min | 20 req | All `client.ai.*` methods |
| (auth limiter) | — | — | login, register, OTP endpoints |

---

## Docs Files (`docs/`)

| File | Purpose |
|---|---|
| `AUTH_SECURITY.md` | Auth hardening — JWT rotation, device tracking, audit events |
| `MARKETPLACE_FEATURE.md` | Marketplace — lifecycle diagrams, v2 fixes, full SDK method table |
| `AI_FEATURE.md` | AI feature — endpoint reference, AI Bot events, rate limiting, v2 fix log, SDK method table |

> **Rule — Always create documentation.**  
> After completing every feature audit or hardening session, **always** create (or update)
> `docs/<DOMAIN>_FEATURE.md` before committing. This is not optional.
> At a minimum the file must contain: architecture overview, all endpoints with request/response
> shapes, a v-fix log table listing every issue fixed, a rate limiting table if applicable,
> and a full SDK method reference table.

When creating a new docs file:
- Follow the heading structure of existing docs.
- Include a **v-fix log table** if the doc covers a hardening session.
- Include a **rate limiting table** if routes are throttled.
- Link from `README.md` `## <Domain> API` section with a `> Further reading:` callout.

---

## Publishing Checklist

- [ ] All changed methods have updated JSDoc.
- [ ] `CHANGELOG.md` has an entry for this version.
- [ ] `MODULES.md` reflects any new/removed public methods.
- [ ] Breaking changes are called out with a `**BREAKING:**` prefix in `CHANGELOG.md`.
- [ ] Version bumped via `npm run publish:patch / minor / major` (not manual edit).
