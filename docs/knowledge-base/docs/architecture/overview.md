# Architecture Overview

## System Architecture

LocalPro Super App is built as a **RESTful API** backend that serves multiple client applications (mobile apps, web dashboard, admin panel). The architecture follows a **modular, microservices-ready** design pattern.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Mobile │  │    Web    │  │   Admin   │  │  Partner  │  │
│  │    App   │  │  Dashboard│  │  Panel    │  │    API    │  │
│  └────┬──────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
└───────┼───────────────┼──────────────┼──────────────┼────────┘
        │               │              │              │
        └───────────────┴──────────────┴──────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │      API Gateway / Load Balancer    │
        └─────────────────┬─────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │      Express.js REST API Server     │
        │  ┌──────────────────────────────┐  │
        │  │   Middleware Stack            │  │
        │  │  - Authentication              │  │
        │  │  - Authorization               │  │
        │  │  - Rate Limiting              │  │
        │  │  - Input Validation           │  │
        │  │  - Error Handling             │  │
        │  │  - Logging                    │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │   Route Handlers              │  │
        │  │  - Marketplace                │  │
        │  │  - Bookings                   │  │
        │  │  - Academy                    │  │
        │  │  - Finance                    │  │
        │  │  - ... (20+ features)         │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │   Controllers                 │  │
        │  │  - Business Logic             │  │
        │  │  - Data Validation            │  │
        │  │  - Response Formatting        │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │   Services Layer             │  │
        │  │  - Payment Processing        │  │
        │  │  - Email/SMS Services        │  │
        │  │  - File Upload               │  │
        │  │  - Analytics                 │  │
        │  └──────────────────────────────┘  │
        └─────────────────┬─────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
┌───────┴────────┐  ┌──────────────┐  ┌─────┴────────┐
│   MongoDB      │  │  Cloudinary  │  │  External   │
│   Database     │  │  (File Store)│  │  Services   │
│                │  │               │  │             │
│  - Users       │  │  - Images    │  │  - PayPal   │
│  - Services    │  │  - Videos    │  │  - PayMaya  │
│  - Bookings    │  │  - Documents │  │  - Twilio   │
│  - ...         │  │               │  │  - Google   │
│                │  │               │  │    Maps     │
└────────────────┘  └──────────────┘  └─────────────┘
```

## Technology Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express.js | 4.18+ |
| **Database** | MongoDB | 6.0+ |
| **ODM** | Mongoose | 8.0+ |
| **Authentication** | JWT (jsonwebtoken) | 9.0+ |
| **File Upload** | Multer + Cloudinary | 2.0+ |
| **Validation** | Joi, express-validator | Latest |
| **Logging** | Winston | 3.18+ |
| **Testing** | Jest | 29.7+ |

### External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **PayPal** | Payment processing | PayPal Server SDK |
| **PayMaya** | Payment processing (PH) | PayMaya API |
| **Twilio** | SMS notifications | Twilio SDK |
| **Cloudinary** | Image/video storage | Cloudinary SDK |
| **Google Maps** | Location services | Google Maps API |
| **Resend** | Email delivery | Resend API |

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer           │
│      (Routes / API Endpoints)       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│         Application Layer            │
│      (Controllers / Business Logic)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│         Service Layer                │
│   (External Services Integration)    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│         Data Access Layer            │
│      (Models / Database Queries)     │
└─────────────────────────────────────┘
```

### 2. MVC Pattern

- **Models**: Data schemas and database operations (`src/models/`)
- **Views**: API responses (JSON)
- **Controllers**: Request handling and business logic (`src/controllers/`)

### 3. Middleware Pattern

Request flow through middleware stack:

```
Request → Security Headers → CORS → Rate Limiting → 
Authentication → Authorization → Validation → 
Controller → Service → Database → Response
```

## Directory Structure

```
localpro-super-app/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── cloudinary.js
│   ├── controllers/     # Business logic handlers
│   │   ├── marketplaceController.js
│   │   ├── bookingController.js
│   │   └── ...
│   ├── middleware/      # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── ...
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Service.js
│   │   └── ...
│   ├── routes/          # API route definitions
│   │   ├── marketplace.js
│   │   ├── bookings.js
│   │   └── ...
│   ├── services/        # External service integrations
│   │   ├── paymentService.js
│   │   ├── emailService.js
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   ├── validation.js
│   │   └── ...
│   └── server.js        # Application entry point
├── docs/                # Documentation
├── scripts/            # Utility scripts
├── tests/              # Test files
└── package.json        # Dependencies
```

## Request Flow

### 1. Incoming Request

```
Client Request
    ↓
API Gateway / Load Balancer
    ↓
Express Server
    ↓
Security Middleware (CORS, Helmet, Rate Limiting)
    ↓
Authentication Middleware (JWT Verification)
    ↓
Authorization Middleware (Role Check)
    ↓
Route Handler
    ↓
Controller
    ↓
Service Layer (if needed)
    ↓
Model / Database
    ↓
Response Formatter
    ↓
Client Response
```

### 2. Error Handling Flow

```
Error Occurs
    ↓
Error Handler Middleware
    ↓
Log Error (Winston)
    ↓
Format Error Response
    ↓
Return to Client
```

## Data Flow

### Read Operation (GET)

```
Client → Route → Controller → Model → Database
                                    ↓
Client ← JSON Response ← Controller ← Model
```

### Write Operation (POST/PUT/DELETE)

```
Client → Route → Controller → Validation
                                    ↓
                            Service Layer (if needed)
                                    ↓
                            Model → Database
                                    ↓
                            Audit Log
                                    ↓
Client ← JSON Response ← Controller
```

## Security Architecture

### Authentication Flow

```
1. User sends phone number
   ↓
2. Server generates verification code
   ↓
3. SMS sent via Twilio
   ↓
4. User submits code
   ↓
5. Server validates code
   ↓
6. JWT token generated
   ↓
7. Token returned to client
   ↓
8. Client stores token
   ↓
9. Token included in subsequent requests
```

### Authorization Flow

```
Request with JWT Token
   ↓
Extract token from header
   ↓
Verify token signature
   ↓
Load user from database
   ↓
Check user roles
   ↓
Compare with required roles
   ↓
Allow or Deny access
```

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: No session storage, JWT-based auth
- **Database**: MongoDB supports sharding
- **File Storage**: Cloudinary handles CDN
- **Load Balancing**: Can run multiple instances

### Vertical Scaling

- **Connection Pooling**: MongoDB connection pool
- **Caching**: Can add Redis for caching
- **Database Indexing**: Optimized queries

## Performance Optimizations

1. **Database Indexing**: Strategic indexes on frequently queried fields
2. **Connection Pooling**: MongoDB connection pool management
3. **Response Compression**: Gzip compression enabled
4. **Query Optimization**: Middleware for slow query detection
5. **Rate Limiting**: Prevents abuse and ensures fair usage

## Monitoring & Observability

- **Logging**: Winston with daily rotation
- **Error Tracking**: Error monitoring endpoints
- **Metrics**: Prometheus metrics middleware
- **Audit Logs**: Complete audit trail
- **Health Checks**: Health check endpoints

## Next Steps

- Read [Database Architecture](./database.md)
- Read [Authentication Architecture](./authentication.md)
- Read [Security Architecture](./security.md)
- Read [API Design](./api-design.md)

