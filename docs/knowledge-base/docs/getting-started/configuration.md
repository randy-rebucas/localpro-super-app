# Configuration Guide

## Environment Variables

See [Environment Variables Reference](../reference/environment-variables.md) for complete list.

## Quick Configuration

### 1. Copy Environment Template

```bash
cp env.example .env
```

### 2. Required Configuration

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT
JWT_SECRET=your-strong-secret-key-here
```

### 3. External Services

Configure based on features you need:

**SMS (Twilio)**:
```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

**File Storage (Cloudinary)**:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

**Payments**:
```env
# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-secret
PAYPAL_MODE=sandbox

# PayMongo
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
```

## Application Settings

### App Settings API

Configure app-wide settings via API:

```javascript
PUT /api/settings/app
Body: {
  general: {
    appName: "LocalPro",
    maintenanceMode: false
  },
  features: {
    marketplace: { enabled: true },
    academy: { enabled: true }
  }
}
```

### Feature Toggles

Enable/disable features:

```javascript
POST /api/settings/app/features/toggle
Body: {
  feature: "marketplace",
  enabled: true
}
```

## Database Configuration

### Connection Options

```env
# Basic
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# With Authentication
MONGODB_URI=mongodb://user:pass@localhost:27017/localpro-super-app

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/localpro
```

### Connection Pool Settings

```env
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_SERVER_SELECTION_TIMEOUT=5000
```

## Security Configuration

### CORS

```env
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

### Rate Limiting

Configured in code, can be adjusted in middleware.

## Logging Configuration

```env
LOG_LEVEL=info  # debug, info, warn, error
LOG_DIR=logs
```

## Next Steps

- Review [Quick Start Guide](./quick-start.md)
- Check [Development Setup](./development-setup.md)
- See [Environment Variables Reference](../reference/environment-variables.md)

