# LocalPro Plus - Feature Documentation

## Table of Contents
1. [Overview](#1-overview)
2. [Subscription Lifecycle](#2-subscription-lifecycle)
3. [API Endpoints](#3-api-endpoints)
   - [Public Routes](#public-routes)
   - [User Routes](#user-routes)
   - [Admin Routes](#admin-routes)
4. [Data Models](#4-data-models)
5. [Feature Flags & Access Control](#5-feature-flags--access-control)
6. [Middleware Reference](#6-middleware-reference)
7. [Payment Gateway Integration](#7-payment-gateway-integration)
8. [Automated Background Jobs](#8-automated-background-jobs)
9. [Usage Tracking](#9-usage-tracking)
10. [Email Notifications](#10-email-notifications)
11. [Known Limitations & Notes](#11-known-limitations--notes)

---

## 1. Overview

LocalPro Plus is LocalPro's subscription tier system. It unlocks premium features for users (priority support, advanced analytics, custom branding, API access, white-label mode) and enforces per-plan usage limits on services, bookings, storage, and API calls.

**Base route:** `/api/localpro-plus`
**Auth:** All routes except `GET /plans` and `GET /plans/:id` require a valid JWT Bearer token.

### Available Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/localpro-plus/plans` | No | — | List all active plans |
| `GET` | `/api/localpro-plus/plans/:id` | No | — | Get a single plan |
| `POST` | `/api/localpro-plus/plans` | Yes | Admin | Create a plan |
| `PUT` | `/api/localpro-plus/plans/:id` | Yes | Admin | Update a plan |
| `DELETE` | `/api/localpro-plus/plans/:id` | Yes | Admin | Delete a plan |
| `POST` | `/api/localpro-plus/subscribe/:planId` | Yes | Any | Initiate a subscription |
| `POST` | `/api/localpro-plus/confirm-payment` | Yes | Any | Confirm payment & activate subscription |
| `POST` | `/api/localpro-plus/cancel` | Yes | Any | Cancel active subscription |
| `POST` | `/api/localpro-plus/renew` | Yes | Any | Manually renew subscription |
| `GET` | `/api/localpro-plus/my-subscription` | Yes | Any | Get own subscription details |
| `PUT` | `/api/localpro-plus/settings` | Yes | Any | Update subscription settings |
| `GET` | `/api/localpro-plus/usage` | Yes | Any | Get usage stats & feature flags |
| `GET` | `/api/localpro-plus/analytics` | Yes | Admin | Platform-wide subscription analytics |
| `POST` | `/api/localpro-plus/admin/subscriptions` | Yes | Admin | Create a manual subscription |
| `GET` | `/api/localpro-plus/admin/subscriptions` | Yes | Admin | List all subscriptions |
| `GET` | `/api/localpro-plus/admin/subscriptions/user/:userId` | Yes | Admin | Get subscription by user ID |
| `PUT` | `/api/localpro-plus/admin/subscriptions/:subscriptionId` | Yes | Admin | Update a manual subscription |
| `DELETE` | `/api/localpro-plus/admin/subscriptions/:subscriptionId` | Yes | Admin | Cancel a manual subscription |

---

## 2. Subscription Lifecycle

### State Machine

```
                ┌──────────────────────────────────────────────────────────┐
                │              LOCALPRO PLUS SUBSCRIPTION STATES           │
                └──────────────────────────────────────────────────────────┘

  POST /subscribe/:planId         POST /confirm-payment
  ────────────────────            ─────────────────────
     (none) ─────────> pending ───────────────────────> active
                                                           │
                              ┌────────────────────────────┼────────────────────────────┐
                              │                            │                            │
                  POST /cancel │              endDate < now │     POST /renew             │
                              ▼              (cron 3:00 AM)│    (extends endDate)        │
                          cancelled                        ▼                            │
                                                        expired                         │
                                                           │                            │
                                                           │ (cron 11:00 AM win-back)   │
                                                           └────────────────────────────┘
                                                           (no status change, email only)

  Admin (isManual only):
  PUT /admin/subscriptions/:id can set: active ↔ suspended, → cancelled, → expired
```

### Status Definitions

| Status | Description | Set By |
|---|---|---|
| `pending` | Payment initiated but not yet confirmed | `POST /subscribe/:planId` |
| `active` | Payment confirmed; subscription is live | `POST /confirm-payment` or admin creation |
| `cancelled` | User or admin cancelled the subscription | `POST /cancel` or admin action |
| `expired` | `endDate` has passed; processed by daily cron | Automated cron at 3:00 AM |
| `suspended` | Admin-paused (manual subscriptions only) | Admin `PUT /admin/subscriptions/:id` |

### isActive() Logic

A subscription is considered active only when **both** conditions are true:
- `status === 'active'`
- `endDate` is in the future (or no `endDate` is set)

### Subscription History Actions

Every state change appends an entry to `subscription.history[]` with one of these `action` values:
`subscribed` | `upgraded` | `downgraded` | `cancelled` | `renewed` | `suspended` | `reactivated`

---

## 3. API Endpoints

### Public Routes

These routes do **not** require authentication.

---

#### GET /api/localpro-plus/plans

List all active subscription plans, sorted by price ascending.

**Response `200`**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64a...",
      "name": "Basic",
      "description": "Starter plan for individuals",
      "price": { "monthly": 9.99, "yearly": 99.99, "currency": "USD" },
      "features": [
        { "name": "priority_support", "description": "...", "included": false, "limit": null, "unit": null }
      ],
      "limits": { "maxServices": 5, "maxBookings": 20, "maxStorage": 500, "maxApiCalls": 1000 },
      "benefits": ["Up to 5 services", "20 bookings/month"],
      "isActive": true,
      "isPopular": false,
      "sortOrder": 0
    }
  ]
}
```

---

#### GET /api/localpro-plus/plans/:id

Get a single subscription plan by ID.

**Path Params:** `id` — SubscriptionPlan MongoDB ObjectId

**Response `200`**
```json
{ "success": true, "data": { /* SubscriptionPlan document */ } }
```

**Response `404`**
```json
{ "success": false, "message": "Plan not found" }
```

---

### User Routes

All routes below require `Authorization: Bearer <token>`.

---

#### POST /api/localpro-plus/subscribe/:planId

Initiate a subscription to a plan. Creates a payment hold/order at the gateway and sets subscription status to `pending`.

**Path Params:** `planId` — SubscriptionPlan MongoDB ObjectId

**Request Body**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `paymentMethod` | string | Yes | — | `paymongo`, `paypal`, or `paymaya` |
| `billingCycle` | string | No | `monthly` | `monthly` (30 days) or `yearly` (365 days) |

**Guard Checks**
1. Plan must exist and be active.
2. User must not already have an `active` subscription.

**Example Request**
```bash
curl -X POST /api/localpro-plus/subscribe/64a... \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "paymentMethod": "paymongo", "billingCycle": "monthly" }'
```

**Response `201`**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": { /* UserSubscription document, status: pending */ },
    "paymentData": { /* gateway-specific checkout/intent data */ }
  }
}
```

**Response `400`** — Missing fields, plan inactive, or user already has active subscription.
**Response `404`** — Plan not found.
**Response `500`** — Gateway payment initiation failed.

> **Note:** PayMongo subscriptions cannot be confirmed via `POST /confirm-payment` or renewed via `POST /renew`. PayMongo is only supported for the initial payment authorization.

---

#### POST /api/localpro-plus/confirm-payment

Capture/confirm a pending payment to activate the subscription.

**Supported gateways:** `paypal`, `paymaya` only. PayMongo returns `400`.

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `paymentId` | string | Yes | Order or payment ID returned by the gateway |
| `paymentMethod` | string | Yes | `paypal` or `paymaya` |

**Guard Checks**
1. User must have a subscription.
2. Subscription must be in `pending` status.

**Response `200`**
```json
{
  "success": true,
  "message": "Subscription payment confirmed successfully",
  "data": { /* UserSubscription with plan populated, status: active */ }
}
```

**Response `400`** — Missing fields, invalid payment method, or subscription not pending.
**Response `404`** — No subscription found.

**Side Effects**
- Sets `subscription.status = 'active'`.
- Records `lastPaymentId` and `lastPaymentDate`.
- Creates a `Payment` record with `status: 'completed'`.
- Sends `subscription-confirmation` email to the user.

---

#### POST /api/localpro-plus/cancel

Cancel an active subscription.

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `reason` | string | No | Stored as `cancellationReason`; defaults to `"User requested cancellation"` |

**Guard Checks**
1. User must have a subscription with `status: 'active'`.

**Response `200`**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": { /* UserSubscription document, status: cancelled */ }
}
```

**Response `400`** — Subscription not active.
**Response `404`** — No subscription found.

**Side Effects**
- Sets `status = 'cancelled'`, `cancelledAt`, `cancellationReason`.
- Appends `{ action: 'cancelled' }` to `history`.
- Sends `subscription-cancellation` email with the reason and `endDate`.

---

#### POST /api/localpro-plus/renew

Manually renew an active subscription by initiating a new payment.

**Supported gateways:** `paypal`, `paymaya` only. PayMongo returns `400`.

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `paymentMethod` | string | Yes | `paypal` or `paymaya` |

**Guard Checks**
1. User must have a subscription with `status: 'active'`.
2. Subscription's plan must still exist.

**Response `200`**
```json
{
  "success": true,
  "message": "Subscription renewed successfully",
  "data": {
    "subscription": { /* UserSubscription with updated endDate */ },
    "paymentData": { /* gateway checkout/order data */ }
  }
}
```

**Response `400`** — Missing method, invalid method, or subscription not active.
**Response `404`** — No subscription or plan not found.

**Side Effects**
- Extends `endDate` and `nextBillingDate` by 30 or 365 days from now.
- Appends `{ action: 'renewed' }` to `history`.
- Creates a `Payment` record with `status: 'completed'`.

---

#### GET /api/localpro-plus/my-subscription

Get the authenticated user's current subscription with plan details.

**Response `200`**
```json
{ "success": true, "data": { /* UserSubscription with plan populated */ } }
```

**Response `404`**
```json
{ "success": false, "message": "No subscription found" }
```

---

#### PUT /api/localpro-plus/settings

Update subscription notification settings or auto-renew preference.

> **Warning:** `autoRenew` and `notificationSettings` are not defined fields in the `userSubscriptionSchema`. With the default Mongoose `strict` mode, these assignments are silently ignored on save. This endpoint may not persist changes until the schema is updated.

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `autoRenew` | boolean | No | Intended to control automatic renewal |
| `notificationSettings` | object | No | Notification preference object |

**Response `200`**
```json
{
  "success": true,
  "message": "Subscription settings updated successfully",
  "data": { /* UserSubscription document */ }
}
```

---

#### GET /api/localpro-plus/usage

Get the authenticated user's current subscription usage and limits.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "Premium",
      "features": [ /* plan features array */ ]
    },
    "currentUsage": {
      "services": 3,
      "bookings": 12,
      "storage": 240,
      "apiCalls": 850
    },
    "limits": {
      "maxServices": 10,
      "maxBookings": 50,
      "maxStorage": "unlimited",
      "maxApiCalls": 5000
    },
    "features": {
      "prioritySupport": true,
      "advancedAnalytics": true,
      "customBranding": false,
      "apiAccess": true,
      "whiteLabel": false
    },
    "status": "active",
    "billingCycle": "monthly",
    "nextBillingDate": "2025-02-15T00:00:00.000Z",
    "daysUntilRenewal": 14
  }
}
```

> `"unlimited"` is returned when a limit value is falsy (null, undefined, or 0).

---

### Admin Routes

All admin routes require `Authorization: Bearer <token>` and the `admin` role.

---

#### GET /api/localpro-plus/analytics

Get aggregate subscription analytics across the entire platform.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "totalSubscriptions": 320,
    "activeSubscriptions": 240,
    "cancelledSubscriptions": 55,
    "pendingSubscriptions": 25,
    "subscriptionsByPlan": [
      { "_id": "64a...", "planName": "Premium", "count": 130 }
    ],
    "monthlyTrends": [
      { "_id": { "year": 2025, "month": 1 }, "count": 45 }
    ],
    "revenueAnalytics": [
      { "_id": { "year": 2025, "month": 1 }, "totalRevenue": 4500, "paymentCount": 45 }
    ],
    "statusDistribution": [
      { "_id": "active", "count": 240 },
      { "_id": "cancelled", "count": 55 }
    ]
  }
}
```

---

#### POST /api/localpro-plus/admin/subscriptions

Create a manual subscription for a user (bypasses payment gateway).

**Request Body**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | — | Must be an existing User |
| `planId` | ObjectId | Yes | — | Must be an existing, active SubscriptionPlan |
| `billingCycle` | string | No | `monthly` | `monthly` or `yearly` |
| `startDate` | string (ISO) | No | Now | Subscription start date |
| `endDate` | string (ISO) | No | Computed | Defaults to `startDate + 30 or 365 days` |
| `reason` | string | No | `"Admin manual subscription"` | Stored in history and `manualDetails.reason` |
| `notes` | string | No | — | Stored in `manualDetails.notes` |

**Guard Checks**
1. Both `userId` and `planId` must be provided.
2. User and plan must exist.
3. User must not already have an `active` subscription.

**Response `201`**
```json
{
  "success": true,
  "message": "Manual subscription created successfully",
  "data": { /* UserSubscription with plan and user populated */ }
}
```

**Side Effects**
- Sets `isManual: true` and `paymentMethod: 'manual'`.
- Sets `subscription.status = 'active'` immediately (no payment confirmation step).
- Updates `user.localProPlusSubscription`.
- Sends `subscription-activated` email to the user.

---

#### GET /api/localpro-plus/admin/subscriptions

List all subscriptions with optional filters and pagination.

**Query Parameters**

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | number | `1` | |
| `limit` | number | `20` | |
| `status` | string | — | Filter by status enum value |
| `planId` | ObjectId | — | Filter by plan |
| `isManual` | string | — | `'true'` or `'false'` (exact string comparison) |

**Response `200`**
```json
{
  "success": true,
  "count": 20,
  "total": 320,
  "page": 1,
  "pages": 16,
  "data": [ /* UserSubscription documents with user, plan, manualDetails.createdBy populated */ ]
}
```

---

#### GET /api/localpro-plus/admin/subscriptions/user/:userId

Get the subscription for a specific user.

**Path Params:** `userId` — User MongoDB ObjectId

**Response `200`**
```json
{ "success": true, "data": { /* UserSubscription document fully populated */ } }
```

**Response `404`**
```json
{ "success": false, "message": "No subscription found for this user" }
```

---

#### PUT /api/localpro-plus/admin/subscriptions/:subscriptionId

Update a manual subscription (plan change, status, dates, notes).

> **Restriction:** Only subscriptions with `isManual: true` can be updated via this endpoint.

**Path Params:** `subscriptionId` — UserSubscription MongoDB ObjectId

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `planId` | ObjectId | No | If different from current plan, triggers upgrade/downgrade |
| `status` | string | No | Any valid status enum value |
| `startDate` | string (ISO) | No | |
| `endDate` | string (ISO) | No | Also sets `nextBillingDate` to the same value |
| `billingCycle` | string | No | `monthly` or `yearly` |
| `reason` | string | No | Used in history entries and `cancellationReason` (if cancelling/suspending) |
| `notes` | string | No | Updates `manualDetails.notes` |

**Plan Change Logic**
- If `planId` differs from the current plan, usage limits are recalculated (current usage is capped at the new limit).
- Feature flags are re-evaluated from the new plan's `features[]` array.
- History action is set to `'upgraded'` if new plan price > old plan price, or `'downgraded'` otherwise.

**Status Change Logic**
- Setting to `cancelled` or `suspended`: records `cancelledAt` and `cancellationReason`.
- Setting `suspended` → `active`: appends `{ action: 'reactivated' }` to history.

**Response `200`**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": { /* updated UserSubscription with user and plan populated */ }
}
```

**Response `400`** — Subscription is not manual.
**Response `404`** — Subscription not found.

**Side Effects**
- Sends `subscription-updated` email to the user.

---

#### DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId

Cancel and remove a manual subscription.

> **Restriction:** Only subscriptions with `isManual: true` can be deleted. For regular subscriptions, use `POST /cancel`.

**Path Params:** `subscriptionId` — UserSubscription MongoDB ObjectId

**Request Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `reason` | string | No | Defaults to `"Admin deletion"` |

**Response `200`**
```json
{ "success": true, "message": "Subscription cancelled successfully", "data": { /* UserSubscription */ } }
```

**Response `400`** — Subscription is not manual.
**Response `404`** — Subscription not found.

**Side Effects**
- Sets `status = 'cancelled'`, `cancelledAt`, `cancellationReason`.
- Appends `{ action: 'cancelled' }` to history.
- Clears `user.localProPlusSubscription` reference.
- Sends `subscription-cancelled` email to the user.

---

#### Plan Management (Admin)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/localpro-plus/plans` | Create a new subscription plan |
| `PUT` | `/api/localpro-plus/plans/:id` | Update an existing plan |
| `DELETE` | `/api/localpro-plus/plans/:id` | Permanently delete a plan |

All three routes require `admin` role. `POST` and `PUT` accept the same plan fields (see [SubscriptionPlan model](#41-subscriptionplan)). `DELETE` is a **permanent** deletion — not a soft delete.

---

## 4. Data Models

### 4.1 SubscriptionPlan

Stored in the `subscriptionplans` collection. Plans are fully data-driven — no tiers are hardcoded.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | string | Yes | — | Must be unique |
| `description` | string | Yes | — | |
| `price.monthly` | number | Yes | — | Price per month |
| `price.yearly` | number | Yes | — | Price per year |
| `price.currency` | string | No | `USD` | |
| `features[]` | array | No | `[]` | See feature names table below |
| `features[].name` | string | — | — | Key used for feature gating (see Section 5) |
| `features[].description` | string | — | — | |
| `features[].included` | boolean | — | `true` | Whether feature is included in this plan |
| `features[].limit` | number | — | `null` | `null` = unlimited |
| `features[].unit` | string | — | — | e.g., `per_month`, `per_booking` |
| `limits.maxServices` | number | No | — | |
| `limits.maxBookings` | number | No | — | |
| `limits.maxProviders` | number | No | — | |
| `limits.maxStorage` | number | No | — | In MB |
| `limits.maxApiCalls` | number | No | — | |
| `benefits` | [string] | No | `[]` | Marketing text (e.g., "Up to 5 services") |
| `isActive` | boolean | No | `true` | Inactive plans are excluded from public listing |
| `isPopular` | boolean | No | `false` | Used for "Popular" badge in UI |
| `sortOrder` | number | No | `0` | Display ordering |

**Intended tier naming convention** (inferred from `requirePlanLevel` middleware):
`basic` (level 1) → `standard` (level 2) → `premium` (level 3) → `enterprise` (level 4)

---

### 4.2 UserSubscription

One subscription per user at a time. Stored in the `usersubscriptions` collection.

| Field | Type | Default | Notes |
|---|---|---|---|
| `user` | ObjectId → User | — | Required |
| `plan` | ObjectId → SubscriptionPlan | — | Required |
| `status` | enum | `pending` | `active`, `cancelled`, `expired`, `suspended`, `pending` |
| `billingCycle` | enum | `monthly` | `monthly` or `yearly` |
| `paymentMethod` | string | — | `paypal`, `paymaya`, `paymongo`, or `manual` |
| `isManual` | boolean | `false` | `true` for admin-created subscriptions |
| `manualDetails.createdBy` | ObjectId → User | — | Admin who created the subscription |
| `manualDetails.reason` | string | — | |
| `manualDetails.notes` | string | — | |
| `paymentDetails.paypalOrderId` | string | — | |
| `paymentDetails.paymayaCheckoutId` | string | — | |
| `paymentDetails.paymongoIntentId` | string | — | |
| `paymentDetails.lastPaymentId` | string | — | |
| `paymentDetails.lastPaymentDate` | Date | — | |
| `paymentDetails.nextPaymentAmount` | number | — | Price at subscription creation |
| `startDate` | Date | — | |
| `endDate` | Date | — | When subscription expires |
| `nextBillingDate` | Date | — | Same as `endDate`; used for renewal logic |
| `cancelledAt` | Date | — | |
| `cancellationReason` | string | — | |
| `usage.services.current` | number | `0` | |
| `usage.services.limit` | number | — | From `plan.limits.maxServices` |
| `usage.bookings.current` | number | `0` | |
| `usage.bookings.limit` | number | — | |
| `usage.storage.current` | number | `0` | In MB |
| `usage.storage.limit` | number | — | |
| `usage.apiCalls.current` | number | `0` | |
| `usage.apiCalls.limit` | number | — | |
| `features.prioritySupport` | boolean | `false` | Snapshot set at creation |
| `features.advancedAnalytics` | boolean | `false` | Snapshot set at creation |
| `features.customBranding` | boolean | `false` | Snapshot set at creation |
| `features.apiAccess` | boolean | `false` | Snapshot set at creation |
| `features.whiteLabel` | boolean | `false` | Snapshot set at creation |
| `history[]` | array | `[]` | Immutable audit trail of state changes |
| `history[].action` | enum | — | See Section 2 |
| `history[].fromPlan` | string | — | Plan name before upgrade/downgrade |
| `history[].toPlan` | string | — | Plan name after upgrade/downgrade |
| `history[].reason` | string | — | |
| `history[].timestamp` | Date | — | |

---

### 4.3 FeatureUsage

Granular event log for individual feature use. Stored in the `featureusages` collection.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | Required |
| `subscription` | ObjectId → UserSubscription | Required |
| `feature` | enum (string) | See table below |
| `usage.count` | number | Default `1` |
| `usage.amount` | number | For monetary-value features |
| `usage.metadata` | Mixed | Freeform context data |
| `timestamp` | Date | Default: now |

**Trackable feature names:**

| `feature` value | Represents |
|---|---|
| `service_creation` | Creating a new service listing |
| `booking_management` | Managing bookings |
| `analytics_view` | Viewing analytics dashboards |
| `api_call` | Making an API request |
| `file_upload` | Uploading files |
| `email_notification` | Sending email notifications |
| `sms_notification` | Sending SMS notifications |
| `custom_branding` | Using custom branding features |
| `priority_support` | Accessing priority support |
| `advanced_search` | Using advanced search filters |

---

## 5. Feature Flags & Access Control

### Feature Flag Names (Plan-to-Subscription Mapping)

When a subscription is created, the system scans `plan.features[]` for these exact `name` strings to set the subscription's boolean feature flags:

| `plan.features[].name` string | Sets `subscription.features.*` |
|---|---|
| `priority_support` | `subscription.features.prioritySupport` |
| `advanced_analytics` | `subscription.features.advancedAnalytics` |
| `custom_branding` | `subscription.features.customBranding` |
| `api_access` | `subscription.features.apiAccess` |
| `white_label` | `subscription.features.whiteLabel` |

> **Important:** The boolean flags on `UserSubscription.features` are a **snapshot** taken at subscription creation. They are not dynamically re-evaluated. The runtime access check (`hasFeatureAccess()`) reads directly from `plan.features[]` and requires the plan to be `populate()`d on the subscription document.

### Runtime Access Check: `hasFeatureAccess(featureName)`

```
subscription.hasFeatureAccess('api_access')
  → 1. subscription.isActive()         — status === 'active' AND endDate > now
  → 2. plan.features.find(f => f.name === 'api_access')
  → 3. returns feature.included
```

Requires `plan` to be populated on the subscription. Returns `false` if the plan is not populated.

---

## 6. Middleware Reference

File: `src/middleware/subscriptionAccess.js`

All five middleware functions are available as named exports. They attach `req.subscription` on success and call `next()` to continue.

---

### `requireActiveSubscription`

Blocks access if the user has no subscription or the subscription is not active.

| Scenario | HTTP Status | Error Code |
|---|---|---|
| No subscription | `403` | `SUBSCRIPTION_REQUIRED` |
| Subscription not active | `403` | `SUBSCRIPTION_INACTIVE` (includes `subscriptionStatus` in body) |

**Usage:**
```js
router.get('/premium-route', requireActiveSubscription, handler);
```

---

### `requireFeatureAccess(featureName)`

Factory. Blocks access if the user's plan does not include the specified feature.

| Scenario | HTTP Status | Error Code |
|---|---|---|
| No subscription | `403` | `SUBSCRIPTION_REQUIRED` |
| Subscription not active | `403` | `SUBSCRIPTION_INACTIVE` |
| Feature not in plan | `403` | `FEATURE_NOT_INCLUDED` |

All responses include `feature: featureName` in the body.

**Usage:**
```js
router.post('/api-endpoint', requireFeatureAccess('api_access'), handler);
```

> **Note:** This middleware only populates `localProPlusSubscription` on the user, not the `plan` on the subscription. `hasFeatureAccess()` requires the plan to be populated — this may silently return `false` (feature not included) if `plan` is an unpopulated ObjectId.

---

### `checkUsageLimit(featureName)`

Factory. Blocks access when the user has exceeded the usage limit for a feature.

| Scenario | HTTP Status | Error Code |
|---|---|---|
| No subscription | `403` | `SUBSCRIPTION_REQUIRED` |
| Subscription not active | `403` | `SUBSCRIPTION_INACTIVE` |
| Limit exceeded | **`429`** | `USAGE_LIMIT_EXCEEDED` (includes `currentUsage` and `limit` in body) |

**Usage:**
```js
router.post('/create-service', checkUsageLimit('service_creation'), handler);
```

---

### `incrementUsage(featureName, amount = 1)`

Factory. Increments the usage counter **after** a successful request. Never fails the request — errors are logged but `next()` is always called.

**Usage** (typically placed after the handler, or as a post-processing middleware):
```js
router.post(
  '/create-service',
  checkUsageLimit('service_creation'),
  handler,
  incrementUsage('service_creation', 1)
);
```

---

### `requirePlanLevel(requiredLevel)`

Factory. Blocks access if the user's plan level is below the required level.

| Level String | Numeric Level |
|---|---|
| `basic` | 1 |
| `standard` | 2 |
| `premium` | 3 |
| `enterprise` | 4 |

| Scenario | HTTP Status | Error Code |
|---|---|---|
| No subscription | `403` | `SUBSCRIPTION_REQUIRED` |
| Subscription not active | `403` | `SUBSCRIPTION_INACTIVE` |
| Plan document missing | `403` | `INVALID_PLAN` |
| Plan level too low | `403` | `INSUFFICIENT_PLAN_LEVEL` (includes `currentPlan` and `requiredLevel`) |

**Usage:**
```js
router.get('/enterprise-feature', requirePlanLevel('enterprise'), handler);
```

> **Note:** This middleware reads `plan.level` from the plan document. `level` is not a defined field in `SubscriptionPlan` schema. It will be `undefined` (treated as `0`), which will always fail any level check unless the schema is updated to include a `level` field.

---

## 7. Payment Gateway Integration

### Gateway Support Matrix

| Operation | PayMongo | PayPal | PayMaya |
|---|---|---|---|
| Initial subscription | Yes | Yes | Yes |
| Confirm payment | No | Yes | Yes |
| Manual renew | No | Yes | Yes |
| Auto-renew (cron) | No | Yes | Yes |
| Recurring billing API | No | Yes (stubs) | No |

---

### PayMongo

Used only for the initial authorization hold on subscribe.

**API:** `paymongoService.createAuthorization()`
- Amount is converted to centavos: `Math.round(price * 100)`
- Returns `holdId` stored as `paymentDetails.paymongoIntentId`

**Limitation:** No confirm, renew, or auto-renew support. If a user subscribes with PayMongo, they cannot use `POST /confirm-payment` or `POST /renew`.

---

### PayPal

Used for the full subscription lifecycle: subscribe, confirm, renew, auto-renew.

**Subscribe:** `PayPalService.createOrder({ amount, currency, description, referenceId: 'sub_<userId>_<timestamp>' })`
**Confirm:** `PayPalService.captureOrder(paymentId)`
**Renew:** New `createOrder()` call — user must approve payment again (no stored card).

**Recurring Billing (PayPal Subscription API)** — available via `paypalSubscriptionService` but **webhook handlers are stubs only**:
- Product creation: `POST /v1/catalogs/products`
- Billing plan: `POST /v1/billing/plans` (infinite cycles, 3 failed payment retries)
- Subscription: `POST /v1/billing/subscriptions` (redirects to `FRONTEND_URL/subscription/success`)

**Webhook events (log-only, not yet implemented):**
`BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `BILLING.SUBSCRIPTION.EXPIRED`

**Webhook verification** requires all 5 headers:
`paypal-auth-algo`, `paypal-transmission-id`, `paypal-cert-id`, `paypal-transmission-sig`, `paypal-transmission-time`

---

### PayMaya

Used for subscribe, confirm, and renew.

**Currency coercion:** If plan currency is `USD`, the PayMaya call uses `PHP` instead (PayMaya is PHP-only in practice).

**Subscribe:** `PayMayaService.createPayment({ amount, currency: 'PHP', description })`
**Confirm:** `PayMayaService.confirmPayment(paymentId)`

---

### Environment Variables

| Variable | Gateway | Description |
|---|---|---|
| `PAYMONGO_PUBLIC_KEY` | PayMongo | Public key |
| `PAYMONGO_SECRET_KEY` | PayMongo | Secret key |
| `PAYMONGO_WEBHOOK_SECRET` | PayMongo | Webhook signature secret |
| `PAYPAL_CLIENT_ID` | PayPal | OAuth client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal | OAuth client secret |
| `PAYPAL_WEBHOOK_ID` | PayPal | Webhook verification ID |
| `FRONTEND_URL` | PayPal | Used for `return_url` and `cancel_url` in PayPal subscriptions |

---

## 8. Automated Background Jobs

All cron jobs run in the timezone defined by `process.env.TZ` (defaults to `UTC`).

### Job 1 — Renewal Reminders
**Schedule:** `0 10 * * *` — Daily at 10:00 AM
**Triggers:** For subscriptions expiring in ~7 days (±24h window) and ~1 day (±12h window).
**Actions:** In-app notification + email (`subscription-renewal-reminder`) to the subscriber.
**Deduplication:** In-memory Set, cleared daily at midnight by Job 5. Keys: `7d-<subscriptionId>` and `1d-<subscriptionId>`.

---

### Job 2 — Automatic Renewals
**Schedule:** `0 2 * * *` — Daily at 2:00 AM
**Targets:** Active subscriptions expiring within 24 hours, with `isManual: false` and payment method of `paypal` or `paymaya`.
**Actions:** Creates a new payment order → calls `subscription.renew()` → creates `Payment` record → sends `payment_received` in-app notification. On failure: sends `payment_failed` in-app notification (priority `urgent`).

> **Note:** PayMongo subscriptions are not auto-renewed.

---

### Job 3 — Expired Subscription Handler
**Schedule:** `0 3 * * *` — Daily at 3:00 AM
**Targets:** Subscriptions with `status: 'active'` and `endDate < now`.
**Actions:** Sets `status = 'expired'` → appends `{ action: 'suspended' }` history entry (note: action is `suspended` even though status is `expired`) → sends `subscription_cancelled` in-app notification + `subscription-expired` email.

---

### Job 4 — Win-Back Reactivation Offers
**Schedule:** `0 11 * * *` — Daily at 11:00 AM
**Targets:** Subscriptions with `status: 'expired'` whose `endDate` was between 30 and 120 days ago, and that haven't had a `reactivated` history entry in the last 30 days.
**Actions:** Sends `subscription-reactivation-offer` email with discount code `COMEBACK20` → appends `{ action: 'reactivated', reason: 'Reactivation offer sent' }` to history.

---

### Job 5 — In-Memory Set Cleanup
**Schedule:** `0 0 * * *` — Daily at midnight
**Action:** Clears `reminderSent` and `processingRenewals` deduplication sets.

---

### Job 6 — Dunning Service
**Schedule:** `process.env.SUBSCRIPTION_DUNNING_SCHEDULE` — default `0 11 * * *` (11:00 AM)
**Feature flag:** Only runs if `ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING=true`.
**Targets:** Subscriptions with `status` in `['expired', 'cancelled', 'suspended']` whose `updatedAt` is within the lookback window.
**Actions:** Sends `subscription_dunning_reminder` in-app notification on configured days after status change (default: days 1, 3, and 7).
**Deduplication:** DB-level — checks for an existing `Notification` with the same user, type, `data.subscriptionId`, and `data.day` within the dedup window.

**Environment Variables (Dunning Service):**

| Variable | Default | Description |
|---|---|---|
| `ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING` | unset | Must be `'true'` to enable |
| `SUBSCRIPTION_DUNNING_SCHEDULE` | `0 11 * * *` | Cron expression |
| `SUBSCRIPTION_DUNNING_LOOKBACK_DAYS` | `14` | How far back to look for inactive subs (days) |
| `SUBSCRIPTION_DUNNING_REMIND_DAYS` | `1,3,7` | Comma-separated days after status change to send reminders |
| `SUBSCRIPTION_DUNNING_DEDUP_HOURS` | `24` | Hours within which the same notification won't be re-sent |
| `SUBSCRIPTION_DUNNING_LIMIT` | `300` | Max subscriptions fetched per run |

---

## 9. Usage Tracking

Two parallel mechanisms track feature usage:

### Mechanism 1 — Aggregated Counters (on UserSubscription)

Four counters are stored directly on the subscription document and updated in real time:

| Counter Field | Tracks |
|---|---|
| `usage.services.current` | Services created |
| `usage.bookings.current` | Bookings made |
| `usage.storage.current` | Storage consumed (MB) |
| `usage.apiCalls.current` | API calls made |

Each has a corresponding `.limit` field (set from `plan.limits.*` at subscription creation).

### Mechanism 2 — Granular Event Log (FeatureUsage collection)

Individual events are logged with the `feature` enum value, count, optional monetary amount, and freeform metadata.

### Enforcement Flow

```
Request
  └─> checkUsageLimit('api_calls') middleware
        └─> subscription.checkUsageLimit('api_calls')
              └─> subscription.hasFeatureAccess('api_calls')  → isActive() check + plan feature lookup
              └─> if feature.limit is null: return true (unlimited)
              └─> return usage.apiCalls.current < feature.limit
        └─> if false: 429 USAGE_LIMIT_EXCEEDED
  └─> Request handler executes
  └─> incrementUsage('api_calls', 1) middleware
        └─> subscription.usage.apiCalls.current += 1 → save()
```

### Pre-flight Check: `UsageTrackingService.canPerformAction(userId, feature, amount)`

Returns `{ canPerform, currentUsage, limit, remaining }` without modifying any counters. Use this to show usage warnings in the UI before the user takes an action.

### Resetting Counters: `UsageTrackingService.resetUsageCounters(userId)`

Resets all four counters to `0`. Not called by any automated job — must be triggered programmatically (e.g., at the start of each billing cycle).

---

## 10. Email Notifications

| Trigger | Template | Subject |
|---|---|---|
| Payment confirmed (`POST /confirm-payment`) | `subscription-confirmation` | "LocalPro Plus Subscription Confirmed" |
| Subscription cancelled (`POST /cancel`) | `subscription-cancellation` | "LocalPro Plus Subscription Cancelled" |
| Manual subscription created (admin) | `subscription-activated` | "LocalPro Plus Subscription Activated" |
| Manual subscription updated (admin) | `subscription-updated` | "LocalPro Plus Subscription Updated" |
| Manual subscription deleted (admin) | `subscription-cancelled` | "LocalPro Plus Subscription Cancelled" |
| Renewal reminder (Job 1 — 7 days) | `subscription-renewal-reminder` | "Action Required: Your LocalPro Plus subscription expires in 7 days" |
| Renewal reminder (Job 1 — 1 day) | `subscription-renewal-reminder` | "Action Required: Your LocalPro Plus subscription expires in 1 day" |
| Subscription expired (Job 3) | `subscription-expired` | "Your LocalPro Plus subscription has expired" |
| Win-back offer (Job 4) | `subscription-reactivation-offer` | "We miss you! Come back to LocalPro Plus" |

### Common Template Variables

| Variable | Description |
|---|---|
| `userName` | `user.firstName + ' ' + user.lastName` |
| `planName` | Name of the subscription plan |
| `startDate` | Subscription start date |
| `endDate` | Subscription end date |
| `billingCycle` | `monthly` or `yearly` |
| `renewalUrl` | `FRONTEND_URL/subscription/renew` |
| `reactivationUrl` | `FRONTEND_URL/subscription/reactivate` |
| `discountCode` | `COMEBACK20` (win-back emails only) |

---

## 11. Known Limitations & Notes

1. **PayMongo lifecycle is incomplete.** PayMongo only supports the initial authorization hold. Confirmation, manual renewal, and auto-renewal are not supported. Users who subscribe via PayMongo will be stuck in `pending` status unless an admin manually activates their subscription.

2. **`requirePlanLevel` middleware does not work.** The `SubscriptionPlan` schema does not have a `level` field. `plan.level` will always be `undefined` (treated as `0`), causing all `requirePlanLevel()` checks to fail. The schema must be updated with a `level: Number` field for this middleware to function.

3. **`PUT /settings` does not persist.** `autoRenew` and `notificationSettings` are not defined in `userSubscriptionSchema`. With Mongoose's default strict mode, writing to undefined paths is silently ignored on `.save()`. The schema must be extended for this endpoint to work.

4. **Feature flag snapshot vs. runtime check mismatch.** The boolean fields on `UserSubscription.features` (e.g., `features.prioritySupport`) are a snapshot taken at creation and are not updated when a plan is modified. The actual runtime check (`hasFeatureAccess()`) reads live from `plan.features[]`. These two systems can drift out of sync. Prefer `hasFeatureAccess()` for access control — do not rely on the boolean snapshot.

5. **`requireFeatureAccess` middleware requires plan population.** The middleware does not populate `plan` on the subscription. If `subscription.plan` is an ObjectId (not yet populated), `hasFeatureAccess()` will return `false` for all features, denying access even for eligible subscribers.

6. **History action mismatch on expiry.** Job 3 (expired subscription handler) sets `status = 'expired'` but appends `{ action: 'suspended' }` to history. The history action should be `'expired'` or a new enum value should be added.

7. **PayPal auto-renew creates a new order each time.** There is no stored card or recurring payment agreement for PayPal subscribers. Auto-renewal creates a new PayPal order, but the user cannot approve it automatically — they would need to be redirected to PayPal. In practice, auto-renewal for PayPal may not complete without user interaction.

8. **`findOne` with `.sort()` is a no-op.** The admin endpoint `GET /admin/subscriptions/user/:userId` calls `.findOne().sort(...)`. Mongoose ignores `.sort()` on `findOne()` queries. This is harmless but misleading.

9. **`subscribeToPlan` vs. `createManualSubscription` feature flag inconsistency.** `subscribeToPlan` checks only `f.name === 'x'` when setting feature flags. `createManualSubscription` checks `f.name === 'x' && f.included`. A plan feature with `included: false` will be enabled by `subscribeToPlan` but disabled by `createManualSubscription`. The `f.included` check should be added to `subscribeToPlan` for consistency.
