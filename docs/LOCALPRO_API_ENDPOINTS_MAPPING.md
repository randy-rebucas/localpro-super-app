# 🎯 **LocalPro Super App - API Endpoints Mapping**

## **Complete API Endpoint Reference by Journey**

> **📅 Last Updated:** October 24, 2025  
> **🔄 Version:** 2.0  
> **📊 Total Endpoints:** 200+  
> **🆕 Recent Updates:** Added Settings Management, Activities & Social, Error Monitoring, Reminder Memory System, Audit Logging, and enhanced Security & Middleware features

### **1. 🔐 Authentication & Onboarding**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/auth/register` | POST | Register new user | User Registration |
| `/api/auth/verify` | POST | Verify SMS code | Phone Verification |
| `/api/auth/login` | POST | User login | User Login |
| `/api/auth/profile` | PUT | Update profile | Profile Setup |
| `/api/auth/refresh` | POST | Refresh token | Session Management |

### **2. 🏪 Marketplace Services**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/marketplace/services` | GET | Search services | Service Discovery |
| `/api/marketplace/services/nearby` | GET | Find nearby services | Location-based Search |
| `/api/marketplace/services/:id` | GET | Get service details | Service Details |
| `/api/marketplace/services` | POST | Create service | Provider Service Creation |
| `/api/marketplace/services/:id` | PUT | Update service | Service Management |
| `/api/marketplace/services/:id/images` | POST | Upload service images | Image Management |
| `/api/marketplace/bookings` | POST | Create booking | Service Booking |
| `/api/marketplace/bookings` | GET | Get bookings | Booking Management |
| `/api/marketplace/bookings/:id/status` | PUT | Update booking status | Status Updates |
| `/api/marketplace/bookings/:id/photos` | POST | Upload completion photos | Service Completion |
| `/api/marketplace/bookings/:id/review` | POST | Add review | Review Process |
| `/api/marketplace/bookings/paypal/approve` | POST | Approve PayPal payment | Payment Processing |
| `/api/marketplace/bookings/paypal/order/:orderId` | GET | Get PayPal order details | Payment Tracking |

### **3. 💼 Job Board**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/jobs` | GET | Search jobs | Job Discovery |
| `/api/jobs/search` | GET | Advanced job search | Job Search |
| `/api/jobs/:id` | GET | Get job details | Job Details |
| `/api/jobs` | POST | Create job posting | Employer Job Creation |
| `/api/jobs/:id` | PUT | Update job posting | Job Management |
| `/api/jobs/:id` | DELETE | Delete job posting | Job Management |
| `/api/jobs/:id/apply` | POST | Apply for job | Job Application |
| `/api/jobs/my-applications` | GET | Get my applications | Application Tracking |
| `/api/jobs/my-jobs` | GET | Get my job postings | Employer Dashboard |
| `/api/jobs/:id/applications` | GET | Get job applications | Application Management |
| `/api/jobs/:id/applications/:applicationId/status` | PUT | Update application status | Status Updates |
| `/api/jobs/:id/logo` | POST | Upload company logo | Company Branding |
| `/api/jobs/:id/stats` | GET | Get job statistics | Analytics |

### **4. 🎓 Academy**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/academy/courses` | GET | Browse courses | Course Discovery |
| `/api/academy/courses/:id` | GET | Get course details | Course Details |
| `/api/academy/categories` | GET | Get course categories | Category Filtering |
| `/api/academy/featured` | GET | Get featured courses | Featured Content |
| `/api/academy/courses` | POST | Create course | Instructor Course Creation |
| `/api/academy/courses/:id` | PUT | Update course | Course Management |
| `/api/academy/courses/:id/thumbnail` | POST | Upload course thumbnail | Content Management |
| `/api/academy/courses/:id/videos` | POST | Upload course video | Content Management |
| `/api/academy/courses/:id/videos/:videoId` | DELETE | Delete course video | Content Management |
| `/api/academy/courses/:id/enroll` | POST | Enroll in course | Course Enrollment |
| `/api/academy/courses/:id/progress` | PUT | Update course progress | Learning Progress |
| `/api/academy/courses/:id/reviews` | POST | Add course review | Review Process |
| `/api/academy/my-courses` | GET | Get my enrolled courses | Student Dashboard |
| `/api/academy/my-created-courses` | GET | Get my created courses | Instructor Dashboard |
| `/api/academy/statistics` | GET | Get course statistics | Analytics |

