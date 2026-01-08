# LocalPro Admin Dashboard - API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 7, 2026  
> **Base URL:** `https://api.yourdomain.com/api` or `http://localhost:4000/api` (development)

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Provider Management](#provider-management)
5. [Service Management](#service-management)
6. [Booking Management](#booking-management)
7. [Job Management](#job-management)
8. [Financial Management](#financial-management)
9. [Analytics & Reports](#analytics--reports)
10. [Content Moderation](#content-moderation)
11. [Trust & Verification](#trust--verification)
12. [Settings & Configuration](#settings--configuration)
13. [System Monitoring](#system-monitoring)
14. [Agency Management](#agency-management)
15. [Notification Management](#notification-management)
16. [Subscription Management](#subscription-management)
17. [Referral Management](#referral-management)

---

## Overview

The **LocalPro Admin Dashboard** provides comprehensive platform management capabilities for administrators. Admins can:

- 👥 **Manage Users** - User accounts, roles, and permissions
- ✅ **Verify Providers** - Review and approve provider applications
- 📊 **Monitor Platform** - System health, performance, and usage
- 💰 **Oversee Finances** - Transactions, payouts, and revenue
- 🔍 **Moderate Content** - Reviews, listings, and reported content
- ⚙️ **Configure System** - Platform settings and features
- 📈 **Analyze Data** - Comprehensive analytics and insights
- 🚨 **Handle Disputes** - Resolve conflicts and complaints

---

## Authentication

### Admin Login

Admins use the same authentication endpoints as clients/providers, but with admin credentials.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@localpro.com",
  "password": "AdminPassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin123",
    "email": "admin@localpro.com",
    "roles": ["admin"],
    "permissions": ["all"]
  }
}
```

**Admin Roles:**
- `super_admin` - Full system access
- `admin` - Standard admin access
- `moderator` - Content moderation access
- `support` - Customer support access
- `analyst` - Analytics and reporting access

---

## User Management

### 1. Get All Users

Get a paginated list of all users with filtering.

**Endpoint:** `GET /users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20, max: 100) |
| role | string | Filter by role (client, provider, supplier, etc.) |
| status | string | Filter by status (active, suspended, banned) |
| verified | boolean | Filter by verification status |
| search | string | Search by name, email, or phone |
| sortBy | string | Sort field (created_at, last_login, rating) |
| sortOrder | string | Sort order (asc, desc) |
| startDate | date | Filter from date |
| endDate | date | Filter to date |

**Example Request:**
```
GET /users?page=1&limit=20&role=provider&status=active&verified=true
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "+639171234567",
        "roles": ["provider"],
        "status": "active",
        "verification": {
          "phoneVerified": true,
          "emailVerified": true,
          "identityVerified": true
        },
        "profile": {
          "avatar": "https://cloudinary.com/avatar.jpg",
          "city": "Manila",
          "state": "Metro Manila"
        },
        "stats": {
          "rating": 4.8,
          "totalBookings": 156,
          "totalEarnings": 45600
        },
        "createdAt": "2025-03-15T10:00:00Z",
        "lastLogin": "2026-01-07T08:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 45,
      "totalItems": 892,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 2. Get User Statistics

Get comprehensive user statistics.

**Endpoint:** `GET /users/stats`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `period`: Time period (today, week, month, year, all)
- `groupBy`: Group by (role, status, location, date)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 45678,
      "activeUsers": 38942,
      "newUsersToday": 234,
      "newUsersThisMonth": 3456
    },
    "byRole": {
      "client": 32456,
      "provider": 8934,
      "supplier": 1234,
      "instructor": 567,
      "agency_owner": 234
    },
    "byStatus": {
      "active": 38942,
      "inactive": 5234,
      "suspended": 892,
      "banned": 610
    },
    "verification": {
      "phoneVerified": 42345,
      "emailVerified": 38901,
      "identityVerified": 9234
    },
    "growth": {
      "daily": [
        { "date": "2026-01-01", "count": 156 },
        { "date": "2026-01-02", "count": 189 }
      ],
      "trend": "+12% vs last month"
    },
    "topLocations": [
      { "city": "Manila", "count": 12345 },
      { "city": "Cebu", "count": 8901 }
    ]
  }
}
```

---

### 3. Get User Details

Get detailed information about a specific user.

**Endpoint:** `GET /users/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+639171234567",
      "roles": ["provider"],
      "status": "active",
      "verification": {
        "phoneVerified": true,
        "emailVerified": true,
        "identityVerified": true,
        "backgroundCheck": "passed",
        "businessVerified": false
      },
      "profile": {
        "avatar": "https://cloudinary.com/avatar.jpg",
        "bio": "Professional cleaner with 5+ years experience",
        "address": {
          "street": "123 Main Street",
          "city": "Manila",
          "state": "Metro Manila",
          "zipCode": "1000"
        }
      },
      "providerInfo": {
        "specialties": ["cleaning", "deep_cleaning"],
        "rating": 4.8,
        "reviewCount": 156,
        "completionRate": 98.5,
        "responseTime": "2 hours"
      },
      "financial": {
        "totalEarnings": 45600,
        "availableBalance": 3200,
        "pendingBalance": 1800,
        "totalWithdrawals": 40000
      },
      "activity": {
        "totalBookings": 156,
        "completedBookings": 153,
        "cancelledBookings": 3,
        "lastActive": "2026-01-07T08:30:00Z"
      },
      "devices": [
        {
          "deviceId": "device123",
          "deviceType": "mobile",
          "platform": "iOS",
          "lastUsed": "2026-01-07T08:30:00Z"
        }
      ],
      "flags": {
        "hasViolations": false,
        "isBlacklisted": false,
        "trustScore": 92
      },
      "createdAt": "2025-03-15T10:00:00Z",
      "updatedAt": "2026-01-07T08:30:00Z"
    }
  }
}
```

---

### 4. Update User Status

Update user account status.

**Endpoint:** `PATCH /users/:id/status`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Multiple user complaints",
  "duration": 30,
  "notes": "Suspended for 30 days due to policy violations",
  "notifyUser": true
}
```

**Status Options:**
- `active` - Active account
- `inactive` - Inactive account
- `suspended` - Temporarily suspended
- `banned` - Permanently banned

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "userId": "user123",
    "status": "suspended",
    "effectiveDate": "2026-01-07T10:00:00Z",
    "expiryDate": "2026-02-06T10:00:00Z"
  }
}
```

---

### 5. Update User Verification

Update user verification status.

**Endpoint:** `PATCH /users/:id/verification`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "verification": {
    "phoneVerified": true,
    "emailVerified": true,
    "identityVerified": true,
    "backgroundCheck": "passed",
    "businessVerified": true
  },
  "notes": "All documents verified",
  "verifiedBy": "admin123"
}
```

**Response:** `200 OK`

---

### 6. Add User Badge

Award a badge to a user.

**Endpoint:** `POST /users/:id/badges`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "top_rated",
  "reason": "Maintained 4.9+ rating for 6 months",
  "expiryDate": "2027-01-07"
}
```

**Badge Types:**
- `verified_provider` - Verified provider
- `top_rated` - Top rated (4.8+ rating)
- `fast_response` - Fast response time
- `reliable` - High completion rate
- `expert` - Expert in category
- `newcomer` - New to platform

**Response:** `201 Created`

---

### 7. Bulk Update Users

Update multiple users at once.

**Endpoint:** `PATCH /users/bulk`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userIds": ["user123", "user456", "user789"],
  "updateData": {
    "tags": ["vip_customer"],
    "notification": {
      "title": "Important Update",
      "message": "System maintenance scheduled"
    }
  }
}
```

**Response:** `200 OK`

---

### 8. Delete User

Delete a user account (soft delete).

**Endpoint:** `DELETE /users/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `permanent`: Boolean (true for permanent deletion)
- `reason`: Deletion reason

**Response:** `200 OK`

---

## Provider Management

### 1. Get All Providers

Get list of all providers with detailed information.

**Endpoint:** `GET /providers/admin/all`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, verified, suspended, rejected)
- `category`: Filter by specialty category
- `rating`: Minimum rating
- `verificationStatus`: Filter by verification status

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "provider123",
        "user": {
          "id": "user123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phoneNumber": "+639171234567"
        },
        "providerType": "individual",
        "status": "verified",
        "verificationDate": "2025-04-01T10:00:00Z",
        "professionalInfo": {
          "specialties": ["cleaning", "deep_cleaning"],
          "experience": 5,
          "certifications": [
            {
              "name": "Professional Cleaning Certificate",
              "issuedBy": "Cleaning Association",
              "verified": true
            }
          ]
        },
        "performance": {
          "rating": 4.8,
          "reviewCount": 156,
          "completionRate": 98.5,
          "responseTime": "2 hours",
          "totalBookings": 156
        },
        "financial": {
          "totalEarnings": 45600,
          "platformFees": 4560
        },
        "documents": {
          "governmentId": {
            "status": "verified",
            "verifiedAt": "2025-04-01T10:00:00Z"
          },
          "businessPermit": {
            "status": "pending"
          }
        },
        "onboardingProgress": 100,
        "createdAt": "2025-03-15T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2. Update Provider Status

Approve, reject, or suspend provider accounts.

**Endpoint:** `PUT /providers/admin/:id/status`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "verified",
  "notes": "All documents verified. Profile approved.",
  "verificationDetails": {
    "identityVerified": true,
    "businessVerified": true,
    "backgroundCheck": "passed"
  },
  "notifyProvider": true
}
```

**Provider Status:**
- `pending_verification` - Awaiting review
- `verified` - Approved and active
- `suspended` - Temporarily suspended
- `rejected` - Application rejected

**Response:** `200 OK`

---

### 3. Review Provider Documents

Review and verify provider documents.

**Endpoint:** `PUT /providers/admin/:id/documents/:documentId/review`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Document verified successfully",
  "expiryDate": "2027-01-07"
}
```

**Document Status:**
- `pending` - Awaiting review
- `approved` - Document approved
- `rejected` - Document rejected
- `expired` - Document expired

**Response:** `200 OK`

---

## Service Management

### 1. Get All Services

Get list of all service listings on the platform.

**Endpoint:** `GET /marketplace/services`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (active, inactive, flagged, pending)
- `category`: Filter by category
- `provider`: Filter by provider ID
- `reported`: Boolean (show only reported services)

**Response:** `200 OK` (similar structure to public endpoint with admin fields)

---

### 2. Approve/Reject Service

Moderate service listings.

**Endpoint:** `PUT /marketplace/services/:id/moderate`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Service approved",
  "visibility": "public"
}
```

**Actions:**
- `approve` - Approve service
- `reject` - Reject service
- `flag` - Flag for review
- `hide` - Hide from public

**Response:** `200 OK`

---

### 3. Delete Service

Remove a service listing.

**Endpoint:** `DELETE /marketplace/services/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `reason`: Deletion reason
- `notifyProvider`: Boolean

**Response:** `200 OK`

---

## Booking Management

### 1. Get All Bookings

Get list of all bookings on the platform.

**Endpoint:** `GET /marketplace/bookings/admin/all`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status
- `startDate`: From date
- `endDate`: To date
- `provider`: Filter by provider
- `client`: Filter by client
- `disputed`: Boolean (show only disputed bookings)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking123",
        "bookingNumber": "BKG-2026-001234",
        "status": "completed",
        "service": {
          "id": "service123",
          "title": "House Cleaning"
        },
        "provider": {
          "id": "provider123",
          "name": "John Doe"
        },
        "client": {
          "id": "client123",
          "name": "Maria Garcia"
        },
        "scheduledDate": "2026-01-15T10:00:00Z",
        "completedDate": "2026-01-15T13:00:00Z",
        "pricing": {
          "total": 660,
          "providerEarnings": 540,
          "platformFee": 60,
          "tax": 60
        },
        "payment": {
          "method": "paypal",
          "status": "completed",
          "transactionId": "PAY-123456789"
        },
        "flags": {
          "disputed": false,
          "refunded": false,
          "hasIssues": false
        },
        "createdAt": "2026-01-07T08:00:00Z"
      }
    ],
    "pagination": { ... },
    "summary": {
      "totalBookings": 15678,
      "totalRevenue": 2345678,
      "averageBookingValue": 650
    }
  }
}
```

---

### 2. Handle Booking Dispute

Resolve booking disputes.

**Endpoint:** `POST /marketplace/bookings/:id/dispute/resolve`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "resolution": "refund_client",
  "amount": 660,
  "reason": "Service not completed as agreed",
  "penalizeProvider": false,
  "notes": "Full refund issued to client",
  "notifyParties": true
}
```

**Resolution Options:**
- `refund_client` - Issue refund to client
- `pay_provider` - Pay provider
- `partial_refund` - Partial refund
- `no_action` - Close without action

**Response:** `200 OK`

---

### 3. Cancel Booking

Cancel a booking as admin.

**Endpoint:** `PUT /marketplace/bookings/:id/admin-cancel`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Policy violation",
  "refundClient": true,
  "compensateProvider": false,
  "notes": "Cancelled due to provider violation"
}
```

**Response:** `200 OK`

---

## Job Management

### 1. Get All Job Postings

Get list of all job postings.

**Endpoint:** `GET /jobs/admin/all`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (active, closed, flagged)
- `category`: Filter by category
- `employer`: Filter by employer ID

**Response:** `200 OK`

---

### 2. Moderate Job Posting

Review and moderate job postings.

**Endpoint:** `PUT /jobs/:id/moderate`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Job posting approved",
  "featured": false
}
```

