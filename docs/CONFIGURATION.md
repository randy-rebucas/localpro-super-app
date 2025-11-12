# Configuration Guide

## Overview
This guide explains all configuration options for the LocalPro Super App.

## Environment Variables

### Server Configuration

```bash
# Server
NODE_ENV=development|production|staging
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Database Configuration

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

### Authentication

```bash
# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
```

### Twilio (SMS)

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Payment Gateways

#### PayPal
```bash
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox|live
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
```

#### PayMaya
```bash
PAYMAYA_PUBLIC_KEY=your-paymaya-public-key
PAYMAYA_SECRET_KEY=your-paymaya-secret-key
PAYMAYA_MODE=sandbox|live
PAYMAYA_WEBHOOK_SECRET=your-paymaya-webhook-secret
```

### File Storage

#### Cloudinary (Recommended)
```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### AWS S3 (Alternative)
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1
```

### Email Services

#### Option 1: Resend (Recommended)
```bash
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=resend
```

#### Option 2: SendGrid
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=sendgrid
```

#### Option 3: SMTP (Hostinger, etc.)
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
EMAIL_SERVICE=smtp
```

### Google Maps API

```bash
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_GEOCODING_API_KEY=your-geocoding-key
GOOGLE_MAPS_PLACES_API_KEY=your-places-key
GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your-distance-matrix-key
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Logging

```bash
LOG_LEVEL=info|debug|warn|error
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_HTTP_REQUESTS=true
LOG_SLOW_REQUESTS_THRESHOLD=2000  # milliseconds
LOG_BATCH_SIZE=100
LOG_FLUSH_INTERVAL=5000  # milliseconds
LOG_DATABASE_ENABLED=true
```

### Error Monitoring

```bash
ERROR_MONITORING_ENABLED=true
ERROR_ALERT_THRESHOLDS_CRITICAL=1
ERROR_ALERT_THRESHOLDS_HIGH=5
ERROR_ALERT_THRESHOLDS_MEDIUM=10
ERROR_ALERT_THRESHOLDS_LOW=20
```

### Audit Logging

```bash
AUDIT_LOGGING_ENABLED=true
AUDIT_RETENTION_DAYS=2555  # 7 years
AUDIT_LOG_SENSITIVE_DATA=false
AUDIT_LOG_REQUEST_BODY=false
AUDIT_LOG_RESPONSE_BODY=false
AUDIT_AUTO_CLEANUP=true
AUDIT_CLEANUP_SCHEDULE=0 2 * * *  # Cron format
```

### External Monitoring (Optional)

```bash
SENTRY_DSN=your-sentry-dsn-here
SLACK_WEBHOOK_URL=your-slack-webhook-url
DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

## Configuration Files

### Environment Files
- `.env` - Development environment (gitignored)
- `env.example` - Template with all variables
- `env.production` - Production template

### Setup Scripts
- `setup-app.js` - Comprehensive setup
- `setup-install.js` - Installation setup
- `setup-auto.js` - Automated setup
- `setup-paymaya-config.js` - PayMaya configuration
- `setup-monitoring.js` - Monitoring setup

## Configuration Validation

The application validates configuration on startup:

```javascript
// Startup validation checks:
- Database connection
- Required environment variables
- External service connectivity
- File system permissions
- Port availability
```

## Feature Flags

Feature flags are managed in AppSettings model:

```javascript
{
  features: {
    marketplace: { enabled: true },
    jobs: { enabled: true },
    academy: { enabled: true },
    // ... other features
  }
}
```

## Security Configuration

### CORS
```javascript
// Configured in server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true
};
```

### Helmet
```javascript
// Security headers configured via Helmet
app.use(helmet());
```

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 5 minutes
- SMS endpoints: 1 request per minute
- Upload endpoints: 10 requests per 15 minutes

## Database Configuration

### Connection Options
```javascript
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}
```

### Indexes
Indexes are created automatically via Mongoose schemas. Additional indexes can be created via:
```bash
npm run scripts/create-database-indexes.js
```

## Logging Configuration

### Winston Configuration
- **Console**: Development output
- **File**: Rotating daily log files
- **Database**: MongoDB log storage
- **Levels**: error, warn, info, debug, http

### Log File Structure
```
logs/
├── combined-YYYY-MM-DD.log
├── error-YYYY-MM-DD.log
└── http-YYYY-MM-DD.log
```

## Monitoring Configuration

### Prometheus Metrics
- HTTP request metrics
- Response time metrics
- Error rate metrics
- Database connection metrics
- Memory and CPU usage

### Metrics Endpoints
- `/api/monitoring/metrics` - Prometheus format
- `/api/monitoring/metrics/json` - JSON format
- `/api/monitoring/system-health` - Health check

## Related Documentation
- [Architecture](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

