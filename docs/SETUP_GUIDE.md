# LocalPro Super App Setup Guide

This guide will help you set up the LocalPro Super App with all required data seeds and configurations.

## Prerequisites

Before running the setup, ensure you have:

1. **Node.js** (v16 or higher)
2. **MongoDB** (v4.4 or higher)
3. **npm** or **yarn** package manager
4. **Environment variables** configured

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# External Services (Optional for initial setup)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 3. Run App Setup

Execute the comprehensive setup script:

```bash
npm run setup
```

This will:
- ✅ Connect to MongoDB
- ✅ Create default app settings
- ✅ Create admin users
- ✅ Create sample agencies
- ✅ Seed all modules with sample data
- ✅ Validate the setup
- ✅ Generate a setup report

### 4. Start the Application

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Setup Details

### What Gets Created

The setup script creates a complete working environment with:

#### 🔐 Admin Users
- **Super Admin**: `admin@localpro.com` / `+639171234567`
- **Agency Owner**: `agency@localpro.com` / `+639171234568`

#### 🏢 Sample Data
- **1 Agency**: CleanPro Services
- **2 Services**: Residential Deep Cleaning, Office Cleaning
- **1 Course**: Professional Cleaning Techniques
- **1 Job**: Cleaning Service Manager
- **2 Products**: Professional All-Purpose Cleaner, Microfiber Cloths
- **1 Rental Item**: Professional Vacuum Cleaner
- **1 Certification**: Professional Cleaning Certificate

#### ⚙️ App Settings
- Complete application configuration
- Feature flags and permissions
- Security settings
- Payment configurations
- Notification settings
- Rate limiting rules

### Database Structure

The setup creates the following collections:

```
localpro-super-app/
├── users (with roles: admin, agency_owner, provider, client)
├── appsettings (global configuration)
├── usersettings (user preferences)
├── agencies (business entities)
├── services (marketplace services)
├── bookings (service bookings)
├── courses (academy courses)
├── enrollments (course enrollments)
├── certifications (certification programs)
├── jobs (job board)
├── products (supplies marketplace)
├── orders (product orders)
├── rentalitems (equipment rental)
├── rentals (rental bookings)
├── loans (financial services)
├── transactions (payment transactions)
├── referrals (referral system)
├── trustverifications (trust system)
├── communications (messaging)
├── analytics (data analytics)
├── ads (advertising)
├── facilitycare (facility management)
└── localproplus (premium features)
```

## Advanced Setup

### PayMaya Configuration

To set up PayMaya payment integration:

```bash
npm run setup:paymaya
```

This will configure PayMaya sandbox credentials in your `.env` file.

### Manual Setup Steps

If you prefer to set up components individually:

1. **Database Only**:
   ```bash
   node -e "require('./src/config/database')()"
   ```

2. **App Settings Only**:
   ```bash
   node -e "
   require('dotenv').config();
   require('./src/config/database')();
   const AppSettings = require('./src/models/AppSettings');
   AppSettings.getCurrentSettings().then(() => process.exit(0));
   "
   ```

### Environment-Specific Setup

#### Development
```bash
NODE_ENV=development npm run setup
```

#### Production
```bash
NODE_ENV=production npm run setup
```

## Verification

After setup, verify everything is working:

### 1. Check Setup Report
The setup generates `setup-report.json` with detailed information about what was created.

### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/

# Test authentication (replace with actual admin credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639171234567", "password": "your-password"}'
```

### 3. Access Admin Features
- Login with admin credentials
- Check user management
- Verify agency settings
- Test service creation

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
❌ Database connection failed: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# Start MongoDB
mongod

```

#### Environment Variables Missing
```
❌ JWT_SECRET is required
```
**Solution**: Ensure `.env` file exists and contains required variables
```bash
cp env.example .env
# Edit .env with your values
```

#### Permission Errors
```
❌ EACCES: permission denied
```
**Solution**: Check file permissions and run with appropriate privileges
```bash
sudo npm run setup  # Linux/Mac
# Or run as administrator on Windows
```

### Reset Setup

To reset and start fresh:

```bash
# Drop database (WARNING: This will delete all data)
node -e "
require('dotenv').config();
require('./src/config/database')();
const mongoose = require('mongoose');
mongoose.connection.dropDatabase().then(() => {
  console.log('Database dropped');
  process.exit(0);
});
"

# Run setup again
npm run setup
```

## Post-Setup Configuration

### 1. External Services

Configure external services in your `.env` file:

```env
# Email Service
EMAIL_SERVICE=resend
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# SMS Service
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateways
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYMAYA_PUBLIC_KEY=your-paymaya-public-key
PAYMAYA_SECRET_KEY=your-paymaya-secret-key

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 2. SSL/HTTPS Setup

For production, configure SSL:

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update server configuration
NODE_ENV=production
SSL_CERT_PATH=./cert.pem
SSL_KEY_PATH=./key.pem
```

### 3. Monitoring Setup

Configure monitoring services:

```env
# Error Monitoring
SENTRY_DSN=your-sentry-dsn

# Analytics
GOOGLE_ANALYTICS_ID=your-ga-id
MIXPANEL_TOKEN=your-mixpanel-token

# Notifications
SLACK_WEBHOOK_URL=your-slack-webhook
DISCORD_WEBHOOK_URL=your-discord-webhook
```

## Support

If you encounter issues during setup:

1. Check the setup report: `setup-report.json`
2. Review the logs for error messages
3. Verify all prerequisites are met
4. Check environment variables
5. Ensure database connectivity

For additional help, refer to:
- [API Documentation](docs/)
- [Integration Guides](docs/)
- [Troubleshooting Guide](docs/)

## Next Steps

After successful setup:

1. **Configure External Services**: Set up payment gateways, email, SMS
2. **Customize Settings**: Adjust app settings via admin panel
3. **Add Content**: Create your own services, courses, jobs
4. **Test Features**: Verify all modules work correctly
5. **Deploy**: Set up production environment
6. **Monitor**: Configure monitoring and analytics

---

**Happy coding! 🚀**
