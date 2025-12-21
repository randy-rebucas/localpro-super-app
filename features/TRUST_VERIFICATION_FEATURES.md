# Trust Verification Features Documentation

## Overview

The Trust Verification feature enables users to verify their identity, credentials, and build trust scores through document verification. It provides a comprehensive system for identity verification, business verification, address verification, bank account verification, and trust score calculation to build trust within the LocalPro Super App community.

## Base Path
`/api/trust-verification`

---

## Core Features

### 1. Verification Request Management
- **Request Creation** - Users create verification requests for different types
- **Verification Types** - Support for multiple verification types:
  - `identity` - Identity verification
  - `identity_verification` - Identity verification (alternative)
  - `business` - Business verification
  - `address` - Address verification
  - `bank_account` - Bank account verification
  - `insurance` - Insurance verification
  - `certification` - Professional certification verification
- **Request Status** - Manage request lifecycle:
  - `pending` - Awaiting review
  - `under_review` - Under admin review
  - `approved` - Approved
  - `rejected` - Rejected
  - `expired` - Request expired
- **Request Updates** - Update pending requests
- **Request Deletion** - Delete requests (with restrictions)

### 2. Document Management
- **Document Upload** - Upload verification documents
- **Document Types** - Support for multiple document types:
  - `government_id` - Government-issued ID
  - `passport` - Passport
  - `driver_license` - Driver's license
  - `drivers_license` - Driver's license (alternative)
  - `business_license` - Business license
  - `tax_certificate` - Tax certificate
  - `insurance_certificate` - Insurance certificate
  - `bank_statement` - Bank statement
  - `utility_bill` - Utility bill
  - `certification_document` - Certification document
  - `other` - Other documents
- **Document Verification** - Mark documents as verified
- **Document Deletion** - Delete documents from requests
- **Cloud Storage** - Secure cloud storage for documents (Cloudinary)

