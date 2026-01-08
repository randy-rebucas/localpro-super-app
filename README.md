# LocalPro Super App - Backend API

A comprehensive Node.js backend API for the LocalPro Super App ecosystem, providing a centralized platform for local service providers, clients, and businesses.

## ⚡ Quick Setup

Get started with LocalPro Super App in minutes:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp env.example .env
# Edit .env with your settings

# 3. Run comprehensive setup
npm run setup

# 4. Start the application
npm run dev
```

The setup script will:
- ✅ Connect to MongoDB
- ✅ Create default app settings
- ✅ Create admin users
- ✅ Seed all modules with sample data
- ✅ Seed service categories and provider skills
- ✅ Create database indexes (including specialties.category index)
- ✅ Validate the setup

**Additional Setup Scripts:**
- `node scripts/seed-service-categories-and-skills.js` - Seed service categories and provider skills
- `node scripts/create-database-indexes.js` - Create all recommended database indexes
- `node scripts/seed-provider-professional-info-example.js` - Example script for creating provider specialties with category and reference fields

**Admin Credentials:**
- Super Admin: `admin@localpro.com`
- Agency Owner: `agency@localpro.com`

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 🚀 Deploying on Render

### Render service settings (recommended)
- **Service type**: Web Service
- **Runtime**: Node
- **Build command**: `npm ci`
- **Start command**: `npm run start`
- **Health check path**: `/health`
- **Environment variables**: copy from `env.production` (and replace placeholders with real secrets)

### GitHub Actions → Render auto-deploy (via Deploy Hook)

This repo’s CI workflow (`.github/workflows/ci-cd.yml`) can trigger Render deployments after tests pass on `main`.

1. In Render, open your service → **Settings** → **Deploy Hook** → create a hook and copy the URL.
2. In GitHub repo settings → **Secrets and variables** → **Actions** → add secret:
   - **Name**: `RENDER_DEPLOY_HOOK_URL`
   - **Value**: (the deploy hook URL from Render)

After that, every push to `main` will:
- run lint + tests in CI
- **trigger Render deploy** only if CI passes

## 🚀 Features

### Core Modules
- **🔐 Mobile Authentication**: Enhanced SMS-based authentication with Twilio integration, device tracking, and smart redirection
- **🏪 Marketplace**: Service marketplace (cleaning, plumbing, electrical, moving)
- **💼 Job Board**: Employment platform for job postings and applications
- **🤝 Referral System**: Comprehensive referral and rewards platform
- **🏢 Agency Management**: Multi-provider agency coordination and management
- **📦 Supplies & Materials**: Product catalog with subscription kits
- **🎓 Academy**: Training courses and certification programs
- **💰 Finance**: Salary advances and micro-loans
- **🔧 Rentals**: Tool and vehicle rental platform
- **📢 Advertising**: Platform for hardware stores and suppliers
- **🏢 FacilityCare**: Janitorial, landscaping, and pest control services
- **⭐ LocalPro Plus**: Premium subscription system with PayPal and PayMaya integration
- **💳 PayPal Integration**: Complete payment processing for all features
- **💳 PayMaya Integration**: Alternative payment processing for Philippines market
- **🗺️ Google Maps**: Location services and mapping integration
- **📧 Email Service**: Multi-provider email notifications
- **⚙️ Settings Management**: Comprehensive user and app settings system
- **📊 Logging & Error Monitoring**: Comprehensive logging system with Winston and error tracking
- **🔍 Audit Logging**: Complete audit trail for compliance and security monitoring
- **💾 Database Logging**: All logs stored in MongoDB with advanced querying and analytics
- **👨‍💼 Provider System**: Comprehensive provider upgrade system with verification and onboarding
- **👥 User Management System**: Complete user management with role-based access control, status management, and analytics
- **🔍 Global Search System**: Comprehensive search functionality across all entities with advanced filtering, sorting, and pagination
- **🔔 Notification System**: Complete user notification management with real-time updates, filtering, and multi-channel delivery

### Key Features
- RESTful API with comprehensive endpoints
- Enhanced JWT-based mobile authentication with rich payload
- Role-based access control
- Real-time SMS verification
- Smart redirection based on user onboarding status
- Device tracking and session management
- Advanced search and filtering
- Complete PayPal payment processing (one-time & recurring)
- Full subscription management with automatic billing
- Analytics and reporting
- File upload support
- Security middleware
- **Location-based services with Google Maps**
- **Email notifications (Resend, SendGrid, SMTP)**
- **Service area validation**
- **Distance calculations and travel time**
- **Places search and autocomplete**
- **Job board with application tracking**
- **Company profiles and job analytics**
- **Referral system with rewards and tier system**
- **Automated referral processing across all modules**
- **Agency management with provider coordination**
- **Multi-level admin permissions and role management**
- **User settings and preferences management**
- **App-wide configuration and feature flags**
- **Global search across all entities with smart filtering**
- **Comprehensive notification system with multi-channel delivery**

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Twilio SMS
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Logging**: Winston with daily rotation, Morgan for HTTP requests, MongoDB storage
- **Error Monitoring**: Custom error tracking with alerting and resolution management
- **Audit Logging**: Comprehensive audit trail with compliance features and data protection
- **Database Logging**: All application logs stored in MongoDB with advanced analytics
- **Provider System**: Client-to-provider upgrade system with verification, onboarding, and analytics
- **Email Service**: Resend, SendGrid, SMTP (Nodemailer)
- **Payment Processing**: PayPal Server SDK + REST API, PayMaya API
- **Maps & Location**: Google Maps APIs
- **File Storage**: Cloudinary

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Twilio account for SMS verification
- PayPal Developer account for payment processing
- PayMaya Business account for Philippines payment processing
- Google Maps API key (optional)
- Email service account (Resend, SendGrid, or SMTP)
- Git

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd localpro-super-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp env.example .env
```

Update the `.env` file with your configuration. **For development, you only need to set the JWT_SECRET and MONGODB_URI**:

```env
# Server Configuration
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT (Required)
JWT_SECRET=your-super-secret-jwt-key-here

# Twilio Configuration (Optional for development - app will use mock SMS)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_VERIFY_SERVICE_SID=your-twilio-verify-service-sid
# TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email Service Configuration (Optional)
# Option 1: Resend (Recommended - Modern API)
# RESEND_API_KEY=re_xxxxxxxxx
# FROM_EMAIL=noreply@yourdomain.com

# Option 2: SendGrid (API-based)
# SENDGRID_API_KEY=your-sendgrid-api-key

# Option 3: SMTP (SMTP-based)
# SMTP_HOST=smtp.hostinger.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@yourdomain.com
# SMTP_PASS=your-email-password

# Email Settings
EMAIL_SERVICE=resend

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_HTTP_REQUESTS=true
LOG_SLOW_REQUESTS_THRESHOLD=2000

# Error Monitoring
ERROR_MONITORING_ENABLED=true
ERROR_ALERT_THRESHOLDS_CRITICAL=1
ERROR_ALERT_THRESHOLDS_HIGH=5
ERROR_ALERT_THRESHOLDS_MEDIUM=10
ERROR_ALERT_THRESHOLDS_LOW=20

# Audit Logging Configuration
AUDIT_LOGGING_ENABLED=true
AUDIT_RETENTION_DAYS=2555
AUDIT_LOG_SENSITIVE_DATA=false
AUDIT_LOG_REQUEST_BODY=false
AUDIT_LOG_RESPONSE_BODY=false
AUDIT_AUTO_CLEANUP=true
AUDIT_CLEANUP_SCHEDULE=0 2 * * *

# Google Maps Configuration (Optional)
# GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# GOOGLE_MAPS_GEOCODING_API_KEY=your-google-maps-geocoding-api-key
# GOOGLE_MAPS_PLACES_API_KEY=your-google-maps-places-api-key
# GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your-google-maps-distance-matrix-api-key

# PayPal Configuration (Required for payment features)
# PAYPAL_CLIENT_ID=your-paypal-client-id
# PAYPAL_CLIENT_SECRET=your-paypal-client-secret
# PAYPAL_MODE=sandbox
# PAYPAL_WEBHOOK_ID=your-paypal-webhook-id

# PayMaya Configuration (Required for Philippines payment features)
# PAYMAYA_PUBLIC_KEY=your-paymaya-public-key
# PAYMAYA_SECRET_KEY=your-paymaya-secret-key
# PAYMAYA_MODE=sandbox
# PAYMAYA_WEBHOOK_SECRET=your-paymaya-webhook-secret
```

