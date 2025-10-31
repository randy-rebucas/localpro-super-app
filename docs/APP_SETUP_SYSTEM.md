# LocalPro Super App Setup System

## Overview

The LocalPro Super App setup system is a comprehensive initialization solution that ensures all required data seeds are created for a fully functional application. This system addresses the complexity of setting up a multi-module super app with 19+ data models and intricate relationships.

## System Architecture

### Components

1. **Main Setup Script** (`setup-app.js`)
   - Comprehensive initialization script
   - Creates all required data seeds
   - Validates setup completion
   - Generates detailed reports

2. **Verification Script** (`verify-setup.js`)
   - Validates setup completion
   - Checks database integrity
   - Provides detailed status reports

3. **Configuration Scripts**
   - `setup-paymaya-config.js` - PayMaya payment integration setup
   - Environment configuration helpers

4. **Documentation**
   - `SETUP_GUIDE.md` - Comprehensive setup instructions
   - `docs/APP_SETUP_SYSTEM.md` - This technical documentation

## Data Models and Dependencies

### Core Models (Required for Basic Functionality)

1. **User** - Central user management
   - Roles: admin, agency_owner, provider, client, supplier, instructor
   - Features: verification, trust scores, referrals, wallet, settings

2. **AppSettings** - Global application configuration
   - Feature flags, security settings, payment configs
   - Business settings, notification preferences
   - Rate limiting, file upload settings

3. **UserSettings** - Individual user preferences
   - Privacy, notifications, communication preferences
   - Service, payment, security, app preferences

### Feature Models (Module-Specific)

4. **Agency** - Business entity management
   - Multi-provider coordination
   - Service areas, pricing, verification

5. **Marketplace** (Service, Booking)
   - Service listings and bookings
   - Pricing, availability, reviews

6. **Academy** (Course, Enrollment, Certification)
   - Learning platform with certifications
   - Curriculum, assessments, progress tracking

7. **Job** - Employment platform
   - Job postings, applications, interviews
   - Company profiles, analytics

8. **Supplies** (Product, SubscriptionKit, Order)
   - E-commerce functionality
   - Inventory, subscriptions, orders

9. **Rentals** (RentalItem, Rental)
   - Equipment rental platform
   - Availability, pricing, maintenance

10. **Finance** (Loan, SalaryAdvance, Transaction)
    - Financial services
    - Loans, salary advances, transactions

11. **Referral** - Referral system
    - Rewards, tracking, analytics

12. **TrustVerification** - Trust and verification
    - Background checks, document verification

13. **Communication** - Messaging system
    - Real-time communication between users

14. **Analytics** - Data analytics
    - User behavior, performance metrics

15. **Ads** - Advertising system
    - Platform advertising for businesses

16. **FacilityCare** - Facility management
    - Janitorial, landscaping, pest control

17. **LocalProPlus** - Premium features
    - Subscription management, premium services

## Setup Process Flow

### Phase 1: Database Connection
```javascript
// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
await mongoose.connect(mongoUri);
```

### Phase 2: App Settings Creation
```javascript
// Create default app settings with all configurations
const defaultSettings = new AppSettings({
  general: { appName: 'LocalPro Super App', ... },
  business: { companyName: 'LocalPro Super App', ... },
  features: { marketplace: { enabled: true }, ... },
  security: { passwordPolicy: { minLength: 8 }, ... },
  // ... complete configuration
});
```

### Phase 3: Admin User Creation
```javascript
// Create super admin
const superAdmin = new User({
  phoneNumber: '+639171234567',
  email: 'admin@localpro.com',
  role: 'admin',
  isVerified: true,
  // ... complete profile
});

// Create agency owner
const agencyOwner = new User({
  phoneNumber: '+639171234568',
  email: 'agency@localpro.com',
  role: 'agency_owner',
  // ... complete profile
});
```

### Phase 4: Agency Creation
```javascript
// Create sample agency
const agency = new Agency({
  name: 'CleanPro Services',
  owner: agencyOwner._id,
  contact: { email: 'info@cleanpro.com', ... },
  services: [{ category: 'cleaning', ... }],
  // ... complete agency setup
});
```

### Phase 5: Seed Data Creation
```javascript
// Create sample data for all modules
const services = [
  { title: 'Residential Deep Cleaning', ... },
  { title: 'Office Cleaning Service', ... }
];

const courses = [
  { title: 'Professional Cleaning Techniques', ... }
];

const jobs = [
  { title: 'Cleaning Service Manager', ... }
];

// ... create products, rental items, certifications
```

