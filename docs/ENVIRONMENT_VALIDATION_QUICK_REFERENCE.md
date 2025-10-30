# Environment Variable Validation - Quick Reference

## 🚀 Quick Start

The environment validation system automatically runs when you start the server:

```bash
npm start
```

If validation fails, the server won't start and you'll see clear error messages.

## 🔧 Common Issues & Solutions

### Missing Required Variables
```
❌ Required environment variable MONGODB_URI is missing
```
**Solution:** Set the MongoDB connection string in your `.env` file:
```bash
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
```

### Invalid JWT Secret
```
❌ Invalid value for JWT_SECRET: short
  - Must be at least 32 characters long
```
**Solution:** Use a longer, secure JWT secret:
```bash
JWT_SECRET=your-super-secure-jwt-secret-that-is-at-least-32-characters-long
```

### Email Service Configuration
```
❌ RESEND_API_KEY is required when EMAIL_SERVICE=resend
```
**Solution:** Either set the API key or change the email service:
```bash
# Option 1: Set Resend API key
RESEND_API_KEY=re_your_api_key_here

# Option 2: Use SMTP instead
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

### Invalid Port Number
```
❌ Invalid value for PORT: 99999
  - Must be at most 65535
```
**Solution:** Use a valid port number:
```bash
PORT=5000
```

## 📋 Required Variables Checklist

- [ ] `NODE_ENV` (development, production, test)
- [ ] `PORT` (1-65535)
- [ ] `FRONTEND_URL` (valid URL)
- [ ] `MONGODB_URI` (MongoDB connection string)
- [ ] `JWT_SECRET` (32+ characters)
- [ ] `EMAIL_SERVICE` (resend, sendgrid, smtp, hostinger)
- [ ] `FROM_EMAIL` (valid email address)
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `GOOGLE_MAPS_API_KEY`

## 🧪 Testing Validation

### Run Demo
```bash
node demo-env-validation.js
```

### Run Tests
```bash
node test-env-validation.js
```

### Test Individual Functions
```bash
node test-env-validation.js --functions-only
```

## 🔍 Validation Levels

### Critical (Application won't start)
- Missing required variables
- Invalid core configurations
- Database connection failures

### Warnings (Application starts but with limitations)
- Missing optional services (Redis, Twilio, PayPal)
- Weak JWT secrets in production
- Localhost database in production

## 🛠️ Custom Validation

Add custom startup checks in `src/server.js`:

```javascript
startupValidator.addCheck('Custom Check', async () => {
  // Your validation logic
  return true; // or false
}, true); // true = critical, false = warning
```

## 📊 Environment Summary

The system provides a summary of your configuration:

```javascript
const { getEnvironmentSummary } = require('./src/config/envValidation');
console.log(getEnvironmentSummary());
```

## 🚨 Production Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Production MongoDB URI (not localhost)
- [ ] Valid frontend URL
- [ ] Email service configured
- [ ] File upload service configured
- [ ] Maps API configured
- [ ] Payment services configured (if needed)
- [ ] SMS service configured (if needed)

## 📝 Example .env File

```bash
# Core
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT
JWT_SECRET=your-super-secure-jwt-secret-that-is-at-least-32-characters-long

# Email
EMAIL_SERVICE=resend
FROM_EMAIL=noreply@yourdomain.com
RESEND_API_KEY=re_your_api_key_here

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Maps
GOOGLE_MAPS_API_KEY=your-maps-api-key

# Optional Services
REDIS_URL=redis://localhost:6379
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

## 🆘 Troubleshooting

1. **Check your .env file** - Make sure all required variables are set
2. **Validate formats** - URLs, emails, and patterns must match exactly
3. **Check dependencies** - Some variables require others (e.g., SMTP requires host, port, user, pass)
4. **Run the demo** - Use `node demo-env-validation.js` to see what's configured
5. **Check logs** - Winston logs provide detailed validation information

## 📚 More Information

See `docs/ENVIRONMENT_VALIDATION.md` for complete documentation.