**Note**: The app includes development mode support for Twilio. If Twilio credentials are not provided, the app will:
- Generate mock verification codes (displayed in console)
- Accept any 6-digit code for verification
- Log SMS messages instead of sending them

### 4. Start the development server
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### 5. Quick Development Setup

If you want to get started quickly without setting up external services:

1. **Create a minimal `.env` file**:
```bash
echo "JWT_SECRET=localpro-dev-secret-key-12345" > .env
echo "MONGODB_URI=mongodb://localhost:27017/localpro-super-app" >> .env
echo "NODE_ENV=development" >> .env
echo "PORT=4000" >> .env
```

2. **Start MongoDB** (if not already running):
```bash
# On Windows (if MongoDB is installed as a service)
net start MongoDB

# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

3. **Test the API**:
```bash
# Health check
curl http://localhost:4000/health

# Send verification code (will use mock SMS)
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify code (use any 6-digit code like "123456")
curl -X POST http://localhost:4000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456", "firstName": "John", "lastName": "Doe"}'

# Test Google Maps geocoding (requires API key)
curl -X POST http://localhost:4000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "New York, NY"}'
```

## 📚 Documentation

### Complete Documentation Suite

- **[Automations Documentation](AUTOMATIONS_DOCUMENTATION.md)** - Comprehensive guide to all 33 automated background services
- **[Automations Quick Reference](AUTOMATIONS_QUICK_REFERENCE.md)** - Quick reference card for automation configuration
- **[Client Mobile App Documentation](CLIENT_MOBILE_APP_DOCUMENTATION.md)** - Full API documentation for client apps
- **[Provider Mobile App Documentation](PROVIDER_MOBILE_APP_DOCUMENTATION.md)** - Full API documentation for provider apps
- **[Admin Dashboard Documentation](ADMIN_DASHBOARD_DOCUMENTATION.md)** - Full API documentation for admin panel
- **[Partner Portal Documentation](PARTNER_PORTAL_DOCUMENTATION.md)** - Full API documentation for business partners
- **[Documentation Summary](DOCUMENTATION_SUMMARY.md)** - Overview of all documentation files
- **[Quick Start Guide](QUICK_START_GUIDE.md)** - Getting started guide

### API Endpoints Overview

### Authentication Endpoints
```
POST /api/auth/send-code              # Send verification code
POST /api/auth/verify-code            # Verify code and login/register
POST /api/auth/complete-onboarding    # Complete user onboarding
GET  /api/auth/profile-completeness   # Check profile completeness status
GET  /api/auth/me                     # Get current user
PUT  /api/auth/profile                # Update user profile
POST /api/auth/upload-avatar          # Upload profile avatar
POST /api/auth/upload-portfolio       # Upload portfolio images
POST /api/auth/logout                 # Logout user
```

### Marketplace Endpoints
```
GET    /api/marketplace/services           # Get all services
GET    /api/marketplace/services/nearby    # Get nearby services with distance
GET    /api/marketplace/services/:id       # Get single service
POST   /api/marketplace/services           # Create service (Provider)
PUT    /api/marketplace/services/:id       # Update service (Provider)
DELETE /api/marketplace/services/:id       # Delete service (Provider)
POST   /api/marketplace/bookings           # Create booking
GET    /api/marketplace/bookings           # Get user bookings
PUT    /api/marketplace/bookings/:id/status # Update booking status
POST   /api/marketplace/bookings/:id/review # Add review
```

### Job Board Endpoints
```
GET    /api/jobs                           # Get all jobs
GET    /api/jobs/search                    # Search jobs with filters
GET    /api/jobs/:id                       # Get single job
POST   /api/jobs                           # Create job posting (Employer)
PUT    /api/jobs/:id                       # Update job posting (Employer)
DELETE /api/jobs/:id                       # Delete job posting (Employer)
POST   /api/jobs/:id/apply                 # Apply for job
GET    /api/jobs/my-applications           # Get user applications
GET    /api/jobs/my-jobs                   # Get employer's jobs
GET    /api/jobs/:id/applications          # Get job applications (Employer)
PUT    /api/jobs/:id/applications/:applicationId/status # Update application status
POST   /api/jobs/:id/logo                  # Upload company logo
GET    /api/jobs/:id/stats                 # Get job statistics
```

### Referral System Endpoints
```
GET    /api/referrals/me                   # Get user referral information
GET    /api/referrals/stats                # Get referral statistics
GET    /api/referrals/links                # Get referral links and sharing options
GET    /api/referrals/rewards              # Get referral rewards history
POST   /api/referrals/invite               # Send referral invitations
PUT    /api/referrals/preferences          # Update referral preferences
POST   /api/referrals/validate             # Validate referral code
POST   /api/referrals/track                # Track referral click
GET    /api/referrals/leaderboard          # Get referral leaderboard
POST   /api/referrals/process              # Process referral completion (Admin)
GET    /api/referrals/analytics            # Get referral analytics (Admin)
```

### Agency Management Endpoints
```
GET    /api/agencies                       # Get all agencies
GET    /api/agencies/:id                   # Get agency by ID
POST   /api/agencies                       # Create new agency
PUT    /api/agencies/:id                   # Update agency
DELETE /api/agencies/:id                   # Delete agency
POST   /api/agencies/:id/logo              # Upload agency logo
POST   /api/agencies/:id/providers         # Add provider to agency
DELETE /api/agencies/:id/providers/:providerId # Remove provider from agency
PUT    /api/agencies/:id/providers/:providerId/status # Update provider status
POST   /api/agencies/:id/admins            # Add admin to agency
DELETE /api/agencies/:id/admins/:adminId   # Remove admin from agency
GET    /api/agencies/:id/analytics         # Get agency analytics
GET    /api/agencies/my/agencies           # Get my agencies
POST   /api/agencies/join                  # Join agency
POST   /api/agencies/leave                 # Leave agency
```

### Supplies & Materials Endpoints
```
GET    /api/supplies                       # Get all supply items
GET    /api/supplies/:id                   # Get single supply item
POST   /api/supplies                       # Create supply item (Supplier)
PUT    /api/supplies/:id                   # Update supply item (Supplier)
DELETE /api/supplies/:id                   # Delete supply item (Supplier)
POST   /api/supplies/:id/images            # Upload supply images
DELETE /api/supplies/:id/images/:imageId   # Delete supply image
POST   /api/supplies/:id/order             # Order supply item
PUT    /api/supplies/:id/orders/:orderId/status # Update order status
POST   /api/supplies/:id/reviews           # Add supply review
GET    /api/supplies/my-supplies           # Get my supply items
GET    /api/supplies/my-orders             # Get my supply orders
GET    /api/supplies/nearby                # Get nearby supply items
GET    /api/supplies/categories            # Get supply categories
GET    /api/supplies/featured              # Get featured supply items
GET    /api/supplies/statistics            # Get supply statistics (Admin)
```

### Academy Endpoints
```
GET    /api/academy/courses                # Get all courses
GET    /api/academy/courses/:id            # Get single course
POST   /api/academy/courses                # Create course (Instructor)
PUT    /api/academy/courses/:id            # Update course (Instructor)
DELETE /api/academy/courses/:id            # Delete course (Instructor)
POST   /api/academy/courses/:id/thumbnail  # Upload course thumbnail
POST   /api/academy/courses/:id/videos     # Upload course video
DELETE /api/academy/courses/:id/videos/:videoId # Delete course video
POST   /api/academy/courses/:id/enroll     # Enroll in course
PUT    /api/academy/courses/:id/progress   # Update course progress
POST   /api/academy/courses/:id/reviews    # Add course review
GET    /api/academy/my-courses             # Get my enrolled courses
GET    /api/academy/my-created-courses     # Get my created courses
GET    /api/academy/categories             # Get course categories
GET    /api/academy/featured               # Get featured courses
GET    /api/academy/statistics             # Get course statistics (Admin)
```

### Finance Endpoints
```
GET    /api/finance/overview               # Get financial overview
GET    /api/finance/transactions           # Get user transactions
GET    /api/finance/earnings               # Get user earnings
GET    /api/finance/expenses               # Get user expenses
POST   /api/finance/expenses               # Add expense
POST   /api/finance/withdraw               # Request withdrawal
PUT    /api/finance/withdrawals/:withdrawalId/process # Process withdrawal (Admin)
GET    /api/finance/tax-documents          # Get tax documents
GET    /api/finance/reports                # Get financial reports
PUT    /api/finance/wallet/settings        # Update wallet settings
```

### Rentals Endpoints
```
GET    /api/rentals                        # Get all rental items
GET    /api/rentals/:id                    # Get single rental item
POST   /api/rentals                        # Create rental item (Owner)
PUT    /api/rentals/:id                    # Update rental item (Owner)
DELETE /api/rentals/:id                    # Delete rental item (Owner)
POST   /api/rentals/:id/images             # Upload rental images
DELETE /api/rentals/:id/images/:imageId    # Delete rental image
POST   /api/rentals/:id/book               # Book rental item
PUT    /api/rentals/:id/bookings/:bookingId/status # Update booking status
POST   /api/rentals/:id/reviews            # Add rental review
GET    /api/rentals/my-rentals             # Get my rental items
GET    /api/rentals/my-bookings            # Get my rental bookings
GET    /api/rentals/nearby                 # Get nearby rental items
GET    /api/rentals/categories             # Get rental categories
GET    /api/rentals/featured               # Get featured rental items
GET    /api/rentals/statistics             # Get rental statistics (Admin)
```

### Advertising Endpoints
```
GET    /api/ads                            # Get all ads
GET    /api/ads/:id                        # Get single ad
POST   /api/ads                            # Create ad (Advertiser)
PUT    /api/ads/:id                        # Update ad (Advertiser)
DELETE /api/ads/:id                        # Delete ad (Advertiser)
POST   /api/ads/:id/images                 # Upload ad images
DELETE /api/ads/:id/images/:imageId        # Delete ad image
GET    /api/ads/my-ads                     # Get my ads
GET    /api/ads/:id/analytics              # Get ad analytics
POST   /api/ads/:id/click                  # Track ad click
GET    /api/ads/categories                 # Get ad categories
GET    /api/ads/featured                   # Get featured ads
POST   /api/ads/:id/promote                # Promote ad
GET    /api/ads/statistics                 # Get ad statistics (Admin)
```

### FacilityCare Endpoints
```
GET    /api/facility-care                  # Get all facility care services
GET    /api/facility-care/:id              # Get single facility care service
POST   /api/facility-care                  # Create facility care service (Provider)
PUT    /api/facility-care/:id              # Update facility care service (Provider)
DELETE /api/facility-care/:id              # Delete facility care service (Provider)
POST   /api/facility-care/:id/images       # Upload facility care images
DELETE /api/facility-care/:id/images/:imageId # Delete facility care image
POST   /api/facility-care/:id/book         # Book facility care service
PUT    /api/facility-care/:id/bookings/:bookingId/status # Update booking status
POST   /api/facility-care/:id/reviews      # Add facility care review
GET    /api/facility-care/my-services      # Get my facility care services
GET    /api/facility-care/my-bookings      # Get my facility care bookings
GET    /api/facility-care/nearby           # Get nearby facility care services
```

### LocalPro Plus Endpoints
```
GET    /api/localpro-plus/plans            # Get subscription plans
GET    /api/localpro-plus/plans/:id        # Get single plan
POST   /api/localpro-plus/plans            # Create plan (Admin)
PUT    /api/localpro-plus/plans/:id        # Update plan (Admin)
DELETE /api/localpro-plus/plans/:id        # Delete plan (Admin)
POST   /api/localpro-plus/subscribe        # Subscribe to plan
POST   /api/localpro-plus/confirm-payment  # Confirm subscription payment
POST   /api/localpro-plus/cancel           # Cancel subscription
GET    /api/localpro-plus/my-subscription  # Get my subscription
PUT    /api/localpro-plus/subscription/settings # Update subscription settings
GET    /api/localpro-plus/usage            # Get subscription usage
POST   /api/localpro-plus/renew            # Renew subscription
GET    /api/localpro-plus/analytics        # Get subscription analytics (Admin)
```

### Trust & Verification Endpoints
```
GET    /api/trust-verification             # Get all verification requests (Admin)
GET    /api/trust-verification/:id         # Get single verification request
POST   /api/trust-verification             # Create verification request
PUT    /api/trust-verification/:id         # Update verification request
DELETE /api/trust-verification/:id         # Delete verification request
PUT    /api/trust-verification/:id/review  # Review verification request (Admin)
POST   /api/trust-verification/:id/documents # Upload verification documents
DELETE /api/trust-verification/:id/documents/:documentId # Delete verification document
GET    /api/trust-verification/my-requests # Get my verification requests
GET    /api/trust-verification/statistics  # Get verification statistics (Admin)
GET    /api/trust-verification/verified-users # Get verified users
```

### Communication Endpoints
```
GET    /api/communication/conversations    # Get user conversations
GET    /api/communication/conversations/:id # Get single conversation
POST   /api/communication/conversations    # Create conversation
DELETE /api/communication/conversations/:id # Delete conversation
POST   /api/communication/conversations/:id/messages # Send message
PUT    /api/communication/conversations/:id/read # Mark messages as read
PUT    /api/communication/conversations/:id/messages/:messageId # Update message
DELETE /api/communication/conversations/:id/messages/:messageId # Delete message
GET    /api/communication/unread-count     # Get unread message count
GET    /api/communication/search           # Search conversations
GET    /api/communication/conversation-with/:userId # Get conversation with user
```

### Notification Endpoints
```
GET    /api/communication/notifications    # Get user notifications with filtering
GET    /api/communication/notifications/count # Get notification count
PUT    /api/communication/notifications/:notificationId/read # Mark notification as read
PUT    /api/communication/notifications/read-all # Mark all notifications as read
DELETE /api/communication/notifications/:notificationId # Delete notification
POST   /api/communication/notifications/email # Send email notification
POST   /api/communication/notifications/sms # Send SMS notification
```

### Analytics Endpoints
```
GET    /api/analytics/overview             # Get analytics overview
GET    /api/analytics/users                # Get user analytics
GET    /api/analytics/marketplace          # Get marketplace analytics
GET    /api/analytics/jobs                 # Get job analytics
GET    /api/analytics/referrals            # Get referral analytics
GET    /api/analytics/agencies             # Get agency analytics
POST   /api/analytics/track                # Track analytics event
GET    /api/analytics/custom               # Get custom analytics
```

### PayPal Payment Endpoints
```
POST /api/paypal/webhook                   # PayPal webhook handler
GET  /api/paypal/webhook/events            # Get webhook events (Admin)
POST /api/marketplace/bookings/paypal/approve # Approve PayPal booking payment
GET  /api/marketplace/bookings/paypal/order/:orderId # Get PayPal order details
POST /api/supplies/orders/paypal/approve   # Approve PayPal supplies order
GET  /api/supplies/orders/paypal/order/:orderId # Get PayPal order details
POST /api/finance/loans/:id/repay/paypal   # Repay loan with PayPal
POST /api/finance/loans/repay/paypal/approve # Approve PayPal loan repayment
POST /api/finance/salary-advances/:id/repay/paypal # Repay salary advance with PayPal
POST /api/finance/salary-advances/repay/paypal/approve # Approve PayPal salary advance repayment
```

### PayMaya Payment Endpoints
```
POST /api/paymaya/checkout                 # Create PayMaya checkout session
GET  /api/paymaya/checkout/:checkoutId     # Get checkout details
POST /api/paymaya/payment                  # Create PayMaya payment
GET  /api/paymaya/payment/:paymentId       # Get payment details
POST /api/paymaya/invoice                  # Create PayMaya invoice
GET  /api/paymaya/invoice/:invoiceId       # Get invoice details
POST /api/paymaya/webhook                  # PayMaya webhook handler
GET  /api/paymaya/webhook/events           # Get webhook events (Admin)
GET  /api/paymaya/config/validate          # Validate PayMaya configuration (Admin)
```

### Google Maps & Location Endpoints
```
POST /api/maps/geocode                     # Convert address to coordinates
POST /api/maps/reverse-geocode             # Convert coordinates to address
POST /api/maps/places/search               # Search for places
GET  /api/maps/places/:placeId             # Get place details
POST /api/maps/distance                    # Calculate distance between points
POST /api/maps/nearby                      # Find nearby places
POST /api/maps/validate-service-area       # Validate service area coverage
POST /api/maps/analyze-coverage            # Analyze service coverage (Protected)
GET  /api/maps/test                        # Test API connection (Admin)
```

### Settings Management Endpoints
```
GET    /api/settings/user                   # Get user settings
PUT    /api/settings/user                   # Update user settings
PUT    /api/settings/user/:category         # Update specific setting category
POST   /api/settings/user/reset             # Reset user settings to defaults
DELETE /api/settings/user                   # Delete user settings
GET    /api/settings/app                    # Get app settings (Admin)
PUT    /api/settings/app                    # Update app settings (Admin)
PUT    /api/settings/app/:category          # Update specific app setting category (Admin)
POST   /api/settings/app/features/toggle    # Toggle feature flag (Admin)
GET    /api/settings/app/public             # Get public app settings
GET    /api/settings/app/health             # Get app health status
```

### Error Monitoring Endpoints
```
GET    /api/error-monitoring/dashboard/summary # Get error monitoring dashboard (Admin)
GET    /api/error-monitoring/stats           # Get error statistics (Admin)
GET    /api/error-monitoring/unresolved      # Get unresolved errors (Admin)
GET    /api/error-monitoring/:errorId        # Get error details (Admin)
PATCH  /api/error-monitoring/:errorId/resolve # Resolve error (Admin)
```

### Audit Logging Endpoints
```
GET    /api/audit-logs                       # Get audit logs with filtering (Admin)
GET    /api/audit-logs/stats                 # Get audit statistics (Admin)
GET    /api/audit-logs/user/:userId/activity # Get user activity summary
GET    /api/audit-logs/:auditId              # Get audit log details (Admin)
GET    /api/audit-logs/export/data           # Export audit logs (Admin)
GET    /api/audit-logs/dashboard/summary     # Get audit dashboard (Admin)
POST   /api/audit-logs/cleanup               # Clean up expired logs (Admin)
GET    /api/audit-logs/metadata/categories   # Get audit metadata (Admin)
```

### Provider System Endpoints
```
GET    /api/providers                         # Get all providers (Public)
GET    /api/providers/:id                     # Get single provider (Public)
GET    /api/providers/profile/me              # Get my provider profile
POST   /api/providers/profile                 # Create provider profile (upgrade from client)
PUT    /api/providers/profile                 # Update provider profile
PUT    /api/providers/onboarding/step         # Update onboarding step
POST   /api/providers/documents/upload        # Upload provider documents
GET    /api/providers/dashboard/overview      # Get provider dashboard
GET    /api/providers/analytics/performance   # Get provider analytics
GET    /api/providers/admin/all               # Get all providers (Admin)
PUT    /api/providers/admin/:id/status        # Update provider status (Admin)
```

### Log Management Endpoints
```
GET    /api/logs/stats                        # Get log statistics (Admin)
GET    /api/logs                              # Get logs with filtering (Admin)
GET    /api/logs/:logId                       # Get log details (Admin)
GET    /api/logs/analytics/error-trends       # Get error trends (Admin)
GET    /api/logs/analytics/performance        # Get performance metrics (Admin)
GET    /api/logs/user/:userId/activity        # Get user activity logs
GET    /api/logs/export/data                  # Export logs (Admin)
GET    /api/logs/dashboard/summary            # Get log dashboard (Admin)
GET    /api/logs/search/global                # Search logs globally (Admin)
POST   /api/logs/cleanup                      # Clean up expired logs (Admin)
```

### User Management Endpoints
```
GET    /api/users                             # Get all users with filtering and pagination (Admin/Manager)
GET    /api/users/stats                       # Get user statistics and analytics (Admin/Manager)
GET    /api/users/:id                         # Get user by ID (Admin/Manager/Owner)
POST   /api/users                             # Create new user (Admin)
PUT    /api/users/:id                         # Update user information (Admin/Manager/Owner)
PATCH  /api/users/:id/status                  # Update user status (Admin/Manager)
PATCH  /api/users/:id/verification            # Update user verification status (Admin/Manager)
POST   /api/users/:id/badges                  # Add badge to user (Admin/Manager)
PATCH  /api/users/bulk                        # Bulk update users (Admin)
DELETE /api/users/:id                         # Delete user (Admin)
```

### Global Search Endpoints
```
GET    /api/search                            # Global search across all entities
GET    /api/search/suggestions                # Get search suggestions/autocomplete
GET    /api/search/popular                    # Get popular search terms
GET    /api/search/categories                 # Get all available search categories
GET    /api/search/locations                  # Get popular search locations
GET    /api/search/trending                   # Get trending search terms
GET    /api/search/advanced                   # Advanced search with more filters
GET    /api/search/entities/:type             # Search within specific entity type
POST   /api/search/analytics                  # Track search analytics (Admin)
```

## 📝 API Examples

### Mobile Authentication Flow
```bash
# 1. Send verification code
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Response:
# {
#   "success": true,
#   "message": "Verification code sent successfully",
#   "isNewUser": false,
#   "expiresIn": 300
# }