### 3. Personal Information Verification
- **Personal Info** - Store personal information:
  - First name
  - Last name
  - Date of birth
  - SSN (encrypted)
  - Phone number (validated against user's unique phone)
  - Email
- **Phone Validation** - Ensure phone number matches user's registered phone
- **Data Encryption** - Sensitive data encrypted at rest

### 4. Business Information Verification
- **Business Info** - Store business information:
  - Business name
  - Business type
  - Registration number
  - Tax ID
  - Business address
- **Business Documents** - Upload business-related documents
- **Business Verification** - Verify business credentials

### 5. Address Verification
- **Address Info** - Store address information:
  - Street address
  - City
  - State
  - Zip code
  - Country
  - Coordinates (latitude, longitude)
- **Address Documents** - Upload address verification documents
- **Geolocation** - Store address coordinates

### 6. Bank Account Verification
- **Bank Info** - Store bank information:
  - Account number (encrypted)
  - Routing number (encrypted)
  - Bank name
  - Account type
- **Bank Documents** - Upload bank statements
- **Data Security** - Bank information encrypted

### 7. Admin Review System
- **Request Review** - Admins review verification requests
- **Review Details** - Store review information:
  - Reviewed by (admin user)
  - Reviewed at (timestamp)
  - Admin notes
  - Rejection reason
  - Trust score (0-100)
- **Status Updates** - Update request status
- **Trust Score Assignment** - Assign trust scores on approval
- **Email Notifications** - Notify users of review results

### 8. Trust Score System
- **Overall Score** - Calculate overall trust score (0-100)
- **Component Scores** - Track scores by component:
  - Identity (25% weight)
  - Business (20% weight)
  - Address (15% weight)
  - Bank (15% weight)
  - Behavior (25% weight)
- **Score Calculation** - Automatic score calculation
- **Score History** - Track score changes over time
- **Score Factors** - Consider multiple factors:
  - Verification status
  - Activity metrics
  - Financial metrics
  - Compliance metrics

### 9. Trust Badges
- **Badge Types** - Award trust badges:
  - `verified_identity` - Verified identity
  - `verified_business` - Verified business
  - `verified_address` - Verified address
  - `verified_bank` - Verified bank account
  - `top_rated` - Top rated
  - `reliable` - Reliable
  - `fast_response` - Fast response
  - `excellent_service` - Excellent service
  - `trusted_provider` - Trusted provider
- **Badge Management** - Add and remove badges
- **Badge Display** - Display badges on user profiles

### 10. Verified Users Directory
- **Public Directory** - Public list of verified users
- **Trust Score Filtering** - Filter by minimum trust score
- **User Profiles** - Display verified user profiles
- **Trust Indicators** - Show trust indicators

### 11. Dispute Management
- **Dispute Creation** - Create disputes related to verification
- **Dispute Types** - Support for different dispute types:
  - `service_dispute` - Service-related disputes
  - `payment_dispute` - Payment-related disputes
  - `verification_dispute` - Verification-related disputes
  - `other` - Other disputes
- **Dispute Status** - Manage dispute lifecycle:
  - `open` - Dispute open
  - `under_review` - Under review
  - `resolved` - Resolved
  - `closed` - Closed
- **Evidence Management** - Upload evidence for disputes
- **Resolution Tracking** - Track dispute resolution

### 12. Analytics & Statistics
- **Request Statistics** - Track verification request metrics
- **Status Distribution** - Distribution by status
- **Type Distribution** - Distribution by type
- **Monthly Trends** - Track monthly trends
- **Processing Time** - Average processing time
- **Approval Rate** - Track approval rates

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/verified-users` | Get verified users | `page`, `limit`, `minTrustScore` |

### Authenticated Endpoints - User

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/requests` | Get verification requests | AUTHENTICATED |
| GET | `/requests/:id` | Get verification request | AUTHENTICATED |
| POST | `/requests` | Create verification request | AUTHENTICATED |
| PUT | `/requests/:id` | Update verification request | AUTHENTICATED |
| DELETE | `/requests/:id` | Delete verification request | AUTHENTICATED |
| POST | `/requests/:id/documents` | Upload verification documents | AUTHENTICATED |
| DELETE | `/requests/:id/documents/:documentId` | Delete verification document | AUTHENTICATED |
| GET | `/my-requests` | Get my verification requests | AUTHENTICATED |

### Authenticated Endpoints - Admin

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| PUT | `/requests/:id/review` | Review verification request | **admin** |
| GET | `/statistics` | Get verification statistics | **admin** |

---

## Request/Response Examples

### Create Verification Request

```http
POST /api/trust-verification/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "identity",
  "documents": [],
  "additionalInfo": "Additional verification information",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "email": "john.doe@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trust verification request submitted successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "user": "64a1b2c3d4e5f6789012346",
    "type": "identity",
    "status": "pending",
    "documents": [],
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890"
    },
    "submittedAt": "2025-01-15T10:00:00.000Z",
    "expiresAt": "2025-02-14T10:00:00.000Z",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Upload Verification Documents

```http
POST /api/trust-verification/requests/:id/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "files": [<file1>, <file2>]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 document(s) uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/doc1.pdf",
      "publicId": "localpro/verification-documents/doc1_1234567890",
      "filename": "government_id.pdf"
    },
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/doc2.pdf",
      "publicId": "localpro/verification-documents/doc2_1234567890",
      "filename": "utility_bill.pdf"
    }
  ]
}
```

### Get My Verification Requests

```http
GET /api/trust-verification/my-requests?page=1&limit=20&status=pending
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 5,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "type": "identity",
      "status": "pending",
      "documents": [
        {
          "_id": "64a1b2c3d4e5f6789012347",
          "type": "government_id",
          "url": "https://example.com/doc1.pdf",
          "filename": "government_id.pdf",
          "uploadedAt": "2025-01-15T10:05:00.000Z"
        }
      ],
      "submittedAt": "2025-01-15T10:00:00.000Z",
      "expiresAt": "2025-02-14T10:00:00.000Z"
    }
  ]
}
```

### Review Verification Request (Admin)

```http
PUT /api/trust-verification/requests/:id/review
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Documents verified successfully",
  "trustScore": 85
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trust verification request reviewed successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "status": "approved",
    "review": {
      "reviewedBy": "64a1b2c3d4e5f6789012348",
      "reviewedAt": "2025-01-15T11:00:00.000Z",
      "notes": "Documents verified successfully",
      "score": 85
    },
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

### Get Verified Users

```http
GET /api/trust-verification/verified-users?page=1&limit=20&minTrustScore=80
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": {
          "url": "https://example.com/avatar.jpg"
        },
        "rating": {
          "average": 4.8,
          "count": 25
        }
      },
      "trustScore": 92,
      "verificationStatus": "verified"
    }
  ]
}
```