### **5. 📦 Supplies & Materials**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/supplies` | GET | Browse supplies | Product Discovery |
| `/api/supplies/categories` | GET | Get supply categories | Category Filtering |
| `/api/supplies/featured` | GET | Get featured supplies | Featured Products |
| `/api/supplies/nearby` | GET | Find nearby supplies | Location-based Search |
| `/api/supplies/:id` | GET | Get supply details | Product Details |
| `/api/supplies` | POST | Create supply listing | Supplier Product Creation |
| `/api/supplies/:id` | PUT | Update supply | Product Management |
| `/api/supplies/:id/images` | POST | Upload supply images | Image Management |
| `/api/supplies/:id/images/:imageId` | DELETE | Delete supply image | Image Management |
| `/api/supplies/:id/order` | POST | Order supply | Order Placement |
| `/api/supplies/:id/orders/:orderId/status` | PUT | Update order status | Order Management |
| `/api/supplies/:id/reviews` | POST | Add supply review | Review Process |
| `/api/supplies/my-supplies` | GET | Get my supplies | Supplier Dashboard |
| `/api/supplies/my-orders` | GET | Get my orders | Order Tracking |
| `/api/supplies/statistics` | GET | Get supply statistics | Analytics |

### **6. 🔧 Equipment Rentals**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/rentals` | GET | Search rentals | Equipment Discovery |
| `/api/rentals/categories` | GET | Get rental categories | Category Filtering |
| `/api/rentals/featured` | GET | Get featured rentals | Featured Equipment |
| `/api/rentals/nearby` | GET | Find nearby rentals | Location-based Search |
| `/api/rentals/:id` | GET | Get rental details | Equipment Details |
| `/api/rentals` | POST | Create rental listing | Provider Equipment Creation |
| `/api/rentals/:id` | PUT | Update rental | Equipment Management |
| `/api/rentals/:id/images` | POST | Upload rental images | Image Management |
| `/api/rentals/:id/images/:imageId` | DELETE | Delete rental image | Image Management |
| `/api/rentals/:id/book` | POST | Book rental | Rental Booking |
| `/api/rentals/:id/bookings/:bookingId/status` | PUT | Update booking status | Booking Management |
| `/api/rentals/:id/reviews` | POST | Add rental review | Review Process |
| `/api/rentals/my-rentals` | GET | Get my rentals | Provider Dashboard |
| `/api/rentals/my-bookings` | GET | Get my bookings | Booking Tracking |
| `/api/rentals/statistics` | GET | Get rental statistics | Analytics |

### **7. 💰 Financial Services**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/finance/overview` | GET | Get financial overview | Dashboard |
| `/api/finance/transactions` | GET | Get transactions | Transaction History |
| `/api/finance/earnings` | GET | Get earnings | Earnings Tracking |
| `/api/finance/expenses` | GET | Get expenses | Expense Tracking |
| `/api/finance/expenses` | POST | Add expense | Expense Management |
| `/api/finance/withdraw` | POST | Request withdrawal | Withdrawal Request |
| `/api/finance/withdrawals/:withdrawalId/process` | PUT | Process withdrawal | Withdrawal Processing |
| `/api/finance/tax-documents` | GET | Get tax documents | Tax Management |
| `/api/finance/reports` | GET | Get financial reports | Reporting |
| `/api/finance/wallet/settings` | PUT | Update wallet settings | Settings Management |

### **8. 🏢 Agency Management**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/agencies` | GET | Get all agencies | Agency Discovery |
| `/api/agencies/:id` | GET | Get agency details | Agency Details |
| `/api/agencies` | POST | Create agency | Agency Creation |
| `/api/agencies/:id` | PUT | Update agency | Agency Management |
| `/api/agencies/:id` | DELETE | Delete agency | Agency Management |
| `/api/agencies/:id/logo` | POST | Upload agency logo | Branding |
| `/api/agencies/:id/providers` | POST | Add provider | Provider Management |
| `/api/agencies/:id/providers/:providerId` | DELETE | Remove provider | Provider Management |
| `/api/agencies/:id/providers/:providerId/status` | PUT | Update provider status | Status Management |
| `/api/agencies/:id/admins` | POST | Add admin | Admin Management |
| `/api/agencies/:id/admins/:adminId` | DELETE | Remove admin | Admin Management |
| `/api/agencies/:id/analytics` | GET | Get agency analytics | Analytics |
| `/api/agencies/my/agencies` | GET | Get my agencies | User Dashboard |
| `/api/agencies/join` | POST | Join agency | Agency Joining |
| `/api/agencies/leave` | POST | Leave agency | Agency Leaving |