**Response:** `200 OK`

---

### 3. Close Job Posting

Close a job posting.

**Endpoint:** `PUT /jobs/:id/close`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Position filled",
  "notifyApplicants": true
}
```

**Response:** `200 OK`

---

## Financial Management

### 1. Get Financial Overview

Get comprehensive financial overview.

**Endpoint:** `GET /finance/admin/overview`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `period`: Time period (today, week, month, quarter, year)
- `breakdown`: Include breakdown by category

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 2456789,
      "platformFees": 245678,
      "providerEarnings": 2211111,
      "currency": "PHP"
    },
    "thisMonth": {
      "revenue": 456789,
      "bookings": 3456,
      "averageValue": 132,
      "growth": "+15%"
    },
    "byCategory": {
      "cleaning": 1234567,
      "plumbing": 567890,
      "electrical": 345678
    },
    "transactions": {
      "total": 15678,
      "completed": 15234,
      "pending": 234,
      "failed": 210
    },
    "withdrawals": {
      "total": 1987654,
      "pending": 123456,
      "processed": 1864198
    },
    "trends": {
      "daily": [
        {
          "date": "2026-01-01",
          "revenue": 12345,
          "bookings": 89
        }
      ]
    }
  }
}
```

---

### 2. Get All Transactions

Get list of all platform transactions.