### Phase 6: Validation
```javascript
// Validate all created data
const validation = await validateSetup();
// Check database connection, app settings, admin users, seed data
```

### Phase 7: Report Generation
```javascript
// Generate comprehensive setup report
const report = {
  timestamp: new Date().toISOString(),
  setupResults: this.setupResults,
  createdData: this.createdData,
  adminCredentials: { ... },
  nextSteps: [ ... ]
};
```

## Sample Data Created

### Users (2)
- **Super Admin**: `admin@localpro.com` / `+639171234567`
- **Agency Owner**: `agency@localpro.com` / `+639171234568`

### Agencies (1)
- **CleanPro Services**: Professional cleaning services agency

### Services (2)
- **Residential Deep Cleaning**: Comprehensive home cleaning service
- **Office Cleaning Service**: Regular office maintenance

### Courses (1)
- **Professional Cleaning Techniques**: 40-hour certification course

### Jobs (1)
- **Cleaning Service Manager**: Full-time management position

### Products (2)
- **Professional All-Purpose Cleaner**: 1L professional cleaner
- **Microfiber Cleaning Cloths**: Pack of 12 reusable cloths

### Rental Items (1)
- **Professional Vacuum Cleaner**: Commercial-grade vacuum

### Certifications (1)
- **Professional Cleaning Certificate**: TES-issued certification

## Configuration Management

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# External Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
PAYPAL_CLIENT_ID=your-paypal-client-id
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
```

### App Settings Structure
```javascript
{
  general: { appName, appVersion, environment, maintenanceMode },
  business: { companyName, contact, businessHours, supportChannels },
  features: { marketplace, academy, jobBoard, referrals, payments },
  security: { passwordPolicy, sessionSettings, dataProtection },
  rateLimiting: { api, auth, upload },
  uploads: { maxFileSize, allowedTypes, compression },
  notifications: { email, sms, push },
  payments: { defaultCurrency, supportedCurrencies, fees },
  analytics: { googleAnalytics, mixpanel, customAnalytics },
  integrations: { googleMaps, cloudinary, socialLogin }
}
```

## Error Handling and Recovery

### Common Issues and Solutions

1. **Database Connection Failed**
   ```bash
   # Ensure MongoDB is running
   mongod
   ```

2. **Environment Variables Missing**
   ```bash
   # Copy and configure environment file
   cp env.example .env
   # Edit .env with required values
   ```

3. **Permission Errors**
   ```bash
   # Check file permissions
   chmod +x setup-app.js
   # Run with appropriate privileges
   sudo npm run setup
   ```

### Reset and Recovery
```bash
# Drop database and start fresh
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

## Verification and Testing

### Setup Verification
```bash
# Verify setup completion
npm run verify
```

### Manual Testing
```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+639171234567", "password": "your-password"}'
```

## Production Considerations

### Security
- Use strong JWT secrets
- Enable HTTPS in production
- Configure proper CORS settings
- Set up rate limiting
- Enable audit logging

### Performance
- Configure MongoDB indexes
- Set up connection pooling
- Enable caching where appropriate
- Monitor database performance

### Monitoring
- Set up error monitoring (Sentry)
- Configure logging aggregation
- Set up health checks
- Monitor external service dependencies

## Maintenance and Updates

### Regular Maintenance
- Monitor database growth
- Clean up old logs
- Update dependencies
- Review security settings

### Data Migration
- Version control for schema changes
- Backup before major updates
- Test migrations in staging
- Rollback procedures

## API Integration

### Postman Collection
The setup includes a comprehensive Postman collection:
- All API endpoints documented
- Sample requests and responses
- Authentication examples
- Environment variables

### SDK Generation
Consider generating SDKs for:
- JavaScript/Node.js
- Python
- PHP
- Mobile platforms

## Conclusion

The LocalPro Super App setup system provides a robust, comprehensive solution for initializing a complex multi-module application. It ensures all required data seeds are created, validates the setup, and provides detailed reporting for troubleshooting and maintenance.

The system is designed to be:
- **Comprehensive**: Covers all 19+ data models
- **Reliable**: Includes validation and error handling
- **Maintainable**: Well-documented and modular
- **Extensible**: Easy to add new modules and features
- **Production-ready**: Includes security and performance considerations

This setup system eliminates the complexity of manually creating all required data and ensures a consistent, working environment for development, testing, and production deployment.
