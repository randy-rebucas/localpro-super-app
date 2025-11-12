# Maps Feature Documentation

## Overview
The Maps feature provides location services including geocoding, reverse geocoding, place search, distance calculation, and service area validation.

## Base Path
`/api/maps`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Get maps info | - |
| POST | `/geocode` | Geocode address | address |
| POST | `/reverse-geocode` | Reverse geocode | lat, lng |
| POST | `/places/search` | Search places | query, location |
| GET | `/places/:placeId` | Get place details | - |
| POST | `/distance` | Calculate distance | origin, destination |
| POST | `/nearby` | Find nearby places | location, radius, type |
| POST | `/validate-service-area` | Validate service area | area, location |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/analyze-coverage` | Analyze service coverage | AUTHENTICATED |
| GET | `/test` | Test connection | **admin** |

## Request/Response Examples

### Geocode Address
```http
POST /api/maps/geocode
Content-Type: application/json

{
  "address": "123 Main St, Manila, Philippines"
}
```

### Calculate Distance
```http
POST /api/maps/distance
Content-Type: application/json

{
  "origin": {
    "lat": 14.5995,
    "lng": 120.9842
  },
  "destination": {
    "lat": 14.6042,
    "lng": 120.9822
  }
}
```

### Find Nearby Places
```http
POST /api/maps/nearby
Content-Type: application/json

{
  "location": {
    "lat": 14.5995,
    "lng": 120.9842
  },
  "radius": 5000,
  "type": "restaurant"
}
```

## Related Features
- Marketplace (Service locations)
- Providers (Service areas)
- Rentals (Delivery locations)

