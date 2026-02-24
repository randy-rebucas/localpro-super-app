# LocalPro Super App - API Reference

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [API Endpoints](#api-endpoints)
   - [Authentication](#1-authentication-apiauth)
   - [Marketplace](#2-marketplace-apimarketplace)
   - [Jobs](#3-jobs-apijobs)
   - [Providers](#4-providers-apiproviders)
   - [Agencies](#5-agencies-apiagencies)
   - [Escrow](#6-escrow-apiescrows)
   - [Finance](#7-finance-apifinance)
   - [Communication](#8-communication-apicommunication)
   - [Live Chat](#9-live-chat-apilive-chat)
   - [Academy](#10-academy-apiacademy)
   - [Supplies](#11-supplies-apisupplies)
   - [Rentals](#12-rentals-apirentals)
   - [Referrals](#13-referrals-apireferrals)
   - [LocalPro Plus](#14-localpro-plus-apilocalpro-plus)
   - [Notifications](#15-notifications-apinotifications)
   - [Search](#16-search-apisearch)
   - [Availability](#17-availability-apiavailability)
   - [Scheduling](#18-scheduling-apischeduling)
   - [Trust Verification](#19-trust-verification-apitrust-verification)
   - [User Management](#20-user-management-apiusers)
   - [Payment Gateways](#21-payment-gateways)
   - [Webhooks](#22-webhooks-apiwebhooks)
   - [API Keys](#23-api-keys-apiapi-keys)
   - [Analytics](#24-analytics-apianalytics)
   - [Ads](#25-ads-apiads)
   - [Announcements](#26-announcements-apiannouncements)
   - [Favorites](#27-favorites-apifavorites)
   - [Settings](#28-settings-apisettings)
   - [Support](#29-support-apisupport)
   - [GPS & Time Tracking](#30-gps--time-tracking)
   - [Quotes & Invoices](#31-quotes--invoices)
   - [Maps](#32-maps-apimaps)
   - [Staff](#33-staff-apistaff)
   - [Partners](#34-partners-apipartners)
   - [AI Bot](#35-ai-bot-apiai-bot)

---

## Overview

**Base URL:** `https://api.localpro.app/api` (Production)
**Development:** `http://localhost:3000/api`

**API Version:** v1.0
**Content-Type:** `application/json`

### Quick Start
```bash
# 1. Register/Login to get token
curl -X POST /api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# 2. Verify OTP
curl -X POST /api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'

# 3. Use token for authenticated requests
curl -X GET /api/auth/me \
  -H "Authorization: Bearer <your_token>"
```

---

## Authentication

### Methods

#### 1. Bearer Token (JWT)
```http
Authorization: Bearer <access_token>
```

#### 2. API Key Authentication
```http
X-API-Key: <api_key>
X-API-Secret: <api_secret>
```

### Token Lifecycle
| Token Type | Expiration | Refresh Method |
|------------|------------|----------------|
| Access Token | 15 minutes | Use refresh token |
| Refresh Token | 7 days | Re-authenticate |

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

---

## Common Patterns

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <optional-correlation-id>
```

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Query Parameters for Pagination
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for desc) |

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| SMS/OTP | 5 requests | 15 minutes |
| Authentication | 10 requests | 15 minutes |
| Payment | 20 requests | 1 minute |
| Search | 60 requests | 1 minute |
| General API | 100 requests | 1 minute |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": { },
  "requestId": "uuid"
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Common Error Codes
| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Request body validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `INVALID_TOKEN` | Token expired or invalid |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYMENT_FAILED` | Payment processing error |
| `VERIFICATION_REQUIRED` | Account verification needed |

---

## API Endpoints

---

## 1. Authentication (`/api/auth`)

### Send Verification Code
```http
POST /api/auth/send-code
```

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "data": {
    "phoneNumber": "+1234567890",
    "expiresIn": 300
  }
}
```

---

### Verify Code
```http
POST /api/auth/verify-code
```

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 900,
    "user": {
      "id": "user_id",
      "phoneNumber": "+1234567890",
      "roles": ["client"],
      "isVerified": true,
      "profile": { }
    }
  }
}
```

---

### Register with Email
```http
POST /api/auth/register-email
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

### Login with Email
```http
POST /api/auth/login-email
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

---

### MPIN Login
```http
POST /api/auth/mpin/login
```

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "mpin": "1234"
}
```

---

### Set MPIN
```http
POST /api/auth/mpin/set
Authorization: Bearer <token>
```

**Request:**
```json
{
  "mpin": "1234"
}
```

---

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["client", "provider"],
    "isVerified": true,
    "profile": {
      "avatar": { "url": "https://...", "thumbnail": "https://..." },
      "bio": "Professional service provider",
      "address": {
        "street": "123 Main St",
        "city": "Manila",
        "state": "Metro Manila",
        "zipCode": "1000",
        "country": "Philippines"
      }
    },
    "mpinEnabled": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "profile": {
    "bio": "Updated bio",
    "address": {
      "street": "456 New St",
      "city": "Makati",
      "state": "Metro Manila",
      "zipCode": "1200"
    }
  }
}
```

---

### Upload Avatar
```http
POST /api/auth/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar`: Image file (JPG, PNG, max 5MB)

---

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## 2. Marketplace (`/api/marketplace`)

### List Services
```http
GET /api/marketplace/services?page=1&limit=10&category=cleaning
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `category` | string | Filter by category |
| `subcategory` | string | Filter by subcategory |
| `search` | string | Search term |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `rating` | number | Minimum rating |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "service_id",
      "title": "Professional House Cleaning",
      "description": "Thorough house cleaning service...",
      "category": "cleaning",
      "subcategory": "house_cleaning",
      "provider": {
        "id": "provider_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "avatar": { "url": "https://..." }
      },
      "pricing": {
        "type": "hourly",
        "basePrice": 25,
        "currency": "USD"
      },
      "rating": {
        "average": 4.8,
        "count": 156
      },
      "images": [
        { "url": "https://...", "thumbnail": "https://..." }
      ],
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### Get Service Details
```http
GET /api/marketplace/services/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "service_id",
    "title": "Professional House Cleaning",
    "description": "Full description...",
    "category": "cleaning",
    "subcategory": "house_cleaning",
    "provider": {
      "id": "provider_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": { "url": "https://..." },
      "rating": 4.9,
      "completedJobs": 234
    },
    "pricing": {
      "type": "hourly",
      "basePrice": 25,
      "currency": "USD"
    },
    "availability": {
      "schedule": [
        { "day": "monday", "startTime": "09:00", "endTime": "17:00" },
        { "day": "tuesday", "startTime": "09:00", "endTime": "17:00" }
      ],
      "timezone": "Asia/Manila"
    },
    "serviceArea": {
      "coordinates": { "type": "Point", "coordinates": [121.0244, 14.5547] },
      "radius": 25
    },
    "features": ["Deep cleaning", "Eco-friendly products", "Same-day service"],
    "requirements": ["Access to water", "Parking space"],
    "serviceType": "one_time",
    "estimatedDuration": { "min": 120, "max": 180 },
    "warranty": {
      "hasWarranty": true,
      "duration": 7,
      "description": "7-day satisfaction guarantee"
    },
    "servicePackages": [
      {
        "name": "Basic Clean",
        "description": "Standard cleaning",
        "price": 50,
        "duration": 120
      },
      {
        "name": "Deep Clean",
        "description": "Thorough deep cleaning",
        "price": 100,
        "duration": 240
      }
    ],
    "addOns": [
      { "name": "Window cleaning", "price": 20 },
      { "name": "Oven cleaning", "price": 15 }
    ],
    "rating": { "average": 4.8, "count": 156 },
    "images": [],
    "isActive": true
  }
}
```

---

### Search Nearby Services
```http
GET /api/marketplace/services/nearby?latitude=14.5547&longitude=121.0244&radius=10
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | Yes | User latitude |
| `longitude` | number | Yes | User longitude |
| `radius` | number | No | Search radius in km (default: 25) |
| `category` | string | No | Filter by category |

---

### Create Booking
```http
POST /api/marketplace/bookings
Authorization: Bearer <token>
```

**Request:**
```json
{
  "serviceId": "service_id",
  "bookingDate": "2024-02-15T10:00:00Z",
  "duration": 120,
  "address": {
    "street": "123 Main Street",
    "city": "Makati",
    "state": "Metro Manila",
    "zipCode": "1200",
    "country": "Philippines",
    "coordinates": {
      "lat": 14.5547,
      "lng": 121.0244
    }
  },
  "specialInstructions": "Please ring doorbell twice",
  "selectedPackage": "Deep Clean",
  "addOns": ["Window cleaning"],
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking_id",
    "service": { "id": "service_id", "title": "..." },
    "client": { "id": "client_id" },
    "provider": { "id": "provider_id" },
    "bookingDate": "2024-02-15T10:00:00Z",
    "duration": 120,
    "status": "pending",
    "pricing": {
      "basePrice": 100,
      "additionalFees": [
        { "description": "Window cleaning", "amount": 20 }
      ],
      "totalAmount": 120,
      "currency": "USD"
    },
    "payment": {
      "status": "pending",
      "method": "paypal"
    },
    "escrow": {
      "id": "escrow_id",
      "status": "CREATED"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Update Booking Status
```http
PUT /api/marketplace/bookings/:id/status
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "confirmed",
  "note": "Provider confirmed the booking"
}
```

**Valid Status Transitions:**
- `pending` → `confirmed` | `cancelled`
- `confirmed` → `in_progress` | `cancelled`
- `in_progress` → `completed`
- `completed` → (terminal)
- `cancelled` → (terminal)

---

### Submit Review
```http
POST /api/marketplace/bookings/:id/review
Authorization: Bearer <token>
```

**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent service! Very professional and thorough.",
  "categories": {
    "quality": 5,
    "timeliness": 5,
    "communication": 4,
    "value": 5
  },
  "wouldRecommend": true
}
```

---

### Create Service (Provider)
```http
POST /api/marketplace/services
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Professional Plumbing Services",
  "description": "Expert plumbing services for residential and commercial...",
  "category": "plumbing",
  "subcategory": "repairs",
  "pricing": {
    "type": "hourly",
    "basePrice": 45,
    "currency": "USD"
  },
  "availability": {
    "schedule": [
      { "day": "monday", "startTime": "08:00", "endTime": "18:00", "isAvailable": true },
      { "day": "tuesday", "startTime": "08:00", "endTime": "18:00", "isAvailable": true }
    ],
    "timezone": "Asia/Manila"
  },
  "serviceArea": {
    "coordinates": [121.0244, 14.5547],
    "radius": 30
  },
  "features": ["Emergency service", "Licensed", "Insured"],
  "serviceType": "one_time",
  "estimatedDuration": { "min": 60, "max": 180 },
  "equipmentProvided": true,
  "materialsIncluded": false
}
```

---

## 3. Jobs (`/api/jobs`)

### List Jobs
```http
GET /api/jobs?page=1&limit=10&category=technology
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `category` | string | Job category ID |
| `jobType` | string | full_time, part_time, contract, etc. |
| `experienceLevel` | string | entry, junior, mid, senior, etc. |
| `location` | string | City or state |
| `isRemote` | boolean | Remote jobs only |
| `minSalary` | number | Minimum salary |
| `maxSalary` | number | Maximum salary |

---

### Get Job Details
```http
GET /api/jobs/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_id",
    "title": "Senior Software Engineer",
    "description": "We are looking for an experienced...",
    "company": {
      "name": "Tech Corp Inc.",
      "logo": { "url": "https://..." },
      "website": "https://techcorp.com",
      "size": "large",
      "industry": "Technology",
      "location": {
        "city": "Makati",
        "state": "Metro Manila",
        "country": "Philippines",
        "isRemote": true,
        "remoteType": "hybrid"
      }
    },
    "employer": { "id": "employer_id" },
    "category": { "id": "cat_id", "name": "Technology" },
    "jobType": "full_time",
    "experienceLevel": "senior",
    "salary": {
      "min": 80000,
      "max": 120000,
      "currency": "USD",
      "period": "yearly",
      "isNegotiable": true
    },
    "benefits": ["health_insurance", "paid_time_off", "remote_work"],
    "requirements": {
      "skills": ["JavaScript", "React", "Node.js"],
      "education": { "level": "bachelor", "field": "Computer Science" },
      "experience": { "years": 5, "description": "5+ years in software development" },
      "certifications": ["AWS Certified"]
    },
    "responsibilities": [
      "Design and implement scalable solutions",
      "Lead technical discussions",
      "Mentor junior developers"
    ],
    "applicationProcess": {
      "deadline": "2024-03-31T23:59:59Z",
      "startDate": "2024-04-15",
      "applicationMethod": "platform"
    },
    "status": "active",
    "visibility": "public",
    "analytics": {
      "applicationsCount": 45,
      "viewsCount": 1250
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Apply for Job
```http
POST /api/jobs/:id/apply
Authorization: Bearer <token>
```

**Request:**
```json
{
  "coverLetter": "Dear Hiring Manager, I am excited to apply...",
  "resume": {
    "url": "https://cloudinary.com/...",
    "filename": "john_doe_resume.pdf"
  },
  "portfolio": {
    "url": "https://portfolio.example.com",
    "description": "My portfolio showcasing..."
  },
  "expectedSalary": 100000,
  "availability": "2024-04-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "app_id",
    "jobId": "job_id",
    "status": "pending",
    "appliedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Create Job (Employer)
```http
POST /api/jobs
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Marketing Manager",
  "description": "Lead our marketing team...",
  "company": {
    "name": "Growth Company",
    "website": "https://growth.co",
    "size": "medium",
    "industry": "Marketing",
    "location": {
      "address": "BGC, Taguig",
      "city": "Taguig",
      "state": "Metro Manila",
      "country": "Philippines",
      "isRemote": false,
      "remoteType": "on_site"
    }
  },
  "category": "category_id",
  "jobType": "full_time",
  "experienceLevel": "mid",
  "salary": {
    "min": 50000,
    "max": 70000,
    "currency": "USD",
    "period": "yearly"
  },
  "benefits": ["health_insurance", "professional_development"],
  "requirements": {
    "skills": ["Digital Marketing", "SEO", "Analytics"],
    "education": { "level": "bachelor" },
    "experience": { "years": 3 }
  },
  "responsibilities": ["Develop marketing strategies", "Manage team"],
  "applicationProcess": {
    "deadline": "2024-03-15T23:59:59Z"
  },
  "status": "active"
}
```

---

### Update Application Status (Employer)
```http
PUT /api/jobs/:jobId/applications/:applicationId/status
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "shortlisted",
  "feedback": {
    "comments": "Strong technical background",
    "rating": 4
  }
}
```

**Valid Statuses:** `pending`, `reviewing`, `shortlisted`, `interviewed`, `rejected`, `hired`

---

## 4. Providers (`/api/providers`)

### List Providers
```http
GET /api/providers?page=1&limit=10&skills=plumbing
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `skills` | string/array | Filter by skills |
| `skillsMatch` | string | `any` or `all` |
| `category` | string | Service category |
| `city` | string | City filter |
| `state` | string | State filter |
| `minRating` | number | Minimum rating |
| `featured` | boolean | Featured only |

---

### Get Provider Profile
```http
GET /api/providers/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "provider_id",
    "userId": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": { "url": "https://..." }
    },
    "status": "active",
    "providerType": "individual",
    "professionalInfo": {
      "specialties": [
        {
          "category": "plumbing",
          "subcategories": ["repairs", "installation"],
          "skills": [{ "id": "skill_id", "name": "Pipe Repair" }],
          "experience": { "years": 10 }
        }
      ],
      "serviceAreas": [
        { "city": "Manila", "state": "Metro Manila" }
      ]
    },
    "verification": {
      "identityVerified": true,
      "backgroundCheckCompleted": true,
      "businessVerified": false
    },
    "performance": {
      "rating": 4.9,
      "totalReviews": 156,
      "totalJobs": 234,
      "completedJobs": 228,
      "cancellationRate": 2.5,
      "responseTime": 15
    },
    "onboarding": {
      "completed": true,
      "progress": 100
    },
    "settings": {
      "profileVisibility": "public",
      "allowDirectBooking": true
    }
  }
}
```

---

### Update Provider Profile
```http
PUT /api/providers/profile
Authorization: Bearer <token>
```

**Request:**
```json
{
  "providerType": "individual",
  "professionalInfo": {
    "specialties": [
      {
        "category": "electrical",
        "subcategories": ["wiring", "repairs"],
        "skills": ["skill_id_1", "skill_id_2"]
      }
    ],
    "serviceAreas": [
      { "city": "Makati", "state": "Metro Manila" }
    ]
  },
  "settings": {
    "profileVisibility": "public",
    "allowDirectBooking": true,
    "requireApproval": false
  }
}
```

---

### Get Provider Dashboard
```http
GET /api/providers/dashboard/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEarnings": 15000,
      "pendingPayouts": 500,
      "activeBookings": 3,
      "completedJobs": 45
    },
    "performance": {
      "rating": 4.8,
      "responseRate": 95,
      "completionRate": 98
    },
    "recentBookings": [],
    "upcomingSchedule": [],
    "notifications": []
  }
}
```

---

## 5. Agencies (`/api/agencies`)

### List Agencies
```http
GET /api/agencies?page=1&limit=10
```

---

### Get Agency Details
```http
GET /api/agencies/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agency_id",
    "name": "Premium Services Agency",
    "description": "Full-service home maintenance agency",
    "owner": { "id": "owner_id", "firstName": "Jane", "lastName": "Smith" },
    "admins": [
      { "user": { "id": "admin_id" }, "role": "manager", "permissions": [] }
    ],
    "providers": [
      {
        "user": { "id": "provider_id", "firstName": "John" },
        "status": "active",
        "commissionRate": 15,
        "performance": { "rating": 4.8, "totalJobs": 50 }
      }
    ],
    "contact": {
      "email": "contact@premiumservices.com",
      "phone": "+1234567890",
      "website": "https://premiumservices.com",
      "address": { "city": "Manila", "state": "Metro Manila" }
    },
    "business": {
      "type": "llc",
      "registrationNumber": "REG123456",
      "insurance": { "provider": "InsureCo", "coverageAmount": 1000000 }
    },
    "services": [
      { "category": "cleaning", "subcategories": ["house_cleaning", "office_cleaning"] }
    ],
    "verification": { "isVerified": true, "verifiedAt": "2024-01-01T00:00:00Z" },
    "analytics": {
      "totalBookings": 1500,
      "totalRevenue": 75000,
      "averageRating": 4.7
    }
  }
}
```

---

### Create Agency
```http
POST /api/agencies
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "My Agency",
  "description": "Professional home services",
  "contact": {
    "email": "info@myagency.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Business Ave",
      "city": "Makati",
      "state": "Metro Manila",
      "zipCode": "1200"
    }
  },
  "business": {
    "type": "llc",
    "registrationNumber": "BN123456"
  },
  "services": [
    { "category": "cleaning" }
  ]
}
```

---

### Add Provider to Agency
```http
POST /api/agencies/:id/providers
Authorization: Bearer <token>
```

**Request:**
```json
{
  "userId": "provider_user_id",
  "commissionRate": 15
}
```

---

## 6. Escrow (`/api/escrows`)

### Create Escrow
```http
POST /api/escrows/create
Authorization: Bearer <token>
```

**Request:**
```json
{
  "bookingId": "booking_id",
  "amount": 10000,
  "currency": "USD",
  "description": "Payment for house cleaning service"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "escrow_id",
    "bookingId": "booking_id",
    "clientId": "client_id",
    "providerId": "provider_id",
    "amount": 10000,
    "currency": "USD",
    "status": "CREATED",
    "holdProvider": "paymongo",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Submit Proof of Work
```http
POST /api/escrows/:id/proof-of-work
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `documents[]`: Array of files (images/PDFs)
- `notes`: Description of completed work

---

### Initiate Dispute
```http
POST /api/escrows/:id/dispute
Authorization: Bearer <token>
```

**Request:**
```json
{
  "reason": "Work not completed as agreed",
  "description": "The provider did not clean the second floor as included in the service package."
}
```

---

### Resolve Dispute (Admin)
```http
POST /api/escrows/:id/dispute/resolve
Authorization: Bearer <token>
```

**Request:**
```json
{
  "decision": "SPLIT",
  "splitPercentage": {
    "client": 50,
    "provider": 50
  },
  "notes": "Partial work was completed, splitting payment"
}
```

**Decision Options:** `REFUND_CLIENT`, `PAYOUT_PROVIDER`, `SPLIT`

---

## 7. Finance (`/api/finance`)

### Get Financial Overview
```http
GET /api/finance/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 5000,
      "pendingBalance": 500,
      "currency": "USD"
    },
    "earnings": {
      "today": 150,
      "thisWeek": 800,
      "thisMonth": 3500,
      "total": 25000
    },
    "expenses": {
      "thisMonth": 200,
      "total": 1500
    },
    "pendingPayouts": 500,
    "recentTransactions": []
  }
}
```

---

### Get Transactions
```http
GET /api/finance/transactions?page=1&limit=20&type=earning
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | earning, expense, withdrawal, refund |
| `startDate` | date | Filter start date |
| `endDate` | date | Filter end date |

---

### Request Withdrawal
```http
POST /api/finance/withdraw
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 1000,
  "method": "bank_transfer",
  "bankAccount": {
    "bankName": "Bank of the Philippines",
    "accountNumber": "1234567890",
    "accountName": "John Doe"
  }
}
```

---

## 8. Communication (`/api/communication`)

### List Conversations
```http
GET /api/communication/conversations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conversation_id",
      "participants": [
        { "id": "user_1", "firstName": "John", "avatar": {} },
        { "id": "user_2", "firstName": "Jane", "avatar": {} }
      ],
      "lastMessage": {
        "content": "Thanks for your help!",
        "sender": "user_1",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Send Message
```http
POST /api/communication/conversations/:id/messages
Authorization: Bearer <token>
```

**Request:**
```json
{
  "content": "Hello! I have a question about the booking.",
  "type": "text"
}
```

**For file attachments:**
```http
POST /api/communication/conversations/:id/messages
Content-Type: multipart/form-data
```
- `content`: Message text
- `type`: "image" | "file"
- `file`: Attachment

---

## 9. Live Chat (`/api/live-chat`)

### Create Chat Session
```http
POST /api/live-chat/sessions
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I need help with my booking"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_id",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Send Chat Message
```http
POST /api/live-chat/sessions/:sessionId/messages
```

**Request:**
```json
{
  "content": "Can you help me reschedule my appointment?"
}
```

---

### Rate Session
```http
POST /api/live-chat/sessions/:sessionId/rate
```

**Request:**
```json
{
  "rating": 5,
  "comment": "Very helpful support!"
}
```

---

## 10. Academy (`/api/academy`)

### List Courses
```http
GET /api/academy/courses?category=business&level=beginner
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Course category |
| `level` | string | beginner, intermediate, advanced, expert |
| `search` | string | Search term |
| `instructor` | string | Instructor ID |

---

### Enroll in Course
```http
POST /api/academy/courses/:id/enroll
Authorization: Bearer <token>
```

**Request:**
```json
{
  "paymentMethod": "wallet"
}
```

---

### Update Progress
```http
PUT /api/academy/courses/:id/progress
Authorization: Bearer <token>
```

**Request:**
```json
{
  "lessonId": "lesson_id",
  "completed": true,
  "timeSpent": 1800
}
```

---

## 11. Supplies (`/api/supplies`)

### List Supplies
```http
GET /api/supplies?category=tools&search=drill
```

---

### Order Supply
```http
POST /api/supplies/:id/order
Authorization: Bearer <token>
```

**Request:**
```json
{
  "quantity": 2,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Manila",
    "state": "Metro Manila",
    "zipCode": "1000"
  },
  "paymentMethod": "paypal"
}
```

---

## 12. Rentals (`/api/rentals`)

### Book Rental
```http
POST /api/rentals/:id/book
Authorization: Bearer <token>
```

**Request:**
```json
{
  "startDate": "2024-02-01",
  "endDate": "2024-02-07",
  "addOns": ["insurance"],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Manila"
  }
}
```

---

## 13. Referrals (`/api/referrals`)

### Get Referral Stats
```http
GET /api/referrals/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "JOHN2024",
    "referralLink": "https://app.localpro.com/r/JOHN2024",
    "tier": "gold",
    "stats": {
      "totalReferrals": 25,
      "successfulReferrals": 20,
      "pendingReferrals": 5,
      "totalEarnings": 500
    },
    "nextTier": {
      "name": "platinum",
      "referralsNeeded": 5
    }
  }
}
```

---

### Send Invitation
```http
POST /api/referrals/invite
Authorization: Bearer <token>
```

**Request:**
```json
{
  "method": "email",
  "recipients": ["friend@example.com"],
  "message": "Join LocalPro and get $5 credit!"
}
```

---

## 14. LocalPro Plus (`/api/localpro-plus`)

> Full documentation: [LOCALPRO_PLUS_FEATURE.md](./LOCALPRO_PLUS_FEATURE.md)

### Endpoint Index

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/localpro-plus/plans` | No | — | List all active plans |
| `GET` | `/api/localpro-plus/plans/:id` | No | — | Get a single plan |
| `POST` | `/api/localpro-plus/plans` | Yes | Admin | Create a plan |
| `PUT` | `/api/localpro-plus/plans/:id` | Yes | Admin | Update a plan |
| `DELETE` | `/api/localpro-plus/plans/:id` | Yes | Admin | Delete a plan |
| `POST` | `/api/localpro-plus/subscribe/:planId` | Yes | Any | Initiate a subscription |
| `POST` | `/api/localpro-plus/confirm-payment` | Yes | Any | Confirm payment & activate subscription |
| `POST` | `/api/localpro-plus/cancel` | Yes | Any | Cancel active subscription |
| `POST` | `/api/localpro-plus/renew` | Yes | Any | Manually renew subscription |
| `GET` | `/api/localpro-plus/my-subscription` | Yes | Any | Get own subscription details |
| `PUT` | `/api/localpro-plus/settings` | Yes | Any | Update subscription settings |
| `GET` | `/api/localpro-plus/usage` | Yes | Any | Get usage stats & feature flags |
| `GET` | `/api/localpro-plus/analytics` | Yes | Admin | Platform-wide subscription analytics |
| `POST` | `/api/localpro-plus/admin/subscriptions` | Yes | Admin | Create a manual subscription |
| `GET` | `/api/localpro-plus/admin/subscriptions` | Yes | Admin | List all subscriptions |
| `GET` | `/api/localpro-plus/admin/subscriptions/user/:userId` | Yes | Admin | Get subscription by user ID |
| `PUT` | `/api/localpro-plus/admin/subscriptions/:subscriptionId` | Yes | Admin | Update a manual subscription |
| `DELETE` | `/api/localpro-plus/admin/subscriptions/:subscriptionId` | Yes | Admin | Cancel a manual subscription |

---

### GET /api/localpro-plus/plans
```http
GET /api/localpro-plus/plans
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64a...",
      "name": "Basic",
      "description": "Starter plan",
      "price": { "monthly": 9.99, "yearly": 99.99, "currency": "USD" },
      "features": [{ "name": "priority_support", "included": false }],
      "limits": { "maxServices": 5, "maxBookings": 20, "maxStorage": 500, "maxApiCalls": 1000 },
      "isActive": true,
      "isPopular": false
    }
  ]
}
```

---

### POST /api/localpro-plus/subscribe/:planId
```http
POST /api/localpro-plus/subscribe/:planId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "paymentMethod": "paymongo",
  "billingCycle": "monthly"
}
```

**Payment methods:** `paymongo`, `paypal`, `paymaya`
**Billing cycles:** `monthly` (30 days), `yearly` (365 days)

**Response `201`:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": { "status": "pending" },
    "paymentData": { }
  }
}
```

---

### POST /api/localpro-plus/confirm-payment
```http
POST /api/localpro-plus/confirm-payment
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "paymentId": "<gateway-order-or-payment-id>",
  "paymentMethod": "paypal"
}
```

**Supported methods:** `paypal`, `paymaya` only.

---

### POST /api/localpro-plus/cancel
```http
POST /api/localpro-plus/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{ "reason": "No longer needed" }
```

---

### POST /api/localpro-plus/renew
```http
POST /api/localpro-plus/renew
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{ "paymentMethod": "paypal" }
```

**Supported methods:** `paypal`, `paymaya` only.

---

### GET /api/localpro-plus/my-subscription
```http
GET /api/localpro-plus/my-subscription
Authorization: Bearer <token>
```

---

### GET /api/localpro-plus/usage
```http
GET /api/localpro-plus/usage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": { "name": "Premium" },
    "currentUsage": { "services": 3, "bookings": 12, "storage": 240, "apiCalls": 850 },
    "limits": { "maxServices": 10, "maxBookings": 50, "maxStorage": "unlimited", "maxApiCalls": 5000 },
    "features": {
      "prioritySupport": true,
      "advancedAnalytics": true,
      "customBranding": false,
      "apiAccess": true,
      "whiteLabel": false
    },
    "status": "active",
    "billingCycle": "monthly",
    "nextBillingDate": "2025-02-15T00:00:00.000Z",
    "daysUntilRenewal": 14
  }
}
```

---

### GET /api/localpro-plus/analytics *(Admin)*
```http
GET /api/localpro-plus/analytics
Authorization: Bearer <admin-token>
```

---

### POST /api/localpro-plus/admin/subscriptions *(Admin)*
```http
POST /api/localpro-plus/admin/subscriptions
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "64a...",
  "planId": "64b...",
  "billingCycle": "monthly",
  "startDate": "2025-01-15",
  "endDate": "2025-02-15",
  "reason": "Promotional access",
  "notes": "Granted during beta"
}
```

---

### GET /api/localpro-plus/admin/subscriptions *(Admin)*
```http
GET /api/localpro-plus/admin/subscriptions?status=active&page=1&limit=20
Authorization: Bearer <admin-token>
```

**Query Params:** `status`, `planId`, `isManual` (`'true'`/`'false'`), `page`, `limit`

---

### GET /api/localpro-plus/admin/subscriptions/user/:userId *(Admin)*
```http
GET /api/localpro-plus/admin/subscriptions/user/:userId
Authorization: Bearer <admin-token>
```

---

### PUT /api/localpro-plus/admin/subscriptions/:subscriptionId *(Admin)*
```http
PUT /api/localpro-plus/admin/subscriptions/:subscriptionId
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request:**
```json
{
  "planId": "64c...",
  "status": "active",
  "endDate": "2025-03-15",
  "billingCycle": "yearly",
  "reason": "Upgraded by support",
  "notes": "Customer requested"
}
```

> Only works on subscriptions where `isManual: true`.

---

### DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId *(Admin)*
```http
DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request:**
```json
{ "reason": "Fraudulent account" }
```

> Only works on subscriptions where `isManual: true`.

---

## 15. Notifications (`/api/notifications`)

### Register FCM Token
```http
POST /api/notifications/fcm-token
Authorization: Bearer <token>
```

**Request:**
```json
{
  "token": "fcm_token_string",
  "deviceId": "device_unique_id",
  "deviceType": "android"
}
```

---

### Get Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

---

### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

---

## 16. Search (`/api/search`)

### Global Search
```http
GET /api/search?q=plumber&type=services&location=Manila
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `type` | string | services, jobs, providers, courses, supplies, rentals |
| `category` | string | Category filter |
| `location` | string | Location filter |
| `minPrice` | number | Min price |
| `maxPrice` | number | Max price |
| `rating` | number | Min rating |

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [],
    "facets": {
      "categories": [
        { "name": "plumbing", "count": 45 },
        { "name": "electrical", "count": 23 }
      ],
      "priceRanges": [],
      "ratings": []
    },
    "suggestions": ["plumber near me", "plumbing services"]
  },
  "pagination": {}
}
```

---

## 17. Availability (`/api/availability`)

### Set Availability
```http
POST /api/availability
Authorization: Bearer <token>
```

**Request:**
```json
{
  "date": "2024-02-15",
  "slots": [
    { "start": "09:00", "end": "12:00" },
    { "start": "14:00", "end": "18:00" }
  ],
  "recurring": false
}
```

---

### Get Calendar View
```http
GET /api/availability/calendar?startDate=2024-02-01&endDate=2024-02-28
Authorization: Bearer <token>
```

---

## 18. Scheduling (`/api/scheduling`)

### Get Scheduling Suggestions
```http
GET /api/scheduling/suggestions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "suggestion_id",
      "type": "daily",
      "suggestedJobs": [
        {
          "jobId": "job_id",
          "title": "Plumbing repair",
          "matchScore": 0.95,
          "estimatedEarnings": 150
        }
      ],
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

---

## 19. Trust Verification (`/api/trust-verification`)

### Submit Verification Request
```http
POST /api/trust-verification/requests
Authorization: Bearer <token>
```

**Request:**
```json
{
  "type": "identity",
  "documents": [
    {
      "type": "government_id",
      "url": "https://cloudinary.com/..."
    },
    {
      "type": "selfie",
      "url": "https://cloudinary.com/..."
    }
  ],
  "personalInfo": {
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-15",
    "address": "123 Main St, Manila"
  }
}
```

---

## 20. User Management (`/api/users`)

### List Users (Admin)
```http
GET /api/users?page=1&limit=20&role=provider
Authorization: Bearer <admin_token>
```

---

### Update User Status (Admin)
```http
PATCH /api/users/:id/status
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "status": "suspended",
  "reason": "Policy violation"
}
```

---

## 21. Payment Gateways

### PayPal Webhook
```http
POST /api/paypal/webhook
```

Handles events:
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `BILLING.SUBSCRIPTION.*`

---

### PayMaya Checkout
```http
POST /api/paymaya/checkout
Authorization: Bearer <token>
```

**Request:**
```json
{
  "bookingId": "booking_id",
  "amount": 100,
  "currency": "PHP",
  "description": "Service payment"
}
```

---

### PayMongo Payment Intent
```http
POST /api/paymongo/create-intent
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 10000,
  "currency": "PHP",
  "description": "Booking payment",
  "metadata": {
    "bookingId": "booking_id"
  }
}
```

---

## 22. Webhooks (`/api/webhooks`)

### Create Webhook Subscription
```http
POST /api/webhooks/subscriptions
Authorization: Bearer <token>
```

**Request:**
```json
{
  "url": "https://yourapp.com/webhook",
  "events": ["booking.created", "payment.successful"],
  "description": "My app webhook"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "subscription_id",
    "url": "https://yourapp.com/webhook",
    "events": ["booking.created", "payment.successful"],
    "secret": "whsec_...",
    "isActive": true
  }
}
```

### Available Webhook Events
- `booking.created`
- `booking.confirmed`
- `booking.completed`
- `booking.cancelled`
- `payment.successful`
- `payment.failed`
- `escrow.created`
- `escrow.dispute_opened`
- `escrow.released`
- `application.status_changed`
- `subscription.renewed`
- `subscription.cancelled`
- `referral.completed`

---

## 23. API Keys (`/api/api-keys`)

### Create API Key (Admin)
```http
POST /api/api-keys
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "name": "Partner Integration",
  "scopes": ["read:bookings", "write:bookings"],
  "expiresAt": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "key_id",
    "apiKey": "lp_live_abc123...",
    "apiSecret": "sk_live_xyz789...",
    "scopes": ["read:bookings", "write:bookings"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

---

## 24. Analytics (`/api/analytics`)

### Get Dashboard (Admin)
```http
GET /api/analytics/dashboard?period=30d
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 15000,
      "activeUsers": 8500,
      "totalBookings": 45000,
      "totalRevenue": 2500000
    },
    "growth": {
      "users": { "current": 500, "previous": 400, "change": 25 },
      "bookings": { "current": 1200, "previous": 1000, "change": 20 },
      "revenue": { "current": 150000, "previous": 120000, "change": 25 }
    },
    "charts": {
      "bookingsTrend": [],
      "revenueTrend": [],
      "userGrowth": []
    }
  }
}
```

---

## 25. Ads (`/api/ads`)

### Create Ad
```http
POST /api/ads
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "50% Off First Booking!",
  "description": "Limited time offer...",
  "type": "banner",
  "targetAudience": {
    "locations": ["Manila", "Makati"],
    "categories": ["cleaning"]
  },
  "budget": {
    "daily": 50,
    "total": 500
  },
  "schedule": {
    "startDate": "2024-02-01",
    "endDate": "2024-02-28"
  }
}
```

---

## 26. Announcements (`/api/announcements`)

### Create Announcement (Admin)
```http
POST /api/announcements
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "title": "Platform Maintenance",
  "content": "Scheduled maintenance on...",
  "type": "system",
  "priority": "high",
  "targetAudience": ["all"],
  "publishAt": "2024-02-01T00:00:00Z",
  "expiresAt": "2024-02-02T00:00:00Z"
}
```

---

## 27. Favorites (`/api/favorites`)

### Add Favorite
```http
POST /api/favorites
Authorization: Bearer <token>
```

**Request:**
```json
{
  "itemType": "service",
  "itemId": "service_id"
}
```

---

### List Favorites
```http
GET /api/favorites?type=service
Authorization: Bearer <token>
```

---

## 28. Settings (`/api/settings`)

### Get User Settings
```http
GET /api/settings/user
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": { "bookings": true, "promotions": false },
      "push": { "bookings": true, "messages": true },
      "sms": { "urgent": true }
    },
    "privacy": {
      "showProfile": true,
      "showRating": true
    },
    "preferences": {
      "language": "en",
      "currency": "USD",
      "timezone": "Asia/Manila"
    }
  }
}
```

---

### Update Settings
```http
PUT /api/settings/user
Authorization: Bearer <token>
```

**Request:**
```json
{
  "notifications": {
    "email": { "promotions": true }
  },
  "preferences": {
    "language": "fil"
  }
}
```

---

## 29. Support (`/api/support`)

### Create Support Ticket
```http
POST /api/support/tickets
Authorization: Bearer <token>
```

**Request:**
```json
{
  "subject": "Booking issue",
  "description": "I cannot cancel my booking...",
  "category": "booking",
  "priority": "medium",
  "relatedBookingId": "booking_id"
}
```

---

## 30. GPS & Time Tracking

### Create GPS Log
```http
POST /api/gps-logs
Authorization: Bearer <token>
```

**Request:**
```json
{
  "latitude": 14.5547,
  "longitude": 121.0244,
  "accuracy": 10,
  "altitude": 50,
  "speed": 0,
  "timestamp": "2024-01-15T10:30:00Z",
  "timeEntryId": "time_entry_id"
}
```

---

### Create Time Entry
```http
POST /api/time-entries
Authorization: Bearer <token>
```

**Request:**
```json
{
  "jobId": "job_id",
  "clockInTime": "2024-01-15T09:00:00Z",
  "location": {
    "latitude": 14.5547,
    "longitude": 121.0244
  }
}
```

---

### Clock Out
```http
POST /api/time-entries/:id/clock-out
Authorization: Bearer <token>
```

**Request:**
```json
{
  "location": {
    "latitude": 14.5547,
    "longitude": 121.0244
  }
}
```

---

## 31. Quotes & Invoices

### Create Quote
```http
POST /api/quotes
Authorization: Bearer <token>
```

**Request:**
```json
{
  "jobId": "job_id",
  "clientId": "client_id",
  "items": [
    {
      "description": "Plumbing repair",
      "quantity": 1,
      "unitPrice": 150
    },
    {
      "description": "Parts",
      "quantity": 3,
      "unitPrice": 25
    }
  ],
  "notes": "Valid for 30 days",
  "expiresAt": "2024-02-15"
}
```

---

### Generate Invoice from Quote
```http
POST /api/invoices/from-quote/:quoteId
Authorization: Bearer <token>
```

---

## 32. Maps (`/api/maps`)

### Geocode Address
```http
POST /api/maps/geocode
```

**Request:**
```json
{
  "address": "123 Main Street, Makati, Metro Manila, Philippines"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formattedAddress": "123 Main Street, Makati, Metro Manila, Philippines",
    "coordinates": {
      "lat": 14.5547,
      "lng": 121.0244
    },
    "placeId": "ChIJ..."
  }
}
```

---

### Calculate Distance
```http
POST /api/maps/distance
```

**Request:**
```json
{
  "origin": { "lat": 14.5547, "lng": 121.0244 },
  "destination": { "lat": 14.5995, "lng": 120.9842 }
}
```

---

## 33. Staff (`/api/staff`)

### List Staff
```http
GET /api/staff
Authorization: Bearer <token>
```

---

### Assign Permissions
```http
POST /api/staff/:id/permissions
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "permissions": [
    "manage_bookings",
    "view_analytics",
    "manage_providers"
  ]
}
```

---

## 34. Partners (`/api/partners`)

### Start Partner Onboarding
```http
POST /api/partners/onboarding/start
```

**Request:**
```json
{
  "businessName": "Partner Company",
  "contactEmail": "partner@company.com",
  "contactPhone": "+1234567890",
  "businessType": "referral"
}
```

---

### Get Partner Analytics
```http
GET /api/partners/:id/analytics?period=30d
Authorization: Bearer <token>
```

---

## 35. AI Bot (`/api/ai-bot`)

### Process Event
```http
POST /api/ai-bot/events
Authorization: Bearer <token>
```

**Request:**
```json
{
  "type": "booking_question",
  "data": {
    "question": "How do I reschedule my booking?",
    "context": {
      "bookingId": "booking_id"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "event_id",
    "response": {
      "message": "To reschedule your booking, go to...",
      "actions": [
        {
          "type": "link",
          "label": "Reschedule Booking",
          "url": "/bookings/booking_id/reschedule"
        }
      ]
    },
    "escalated": false
  }
}
```

---

## Appendix

### Service Categories
```
cleaning, plumbing, electrical, moving, landscaping,
painting, carpentry, flooring, roofing, hvac,
appliance_repair, locksmith, handyman, home_security,
pool_maintenance, pest_control, carpet_cleaning, window_cleaning,
gutter_cleaning, power_washing, snow_removal, other
```

### Job Types
```
full_time, part_time, contract, freelance, internship, temporary
```

### Experience Levels
```
entry, junior, mid, senior, lead, executive
```

### User Roles
```
client, provider, admin, supplier, instructor,
agency_owner, agency_admin, partner, staff
```

### Escrow Statuses
```
CREATED, FUNDS_HELD, IN_PROGRESS, COMPLETE,
DISPUTE, REFUNDED, PAYOUT_INITIATED, PAYOUT_COMPLETED
```

### Booking Statuses
```
pending, confirmed, in_progress, completed, cancelled
```

### Payment Methods
```
cash, card, bank_transfer, paypal, paymaya, paymongo
```

---

*Last Updated: January 2026*
*API Version: 1.0*