**Endpoint:** `GET /finance/admin/transactions`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type (booking, withdrawal, refund, subscription)
- `status`: Filter by status (pending, completed, failed)
- `startDate`: From date
- `endDate`: To date
- `userId`: Filter by user

**Response:** `200 OK`

---

### 3. Process Withdrawal

Review and process withdrawal requests.

**Endpoint:** `PUT /finance/withdrawals/:withdrawalId/process`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "approve",
  "transactionId": "TXN-123456789",
  "notes": "Payment processed via bank transfer",
  "processedBy": "admin123"
}
```

**Actions:**
- `approve` - Approve and process
- `reject` - Reject withdrawal
- `hold` - Put on hold for review

**Response:** `200 OK`

---

### 4. Issue Refund

Issue refunds to users.

**Endpoint:** `POST /finance/admin/refund`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bookingId": "booking123",
  "userId": "client123",
  "amount": 660,
  "reason": "Service not completed",
  "method": "original",
  "notes": "Full refund issued"
}
```

**Refund Methods:**
- `original` - Refund to original payment method
- `wallet` - Credit to wallet
- `bank_transfer` - Bank transfer

**Response:** `200 OK`

---

### 5. Generate Financial Report

Generate comprehensive financial reports.

**Endpoint:** `GET /finance/admin/reports`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `type`: Report type (revenue, commissions, taxes, comprehensive)
- `period`: Time period
- `format`: Format (json, pdf, csv, excel)
- `email`: Email report to address

