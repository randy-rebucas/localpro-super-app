# Marketplace API Endpoints

**Base Path:** `/api/marketplace`

---

## Public Endpoints (No Authentication Required)

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/services` | Get all services | `page`, `limit`, `category`, `location`, `search` |
| GET | `/services/categories` | Get service categories | - |
| GET | `/services/categories/:category` | Get category details | - |
| GET | `/services/nearby` | Get nearby services | `lat`, `lng`, `radius`, `category` |
| GET | `/services/:id` | Get service details | - |
| GET | `/services/:id/providers` | Get providers for service | `page`, `limit` |
| GET | `/providers/:id` | Get provider details | - |
| GET | `/providers/:providerId/services` | Get provider's services | `page`, `limit` |

---

## Authenticated Endpoints (Requires Authentication)

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/my-services` | Get my services | AUTHENTICATED |
| GET | `/my-bookings` | Get my bookings | AUTHENTICATED |
| POST | `/services` | Create service | **provider, admin** |
| PUT | `/services/:id` | Update service | **provider, admin** |
| PATCH | `/services/:id/deactivate` | Deactivate service | **provider, admin** |
| PATCH | `/services/:id/activate` | Activate service | **provider, admin** |
| DELETE | `/services/:id` | Delete service | **provider, admin** |
| POST | `/services/:id/images` | Upload service images (max 5) | **provider, admin** |
| POST | `/bookings` | Create booking | AUTHENTICATED |
| GET | `/bookings` | Get bookings | AUTHENTICATED |
| GET | `/bookings/:id` | Get booking details | AUTHENTICATED |
| PUT | `/bookings/:id/status` | Update booking status | AUTHENTICATED |
| POST | `/bookings/:id/photos` | Upload booking photos (max 5) | AUTHENTICATED |
| POST | `/bookings/:id/review` | Add review (with photos, max 3) | AUTHENTICATED |
| POST | `/bookings/paypal/approve` | Approve PayPal booking | AUTHENTICATED |
| GET | `/bookings/paypal/order/:orderId` | Get PayPal order details | AUTHENTICATED |

---

## Admin-Only Endpoints (Requires Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services/categories/manage` | List service categories (admin view) |
| POST | `/services/categories` | Create service category |
| PUT | `/services/categories/:id` | Update service category |
| DELETE | `/services/categories/:id` | Delete service category |

---

## AI Marketplace Endpoints

**Base Path:** `/api/ai/marketplace`

> **Note:** All AI endpoints require authentication.

### AI Tools for All Authenticated Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommendations` | Natural language service search |
| POST | `/price-estimator` | AI price estimation |
| POST | `/service-matcher` | AI service matching |
| POST | `/review-sentiment` | Review sentiment analysis |
| POST | `/booking-assistant` | Booking assistant |
| POST | `/scheduling-assistant` | Scheduling assistant |
| POST | `/description-from-title` | Generate service description from title only |
| POST | `/form-prefiller` | Pre-fill marketplace service form fields using AI |

### AI Tools for Providers & Admins

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/description-generator` | Generate service description |
| POST | `/pricing-optimizer` | Pricing optimization |
| POST | `/demand-forecast` | Demand forecasting |
| POST | `/review-insights` | Review insights analysis |
| POST | `/response-assistant` | Response assistant for reviews/messages |
| POST | `/listing-optimizer` | Listing optimization |

---

## Summary

### Endpoint Count

- **Public Endpoints:** 8
- **Authenticated Endpoints:** 15
- **Admin-Only Endpoints:** 4
- **AI Marketplace Endpoints (All Users):** 8
- **AI Marketplace Endpoints (Providers/Admins):** 6

**Total Marketplace Endpoints: 41**

---

## Request Examples

### Create Service (Provider/Admin)

```http
POST /api/marketplace/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Home Cleaning Service",
  "description": "Professional home cleaning",
  "category": "cleaning",
  "price": 500,
  "duration": 120,
  "serviceArea": {
    "cities": ["Manila", "Quezon City"],
    "radius": 10
  }
}
```

### Create Booking (Authenticated User)

```http
POST /api/marketplace/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "service_id_here",
  "providerId": "provider_id_here",
  "scheduledDate": "2025-01-15T10:00:00Z",
  "address": {
    "street": "123 Main St",
    "city": "Manila",
    "coordinates": {
      "lat": 14.5995,
      "lng": 120.9842
    }
  },
  "notes": "Please bring cleaning supplies"
}
```

### Update Booking Status

```http
PUT /api/marketplace/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Booking confirmed"
}
```

### AI Price Estimator

```http
POST /api/ai/marketplace/price-estimator
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceType": "cleaning",
  "location": "Manila",
  "duration": 120,
  "complexity": "standard"
}
```

### AI Description Generator (Provider/Admin)

```http
POST /api/ai/marketplace/description-generator
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceType": "plumbing",
  "keyFeatures": ["24/7 service", "licensed", "insured"],
  "targetAudience": "homeowners"
}
```

---

## Notes

- All authenticated endpoints require a valid JWT token in the `Authorization` header
- Image upload endpoints support multiple files (specified max in parentheses)
- Service category management is restricted to admin users only
- Provider-specific endpoints require the user to have either `provider` or `admin` role
- Booking status flow: `pending` → `confirmed` → `in_progress` → `completed` → `reviewed`
- Bookings can be `cancelled` at any time before reaching `completed` status

