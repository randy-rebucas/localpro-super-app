# Ads Feature Documentation

## Overview
The Ads feature enables users to create and manage advertisements, and admins to moderate ad content.

## Base Path
`/api/ads`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all ads | page, limit, category, featured |
| GET | `/categories` | Get ad categories | - |
| GET | `/enum-values` | Get enum values | - |
| GET | `/featured` | Get featured ads | - |
| GET | `/:id` | Get ad details | - |
| POST | `/:id/click` | Track ad click | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/` | Create ad | AUTHENTICATED |
| PUT | `/:id` | Update ad | AUTHENTICATED |
| DELETE | `/:id` | Delete ad | AUTHENTICATED |
| POST | `/:id/images` | Upload ad images | AUTHENTICATED |
| DELETE | `/:id/images/:imageId` | Delete ad image | AUTHENTICATED |
| POST | `/:id/promote` | Promote ad | AUTHENTICATED |
| GET | `/my-ads` | Get my ads | AUTHENTICATED |
| GET | `/:id/analytics` | Get ad analytics | AUTHENTICATED |
| GET | `/pending` | Get pending ads | **admin** |
| PUT | `/:id/approve` | Approve ad | **admin** |
| PUT | `/:id/reject` | Reject ad | **admin** |
| GET | `/statistics` | Get ad statistics | **admin** |

## Request/Response Examples

### Create Ad
```http
POST /api/ads
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Professional Cleaning Services",
  "description": "Best cleaning services in Manila",
  "category": "services",
  "targetAudience": "all",
  "budget": 5000,
  "duration": 30
}
```

### Promote Ad
```http
POST /api/ads/:id/promote
Authorization: Bearer <token>
Content-Type: application/json

{
  "promotionType": "featured",
  "duration": 7,
  "budget": 2000
}
```

## Ad Management Flow

1. **Ad Creation**:
   - User creates ad
   - User uploads images
   - Ad status: `pending`

2. **Moderation**:
   - Admin reviews ad
   - Admin approves or rejects
   - Status: `approved` or `rejected`

3. **Promotion**:
   - User promotes ad (optional)
   - Ad becomes featured
   - Analytics tracked

## Ad Status

- `pending` - Awaiting admin approval
- `approved` - Approved and active
- `rejected` - Rejected by admin
- `expired` - Ad expired

## Related Features
- User Management
- Analytics
- Finance (Ad payments)