### Get Statistics (Admin)

```http
GET /api/trust-verification/statistics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 500,
    "requestsByStatus": [
      {
        "_id": "pending",
        "count": 50
      },
      {
        "_id": "approved",
        "count": 350
      },
      {
        "_id": "rejected",
        "count": 80
      },
      {
        "_id": "expired",
        "count": 20
      }
    ],
    "requestsByType": [
      {
        "_id": "identity",
        "count": 200
      },
      {
        "_id": "business",
        "count": 150
      },
      {
        "_id": "address",
        "count": 100
      },
      {
        "_id": "bank_account",
        "count": 50
      }
    ],
    "monthlyTrends": [
      {
        "_id": {
          "year": 2025,
          "month": 1
        },
        "count": 45
      }
    ],
    "averageProcessingTime": 1728000000
  }
}
```

---

## Verification Flow

### 1. Request Creation
- User creates verification request via `POST /requests`
- User selects verification type
- User provides personal/business/address/bank information
- Request created with status `pending`
- Admin notified via email

### 2. Document Upload
- User uploads verification documents via `POST /requests/:id/documents`
- Documents stored securely in cloud storage
- Documents linked to verification request

### 3. Admin Review
- Admin reviews request via `PUT /requests/:id/review`
- Admin verifies documents and information
- Admin assigns trust score
- Status updated to `approved` or `rejected`
- User notified via email

### 4. Trust Score Update
- If approved, user's trust score updated
- Component scores calculated
- Overall score recalculated
- Badges awarded if applicable

### 5. Verification Complete
- User's verification status updated
- Trust score visible on profile
- Badges displayed
- User appears in verified users directory

---

## Verification Status Flow

```
pending → under_review → approved/rejected
                ↓
            expired
```

**Status Details:**
- **pending** - Awaiting admin review
- **under_review** - Currently under review
- **approved** - Verification approved
- **rejected** - Verification rejected
- **expired** - Request expired (30 days)

---

## Verification Types

### Identity Verification
- **Type**: `identity` or `identity_verification`
- **Documents**: Government ID, passport, driver's license
- **Information**: Personal information (name, DOB, SSN)
- **Use Case**: Verify user identity

### Business Verification
- **Type**: `business`
- **Documents**: Business license, tax certificate
- **Information**: Business information (name, registration, tax ID)
- **Use Case**: Verify business credentials

### Address Verification
- **Type**: `address`
- **Documents**: Utility bill, bank statement
- **Information**: Address information with coordinates
- **Use Case**: Verify user address

### Bank Account Verification
- **Type**: `bank_account`
- **Documents**: Bank statement
- **Information**: Bank account details (encrypted)
- **Use Case**: Verify bank account for payments

### Insurance Verification
- **Type**: `insurance`
- **Documents**: Insurance certificate
- **Information**: Insurance details
- **Use Case**: Verify insurance coverage

### Certification Verification
- **Type**: `certification`
- **Documents**: Certification documents
- **Information**: Professional certification details
- **Use Case**: Verify professional certifications

---

## Trust Score Calculation

### Component Weights
- **Identity**: 25%
- **Business**: 20%
- **Address**: 15%
- **Bank**: 15%
- **Behavior**: 25%

### Behavior Score Factors
- **Completion Rate** (40% weight) - Booking completion rate
- **Rating Score** (30% weight) - Average rating (out of 5)
- **Payment Success Rate** (20% weight) - Payment success percentage
- **Dispute Resolution Rate** (10% weight) - Dispute resolution percentage

### Score Calculation Formula
```
Overall Score = (Identity × 0.25) + (Business × 0.20) + (Address × 0.15) + (Bank × 0.15) + (Behavior × 0.25)
```

---

## Data Models

### VerificationRequest Model

