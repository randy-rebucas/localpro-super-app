# User Management Feature Documentation

## Overview
The User Management feature provides comprehensive user administration capabilities for admins and agency managers.

## Base Path
`/api/users`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Get all users | **admin, agency_admin, agency_owner** |
| GET | `/stats` | Get user statistics | **admin, agency_admin, agency_owner** |
| GET | `/:id` | Get user by ID | **admin, agency_admin, agency_owner, provider, client** |
| POST | `/` | Create user | **admin** |
| PUT | `/:id` | Update user | **admin, agency_admin, agency_owner, provider, client** |
| PATCH | `/:id/status` | Update user status | **admin, agency_admin** |
| PATCH | `/:id/verification` | Update user verification | **admin, agency_admin** |
| POST | `/:id/badges` | Add badge to user | **admin, agency_admin** |
| PATCH | `/bulk` | Bulk update users | **admin** |
| DELETE | `/:id` | Delete user | **admin** |

## Request/Response Examples

### Get Users with Filters
```http
GET /api/users?role=provider&status=active&page=1&limit=20
Authorization: Bearer <token>
```

### Update User Status
```http
PATCH /api/users/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "suspended",
  "reason": "Policy violation"
}
```

### Add Badge to User
```http
POST /api/users/:id/badges
Authorization: Bearer <token>
Content-Type: application/json

{
  "badge": "verified_provider",
  "expiresAt": "2025-12-31"
}
```

## User Status Values

- `active` - User is active
- `inactive` - User is inactive
- `suspended` - User is suspended
- `pending` - User pending verification
- `banned` - User is banned

## Related Features
- Authentication
- Providers
- Agencies
- Trust Verification

