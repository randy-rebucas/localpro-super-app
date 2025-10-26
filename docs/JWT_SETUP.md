# JWT Security Setup Guide

This guide explains how to properly set up and manage JWT (JSON Web Token) secrets for the LocalPro Super App.

## 🔐 Overview

The application uses JWT for authentication with the following security features:
- **Access Tokens**: Short-lived tokens (15 minutes) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) for token renewal
- **Secure Secrets**: Cryptographically generated 128-character secrets
- **Algorithm Specification**: Explicitly uses HS256 algorithm
- **Audience/Issuer Validation**: Prevents token misuse

## 🚀 Quick Setup

### 1. Generate JWT Secrets

Use the provided script to generate secure secrets:

```bash
# Generate secrets for development
node scripts/generate-jwt-secrets.js

# Generate secrets for production
node scripts/generate-jwt-secrets.js --env production

# Validate existing secrets
node scripts/generate-jwt-secrets.js validate
```

### 2. Environment Configuration

The script automatically updates your environment files with secure secrets:

**Development (`env.example`):**
```env
# JWT Configuration
JWT_SECRET=5a740133504e819ccc024dc2f2f4edb843db16cb9d3424d06a10ce4467cb1f2b83748cb0594488da04677dc8dc4d25429fa25bfdd20e5aef8347890bce26eba3
JWT_REFRESH_SECRET=2e067b8036c633f8bc230254e97ca3d326aa5b9e6cf4969dbfcefa53170432f5ceeac70e33169ecd58db7c62c7a0179459525e2aba7fb2879f57826fe6bca78f

# JWT Token Expiration (optional - defaults shown)
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# JWT Issuer and Audience (optional - defaults shown)
JWT_ISSUER=localpro-api
JWT_AUDIENCE=localpro-mobile
```

**Production (`env.production`):**
```env
# JWT Configuration - Production
JWT_SECRET=c75e7b62a736be56316851a36a1e5fade98ec7fb1beadc2cdc39e75092a8a7a78b9329eb7c5c001317597de7f3524f9ce5caefce0d41d6e9c21ac3e3b4984f8b
JWT_REFRESH_SECRET=2e067b8036c633f8bc230254e97ca3d326aa5b9e6cf4969dbfcefa53170432f5ceeac70e33169ecd58db7c62c7a0179459525e2aba7fb2879f57826fe6bca78f
```

### 3. Copy Environment File

```bash
# Copy example to actual environment file
cp env.example .env
```

## 🔧 Manual Secret Generation

If you prefer to generate secrets manually:

```bash
# Generate a 64-byte (128 hex character) secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🛡️ Security Features

### 1. Secret Validation

The JWT configuration automatically validates:
- ✅ Secret exists and is not empty
- ✅ Secret is at least 32 characters long
- ✅ Secret is not using default/example values
- ✅ Different secrets for access and refresh tokens

### 2. Token Security

- **Algorithm**: Explicitly set to HS256
- **Issuer**: Validates token issuer matches expected value
- **Audience**: Validates token audience matches expected value
- **Expiration**: Configurable token expiration times
- **Type Validation**: Distinguishes between access and refresh tokens

### 3. Error Handling

Comprehensive error handling with specific error codes:
- `NO_TOKEN`: No token provided
- `INVALID_TOKEN_TYPE`: Wrong token type (access vs refresh)
- `TOKEN_EXPIRED`: Token has expired
- `INVALID_TOKEN`: Malformed or invalid token
- `USER_NOT_FOUND`: User no longer exists
- `ACCOUNT_INACTIVE`: User account is not active

## 📋 API Endpoints

### Authentication Flow

1. **Send Verification Code**
   ```
   POST /api/auth/send-code
   Body: { "phoneNumber": "+1234567890" }
   ```

2. **Verify Code & Login**
   ```
   POST /api/auth/verify-code
   Body: { "phoneNumber": "+1234567890", "code": "123456" }
   
   Response:
   {
     "success": true,
     "accessToken": "eyJ...",
     "refreshToken": "eyJ...",
     "expiresIn": "15m",
     "user": { ... }
   }
   ```

3. **Refresh Token**
   ```
   POST /api/auth/refresh
   Body: { "refreshToken": "eyJ..." }
   
   Response:
   {
     "success": true,
     "accessToken": "eyJ...",
     "refreshToken": "eyJ...",
     "expiresIn": "15m"
   }
   ```

### Protected Endpoints

All protected endpoints require the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 🔄 Token Management

### Access Tokens
- **Lifespan**: 15 minutes (configurable)
- **Purpose**: API access and authentication
- **Storage**: Client-side (localStorage, sessionStorage, or secure cookie)
- **Renewal**: Use refresh token when expired

### Refresh Tokens
- **Lifespan**: 7 days (configurable)
- **Purpose**: Generate new access tokens
- **Storage**: Secure, HTTP-only cookie recommended
- **Security**: Can be invalidated server-side

## 🚨 Security Best Practices

### 1. Secret Management
- ✅ Use different secrets for development and production
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Store production secrets in secure environment variable services
- ✅ Never commit secrets to version control
- ✅ Use strong, randomly generated secrets (128+ characters)

### 2. Token Handling
- ✅ Store refresh tokens in HTTP-only cookies
- ✅ Implement token rotation (new refresh token on each refresh)
- ✅ Implement token blacklisting for logout
- ✅ Use HTTPS in production
- ✅ Set appropriate CORS policies

### 3. Monitoring
- ✅ Log authentication failures
- ✅ Monitor for suspicious token usage
- ✅ Implement rate limiting on auth endpoints
- ✅ Track token refresh patterns

## 🔍 Troubleshooting

### Common Issues

1. **"JWT_SECRET is using a default/example value"**
   - Solution: Generate new secrets using the provided script

2. **"Token has expired"**
   - Solution: Use the refresh token to get a new access token

3. **"Invalid token type"**
   - Solution: Ensure you're using an access token for API calls, not a refresh token

4. **"User not found or inactive"**
   - Solution: User account may have been deleted or deactivated

### Validation Commands

```bash
# Validate JWT configuration
node scripts/generate-jwt-secrets.js validate

# Check environment variables
node -e "console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing')"
```

## 📚 Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Access token signing secret | - | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Same as JWT_SECRET | ❌ |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access token expiration | `15m` | ❌ |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | `7d` | ❌ |
| `JWT_ISSUER` | Token issuer | `localpro-api` | ❌ |
| `JWT_AUDIENCE` | Token audience | `localpro-mobile` | ❌ |

### Token Expiration Formats

- `15m` - 15 minutes
- `1h` - 1 hour
- `7d` - 7 days
- `30d` - 30 days
- `3600` - 3600 seconds

## 🔐 Production Deployment

### 1. Environment Variables

Set these in your production environment:

```bash
# Required
JWT_SECRET=<your-production-secret>
JWT_REFRESH_SECRET=<your-production-refresh-secret>

# Optional (recommended)
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
JWT_ISSUER=localpro-api
JWT_AUDIENCE=localpro-mobile
```

### 2. Secret Rotation

Implement a secret rotation strategy:

1. Generate new secrets
2. Update environment variables
3. Restart application
4. Old tokens will be invalidated

### 3. Monitoring

Monitor these metrics:
- Authentication success/failure rates
- Token refresh frequency
- Suspicious authentication patterns
- Token expiration errors

## 📞 Support

If you encounter issues with JWT setup:

1. Check the application logs for JWT-related errors
2. Validate your environment variables
3. Ensure secrets are properly generated
4. Verify token format and expiration

For additional help, refer to the main application documentation or contact the development team.