# 2. Verify code and login/register
curl -X POST http://localhost:4000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'

# Response for existing user with complete profile:
# {
#   "success": true,
#   "message": "Login successful",
#   "token": "jwt_token_here",
#   "user": { /* user object */ },
#   "redirect": {
#     "destination": "dashboard",
#     "reason": "User has complete profile information"
#   }
# }

# Response for new user or incomplete profile:
# {
#   "success": true,
#   "message": "Registration successful. Please complete your profile.",
#   "token": "jwt_token_here",
#   "user": { /* user object */ },
#   "redirect": {
#     "destination": "onboarding",
#     "reason": "New user needs to provide personal information"
#   }
# }

# 3. Complete onboarding (if redirected to onboarding)
curl -X POST http://localhost:4000/api/auth/complete-onboarding \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'

# Response:
# {
#   "success": true,
#   "message": "Onboarding completed successfully",
#   "token": "updated_jwt_token",
#   "user": { /* updated user object */ },
#   "redirect": {
#     "destination": "dashboard",
#     "reason": "User onboarding completed successfully"
#   }
# }

# 4. Check profile completeness status (requires token)
curl -X GET http://localhost:4000/api/auth/profile-completeness \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
# {
#   "success": true,
#   "data": {
#     "completeness": {
#       "basic": {
#         "completed": true,
#         "missing": [],
#         "percentage": 100
#       },
#       "profile": {
#         "completed": false,
#         "missing": ["profile.bio", "profile.address.city"],
#         "percentage": 33
#       },
#       "verification": {
#         "completed": false,
#         "missing": ["verification.emailVerified"],
#         "percentage": 50
#       },
#       "overall": {
#         "completed": false,
#         "percentage": 67,
#         "missingFields": ["profile.bio", "profile.address.city", "verification.emailVerified"],
#         "nextSteps": [
#           {
#             "priority": "medium",
#             "action": "complete_profile",
#             "title": "Complete Your Profile",
#             "description": "Add bio and location information",
#             "fields": ["profile.bio", "profile.address.city"]
#           }
#         ]
#       }
#     },
#     "canAccessDashboard": true,
#     "needsOnboarding": false,
#     "user": { /* user object */ }
#   }
# }