**Response:** `200 OK` (or file download)

---

## Analytics & Reports

### 1. Get Platform Analytics

Get comprehensive platform analytics.

**Endpoint:** `GET /analytics/admin/platform`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `period`: Time period (week, month, quarter, year)
- `metrics`: Comma-separated metrics to include

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 45678,
      "active": 38942,
      "newThisMonth": 3456,
      "growth": "+12%"
    },
    "providers": {
      "total": 8934,
      "active": 7823,
      "verified": 7234,
      "averageRating": 4.7
    },
    "bookings": {
      "total": 156789,
      "thisMonth": 12345,
      "completionRate": 96.5,
      "averageValue": 650
    },
    "revenue": {
      "total": 102345678,
      "thisMonth": 8234567,
      "platformFees": 10234567,
      "growth": "+18%"
    },
    "services": {
      "totalListings": 23456,
      "activeListings": 20123,
      "byCategory": {
        "cleaning": 8934,
        "plumbing": 5678
      }
    },
    "engagement": {
      "activeUsers": 38942,
      "dailyActiveUsers": 12345,
      "averageSessionDuration": "18 minutes",
      "bounceRate": 23
    },
    "geography": {
      "topCities": [
        {
          "city": "Manila",
          "users": 15678,
          "bookings": 45678,
          "revenue": 12345678
        }
      ]
    }
  }
}
```

---

### 2. Get User Analytics

Get detailed user behavior analytics.

**Endpoint:** `GET /analytics/admin/users`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK` (comprehensive user analytics)

