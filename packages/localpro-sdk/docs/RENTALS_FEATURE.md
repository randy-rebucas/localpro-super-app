# Rentals Feature — Developer Reference

## Overview

The Rentals feature provides a full rental marketplace: public item browse, owner
management (create / update / delete, image upload), booking lifecycle, reviews,
AI-generated descriptions, and admin analytics.

All routes are covered by `rentalsLimiter` (60 req / min).  
Public browse routes are unauthenticated; write and user-specific routes require
a valid auth token.

---

## Architecture

```
features/rentals/
├── controllers/
│   └── rentalsController.js          # 17 handlers — CRUD, booking, reviews, stats, AI
├── models/
│   └── Rentals.js                    # Rental item document schema
├── routes/
│   └── rentals.js                    # 21 routes — rentalsLimiter applied globally
├── services/
│   ├── rentalsService.js             # Core item CRUD + browse + image management
│   ├── bookingService.js             # Booking creation + status transitions
│   ├── reviewService.js              # Review submission
│   ├── descriptionService.js         # AI description generation
│   ├── statisticsService.js          # Aggregate stats
│   └── automatedRentalReminderService.js
├── repositories/
│   ├── rentalsRepository.js
│   ├── bookingRepository.js
│   └── reviewRepository.js
├── errors/
│   └── RentalsErrors.js              # Domain-specific AppError subclasses
└── index.js

packages/localpro-sdk/lib/rentals.js  # SDK RentalsAPI class (16 methods)
```

---

## Endpoints

### Public Browse (`/api/rentals`, no auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/rentals` | `getRentalItem` | Paginated list with filters |
| `GET` | `/api/rentals/items` | `getRentalItem` | Alias for list |
| `GET` | `/api/rentals/items/:id` | `getRental` | Rental detail by ID (alias) |
| `GET` | `/api/rentals/categories` | `getRentalCategories` | All rental categories |
| `GET` | `/api/rentals/featured` | `getFeaturedRentalItem` | Featured rentals |
| `GET` | `/api/rentals/nearby` | `getNearbyRentalItem` | Rentals near a lat/lng |
| `GET` | `/api/rentals/:id` | `getRental` | Rental detail by ID |

### Authenticated — User-specific (auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/rentals/my-rentals` | `getMyRentalItem` | Owner's own rental listings |
| `GET` | `/api/rentals/my-bookings` | `getMyRentalBookings` | User's own bookings |

### Authenticated — Provider / Admin (auth + role required)

| Method | Path | Roles | Handler | Description |
|--------|------|-------|---------|-------------|
| `POST` | `/api/rentals` | provider, admin | `createRental` | Create rental item |
| `POST` | `/api/rentals/items` | provider, admin | `createRental` | Alias for create |
| `PUT` | `/api/rentals/:id` | provider, admin | `updateRental` | Update rental item |
| `DELETE` | `/api/rentals/:id` | provider, admin | `deleteRental` | Delete rental item |
| `POST` | `/api/rentals/:id/images` | provider, admin | `uploadRentalImages` | Upload up to 5 images |
| `DELETE` | `/api/rentals/:id/images/:imageId` | provider, admin | `deleteRentalImage` | Delete one image |
| `POST` | `/api/rentals/generate-description` | provider, admin | `generateRentalDescription` | AI-generated description |

### Authenticated — Any logged-in user

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/rentals/:id/book` | `bookRental` | Book a rental item |
| `PUT` | `/api/rentals/:id/bookings/:bookingId/status` | `updateBookingStatus` | Transition booking status |
| `POST` | `/api/rentals/:id/reviews` | `addRentalReview` | Submit a review |

### Admin only

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/rentals/statistics` | `getRentalStatistics` | Aggregate platform statistics |

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `rentalsLimiter` | 60 s | 60 req | `RENTALS_RATE_LIMIT` |

---

## Error Handling

The controller uses a shared `handleError(res, error, fallbackMessage)` helper that:

1. Returns the `statusCode` and `message` from any `AppError` domain error unchanged.
2. Expands Mongoose `ValidationError` into field-level detail (400).
3. Logs unexpected errors via `logger.error` and returns a generic `'Server error'` (500) — **does not leak `error.message`**.

---

## SDK Usage (`sdk.rentals`)

```js
const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });

// Browse
const { data } = await sdk.rentals.list({ category: 'tools', minPrice: 100 });
const rental    = await sdk.rentals.getById('<rentalId>');
const cats      = await sdk.rentals.getCategories();
const featured  = await sdk.rentals.getFeatured(6);
const nearby    = await sdk.rentals.getNearby({ lat: 14.5, lng: 121.0, radius: 5 });

// Owner operations
const created = await sdk.rentals.create({ name: 'Power Drill', price: 500, category: 'tools' });
await sdk.rentals.update(created.data._id, { price: 450 });
await sdk.rentals.uploadImages(created.data._id, formData);
await sdk.rentals.delete(created.data._id);

// Booking
const booking = await sdk.rentals.book(created.data._id, {
  startDate: '2025-08-01T00:00:00Z',
  endDate:   '2025-08-03T00:00:00Z'
});
await sdk.rentals.updateBookingStatus(created.data._id, booking.data._id, { status: 'confirmed' });

// Reviews
await sdk.rentals.addReview(created.data._id, { rating: 5, comment: 'Excellent!' });

// User queries
const myRentals  = await sdk.rentals.getMyRentals();
const myBookings = await sdk.rentals.getMyBookings({ status: 'confirmed' });

// AI
const desc = await sdk.rentals.generateDescription({ name: 'Power Drill', category: 'tools' });

// Admin
const stats = await sdk.rentals.getStatistics();
```

---

## Booking Status Transitions

| From | To | Trigger |
|------|----|---------|
| `pending` | `confirmed` | Owner/admin confirms |
| `pending` | `cancelled` | Either party cancels |
| `confirmed` | `completed` | Rental period ends |
| `confirmed` | `cancelled` | Cancellation before start |

---

## Routing Notes

`GET /my-rentals`, `GET /my-bookings`, and `GET /statistics` are registered
**before** `GET /:id` in the route file to prevent the wildcard from shadowing
those named paths.  Do not re-order these routes.