# 5. Get user profile (requires token)
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Profile Completeness Management
```bash
# Check profile completeness with detailed breakdown
curl -X GET http://localhost:4000/api/auth/profile-completeness \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update profile to improve completeness
curl -X PUT http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "bio": "Professional service provider with 5+ years experience",
      "address": {
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    }
  }'

# Upload profile avatar
curl -X POST http://localhost:4000/api/auth/upload-avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@profile-picture.jpg"

# Upload portfolio images
curl -X POST http://localhost:4000/api/auth/upload-portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@work-sample-1.jpg" \
  -F "images=@work-sample-2.jpg" \
  -F "title=Recent Cleaning Projects" \
  -F "description=High-quality residential cleaning services" \
  -F "category=cleaning"
```

### Marketplace Service Creation
```bash
# Create a service (requires provider token)
curl -X POST http://localhost:4000/api/marketplace/services \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "House Cleaning Service",
    "description": "Professional house cleaning service",
    "category": "cleaning",
    "pricing": {
      "basePrice": 50,
      "hourlyRate": 25
    },
    "serviceArea": {
      "city": "New York",
      "state": "NY",
      "radius": 10
    }
  }'
```

### Job Application
```bash
# Apply for a job
curl -X POST http://localhost:4000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coverLetter": "I am interested in this position...",
    "expectedSalary": 50000,
    "availability": "immediate"
  }'
```

