# Application Architecture

## Overview
The LocalPro Super App is a comprehensive Node.js/Express backend API built with MongoDB, providing a multi-tenant platform for local service providers, clients, and businesses.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│         (Web, Mobile iOS, Mobile Android)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Express.js Server                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                         │   │
│  │  • Authentication (JWT)                              │   │
│  │  • Authorization (Role-based)                        │   │
│  │  • Rate Limiting                                     │   │
│  │  • Request Validation                                │   │
│  │  • Error Handling                                    │   │
│  │  • Logging & Auditing                                │   │
│  │  • Metrics Collection                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Route Handlers                           │   │
│  │  • 29 Feature Routes                                 │   │
│  │  • RESTful Endpoints                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Controllers                              │   │
│  │  • Business Logic                                    │   │
│  │  • Request Processing                                │   │
│  │  • Response Formatting                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Services Layer                           │   │
│  │  • External API Integration                          │   │
│  │  • Business Services                                 │   │
│  │  • Utility Services                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   MongoDB     │ │ Cloudinary│ │  External  │
│   Database    │ │   Storage  │ │   APIs    │
│               │ │            │ │           │
│ • Users       │ │ • Images   │ │ • Twilio  │
│ • Services    │ │ • Files    │ │ • PayPal  │
│ • Bookings    │ │ • Videos   │ │ • PayMaya │
│ • Finance     │ │            │ │ • Maps    │
│ • Logs        │ │            │ │ • Email   │
│ • ...         │ │            │ │           │
└───────────────┘ └────────────┘ └───────────┘
```

## Technology Stack

### Core Framework
- **Runtime**: Node.js
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi, express-validator

### External Services
- **SMS**: Twilio
- **Payments**: PayPal, PayMaya
- **File Storage**: Cloudinary
- **Maps**: Google Maps API
- **Email**: Resend, SendGrid, SMTP

### Monitoring & Logging
- **Logging**: Winston with daily rotate
- **Metrics**: Prometheus
- **Error Tracking**: Custom error monitoring
- **Audit**: Comprehensive audit logging

## Application Structure

```
src/
├── server.js                 # Application entry point
├── config/                   # Configuration files
│   ├── database.js           # MongoDB connection
│   ├── logger.js             # Winston logger setup
│   ├── cloudinary.js         # Cloudinary configuration
│   └── envValidation.js     # Environment validation
├── routes/                   # Route definitions (37 files)
│   ├── auth.js
│   ├── marketplace.js
│   ├── providers.js
│   └── ...
├── controllers/              # Business logic (28 files)
│   ├── authController.js
│   ├── marketplaceController.js
│   └── ...
├── models/                   # Mongoose models (21 files)
│   ├── User.js
│   ├── Marketplace.js
│   ├── Provider.js
│   └── ...
├── middleware/              # Custom middleware (14 files)
│   ├── auth.js              # Authentication
│   ├── authorize.js         # Authorization
│   ├── errorHandler.js      # Error handling
│   ├── rateLimiter.js       # Rate limiting
│   └── ...
├── services/                 # Business services (19 files)
│   ├── emailService.js
│   ├── paypalService.js
│   ├── twilioService.js
│   └── ...
└── utils/                    # Utility functions (10 files)
    ├── helpers.js
    ├── validation.js
    └── ...
```

## Request Flow

```
1. Client Request
   ↓
2. Express Middleware Stack
   ├── Helmet (Security)
   ├── CORS
   ├── Compression
   ├── Morgan (HTTP Logging)
   ├── Request ID
   ├── Rate Limiting
   └── Request Logger
   ↓
3. Route Handler
   ├── Route Validation
   ├── Authentication Check
   ├── Authorization Check
   └── Parameter Validation
   ↓
4. Controller
   ├── Business Logic
   ├── Service Calls
   ├── Database Operations
   └── Response Formatting
   ↓
5. Response
   ├── Success Response
   └── Error Response (if any)
   ↓
6. Error Handler (if error)
   ├── Error Logging
   ├── Audit Logging
   └── Formatted Error Response
```

## Data Flow

### Authentication Flow
```
User → Send Code → Twilio SMS → User Enters Code → 
Verify → JWT Token → Authenticated Requests
```

### Booking Flow
```
Client → Browse Services → Select Service → Create Booking → 
Payment Processing → Booking Confirmed → Service Delivery → 
Review & Rating
```

### Payment Flow
```
Booking Created → Payment Gateway (PayPal/PayMaya) → 
Webhook Received → Payment Verified → Booking Confirmed → 
Funds Transferred
```

## Security Architecture

### Authentication
- JWT-based authentication
- Token expiration and refresh
- Device tracking
- Session management

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Agency-scoped access
- Self-access permissions

### Security Middleware
- Helmet.js (security headers)
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection

## Database Architecture

### Collections
- **Users**: User accounts and profiles
- **Marketplace**: Services and bookings
- **Providers**: Provider profiles
- **Finance**: Transactions and wallets
- **Jobs**: Job postings and applications
- **Academy**: Courses and enrollments
- **Supplies**: Products and orders
- **Rentals**: Rental items and bookings
- **Agencies**: Agency management
- **Communication**: Messages and notifications
- **Logs**: Application logs
- **AuditLogs**: Audit trail
- **AppSettings**: Application configuration

### Relationships
- Users ↔ Providers (one-to-one)
- Users ↔ Agencies (many-to-many)
- Services ↔ Providers (many-to-one)
- Bookings ↔ Services (many-to-one)
- Bookings ↔ Users (many-to-one)

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- MongoDB replica sets
- Load balancer ready
- Session-less authentication

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategies
- Pagination
- Lazy loading

### Monitoring
- Prometheus metrics
- Error tracking
- Performance monitoring
- Database monitoring
- Alert system

## Deployment Architecture

### Production Setup
```
Load Balancer
    ↓
Multiple App Instances (PM2/Cluster)
    ↓
MongoDB Replica Set
    ↓
External Services (Twilio, PayPal, etc.)
```

### Environment Variables
- Configuration via environment variables
- Separate dev/staging/production configs
- Secrets management
- Feature flags

## Integration Points

### External APIs
- **Twilio**: SMS verification
- **PayPal**: Payment processing
- **PayMaya**: Payment processing
- **Google Maps**: Location services
- **Cloudinary**: File storage
- **Email Services**: Notifications

### Webhooks
- PayPal webhooks
- PayMaya webhooks
- Custom webhook handlers

## Error Handling Strategy

### Error Types
- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found**: 404 Not Found
- **Rate Limit**: 429 Too Many Requests
- **Server Errors**: 500 Internal Server Error

### Error Flow
```
Error Occurs → Error Handler → Log Error → 
Audit Log → Format Response → Return to Client
```

## Logging Architecture

### Log Levels
- **error**: Errors requiring attention
- **warn**: Warnings
- **info**: Informational messages
- **debug**: Debug information
- **http**: HTTP requests

### Log Storage
- File-based logging (Winston)
- Database logging (MongoDB)
- Rotating log files
- Log retention policies

## Related Documentation
- [Data Models](DATA_MODELS.md)
- [Configuration Guide](CONFIGURATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Response Formats](API_RESPONSE_FORMATS.md)

