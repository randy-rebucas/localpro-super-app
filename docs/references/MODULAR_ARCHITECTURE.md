# LocalPro Super App — Modular Architecture

## Overview

LocalPro is a **modular monolith**: a single deployable Node.js/Express process whose business domains are divided into self-contained feature modules under `features/`. Each module owns its own models, controllers, routes, services, validators, and repositories. `src/` retains only shared platform infrastructure (auth, config, shared models, utilities).

This architecture enables:
- **Domain isolation** — changes inside a module cannot accidentally break other domains.
- **Clear ownership** — one folder = one domain = one team.
- **Incremental extraction** — any module can be promoted to a microservice later without touching other modules.
- **Testability** — each module can be unit-tested in isolation.

---

## Repository Layout

```
localpro-super-app/
├── src/                        # Shared platform infrastructure
│   ├── server.js               # App entry point — mounts all feature routes
│   ├── config/                 # DB, logger, Cloudinary, Swagger
│   ├── middleware/             # auth, errorHandler, rateLimiter, …
│   ├── models/                 # Shared/cross-domain Mongoose models (User, Communication, …)
│   ├── routes/                 # Routes NOT yet promoted to a feature module
│   ├── services/               # Shared infrastructure services (email, SMS, payment gateways, …)
│   ├── utils/                  # responseHelper, pagination, …
│   └── events/                 # Internal event bus (see §Event Bus)
│       ├── index.js
│       ├── eventBus.js
│       └── events.js
│
├── features/                   # Business domain modules
│   ├── academy/                # ✅ Fully migrated
│   ├── supplies/               # ✅ Fully migrated
│   ├── rentals/                # ✅ Fully migrated
│   ├── feeds/                  # ✅ Fully migrated
│   ├── finance/                # ✅ Fully migrated
│   ├── jobs/                   # ✅ Fully migrated
│   ├── ads/                    # ✅ Fully migrated
│   ├── agencies/               # ✅ Fully migrated
│   ├── auth/                   # ✅ Fully migrated
│   ├── provider/               # ✅ Fully migrated
│   ├── scheduling/             # ✅ Fully migrated
│   ├── support/                # ✅ Fully migrated
│   ├── ai/                     # ✅ Fully migrated
│   ├── users/                  # ✅ Fully migrated
│   ├── activities/             # ✅ Fully migrated
│   ├── communication/          # ✅ Fully migrated
│   ├── marketplace/            # ✅ Fully migrated
│   ├── alerts/                 # ✅ Fully migrated
│   ├── analytics/              # ✅ Fully migrated
│   ├── announcements/          # ✅ Fully migrated
│   └── favorites/              # ✅ Fully migrated
│
├── packages/
│   └── localpro-sdk/           # Published client SDK
├── docs/                       # Documentation
├── scripts/                    # Setup, migration, and seed scripts
└── postman/                    # Role-based Postman collections
```

**Module status key**
| Icon | Meaning |
|------|---------|
| ✅ | All files live inside `features/<domain>/`; `src/` originals deleted |
| 🔶 | `features/<domain>/index.js` boundary exists; files still in `src/`; migration pending |

---

## Feature Module Structure

Every complete module follows the same layout:

```
features/<domain>/
├── index.js            ← ONLY file external code may import
├── models/             ← Mongoose schemas owned by this domain
├── controllers/        ← Express route handlers
├── routes/             ← Express router
├── services/           ← Business logic & automated jobs
├── validators/         ← Joi/custom request validators (if needed)
├── repositories/       ← DB query abstractions (if needed)
├── errors/             ← Domain-specific error classes (if needed)
└── __tests__/          ← Unit & integration tests
```

### The `index.js` Contract

`index.js` is the **public API** of the module. It is the only file any code outside the module may `require`. It exports:

| Export | Description |
|--------|-------------|
| `routes` | Express router — mounted in `src/server.js` |
| Models | All Mongoose models owned by the domain |
| `CONSTANTS` | Domain-specific enum/constant objects |
| Services | Exported for use by `server.js` (automated jobs) or cross-domain event listeners |
| Validators | Exported for use by integration tests or shared validation |

**Example** (`features/academy/index.js`):
```js
const { eventBus, EVENTS } = require('../../src/events');

const routes = require('./routes/academy');
const { AcademyCategory, Course, Enrollment, Certification } = require('./models/Academy');
const automatedAcademyCertificateService = require('./services/automatedAcademyCertificateService');

module.exports = {
  routes,
  AcademyCategory, Course, Enrollment, Certification,
  automatedAcademyCertificateService,
};
```