### Referral System
```bash
# Get referral information
curl -X GET http://localhost:4000/api/referrals/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send referral invitation
curl -X POST http://localhost:4000/api/referrals/invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "friend@example.com",
    "message": "Join LocalPro and get rewards!"
  }'
```

### PayPal Payment
```bash
# Create PayPal order for booking
curl -X POST http://localhost:4000/api/marketplace/bookings/paypal/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "PAYPAL_ORDER_ID",
    "bookingId": "64a1b2c3d4e5f6789012345"
  }'
```

### Google Maps Integration
```bash
# Geocode an address
curl -X POST http://localhost:4000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, New York, NY"}'

# Find nearby services
curl -X GET "http://localhost:4000/api/marketplace/services/nearby?lat=40.7128&lng=-74.0060&radius=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Settings Management
```bash
# Get user settings
curl -X GET http://localhost:4000/api/settings/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update user privacy settings
curl -X PUT http://localhost:4000/api/settings/user/privacy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileVisibility": "contacts_only",
    "showPhoneNumber": false,
    "allowDirectMessages": true
  }'

# Update notification preferences
curl -X PUT http://localhost:4000/api/settings/user/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "push": {
      "enabled": true,
      "newMessages": true,
      "marketing": false
    },
    "email": {
      "enabled": true,
      "weeklyDigest": true
    }
  }'

# Get public app settings (no auth required)
curl -X GET http://localhost:4000/api/settings/app/public

# Get app health status
curl -X GET http://localhost:4000/api/settings/app/health

# Toggle feature flag (admin only)
curl -X POST http://localhost:4000/api/settings/app/features/toggle \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "marketplace",
    "enabled": false
  }'
```

### Error Monitoring
```bash
# Get error monitoring dashboard (admin only)
curl -X GET http://localhost:4000/api/error-monitoring/dashboard/summary \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get error statistics for last 24 hours
curl -X GET "http://localhost:4000/api/error-monitoring/stats?timeframe=24h" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get unresolved errors
curl -X GET "http://localhost:4000/api/error-monitoring/unresolved?limit=50" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Resolve an error
curl -X PATCH http://localhost:4000/api/error-monitoring/error123/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Fixed database connection issue"
  }'
```

### Audit Logging
```bash
# Get audit logs with filtering (admin only)
curl -X GET "http://localhost:4000/api/audit-logs?category=financial&severity=high&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get audit statistics for last 30 days
curl -X GET "http://localhost:4000/api/audit-logs/stats?timeframe=30d" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get user activity summary
curl -X GET "http://localhost:4000/api/audit-logs/user/123/activity?timeframe=7d" \
  -H "Authorization: Bearer JWT_TOKEN"

# Export audit logs as CSV
curl -X GET "http://localhost:4000/api/audit-logs/export/data?format=csv&startDate=2024-01-01" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get audit dashboard summary
curl -X GET "http://localhost:4000/api/audit-logs/dashboard/summary" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Clean up expired audit logs
curl -X POST http://localhost:4000/api/audit-logs/cleanup \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Provider System
```bash
# Get all providers (public)
curl -X GET "http://localhost:4000/api/providers?category=cleaning&city=New York&state=NY"

# Get single provider (public)
curl -X GET http://localhost:4000/api/providers/64a1b2c3d4e5f6789012345

# Create provider profile (upgrade from client)
curl -X POST http://localhost:4000/api/providers/profile \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerType": "individual",
    "professionalInfo": {
      "specialties": [{
        "category": "cleaning",
        "subcategories": ["house_cleaning", "office_cleaning"],
        "experience": 5,
        "hourlyRate": 25,
        "serviceAreas": [{
          "city": "New York",
          "state": "NY",
          "radius": 10
        }]
      }],
      "languages": ["English", "Spanish"],
      "availability": {
        "monday": {"start": "09:00", "end": "17:00", "available": true},
        "tuesday": {"start": "09:00", "end": "17:00", "available": true}
      }
    }
  }'

# Update provider profile
curl -X PUT http://localhost:4000/api/providers/profile \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalInfo": {
      "specialties": [{
        "category": "cleaning",
        "hourlyRate": 30
      }]
    }
  }'

# Update onboarding step
curl -X PUT http://localhost:4000/api/providers/onboarding/step \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "step": "professional_info",
    "data": {
      "specialties": [{
        "category": "cleaning",
        "experience": 5
      }]
    }
  }'

# Upload provider documents
curl -X POST http://localhost:4000/api/providers/documents/upload \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "documents=@insurance.pdf" \
  -F "documentType=insurance" \
  -F "category=general_liability"

# Get provider dashboard
curl -X GET http://localhost:4000/api/providers/dashboard/overview \
  -H "Authorization: Bearer JWT_TOKEN"

# Get provider analytics
curl -X GET "http://localhost:4000/api/providers/analytics/performance?timeframe=30d" \
  -H "Authorization: Bearer JWT_TOKEN"

# Update provider status (admin only)
curl -X PUT http://localhost:4000/api/providers/admin/64a1b2c3d4e5f6789012345/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "notes": "Profile approved after verification"
  }'
```

