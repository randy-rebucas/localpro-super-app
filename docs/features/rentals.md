# Rentals Feature Documentation

## Overview
The Rentals feature enables providers to list equipment and items for rent, and clients to browse and book rental items.

## Base Path
`/api/rentals`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all rental items | page, limit, category, location |
| GET | `/items` | Get rental items (alias) | page, limit |
| GET | `/items/:id` | Get rental item (alias) | - |
| GET | `/categories` | Get rental categories | - |
| GET | `/featured` | Get featured rentals | - |
| GET | `/nearby` | Get nearby rentals | lat, lng, radius |
| GET | `/:id` | Get rental details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/` | Create rental | **provider, admin** |
| POST | `/items` | Create rental (alias) | **provider, admin** |
| PUT | `/:id` | Update rental | **provider, admin** |
| DELETE | `/:id` | Delete rental | **provider, admin** |
| POST | `/:id/images` | Upload rental images | **provider, admin** |
| DELETE | `/:id/images/:imageId` | Delete rental image | **provider, admin** |
| POST | `/:id/book` | Book rental | AUTHENTICATED |
| PUT | `/:id/bookings/:bookingId/status` | Update booking status | AUTHENTICATED |
| POST | `/:id/reviews` | Add rental review | AUTHENTICATED |
| GET | `/my-rentals` | Get my rentals | AUTHENTICATED |
| GET | `/my-bookings` | Get my rental bookings | AUTHENTICATED |
| GET | `/statistics` | Get rental statistics | **admin** |

## Request/Response Examples

### Create Rental (Provider)
```http
POST /api/rentals
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Pressure Washer",
  "description": "High-pressure cleaning equipment",
  "category": "equipment",
  "dailyRate": 500,
  "availability": {
    "startDate": "2025-01-15",
    "endDate": "2025-12-31"
  },
  "location": {
    "city": "Manila",
    "coordinates": {
      "lat": 14.5995,
      "lng": 120.9842
    }
  }
}
```

### Book Rental
```http
POST /api/rentals/:id/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-01-20",
  "endDate": "2025-01-25",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Manila"
  }
}
```

## Rental Booking Flow

1. **Rental Discovery**:
   - Client browses rentals
   - Client filters by category, location, price
   - Client views rental details

2. **Booking Creation**:
   - Client selects rental period
   - Client provides delivery address
   - Payment processed
   - Booking confirmed

3. **Rental Management**:
   - Provider delivers equipment
   - Client uses equipment
   - Client returns equipment
   - Review added

## Related Features
- Providers
- Finance (Payments)
- Reviews & Ratings
- Maps (Location services)

