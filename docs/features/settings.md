# Settings Feature Documentation

## Overview
The Settings feature manages user preferences and application-wide settings.

## Base Path
`/api/settings`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get public app settings |
| GET | `/app/public` | Get public app settings |
| GET | `/app/health` | Get app health |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/user` | Get user settings | AUTHENTICATED |
| PUT | `/user` | Update user settings | AUTHENTICATED |
| PUT | `/user/:category` | Update user settings category | AUTHENTICATED |
| POST | `/user/reset` | Reset user settings | AUTHENTICATED |
| DELETE | `/user` | Delete user settings | AUTHENTICATED |
| GET | `/app` | Get app settings | AUTHENTICATED |
| PUT | `/app` | Update app settings | **admin** |
| PUT | `/app/:category` | Update app settings category | **admin** |
| POST | `/app/features/toggle` | Toggle feature flag | **admin** |

## Request/Response Examples

### Update User Settings
```http
PUT /api/settings/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "notifications": {
    "email": true,
    "sms": false,
    "push": true
  },
  "privacy": {
    "profileVisibility": "public",
    "showPhoneNumber": false
  }
}
```

### Toggle Feature Flag (Admin)
```http
POST /api/settings/app/features/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "feature": "ai_marketplace",
  "enabled": true
}
```

## Settings Categories

- **Notifications**: Email, SMS, push notifications
- **Privacy**: Profile visibility, data sharing
- **Preferences**: Language, timezone, currency
- **Security**: Two-factor authentication, password

## Related Features
- User Management
- Communication (Notification preferences)