```javascript
{
  // Core Fields
  user: ObjectId,                    // Required, User reference
  type: String,                      // Required, enum: identity, identity_verification, business, address, bank_account, insurance, certification
  status: String,                    // enum: pending, under_review, approved, rejected, expired
  
  // Documents
  documents: [{
    type: String,                     // Required, enum: government_id, passport, driver_license, etc.
    url: String,                       // Required
    publicId: String,
    filename: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date,                 // Default: Date.now
    isVerified: Boolean                // Default: false
  }],
  
  // Personal Information
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    ssn: String,                       // Encrypted
    phoneNumber: String,               // Validated against user's unique phone
    email: String
  },
  
  // Business Information
  businessInfo: {
    businessName: String,
    businessType: String,
    registrationNumber: String,
    taxId: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  
  // Address Information
  addressInfo: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Bank Information
  bankInfo: {
    accountNumber: String,            // Encrypted
    routingNumber: String,            // Encrypted
    bankName: String,
    accountType: String
  },
  
  // Review
  review: {
    reviewedBy: ObjectId,              // User reference (admin)
    reviewedAt: Date,
    notes: String,
    rejectionReason: String,
    score: Number                      // 0-100
  },
  
  // Additional Info
  additionalInfo: String,
  
  // Dates
  submittedAt: Date,                   // Default: Date.now
  expiresAt: Date,                     // Default: +30 days
  isActive: Boolean,                    // Default: true
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### TrustScore Model

```javascript
{
  // Core Fields
  user: ObjectId,                     // Required, unique, User reference
  overallScore: Number,               // 0-100, Default: 0
  
  // Component Scores
  components: {
    identity: {
      score: Number,                   // 0-100, Default: 0
      weight: Number,                  // Default: 25
      lastUpdated: Date
    },
    business: {
      score: Number,                   // 0-100, Default: 0
      weight: Number,                  // Default: 20
      lastUpdated: Date
    },
    address: {
      score: Number,                   // 0-100, Default: 0
      weight: Number,                  // Default: 15
      lastUpdated: Date
    },
    bank: {
      score: Number,                   // 0-100, Default: 0
      weight: Number,                  // Default: 15
      lastUpdated: Date
    },
    behavior: {
      score: Number,                   // 0-100, Default: 0
      weight: Number,                  // Default: 25
      lastUpdated: Date
    }
  },
  
  // Factors
  factors: {
    verificationStatus: {
      identityVerified: Boolean,       // Default: false
      businessVerified: Boolean,       // Default: false
      addressVerified: Boolean,        // Default: false
      bankVerified: Boolean            // Default: false
    },
    activityMetrics: {
      totalBookings: Number,           // Default: 0
      completedBookings: Number,       // Default: 0
      cancelledBookings: Number,       // Default: 0
      averageRating: Number,           // Default: 0
      totalReviews: Number              // Default: 0
    },
    financialMetrics: {
      totalTransactions: Number,       // Default: 0
      totalAmount: Number,             // Default: 0
      paymentSuccessRate: Number,      // Default: 0
      chargebackRate: Number            // Default: 0
    },
    complianceMetrics: {
      disputesFiled: Number,           // Default: 0
      disputesResolved: Number,        // Default: 0
      policyViolations: Number,        // Default: 0
      accountAge: Number                // Default: 0 (in days)
    }
  },
  
  // Badges
  badges: [{
    type: String,                      // enum: verified_identity, verified_business, etc.
    earnedAt: Date,                    // Default: Date.now
    description: String
  }],
  
  // History
  lastCalculated: Date,                // Default: Date.now
  history: [{
    score: Number,
    reason: String,
    timestamp: Date                    // Default: Date.now
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Dispute Model

```javascript
{
  // Core Fields
  user: ObjectId,                      // Required, User reference
  type: String,                        // Required, enum: service_dispute, payment_dispute, verification_dispute, other
  title: String,                       // Required
  description: String,                 // Required
  
  // Context
  context: {
    bookingId: ObjectId,               // Booking reference
    jobId: ObjectId,                    // Job reference
    orderId: ObjectId,                  // Order reference
    verificationId: ObjectId            // VerificationRequest reference
  },
  
  // Status
  status: String,                       // enum: open, under_review, resolved, closed
  priority: String,                     // enum: low, medium, high, urgent
  
  // Evidence
  evidence: [{
    type: String,                       // enum: document, image, video, audio, other
    url: String,
    publicId: String,
    filename: String,
    description: String,
    uploadedAt: Date                    // Default: Date.now
  }],
  
  // Resolution
  resolution: {
    resolvedBy: ObjectId,               // User reference
    resolvedAt: Date,
    resolution: String,
    outcome: String,                    // enum: resolved_in_favor_of_user, resolved_in_favor_of_other_party, no_fault, dismissed
    compensation: {
      amount: Number,
      currency: String,
      type: String                      // enum: refund, credit, service_credit, none
    }
  },
  
  // Communication
  communication: [{
    sender: ObjectId,                   // User reference
    message: String,
    timestamp: Date,                    // Default: Date.now
    isInternal: Boolean                 // Default: false
  }],
  
  // Assignment
  assignedTo: ObjectId,                 // User reference
  tags: [String],
  isActive: Boolean,                     // Default: true
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Trust Score Methods

### calculateScore()
Calculate overall trust score based on component scores.

```javascript
trustScore.calculateScore() // Returns overall score
```

### updateComponentScore(component, score, reason)
Update a specific component score.

```javascript
trustScore.updateComponentScore('identity', 90, 'Identity verified')
```

### addBadge(badgeType, description)
Add a trust badge.

```javascript
trustScore.addBadge('verified_identity', 'Identity verified')
```

### removeBadge(badgeType)
Remove a trust badge.

```javascript
trustScore.removeBadge('verified_identity')
```

### Static Methods

#### getUserTrustScore(userId)
Get or create user trust score.

```javascript
TrustScore.getUserTrustScore(userId)
```

#### updateFromActivity(userId, activityType, data)
Update trust score based on activity.

```javascript
TrustScore.updateFromActivity(userId, 'booking_completed', {})
```

#### calculateBehaviorScore(factors)
Calculate behavior score from factors.

```javascript
TrustScore.calculateBehaviorScore(factors)
```

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Filters:**
- `status` - Filter by request status
- `type` - Filter by verification type
- `minTrustScore` - Filter by minimum trust score

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

---

## Key Metrics

- **Total Requests** - Total verification requests
- **Approval Rate** - Percentage of approved requests
- **Average Processing Time** - Average time to process requests
- **Trust Score Distribution** - Distribution of trust scores
- **Verification Types** - Distribution by verification type
- **Monthly Trends** - Monthly request trends
- **Verified Users** - Total number of verified users
- **Average Trust Score** - Average trust score across users

---

## Related Features

The Trust Verification feature integrates with several other features in the LocalPro Super App:

- **User Management** - User profiles and authentication
- **Marketplace** - Trust indicators on service listings
- **Job Board** - Trust indicators on job postings
- **Finance** - Bank account verification for payments
- **File Storage** - Document storage (Cloudinary)
- **Email Service** - Verification notifications
- **Analytics** - Trust score analytics

---

## Common Use Cases

1. **Identity Verification** - Users verify their identity
2. **Business Verification** - Businesses verify credentials
3. **Address Verification** - Users verify their address
4. **Bank Verification** - Users verify bank accounts
5. **Trust Building** - Build trust scores through verification
6. **Profile Enhancement** - Display verification badges
7. **Trust Discovery** - Find verified users
8. **Dispute Resolution** - Handle verification disputes

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields, duplicate pending request)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions, phone number mismatch)
- `404` - Not found (request or document doesn't exist)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "type",
      "message": "Verification type is required"
    }
  ]
}
```

---

## Best Practices

### For Users
1. **Complete Information** - Provide complete and accurate information
2. **Clear Documents** - Upload clear, readable documents
3. **Valid Documents** - Ensure documents are valid and not expired
4. **Phone Matching** - Ensure phone number matches registered phone
5. **Timely Submission** - Submit requests promptly

### For Admins
1. **Thorough Review** - Review all documents carefully
2. **Consistent Scoring** - Apply consistent trust score criteria
3. **Clear Notes** - Provide clear review notes
4. **Timely Processing** - Process requests in a timely manner
5. **Security** - Protect sensitive user information

### For Developers
1. **Data Encryption** - Encrypt sensitive data (SSN, bank info)
2. **Phone Validation** - Validate phone numbers against user records
3. **Document Security** - Secure document storage and access
4. **Score Calculation** - Implement accurate score calculation
5. **Error Handling** - Handle all error cases gracefully
6. **Performance** - Optimize queries for large datasets

---

## Security Considerations

1. **Data Encryption** - Sensitive data encrypted at rest
2. **Access Control** - Strict access control for verification data
3. **Document Security** - Secure document storage and access
4. **Phone Validation** - Phone numbers validated against user records
5. **Admin Authorization** - Admin-only access to review endpoints
6. **Audit Trail** - Complete audit trail for all actions

---

*For detailed implementation guidance, see the individual documentation files in the `features/trust-verification/` and `docs/features/` directories.*

