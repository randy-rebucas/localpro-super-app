# Favorites Feature Documentation

## Overview
The Favorites feature allows users to save and manage their favorite items across all platform entities including services, providers, jobs, supplies, courses, rentals, and more.

## Base Path
`/api/favorites`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Get all favorites | AUTHENTICATED |
| GET | `/:id` | Get favorite by ID | AUTHENTICATED |
| GET | `/type/:itemType` | Get favorites by item type | AUTHENTICATED |
| GET | `/check/:itemType/:itemId` | Check if item is favorited | AUTHENTICATED |
| GET | `/stats` | Get favorites statistics | AUTHENTICATED |
| POST | `/` | Add item to favorites | AUTHENTICATED |
| PUT | `/:id` | Update favorite | AUTHENTICATED |
| DELETE | `/:id` | Remove favorite by ID | AUTHENTICATED |
| DELETE | `/:itemType/:itemId` | Remove favorite by item type and ID | AUTHENTICATED |

## Request/Response Examples

### Add to Favorites
```http
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemType": "service",
  "itemId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "notes": "Great cleaning service"
}
```

### Get All Favorites
```http
GET /api/favorites
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j0",
      "user": "64f1a2b3c4d5e6f7g8h9i0j9",
      "itemType": "service",
      "itemId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "notes": "Great cleaning service",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Favorites by Type
```http
GET /api/favorites/type/service
Authorization: Bearer <token>
```

### Check if Item is Favorited
```http
GET /api/favorites/check/service/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "isFavorited": true,
  "favoriteId": "64f1a2b3c4d5e6f7g8h9i0j0"
}
```

### Update Favorite
```http
PUT /api/favorites/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Updated notes for this favorite"
}
```

### Remove from Favorites
```http
DELETE /api/favorites/:id
Authorization: Bearer <token>
```

Or by item type and ID:
```http
DELETE /api/favorites/service/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <token>
```

### Get Favorites Statistics
```http
GET /api/favorites/stats
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byType": {
      "service": 10,
      "provider": 5,
      "job": 3,
      "supply": 4,
      "course": 2,
      "rental": 1
    }
  }
}
```

## Supported Item Types

- `service` - Marketplace services
- `provider` - Service providers
- `job` - Job postings
- `supply` - Supply products
- `course` - Academy courses
- `rental` - Rental items
- `agency` - Agencies

## Favorites Flow

1. **Discovery**:
   - User browses platform content
   - User finds interesting items

2. **Save**:
   - User clicks favorite/heart icon
   - Item added to favorites
   - Optional notes can be added

3. **Access**:
   - User views favorites list
   - User filters by item type
   - Quick access to saved items

4. **Management**:
   - User updates notes
   - User removes items
   - View favorites statistics

## Related Features
- Marketplace (Services)
- Providers
- Jobs
- Supplies
- Academy (Courses)
- Rentals
- Search