### Log Management
```bash
# Get log statistics
curl -X GET "http://localhost:4000/api/logs/stats?timeframe=24h" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get logs with filtering
curl -X GET "http://localhost:4000/api/logs?level=error&category=application&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get log details
curl -X GET http://localhost:4000/api/logs/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get error trends
curl -X GET "http://localhost:4000/api/logs/analytics/error-trends?timeframe=7d" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get performance metrics
curl -X GET "http://localhost:4000/api/logs/analytics/performance?timeframe=24h" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get user activity logs
curl -X GET "http://localhost:4000/api/logs/user/64a1b2c3d4e5f6789012345/activity?timeframe=7d" \
  -H "Authorization: Bearer JWT_TOKEN"

# Export logs
curl -X GET "http://localhost:4000/api/logs/export/data?format=csv&level=error&startDate=2024-01-01" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get log dashboard summary
curl -X GET http://localhost:4000/api/logs/dashboard/summary \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Search logs globally
curl -X GET "http://localhost:4000/api/logs/search/global?q=payment&timeframe=7d" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Clean up expired logs
curl -X POST http://localhost:4000/api/logs/cleanup \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### User Management
```bash
# Get all users with filtering and pagination (admin only)
curl -X GET "http://localhost:4000/api/users?page=1&limit=10&role=provider&isActive=true" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get user statistics (admin only)
curl -X GET http://localhost:4000/api/users/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get user by ID
curl -X GET http://localhost:4000/api/users/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer JWT_TOKEN"

# Create new user (admin only)
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client"
  }'

# Update user information
curl -X PUT http://localhost:4000/api/users/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated Name",
    "lastName": "Updated Last",
    "profile": {
      "bio": "Updated bio"
    }
  }'

# Update user status (admin only)
curl -X PATCH http://localhost:4000/api/users/64a1b2c3d4e5f6789012345/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "reason": "Violation of terms of service"
  }'

# Update user verification status (admin only)
curl -X PATCH http://localhost:4000/api/users/64a1b2c3d4e5f6789012345/verification \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verification": {
      "phoneVerified": true,
      "emailVerified": true,
      "identityVerified": true
    }
  }'

# Add badge to user (admin only)
curl -X POST http://localhost:4000/api/users/64a1b2c3d4e5f6789012345/badges \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "verified_provider",
    "description": "Completed identity verification"
  }'

# Bulk update users (admin only)
curl -X PATCH http://localhost:4000/api/users/bulk \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"],
    "updateData": {
      "tags": ["vip_customer"],
      "status": "active"
    }
  }'

# Delete user (admin only)
curl -X DELETE http://localhost:4000/api/users/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Global Search
```bash
# Basic global search
curl -X GET "http://localhost:4000/api/search?q=cleaning&limit=10"

# Filtered search with category and location
curl -X GET "http://localhost:4000/api/search?q=plumbing&category=plumbing&location=Manila&rating=4"

# Type-specific search (services only)
curl -X GET "http://localhost:4000/api/search?q=cleaning&type=services&limit=5"

# Advanced search with multiple filters
curl -X GET "http://localhost:4000/api/search/advanced?q=cleaning&minPrice=50&maxPrice=500&rating=4&verified=true"

# Entity-specific search (jobs only)
curl -X GET "http://localhost:4000/api/search/entities/jobs?q=developer&location=Manila&limit=5"

# Get search suggestions
curl -X GET "http://localhost:4000/api/search/suggestions?q=clean&limit=5"

# Get popular searches
curl -X GET "http://localhost:4000/api/search/popular?limit=10"

# Get available categories
curl -X GET "http://localhost:4000/api/search/categories"

# Get popular locations
curl -X GET "http://localhost:4000/api/search/locations?q=Manila&limit=5"

# Get trending searches
curl -X GET "http://localhost:4000/api/search/trending?period=week&limit=10"

# Track search analytics (admin only)
curl -X POST http://localhost:4000/api/search/analytics \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cleaning services",
    "results": 25,
    "filters": {
      "category": "cleaning",
      "location": "Manila"
    },
    "userId": "64a1b2c3d4e5f6789012345"
  }'
```

### Notifications
```bash
# Get user notifications
curl -X GET "http://localhost:4000/api/communication/notifications?page=1&limit=20" \
  -H "Authorization: Bearer JWT_TOKEN"

# Get unread notifications only
curl -X GET "http://localhost:4000/api/communication/notifications?isRead=false" \
  -H "Authorization: Bearer JWT_TOKEN"

# Get notifications by type
curl -X GET "http://localhost:4000/api/communication/notifications?type=booking_created" \
  -H "Authorization: Bearer JWT_TOKEN"

# Get notification count
curl -X GET "http://localhost:4000/api/communication/notifications/count" \
  -H "Authorization: Bearer JWT_TOKEN"

# Get unread notification count
curl -X GET "http://localhost:4000/api/communication/notifications/count?isRead=false" \
  -H "Authorization: Bearer JWT_TOKEN"

# Mark notification as read
curl -X PUT http://localhost:4000/api/communication/notifications/64a1b2c3d4e5f6789012345/read \
  -H "Authorization: Bearer JWT_TOKEN"

# Mark all notifications as read
curl -X PUT http://localhost:4000/api/communication/notifications/read-all \
  -H "Authorization: Bearer JWT_TOKEN"

# Delete notification
curl -X DELETE http://localhost:4000/api/communication/notifications/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer JWT_TOKEN"

# Send email notification
curl -X POST http://localhost:4000/api/communication/notifications/email \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Booking Confirmation",
    "template": "booking-confirmation",
    "data": {
      "bookingId": "64a1b2c3d4e5f6789012345",
      "serviceName": "House Cleaning",
      "date": "2024-01-15",
      "time": "10:00 AM"
    }
  }'

# Send SMS notification
curl -X POST http://localhost:4000/api/communication/notifications/sms \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Your booking has been confirmed for tomorrow at 10:00 AM."
  }'
```

## 🗄️ Database Models

### Core Models
- **User**: User profiles with roles, preferences, and trust verification
- **Marketplace**: Services and bookings with pricing and availability
- **Job**: Job postings with applications and analytics
- **Referral**: Referral tracking with rewards and analytics
- **Agency**: Agency management with provider coordination
- **Supplies**: Supply items with inventory and orders
- **Academy**: Training courses with enrollments and progress
- **Finance**: Financial transactions, earnings, and expenses
- **Rentals**: Rental items with bookings and reviews
- **Ads**: Advertising campaigns with analytics
- **FacilityCare**: Facility care services with bookings
- **LocalProPlus**: Subscription plans and user subscriptions
- **TrustVerification**: Trust and verification requests
- **Communication**: Conversations and messages
- **Analytics**: Analytics events and tracking data
- **UserSettings**: User preferences and configuration
- **AppSettings**: Global application configuration and feature flags
- **ErrorTracking**: Error monitoring and tracking data
- **AuditLog**: Comprehensive audit trail for compliance and security
- **Log**: Application logs stored in database with advanced querying
- **Provider**: Provider profiles with verification, onboarding, and performance tracking

