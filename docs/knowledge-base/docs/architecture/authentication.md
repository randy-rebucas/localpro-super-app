# Authentication Architecture

## Overview

LocalPro Super App uses **phone-based authentication** with SMS verification codes. No traditional email/password authentication is used. The system issues **JWT (JSON Web Tokens)** for authenticated sessions.

## Authentication Flow

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Client  │                    │  API    │                    │ Twilio  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                               │                               │
     │ 1. POST /auth/send-code       │                               │
     │    { phoneNumber }            │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 2. Generate 6-digit code      │
     │                               │    Store with expiration      │
     │                               │                               │
     │                               │ 3. Send SMS via Twilio        │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ 4. SMS sent to user           │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │ 5. POST /auth/verify-code     │                               │
     │    { phoneNumber, code }      │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 6. Validate code              │
     │                               │    Check expiration           │
     │                               │                               │
     │ 7. Generate JWT token         │                               │
     │    Create/Update user         │                               │
     │                               │                               │
     │ 8. Return { token, user }     │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ 9. Store token locally        │                               │
     │                               │                               │
```

## Components

### 1. SMS Verification

**Endpoint**: `POST /api/auth/send-code`

**Process**:
1. Validate phone number format
2. Generate 6-digit verification code
3. Store code with 5-minute expiration
4. Send SMS via Twilio
5. Rate limit: 1 code per phone per minute

**Request**:
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent",
  "expiresIn": 300
}
```

### 2. Code Verification

**Endpoint**: `POST /api/auth/verify-code`

**Process**:
1. Validate phone number and code
2. Check code expiration
3. Verify code matches stored value
4. Find or create user
5. Generate JWT token
6. Return token and user data

**Request**:
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "phoneNumber": "+1234567890",
      "roles": ["client"],
      "isVerified": true
    },
    "expiresIn": 86400
  }
}
```

## JWT Token Structure

### Token Payload

```javascript
{
  id: "user_id",
  phoneNumber: "+1234567890",
  roles: ["client", "provider"],
  iat: 1234567890,  // Issued at
  exp: 1234654290   // Expiration
}
```

### Token Generation

```javascript
const token = jwt.sign(
  {
    id: user._id,
    phoneNumber: user.phoneNumber,
    roles: user.roles
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '24h'  // 24 hours
  }
);
```

## Authentication Middleware

### Implementation

```javascript
const auth = async (req, res, next) => {
  try {
    // Extract token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Load user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};
```

### Usage

```javascript
// Protected route
router.get('/profile', auth, getProfile);

// Multiple middleware
router.post('/services', auth, authorize('provider'), createService);
```

## Authorization

### Role-Based Access Control (RBAC)

**Roles**:
- `client` - Regular users
- `provider` - Service providers
- `supplier` - Product suppliers
- `instructor` - Academy instructors
- `agency_admin` - Agency administrators
- `agency_owner` - Agency owners
- `admin` - Platform administrators
- `partner` - Business partners

### Authorization Middleware

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: [${roles.join(', ')}]`
      });
    }
    
    next();
  };
};
```

### Usage Examples

```javascript
// Single role
router.get('/admin/users', auth, authorize('admin'), getUsers);

// Multiple roles (OR)
router.post('/services', auth, authorize('provider', 'admin'), createService);

// Multiple roles (AND) - check in controller
if (!req.user.roles.includes('admin') && !req.user.roles.includes('provider')) {
  return res.status(403).json({ message: 'Access denied' });
}
```

## User Registration Flow

### First-Time User

```
1. Send verification code
   ↓
2. Verify code
   ↓
3. User created with default role 'client'
   ↓
4. JWT token issued
   ↓
5. User completes onboarding
```

### Returning User

```
1. Send verification code
   ↓
2. Verify code
   ↓
3. Existing user found
   ↓
4. JWT token issued
   ↓
5. User data returned
```

## Profile Completion

### Onboarding Steps

1. **Phone Verification** ✅ (automatic)
2. **Basic Info** - Name, email (optional)
3. **Profile Photo** - Avatar upload
4. **Location** - Address and coordinates
5. **Role Selection** - Choose provider/supplier role
6. **Verification** - ID verification (for providers)

### Profile Completion Status

```javascript
GET /api/auth/profile-completion-status

Response:
{
  "success": true,
  "data": {
    "completed": false,
    "percentage": 60,
    "steps": {
      "phoneVerified": true,
      "basicInfo": true,
      "profilePhoto": false,
      "location": true,
      "roleSelected": false,
      "verified": false
    }
  }
}
```

## Token Management

### Token Storage (Client)

**Mobile Apps**:
- iOS: Keychain
- Android: Encrypted SharedPreferences

**Web**:
- HttpOnly cookies (recommended)
- localStorage (alternative)

### Token Refresh

Currently, tokens are valid for 24 hours. To refresh:

1. User must re-authenticate (send new code)
2. Or implement refresh token mechanism

### Token Revocation

Tokens cannot be revoked individually. Options:

1. **Short expiration** (current: 24h)
2. **Blacklist** - Store revoked tokens in Redis
3. **User status check** - Verify user is still active

## Security Considerations

### 1. Code Generation

```javascript
// Generate secure 6-digit code
const code = Math.floor(100000 + Math.random() * 900000).toString();
```

### 2. Code Storage

- Store with expiration (5 minutes)
- One-time use
- Rate limiting (1 per minute per phone)

### 3. JWT Secret

- Use strong, random secret
- Store in environment variable
- Never commit to repository

### 4. Token Validation

- Always verify signature
- Check expiration
- Validate user still exists
- Check user is active

### 5. Rate Limiting

```javascript
// Limit verification attempts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per window
});
```

## Error Handling

### Common Errors

| Error | Status | Message |
|-------|--------|---------|
| No token | 401 | "No token, authorization denied" |
| Invalid token | 401 | "Token is not valid" |
| Expired token | 401 | "Token expired" |
| User not found | 401 | "Token is not valid" |
| Insufficient permissions | 403 | "Access denied" |
| Invalid code | 400 | "Invalid verification code" |
| Code expired | 400 | "Verification code expired" |

## Best Practices

1. **Always validate tokens** on protected routes
2. **Check user status** after token validation
3. **Use HTTPS** in production
4. **Implement rate limiting** for auth endpoints
5. **Log authentication events** for security
6. **Store tokens securely** on client
7. **Set appropriate expiration** times
8. **Handle token refresh** gracefully

## Next Steps

- Read [Security Architecture](./security.md)
- Review [API Authentication](../api/authentication.md)
- Check [Frontend Authentication](../frontend/implementation-guide.md#authentication--authorization)

