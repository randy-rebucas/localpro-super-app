# Facility Care Feature Documentation

## Overview
The Facility Care feature enables providers to offer facility maintenance and care services, and clients to book these services.

## Base Path
`/api/facility-care`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get facility care services | page, limit, category, location |
| GET | `/nearby` | Get nearby services | lat, lng, radius |
| GET | `/:id` | Get facility care service | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/` | Create facility care service | **provider, admin** |
| PUT | `/:id` | Update facility care service | **provider, admin** |
| DELETE | `/:id` | Delete facility care service | **provider, admin** |
| POST | `/:id/images` | Upload facility care images | **provider, admin** |
| DELETE | `/:id/images/:imageId` | Delete facility care image | **provider, admin** |
| POST | `/:id/book` | Book facility care service | AUTHENTICATED |
| PUT | `/:id/bookings/:bookingId/status` | Update booking status | AUTHENTICATED |
| POST | `/:id/reviews` | Add facility care review | AUTHENTICATED |
| GET | `/my-services` | Get my facility care services | AUTHENTICATED |
| GET | `/my-bookings` | Get my facility care bookings | AUTHENTICATED |

## Request/Response Examples

### Create Facility Care Service
```http
POST /api/facility-care
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Office Cleaning Service",
  "description": "Professional office cleaning",
  "category": "cleaning",
  "serviceType": "recurring",
  "frequency": "weekly",
  "price": 5000
}
```

### Book Facility Care Service
```http
POST /api/facility-care/:id/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-01-15",
  "frequency": "weekly",
  "duration": 12,
  "facilityAddress": {
    "street": "123 Business St",
    "city": "Manila"
  }
}
```

## Facility Care Types

- `cleaning` - Cleaning services
- `maintenance` - Maintenance services
- `security` - Security services
- `landscaping` - Landscaping services

## Service Frequencies

- `one-time` - One-time service
- `daily` - Daily service
- `weekly` - Weekly service
- `monthly` - Monthly service

## Related Features
- Marketplace
- Providers
- Finance

