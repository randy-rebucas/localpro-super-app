# LocalPro Super App - Consolidated Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [User Management](#user-management)
5. [Authentication & Security](#authentication--security)
6. [Payment Integration](#payment-integration)
7. [External Services](#external-services)
8. [Setup & Installation](#setup--installation)
9. [Testing & Verification](#testing--verification)
10. [Monitoring & Analytics](#monitoring--analytics)
11. [Role Transitions](#role-transitions)
12. [Business Features](#business-features)
13. [Technical Implementation](#technical-implementation)
14. [Troubleshooting](#troubleshooting)
15. [Future Enhancements](#future-enhancements)

---

## Overview

The LocalPro Super App is a comprehensive platform that connects local service providers with clients through a multi-module ecosystem. It includes marketplace services, job board, learning academy, equipment rental, financial services, and more.

### Key Features
- **Multi-role User System**: Clients, providers, agencies, instructors, suppliers
- **Comprehensive Marketplace**: Service booking, reviews, ratings
- **Learning Academy**: Courses, certifications, skill development
- **Job Board**: Employment opportunities and applications
- **Financial Services**: Loans, salary advances, payment processing
- **Equipment Rental**: Tool and equipment sharing
- **Trust & Verification**: Background checks, document verification
- **Analytics & Reporting**: Business intelligence and insights

---

## System Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Twilio verification
- **File Storage**: Cloudinary
- **Payments**: PayPal + PayMaya
- **Maps**: Google Maps API
- **Email**: Resend API
- **Logging**: Winston
- **Monitoring**: Custom error tracking

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # External service integrations
├── templates/       # Email templates
└── utils/           # Utility functions
```

### Database Collections
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

---

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify phone number
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Marketplace Endpoints
- `GET /api/marketplace/services` - Get all services
- `POST /api/marketplace/services` - Create service (Provider)
- `GET /api/marketplace/services/:id` - Get service details
- `PUT /api/marketplace/services/:id` - Update service (Provider)
- `DELETE /api/marketplace/services/:id` - Delete service (Provider)
- `POST /api/marketplace/bookings` - Create booking (Client)
- `GET /api/marketplace/bookings` - Get user bookings
- `PUT /api/marketplace/bookings/:id` - Update booking
- `POST /api/marketplace/reviews` - Add review (Client)

### Job Board Endpoints
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job (Employer)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (Employer)
- `DELETE /api/jobs/:id` - Delete job (Employer)
- `POST /api/jobs/:id/apply` - Apply for job (Job Seeker)
- `GET /api/jobs/applications` - Get job applications

### Academy Endpoints
- `GET /api/academy/courses` - Get all courses
- `POST /api/academy/courses` - Create course (Instructor)
- `GET /api/academy/courses/:id` - Get course details
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `GET /api/academy/my-courses` - Get user's courses
- `POST /api/academy/certifications` - Create certification

### Financial Services Endpoints
- `POST /api/finance/loans/apply` - Apply for loan
- `GET /api/finance/loans` - Get user loans
- `POST /api/finance/loans/:id/repay` - Repay loan
- `POST /api/finance/salary-advance` - Request salary advance
- `GET /api/finance/transactions` - Get transaction history

### User Management Endpoints
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status
- `PATCH /api/users/:id/verification` - Update verification
- `POST /api/users/:id/badges` - Add user badge
- `GET /api/users/stats` - Get user statistics

### Settings Endpoints
- `GET /api/settings/user` - Get user settings
- `PUT /api/settings/user` - Update user settings
- `GET /api/settings/app` - Get app settings (Admin)
- `PUT /api/settings/app` - Update app settings (Admin)
- `GET /api/settings/app/public` - Get public app settings

### Search Endpoints
- `GET /api/search/global` - Global search
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/popular` - Popular searches
- `GET /api/search/trending` - Trending searches

---

## User Management

### User Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all user management operations |
| **Agency Owner** | Manage users within their agency |
| **Agency Admin** | Manage and view users within their agency |
| **Provider** | View own profile and agency members |
| **Client** | View and update own profile only |
| **Supplier** | View and update own profile only |
| **Instructor** | View and update own profile only |

### User Credentials (Default)

#### Admin Users
- **Email**: admin@localpro.com
- **Phone**: +639179157515
- **Password**: [User-defined during setup]
- **Role**: admin
- **Trust Score**: 100

#### Role-Based Users
- **Client**: client@localpro.com / +639171234569 / Client123!@#
- **Provider**: provider@localpro.com / +639171234570 / Provider123!@#
- **Supplier**: supplier@localpro.com / +639171234571 / Supplier123!@#
- **Instructor**: instructor@localpro.com / +639171234572 / Instructor123!@#
- **Agency Owner**: agency@localpro.com / +639171234568 / Agency123!@#
- **Agency Admin**: agencyadmin@localpro.com / +639171234573 / AgencyAdmin123!@#

### User Model Features
- **Trust Scoring**: Dynamic trust calculation based on verification and activity
- **Badge System**: Achievement badges for different accomplishments
- **Verification Status**: Multi-level verification (phone, email, identity, business)
- **Activity Tracking**: Login history, last activity, performance metrics
- **Referral System**: User referral tracking and rewards
- **Subscription Management**: LocalPro Plus subscription integration

---

## Authentication & Security

### Authentication Flow
1. **Phone Verification**: Send SMS code to phone number
2. **Code Verification**: Verify SMS code
3. **JWT Token**: Generate JWT token for authenticated sessions
4. **Token Refresh**: Automatic token refresh mechanism

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: API rate limiting (100 requests per 15 minutes)
- **Input Validation**: Comprehensive input validation with Joi
- **CORS Protection**: Configured CORS for frontend integration
- **Security Headers**: Helmet.js for security headers
- **Audit Logging**: Complete audit trail for all operations
- **Error Monitoring**: Comprehensive error tracking and reporting

### Password Requirements
- Minimum 8 characters
- Must include uppercase letters
- Must include lowercase letters
- Must include numbers
- Must include special characters

---

## Payment Integration

### PayPal Integration
- **One-time Payments**: Service bookings, product orders
- **Recurring Subscriptions**: LocalPro Plus subscriptions
- **Webhook Handling**: Real-time payment notifications
- **Sandbox Support**: Development and testing environment
- **Production Ready**: Full production deployment support

### PayMaya Integration
- **Checkout API**: One-time payment processing
- **Payment Vault**: Stored payment methods
- **Invoice API**: Invoice generation and management
- **Webhook Support**: Real-time payment notifications
- **Sandbox Testing**: Complete testing environment

### Payment Features
- **Multiple Payment Methods**: Credit card, bank transfer, mobile money, wallet, PayPal
- **Currency Support**: PHP, USD, EUR, GBP, JPY, KRW, CNY
- **Transaction Tracking**: Complete transaction history
- **Refund Processing**: Automated refund handling
- **Payout Management**: Automated provider payouts
- **Fee Management**: Configurable transaction fees

---

## External Services

### Google Maps Integration
- **Geocoding**: Address to coordinates conversion
- **Places Search**: Location-based service discovery
- **Distance Matrix**: Travel time and distance calculations
- **Service Area Validation**: Provider service area verification
- **Route Optimization**: Efficient route planning

### Cloudinary Integration
- **File Upload**: Image and document uploads
- **Image Processing**: Automatic resizing and optimization
- **CDN Delivery**: Fast global content delivery
- **Format Conversion**: Multiple image format support
- **Security**: Secure file access and management

### Email Service (Resend)
- **Transactional Emails**: Booking confirmations, notifications
- **Marketing Emails**: Promotional campaigns
- **Template System**: Customizable email templates
- **Delivery Tracking**: Email delivery status monitoring
- **Unsubscribe Management**: Automatic unsubscribe handling

### SMS Service (Twilio)
- **Verification Codes**: Phone number verification
- **Notifications**: Important system notifications
- **Marketing SMS**: Promotional messages
- **International Support**: Global SMS delivery
- **Delivery Tracking**: SMS delivery status monitoring

---

## Setup & Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager
- **Environment variables** configured

### Quick Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp env.example .env

# 3. Run setup
npm run setup

# 4. Start application
npm run dev
```

### Setup Options

#### Interactive Setup (Recommended)
```bash
npm run setup:install
```
- Guided setup with user prompts
- Secure password input
- Company information collection
- Role-based user creation

#### Automated Setup
```bash
npm run setup:auto admin@company.com +639171234567 AdminPass123! "Company Name"
```
- Non-interactive setup
- Perfect for CI/CD pipelines
- Command-line parameter support

#### Full Setup with Sample Data
```bash
npm run setup
```
- Complete setup with sample data
- Admin users and application settings
- Sample agencies, services, courses
- Ready-to-use test environment

### Environment Configuration
```env
# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# External Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GOOGLE_MAPS_API_KEY=your-google-maps-key
RESEND_API_KEY=your-resend-api-key
```

---

## Testing & Verification

### Test Suite
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete user flow testing
- **Performance Tests**: Load and stress testing

### Verification Process
```bash
# Run verification
npm run verify
```

### Test Results
- ✅ Database connection successful
- ✅ All API endpoints functional
- ✅ External services integrated
- ✅ Authentication system working
- ✅ Payment gateways configured
- ✅ File upload system ready

### Performance Metrics
- **Server Startup**: < 3 seconds
- **API Response Time**: < 500ms average
- **Database Queries**: Optimized with indexes
- **Memory Usage**: Efficient resource utilization

---

## Monitoring & Analytics

### Logging System
- **Winston Logging**: Structured logging with daily rotation
- **HTTP Request Logging**: All API requests logged
- **Error Tracking**: Comprehensive error monitoring
- **Performance Monitoring**: Response time tracking
- **Audit Trail**: Complete operation history

### Analytics Features
- **User Analytics**: User behavior and engagement
- **Business Intelligence**: Revenue and performance metrics
- **Usage Statistics**: API usage and performance
- **Error Analytics**: Error patterns and trends
- **Custom Reports**: Configurable reporting system

### Monitoring Tools
- **Health Checks**: System health monitoring
- **Uptime Monitoring**: Service availability tracking
- **Performance Metrics**: Real-time performance data
- **Alert System**: Automated alert notifications
- **Dashboard**: Real-time monitoring dashboard

---

## Role Transitions

### Supported Transitions

| From Role | To Role | Complexity | Approval Required | Estimated Time |
|-----------|---------|------------|-------------------|----------------|
| Client | Provider | High | Yes | 3-7 days |
| Provider | Agency Owner | Medium | Yes | 1-3 days |
| Provider | Instructor | Medium | Yes | 2-5 days |
| Any | Agency Admin | Low | Yes | 1 day |
| Any | Supplier | Medium | Yes | 2-4 days |
| Any | Admin | High | Yes | 1-2 days |

### Client to Provider Upgrade
8-step onboarding process:
1. **Profile Setup**: Personal information completion
2. **Business Information**: Business name, service areas, specialties
3. **Professional Information**: Experience, skills, certifications
4. **Verification**: Identity, business registration, insurance
5. **Documents**: Required document uploads
6. **Portfolio**: Work samples, testimonials
7. **Preferences**: Service settings, availability, pricing
8. **Review**: Final review and submission

### Agency Management
- **Agency Creation**: Business registration and setup
- **Team Management**: Provider and admin management
- **Commission Tracking**: Revenue and commission management
- **Performance Analytics**: Agency performance metrics

---

## Business Features

### Marketplace Services
- **Service Listings**: Comprehensive service catalog
- **Booking System**: Real-time booking management
- **Review System**: Customer feedback and ratings
- **Pricing Management**: Dynamic pricing and packages
- **Availability Management**: Calendar and scheduling

### Learning Academy
- **Course Management**: Course creation and management
- **Certification System**: Professional certifications
- **Progress Tracking**: Learning progress monitoring
- **Instructor Tools**: Teaching and assessment tools
- **Student Management**: Enrollment and progress tracking

### Job Board
- **Job Postings**: Employment opportunities
- **Application Management**: Job application system
- **Employer Tools**: Job posting and management
- **Candidate Matching**: Skill-based matching
- **Interview Scheduling**: Integrated scheduling system

### Financial Services
- **Loan Management**: Personal and business loans
- **Salary Advances**: Emergency financial assistance
- **Payment Processing**: Secure payment handling
- **Transaction History**: Complete financial records
- **Credit Scoring**: Risk assessment and scoring

### Equipment Rental
- **Inventory Management**: Equipment catalog
- **Rental Booking**: Equipment reservation system
- **Maintenance Tracking**: Equipment maintenance records
- **Availability Management**: Real-time availability
- **Pricing Management**: Rental rate management

### Trust & Verification
- **Background Checks**: Comprehensive background verification
- **Document Verification**: Identity and business document verification
- **Trust Scoring**: Dynamic trust calculation
- **Badge System**: Achievement and recognition system
- **Compliance Management**: Regulatory compliance tracking

---

## Technical Implementation

### API Architecture
- **RESTful Design**: Standard REST API patterns
- **Middleware Stack**: Authentication, validation, error handling
- **Rate Limiting**: API protection and abuse prevention
- **Caching**: Response caching for performance
- **Pagination**: Efficient data pagination

### Database Design
- **MongoDB**: NoSQL document database
- **Schema Design**: Optimized data models
- **Indexing**: Performance-optimized indexes
- **Relationships**: Proper data relationships
- **Data Validation**: Schema validation and constraints

### Security Implementation
- **JWT Tokens**: Secure authentication tokens
- **Password Hashing**: bcrypt password security
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: MongoDB query protection
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery prevention

### Error Handling
- **Centralized Error Handling**: Consistent error responses
- **Error Logging**: Comprehensive error tracking
- **User-Friendly Messages**: Clear error communication
- **Error Recovery**: Automatic error recovery mechanisms
- **Monitoring**: Real-time error monitoring

---

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

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
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

### Reset Setup
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

---

## Future Enhancements

### Planned Features
1. **Mobile App**: Native iOS and Android applications
2. **Real-time Chat**: WebSocket-based messaging system
3. **Video Calls**: Integrated video calling for consultations
4. **AI Recommendations**: Machine learning-based service recommendations
5. **Blockchain Integration**: Decentralized trust and verification
6. **IoT Integration**: Smart device connectivity
7. **Advanced Analytics**: Machine learning insights
8. **Multi-language Support**: Internationalization
9. **API Marketplace**: Third-party API integrations
10. **White-label Solution**: Customizable platform for partners

### Technical Improvements
1. **Microservices Architecture**: Service-oriented architecture
2. **GraphQL API**: Modern API query language
3. **Real-time Updates**: WebSocket and Server-Sent Events
4. **CDN Integration**: Content delivery network for static assets
5. **Load Balancing**: Horizontal scaling support
6. **Containerization**: Docker and Kubernetes support
7. **CI/CD Pipeline**: Automated deployment
8. **Monitoring**: Advanced observability
9. **Security**: Enhanced security measures
10. **Performance**: Optimization and scaling

---

## Support & Documentation

### Documentation Resources
- **API Documentation**: Complete endpoint reference
- **Integration Guides**: Step-by-step integration instructions
- **Code Examples**: Sample code and implementations
- **Video Tutorials**: Visual learning resources
- **Community Forum**: User community support

### Support Channels
- **Email Support**: support@localpro.com
- **Technical Support**: tech-support@localpro.com
- **API Support**: api-support@localpro.com
- **Business Support**: business@localpro.com
- **Emergency Support**: emergency@localpro.com

### Development Resources
- **GitHub Repository**: Source code and issue tracking
- **Postman Collection**: API testing collection
- **SDK Libraries**: Multiple language SDKs
- **Testing Tools**: Comprehensive test suite
- **Development Environment**: Docker and local setup

---

## Conclusion

The LocalPro Super App is a comprehensive, production-ready platform that provides all the necessary tools and features for a modern local service marketplace. With its robust architecture, extensive feature set, and comprehensive documentation, it's ready for both development and production deployment.

The platform includes everything needed to run a successful local service business, from user management and authentication to payment processing and analytics. The modular design allows for easy customization and extension, while the comprehensive documentation ensures smooth development and maintenance.

**Status**: 🎉 **FULLY FUNCTIONAL**  
**Ready for**: Development, Testing, and Production Deployment

---

*This consolidated documentation combines information from all 37 documentation files in the LocalPro Super App project. For specific implementation details, refer to the individual documentation files or the source code.*