---

## Import Path Rules

Files inside a module must follow these path rules:

| From | To | Pattern |
|------|----|---------|
| `features/<domain>/controllers/` | Internal model | `../models/ModelName` |
| `features/<domain>/controllers/` | Internal service | `../services/serviceName` |
| `features/<domain>/routes/` | Internal controller | `../controllers/controllerName` |
| `features/<domain>/services/` | Internal model | `../models/ModelName` |
| `features/<domain>/controllers\|routes\|services/` | Shared `src/` infra | `../../../src/middleware/auth` |
| `features/<domain>/index.js` | Internal file | `./models/…`, `./routes/…`, etc. |
| `src/` any file | Feature module | `../../features/<domain>` |
| `scripts/` any file | Feature module | `../features/<domain>/models/…` |

### What is "shared platform infrastructure"?

These always live in `src/` and are referenced from feature modules — never copied:

- `src/middleware/auth` — `auth`, `authorize`
- `src/models/User`, `Communication`, `Favorite`, `UserSettings`
- `src/services/emailService`, `notificationService`, `cloudinaryService`, `twilioService`, `paymongoService`, `paypalService`, `paymayaService`, `googleMapsService`, `aiService`
- `src/utils/responseHelper`, `paginationService`
- `src/config/logger`, `cloudinary`, `database`

---

## Internal Event Bus

Located at `src/events/`. Enables loosely coupled cross-domain communication — modules emit events instead of importing each other.

### Files

| File | Purpose |
|------|---------|
| `src/events/eventBus.js` | Singleton `AppEventEmitter` with error isolation |
| `src/events/events.js` | Frozen object of all event name constants |
| `src/events/index.js` | Entry point — exports `{ eventBus, EVENTS }` |

### Usage

```js
const { eventBus, EVENTS } = require('../../src/events');

// Emit (fire-and-forget)
eventBus.emit(EVENTS.JOB_COMPLETED, { jobId, providerId, amount });

// Synchronous listener
eventBus.on(EVENTS.JOB_COMPLETED, (payload) => { /* … */ });

// Async listener (errors are caught and logged — won't crash the emitter)
eventBus.onAsync(EVENTS.PAYMENT_RECEIVED, async ({ userId, amount }) => {
  await walletService.credit(userId, amount);
});
```

### Rule

Modules **must not** import each other directly. If module A needs to react to something module B does, B emits an event and A listens. `server.js` or a dedicated `listeners/` bootstrap file wires listeners at startup.

### Event Catalogue

Events are namespaced `domain.action` (past tense):

| Namespace | Example events |
|-----------|---------------|
| `user.*` | `user.registered`, `user.verified`, `user.deactivated` |
| `job.*` | `job.created`, `job.completed`, `job.disputed` |
| `marketplace.*` | `marketplace.booking_created`, `marketplace.booking_completed` |
| `finance.*` | `finance.payment_received`, `finance.escrow_released`, `finance.wallet_credited` |
| `referral.*` | `referral.converted`, `referral.milestone_reached` |
| `provider.*` | `provider.verified`, `provider.suspended` |
| `academy.*` | `academy.course_enrolled`, `academy.certificate_issued` |
| `supplies.*` | `supplies.order_placed`, `supplies.low_stock_alert` |
| `rentals.*` | `rentals.started`, `rentals.overdue`, `rentals.returned` |
| `scheduling.*` | `scheduling.appointment_booked`, `scheduling.appointment_cancelled` |
| `support.*` | `support.ticket_created`, `support.ticket_escalated` |
| `feeds.*` | `feeds.post_created`, `feeds.post_liked` |
| `notification.*` | `notification.send`, `email.send`, `sms.send` |
| `system.*` | `system.app_started`, `system.app_shutdown` |

Full list: [`src/events/events.js`](../src/events/events.js)

---

## How to Add a Feature Module (new domain)

1. **Create the folder structure**
   ```bash
   mkdir -p features/<domain>/{models,controllers,routes,services,validators,repositories,__tests__}
   ```

2. **Build the files** — models first, then services, then controllers, then routes.

3. **Create `features/<domain>/index.js`** exporting `routes`, models, constants, services.

4. **Mount the route in `src/server.js`**
   ```js
   const { routes: myNewRoutes } = require('../features/<domain>');
   app.use('/api/<domain>', myNewRoutes);
   ```

