# Marketplace Feature — Developer Reference

> **Applies to:** LocalPro API v2 · SDK `lib/marketplace.js`  
> **Last updated:** 2026-02-24

This document covers the full marketplace feature: services, bookings, categories, reviews, disputes, GPS tracking, payments, and administrative workflows. It also documents the v2 hardening fixes applied to the backend.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Service Lifecycle](#2-service-lifecycle)
3. [Booking Lifecycle](#3-booking-lifecycle)
4. [GPS Tracking](#4-gps-tracking)
5. [Disputes](#5-disputes)
6. [Reviews](#6-reviews)
7. [Payments](#7-payments)
8. [Admin Workflows](#8-admin-workflows)
9. [Rate Limiting](#9-rate-limiting)
10. [v2 Bug Fixes & Security Hardening](#10-v2-bug-fixes--security-hardening)
11. [SDK Methods](#11-sdk-methods)

---

## 1. Architecture Overview

```
features/marketplace/
  controllers/marketplaceController.js  — all handlers (5 k lines)
  models/
    Marketplace.js        — Service + Booking Mongoose models (1.8 k lines)
    ServiceCategory.js    — Category model
    TaskChecklist.js      — Checklist items
  routes/marketplace.js   — all routes (705 lines)
  services/
    automatedMarketplaceNoShowService.js  — cron-based overdue detection
```

**Base URL:** `/api/marketplace`

---

## 2. Service Lifecycle

```
draft  →  pending_review  →  approved  →  (active/inactive/archived)
                          ↓
                       rejected
```

| Status | Trigger |
|---|---|
| `draft` | Created by provider |
| `pending_review` | `POST /services/:id/submit` |
| `approved` | `POST /services/:id/approve` (admin) |
| `rejected` | `POST /services/:id/reject` (admin) |
| `archived` | `POST /services/:id/archive` |

### Create a service

```
POST /api/marketplace/services
Authorization: Bearer <token>   (role: provider or admin)
Content-Type: application/json

{
  "title": "Deep Home Cleaning",
  "description": "...",
  "category": "cleaning",          // must match an active ServiceCategory key or _id
  "subcategory": "deep cleaning",
  "pricing": {
    "type": "hourly",              // hourly | fixed | per_sqft | per_item | per_unit | tiered | quote_based
    "basePrice": 500,
    "currency": "PHP"
  },
  "serviceArea": {
    "coordinates": { "lat": 14.5995, "lng": 120.9842 },  // or [lng, lat] GeoJSON array
    "radius": 25                                          // kilometres
  },
  "serviceType": "one_time",
  "estimatedDuration": { "min": 2, "max": 4, "unit": "hours" }
}
```

**Response `201`:**
```json
{ "success": true, "data": { "_id": "...", "status": "draft", ... } }
```

### Category validation (v2 fix)

Category is now validated against the `ServiceCategory` collection rather than a hardcoded list. Retrieve valid categories first:

```
GET /api/marketplace/services/categories
```

### ServiceArea coordinate formats

All three formats are accepted and normalised to GeoJSON internally:

```js
// 1. {lat, lng} object
"serviceArea": { "coordinates": { "lat": 14.59, "lng": 120.98 }, "radius": 25 }

// 2. GeoJSON array [lng, lat]
"serviceArea": { "coordinates": [120.98, 14.59], "radius": 25 }

// 3. Full GeoJSON Point (pass-through)
"serviceArea": {
  "coordinates": { "type": "Point", "coordinates": [120.98, 14.59] },
  "radius": 25
}
```

---

## 3. Booking Lifecycle

```
pending_admin_review  →  pending  →  confirmed  →  in_progress  →  completed
                                                                  ↓
                                                             cancelled / disputed / no_show
```

| Status | Trigger |
|---|---|
| `pending_admin_review` | `POST /bookings` — all new bookings require admin dispatch |
| `pending` | `POST /bookings/:id/admin-review` (admin approves) |
| `confirmed` | `POST /bookings/:id/confirm` (provider confirms) |
| `in_progress` | `POST /bookings/:id/start` |
| `completed` | `POST /bookings/:id/complete` |
| `cancelled` | `POST /bookings/:id/cancel` |
| `disputed` | `POST /bookings/:id/dispute` |

### Create a booking

```
POST /api/marketplace/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "<ObjectId>",
  "providerId": "<ObjectId>",         // optional — verified against service.provider
  "bookingDate": "2026-03-15",
  "bookingTime": "09:00",             // 24-hour format HH:MM
  "duration": 2,                      // numeric value (unit depends on service config)
  "paymentMethod": "paypal",          // paypal | paymongo | bpi
  "address": {
    "street": "123 Main St",
    "city": "Manila",
    "country": "PH"
  },
  "specialInstructions": "Please bring eco-friendly cleaning products"
}
```

**Supported payment methods:** `paypal`, `paymongo`, `bpi`  
BPI bookings receive banking deposit instructions in the response.  
PayPal bookings receive a `paypalApprovalUrl` in the response.

### Duration unit

`duration` is stored alongside `durationUnit` (`minutes` | `hours` | `days`). The booking date + duration determines the expected end time used by the no-show detection service.

---

## 4. GPS Tracking

Update provider GPS position during an active booking:

```
POST /api/marketplace/bookings/:id/location
{ "lat": 14.5995, "lng": 120.9842, "accuracy": 15 }
```

Mark provider arrival:

```
POST /api/marketplace/bookings/:id/arrived
```

Get full location history:

```
GET /api/marketplace/bookings/:id/location-history
```

---

## 5. Disputes

| Step | Endpoint | Who |
|---|---|---|
| Open | `POST /bookings/:id/dispute` | Client or provider |
| Add evidence | `POST /bookings/:id/dispute/evidence` | Any party |
| Message admin | `POST /bookings/:id/dispute/messages` | Any party |
| Resolve | `POST /bookings/:id/dispute/resolve` | Admin only |

**Open a dispute:**
```json
{
  "reason": "Provider damaged property",
  "description": "The provider broke a window during cleaning",
  "reasonCode": "damage"   // quality | no_show | incomplete | damage | pricing | other
}
```

**Resolve a dispute (Admin):**
```json
{
  "outcome": "client_favor",    // client_favor | provider_favor | split | dismissed
  "refundAmount": 500,
  "notes": "Evidence supports client claim"
}
```

Resolution fires a `SecurityAuditLog` entry with event `dispute_resolved`.

---

## 6. Reviews

Reviews are bidirectional. After a booking is completed:

- **Client reviews provider:** `POST /bookings/:id/reviews/client`
- **Provider reviews client:** `POST /bookings/:id/reviews/provider`
- **Provider responds to client review:** `POST /bookings/:id/reviews/respond`

```json
// Client review
{
  "rating": 5,
  "comment": "Excellent work, very thorough!",
  "categories": {
    "quality": 5,
    "timeliness": 4,
    "communication": 5,
    "value": 5
  },
  "wouldRecommend": true
}
```

Service `rating.average` and `rating.distribution` are updated automatically.

---

## 7. Payments

### PayPal

1. Create booking with `paymentMethod: "paypal"`.
2. Redirect user to `paypalApprovalUrl` from the response.
3. After PayPal redirects back, call `POST /bookings/paypal/approve` with `{ token, PayerID }`.

### PayMongo / GCash

Created via `createBooking`; separate integration flow outside this controller.

### BPI Bank Transfer

Booking response includes `payment.bankingInstructions`:
```json
{
  "bank": "BPI",
  "accountName": "LocalPro Escrow",
  "accountNumber": "1234-5678-90",
  "reference": "BK20260315A1B2C3",
  "note": "..."
}
```

### Tips

```
POST /api/marketplace/bookings/:id/tip
{ "amount": 100 }
```

---

## 8. Admin Workflows

| Action | Endpoint | Audit Log Event |
|---|---|---|
| Review & dispatch booking | `POST /bookings/:id/admin-review` | `booking_admin_reviewed` |
| Approve service | `POST /services/:id/approve` | `service_approved` |
| Reject service | `POST /services/:id/reject` | `service_rejected` |
| Feature service | `POST /services/:id/feature` | `service_featured` |
| Resolve dispute | `POST /bookings/:id/dispute/resolve` | `dispute_resolved` |

All admin actions are logged to `SecurityAuditLog` with `ipAddress`, `userAgent`, and contextual metadata.

### Feature a service

```json
POST /api/marketplace/services/:id/feature
{
  "until": "2026-04-01T00:00:00Z",   // optional, defaults to 30 days
  "position": 1,                      // optional featured position
  "reason": "Top-rated provider"
}
```

---

## 9. Rate Limiting

| Endpoint group | Limiter | Window | Max |
|---|---|---|---|
| `POST /bookings` | `marketplaceLimiter` | 1 min | 120 |
| `POST /bookings/:id/dispute` | `marketplaceLimiter` | 1 min | 120 |
| `POST /bookings/:id/review` | `marketplaceLimiter` | 1 min | 120 |

Set `DISABLE_RATE_LIMIT=true` in `.env` to bypass during development.

---

## 10. v2 Bug Fixes & Security Hardening

### Bug fixes

| # | Bug | Fix |
|---|---|---|
| 1 | `adminReviewBooking` wrote to `booking.timeline` (field doesn't exist in schema) | Changed to `booking.statusHistory` |
| 2 | `createBooking` also used `timeline` | Changed to `statusHistory` |
| 3 | `deleteServiceCategory` queried `{ category: category.key }` but `Service.category` is an ObjectId ref | Changed to `{ category: category._id }` |
| 4 | `adminReviewBooking` had no route — exported but unreachable | Added `POST /bookings/:id/admin-review` route |
| 5 | `automatedMarketplaceNoShowService` treated all `duration` values as hours regardless of `durationUnit` | Now normalises: `minutes ÷ 60`, `hours × 1`, `days × 24` |
| 6 | `requires` block placed _after_ `adminReviewBooking` function | Moved to top of file |
| 7 | `deleteService` did a hard-delete but schema has soft-delete fields (`deletedAt`, `deletedBy`, `isActive`) | Changed to soft-delete: sets `isActive=false`, `deletedAt`, `deletedBy` |

### Security fixes

| # | Issue | Fix |
|---|---|---|
| 8 | `getServices` built `{ $regex: search }` from raw user input — ReDoS attack vector | Replaced with `{ $text: { $search: search } }` using the existing text index |
| 9 | No rate limiting on `POST /bookings`, dispute, review routes | Applied `marketplaceLimiter` |
| 10 | `createService` validated category against a hardcoded 22-item array | Now queries `ServiceCategory` collection — admin-created categories accepted automatically |

### Architecture fixes

| # | Issue | Fix |
|---|---|---|
| 11 | `{lat,lng}→GeoJSON` conversion duplicated in `createService` and `updateService` | Extracted to `toGeoPoint(coords)` helper at top of file |
| 12 | ~30 `logger.debug` calls in `createService` serialised full request bodies in all environments | Replaced with `debugLog` (no-op in production) |
| 13 | `analytics.bookings` and `capacity.currentDailyBookings` never incremented on booking creation | Now incremented atomically inside the transaction |
| 14 | `capacity.currentDailyBookings` never decremented on cancellation | Now decremented in `cancelBooking` |
| 15 | `ipAddress` and `userAgent` fields in Booking schema never populated | Now set from `req.ip` / `req.headers['user-agent']` in `createBooking` |
| 16 | Admin actions (`approveService`, `rejectService`, `featureService`, `resolveDispute`) had no audit trail | `SecurityAuditLog.log()` added to all four |

---

## 11. SDK Methods

All methods are available as `client.marketplace.*`.

### Services

| Method | Endpoint | Access |
|---|---|---|
| `getServices(params)` | `GET /services` | Public |
| `getService(id)` | `GET /services/:id` | Public |
| `getServiceBySlug(slug)` | `GET /services/slug/:slug` | Public |
| `getNearbyServices(params)` | `GET /services/nearby` | Public |
| `getFeaturedServices(params)` | `GET /services/featured` | Public |
| `getServiceReviews(id, params)` | `GET /services/:id/reviews` | Public |
| `getServiceCategories()` | `GET /services/categories` | Public |
| `getCategoryDetails(category)` | `GET /services/categories/:category` | Public |
| `getServiceAnalytics(id)` | `GET /services/:id/analytics` | Provider/Admin |
| `createService(data)` | `POST /services` | Provider/Admin |
| `updateService(id, data)` | `PUT /services/:id` | Provider/Admin |
| `deleteService(id)` | `DELETE /services/:id` | Provider/Admin |
| `activateService(id)` | `PATCH /services/:id/activate` | Provider/Admin |
| `deactivateService(id)` | `PATCH /services/:id/deactivate` | Provider/Admin |
| `uploadServiceImages(id, formData)` | `POST /services/:id/images` | Provider/Admin |
| `submitServiceForReview(id)` | `POST /services/:id/submit` | Provider |
| `approveService(id, data)` | `POST /services/:id/approve` | Admin |
| `rejectService(id, data)` | `POST /services/:id/reject` | Admin |
| `featureService(id, data)` | `POST /services/:id/feature` | Admin |
| `unfeatureService(id)` | `DELETE /services/:id/feature` | Admin |
| `addServicePackage(id, data)` | `POST /services/:id/packages` | Provider/Admin |
| `addServiceAddOn(id, data)` | `POST /services/:id/addons` | Provider/Admin |
| `updateServiceSEO(id, data)` | `PUT /services/:id/seo` | Provider/Admin |
| `createServicePromotion(id, data)` | `POST /services/:id/promotions` | Provider/Admin |
| `updateServiceAvailability(id, data)` | `PUT /services/:id/availability` | Provider/Admin |
| `archiveService(id)` | `POST /services/:id/archive` | Provider/Admin |
| `getMyServices(params)` | `GET /my-services` | Provider |
| `getProvidersForService(id, params)` | `GET /services/:id/providers` | Public |
| `getProviderDetails(id)` | `GET /providers/:id` | Public |
| `getProviderServices(providerId, params)` | `GET /providers/:providerId/services` | Public |

### Bookings

| Method | Endpoint | Access |
|---|---|---|
| `createBooking(data)` | `POST /bookings` | Authenticated |
| `getBooking(id)` | `GET /bookings/:id` | Client/Provider/Admin |
| `getBookings(params)` | `GET /bookings` | Authenticated (filtered) |
| `getMyBookings(params)` | `GET /my-bookings` | Authenticated |
| `getBookingByNumber(bookingNumber)` | `GET /bookings/number/:bookingNumber` | Authenticated |
| `getBookingStats(params)` | `GET /bookings/stats` | Authenticated |
| `updateBookingStatus(id, data)` | `PUT /bookings/:id/status` | Authenticated |
| `confirmBooking(id)` | `POST /bookings/:id/confirm` | Provider |
| `startBooking(id)` | `POST /bookings/:id/start` | Provider |
| `completeBooking(id)` | `POST /bookings/:id/complete` | Provider |
| `cancelBooking(id, data)` | `POST /bookings/:id/cancel` | Client/Provider/Admin |
| `rescheduleBooking(id, data)` | `POST /bookings/:id/reschedule` | Client/Provider/Admin |
| `signOffBooking(id)` | `POST /bookings/:id/signoff` | Client |
| `uploadBookingPhotos(id, formData)` | `POST /bookings/:id/photos` | Authenticated |
| `adminReviewBooking(id)` | `POST /bookings/:id/admin-review` | Admin |
| `approvePayPalBooking(data)` | `POST /bookings/paypal/approve` | Authenticated |
| `getPayPalOrderDetails(orderId)` | `GET /bookings/paypal/order/:orderId` | Authenticated |
| `addBookingTip(id, data)` | `POST /bookings/:id/tip` | Client |

### GPS Tracking

| Method | Endpoint | Access |
|---|---|---|
| `updateProviderLocation(id, data)` | `POST /bookings/:id/location` | Provider |
| `markProviderArrived(id)` | `POST /bookings/:id/arrived` | Provider |
| `getLocationHistory(id)` | `GET /bookings/:id/location-history` | Client/Provider/Admin |

### Disputes

| Method | Endpoint | Access |
|---|---|---|
| `openDispute(id, data)` | `POST /bookings/:id/dispute` | Authenticated |
| `addDisputeEvidence(id, data)` | `POST /bookings/:id/dispute/evidence` | Authenticated |
| `addDisputeMessage(id, data)` | `POST /bookings/:id/dispute/messages` | Authenticated |
| `resolveDispute(id, data)` | `POST /bookings/:id/dispute/resolve` | Admin |
| `getDisputedBookings(params)` | `GET /bookings/disputes` | Admin |

### Reviews

| Method | Endpoint | Access |
|---|---|---|
| `addClientReview(id, data)` | `POST /bookings/:id/reviews/client` | Client |
| `addProviderReview(id, data)` | `POST /bookings/:id/reviews/provider` | Provider |
| `respondToReview(id, data)` | `POST /bookings/:id/reviews/respond` | Provider |
| `getServiceReviews(id, params)` | `GET /services/:id/reviews` | Public |

---

### SDK Usage Examples

```js
const client = new LocalPro({ apiKey, apiSecret });

// ── Services ────────────────────────────────────────────────────────────────

// List services with filters
const services = await client.marketplace.getServices({
  category: 'cleaning',
  lat: 14.5995,
  lng: 120.9842,
  radius: 25,
  minPrice: 100,
  maxPrice: 1000,
  page: 1,
  limit: 20
});

// Create a service (provider auth required)
const service = await client.marketplace.createService({
  title: 'Deep Home Cleaning',
  description: '...',
  category: 'cleaning',
  subcategory: 'deep cleaning',
  pricing: { type: 'hourly', basePrice: 500, currency: 'PHP' },
  serviceArea: { coordinates: { lat: 14.5995, lng: 120.9842 }, radius: 25 }
});

// Submit for admin review
await client.marketplace.submitServiceForReview(service.data._id);

// ── Bookings ─────────────────────────────────────────────────────────────────

const booking = await client.marketplace.createBooking({
  serviceId: '<id>',
  bookingDate: '2026-03-15',
  bookingTime: '09:00',
  duration: 2,
  paymentMethod: 'paypal'
});

// Redirect client to booking.data.paypalApprovalUrl ...

// Provider confirms and starts the job
await client.marketplace.confirmBooking(booking.data.booking._id);
await client.marketplace.startBooking(booking.data.booking._id);

// Provider completes the job
await client.marketplace.completeBooking(booking.data.booking._id);

// Client leaves a review
await client.marketplace.addClientReview(booking.data.booking._id, {
  rating: 5,
  comment: 'Excellent work!',
  wouldRecommend: true
});
```
