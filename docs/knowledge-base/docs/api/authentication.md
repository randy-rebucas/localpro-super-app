# API Authentication

## Overview

All protected API endpoints require JWT (JSON Web Token) authentication.

## Authentication Flow

### 1. Send Verification Code

```
POST /api/auth/send-code
Body: {
  phoneNumber: string
}
```

### 2. Verify Code

```
POST /api/auth/verify-code
Body: {
  phoneNumber: string,
  code: string
}
```

Response includes JWT token:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... },
    "expiresIn": 86400
  }
}
```

## Using the Token

Include token in Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Token Details

- **Expiration**: 24 hours
- **Format**: JWT
- **Algorithm**: HS256

## Token Payload

```json
{
  "id": "user_id",
  "phoneNumber": "+1234567890",
  "roles": ["client", "provider"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Authorization

### Role-Based Access

Some endpoints require specific roles:

```javascript
// Admin only
GET /api/users  // Requires 'admin' role

// Provider or Admin
POST /api/marketplace/services  // Requires 'provider' or 'admin' role
```

### Checking Authorization

The API returns `403 Forbidden` if user lacks required permissions.

## Error Responses

### No Token

```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

### Invalid Token

```json
{
  "success": false,
  "message": "Token is not valid"
}
```

### Expired Token

```json
{
  "success": false,
  "message": "Token expired"
}
```

### Insufficient Permissions

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

## Best Practices

1. **Store token securely** - Use secure storage (Keychain, Encrypted storage)
2. **Handle expiration** - Re-authenticate when token expires
3. **Include in all requests** - Add to Authorization header
4. **Don't expose token** - Never log or expose tokens

## Related Documentation

- [Authentication Architecture](../architecture/authentication.md)
- [Frontend Authentication](../frontend/implementation-guide.md#authentication--authorization)