5. **Register automated services** (if any) inside `initializeAutomatedServices()` in `src/server.js`.

---

## How to Migrate an Existing Domain (src/ → features/)

Follow these steps to promote a `🔶` index-only module to a `✅` fully migrated module.

### Step 1 — Identify all domain files
```bash
grep -rl "<domain>" src/models src/controllers src/routes src/services \
  --include="*.js" | sort
```

### Step 2 — Copy into the feature folder
```bash
cp src/models/Foo.js              features/<domain>/models/Foo.js
cp src/controllers/fooController.js features/<domain>/controllers/fooController.js
cp src/routes/foo.js              features/<domain>/routes/foo.js
cp src/services/fooService.js     features/<domain>/services/fooService.js
```

### Step 3 — Fix import paths

Inside `features/<domain>/controllers|routes|services/`, adjust depths:

| Old (from `src/`) | New (from `features/<domain>/subdir/`) |
|-------------------|-----------------------------------------|
| `require('../models/Foo')` (own model) | `require('../models/Foo')` ← unchanged |
| `require('../models/User')` (shared) | `require('../../../src/models/User')` |
| `require('../middleware/auth')` | `require('../../../src/middleware/auth')` |
| `require('../services/emailService')` | `require('../../../src/services/emailService')` |
| `require('../config/logger')` | `require('../../../src/config/logger')` |
| `require('../utils/responseHelper')` | `require('../../../src/utils/responseHelper')` |

Quick sed helper:
```bash
sed -i "s|require('../models/User')|require('../../../src/models/User')|g" \
  features/<domain>/controllers/*.js \
  features/<domain>/routes/*.js \
  features/<domain>/services/*.js
```

### Step 4 — Update `features/<domain>/index.js` to internal paths

Change:
```js
const routes = require('../../src/routes/<domain>');       // ❌ old
```
To:
```js
const routes = require('./routes/<domain>');               // ✅ new
```

### Step 5 — Stub the `src/` originals (temporary backward compat)
```js
// src/models/Foo.js
module.exports = require('../../features/<domain>/models/Foo');
```

### Step 6 — Find and update all remaining consumers
```bash
grep -rl "models/Foo\|controllers/fooController\|routes/foo\|services/fooService" \
  --include="*.js" --exclude-dir=node_modules . \
  | grep -v "features/<domain>"
```

Update each file to import from `features/<domain>/` directly.

### Step 7 — Delete the stubs
```bash
rm src/models/Foo.js src/controllers/fooController.js \
   src/routes/foo.js src/services/fooService.js
```

### Step 8 — Verify
```bash
# Syntax check
node --check features/<domain>/models/Foo.js
node --check features/<domain>/controllers/fooController.js
node --check features/<domain>/routes/foo.js
node --check features/<domain>/index.js

# Full resolution test
node -e "const m = require('./features/<domain>'); console.log(Object.keys(m).join(', '))"

# Confirm no stray src/ references remain
grep -r "src/models/Foo\|src/routes/foo" --include="*.js" --exclude-dir=node_modules . \
  | grep -v "features/<domain>"
```

---

## Module Migration Status

