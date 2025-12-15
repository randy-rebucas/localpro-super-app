# Environment Variables Reference

## Required Variables

### Server Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production`, `development` |
| `PORT` | Server port | `5000` |

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/localpro` |
| `MONGODB_USER` | MongoDB username (optional) | `admin` |
| `MONGODB_PASSWORD` | MongoDB password (optional) | `password` |

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRE` | Token expiration | `24h` |

## External Services

### Twilio (SMS)

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |

### Cloudinary (File Storage)

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### PayPal

| Variable | Description |
|----------|-------------|
| `PAYPAL_CLIENT_ID` | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret |
| `PAYPAL_MODE` | `sandbox` or `live` |

### PayMaya/PayMongo

| Variable | Description |
|----------|-------------|
| `PAYMONGO_SECRET_KEY` | PayMongo secret key |
| `PAYMONGO_PUBLIC_KEY` | PayMongo public key |

## Optional Variables

### CORS

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend URL | - |
| `ADMIN_URL` | Admin panel URL | - |

### Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Log level | `info` |
| `LOG_DIR` | Log directory | `logs` |

## Example .env File

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=24h

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox

# CORS
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

## Security Notes

1. **Never commit .env files** to repository
2. **Use strong secrets** for JWT_SECRET
3. **Rotate secrets** regularly
4. **Use different secrets** per environment
5. **Store secrets securely** in production