### **9. ⭐ LocalPro Plus Subscriptions**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/localpro-plus/plans` | GET | Get subscription plans | Plan Discovery |
| `/api/localpro-plus/plans/:id` | GET | Get plan details | Plan Details |
| `/api/localpro-plus/plans` | POST | Create plan | Plan Management |
| `/api/localpro-plus/plans/:id` | PUT | Update plan | Plan Management |
| `/api/localpro-plus/plans/:id` | DELETE | Delete plan | Plan Management |
| `/api/localpro-plus/subscribe/:planId` | POST | Subscribe to plan | Subscription |
| `/api/localpro-plus/confirm-payment` | POST | Confirm payment | Payment Confirmation |
| `/api/localpro-plus/cancel` | POST | Cancel subscription | Subscription Cancellation |
| `/api/localpro-plus/renew` | POST | Renew subscription | Subscription Renewal |
| `/api/localpro-plus/my-subscription` | GET | Get my subscription | Subscription Management |
| `/api/localpro-plus/settings` | PUT | Update settings | Settings Management |
| `/api/localpro-plus/usage` | GET | Get usage statistics | Usage Tracking |
| `/api/localpro-plus/analytics` | GET | Get subscription analytics | Analytics |

### **10. 🤝 Referral System**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/referrals/validate` | POST | Validate referral code | Code Validation |
| `/api/referrals/track` | POST | Track referral click | Click Tracking |
| `/api/referrals/leaderboard` | GET | Get referral leaderboard | Leaderboard |
| `/api/referrals/me` | GET | Get my referrals | Referral Tracking |
| `/api/referrals/stats` | GET | Get referral statistics | Statistics |
| `/api/referrals/links` | GET | Get referral links | Link Generation |
| `/api/referrals/rewards` | GET | Get rewards history | Reward Tracking |
| `/api/referrals/invite` | POST | Send invitations | Invitation Sending |
| `/api/referrals/preferences` | PUT | Update preferences | Settings Management |
| `/api/referrals/process` | POST | Process referral completion | Reward Processing |
| `/api/referrals/analytics` | GET | Get referral analytics | Analytics |

### **11. 🗺️ Location Services**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/maps/geocode` | POST | Geocode address | Address Conversion |
| `/api/maps/reverse-geocode` | POST | Reverse geocode | Coordinate Conversion |
| `/api/maps/places/search` | POST | Search places | Place Search |
| `/api/maps/distance` | POST | Calculate distance | Distance Calculation |
| `/api/maps/nearby` | POST | Find nearby places | Nearby Search |
| `/api/maps/validate-service-area` | POST | Validate service area | Area Validation |
| `/api/maps/analyze-coverage` | POST | Analyze coverage | Coverage Analysis |
| `/api/maps/test` | GET | Test API connection | API Testing |

### **12. 📢 Advertising**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/ads` | GET | Get ads | Ad Discovery |
| `/api/ads/categories` | GET | Get ad categories | Category Filtering |
| `/api/ads/featured` | GET | Get featured ads | Featured Ads |
| `/api/ads/:id` | GET | Get ad details | Ad Details |
| `/api/ads/:id/click` | POST | Track ad click | Click Tracking |
| `/api/ads` | POST | Create ad | Ad Creation |
| `/api/ads/:id` | PUT | Update ad | Ad Management |
| `/api/ads/:id/images` | POST | Upload ad images | Image Management |
| `/api/ads/:id/images/:imageId` | DELETE | Delete ad image | Image Management |
| `/api/ads/:id/promote` | POST | Promote ad | Ad Promotion |
| `/api/ads/:id/analytics` | GET | Get ad analytics | Analytics |
| `/api/ads/my-ads` | GET | Get my ads | Advertiser Dashboard |
| `/api/ads/statistics` | GET | Get ad statistics | Statistics |

### **13. 🏢 Facility Care**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/facility-care` | GET | Get facility care services | Service Discovery |
| `/api/facility-care/nearby` | GET | Find nearby services | Location-based Search |
| `/api/facility-care/:id` | GET | Get service details | Service Details |
| `/api/facility-care` | POST | Create service | Service Creation |
| `/api/facility-care/:id` | PUT | Update service | Service Management |
| `/api/facility-care/:id/images` | POST | Upload service images | Image Management |
| `/api/facility-care/:id/images/:imageId` | DELETE | Delete service image | Image Management |
| `/api/facility-care/:id/book` | POST | Book service | Service Booking |
| `/api/facility-care/:id/bookings/:bookingId/status` | PUT | Update booking status | Booking Management |
| `/api/facility-care/:id/reviews` | POST | Add service review | Review Process |
| `/api/facility-care/my-services` | GET | Get my services | Provider Dashboard |
| `/api/facility-care/my-bookings` | GET | Get my bookings | Booking Tracking |

