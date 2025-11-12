# Registration Feature Documentation

## Overview
The Registration feature handles early registration and pre-launch sign-ups for the platform.

## Base Path
`/api/registration`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/early` | Early registration |

## Request/Response Examples

### Early Registration
```http
POST /api/registration/early
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "+639123456789",
  "firstName": "John",
  "lastName": "Doe",
  "interest": "provider"
}
```

## Early Registration Flow

1. **User Registration**:
   - User provides contact information
   - User indicates interest
   - Registration recorded

2. **Notification**:
   - User notified when platform launches
   - User receives early access benefits

## Related Features
- Authentication
- User Management

