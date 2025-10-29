# Environment Variable Validation System

This system provides comprehensive environment variable validation and startup checks for the LocalPro Super App API.

## Features

- ✅ **Comprehensive Validation Schema** - Validates all required and optional environment variables
- ✅ **Type Validation** - Validates string, number, email, URL, and pattern-based values
- ✅ **Conditional Requirements** - Validates dependencies between environment variables
- ✅ **Startup Checks** - Tests database, Redis, and external service connectivity
- ✅ **Graceful Failure** - Provides clear error messages and exits gracefully on validation failure
- ✅ **Security Warnings** - Warns about insecure configurations in production
- ✅ **Custom Checks** - Allows adding custom validation logic
- ✅ **Detailed Logging** - Uses Winston logger for structured logging

## Files

- `src/config/envValidation.js` - Core validation schema and functions
- `src/utils/startupValidation.js` - Startup validation utility class
- `test-env-validation.js` - Test script for validation scenarios
- `demo-env-validation.js` - Demo script showing validation in action

## Required Environment Variables

### Core Application
- `NODE_ENV` - Application environment (development, production, test)
- `PORT` - Server port number (1-65535)
- `FRONTEND_URL` - Frontend application URL for CORS

### Database
- `MONGODB_URI` - MongoDB connection string

### Authentication
- `JWT_SECRET` - JWT secret key (minimum 32 characters, 64+ recommended for production)

### Email Service
- `EMAIL_SERVICE` - Email provider (resend, sendgrid, smtp, hostinger)
- `FROM_EMAIL` - Default sender email address

### File Upload
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Maps
- `GOOGLE_MAPS_API_KEY` - Google Maps API key

## Optional Environment Variables

### Redis (for caching)
- `REDIS_URL` - Redis connection URL

### Twilio (for SMS)
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_VERIFY_SERVICE_SID` - Twilio Verify Service SID

### PayPal (for payments)
- `PAYPAL_CLIENT_ID` - PayPal Client ID
- `PAYPAL_CLIENT_SECRET` - PayPal Client Secret
- `PAYPAL_MODE` - PayPal mode (sandbox, live)

### PayMaya (for payments)
- `PAYMAYA_PUBLIC_KEY` - PayMaya Public Key
- `PAYMAYA_SECRET_KEY` - PayMaya Secret Key
- `PAYMAYA_MODE` - PayMaya mode (sandbox, production)

### Email Service Specific
- `RESEND_API_KEY` - Required if EMAIL_SERVICE=resend
- `SENDGRID_API_KEY` - Required if EMAIL_SERVICE=sendgrid
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Required if EMAIL_SERVICE=smtp or hostinger

## Usage

### Automatic Validation (Server Startup)

The validation runs automatically when starting the server:

```bash
npm start
```

If validation fails, the server will not start and will display detailed error messages.

### Manual Validation

```javascript
const { validateEnvironment } = require('./src/config/envValidation');

const result = validateEnvironment();
if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}
```

### Custom Startup Checks

```javascript
const StartupValidator = require('./src/utils/startupValidation');

const validator = new StartupValidator();

// Add custom check
validator.addCheck('Custom Check', async () => {
  // Your validation logic here
  return true;
}, true); // true = critical, false = non-critical

// Run all checks
const results = await validator.runAllChecks();
```

## Testing

### Run Test Suite

```bash
node test-env-validation.js
```

### Run Demo

```bash
node demo-env-validation.js
```

### Test Individual Functions

```bash
node test-env-validation.js --functions-only
```

## Validation Rules

### String Validation
- `minLength` - Minimum character length
- `maxLength` - Maximum character length
- `pattern` - Regular expression pattern
- `validValues` - Array of allowed values

### Number Validation
- `min` - Minimum value
- `max` - Maximum value

### Email Validation
- Validates email format using regex

### URL Validation
- Validates URL format using URL constructor

### Conditional Validation
- Email service specific variables are required based on EMAIL_SERVICE value
- Payment service variables are validated in pairs
- Twilio variables are validated in pairs

## Error Handling

### Validation Errors
- Missing required variables
- Invalid variable values
- Pattern mismatches
- Type mismatches

### Startup Errors
- Database connection failures
- Redis connection failures (non-critical)
- External service configuration issues

### Security Warnings
- Weak JWT secrets in production
- Localhost database in production
- Missing security configurations

## Logging

All validation results are logged using Winston logger with appropriate levels:
- `info` - Successful validations and startup information
- `warn` - Warnings and non-critical issues
- `error` - Validation failures and critical errors

## Example Output

### Successful Validation
```
🔍 Starting environment variable validation...
✅ All environment variables validated successfully
🚀 Starting application startup validation...
✅ Environment variables validated successfully
📊 Database connected successfully: localhost
✅ Redis connected successfully
✅ Email service (Resend) configured
✅ Cloudinary configured
✅ Google Maps API configured
✅ All startup checks completed successfully in 1250ms
```

### Failed Validation
```
🔍 Starting environment variable validation...
❌ Environment validation failed:
  Required environment variable MONGODB_URI is missing
  Required environment variable JWT_SECRET is missing
  Invalid value for PORT: 99999
    - Must be at most 65535
💥 Application startup failed
Reason: Environment validation failed
Exiting application due to startup failure...
```

## Integration

The validation system is integrated into the server startup process in `src/server.js`:

1. Environment variables are validated first
2. Database connectivity is tested
3. External services are checked
4. Custom checks are run
5. Server starts only if all validations pass

This ensures the application never starts in an invalid state, preventing runtime errors and improving reliability.