| Domain | Status | Internal files | Notes |
|--------|--------|---------------|-------|
| `supplies` | ✅ Complete | models, controllers, routes, services, validators, repositories, errors | Reference implementation |
| `academy` | ✅ Complete | models, controllers, routes, services | Migrated Feb 2026 |
| `rentals` | ✅ Complete | models, controllers, routes, services, repositories, errors (Rentals model, rentalsController, 1 route, automatedRentalReminderService + 4 services, 3 repositories) | Fully wired Feb 2026 |
| `feeds` | ✅ Complete | models, controllers, routes, services | Migrated Feb 2026 |
| `finance` | ✅ Complete | models, controllers, routes, services (11 models, 5 controllers, 9 routes, 9 services) | Migrated Feb 2026 |
| `jobs` | ✅ Complete | models, controllers, routes, services (7 models, 3 controllers, 3 routes, 3 services) | Migrated Feb 2026 |
| `ads` | ✅ Complete | models, controllers, routes (2 models sets: Ads + Broadcaster; 2 controllers; 2 routes) | Migrated Feb 2026 |
| `agencies` | ✅ Complete | models, controllers, routes (2 models, 1 controller, 1 route) | Migrated Feb 2026 |
| `auth` | ✅ Complete | controllers, routes (6 controllers, 4 routes; User/AccessToken stay in src/) | Migrated Feb 2026 |
| `provider` | ✅ Complete | models, controllers, routes, services (8 models, 1 controller, 1 route, 2 services) | Migrated Feb 2026 |
| `scheduling` | ✅ Complete | models, controllers, routes, services (3 models, 2 controllers, 2 routes, 6 services) | Migrated Feb 2026 |
| `support` | ✅ Complete | models, controllers, routes, services (2 models, 2 controllers, 3 routes, 2 services) | Migrated Feb 2026 |
| `ai` | ✅ Complete | models, controllers, routes, services, subAgents (1 model, 3 controllers, 3 routes, 3 services, 10 subAgents) | Migrated Feb 2026 |
| `users` | ✅ Complete | models, controllers, routes (4 models: UserActivity, UserManagement, UserSettings, UserTrust; 1 controller, 1 route) | Migrated Feb 2026 |
| `activities` | ✅ Complete | models, controllers, routes, services (Activity model, 1 controller, 1 route, 1 service) | Migrated Feb 2026 |
| `communication` | ✅ Complete | models, controllers, routes, services (Communication model, 1 controller, 2 routes, notificationService) | Migrated Feb 2026 |
| `marketplace` | ✅ Complete | models, controllers, routes, services (Marketplace+ServiceCategory+TaskChecklist models, 1 controller, 1 route, automatedMarketplaceNoShowService) | Migrated Feb 2026 |
| `alerts` | ✅ Complete | routes (alert threshold monitoring, dedup, in-memory history; 1 route file exposing router + startAlertMonitoring + stopAlertMonitoring + checkAlerts) | Migrated Feb 2026 |
| `analytics` | ✅ Complete | models (Analytics: AnalyticsEvent+UserAnalytics+ServiceAnalytics+PlatformAnalytics; EmailAnalytics: EmailEvent+EmailDailyStats), controllers, routes, services (analyticsService class) | Migrated Feb 2026 |
| `announcements` | ✅ Complete | models (Announcement: full schema with targeting, scheduling, expiry, sticky, comments, acknowledgments, soft-delete), controllers (9 functions), routes (public+protected, with validation) | Migrated Feb 2026 |
| `favorites` | ✅ Complete | models (Favorite: user+itemType+itemId with notes, tags, viewCount; unique compound index), controllers (9 functions: add/remove/get/check/update/stats), routes (all private; supports service/provider/course/supply/job types) | Migrated Feb 2026 |

---

## Server Wiring (`src/server.js`)

`server.js` is the **only** file outside `features/` that knows the full list of modules. Its responsibilities:

1. Import routes from feature module indexes
2. Mount routes at their API paths
3. Start automated background services

```js
// ── Feature module imports ────────────────────────────────────────────────────
const { routes: suppliesRoutes }  = require('../features/supplies');
const { routes: academyRoutes }   = require('../features/academy');
const { routes: jobsRoutes,
        categoryRoutes: jobCategoriesRoutes,
        workflowRoutes: jobWorkflowRoutes } = require('../features/jobs');
// … etc.

// ── Mount routes ─────────────────────────────────────────────────────────────
app.use('/api/supplies', suppliesRoutes);
app.use('/api/academy',  academyRoutes);
app.use('/api/jobs',     jobsRoutes);
// … etc.

// ── Event bus ────────────────────────────────────────────────────────────────
const { eventBus, EVENTS } = require('./events');
httpServer.listen(PORT, () => {
  eventBus.emit(EVENTS.APP_STARTED, { port: PORT, environment });
});
```

---

## Conventions

### Naming
- Module folder: `kebab-case` (`features/job-board/`)
- Model files: `PascalCase.js` (`JobApplication.js`)
- Controller/service/route files: `camelCase.js` (`jobApplicationController.js`)

### Error handling
- Domain-specific errors extend a base class and live in `features/<domain>/errors/`
- Use `src/utils/responseHelper` (`sendServerError`, etc.) for HTTP responses

### Automated services
- All cron-based services implement `.start()` and `.stop()`
- They are started inside `initializeAutomatedServices()` in `server.js`
- Feature flags control whether they run (e.g. `ENABLE_AUTOMATED_ACADEMY_CERTIFICATES=true`)

### No circular dependencies
- Feature modules must never `require` each other
- Cross-domain reactions must go through the event bus (`src/events`)
- Shared data access (e.g. `User` model) goes through `src/models/`
