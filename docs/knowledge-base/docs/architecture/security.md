# Security Architecture

## Overview

LocalPro Super App implements comprehensive security measures at multiple layers to protect user data, prevent attacks, and ensure system integrity.

## Security Layers

```
┌─────────────────────────────────────────┐
│     Network Security (HTTPS/TLS)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│     Application Security Headers        │
│     (Helmet, CORS, Rate Limiting)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│     Authentication & Authorization      │
│     (JWT, Role-Based Access)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│     Input Validation & Sanitization      │
│     (Joi, express-validator, DOMPurify) │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│     Data Protection                     │
│     (Encryption, Hashing)               │
└─────────────────┬───────────────────────┘
```

## Security Headers

### Helmet Configuration

```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.paymongo.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: 'strict-origin-when-cross-origin'
})
```

### Security Headers Applied

| Header | Purpose | Value |
|--------|---------|-------|
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `X-Frame-Options` | Prevent clickjacking | `DENY` |
| `X-XSS-Protection` | XSS protection | `1; mode=block` |
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000` |
| `Content-Security-Policy` | Resource loading restrictions | Various |
| `Referrer-Policy` | Control referrer information | `strict-origin-when-cross-origin` |

## CORS Configuration

### Allowed Origins

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'http://localhost:3000',  // Development
  'http://localhost:3001'   // Development
];
```

### CORS Settings

- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Authorization, Content-Type, X-Request-ID
- **Max Age**: 24 hours

## Rate Limiting

### General Rate Limiter

```javascript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
```

### Auth Rate Limiter

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 attempts per 15 minutes
  message: 'Too many authentication attempts'
});
```

### Rate Limit Headers

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Input Validation

### Schema Validation (Joi)

```javascript
const serviceSchema = Joi.object({
  title: Joi.string().required().max(200),
  price: Joi.number().required().min(0),
  category: Joi.string().valid('cleaning', 'plumbing')
});
```

### Express Validator

```javascript
[
  body('email').isEmail().normalizeEmail(),
  body('phoneNumber').isMobilePhone(),
  body('price').isFloat({ min: 0 })
]
```

### HTML Sanitization

```javascript
const DOMPurify = require('isomorphic-dompurify');

const sanitized = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: []
});
```

## SQL Injection Protection

### MongoDB Injection Prevention

MongoDB is naturally resistant to SQL injection, but we still:

1. **Use Parameterized Queries**: Mongoose handles this automatically
2. **Validate ObjectIds**: Check format before queries
3. **Sanitize Input**: Remove special characters

```javascript
// Good: Parameterized query
User.findById(userId);

// Bad: String concatenation (not applicable to MongoDB)
// But still validate userId format
if (!mongoose.Types.ObjectId.isValid(userId)) {
  return res.status(400).json({ error: 'Invalid ID' });
}
```

## XSS Protection

### Server-Side

1. **Input Sanitization**: Remove HTML tags
2. **Output Encoding**: Encode special characters
3. **Content Security Policy**: Restrict script execution

### Client-Side

- Sanitize user-generated content
- Use React's built-in XSS protection
- Avoid `dangerouslySetInnerHTML`

## Authentication Security

### JWT Security

1. **Strong Secret**: Use cryptographically random secret
2. **Short Expiration**: 24-hour token lifetime
3. **HTTPS Only**: Transmit tokens over HTTPS only
4. **Token Validation**: Always verify signature

### Password Security

- No passwords used (phone-based auth)
- Verification codes expire in 5 minutes
- Rate limiting on code requests

## Data Protection

### Encryption at Rest

- MongoDB encryption (if enabled)
- Environment variables encrypted
- Secrets stored securely

### Encryption in Transit

- HTTPS/TLS for all API communication
- TLS 1.2+ required
- Certificate validation

### Data Hashing

- Sensitive data hashed (if needed)
- bcrypt for password hashing (not used, but available)

## API Security

### Request Validation

1. **Content-Type**: Validate expected content type
2. **Request Size**: Limit to 10MB
3. **Request Timeout**: 30-second timeout
4. **IP Filtering**: Optional IP whitelist

### Response Security

1. **No Sensitive Data**: Don't expose internal details
2. **Error Messages**: Generic error messages
3. **Rate Limit Info**: Include in headers only

## File Upload Security

### Restrictions

```javascript
{
  fileSize: 5 * 1024 * 1024,  // 5MB max
  fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 5
}
```

### Validation

1. **MIME Type Check**: Verify file type
2. **File Size Limit**: Enforce size limits
3. **Virus Scanning**: Optional virus scan
4. **Storage**: Cloudinary handles secure storage

## Audit Logging

### Security Events Logged

- Authentication attempts
- Authorization failures
- Admin actions
- Data modifications
- Failed validations

### Log Format

```javascript
{
  timestamp: '2025-12-16T10:30:00Z',
  user: 'user_id',
  action: 'AUTHENTICATION_FAILED',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  details: { reason: 'Invalid token' }
}
```

## Error Handling Security

### Error Responses

```javascript
// Don't expose internal details
{
  success: false,
  message: 'An error occurred',
  code: 'INTERNAL_ERROR'
  // No stack traces in production
}
```

### Error Logging

- Log detailed errors server-side
- Return generic messages to client
- Include error codes for debugging

## Environment Security

### Environment Variables

- Never commit `.env` files
- Use strong secrets
- Rotate secrets regularly
- Use different secrets per environment

### Secrets Management

```bash
# Production secrets
JWT_SECRET=<strong-random-secret>
MONGODB_URI=<connection-string>
PAYPAL_CLIENT_ID=<client-id>
PAYPAL_CLIENT_SECRET=<client-secret>
```

## Security Best Practices

### Development

1. **Never commit secrets** to repository
2. **Use environment variables** for configuration
3. **Validate all inputs** at boundaries
4. **Use parameterized queries** (automatic with Mongoose)
5. **Keep dependencies updated**

### Production

1. **Enable HTTPS** only
2. **Use strong JWT secrets**
3. **Implement rate limiting**
4. **Monitor security events**
5. **Regular security audits**
6. **Keep dependencies updated**
7. **Use security headers**
8. **Enable audit logging**

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Authentication required for protected routes
- [ ] Authorization checks in place
- [ ] Error messages don't expose internals
- [ ] File uploads validated
- [ ] Audit logging enabled
- [ ] Secrets stored securely
- [ ] Dependencies up to date
- [ ] Security monitoring active

## Incident Response

### Security Incident Process

1. **Detect**: Identify security issue
2. **Contain**: Limit impact
3. **Investigate**: Analyze root cause
4. **Remediate**: Fix vulnerability
5. **Document**: Record incident
6. **Notify**: Inform affected users (if needed)

## Compliance

### Data Protection

- User data encrypted
- Access controls in place
- Audit trails maintained
- Data retention policies

### Privacy

- Minimal data collection
- User consent for data use
- Data deletion on request
- Privacy policy compliance

## Next Steps

- Review [Authentication Architecture](./authentication.md)
- Check [API Design](./api-design.md)
- Read [Deployment Security](../deployment/production.md#security)

