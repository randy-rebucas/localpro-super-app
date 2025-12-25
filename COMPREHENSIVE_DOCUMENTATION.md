# LocalPro Super App - Comprehensive Technical Documentation

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Services & Integrations](#services--integrations)
8. [Authentication & Security](#authentication--security)
9. [Configuration](#configuration)
10. [Development Guidelines](#development-guidelines)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Monitoring & Logging](#monitoring--logging)

---

## Executive Summary

**LocalPro Super App** is a comprehensive Node.js backend API for a multi-sided marketplace platform connecting local service providers with customers. The platform serves as a centralized ecosystem for service bookings, job postings, learning courses, financial services, equipment rentals, and more.

### Key Statistics
- **Total Models**: 47+ database models
- **Total Routes**: 46+ route modules
- **Total Controllers**: 36+ controllers
- **Total Services**: 28+ service modules
- **Total Middleware**: 17+ middleware modules
- **API Endpoints**: 200+ endpoints
- **User Roles**: 8 distinct roles (client, provider, admin, supplier, instructor, agency_owner, agency_admin, partner)

---

## Tech Stack

### Core Technologies

#### Runtime & Framework
- **Node.js**: JavaScript runtime environment
- **Express.js 4.18.2**: Web application framework
- **MongoDB 6.0+**: NoSQL database
- **Mongoose 8.0.3**: MongoDB object modeling

#### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)**: Token-based authentication
- **bcryptjs 2.4.3**: Password hashing
- **helmet 7.1.0**: Security headers
- **cors 2.8.5**: Cross-origin resource sharing
- **express-rate-limit 7.1.5**: Rate limiting

#### Validation & Data Handling
- **Joi 17.11.0**: Schema validation
- **express-validator 7.0.1**: Request validation
- **uuid 9.0.1**: Unique identifier generation

#### Payment Processing
- **@paypal/paypal-server-sdk 1.1.0**: PayPal integration
- **PayMaya API**: Philippines payment processing
- **PayMongo**: Alternative payment gateway

#### Communication Services
- **Twilio 4.19.0**: SMS verification and messaging
- **nodemailer 7.0.9**: Email service (SMTP)
- **resend 6.1.2**: Modern email API
- **SendGrid**: Email service provider

#### File Storage
- **Cloudinary 2.8.0**: Image and file upload service
- **multer 2.0.2**: File upload middleware
- **multer-storage-cloudinary 2.2.1**: Cloudinary integration

#### Location Services
- **@googlemaps/google-maps-services-js 3.4.2**: Google Maps integration
  - Geocoding API
  - Places API
  - Distance Matrix API
  - Reverse Geocoding

#### Real-time Communication
- **ws 8.18.3**: WebSocket server for live chat

#### Logging & Monitoring
- **winston 3.18.3**: Logging library
- **winston-daily-rotate-file 5.0.0**: Log rotation
- **express-winston 4.2.0**: Express logging
- **morgan 1.10.0**: HTTP request logger
- **express-prometheus-middleware 1.2.0**: Prometheus metrics
- **prom-client 13.2.0**: Prometheus client

#### Utilities
- **axios 1.12.2**: HTTP client
- **compression 1.8.1**: Response compression
- **dotenv 16.3.1**: Environment variables
- **systeminformation 5.27.11**: System monitoring

### Development Tools

#### Testing
- **Jest 29.7.0**: Testing framework
- **supertest 6.3.3**: HTTP assertion library
- **node-mocks-http 1.17.2**: HTTP mocking

#### Code Quality
- **ESLint 8.57.1**: Linting
- **@eslint/js 9.38.0**: ESLint configuration
- **nodemon 3.0.2**: Development auto-reload

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Mobile App, Web App, Admin Dashboard)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS + WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Express.js Server                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                     │   │
│  │  - Authentication (JWT)                               │   │
│  │  - Rate Limiting                                      │   │
│  │  - Request Validation                                 │   │
│  │  - Logging & Monitoring                               │   │
│  │  - Error Handling                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Route Layer                                          │   │
│  │  - 46+ Route Modules                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controller Layer                                      │   │
│  │  - 36+ Controllers                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Layer                                        │   │
│  │  - Business Logic                                     │   │
│  │  - External API Integration                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Mongoose ODM
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    MongoDB Database                          │
│  - 47+ Collections                                           │
│  - Indexed for Performance                                   │
│  - Replicated for High Availability                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Services & Integrations                │
│  - Twilio (SMS)                                              │
│  - PayPal (Payments)                                         │
│  - PayMaya (Payments)                                        │
│  - Google Maps (Location)                                    │
│  - Cloudinary (File Storage)                                 │
│  - Email Services (Resend, SendGrid, SMTP)                   │
└─────────────────────────────────────────────────────────────┘
```

### Application Layers

1. **Presentation Layer**: API endpoints (REST + WebSocket)
2. **Application Layer**: Controllers handling business logic
3. **Service Layer**: Reusable business services
4. **Data Access Layer**: Mongoose models and database operations
5. **Integration Layer**: External service integrations

### Design Patterns

- **MVC (Model-View-Controller)**: Clear separation of concerns
- **Service Layer Pattern**: Business logic abstraction
- **Repository Pattern**: Data access abstraction (via Mongoose)
- **Middleware Pattern**: Cross-cutting concerns
- **Factory Pattern**: Service creation and initialization
- **Singleton Pattern**: Database connections, logger instances

---

## Project Structure

```
localpro-super-app/
├── src/
│   ├── __tests__/              # Test files
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── setup.js           # Test setup
│   │
│   ├── config/                 # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   ├── logger.js           # Winston logger setup
│   │   ├── cloudinary.js      # Cloudinary configuration
│   │   ├── envValidation.js   # Environment validation
│   │   ├── databaseTransport.js # Database logging transport
│   │   └── databaseLogTransport.js # Log transport
│   │
│   ├── controllers/           # Request handlers (36 files)
│   │   ├── authController.js
│   │   ├── marketplaceController.js
│   │   ├── jobController.js
│   │   ├── referralController.js
│   │   ├── agencyController.js
│   │   ├── providerController.js
│   │   ├── userManagementController.js
│   │   └── ... (30+ more)
│   │
│   ├── middleware/            # Express middleware (17 files)
│   │   ├── auth.js            # JWT authentication
│   │   ├── authorize.js       # Role-based authorization
│   │   ├── errorHandler.js    # Error handling
│   │   ├── rateLimiter.js     # Rate limiting
│   │   ├── auditLogger.js     # Audit logging
│   │   ├── activityTracker.js # Activity tracking
│   │   └── ... (11+ more)
│   │
│   ├── models/                # Mongoose models (47 files)
│   │   ├── User.js
│   │   ├── Marketplace.js
│   │   ├── Job.js
│   │   ├── Provider.js
│   │   ├── Agency.js
│   │   └── ... (42+ more)
│   │
│   ├── routes/                # API routes (46 files)
│   │   ├── auth.js
│   │   ├── marketplace.js
│   │   ├── jobs.js
│   │   ├── providers.js
│   │   └── ... (42+ more)
│   │
│   ├── services/              # Business logic services (28 files)
│   │   ├── emailService.js
│   │   ├── twilioService.js
│   │   ├── paypalService.js
│   │   ├── paymayaService.js
│   │   ├── googleMapsService.js
│   │   ├── referralService.js
│   │   └── ... (22+ more)
│   │
│   ├── utils/                 # Utility functions (11 files)
│   │   ├── validation.js
│   │   ├── helpers.js
│   │   ├── responseHelper.js
│   │   └── ... (8+ more)
│   │
│   ├── seeders/               # Database seeders
│   │   ├── serviceCategoriesAndSkillsSeeder.js
│   │   ├── jobCategorySeeder.js
│   │   └── subscriptionPlansSeeder.js
│   │
│   ├── templates/             # Email templates
│   │   ├── email/            # HTML email templates
│   │   └── monitoring-dashboard.html
│   │
│   └── server.js              # Application entry point
│
├── docs/                      # Documentation
│   ├── api/                  # API documentation
│   ├── features/             # Feature documentation
│   └── roles/                # Role-based documentation
│
├── features/                  # Feature documentation
│   ├── marketplace/
│   ├── jobs/
│   ├── referrals/
│   └── ... (20+ feature folders)
│
├── scripts/                   # Utility scripts
│   ├── create-database-indexes.js
│   ├── migrate-pagination.js
│   └── ... (5+ more)
│
├── logs/                      # Application logs
├── coverage/                  # Test coverage reports
├── backups/                   # Database backups
│
├── package.json               # Dependencies and scripts
├── eslint.config.mjs         # ESLint configuration
├── env.example               # Environment variables template
├── README.md                 # Main documentation
└── WEB_APP_LAYOUT_PROPOSAL.md # Frontend layout proposal
```

---

## Database Models

### Core Models (47+ Total)

#### User Management
- **User**: Core user model with roles, profile, authentication
- **UserSettings**: User preferences and configuration
- **UserActivity**: User activity tracking
- **UserReferral**: Referral system integration
- **UserWallet**: Digital wallet for users
- **UserTrust**: Trust and verification scores
- **UserManagement**: Administrative user management
- **UserAgency**: Agency membership tracking

#### Provider System
- **Provider**: Provider profiles and information
- **ProviderProfessionalInfo**: Professional details and specialties
- **ProviderBusinessInfo**: Business information
- **ProviderFinancialInfo**: Financial details
- **ProviderVerification**: Verification documents and status
- **ProviderPerformance**: Performance metrics and analytics
- **ProviderPreferences**: Provider preferences
- **ProviderSkill**: Provider skills and certifications

#### Marketplace & Services
- **Marketplace**: Service listings and bookings
- **ServiceCategory**: Service categories and subcategories
- **Supplies**: Supply items and inventory
- **Rentals**: Rental items and bookings
- **FacilityCare**: Facility care services

#### Job Board
- **Job**: Job postings and applications
- **JobCategory**: Job categories

#### Financial Services
- **Finance**: Financial transactions and records
- **Payout**: Payout requests and processing
- **WalletTransaction**: Wallet transaction history
- **Escrow**: Escrow accounts and transactions
- **EscrowTransaction**: Escrow transaction details

#### Learning & Academy
- **Academy**: Courses and enrollments

#### Communication
- **Communication**: Conversations and messages
- **LiveChat**: Live chat sessions
- **Notification**: User notifications

#### Business Features
- **Agency**: Agency management
- **Referral**: Referral tracking and rewards
- **Partner**: Partner management
- **Ads**: Advertising campaigns
- **LocalProPlus**: Subscription plans and subscriptions

#### Trust & Verification
- **TrustVerification**: Verification requests and documents

#### System & Analytics
- **Analytics**: Analytics events and tracking
- **Log**: Application logs (database storage)
- **AppSettings**: Global application settings
- **Announcement**: System announcements
- **Activity**: Activity feed
- **Favorite**: User favorites
- **Broadcaster**: Broadcast messages

#### Email Marketing
- **EmailCampaign**: Email marketing campaigns
- **EmailSubscriber**: Email subscription list
- **EmailAnalytics**: Email analytics

### Database Indexes

The application uses comprehensive indexing for performance:
- User phone numbers and emails
- Service categories and locations
- Job categories and locations
- Provider specialties and service areas
- Booking statuses and dates
- Transaction references
- Search indexes for full-text search

---

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/send-code` - Send SMS verification code
- `POST /api/auth/verify-code` - Verify code and login/register
- `POST /api/auth/complete-onboarding` - Complete user onboarding
- `GET /api/auth/profile-completeness` - Check profile completeness
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/upload-avatar` - Upload profile avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio images
- `POST /api/auth/logout` - Logout user

### Marketplace Endpoints (20+)
- Service CRUD operations
- Booking management
- Reviews and ratings
- Location-based search
- Payment processing

### Job Board Endpoints (15+)
- Job posting management
- Application tracking
- Company profiles
- Job analytics

### Provider System Endpoints (10+)
- Provider profile management
- Onboarding workflow
- Document upload
- Dashboard analytics

### User Management Endpoints (10+)
- User CRUD operations
- Status management
- Verification management
- Badge system
- Bulk operations

### Referral System Endpoints (12+)
- Referral tracking
- Reward management
- Leaderboard
- Analytics

### Agency Management Endpoints (12+)
- Agency CRUD
- Provider management
- Commission tracking
- Analytics

### Financial Services Endpoints (15+)
- Transaction management
- Wallet operations
- Payout requests
- Loan management
- Salary advances

### Communication Endpoints (10+)
- Conversations
- Messages
- Notifications
- Live chat

### Search & Discovery Endpoints (10+)
- Global search
- Entity-specific search
- Search suggestions
- Popular searches

### Additional Modules
- **Academy**: Course management and enrollments
- **Supplies**: Supply catalog and orders
- **Rentals**: Rental items and bookings
- **Ads**: Advertising campaigns
- **FacilityCare**: Facility care services
- **LocalPro Plus**: Subscription management
- **Trust Verification**: Verification requests
- **Analytics**: Analytics tracking
- **Maps**: Location services
- **PayPal**: Payment processing
- **PayMaya**: Payment processing
- **Settings**: User and app settings
- **Error Monitoring**: Error tracking
- **Audit Logs**: Audit trail
- **Logs**: Log management
- **Announcements**: System announcements
- **Activities**: Activity feed
- **Favorites**: User favorites
- **Partners**: Partner management
- **Email Marketing**: Email campaigns

**Total API Endpoints: 200+**

---

## Services & Integrations

### Core Services (28 Services)

#### Communication Services
1. **emailService.js**: Multi-provider email service (Resend, SendGrid, SMTP)
2. **twilioService.js**: SMS verification and messaging
3. **notificationService.js**: Multi-channel notifications
4. **liveChatWebSocketService.js**: WebSocket for live chat

#### Payment Services
5. **paypalService.js**: PayPal payment processing
6. **paypalSubscriptionService.js**: PayPal subscription management
7. **paymayaService.js**: PayMaya payment processing
8. **paymongoService.js**: PayMongo integration
9. **escrowService.js**: Escrow account management

#### Location Services
10. **googleMapsService.js**: Google Maps integration
    - Geocoding
    - Reverse geocoding
    - Places search
    - Distance calculations
    - Service area validation

#### Business Logic Services
11. **referralService.js**: Referral tracking and rewards
12. **providerDashboardService.js**: Provider analytics
13. **providerVerificationService.js**: Provider verification
14. **analyticsService.js**: Analytics tracking
15. **activityService.js**: Activity feed management
16. **emailMarketingService.js**: Email campaign management

#### System Services
17. **loggerService.js**: Enhanced logging
18. **logManagementService.js**: Log management and cleanup
19. **errorMonitoringService.js**: Error tracking and alerting
20. **auditService.js**: Audit logging
21. **automatedBackupService.js**: Automated database backups
22. **databaseOptimizationService.js**: Database optimization
23. **databasePerformanceMonitor.js**: Performance monitoring
24. **queryOptimizationService.js**: Query optimization
25. **paginationService.js**: Pagination utilities
26. **usageTrackingService.js**: Usage tracking
27. **aiService.js**: AI-powered features
28. **cloudinaryService.js**: File upload and management

### External Integrations

#### Payment Gateways
- **PayPal**: One-time and recurring payments
- **PayMaya**: Philippines payment processing
- **PayMongo**: Alternative payment gateway

#### Communication
- **Twilio**: SMS verification and messaging
- **Resend**: Modern email API
- **SendGrid**: Email service provider
- **SMTP**: Generic SMTP support

#### Location Services
- **Google Maps APIs**:
  - Geocoding API
  - Places API
  - Distance Matrix API
  - Reverse Geocoding API

#### File Storage
- **Cloudinary**: Image and file storage
- **AWS S3**: Alternative storage (configured but not primary)

---

## Authentication & Security

### Authentication Flow

1. **SMS Verification**:
   - User requests verification code
   - System sends code via Twilio (or mock in development)
   - User submits code for verification
   - System validates and issues JWT token

2. **JWT Token Structure**:
   ```json
   {
     "userId": "user_id",
     "phoneNumber": "+1234567890",
     "roles": ["client", "provider"],
     "isActive": true,
     "onboardingCompleted": true,
     "iat": 1234567890,
     "exp": 1234567890
   }
   ```

3. **Token Validation**:
   - Middleware validates token on protected routes
   - Checks user status and permissions
   - Attaches user object to request

### Security Features

#### Authentication Security
- JWT-based stateless authentication
- SMS-based phone verification
- Device tracking and session management
- Password-free authentication (phone-based)
- Token expiration and refresh

#### Authorization
- Role-based access control (RBAC)
- 8 distinct user roles
- Permission-based route protection
- Resource-level authorization

#### Input Validation
- Joi schema validation
- Express-validator middleware
- ObjectId validation
- Phone number validation
- Email validation

#### Security Headers
- Helmet.js for security headers
- CORS configuration
- XSS protection
- CSRF protection
- Content Security Policy

#### Rate Limiting
- General API rate limiting (100 req/15min)
- Marketplace-specific limits
- IP-based limiting
- User-based limiting

#### Data Protection
- Sensitive data redaction in logs
- Audit logging for compliance
- Secure password hashing (bcrypt)
- Token-based authentication
- Secure file upload validation

---

## Configuration

### Environment Variables

#### Server Configuration
```env
NODE_ENV=development|production
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Database
```env
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
```

#### Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-here
```

#### Twilio (SMS)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### Payment Gateways
```env
# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox|production
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id

# PayMaya
PAYMAYA_PUBLIC_KEY=your-paymaya-public-key
PAYMAYA_SECRET_KEY=your-paymaya-secret-key
PAYMAYA_MODE=sandbox|production
PAYMAYA_WEBHOOK_SECRET=your-paymaya-webhook-secret
```

#### Email Services
```env
# Option 1: Resend (Recommended)
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=resend

# Option 2: SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_SERVICE=sendgrid

# Option 3: SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
EMAIL_SERVICE=smtp
```

#### File Storage
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# AWS S3 (Alternative)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1
```

#### Google Maps
```env
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_GEOCODING_API_KEY=your-google-maps-geocoding-api-key
GOOGLE_MAPS_PLACES_API_KEY=your-google-maps-places-api-key
GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your-google-maps-distance-matrix-api-key
```

#### Logging
```env
LOG_LEVEL=info|debug|warn|error
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_HTTP_REQUESTS=true
LOG_SLOW_REQUESTS_THRESHOLD=2000
LOG_DATABASE_ENABLED=true
LOG_BATCH_SIZE=100
LOG_FLUSH_INTERVAL=5000
```

#### Error Monitoring
```env
ERROR_MONITORING_ENABLED=true
ERROR_ALERT_THRESHOLDS_CRITICAL=1
ERROR_ALERT_THRESHOLDS_HIGH=5
ERROR_ALERT_THRESHOLDS_MEDIUM=10
ERROR_ALERT_THRESHOLDS_LOW=20
```

#### Audit Logging
```env
AUDIT_LOGGING_ENABLED=true
AUDIT_RETENTION_DAYS=2555
AUDIT_LOG_SENSITIVE_DATA=false
AUDIT_LOG_REQUEST_BODY=false
AUDIT_LOG_RESPONSE_BODY=false
AUDIT_AUTO_CLEANUP=true
AUDIT_CLEANUP_SCHEDULE=0 2 * * *
```

#### Automated Services
```env
ENABLE_AUTOMATED_BACKUPS=true
BACKUP_RETENTION_DAYS=7
BACKUP_RETENTION_WEEKS=4
BACKUP_RETENTION_MONTHS=12
BACKUP_UPLOAD_TO_CLOUD=false

ENABLE_AUTOMATED_CLEANUP=true
LOG_RETENTION_DAYS=30
ERROR_LOG_RETENTION_DAYS=90
HTTP_LOG_RETENTION_DAYS=14
DB_LOG_RETENTION_DAYS=30
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Development Guidelines

### Code Structure

#### Controllers
- Handle HTTP requests and responses
- Validate input using middleware
- Call services for business logic
- Return standardized responses
- Handle errors appropriately

#### Services
- Contain business logic
- Reusable across controllers
- Handle external API calls
- Database operations
- Error handling

#### Models
- Define database schemas
- Include validation rules
- Define relationships
- Include indexes for performance

#### Middleware
- Authentication and authorization
- Request validation
- Error handling
- Logging and monitoring
- Rate limiting

### Coding Standards

#### Naming Conventions
- **Files**: camelCase (e.g., `userController.js`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Models**: PascalCase (e.g., `User`, `Marketplace`)

#### Error Handling
- Use try-catch blocks
- Return standardized error responses
- Log errors appropriately
- Use error monitoring service

#### Validation
- Validate all inputs
- Use Joi schemas for complex validation
- Validate ObjectIds
- Sanitize user inputs

#### Database Operations
- Use transactions for multi-document operations
- Index frequently queried fields
- Use pagination for large datasets
- Optimize queries

#### Testing
- Write unit tests for services
- Write integration tests for APIs
- Maintain test coverage
- Use test fixtures

### Best Practices

1. **Security**
   - Never log sensitive data
   - Validate all inputs
   - Use parameterized queries
   - Implement rate limiting
   - Use HTTPS in production

2. **Performance**
   - Use database indexes
   - Implement pagination
   - Cache frequently accessed data
   - Optimize database queries
   - Use connection pooling

3. **Maintainability**
   - Write clear, documented code
   - Follow DRY principles
   - Use consistent error handling
   - Write meaningful commit messages
   - Keep functions small and focused

4. **Scalability**
   - Design for horizontal scaling
   - Use stateless authentication
   - Implement caching strategies
   - Optimize database queries
   - Use message queues for async tasks

---

## Deployment

### Prerequisites
- Node.js 14+ installed
- MongoDB 4.4+ running
- Environment variables configured
- External service accounts set up

### Deployment Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd localpro-super-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with production values
   ```

4. **Run Setup Script**
   ```bash
   npm run setup
   ```

5. **Start Application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Production Considerations

#### Environment Variables
- Set all required environment variables
- Use secure secrets management
- Never commit secrets to repository

#### Database
- Use MongoDB Atlas or managed MongoDB
- Configure connection pooling
- Set up database backups
- Enable SSL/TLS connections

#### Security
- Use HTTPS
- Configure CORS properly
- Enable rate limiting
- Set up firewall rules
- Use environment-specific secrets

#### Monitoring
- Set up application monitoring
- Configure error alerting
- Monitor database performance
- Track API usage
- Set up log aggregation

#### Scaling
- Use load balancers
- Implement horizontal scaling
- Use database replicas
- Implement caching layer
- Use CDN for static assets

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Checks

The application provides health check endpoints:
- `GET /health` - Overall system health
- `GET /api/settings/app/health` - App health status

---

## Testing

### Test Structure

```
src/__tests__/
├── unit/              # Unit tests
│   ├── config/       # Config tests
│   ├── middleware/   # Middleware tests
│   ├── services/     # Service tests
│   └── utils/        # Utility tests
├── integration/      # Integration tests
└── setup.js          # Test setup
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run in CI mode
npm run test:ci
```

### Test Coverage

- Current coverage threshold: 0% (configurable)
- Aim for 80%+ coverage
- Focus on critical paths
- Test error scenarios

---

## Monitoring & Logging

### Logging System

#### Winston Logger
- Multi-level logging (info, warn, error, debug)
- Daily log rotation
- File-based logging
- Database logging (optional)
- Structured JSON format

#### Log Levels
- **error**: Errors that need immediate attention
- **warn**: Warnings and potential issues
- **info**: General information
- **debug**: Detailed debugging information

#### Log Storage
- File logs: `logs/` directory
- Database logs: MongoDB `logs` collection
- Log rotation: Daily files with retention
- Log cleanup: Automated cleanup of old logs

### Error Monitoring

#### Features
- Automatic error capture
- Error categorization
- Severity levels (critical, high, medium, low)
- Alert thresholds
- Error resolution tracking
- Error analytics

#### Error Categories
- Application errors
- Database errors
- External API errors
- Validation errors
- Authentication errors

### Audit Logging

#### Features
- Complete audit trail
- User action tracking
- System change logging
- Compliance support (GDPR, SOX, HIPAA)
- Data protection
- Export capabilities

#### Audit Categories
- Authentication
- Authorization
- Financial operations
- User management
- System configuration
- Data access

### Performance Monitoring

#### Metrics Tracked
- Request response times
- Database query performance
- External API response times
- Error rates
- API usage statistics
- System resource usage

#### Monitoring Endpoints
- `GET /api/monitoring` - System metrics
- `GET /api/monitoring/database` - Database metrics
- `GET /api/monitoring/stream` - Real-time metrics stream

### Database Monitoring

#### Features
- Query performance tracking
- Slow query detection
- Index usage analysis
- Connection pool monitoring
- Database health checks

---

## Additional Features

### AI-Powered Features
- AI marketplace recommendations
- AI user insights
- Smart search suggestions

### Live Chat
- WebSocket-based real-time chat
- Admin chat management
- Chat session tracking

### Email Marketing
- Campaign management
- Subscriber management
- Email analytics
- Template system

### Escrow System
- Secure payment escrow
- Transaction management
- Webhook integration

### Activity Feed
- User activity tracking
- Activity feed generation
- Social features

### Favorites System
- User favorites management
- Quick access to saved items

### Partner Management
- Partner onboarding
- Partner analytics
- Commission tracking

---

## API Documentation

### Postman Collection
- Complete API collection available
- All endpoints documented
- Example requests and responses
- Environment variables

### API Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error code",
  "details": { ... }
}
```

### Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## Support & Resources

### Documentation
- Main README: `README.md`
- Feature Documentation: `features/` directory
- API Documentation: `docs/api/` directory
- Role Documentation: `docs/roles/` directory

### Contact
- Support: api-support@localpro.com
- Technical: tech@localpro.com
- Business: business@localpro.com

### Additional Resources
- Postman Collection: Available at `/LocalPro-Super-App-API.postman_collection.json`
- Health Check: `GET /health`
- API Info: `GET /`

---

## Version Information

- **Application Version**: 1.0.0
- **Node.js Version**: 14+ (recommended 18+)
- **MongoDB Version**: 4.4+ (recommended 6.0+)
- **Express Version**: 4.18.2
- **Mongoose Version**: 8.0.3

---

## License

This project is licensed under the MIT License.

---

**Document Generated**: 2024
**Last Updated**: Based on current codebase analysis
**Maintained By**: LocalPro Development Team