---

### 3. Get Service Analytics

Get service marketplace analytics.

**Endpoint:** `GET /analytics/admin/services`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK` (comprehensive service analytics)

---

### 4. Get Provider Performance Analytics

Get provider performance metrics.

**Endpoint:** `GET /analytics/admin/providers`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

## Content Moderation

### 1. Get Reported Content

Get list of reported content for review.

**Endpoint:** `GET /moderation/reports`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Content type (service, review, user, message)
- `status`: Status (pending, reviewed, resolved)
- `severity`: Severity level (low, medium, high, critical)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report123",
        "type": "service",
        "contentId": "service456",
        "content": {
          "title": "House Cleaning Service",
          "description": "..."
        },
        "reportedBy": {
          "id": "user789",
          "name": "Maria G."
        },
        "reason": "misleading_information",
        "description": "Service description does not match actual service provided",
        "evidence": [
          "https://cloudinary.com/evidence1.jpg"
        ],
        "severity": "medium",
        "status": "pending",
        "createdAt": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": { ... },
    "summary": {
      "totalReports": 234,
      "pending": 45,
      "resolved": 189
    }
  }
}
```

---

### 2. Review Report

Review and take action on reported content.

**Endpoint:** `PUT /moderation/reports/:id/review`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "remove_content",
  "decision": "Misleading information confirmed. Content removed.",
  "notifyReporter": true,
  "notifyOwner": true,
  "penalizeUser": true,
  "penaltyType": "warning",
  "notes": "First warning issued"
}
```

**Actions:**
- `no_action` - No action needed
- `remove_content` - Remove content
- `suspend_user` - Suspend user
- `ban_user` - Ban user
- `edit_content` - Edit content
- `warning` - Issue warning

**Response:** `200 OK`

---

### 3. Get Review Moderation Queue

Get reviews pending moderation.

**Endpoint:** `GET /moderation/reviews`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `flagged`: Boolean (show only flagged reviews)
- `rating`: Filter by rating

**Response:** `200 OK`

---

### 4. Moderate Review

Approve, edit, or remove reviews.

**Endpoint:** `PUT /moderation/reviews/:id/moderate`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "remove",
  "reason": "Inappropriate language",
  "notifyReviewer": true
}
```

**Response:** `200 OK`

---

## Trust & Verification

### 1. Get Verification Requests

Get pending verification requests.

**Endpoint:** `GET /trust-verification/admin/requests`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, approved, rejected)
- `type`: Verification type (identity, business, background)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "verify123",
        "user": {
          "id": "user456",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "type": "identity",
        "status": "pending",
        "documents": [
          {
            "type": "government_id",
            "url": "https://cloudinary.com/id_front.jpg",
            "uploadedAt": "2026-01-07T09:00:00Z"
          },
          {
            "type": "government_id_back",
            "url": "https://cloudinary.com/id_back.jpg",
            "uploadedAt": "2026-01-07T09:00:00Z"
          }
        ],
        "submittedAt": "2026-01-07T09:00:00Z",
        "priority": "normal"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2. Review Verification Request

Approve or reject verification requests.

**Endpoint:** `PUT /trust-verification/:id/review`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "decision": "approved",
  "notes": "All documents verified successfully",
  "expiryDate": "2027-01-07",
  "verifiedBy": "admin123",
  "notifyUser": true
}
```

**Decisions:**
- `approved` - Verification approved
- `rejected` - Verification rejected
- `pending_info` - Request more information

**Response:** `200 OK`

---

## Settings & Configuration

### 1. Get App Settings

Get current application settings.

**Endpoint:** `GET /settings/app`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "general": {
      "appName": "LocalPro Super App",
      "supportEmail": "support@localpro.com",
      "supportPhone": "+639171234567",
      "defaultCurrency": "PHP",
      "defaultLanguage": "en"
    },
    "business": {
      "platformFee": 10,
      "minimumWithdrawal": 500,
      "withdrawalProcessingTime": "2-3 business days"
    },
    "features": {
      "marketplace": {
        "enabled": true,
        "requiresVerification": true,
        "allowInstantBooking": true
      },
      "jobBoard": {
        "enabled": true,
        "requiresVerification": false
      },
      "referrals": {
        "enabled": true,
        "baseReward": 100
      }
    },
    "security": {
      "requirePhoneVerification": true,
      "requireEmailVerification": true,
      "sessionTimeout": 24,
      "maxLoginAttempts": 5
    },
    "payments": {
      "methods": ["paypal", "paymaya", "gcash", "bank_transfer"],
      "defaultMethod": "paypal"
    }
  }
}
```

