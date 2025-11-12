# Marketplace Feature Documentation

## Overview
The Marketplace feature enables service discovery, booking, and management for clients and providers in the LocalPro Super App.

## Base Path
`/api/marketplace`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/services` | Get all services | page, limit, category, location, search |
| GET | `/services/categories` | Get service categories | - |
| GET | `/services/categories/:category` | Get category details | - |
| GET | `/services/nearby` | Get nearby services | lat, lng, radius, category |
| GET | `/services/:id` | Get service details | - |
| GET | `/services/:id/providers` | Get providers for service | page, limit |
| GET | `/providers/:id` | Get provider details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/my-services` | Get my services | AUTHENTICATED |
| GET | `/my-bookings` | Get my bookings | AUTHENTICATED |
| POST | `/services` | Create service | **provider, admin** |
| PUT | `/services/:id` | Update service | **provider, admin** |
| DELETE | `/services/:id` | Delete service | **provider, admin** |
| POST | `/services/:id/images` | Upload service images | **provider, admin** |
| POST | `/bookings` | Create booking | AUTHENTICATED |
| GET | `/bookings` | Get bookings | AUTHENTICATED |
| GET | `/bookings/:id` | Get booking details | AUTHENTICATED |
| PUT | `/bookings/:id/status` | Update booking status | AUTHENTICATED |
| POST | `/bookings/:id/photos` | Upload booking photos | AUTHENTICATED |
| POST | `/bookings/:id/review` | Add review | AUTHENTICATED |
| POST | `/bookings/paypal/approve` | Approve PayPal booking | AUTHENTICATED |
| GET | `/bookings/paypal/order/:orderId` | Get PayPal order details | AUTHENTICATED |

## Request/Response Examples

### Create Service (Provider)
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

### Create Booking (Client)
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

## Service Booking Flow

1. **Service Discovery**:
   - Client browses services via `/services`
   - Client filters by category, location, price
   - Client views service details and provider info

2. **Booking Creation**:
   - Client selects service and provider
   - Client creates booking via `/bookings`
   - System validates availability
   - Payment processing (PayPal/PayMaya)

3. **Booking Management**:
   - Provider/Client updates status
   - Photos uploaded during service
   - Review added after completion

## Status Flow

- `pending` → `confirmed` → `in_progress` → `completed` → `reviewed`
- Can be `cancelled` at any time before `completed`

## Related Features
- Providers
- Finance (Payments)
- Communication
- Reviews & Ratings
- Maps & Location Services