### **14. 🔒 Trust Verification**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/trust-verification/verified-users` | GET | Get verified users | User Discovery |
| `/api/trust-verification/requests` | GET | Get verification requests | Request Management |
| `/api/trust-verification/requests/:id` | GET | Get request details | Request Details |
| `/api/trust-verification/requests` | POST | Create verification request | Request Submission |
| `/api/trust-verification/requests/:id` | PUT | Update request | Request Management |
| `/api/trust-verification/requests/:id` | DELETE | Delete request | Request Management |
| `/api/trust-verification/requests/:id/documents` | POST | Upload documents | Document Upload |
| `/api/trust-verification/requests/:id/documents/:documentId` | DELETE | Delete document | Document Management |
| `/api/trust-verification/my-requests` | GET | Get my requests | User Dashboard |
| `/api/trust-verification/requests/:id/review` | PUT | Review request | Admin Review |
| `/api/trust-verification/statistics` | GET | Get verification statistics | Statistics |

### **15. 📧 Communication**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/communication/conversations` | GET | Get conversations | Conversation Management |
| `/api/communication/conversations/:id` | GET | Get conversation details | Conversation Details |
| `/api/communication/conversations` | POST | Create conversation | Conversation Creation |
| `/api/communication/messages` | POST | Send message | Message Sending |
| `/api/communication/messages/:conversationId` | GET | Get messages | Message History |
| `/api/communication/messages/:id` | PUT | Update message | Message Management |
| `/api/communication/messages/:id` | DELETE | Delete message | Message Management |

### **16. 📊 Analytics & Usage Tracking**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/analytics/overview` | GET | Get analytics overview | Dashboard |
| `/api/analytics/performance` | GET | Get performance metrics | Performance Tracking |
| `/api/analytics/reports` | GET | Generate reports | Reporting |
| `/api/analytics/events` | POST | Track events | Event Tracking |
| `/api/analytics/users` | GET | Get user analytics | User Analytics |
| `/api/analytics/revenue` | GET | Get revenue analytics | Revenue Tracking |
| `/api/analytics/engagement` | GET | Get engagement metrics | Engagement Tracking |
| `/api/analytics/usage/track` | POST | Track feature usage | Usage Tracking |
| `/api/analytics/usage/stats` | GET | Get usage statistics | Usage Analytics |
| `/api/analytics/usage/limits` | GET | Get usage limits | Subscription Management |
| `/api/analytics/usage/reset` | POST | Reset usage counters (Admin) | Usage Management |
| `/api/analytics/usage/export` | POST | Export usage data (Admin) | Data Export |
| `/api/analytics/usage/alerts` | GET | Get usage alerts | Alert Management |
| `/api/analytics/usage/trends` | GET | Get usage trends | Trend Analysis |

### **17. ⚙️ Settings Management**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/settings/user` | GET | Get user settings | Settings Management |
| `/api/settings/user` | PUT | Update user settings | Settings Management |
| `/api/settings/user/:category` | PUT | Update specific setting category | Category Management |
| `/api/settings/user/reset` | POST | Reset user settings to defaults | Settings Reset |
| `/api/settings/user` | DELETE | Delete user settings | Settings Deletion |
| `/api/settings/app` | GET | Get app settings (Admin) | Admin Settings |
| `/api/settings/app` | PUT | Update app settings (Admin) | Admin Settings |
| `/api/settings/app/:category` | PUT | Update specific app setting category (Admin) | Category Management |
| `/api/settings/app/features/toggle` | POST | Toggle feature flag (Admin) | Feature Management |
| `/api/settings/app/public` | GET | Get public app settings | Public Settings |
| `/api/settings/app/health` | GET | Get app health status | Health Monitoring |

