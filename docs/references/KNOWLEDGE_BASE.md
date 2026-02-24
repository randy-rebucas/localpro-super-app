# LocalPro Super App - Backend Knowledge Base

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Authentication & Security](#authentication--security)
5. [Core Features](#core-features)
6. [API Endpoints](#api-endpoints)
7. [Database Models](#database-models)
8. [User Journeys](#user-journeys)
9. [Services & Integrations](#services--integrations)
10. [Background Jobs](#background-jobs)
11. [Middleware](#middleware)

---

## Overview

LocalPro Super App is a comprehensive **multi-tenant marketplace platform** built with Node.js/Express and MongoDB. It provides a full-featured service marketplace connecting clients with service providers, supporting agencies, job boards, learning academies, and more.

### Technology Stack
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, API Keys, OTP (SMS/Email), MPIN
- **Real-time**: WebSocket for live chat
- **File Storage**: Cloudinary
- **Payments**: PayPal, PayMaya, PayMongo
- **SMS/Calls**: Twilio
- **Email**: Resend, Nodemailer
- **Documentation**: Swagger/OpenAPI

### Key Statistics
- **62 Route modules** covering all features
- **72 Database models** with complex relationships
- **76 Services** including 30+ automated background services
- **21 Middleware components**
- **50+ Controllers**

---

## Architecture

### Project Structure
```
src/
├── server.js              # Main entry point
├── config/                # Configuration files
│   ├── database.js        # MongoDB connection
│   ├── logger.js          # Winston logging
│   ├── swagger.js         # API documentation
│   └── cloudinary.js      # File upload config
├── routes/                # API route definitions (62 files)
├── controllers/           # Business logic handlers (50+ files)
├── models/                # MongoDB schemas (72 files)
├── middleware/            # Request processing (21 files)
├── services/              # Business services (76 files)
├── utils/                 # Helper utilities (11 files)
└── seeders/               # Database seeders
```

### Request Flow
```
Client Request
    ↓
Helmet (Security Headers)
    ↓
CORS (Cross-Origin)
    ↓
Compression
    ↓
Body Parser
    ↓
Request ID & Correlation
    ↓
Rate Limiting
    ↓
Request Logger
    ↓
Metrics Collection
    ↓
Audit Logger
    ↓
Activity Tracker
    ↓
Authentication Middleware
    ↓
Authorization (Role Check)
    ↓
Route Validation
    ↓
Controller (Business Logic)
    ↓
Error Handler
    ↓
Response
```

---

## User Roles & Permissions

### Available Roles
| Role | Description |
|------|-------------|
| `client` | Default role - can book services, apply for jobs |
| `provider` | Service providers - can offer services, accept bookings |
| `admin` | Platform administrators - full system access |
| `supplier` | Supplies/inventory managers |
| `instructor` | Academy course instructors |
| `agency_owner` | Agency business owners |
| `agency_admin` | Agency administrators/managers |
| `partner` | External partners with API access |
| `staff` | Internal staff members |

### Role Hierarchy
- Every user has the `client` role by default (always present)
- Users can have multiple roles simultaneously
- `admin` role has highest privileges
- Agency roles (`agency_owner`, `agency_admin`) provide multi-tenant access

### Permission System
- Granular permission-based access control
- Staff permissions managed via `StaffPermission` model
- Agency-scoped permissions for multi-tenant isolation

---

## Authentication & Security

### Authentication Methods

#### 1. Phone Number + OTP (Primary)
```
Flow:
1. User submits phone number
2. System sends 6-digit OTP via Twilio SMS
3. User verifies OTP (5-minute expiration)
4. System issues JWT access + refresh tokens
```

#### 2. Email + OTP
```
Flow:
1. User submits email address
2. System sends 6-digit OTP via email
3. User verifies OTP (10-minute expiration)
4. System issues tokens
```

#### 3. MPIN (Mobile PIN)
```
Features:
- 4-6 digit PIN for quick authentication
- 5 failed attempts = 15-minute lockout
- Used for returning user quick-login
```

#### 4. API Key Authentication
```
Headers:
- X-API-Key: <api_key>
- X-API-Secret: <api_secret>

Used for: Partner integrations, external API access
```

#### 5. Access Token (Bearer)
```
Header: Authorization: Bearer <access_token>

Features:
- OAuth-style revocable tokens
- Scope-based permissions
- Database-backed for revocation
```

### Token Management
| Token Type | Expiration | Storage |
|------------|------------|---------|
| Access Token | 15 minutes | Client-side |
| Refresh Token | 7 days | User document |
| API Key | No expiration | ApiKey collection |

### Security Features
- Password hashing with bcryptjs (cost factor: 10)
- Rate limiting per endpoint
- Request correlation for distributed tracing
- Audit logging for all sensitive operations
- Helmet security headers
- CORS with allowed origins management

---

## Core Features

### 1. Service Marketplace
- Service listings with 22 categories
- Geolocation-based service discovery
- Booking management with status tracking
- Reviews and ratings system
- Before/after photo documentation
- Service packages and add-ons

### 2. Job Board
- Job postings with detailed requirements
- Application tracking workflow
- Interview scheduling
- Candidate management
- Job categories and filtering

### 3. Escrow System
- Secure payment holding
- Proof of work submission
- Client approval workflow
- Dispute resolution
- Automated payouts

### 4. Agency Management
- Multi-tenant organization support
- Provider management under agencies
- Commission rate configuration
- Performance tracking per agency
- Admin/manager role hierarchy

### 5. Learning Academy
- Course management
- Certifications
- Progress tracking
- Engagement automation

### 6. Real-time Communication
- Live chat via WebSocket
- Messaging system
- Masked calling (privacy protection)
- Push notifications (FCM)

### 7. Financial Management
- Multi-gateway payments (PayPal, PayMaya, PayMongo)
- Wallet system
- Invoice/quote generation
- Payout management

### 8. AI Operating System
- AI Bot with specialized sub-agents
- Analytics, booking, payment, support agents
- Automated task handling

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register with phone number |
| POST | `/register-email` | Register with email/password |
| POST | `/send-code` | Send phone verification code |
| POST | `/verify-code` | Verify phone code (returns tokens) |
| POST | `/verify` | Verify OTP code |
| POST | `/login` | Login with credentials |
| POST | `/login-email` | Login with email/password |
| POST | `/refresh` | Refresh JWT token |
| POST | `/logout` | Invalidate tokens |
| POST | `/mpin/set` | Set MPIN |
| POST | `/mpin/login` | Login with MPIN |
| POST | `/mpin/verify` | Verify MPIN |
| POST | `/email/send-otp` | Send email OTP |
| POST | `/email/verify` | Verify email OTP |
| GET  | `/me` | Get current user profile |
| PUT  | `/profile` | Update user profile |
| POST | `/avatar` | Upload user avatar |

### Marketplace (`/api/marketplace`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services` | List all services |
| GET | `/services/:id` | Get service details |
| POST | `/services` | Create service (provider) |
| PUT | `/services/:id` | Update service |
| DELETE | `/services/:id` | Delete service |
| POST | `/bookings` | Create booking |
| GET | `/bookings` | List user bookings |
| PUT | `/bookings/:id/status` | Update booking status |
| POST | `/bookings/:id/review` | Submit review |

### Jobs (`/api/jobs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/` | List jobs |
| GET    | `/categories` | List job categories |
| GET    | `/featured` | List featured jobs |
| GET    | `/urgent` | List urgent jobs |
| GET    | `/remote` | List remote jobs |
| GET    | `/nearby` | List nearby jobs |
| GET    | `/search` | Search jobs with filters |
| GET    | `/slug/:slug` | Get job by slug |
| GET    | `/number/:jobNumber` | Get job by job number |
| GET    | `/:id` | Get job details |
| POST   | `/` | Create job posting |
| PUT    | `/:id` | Update job |
| DELETE | `/:id` | Delete job |
| POST   | `/:id/publish` | Publish a draft job |
| POST   | `/:id/pause` | Pause an active job |
| POST   | `/:id/close` | Close a job posting |
| POST   | `/:id/fill` | Mark job as filled |
| POST   | `/:id/reopen` | Reopen a closed/paused job |
| POST   | `/:id/archive` | Archive a job |
| POST   | `/:id/logo` | Upload company logo |
| GET    | `/:id/stats` | Get job statistics (legacy) |
| GET    | `/:id/analytics` | Get comprehensive job analytics |
| GET    | `/:id/funnel` | Get hiring funnel metrics |
| POST   | `/:id/feature` | Feature a job (Admin only) |
| DELETE | `/:id/feature` | Remove job from featured (Admin only) |
| POST   | `/:id/promote` | Promote a job |
| GET    | `/:id/referrals` | Get referrals for a job |
| POST   | `/:id/referrals` | Add a referral for a job |
| POST   | `/:id/apply` | Apply for job |
| GET    | `/:id/applications` | Get all applications for a job |
| DELETE | `/:id/applications/:applicationId` | Withdraw application |
| PUT    | `/:id/applications/:applicationId/status` | Update application status |
| PUT    | `/:id/applications/:applicationId/score` | Update application score |
| POST   | `/:id/applications/:applicationId/reject` | Reject application with reason |
| POST   | `/:id/applications/:applicationId/interviews` | Schedule an interview |
| PUT    | `/:id/applications/:applicationId/interviews/:interviewId` | Update interview status |
| POST   | `/:id/applications/:applicationId/interviews/:interviewId/reschedule` | Reschedule an interview |
| POST   | `/:id/applications/:applicationId/interviews/:interviewId/feedback` | Submit interview feedback |
| POST   | `/:id/applications/:applicationId/offer` | Send a job offer |
| POST   | `/:id/applications/:applicationId/offer/respond` | Respond to a job offer |
| DELETE | `/:id/applications/:applicationId/offer` | Withdraw a job offer |
| GET    | `/my-applications` | List my job applications |
| GET    | `/my-referrals` | List my referrals |
| GET    | `/my-jobs` | List jobs posted by current employer |
| GET    | `/employer-stats` | Get employer job statistics |
| GET    | `/expiring` | Get jobs expiring soon |

### Providers (`/api/providers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List providers |
| GET | `/:id` | Get provider profile |
| POST | `/onboarding` | Start onboarding |
| PUT | `/profile` | Update profile |
| GET | `/dashboard` | Provider dashboard |
| PUT | `/verification` | Submit verification docs |

### Agencies (`/api/agencies`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create agency |
| GET | `/:id` | Get agency details |
| PUT | `/:id` | Update agency |
| POST | `/:id/providers` | Add provider to agency |
| PUT | `/:id/providers/:providerId` | Update provider status |
| POST | `/:id/admins` | Add agency admin |

### Finance (`/api/finance`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get wallet balance |
| GET | `/transactions` | List transactions |
| POST | `/withdraw` | Request withdrawal |
| GET | `/payouts` | List payouts |

### Escrow (`/api/escrows`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create escrow |
| GET | `/:id` | Get escrow details |
| POST | `/:id/proof` | Submit proof of work |
| POST | `/:id/approve` | Client approval |
| POST | `/:id/dispute` | Raise dispute |
| POST | `/:id/release` | Release funds |

### Additional Endpoints
- `/api/academy` - Learning courses
- `/api/supplies` - Inventory management
- `/api/rentals` - Equipment rentals
- `/api/communication` - Messaging
- `/api/notifications` - Push notifications
- `/api/analytics` - Platform analytics
- `/api/referrals` - Referral program
- `/api/localpro-plus` - Premium subscriptions
- `/api/trust-verification` - KYC verification
- `/api/search` - Global search
- `/api/availability` - Calendar management
- `/api/scheduling` - Job scheduling
- `/api/ai-bot` - AI Operating System
- `/api/live-chat` - Real-time messaging

---

## Database Models

### Core User Models

#### User
```javascript
{
  phoneNumber: String (unique, required),
  email: String (unique, sparse),
  password: String (hashed),
  mpin: String (4-6 digits),
  mpinEnabled: Boolean,
  firstName: String,
  lastName: String,
  gender: ['male', 'female', 'other', 'prefer_not_to_say'],
  birthdate: Date,
  roles: ['client', 'provider', 'admin', ...],
  isVerified: Boolean,
  profile: { avatar, bio, address },
  fcmTokens: [{ token, deviceId, deviceType }],
  // References to related documents
  wallet: ObjectId -> UserWallet,
  trust: ObjectId -> UserTrust,
  referral: ObjectId -> UserReferral,
  activity: ObjectId -> UserActivity,
  management: ObjectId -> UserManagement,
  agency: ObjectId -> UserAgency,
  settings: ObjectId -> UserSettings,
  localProPlusSubscription: ObjectId -> UserSubscription
}
```

#### Provider
```javascript
{
  userId: ObjectId -> User (required, unique),
  status: ['pending', 'active', 'suspended', 'inactive', 'rejected'],
  providerType: ['individual', 'business', 'agency'],
  businessInfo: ObjectId -> ProviderBusinessInfo,
  professionalInfo: ObjectId -> ProviderProfessionalInfo,
  verification: ObjectId -> ProviderVerification,
  financialInfo: ObjectId -> ProviderFinancialInfo,
  performance: ObjectId -> ProviderPerformance,
  preferences: ObjectId -> ProviderPreferences,
  onboarding: {
    completed: Boolean,
    currentStep: String,
    progress: Number (0-100),
    steps: [{ step, completed, completedAt }]
  },
  settings: { profileVisibility, allowDirectBooking, ... },
  metadata: { lastActive, profileViews, featured, promoted }
}
```

### Marketplace Models

#### Service
```javascript
{
  title: String (required),
  description: String (required),
  category: String (enum: 22 categories),
  subcategory: String,
  provider: ObjectId -> User,
  pricing: { type, basePrice, currency },
  availability: { schedule, timezone },
  serviceArea: { coordinates (GeoJSON), radius },
  images: [{ url, publicId, thumbnail }],
  features: [String],
  serviceType: ['one_time', 'recurring', 'emergency', ...],
  estimatedDuration: { min, max },
  warranty: { hasWarranty, duration, description },
  servicePackages: [{ name, price, features }],
  addOns: [{ name, price }],
  rating: { average, count }
}
```

#### Booking
```javascript
{
  service: ObjectId -> Service,
  client: ObjectId -> User,
  provider: ObjectId -> User,
  bookingDate: Date,
  duration: Number,
  address: { street, city, state, zipCode, coordinates },
  status: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  pricing: { basePrice, additionalFees, totalAmount },
  payment: { status, method, transactionId, ... },
  review: { rating, comment, categories, photos },
  communication: { messages: [] },
  timeline: [{ status, timestamp, note }],
  beforePhotos: [],
  afterPhotos: [],
  completionNotes: String
}
```

### Job Models

#### Job
```javascript
{
  title: String (required),
  description: String (required),
  company: { name, logo, website, size, industry, location },
  employer: ObjectId -> User,
  category: ObjectId -> JobCategory,
  jobType: ['full_time', 'part_time', 'contract', 'freelance', ...],
  experienceLevel: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
  salary: { min, max, currency, period, isNegotiable, isConfidential },
  benefits: [String],
  requirements: { skills, education, experience, certifications, languages },
  responsibilities: [String],
  applicationProcess: { deadline, startDate, applicationMethod, contactEmail },
  status: ['draft', 'active', 'paused', 'closed', 'filled'],
  applications: [{
    applicant: ObjectId,
    status: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'rejected', 'hired'],
    coverLetter: String,
    resume: { url },
    interviewSchedule: [],
    feedback: { rating, comments, recommendation }
  }],
  analytics: { applicationsCount, viewsCount, sharesCount }
}
```

### Financial Models

#### Escrow
```javascript
{
  id: UUID,
  bookingId: ObjectId -> Booking,
  clientId: ObjectId -> User,
  providerId: ObjectId -> User,
  amount: Number (cents),
  currency: ['USD', 'PHP', 'EUR', 'GBP', 'JPY'],
  holdProvider: ['paymongo', 'xendit', 'stripe', 'paypal', 'paymaya'],
  providerHoldId: String,
  status: ['CREATED', 'FUNDS_HELD', 'IN_PROGRESS', 'COMPLETE', 'DISPUTE', 'REFUNDED', 'PAYOUT_INITIATED', 'PAYOUT_COMPLETED'],
  proofOfWork: { uploadedAt, documents: [], notes },
  clientApproval: { approved, approvedAt, notes },
  dispute: {
    raised: Boolean,
    raisedBy: ObjectId,
    reason: String,
    evidence: [],
    adminResolution: { decidedAt, decision, notes }
  }
}
```

#### UserWallet
```javascript
{
  user: ObjectId -> User,
  balance: Number,
  pendingBalance: Number,
  currency: String,
  transactions: [{ type, amount, description, ... }]
}
```

### Agency Models

#### Agency
```javascript
{
  name: String (required),
  description: String,
  owner: ObjectId -> User,
  admins: [{ user, role, permissions }],
  providers: [{
    user: ObjectId,
    status: ['active', 'inactive', 'suspended', 'pending'],
    commissionRate: Number,
    performance: { rating, totalJobs, completedJobs }
  }],
  contact: { email, phone, website, address },
  business: { type, registrationNumber, taxId, insurance },
  serviceAreas: [{ name, coordinates, radius, zipCodes }],
  services: [{ category, subcategories, pricing }],
  subscription: { plan, startDate, endDate, isActive },
  verification: { isVerified, documents: [] },
  analytics: { totalBookings, totalRevenue, averageRating },
  settings: { autoApproveProviders, defaultCommissionRate, ... }
}
```

---

## User Journeys

### Journey 1: Client Registration & First Booking

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT REGISTRATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRATION
   └─> POST /api/auth/register
       ├── Input: { phoneNumber: "+1234567890" }
       ├── System sends OTP via Twilio
       └── Response: { message: "OTP sent", userId }

2. VERIFICATION
   └─> POST /api/auth/verify
       ├── Input: { phoneNumber, code: "123456" }
       ├── System validates OTP (5-min expiry)
       └── Response: { accessToken, refreshToken, user }

3. PROFILE COMPLETION
   └─> PUT /api/users/profile
       ├── Input: { firstName, lastName, email, address }
       └── System creates: UserWallet, UserTrust, UserReferral, UserActivity

4. BROWSE SERVICES
   └─> GET /api/marketplace/services?category=cleaning&city=Manila
       └── Response: [{ service listings with providers }]

5. VIEW SERVICE DETAILS
   └─> GET /api/marketplace/services/:serviceId
       └── Response: { service details, provider info, reviews, packages }

6. CREATE BOOKING
   └─> POST /api/marketplace/bookings
       ├── Input: { serviceId, bookingDate, address, selectedPackage }
       ├── System creates Escrow record
       └── Response: { booking details, payment instructions }

7. MAKE PAYMENT
   └─> POST /api/paypal/create-order (or PayMaya/PayMongo)
       ├── Input: { bookingId, amount }
       ├── Payment gateway processes payment
       └── Escrow status -> FUNDS_HELD

8. BOOKING CONFIRMATION
   └─> Booking status: pending -> confirmed
       └── Notifications sent to client & provider

9. SERVICE COMPLETION
   └─> Provider submits proof of work
   └─> PUT /api/marketplace/bookings/:id/status
       └── status: in_progress -> completed

10. REVIEW & RELEASE
    └─> POST /api/marketplace/bookings/:id/review
        ├── Input: { rating, comment, categories }
        └── Escrow releases funds to provider
```

### Journey 2: Provider Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROVIDER ONBOARDING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. REGISTER AS CLIENT (same as Journey 1, steps 1-3)

2. REQUEST PROVIDER ROLE
   └─> POST /api/auth/roles/request
       ├── Input: { role: "provider", providerType: "individual" }
       └── System creates Provider document (status: pending)

3. PROFILE SETUP (Step 1 - 20%)
   └─> PUT /api/providers/onboarding/profile
       ├── Input: { bio, profilePhoto, contactInfo }
       └── onboarding.progress: 20%

4. PROFESSIONAL INFO (Step 2 - 40%)
   └─> PUT /api/providers/onboarding/professional
       ├── Input: { skills, experience, specialties, serviceAreas }
       └── System creates ProviderProfessionalInfo document

5. SERVICE SETUP (Step 3 - 60%)
   └─> POST /api/marketplace/services
       ├── Input: { title, description, category, pricing, availability }
       └── onboarding.progress: 60%

6. IDENTITY VERIFICATION (Step 4 - 80%)
   └─> PUT /api/providers/verification
       ├── Input: { governmentId, selfie, proofOfAddress }
       └── System creates ProviderVerification document

7. FINANCIAL SETUP (Step 5 - 100%)
   └─> PUT /api/providers/onboarding/financial
       ├── Input: { bankAccount, payoutPreferences }
       └── System creates ProviderFinancialInfo document

8. ADMIN REVIEW
   └─> Admin reviews verification documents
   └─> PUT /api/admin/providers/:id/status
       └── Provider status: pending -> active

9. PROVIDER ACTIVE
   └─> Provider can now receive bookings
   └─> Provider dashboard accessible at GET /api/providers/dashboard
```

### Journey 3: Agency Setup & Provider Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENCY SETUP FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. USER BECOMES AGENCY OWNER
   └─> POST /api/auth/roles/request
       ├── Input: { role: "agency_owner" }
       └── User gets agency_owner role

2. CREATE AGENCY
   └─> POST /api/agencies
       ├── Input: {
       │     name: "Premium Cleaning Co",
       │     description: "Professional cleaning services",
       │     contact: { email, phone, address },
       │     business: { type: "llc", registrationNumber, taxId },
       │     services: [{ category: "cleaning", ... }]
       │   }
       └── System creates Agency with owner as admin

3. AGENCY VERIFICATION
   └─> PUT /api/agencies/:id/verification
       ├── Input: { businessLicense, insuranceCertificate, taxCertificate }
       └── Agency verification.isVerified: pending -> verified

4. ADD AGENCY ADMIN
   └─> POST /api/agencies/:id/admins
       ├── Input: { userId, role: "manager", permissions: [...] }
       └── User gets agency_admin role

5. INVITE PROVIDERS
   └─> POST /api/agencies/:id/providers/invite
       ├── Input: { email, commissionRate: 15 }
       └── Invitation sent to provider

6. PROVIDER ACCEPTS INVITATION
   └─> POST /api/agencies/:id/providers/accept
       ├── Provider joins agency (status: pending)
       └── Agency owner approves -> status: active

7. MANAGE PROVIDERS
   └─> GET /api/agencies/:id/providers
       └── List all agency providers with performance metrics

   └─> PUT /api/agencies/:id/providers/:providerId
       └── Update provider status, commission rate

8. AGENCY DASHBOARD
   └─> GET /api/agencies/:id/analytics
       └── View: totalBookings, totalRevenue, providerPerformance

9. PROVIDER WORKS UNDER AGENCY
   └─> Bookings for agency providers:
       ├── Commission automatically calculated
       ├── Agency gets commission %
       └── Provider receives remaining amount
```

### Journey 4: Job Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    JOB APPLICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. EMPLOYER POSTS JOB
   └─> POST /api/jobs
       ├── Input: {
       │     title: "Senior Plumber",
       │     description: "...",
       │     company: { name, location },
       │     jobType: "full_time",
       │     experienceLevel: "senior",
       │     salary: { min: 50000, max: 70000, period: "yearly" },
       │     requirements: { skills, education, experience },
       │     applicationProcess: { deadline, startDate }
       │   }
       └── Job status: draft -> active

2. JOB SEEKER BROWSES JOBS
   └─> GET /api/jobs?category=plumbing&experienceLevel=senior&location=Manila
       └── Response: [{ matching job listings }]

3. VIEW JOB DETAILS
   └─> GET /api/jobs/:jobId
       └── Response: { full job details, company info, requirements }

4. SUBMIT APPLICATION
   └─> POST /api/jobs/:jobId/apply
       ├── Input: {
       │     coverLetter: "...",
       │     resume: { url },
       │     expectedSalary: 60000,
       │     availability: "2024-02-01"
       │   }
       └── Application status: pending

5. EMPLOYER REVIEWS APPLICATIONS
   └─> GET /api/jobs/:jobId/applications
       └── Response: [{ applicant details, resume, status }]

6. SHORTLIST CANDIDATE
   └─> PUT /api/jobs/:jobId/applications/:appId
       ├── Input: { status: "shortlisted" }
       └── Notification sent to candidate

7. SCHEDULE INTERVIEW
   └─> POST /api/jobs/:jobId/applications/:appId/interview
       ├── Input: { date, time, type: "video", location }
       └── Interview added to schedule

8. CONDUCT INTERVIEW & FEEDBACK
   └─> PUT /api/jobs/:jobId/applications/:appId/interview/:interviewId
       ├── Input: { status: "completed", feedback: { rating, comments } }
       └── Application status: interviewed

9. MAKE HIRING DECISION
   └─> PUT /api/jobs/:jobId/applications/:appId
       ├── Input: {
       │     status: "hired",
       │     feedback: { recommendation: "strong_hire" }
       │   }
       └── Notifications sent, job can be marked as "filled"

10. UNSUCCESSFUL CANDIDATES
    └─> PUT /api/jobs/:jobId/applications/:appId
        ├── Input: { status: "rejected", feedback: { comments } }
        └── Rejection notification with feedback (optional)
```

### Journey 5: Escrow & Dispute Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                   ESCROW & DISPUTE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. BOOKING CREATED WITH ESCROW
   └─> POST /api/marketplace/bookings
       └── System creates Escrow (status: CREATED)

2. CLIENT PAYS
   └─> Payment processed via gateway
       └── Escrow status: CREATED -> FUNDS_HELD

3. SERVICE IN PROGRESS
   └─> Provider starts work
       └── Escrow status: FUNDS_HELD -> IN_PROGRESS

4. PROVIDER SUBMITS PROOF
   └─> POST /api/escrows/:id/proof
       ├── Input: { documents: [photos, videos], notes }
       └── Awaiting client approval

5. HAPPY PATH: CLIENT APPROVES
   └─> POST /api/escrows/:id/approve
       ├── Input: { notes: "Great work!" }
       └── Escrow status: IN_PROGRESS -> COMPLETE
       └─> System initiates payout to provider

6. DISPUTE PATH: CLIENT RAISES DISPUTE
   └─> POST /api/escrows/:id/dispute
       ├── Input: { reason: "Work not completed", evidence: [photos] }
       └── Escrow status: IN_PROGRESS -> DISPUTE

7. PROVIDER RESPONDS TO DISPUTE
   └─> POST /api/escrows/:id/dispute/response
       └── Input: { evidence: [additional_photos], explanation }

8. ADMIN REVIEWS DISPUTE
   └─> GET /api/admin/escrows/disputes
       └── Admin reviews all evidence from both parties

9. ADMIN RESOLUTION
   └─> POST /api/escrows/:id/dispute/resolve
       ├── Input: {
       │     decision: "REFUND_CLIENT" | "PAYOUT_PROVIDER" | "SPLIT",
       │     notes: "Reason for decision"
       │   }
       └── Decision options:
           ├── REFUND_CLIENT: Full refund to client
           ├── PAYOUT_PROVIDER: Full payout to provider
           └── SPLIT: Partial refund + partial payout

10. FUNDS DISBURSED
    └─> Based on admin decision:
        ├── Refund processed to client wallet/payment method
        └── Payout processed to provider wallet/bank
```

### Journey 6: LocalPro Plus Subscription

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOCALPRO PLUS SUBSCRIPTION                      │
└─────────────────────────────────────────────────────────────────┘

1. VIEW SUBSCRIPTION PLANS
   └─> GET /api/localpro-plus/plans
       └── Response: [
             { tier: "basic", price: 9.99, features: [...] },
             { tier: "professional", price: 29.99, features: [...] },
             { tier: "enterprise", price: 99.99, features: [...] }
           ]

2. SELECT PLAN
   └─> POST /api/localpro-plus/subscribe
       ├── Input: { planId, billingCycle: "monthly" }
       └── Payment processed, subscription created

3. SUBSCRIPTION ACTIVE
   └─> User gains access to premium features:
       ├── Featured listing placement
       ├── Priority customer support
       ├── Advanced analytics
       ├── Lower commission rates
       └── AI-powered features

4. SUBSCRIPTION MANAGEMENT
   └─> GET /api/localpro-plus/subscription
       └── View current plan, billing date, features

   └─> PUT /api/localpro-plus/subscription
       └── Upgrade/downgrade plan

   └─> DELETE /api/localpro-plus/subscription
       └── Cancel subscription (active until period ends)

5. RENEWAL (Automated)
   └─> automatedSubscriptionService runs daily
       ├── Processes renewals
       ├── Handles payment failures (dunning)
       └── Sends notifications for expiring subscriptions

6. DUNNING (Payment Failure)
   └─> automatedLocalProPlusDunningService
       ├── Retry payment attempts
       ├── Send payment reminder emails
       └── Graceful downgrade after failed attempts
```

### Journey 7: Referral Program

```
┌─────────────────────────────────────────────────────────────────┐
│                     REFERRAL PROGRAM FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. GET REFERRAL CODE
   └─> GET /api/referrals/code
       └── Response: {
             referralCode: "ABC123",
             referralLink: "https://app.com/r/ABC123"
           }

2. SHARE REFERRAL LINK
   └─> User shares link via social media, email, etc.

3. NEW USER SIGNS UP WITH CODE
   └─> POST /api/auth/register
       ├── Input: { phoneNumber, referralCode: "ABC123" }
       └── System tracks referral relationship

4. REFERRAL QUALIFIED
   └─> New user completes qualifying action:
       ├── First booking completed, OR
       ├── First successful payout (for providers)
       └── Referral marked as "successful"

5. REWARDS CREDITED
   └─> Both users receive rewards:
       ├── Referrer: Credits added to wallet
       └── Referee: Welcome bonus/discount

6. TIER PROGRESSION
   └─> GET /api/referrals/stats
       └── Response: {
             tier: "gold",
             totalReferrals: 25,
             successfulReferrals: 20,
             totalEarnings: 500,
             nextTier: "platinum",
             referralsToNextTier: 5
           }

7. TIER MILESTONES (Automated)
   └─> automatedReferralTierMilestoneService
       ├── Tracks tier progression
       ├── Awards tier bonuses
       └── Sends milestone notifications
```

---

## Services & Integrations

### Payment Gateways

#### PayPal
```javascript
// Integration via paypalService.js
- Create order: POST /api/paypal/create-order
- Capture payment: POST /api/paypal/capture
- Webhooks: POST /api/webhooks/paypal
```

#### PayMaya
```javascript
// Integration via paymayaService.js
- Create checkout: POST /api/paymaya/checkout
- Webhooks: POST /api/webhooks/paymaya
- Supported: Credit/debit cards, e-wallets
```

#### PayMongo
```javascript
// Integration via paymongoService.js
- Create payment intent: POST /api/paymongo/intent
- Attach payment method: POST /api/paymongo/attach
- Webhooks: POST /api/webhooks/paymongo
```

### Communication Services

#### Twilio (SMS/Calls)
```javascript
// twilioService.js
- Send SMS: OTP, notifications, alerts
- Voice calls: Masked calling for privacy
- Verification: Phone number verification
```

#### Email (Resend/Nodemailer)
```javascript
// emailService.js
- Transactional emails: OTP, confirmations
- Marketing: Campaigns, newsletters
- Templates: Dynamic email templating
```

### Cloud Services

#### Cloudinary (File Storage)
```javascript
// cloudinaryService.js
- Image upload with optimization
- Video processing
- Automatic thumbnails
- CDN delivery
```

#### Google Maps
```javascript
// googleMapsService.js
- Geocoding: Address to coordinates
- Distance calculation
- Place autocomplete
- Service area validation
```

### AI Services
```javascript
// aiBotService.js with sub-agents:
- analyticsAgent: Data insights
- bookingAgent: Booking assistance
- paymentAgent: Payment help
- supportAgent: Customer support
- providerAgent: Provider recommendations
- marketingAgent: Campaign suggestions
- operationsAgent: Operations optimization
- auditAgent: Compliance monitoring
- escrowAgent: Escrow management
```

---

## Background Jobs

### Automated Services (30+)
| Service | Schedule | Purpose |
|---------|----------|---------|
| `automatedBookingService` | Every 30 min | Booking reminders, status updates |
| `automatedPaymentSyncService` | Every 15 min | Sync payment statuses |
| `automatedEscrowService` | Every hour | Process escrow releases |
| `automatedSubscriptionService` | Daily | Subscription renewals |
| `automatedCampaignProcessor` | Every 5 min | Email campaign processing |
| `automatedBackupService` | Daily | Database backups |
| `automatedLogCleanupService` | Daily | Clean old logs |
| `automatedAvailabilityService` | Every hour | Sync provider availability |
| `automatedSchedulingService` | Every 30 min | Scheduling optimization |
| `automatedLiveChatSlaService` | Every 5 min | Chat SLA monitoring |
| `automatedJobBoardDigestService` | Daily | Job digest emails |
| `automatedAcademyEngagementService` | Daily | Course engagement |
| `automatedLifecycleMarketingService` | Daily | Marketing automation |
| `automatedMessagingNudgeService` | Every hour | Message reminders |
| `automatedRentalReminderService` | Daily | Rental return alerts |
| `automatedFinanceReminderService` | Daily | Payment reminders |
| `automatedSuppliesFulfillmentService` | Every 30 min | Order fulfillment |
| `automatedMarketplaceBookingFollowUpService` | Daily | Booking follow-ups |
| `automatedMarketplaceNoShowService` | Every hour | No-show detection |
| `automatedMessagingModerationService` | Every 5 min | Content moderation |
| `automatedLocalProPlusDunningService` | Daily | Subscription retries |
| `automatedReferralTierMilestoneService` | Daily | Referral milestones |
| `automatedAcademyCertificateService` | Daily | Certificate expiry |
| `automatedJobApplicationFollowUpService` | Daily | Application follow-ups |
| `automatedEscrowDisputeEscalationService` | Every hour | Dispute escalation |
| `automatedIndexManagementService` | Weekly | Database optimization |

---

## Middleware

### Security Middleware
| Middleware | File | Purpose |
|------------|------|---------|
| `auth` | auth.js | Universal authentication |
| `authorize` | authorize.js | Role-based access control |
| `apiKeyAuth` | apiKeyAuth.js | API key validation |
| `accessTokenAuth` | accessTokenAuth.js | Bearer token validation |
| `requireAdmin` | requireAdmin.js | Admin-only routes |
| `checkPermission` | checkPermission.js | Permission validation |
| `subscriptionAccess` | subscriptionAccess.js | Feature gating |

### Request Processing
| Middleware | File | Purpose |
|------------|------|---------|
| `requestId` | requestId.js | UUID generation per request |
| `requestCorrelation` | requestCorrelation.js | Distributed tracing |
| `requestLogger` | requestLogger.js | HTTP logging |
| `paginationMiddleware` | paginationMiddleware.js | Pagination handling |
| `queryOptimizationMiddleware` | queryOptimizationMiddleware.js | Query optimization |

### Business Logic
| Middleware | File | Purpose |
|------------|------|---------|
| `auditLogger` | auditLogger.js | Audit trail (447 lines) |
| `activityTracker` | activityTracker.js | User activity (382 lines) |
| `referralProcessor` | referralProcessor.js | Referral tracking (338 lines) |

### Validation
| Middleware | File | Purpose |
|------------|------|---------|
| `routeValidation` | routeValidation.js | Input validation |
| `locationValidation` | locationValidation.js | Location data |
| `phoneValidation` | phoneValidation.js | Phone number format |
| `errorHandler` | errorHandler.js | Centralized errors |

---

## Environment Variables

### Required Variables
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/localpro

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS=7

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# PayMaya
PAYMAYA_PUBLIC_KEY=
PAYMAYA_SECRET_KEY=
PAYMAYA_ENVIRONMENT=sandbox

# PayMongo
PAYMONGO_SECRET_KEY=
PAYMONGO_PUBLIC_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Google Maps
GOOGLE_MAPS_API_KEY=

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## API Documentation

- **Swagger UI**: Available at `/api-docs`
- **Health Check**: `/health` - Returns service status
- **API Info**: `/` - Returns API metadata

### Postman Collection
Located at: `/LocalPro-Super-App-API.postman_collection.json`

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "requestId": "uuid"
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `DUPLICATE_ERROR` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Performance Optimization

### Database
- **Connection pooling**: 2-10 connections
- **Indexes**: Comprehensive indexing strategy
- **Query optimization**: Middleware for query analysis
- **Automated index management**: Weekly optimization

### Caching
- **CORS origins**: 1-minute TTL
- **API responses**: Cache headers where appropriate

### Monitoring
- **Metrics collection**: Request/response metrics
- **Health checks**: Service availability
- **Error tracking**: Centralized error monitoring
- **Performance monitoring**: Database & API performance

---

## Deployment

### Scripts
```bash
npm start          # Production server
npm run dev        # Development with hot reload
npm test           # Run tests
npm run setup      # Initialize application
npm run seed       # Seed database
npm run lint       # Code linting
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "email": "operational"
  },
  "version": "1.0.0"
}
```

---

## Support & Resources

- **API Documentation**: `/api-docs`
- **Postman Collection**: `/LocalPro-Super-App-API.postman_collection.json`
- **Support Tickets**: `/api/support/tickets`
- **Live Chat**: WebSocket at `/api/live-chat`

---

*Last Updated: January 2026*
*Version: 1.0.0*
