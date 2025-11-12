# Activities Feature Documentation

## Overview
The Activities feature tracks and displays user activity feeds and interactions across the platform.

## Base Path
`/api/activities`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/feed` | Get activity feed | AUTHENTICATED |
| GET | `/my` | Get my activities | AUTHENTICATED |
| GET | `/user/:userId` | Get user activities | AUTHENTICATED |
| GET | `/:id` | Get activity | AUTHENTICATED |
| POST | `/` | Create activity | AUTHENTICATED |
| PUT | `/:id` | Update activity | AUTHENTICATED |
| DELETE | `/:id` | Delete activity | AUTHENTICATED |
| POST | `/:id/interactions` | Add interaction | AUTHENTICATED |
| DELETE | `/:id/interactions` | Remove interaction | AUTHENTICATED |
| GET | `/stats/my` | Get my activity stats | AUTHENTICATED |
| GET | `/stats/global` | Get global activity stats | **admin** |
| GET | `/metadata` | Get activity metadata | AUTHENTICATED |

## Request/Response Examples

### Get Activity Feed
```http
GET /api/activities/feed?page=1&limit=20
Authorization: Bearer <token>
```

### Create Activity
```http
POST /api/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "service_completed",
  "entityType": "booking",
  "entityId": "booking_id",
  "description": "Completed cleaning service"
}
```

### Add Interaction
```http
POST /api/activities/:id/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "like"
}
```

## Activity Types

- `service_completed` - Service completed
- `review_added` - Review added
- `booking_created` - Booking created
- `profile_updated` - Profile updated
- `achievement_unlocked` - Achievement unlocked

## Interaction Types

- `like` - Like activity
- `comment` - Comment on activity
- `share` - Share activity

## Related Features
- Marketplace
- Providers
- Communication