### **18. 📊 Activities & Social**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/activities/feed` | GET | Get activity feed | Social Feed |
| `/api/activities/my` | GET | Get my activities | Personal Activities |
| `/api/activities/user/:userId` | GET | Get user activities | User Profile |
| `/api/activities/:id` | GET | Get activity details | Activity Details |
| `/api/activities` | POST | Create activity | Activity Creation |
| `/api/activities/:id` | PUT | Update activity | Activity Management |
| `/api/activities/:id` | DELETE | Delete activity | Activity Management |
| `/api/activities/:id/interactions` | POST | Add interaction | Social Interaction |
| `/api/activities/:id/interactions` | DELETE | Remove interaction | Social Interaction |
| `/api/activities/stats/my` | GET | Get my activity statistics | Personal Analytics |
| `/api/activities/stats/global` | GET | Get global activity statistics (Admin) | Global Analytics |
| `/api/activities/metadata` | GET | Get activity metadata | System Information |

### **19. 🔍 Error Monitoring**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/error-monitoring` | GET | Get error monitoring info | Service Status |
| `/api/error-monitoring/stats` | GET | Get error statistics (Admin) | Error Analytics |
| `/api/error-monitoring/unresolved` | GET | Get unresolved errors (Admin) | Error Management |
| `/api/error-monitoring/:errorId` | GET | Get error details (Admin) | Error Investigation |
| `/api/error-monitoring/dashboard/summary` | GET | Get dashboard summary (Admin) | Admin Dashboard |

### **20. 💳 Payment Processing**

#### **PayPal Integration**
| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/paypal/webhook` | POST | Handle PayPal webhooks | Webhook Processing |
| `/api/localpro-plus/paypal/approve` | POST | Approve PayPal subscription | Subscription Payment |
| `/api/localpro-plus/paypal/cancel` | POST | Cancel PayPal subscription | Subscription Cancellation |
| `/api/marketplace/bookings/paypal/approve` | POST | Approve marketplace payment | Service Payment |
| `/api/marketplace/bookings/paypal/order/:orderId` | GET | Get PayPal order details | Payment Tracking |
| `/api/supplies/orders/paypal/approve` | POST | Approve supplies payment | Supply Payment |
| `/api/supplies/orders/paypal/order/:orderId` | GET | Get supplies PayPal order | Payment Tracking |
| `/api/finance/loans/:id/repay/paypal` | POST | PayPal loan repayment | Loan Payment |
| `/api/finance/loans/repay/paypal/approve` | POST | Approve loan repayment | Payment Approval |
| `/api/finance/salary-advances/:id/repay/paypal` | POST | PayPal salary advance repayment | Advance Payment |
| `/api/finance/salary-advances/repay/paypal/approve` | POST | Approve advance repayment | Payment Approval |

#### **PayMaya Integration**
| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/paymaya/checkout` | POST | Create PayMaya checkout | Checkout Creation |
| `/api/paymaya/checkout/:checkoutId` | GET | Get checkout details | Checkout Tracking |
| `/api/paymaya/payment` | POST | Create PayMaya payment | Payment Creation |
| `/api/paymaya/payment/:paymentId` | GET | Get payment details | Payment Tracking |
| `/api/paymaya/invoice` | POST | Create PayMaya invoice | Invoice Creation |
| `/api/paymaya/invoice/:invoiceId` | GET | Get invoice details | Invoice Tracking |
| `/api/paymaya/webhook` | POST | Handle PayMaya webhooks | Webhook Processing |
| `/api/paymaya/config/validate` | GET | Validate configuration | Configuration Validation |
| `/api/paymaya/webhook/events` | GET | Get webhook events | Event Tracking |

### **21. 🧠 Reminder Memory System**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/reminder-memory/status` | GET | Get system status | System Monitoring |
| `/api/reminder-memory/protected-files` | GET | List protected files | File Management |
| `/api/reminder-memory/check-modifications` | POST | Check file modifications | Security Check |
| `/api/reminder-memory/backup` | POST | Create backup reminder | Backup Management |
| `/api/reminder-memory/stats` | GET | Get system statistics | Analytics |
| `/api/reminder-memory/cli/init` | POST | Initialize system | System Setup |
| `/api/reminder-memory/cli/status` | GET | Get CLI status | CLI Management |
| `/api/reminder-memory/cli/list` | GET | List CLI commands | CLI Help |

### **22. 📋 Audit Logging System**

| Endpoint | Method | Description | Journey Step |
|----------|--------|-------------|--------------|
| `/api/audit-logs` | GET | Get audit logs (Admin) | Audit Management |
| `/api/audit-logs/:id` | GET | Get audit log details (Admin) | Audit Investigation |
| `/api/audit-logs/export` | POST | Export audit logs (Admin) | Data Export |
| `/api/audit-logs/stats` | GET | Get audit statistics (Admin) | Audit Analytics |
| `/api/audit-logs/categories` | GET | Get audit categories | System Information |
| `/api/audit-logs/actions` | GET | Get audit actions | System Information |
| `/api/audit-logs/search` | POST | Search audit logs (Admin) | Advanced Search |
| `/api/audit-logs/cleanup` | POST | Cleanup old logs (Admin) | Maintenance |