---

### 2. Update App Settings

Update application settings.

**Endpoint:** `PUT /settings/app`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "business": {
    "platformFee": 12,
    "minimumWithdrawal": 1000
  },
  "features": {
    "marketplace": {
      "allowInstantBooking": false
    }
  }
}
```

**Response:** `200 OK`

---

### 3. Toggle Feature Flag

Enable or disable platform features.

**Endpoint:** `POST /settings/app/features/toggle`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "feature": "marketplace",
  "enabled": false,
  "reason": "Maintenance",
  "notifyUsers": true
}
```

**Features:**
- `marketplace` - Service marketplace
- `jobBoard` - Job board
- `referrals` - Referral system
- `academy` - Training academy
- `rentals` - Equipment rentals
- `supplies` - Supplies marketplace

**Response:** `200 OK`

---

### 4. Manage Service Categories

Add, update, or remove service categories.

**Endpoint:** `POST /marketplace/services/categories`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "carpentry",
  "displayName": "Carpentry Services",
  "description": "Professional carpentry and woodwork services",
  "icon": "🔨",
  "featured": true,
  "order": 5
}
```

**Response:** `201 Created`

---

## System Monitoring

### 1. Get System Health

Get system health status.

**Endpoint:** `GET /settings/app/health`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-07T10:00:00Z",
    "uptime": "15 days, 6 hours",
    "services": {
      "api": {
        "status": "operational",
        "responseTime": "45ms"
      },
      "database": {
        "status": "operational",
        "connections": 45,
        "maxConnections": 100
      },
      "storage": {
        "status": "operational",
        "usage": "45%"
      },
      "email": {
        "status": "operational",
        "queue": 12
      },
      "sms": {
        "status": "operational",
        "queue": 3
      }
    },
    "performance": {
      "cpu": 34,
      "memory": 56,
      "disk": 45
    }
  }
}
```

---

### 2. Get Error Logs

Get system error logs.

**Endpoint:** `GET /logs`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `level`: Log level (error, warning, info)
- `category`: Category (application, database, payment)
- `startDate`: From date
- `endDate`: To date

**Response:** `200 OK`

---

### 3. Get Error Monitoring Dashboard

Get error monitoring overview.

**Endpoint:** `GET /error-monitoring/dashboard/summary`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalErrors": 234,
      "unresolvedErrors": 45,
      "criticalErrors": 3,
      "errorRate": 0.02
    },
    "byCategory": {
      "payment": 89,
      "database": 67,
      "api": 45,
      "authentication": 33
    },
    "trends": {
      "daily": [
        {
          "date": "2026-01-01",
          "count": 12
        }
      ]
    },
    "topErrors": [
      {
        "error": "Payment Gateway Timeout",
        "count": 23,
        "lastOccurred": "2026-01-07T09:45:00Z"
      }
    ]
  }
}
```

---

### 4. Get Audit Logs

Get audit trail logs.

**Endpoint:** `GET /audit-logs`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user
- `action`: Filter by action type
- `category`: Filter by category
- `startDate`: From date
- `endDate`: To date

**Response:** `200 OK`

---

## Agency Management

### 1. Get All Agencies

Get list of all agencies.

**Endpoint:** `GET /agencies/admin/all`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (active, suspended)
- `verified`: Filter by verification status

**Response:** `200 OK`

---

### 2. Verify Agency

Verify an agency.

**Endpoint:** `PUT /agencies/:id/verify`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "verified": true,
  "verificationNotes": "Business documents verified",
  "notifyOwner": true
}
```

**Response:** `200 OK`

---

### 3. Get Agency Analytics

Get analytics for specific agency.

**Endpoint:** `GET /agencies/:id/analytics/admin`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

## Notification Management

### 1. Send Bulk Notifications

