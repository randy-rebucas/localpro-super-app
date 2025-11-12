# Announcements Feature Documentation

## Overview
The Announcements feature enables platform-wide and targeted announcements for users.

## Base Path
`/api/announcements`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get announcements | page, limit, targetAudience |
| GET | `/:id` | Get announcement | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/my/list` | Get my announcements | AUTHENTICATED |
| POST | `/` | Create announcement | **admin, agency_admin, agency_owner** |
| PUT | `/:id` | Update announcement | AUTHENTICATED |
| DELETE | `/:id` | Delete announcement | AUTHENTICATED |
| POST | `/:id/acknowledge` | Acknowledge announcement | AUTHENTICATED |
| POST | `/:id/comments` | Add comment | AUTHENTICATED |
| GET | `/admin/statistics` | Get announcement statistics | **admin** |

## Request/Response Examples

### Create Announcement
```http
POST /api/announcements
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Feature Launch",
  "content": "We're excited to announce...",
  "targetAudience": "all",
  "priority": "high",
  "expiresAt": "2025-12-31"
}
```

### Acknowledge Announcement
```http
POST /api/announcements/:id/acknowledge
Authorization: Bearer <token>
```

## Announcement Types

- `system` - System announcements
- `feature` - Feature announcements
- `maintenance` - Maintenance notices
- `promotion` - Promotional announcements

## Target Audiences

- `all` - All users
- `clients` - Clients only
- `providers` - Providers only
- `agencies` - Agencies only

## Related Features
- User Management
- Communication

