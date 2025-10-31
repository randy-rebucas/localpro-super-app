# LocalPro Super App Setup Installation Guide

This guide provides comprehensive instructions for setting up the LocalPro Super App with admin users and application settings.

## Overview

The LocalPro Super App includes multiple setup options to accommodate different deployment scenarios:

1. **Interactive Setup** (`setup-install.js`) - Guided setup with user prompts
2. **Automated Setup** (`setup-auto.js`) - Non-interactive setup for automation
3. **Full Setup** (`setup-app.js`) - Complete setup with sample data
4. **Verification** (`verify-setup.js`) - Verify setup completion

## Quick Start

### Prerequisites

Before running any setup, ensure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher) running and accessible
- **Environment variables** configured (see `env.example`)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and configure your environment file:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

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

## Setup Options

### Option 1: Interactive Setup (Recommended)

For guided setup with user prompts:

```bash
npm run setup:install
```

This will:
- ✅ Connect to database
- ✅ Check for existing data and offer to reset
- ✅ Prompt for admin user details
- ✅ Prompt for company information
- ✅ Create secure admin passwords
- ✅ Set up application settings
- ✅ Create admin users with proper authentication
- ✅ Create users for all roles (client, provider, supplier, instructor, agency_owner, agency_admin)
- ✅ Generate setup report

**Features:**
- Interactive prompts for all configuration
- Secure password input (hidden)
- Company information collection
- Role-based user creation
- Database reset option
- Comprehensive validation

### Option 2: Automated Setup

For non-interactive setup (CI/CD, etc.):

```bash
# Basic automated setup
npm run setup:auto

# With custom parameters
node setup-auto.js admin@yourcompany.com +639171234567 AdminPass123! "Your Company Name"
```

**Parameters:**
1. `admin-email` (default: admin@localpro.com)
2. `admin-phone` (default: +639179157515)
3. `admin-password` (default: Admin123!@#)
4. `company-name` (default: LocalPro Super App)

**Features:**
- Non-interactive setup
- Command-line parameter support
- Automated validation
- Creates users for all roles
- Automatic database reset
- Perfect for CI/CD pipelines

### Option 3: Full Setup with Sample Data

For complete setup with sample data:

```bash
npm run setup
```

This creates:
- Admin users
- Application settings
- Sample agencies
- Sample services, courses, jobs
- Sample products and rental items
- Sample certifications

### Option 4: Database Reset

To manually reset the database:

```bash
npm run setup:reset
```

This will:
- ✅ Connect to database
- ✅ Check for existing data
- ✅ Drop all collections
- ✅ Verify reset completion
- ✅ Generate reset report

### Option 5: Verification

To verify your setup:

```bash
npm run verify
```

This checks:
- Database connectivity
- Admin user existence
- Application settings
- Sample data creation
- Overall setup health

## Setup Details

### What Gets Created

#### 🔐 Admin Users
- **Super Admin**: Full system access
- **Client**: Regular service consumer
- **Service Provider**: Individual service provider
- **Supplier**: Equipment and supplies provider
- **Instructor**: Training and education provider
- **Agency Owner**: Business management access
- **Agency Admin**: Agency operations management
- Secure password hashing (bcrypt with 12 salt rounds)
- Complete verification status
- Trust scores and badges

#### ⚙️ Application Settings
- **General Settings**: App name, version, environment
- **Business Settings**: Company info, hours, support channels
- **Feature Flags**: Enable/disable modules
- **Security Settings**: Password policies, session management
- **Rate Limiting**: API protection rules
- **Upload Settings**: File size limits, allowed types
- **Notification Settings**: Email, SMS, push notifications
- **Payment Settings**: Currency, fees, payout schedules
- **Integration Settings**: Google Maps, Cloudinary, social login

#### 🏢 Sample Data (Full Setup Only)
- **1 Agency**: CleanPro Services
- **2 Services**: Residential Deep Cleaning, Office Cleaning
- **1 Course**: Professional Cleaning Techniques
- **1 Job**: Cleaning Service Manager
- **2 Products**: Professional All-Purpose Cleaner, Microfiber Cloths
- **1 Rental Item**: Professional Vacuum Cleaner
- **1 Certification**: Professional Cleaning Certificate

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

## Advanced Configuration

### Environment-Specific Setup

#### Development
```bash
NODE_ENV=development npm run setup:install
```

#### Production
```bash
NODE_ENV=production npm run setup:auto admin@yourcompany.com +639171234567 SecurePass123! "Your Company"
```

### CI/CD Integration

For automated deployments:

```yaml
# GitHub Actions example
- name: Setup Application
  run: |
    npm install
    npm run setup:auto ${{ secrets.ADMIN_EMAIL }} ${{ secrets.ADMIN_PHONE }} ${{ secrets.ADMIN_PASSWORD }} "${{ secrets.COMPANY_NAME }}"
```

## Security Considerations

### Password Requirements

The setup enforces strong password policies:
- Minimum 8 characters
- Must include uppercase letters
- Must include lowercase letters
- Must include numbers
- Must include special characters

### Admin User Security

- Passwords are hashed with bcrypt (12 salt rounds)
- All admin users are pre-verified
- Trust scores set to maximum
- Complete verification status
- Enterprise subscription level

### Database Security

- Connection strings should use authentication
- Environment variables for sensitive data
- No hardcoded credentials
- Secure default configurations

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
sudo npm run setup:install  # Linux/Mac
# Or run as administrator on Windows
```

#### Password Validation Failed
```
❌ Password must be at least 8 characters long
```

**Solution**: Use a stronger password that meets all requirements:
- At least 8 characters
- Include uppercase and lowercase letters
- Include numbers and special characters

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
npm run setup:install
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

### 2. Start the Application

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### 3. Test Admin Access

```bash
# Health check
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639179157515", "password": "Admin123!@#"}'
```

## Setup Reports

Each setup generates a detailed report:

- **Interactive Setup**: `setup-install-report.json`
- **Automated Setup**: `setup-auto-report.json`
- **Full Setup**: `setup-report.json`

Reports include:
- Setup results and validation
- Created user credentials
- Database connection details
- Next steps and recommendations

## Support

If you encounter issues during setup:

1. Check the setup report files
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