---

## **API Endpoint Categories by User Role**

### **Public Endpoints (No Authentication Required)**
- Service discovery and browsing
- Job search and viewing
- Course catalog browsing
- Supply catalog browsing
- Rental equipment browsing
- Agency information viewing
- Subscription plan viewing
- Ad viewing and clicking
- Location services
- Referral code validation
- Public app settings
- Error monitoring service status
- Health check endpoints

### **Client Endpoints (Client Role)**
- Service booking
- Job applications
- Course enrollment
- Supply ordering
- Equipment rental
- Financial services
- Subscription management
- Referral system usage
- Communication
- Review and rating
- User settings management
- Activity feed and interactions
- Personal analytics and statistics

### **Provider Endpoints (Provider Role)**
- Service creation and management
- Booking management
- Course creation (if instructor)
- Supply listing (if supplier)
- Rental listing
- Financial management
- Agency membership
- Communication
- Analytics and reporting

### **Admin Endpoints (Admin Role)**
- All CRUD operations
- User management
- System configuration
- Analytics and reporting
- Verification processing
- Payment processing
- Platform management
- App settings management
- Error monitoring and resolution
- Audit log management
- Global activity statistics
- System health monitoring
- Feature flag management
- Security and compliance oversight

---

## **🔒 Security & Middleware Features**

### **Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-factor authentication support
- Session management and timeout
- Password policy enforcement
- Account lockout protection

### **Rate Limiting & Protection**
- Request rate limiting by endpoint type
- IP-based rate limiting
- User-based rate limiting
- Search operation rate limiting
- API key rate limiting
- DDoS protection

### **Security Headers & CORS**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=()
- CORS configuration for cross-origin requests

### **Input Validation & Sanitization**
- Request body validation using Joi schemas
- Parameter validation for all endpoints
- File upload validation and type checking
- SQL injection prevention
- XSS protection
- Input sanitization

### **Audit Logging & Monitoring**
- Comprehensive audit trail for all operations
- Security event logging
- Performance monitoring
- Error tracking and alerting
- User activity tracking
- Financial transaction logging
- System operation logging

### **File Protection & Security**
- Protected file access control
- File modification monitoring
- Backup and recovery systems
- Secure file upload handling
- File type validation
- Size limit enforcement

### **Error Handling & Logging**
- Centralized error handling
- Structured logging with Winston
- Error categorization and severity levels
- Performance metrics collection
- Database operation logging
- API call monitoring

---

## **API Response Formats**

### **Success Response**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {
    "field": "error details"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Paginated Response**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

## **🛠️ Services & Utilities**

### **Core Services**
- **TwilioService**: SMS verification and communication
- **GoogleMapsService**: Geocoding, reverse geocoding, and location services
- **EmailService**: Email notifications and templates
- **CloudinaryService**: Image and file upload management
- **ReminderMemoryService**: File protection and memory management
- **AuditService**: Comprehensive audit logging
- **ReferralService**: Referral system management
- **ProviderVerificationService**: Provider onboarding and verification
- **UsageTrackingService**: Feature usage tracking and analytics
- **ErrorMonitoringService**: Error tracking and alerting

### **Utility Functions**
- **Validation Utilities**: Joi schema validation for all endpoints
- **Logger Utilities**: Structured logging with Winston
- **Audit Logger**: Comprehensive audit trail management
- **File Protection**: Secure file access and monitoring
- **Rate Limiting**: Request throttling and protection
- **Error Handling**: Centralized error management
- **Security Headers**: Security middleware implementation
- **Performance Monitoring**: Request timing and metrics

### **CLI Tools**
- **ReminderMemoryCLI**: Command-line interface for memory management
- **Setup Scripts**: Automated system configuration
- **Database Utilities**: Data management and migration tools
- **Health Check Tools**: System monitoring and diagnostics

### **Integration Services**
- **PayPal Integration**: Payment processing and webhooks
- **PayMaya Integration**: Local payment processing
- **Google Maps Integration**: Location and mapping services
- **Twilio Integration**: SMS and communication services
- **Cloudinary Integration**: Media management and optimization

---

*This comprehensive API endpoint mapping provides a complete reference for all available endpoints in the LocalPro Super App, organized by journey and user role.*
