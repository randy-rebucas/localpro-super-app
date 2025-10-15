# LocalPro Super App - Backend API

A comprehensive Node.js backend API for the LocalPro Super App ecosystem, providing a centralized platform for local service providers, clients, and businesses.

## 🚀 Features

### Core Modules
- **🔐 Authentication**: SMS-based authentication with Twilio integration
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
- **👨‍💼 Provider System**: Comprehensive provider upgrade system with verification and onboarding

### Key Features
- RESTful API with comprehensive endpoints
- JWT-based authentication
- Role-based access control
- Real-time SMS verification
- Advanced search and filtering
- Complete PayPal payment processing (one-time & recurring)
- Full subscription management with automatic billing
- Analytics and reporting
- File upload support
- Rate limiting and security
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

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Twilio SMS
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston with daily rotation, Morgan for HTTP requests
- **Error Monitoring**: Custom error tracking with alerting and resolution management
- **Audit Logging**: Comprehensive audit trail with compliance features and data protection
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

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/send-code          # Send verification code
POST /api/auth/verify-code        # Verify code and login/register
GET  /api/auth/me                 # Get current user
PUT  /api/auth/profile            # Update user profile
POST /api/auth/logout             # Logout user
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
POST   /api/communication/email            # Send email notification
POST   /api/communication/sms              # Send SMS notification
GET    /api/communication/unread-count     # Get unread message count
GET    /api/communication/search           # Search conversations
GET    /api/communication/conversation-with/:userId # Get conversation with user
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

## 📝 API Examples

### Authentication Flow
```bash
# 1. Send verification code
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# 2. Verify code and register/login
curl -X POST http://localhost:4000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456",
    "firstName": "John",
    "lastName": "Doe",
    "role": "provider"
  }'

# 3. Get user profile (requires token)
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
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
- **Provider**: Provider profiles with verification, onboarding, and performance tracking

## 🆕 New Features

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

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (client, provider, admin, supplier, instructor, agency_owner, agency_admin)
- Rate limiting (100 requests per 15 minutes)
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

### Docker Deployment
```bash
# Build Docker image
docker build -t localpro-super-app .

# Run container
docker run -p 5000:5000 --env-file .env localpro-super-app
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
- [x] Provider system with client-to-provider upgrade functionality
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