## 📱 Enhanced Mobile Authentication

### 🔐 Smart Authentication Flow
- **Progressive Onboarding**: Automatic redirection to dashboard or onboarding based on profile completion
- **SMS Verification**: Real-time SMS verification with Twilio integration
- **Device Tracking**: Monitors and manages multiple devices per user with activity patterns
- **Enhanced JWT Tokens**: Rich payload including user status, role, and onboarding completion
- **Profile Completeness Tracking**: Comprehensive profile completion status with categorized progress
- **Smart Next Steps**: AI-driven recommendations for profile completion
- **Comprehensive Logging**: Detailed security and performance logging with client tracking

### 🛡️ Security Features
- **Input Validation**: Comprehensive validation for phone numbers, codes, and user data
- **Error Handling**: Secure error responses with specific error codes for better client handling
- **Session Management**: Enhanced login tracking with IP address and user agent monitoring
- **Trust Score Integration**: Automatic trust score calculation based on verification status

### 📊 User Experience
- **Smart Redirection**: Automatic detection of user status and appropriate redirection
- **Welcome Emails**: Automatic welcome emails for new users upon onboarding completion
- **Referral Integration**: Automatic referral code generation for new users
- **Profile Management**: Seamless profile completion with validation and error handling
- **Progress Tracking**: Real-time profile completion progress with visual indicators
- **Guided Onboarding**: Step-by-step guidance for profile completion
- **Dashboard Access Control**: Smart access control based on profile completeness

### 📈 Profile Completeness System
- **Categorized Progress Tracking**: Basic info, profile details, and verification status
- **Percentage Completion**: Real-time completion percentages for each category
- **Missing Fields Identification**: Detailed list of incomplete fields
- **Smart Recommendations**: Priority-based next steps for profile completion
- **Dashboard Access Control**: Automatic access control based on completion status
- **Progressive Enhancement**: Gradual profile building with guided steps
- **Visual Progress Indicators**: Clear progress visualization for users

## 🆕 Latest Features & Improvements

### 🚀 **API Performance & Reliability Improvements**
- **Success Rate**: Improved from 18.87% to 33.96% (+15.09% improvement)
- **500 Errors Eliminated**: 11 out of 15 errors fixed (73% reduction)
- **ObjectId Validation**: All controllers now properly validate MongoDB ObjectIds
- **Model Import Fixes**: Resolved all model import issues across controllers
- **Route Optimization**: Enhanced route middleware with validation
- **Error Handling**: Centralized error handling with consistent response formats
- **Security Headers**: Added comprehensive security headers for all endpoints

### 🏢 Agency Management Module
- **Multi-provider coordination**: Manage multiple service providers under one agency
- **Role-based permissions**: Owner, admin, manager, supervisor, and provider roles
- **Provider management**: Add, remove, and manage provider status and performance
- **Commission tracking**: Set and track commission rates for each provider
- **Service area management**: Define and manage geographic service areas
- **Analytics dashboard**: Comprehensive agency performance and provider analytics
- **Financial management**: Track earnings, commissions, and payout schedules
- **Verification system**: Business verification and document management
- **Subscription plans**: Basic, Professional, and Enterprise agency plans

### 🤝 Referral System Module
- **Comprehensive referral platform**: Complete referral tracking and rewards system
- **Multiple reward types**: Credits, discounts, subscription extensions, and cash rewards
- **Tier system**: Bronze, Silver, Gold, and Platinum referral tiers with increasing benefits
- **Automated processing**: Automatic referral completion across all platform modules
- **Analytics dashboard**: Detailed referral statistics and performance metrics
- **Leaderboard system**: Compete with other users for top referrer status
- **Email notifications**: Automated invitation and reward notification emails
- **Fraud prevention**: Built-in validation and anti-fraud mechanisms
- **Social sharing**: Multiple sharing options including email, SMS, and social media

### 💼 Job Board Module
- **Complete employment platform**: Job postings, applications, and hiring management
- **Advanced job search**: Filter by category, location, salary, experience level, and more
- **Application tracking**: Full application lifecycle management with status updates
- **Company profiles**: Upload logos and manage company information
- **Email notifications**: Automated notifications for applications and status updates
- **Analytics dashboard**: Track job performance, views, and application metrics
- **Geographic targeting**: Location-based job search with remote work support
- **File uploads**: Resume and portfolio uploads via Cloudinary integration

### 💳 PayPal Payment Integration
- **Complete payment processing**: One-time payments and recurring subscriptions
- **Multi-feature support**: Marketplace bookings, supplies orders, financial services, LocalPro Plus subscriptions
- **Subscription management**: Full recurring billing with automatic renewals
- **Webhook handling**: Real-time payment notifications and status updates
- **Production ready**: Sandbox and production environment support

### 💳 PayMaya Payment Integration
- **Philippines-focused payment processing**: Checkout, Payment Vault, and Invoice APIs
- **Multi-payment method support**: Cards, e-wallets, bank transfers
- **Secure transactions**: PCI-DSS compliant with 3D Secure authentication
- **Webhook notifications**: Real-time payment status updates
- **PHP currency support**: Native support for Philippine Peso
- **Production ready**: Sandbox and production environment support

### 📧 Email Service Integration
- **Multi-provider support**: Resend, SendGrid, and SMTP
- **Automatic email notifications**: Welcome emails, booking confirmations, order confirmations, loan approvals
- **Easy configuration**: Switch between providers via environment variables
- **Fallback handling**: Graceful degradation when email service fails

### 🗺️ Google Maps Integration
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Places Search**: Find and search for local businesses
- **Distance Calculations**: Real-time distance and travel time estimates
- **Service Area Validation**: Verify if locations are within service coverage
- **Location-based Search**: Find services within specified radius
- **Coverage Analysis**: Analyze service provider coverage areas

### ⚙️ Settings Management System
- **User Settings**: Comprehensive user preferences including privacy, notifications, communication, service, payment, security, app, and analytics settings
- **App Settings**: Global application configuration including general, business, features, security, uploads, payments, analytics, and integrations
- **Category-based Updates**: Update specific setting categories without affecting others
- **Feature Flags**: Toggle application features on/off dynamically
- **Admin Controls**: Administrative functions for managing global app settings
- **Public Endpoints**: Access to public app information without authentication
- **Validation**: Comprehensive input validation for all settings
- **Default Settings**: Automatic generation of default settings for new users
- **Settings Reset**: Reset user settings to defaults functionality

### 📊 Logging & Error Monitoring System
- **Winston Logging**: Multi-level logging with daily rotation and structured JSON format
- **Error Tracking**: Automatic error capture with categorization and severity levels
- **Performance Monitoring**: Request timing and slow request detection
- **Business Event Logging**: Specialized logging for payments, bookings, and user actions
- **Security Event Logging**: Authentication failures and security-related events
- **Alert System**: Configurable thresholds for error notifications
- **Error Resolution**: Mark errors as resolved with notes and tracking
- **Dashboard API**: Admin endpoints for viewing error statistics and trends
- **Log Rotation**: Automatic file rotation to prevent disk space issues
- **Sensitive Data Protection**: Automatic redaction of passwords and tokens in logs

