# LocalPro Super App - Environment Setup Guide

## Overview

This guide covers setting up the LocalPro Super App backend for local development. The application is built with Node.js/Express and uses MongoDB as the primary database.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Third-Party Services](#third-party-services)
6. [Running the Application](#running-the-application)
7. [Development Tools](#development-tools)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | Runtime environment |
| npm | 9.x or higher | Package manager |
| MongoDB | 6.0+ or Atlas | Database |
| Git | 2.x+ | Version control |

### Optional Software

| Software | Purpose |
|----------|---------|
| MongoDB Compass | GUI for MongoDB |
| Postman | API testing |
| VS Code | Recommended IDE |
| Redis | Caching (optional) |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git version
git --version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/localpro-super-app.git
cd localpro-super-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`:

**Core Dependencies:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

**Service Integrations:**
- `twilio` - SMS/Voice services
- `cloudinary` - Image storage
- `@paypal/paypal-server-sdk` - PayPal payments
- `resend` - Email delivery
- `ws` - WebSocket support

**Utilities:**
- `uuid` - UUID generation
- `node-cron` - Background job scheduling
- `joi` - Input validation
- `dotenv` - Environment variables
- `winston` - Logging

### 3. Run Setup Script

```bash
npm run setup
```

This initializes required directories and configurations.

---

## Environment Variables

### Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Required Variables

```env
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=development
PORT=3000
API_VERSION=v1

# ===========================================
# DATABASE
# ===========================================
MONGODB_URI=mongodb://localhost:27017/localpro_dev
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/localpro?retryWrites=true&w=majority

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# MPIN Settings
MPIN_SECRET=your-mpin-encryption-secret

# ===========================================
# OTP SETTINGS
# ===========================================
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_COOLDOWN_MINUTES=1

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Third-Party Service Variables

```env
# ===========================================
# TWILIO (SMS/Voice)
# ===========================================
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# ===========================================
# CLOUDINARY (Image Storage)
# ===========================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=localpro/dev

# ===========================================
# EMAIL (Resend)
# ===========================================
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=LocalPro <noreply@yourdomain.com>

# ===========================================
# PAYPAL
# ===========================================
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
# Use 'live' for production

# ===========================================
# PAYMAYA
# ===========================================
PAYMAYA_PUBLIC_KEY=your_paymaya_public_key
PAYMAYA_SECRET_KEY=your_paymaya_secret_key
PAYMAYA_ENVIRONMENT=sandbox
# Use 'production' for live

# ===========================================
# PAYMONGO
# ===========================================
PAYMONGO_SECRET_KEY=your_paymongo_secret_key
PAYMONGO_PUBLIC_KEY=your_paymongo_public_key

# ===========================================
# FIREBASE (Push Notifications)
# ===========================================
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# ===========================================
# WEBHOOKS
# ===========================================
WEBHOOK_SECRET=your_webhook_signing_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYMONGO_WEBHOOK_SECRET=your_paymongo_webhook_secret
```

### Development-Only Variables

```env
# ===========================================
# DEVELOPMENT
# ===========================================
DEBUG=true
LOG_LEVEL=debug
SWAGGER_ENABLED=true
SEED_DATABASE=false

# Skip email/SMS in development
SKIP_EMAIL_VERIFICATION=true
SKIP_SMS_VERIFICATION=true

# Test accounts
TEST_OTP=123456
```

### Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for JWT and encryption keys
- Rotate secrets regularly in production
- Use different credentials for development and production

---

## Database Setup

### Option 1: Local MongoDB

#### Install MongoDB Community Server

**Windows:**
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Add MongoDB to PATH

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Linux (Ubuntu):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### Verify MongoDB is Running

```bash
mongosh
# Should connect to mongodb://localhost:27017
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Create database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string and update `MONGODB_URI`

### Seed Initial Data

```bash
# Seed service categories
npm run seed:categories

# Seed job categories
npm run seed:job-categories
```

### Create Indexes

Indexes are automatically created by Mongoose schemas on first run. To manually create indexes:

```bash
mongosh localpro_dev --eval "db.getCollectionNames().forEach(c => db[c].createIndexes())"
```

---

## Third-Party Services

### Twilio Setup (SMS/Voice)

1. Create account at [Twilio](https://www.twilio.com)
2. Get Account SID and Auth Token from Console
3. Purchase a phone number
4. Create a Verify Service for OTP

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Cloudinary Setup (Image Storage)

1. Create account at [Cloudinary](https://cloudinary.com)
2. Get credentials from Dashboard
3. Create upload preset for unsigned uploads (optional)

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret
```

### PayPal Setup

1. Create developer account at [PayPal Developer](https://developer.paypal.com)
2. Create sandbox app
3. Get Client ID and Secret

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
```

### Resend Setup (Email)

1. Create account at [Resend](https://resend.com)
2. Verify your domain
3. Create API key

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=LocalPro <noreply@yourdomain.com>
```

### Firebase Setup (Push Notifications)

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Go to Project Settings > Service Accounts
3. Generate new private key
4. Copy credentials to environment variables

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with:
- Hot reloading enabled
- Debug logging
- Swagger documentation at `/api-docs`

### Production Mode

```bash
npm start
```

### Verify Application is Running

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Access Swagger Documentation

Open in browser: `http://localhost:3000/api-docs`

---

## Development Tools

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run verify` | Run linting and tests |
| `npm run setup` | Initialize application |
| `npm run seed:categories` | Seed service categories |
| `npm run seed:job-categories` | Seed job categories |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "mongodb.mongodb-vscode",
    "rangav.vscode-thunder-client",
    "humao.rest-client"
  ]
}
```

### Postman Collection

Import the Postman collection from:
```
docs/postman/LocalPro-API.postman_collection.json
```

### Git Hooks

The project uses pre-commit hooks for:
- ESLint validation
- Prettier formatting
- Test execution

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```
Error: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Ensure MongoDB is running: `sudo systemctl status mongod`
2. Check connection string in `.env`
3. For Atlas, verify IP whitelist and credentials

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000
# or on Windows
netstat -ano | findstr :3000

# Kill the process or use different port
PORT=3001 npm run dev
```

#### JWT Secret Issues

```
Error: secretOrPrivateKey must have a value
```

**Solution:**
Ensure `JWT_SECRET` is set in `.env` and is at least 32 characters.

#### Cloudinary Upload Failed

```
Error: Invalid API key or secret
```

**Solution:**
1. Verify Cloudinary credentials
2. Check for extra spaces in environment variables
3. Ensure cloud name is correct (not email)

#### Twilio SMS Not Sending

```
Error: Account SID not found
```

**Solution:**
1. Verify Twilio credentials are correct
2. Check account has sufficient balance
3. Verify phone number format (+1234567890)

#### Rate Limiting in Development

If you're getting rate limited during development:

```env
# Increase rate limit for development
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000
```

### Debug Mode

Enable verbose logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Check Logs

```bash
# View recent logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log
```

### Database Debugging

```bash
# Connect to MongoDB shell
mongosh localpro_dev

# View collections
show collections

# Check indexes
db.users.getIndexes()

# Query sample data
db.users.findOne()
```

---

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
DEBUG=true
SWAGGER_ENABLED=true
SKIP_EMAIL_VERIFICATION=true
SKIP_SMS_VERIFICATION=true
```

### Staging

```env
NODE_ENV=staging
DEBUG=false
SWAGGER_ENABLED=true
SKIP_EMAIL_VERIFICATION=false
SKIP_SMS_VERIFICATION=false
```

### Production

```env
NODE_ENV=production
DEBUG=false
SWAGGER_ENABLED=false
SKIP_EMAIL_VERIFICATION=false
SKIP_SMS_VERIFICATION=false

# Use production payment credentials
PAYPAL_MODE=live
PAYMAYA_ENVIRONMENT=production
```

---

## Security Checklist

Before deploying to production:

- [ ] All secrets are strong and unique
- [ ] MongoDB has authentication enabled
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting is appropriate
- [ ] CORS is configured for production domains
- [ ] Debug mode is disabled
- [ ] Sensitive endpoints require authentication
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't capture sensitive data

---

## Support

For issues and questions:

1. Check existing [GitHub Issues](https://github.com/your-org/localpro-super-app/issues)
2. Review [API Documentation](./API_REFERENCE.md)
3. Contact the development team

---

*Last Updated: January 2026*
*Document Version: 1.0*
