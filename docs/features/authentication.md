# Authentication Feature Documentation

## Overview
The Authentication feature handles user registration, login, profile management, and session management for the LocalPro Super App.

## Base Path
`/api/auth`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/send-code` | Send SMS verification code to phone number | SMS Limiter |
| POST | `/verify-code` | Verify code and register/login user | Auth Limiter |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/register` | Register new user (requires auth) | AUTHENTICATED |
| GET | `/profile` | Get minimal profile | AUTHENTICATED |
| POST | `/complete-onboarding` | Complete user onboarding process | AUTHENTICATED |
| GET | `/profile-completion-status` | Get profile completion status | AUTHENTICATED |
| GET | `/profile-completeness` | Get profile completeness percentage | AUTHENTICATED |
| GET | `/me` | Get current authenticated user | AUTHENTICATED |
| PUT | `/profile` | Update user profile | AUTHENTICATED |
| POST | `/upload-avatar` | Upload profile avatar image | AUTHENTICATED |
| POST | `/upload-portfolio` | Upload portfolio images (max 5) | AUTHENTICATED |
| POST | `/logout` | Logout user and invalidate session | AUTHENTICATED |

## Request/Response Examples

### Send Verification Code
```http
POST /api/auth/send-code
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

### Verify Code
```http
POST /api/auth/verify-code
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

### Complete Onboarding
```http
POST /api/auth/complete-onboarding
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Manila",
    "state": "Metro Manila",
    "zipCode": "1000",
    "country": "Philippines"
  }
}
```

## Authentication Flow

1. **Registration/Login Flow**:
   - User requests verification code via `/send-code`
   - System sends SMS code
   - User submits code via `/verify-code`
   - System validates code and returns JWT token
   - User completes onboarding if new user

2. **Profile Management Flow**:
   - User updates profile via `/profile`
   - User uploads avatar via `/upload-avatar`
   - User uploads portfolio images via `/upload-portfolio`
   - System tracks profile completeness

## Security Features

- SMS rate limiting to prevent abuse
- JWT token-based authentication
- Token expiration and refresh
- File upload validation (size and type)
- Phone number verification required

## Related Features
- User Management
- Trust Verification
- Provider Profile
- Settings