### 🔍 Audit Logging System
- **Comprehensive Action Tracking**: Complete audit trail for all critical user actions and system changes
- **Compliance Features**: GDPR, SOX, and HIPAA compliance with configurable retention policies
- **Security Monitoring**: Track authentication, authorization, and security-related events
- **Business Operations**: Audit marketplace, job board, financial, and agency operations
- **Data Protection**: Automatic sanitization of sensitive information in audit logs
- **Export Capabilities**: CSV and JSON export for compliance reporting and analysis
- **Real-time Monitoring**: Live audit event tracking with dashboard views
- **User Activity Summaries**: Individual user action tracking and behavior analysis
- **Automatic Cleanup**: Configurable retention periods with automatic data deletion
- **Admin Dashboard**: Comprehensive audit overview with statistics and trends

### 💾 Database Logging System
- **MongoDB Storage**: All application logs stored in database for advanced querying and analysis
- **Winston Integration**: Seamless integration with Winston logger using custom database transport
- **Batch Processing**: Efficient batch insertion with configurable flush intervals
- **Advanced Filtering**: Filter logs by level, category, source, user, URL, method, and more
- **Performance Analytics**: Track response times, slow requests, and performance metrics
- **Error Trend Analysis**: Identify error patterns and trends over time
- **User Activity Tracking**: Monitor individual user activity and behavior patterns
- **Global Search**: Search across all log types (application, audit, error) with full-text search
- **Export Capabilities**: Export logs in JSON and CSV formats for analysis
- **Automatic Cleanup**: TTL indexes and configurable retention policies for automatic cleanup

### 👨‍💼 Provider System
- **Client-to-Provider Upgrade**: Seamless upgrade path from client to provider status
- **Comprehensive Onboarding**: 8-step onboarding process with progress tracking
- **Multi-Type Support**: Individual, business, and agency provider types
- **Verification System**: Identity, business, background check, and insurance verification
- **Professional Profiles**: Detailed specialty, experience, and service area management
- **Performance Tracking**: Rating, completion rate, response time, and earnings analytics
- **Document Management**: Secure upload and management of verification documents
- **Dashboard Analytics**: Comprehensive performance insights and business metrics
- **Subscription Plans**: Basic, Professional, Premium, and Enterprise provider plans
- **Admin Management**: Complete provider lifecycle management and status control

### 👥 User Management System
- **Complete User CRUD Operations**: Create, read, update, and delete users with comprehensive validation
- **Role-based Access Control**: Granular permissions for Admin, Agency Owner, Agency Admin, Provider, Client, Supplier, and Instructor roles
- **User Status Management**: Activate, deactivate, suspend, or ban users with reason tracking
- **Verification System**: Manage phone, email, identity, business, address, and bank account verification
- **Badge System**: Award achievement badges (verified_provider, top_rated, fast_response, reliable, expert, newcomer)
- **Bulk Operations**: Update multiple users simultaneously for efficient management
- **User Analytics**: Comprehensive statistics including user counts, role distribution, and activity metrics
- **Activity Tracking**: Login tracking, device information, and user behavior monitoring
- **Agency Support**: Agency-specific user management with proper isolation
- **Audit Logging**: All user management operations are logged for compliance and security
- **Advanced Filtering**: Search and filter users by role, status, verification, and custom criteria
- **User Notes**: Add administrative notes to user profiles for internal tracking
- **User Tags**: Categorize users with custom tags (vip, high_risk, new_user, etc.)
- **Trust Score Management**: Automatic trust score calculation based on verification and activity

### 🔍 Global Search System
- **Comprehensive Entity Search**: Search across all platform entities (Users, Jobs, Services, Supplies, Courses, Rentals, Agencies)
- **Advanced Filtering**: Filter by category, location, price range, rating, verification status, and more
- **Smart Sorting**: Sort by relevance, rating, price, date, and custom criteria
- **Search Suggestions**: Real-time autocomplete suggestions for better user experience
- **Popular & Trending Searches**: Track and display popular and trending search terms
- **Entity-Specific Search**: Search within specific entity types with targeted filters
- **Location-Based Search**: Find services and providers within specific geographic areas
- **Relevance Scoring**: Intelligent relevance scoring based on multiple factors
- **Pagination Support**: Efficient pagination with configurable page sizes
- **Search Analytics**: Track search patterns and user behavior for insights
- **Category Management**: Comprehensive category system for all searchable entities
- **Performance Optimized**: Fast search with database indexing and query optimization

### 🔔 Notification System
- **Multi-Channel Delivery**: In-app, email, SMS, and push notifications
- **Comprehensive Notification Types**: Booking updates, job applications, payment notifications, referral rewards, system announcements
- **Smart Filtering**: Filter notifications by type, read status, priority, and date range
- **Bulk Operations**: Mark all notifications as read, delete multiple notifications
- **Priority Management**: Low, medium, high, and urgent priority levels
- **Expiration Handling**: Automatic cleanup of expired notifications
- **User Preferences**: Granular notification preferences for each channel and type
- **Real-time Updates**: Instant notification delivery with read status tracking
- **Analytics Integration**: Track notification engagement and user behavior
- **Performance Optimized**: Efficient database queries with proper indexing
- **Security**: User-scoped notifications with proper access control

### 🔧 Enhanced Controllers
- **Marketplace**: Location-based service search with distance calculations
- **Job Board**: Complete job posting and application management system
- **Agency Management**: Multi-provider coordination and performance tracking
- **Referral System**: Comprehensive referral tracking and automated reward processing
- **Rentals**: Enhanced location filtering and distance calculations
- **Supplies**: Email notifications for orders and subscriptions
- **Finance**: Email notifications for loan approvals
- **Authentication**: Welcome emails for new users
- **Settings Management**: User preferences and app configuration management
- **Global Search**: Comprehensive search functionality across all platform entities

### 🛡️ Security & Performance Enhancements
- **Security**: Comprehensive security middleware across all endpoints
- **Input Validation**: Enhanced validation for all route parameters
- **File Upload Security**: Secure file upload with size and type validation
- **Security Headers**: XSS, CSRF, and other security protections
- **Performance Monitoring**: Request timing and slow request detection
- **Error Tracking**: Comprehensive error logging and resolution system
- **Audit Trail**: Complete audit logging for compliance and security

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (client, provider, admin, supplier, instructor, agency_owner, agency_admin)
- Security middleware and validation
- Input validation with Joi
- CORS protection
- Helmet security headers
- Phone number verification via SMS
- Password-free authentication

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Environment Variables
Ensure all required environment variables are set in production:

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
# ... other production variables
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@localpro.com or join our Slack channel.

## 🗺️ Roadmap

- [x] Google Maps integration
- [x] Email service integration
- [x] PayPal payment integration
- [x] PayMaya payment integration
- [x] Job board module
- [x] Referral system module
- [x] Agency management module
- [x] Location-based services
- [x] Service area validation
- [x] Distance calculations
- [x] Subscription management
- [x] Settings management system
- [x] Logging and error monitoring system
- [x] Audit logging system for compliance and security
- [x] Database logging system with MongoDB storage and analytics
- [x] Provider system with client-to-provider upgrade functionality
- [x] User management system with role-based access control and analytics
- [x] Global search system with comprehensive entity search and filtering
- [ ] Mobile app integration
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] AI-powered job matching
- [ ] AI-powered referral matching
- [ ] AI-powered agency provider matching
- [ ] Video interview integration
- [ ] Skills assessment platform
- [ ] Referral gamification features
- [ ] Agency performance optimization
- [ ] Blockchain integration for contracts
- [ ] IoT device integration