Send notifications to multiple users.

**Endpoint:** `POST /notifications/admin/bulk`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipients": {
    "type": "all",
    "filters": {
      "roles": ["provider"],
      "status": "active",
      "location": "Manila"
    }
  },
  "notification": {
    "title": "Important Platform Update",
    "message": "We're introducing new features next week!",
    "type": "system_announcement",
    "priority": "high",
    "channels": ["push", "email"],
    "actionUrl": "https://localpro.com/updates"
  },
  "schedule": {
    "sendAt": "2026-01-10T10:00:00Z"
  }
}
```

**Recipient Types:**
- `all` - All users
- `specific` - Specific user IDs
- `filtered` - Based on filters

**Response:** `201 Created`

---

### 2. Get Notification Analytics

Get notification performance metrics.

**Endpoint:** `GET /notifications/admin/analytics`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

---

## Subscription Management

### 1. Get All Subscriptions

Get list of all premium subscriptions.

**Endpoint:** `GET /localpro-plus/admin/subscriptions`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (active, cancelled, expired)
- `plan`: Filter by plan ID

**Response:** `200 OK`

---

### 2. Manage Subscription Plans

Create, update, or delete subscription plans.

**Create Plan:**
**Endpoint:** `POST /localpro-plus/plans`

**Update Plan:**
**Endpoint:** `PUT /localpro-plus/plans/:id`

**Delete Plan:**
**Endpoint:** `DELETE /localpro-plus/plans/:id`

---

### 3. Override Subscription

Manually adjust user subscriptions.

**Endpoint:** `PUT /localpro-plus/admin/subscriptions/:id/override`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "extend",
  "duration": 30,
  "reason": "Compensation for service disruption",
  "notifyUser": true
}
```

**Actions:**
- `extend` - Extend subscription
- `cancel` - Cancel subscription
- `upgrade` - Upgrade plan
- `downgrade` - Downgrade plan

**Response:** `200 OK`

---

## Referral Management

### 1. Get Referral Analytics

Get comprehensive referral analytics.

**Endpoint:** `GET /referrals/analytics`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalReferrals": 5678,
      "successfulReferrals": 4234,
      "pendingReferrals": 892,
      "conversionRate": 74.6
    },
    "rewards": {
      "totalPaid": 423400,
      "pendingPayouts": 89200,
      "averageReward": 100
    },
    "topReferrers": [
      {
        "userId": "user123",
        "name": "John D.",
        "referrals": 87,
        "earnings": 13050
      }
    ],
    "trends": {
      "daily": [
        {
          "date": "2026-01-01",
          "referrals": 23,
          "conversions": 18
        }
      ]
    }
  }
}
```

---

### 2. Process Referral Completion

Manually process referral completion.

**Endpoint:** `POST /referrals/process`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "referralId": "ref123",
  "status": "completed",
  "rewardAmount": 150,
  "notes": "Referral completed successfully"
}
```

**Response:** `200 OK`

---

## Best Practices

### 1. Security

- **Use strong passwords** and 2FA for admin accounts
- **Regularly review** audit logs
- **Monitor** unusual activity patterns
- **Limit** admin access to necessary personnel
- **Keep credentials secure** and never share

### 2. User Management

- **Respond promptly** to user reports
- **Be fair and consistent** in moderation
- **Document decisions** clearly
- **Communicate** with affected users
- **Follow escalation procedures**

### 3. Financial Management

- **Process withdrawals** within SLA
- **Monitor** for fraudulent activity
- **Reconcile** accounts regularly
- **Generate reports** monthly
- **Maintain** financial records

### 4. Content Moderation

- **Review reports** daily
- **Apply policies** consistently
- **Document** decisions
- **Escalate** complex cases
- **Maintain** quality standards

### 5. System Monitoring

- **Check system health** daily
- **Monitor** error rates
- **Review** performance metrics
- **Address** critical issues immediately
- **Plan** for maintenance windows

---

## Support & Resources

### Admin Support

- **Admin Support**: admin-support@localpro.com
- **Emergency Hotline**: +63917-EMERGENCY
- **Admin Portal**: https://admin.localpro.com
- **Documentation**: https://docs.localpro.com/admin

### Training

- **Admin Training**: Onboarding and ongoing training
- **Policy Manual**: Complete policy documentation
- **Video Tutorials**: Step-by-step guides

---

**© 2026 LocalPro Super App. All rights reserved.**
