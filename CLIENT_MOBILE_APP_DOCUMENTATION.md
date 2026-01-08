# LocalPro Client Mobile App - API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 7, 2026  
> **Base URL:** `https://api.yourdomain.com/api` or `http://localhost:4000/api` (development)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Core Features](#core-features)
   - [Service Marketplace](#service-marketplace)
   - [Job Board](#job-board)
   - [Search & Discovery](#search--discovery)
   - [Favorites](#favorites)
   - [Communication & Messaging](#communication--messaging)
   - [Notifications](#notifications)
5. [Additional Features](#additional-features)
   - [Equipment Rentals](#equipment-rentals)
   - [Supplies & Products](#supplies--products)
   - [Training Academy](#training-academy)
   - [Referral System](#referral-system)
6. [Financial Features](#financial-features)
7. [User Profile & Settings](#user-profile--settings)
8. [Premium Features](#premium-features)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Overview

**LocalPro Super App** is a comprehensive platform that connects clients with local service providers. Clients can:

- 🔍 **Discover Services** - Browse and book local services (cleaning, plumbing, electrical, moving, etc.)
- 💼 **Find Jobs** - Search and apply for employment opportunities
- 🛠️ **Rent Equipment** - Access tools and equipment rentals
- 🛒 **Purchase Supplies** - Order professional supplies and materials
- 🎓 **Learn Skills** - Enroll in training courses and certifications
- 💬 **Communicate** - Chat with service providers in real-time
- 🎁 **Earn Rewards** - Refer friends and earn bonuses
- ⭐ **Save Favorites** - Keep track of preferred services and providers

---

## Getting Started

### Base URL

All API requests should be made to:
```
https://api.yourdomain.com/api
```

### Authentication Header

Include the JWT token in all authenticated requests:
```
Authorization: Bearer <your_jwt_token>
```

### Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Authentication

### 1. Register with Email & Password

Create a new user account using email and password.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "client@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful, OTP sent to email"
}
```

---

### 2. Verify Email OTP

After registration, verify your email with the OTP sent to your inbox.

**Endpoint:** `POST /auth/verify-email-otp`

**Request Body:**
```json
{
  "email": "client@example.com",
  "otp": "123456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here...",
  "user": {
    "id": "507f191e810c19729de860ea",
    "email": "client@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["client"],
    "isVerified": true
  }
}
```

---

### 3. Login with Email

Login with your registered email and password.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "client@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here...",
  "user": {
    "id": "507f191e810c19729de860ea",
    "email": "client@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["client"]
  }
}
```

---

### 4. Login with Phone Number (SMS)

Alternative authentication method using phone number and SMS verification.

**Step 1: Send Verification Code**

**Endpoint:** `POST /auth/send-code`

**Request Body:**
```json
{
  "phoneNumber": "+639171234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "isNewUser": false,
  "expiresIn": 300
}
```

**Step 2: Verify Code and Login**

**Endpoint:** `POST /auth/verify-code`

**Request Body:**
```json
{
  "phoneNumber": "+639171234567",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here...",
  "user": { ... }
}
```

---

### 5. Get Current User Profile

Retrieve the authenticated user's profile information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "email": "client@example.com",
    "phoneNumber": "+639171234567",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["client"],
    "profile": {
      "avatar": "https://cloudinary.com/avatar.jpg",
      "bio": "Looking for quality home services",
      "address": {
        "street": "123 Main Street",
        "city": "Manila",
        "state": "Metro Manila",
        "zipCode": "1000",
        "country": "Philippines"
      }
    },
    "verification": {
      "phoneVerified": true,
      "emailVerified": true
    }
  }
}
```

---

### 6. Update Profile

Update user profile information.

**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+639171234567",
  "profile": {
    "bio": "Looking for reliable home services",
    "address": {
      "street": "123 Main Street",
      "city": "Manila",
      "state": "Metro Manila",
      "zipCode": "1000",
      "country": "Philippines"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

### 7. Upload Profile Avatar

Upload a profile picture.

**Endpoint:** `POST /auth/avatar`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `avatar`: Image file (JPEG, PNG) - Max 2MB

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "https://cloudinary.com/user/avatar.jpg"
  }
}
```

---

### 8. Refresh Token

Refresh expired access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

### 9. Logout

Logout and invalidate current session.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Core Features

## Service Marketplace

Browse, search, and book local services from professional providers.

### Available Service Categories

- 🧹 Cleaning (house, office, carpet, window)
- 🔧 Plumbing (repairs, installation, emergency)
- ⚡ Electrical (wiring, repairs, installation)
- 📦 Moving (residential, commercial, packing)
- 🌿 Landscaping (lawn care, garden design)
- 🎨 Painting (interior, exterior, commercial)
- 🔨 Carpentry (furniture, repairs, installation)
- 🏠 Handyman (general repairs, maintenance)
- And many more...

---

### 1. Browse All Services

Get a paginated list of all available services.

**Endpoint:** `GET /marketplace/services`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 100) |
| category | string | - | Filter by category |
| search | string | - | Search term |
| minPrice | number | - | Minimum price filter |
| maxPrice | number | - | Maximum price filter |
| city | string | - | Filter by city |
| state | string | - | Filter by state |

**Example Request:**
```
GET /marketplace/services?page=1&limit=10&category=cleaning&city=Manila
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "507f191e810c19729de860ea",
        "title": "Professional House Cleaning",
        "description": "Deep cleaning service for homes and apartments",
        "category": "cleaning",
        "provider": {
          "id": "507f1f77bcf86cd799439011",
          "firstName": "Maria",
          "lastName": "Santos",
          "avatar": "https://cloudinary.com/avatar.jpg",
          "rating": 4.8,
          "reviewCount": 156
        },
        "pricing": {
          "basePrice": 500,
          "hourlyRate": 200,
          "currency": "PHP"
        },
        "images": [
          "https://cloudinary.com/service1.jpg",
          "https://cloudinary.com/service2.jpg"
        ],
        "location": {
          "city": "Manila",
          "state": "Metro Manila",
          "country": "Philippines"
        },
        "availability": "available",
        "rating": 4.8,
        "reviewCount": 156
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 2. Get Service Categories

Get a list of all available service categories.

**Endpoint:** `GET /marketplace/services/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "cleaning",
        "displayName": "Cleaning Services",
        "description": "Professional cleaning services for homes and offices",
        "icon": "🧹",
        "serviceCount": 234
      },
      {
        "name": "plumbing",
        "displayName": "Plumbing Services",
        "description": "Plumbing repairs, installation, and maintenance",
        "icon": "🔧",
        "serviceCount": 187
      }
    ]
  }
}
```

---

### 3. Get Nearby Services

Find services near your location using GPS coordinates.

**Endpoint:** `GET /marketplace/services/nearby`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| latitude | number | Yes | Your latitude |
| longitude | number | Yes | Your longitude |
| radius | number | No | Search radius in km (default: 10) |
| category | string | No | Filter by category |
| page | integer | No | Page number |
| limit | integer | No | Items per page |

**Example Request:**
```
GET /marketplace/services/nearby?latitude=14.5995&longitude=120.9842&radius=5&category=cleaning
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "507f191e810c19729de860ea",
        "title": "Professional House Cleaning",
        "distance": 2.3,
        "distanceUnit": "km",
        ...
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 4. Get Service Details

Get detailed information about a specific service.

**Endpoint:** `GET /marketplace/services/:id`

**Example Request:**
```
GET /marketplace/services/507f191e810c19729de860ea
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "title": "Professional House Cleaning",
    "description": "Comprehensive deep cleaning service for homes and apartments. We use eco-friendly products and professional equipment.",
    "category": "cleaning",
    "subcategories": ["house_cleaning", "deep_cleaning"],
    "provider": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Maria",
      "lastName": "Santos",
      "avatar": "https://cloudinary.com/avatar.jpg",
      "rating": 4.8,
      "reviewCount": 156,
      "verified": true,
      "memberSince": "2023-01-15"
    },
    "pricing": {
      "basePrice": 500,
      "hourlyRate": 200,
      "currency": "PHP",
      "priceType": "hourly"
    },
    "images": [
      "https://cloudinary.com/service1.jpg",
      "https://cloudinary.com/service2.jpg"
    ],
    "location": {
      "city": "Manila",
      "state": "Metro Manila",
      "country": "Philippines",
      "serviceArea": {
        "radius": 10,
        "cities": ["Manila", "Makati", "Quezon City"]
      }
    },
    "availability": {
      "status": "available",
      "schedule": {
        "monday": { "start": "08:00", "end": "18:00" },
        "tuesday": { "start": "08:00", "end": "18:00" }
      }
    },
    "features": [
      "Eco-friendly products",
      "Professional equipment",
      "Insured workers",
      "Flexible scheduling"
    ],
    "rating": 4.8,
    "reviewCount": 156,
    "reviews": [
      {
        "id": "review123",
        "user": {
          "firstName": "Juan",
          "lastName": "D.",
          "avatar": "https://cloudinary.com/user.jpg"
        },
        "rating": 5,
        "comment": "Excellent service! Very thorough and professional.",
        "date": "2025-12-15",
        "helpful": 12
      }
    ]
  }
}
```

---

### 5. Create a Booking

Book a service from a provider.

**Endpoint:** `POST /marketplace/bookings`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "serviceId": "507f191e810c19729de860ea",
  "providerId": "507f1f77bcf86cd799439011",
  "scheduledDate": "2026-01-15T10:00:00Z",
  "duration": 3,
  "address": {
    "street": "123 Main Street",
    "city": "Manila",
    "state": "Metro Manila",
    "zipCode": "1000",
    "country": "Philippines",
    "coordinates": {
      "latitude": 14.5995,
      "longitude": 120.9842
    }
  },
  "notes": "Please bring eco-friendly cleaning products",
  "contactNumber": "+639171234567"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "booking123",
      "bookingNumber": "BKG-2026-001234",
      "status": "pending",
      "serviceId": "507f191e810c19729de860ea",
      "providerId": "507f1f77bcf86cd799439011",
      "scheduledDate": "2026-01-15T10:00:00Z",
      "estimatedDuration": 3,
      "estimatedCost": 600,
      "address": { ... },
      "createdAt": "2026-01-07T08:30:00Z"
    }
  }
}
```

---

### 6. Get My Bookings

Get all bookings made by the current user.

**Endpoint:** `GET /marketplace/my-bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page |
| status | string | - | Filter by status (pending, confirmed, completed, cancelled) |
| role | string | - | Filter by role (client, provider) |

**Example Request:**
```
GET /marketplace/my-bookings?status=confirmed&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking123",
        "bookingNumber": "BKG-2026-001234",
        "status": "confirmed",
        "service": {
          "id": "507f191e810c19729de860ea",
          "title": "Professional House Cleaning",
          "category": "cleaning"
        },
        "provider": {
          "id": "507f1f77bcf86cd799439011",
          "firstName": "Maria",
          "lastName": "Santos",
          "avatar": "https://cloudinary.com/avatar.jpg",
          "phoneNumber": "+639171234567"
        },
        "scheduledDate": "2026-01-15T10:00:00Z",
        "duration": 3,
        "totalCost": 600,
        "address": {
          "street": "123 Main Street",
          "city": "Manila"
        },
        "createdAt": "2026-01-07T08:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### 7. Get Booking Details

Get detailed information about a specific booking.

**Endpoint:** `GET /marketplace/bookings/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking123",
      "bookingNumber": "BKG-2026-001234",
      "status": "confirmed",
      "service": { ... },
      "provider": { ... },
      "client": { ... },
      "scheduledDate": "2026-01-15T10:00:00Z",
      "completedDate": null,
      "duration": 3,
      "pricing": {
        "subtotal": 600,
        "serviceFee": 60,
        "tax": 40,
        "total": 700
      },
      "payment": {
        "method": "paypal",
        "status": "paid",
        "transactionId": "PAY-123456789"
      },
      "address": { ... },
      "notes": "Please bring eco-friendly cleaning products",
      "timeline": [
        {
          "status": "pending",
          "timestamp": "2026-01-07T08:30:00Z"
        },
        {
          "status": "confirmed",
          "timestamp": "2026-01-07T09:15:00Z"
        }
      ]
    }
  }
}
```

---

### 8. Update Booking Status

Update the status of a booking (client can cancel).

**Endpoint:** `PUT /marketplace/bookings/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "cancelled",
  "reason": "Schedule conflict"
}
```

**Allowed Status Transitions for Clients:**
- `pending` → `cancelled`
- `confirmed` → `cancelled` (may incur cancellation fee)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "booking": {
      "id": "booking123",
      "status": "cancelled",
      "cancellationReason": "Schedule conflict",
      "cancellationDate": "2026-01-08T10:00:00Z"
    }
  }
}
```

---

### 9. Add Booking Review

Submit a review after service completion.

**Endpoint:** `POST /marketplace/bookings/:id/review`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `rating`: Number (1-5, required)
- `comment`: String (required)
- `photos`: Array of image files (optional, max 3)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "id": "review123",
      "bookingId": "booking123",
      "rating": 5,
      "comment": "Excellent service! Very thorough and professional.",
      "photos": [
        "https://cloudinary.com/review1.jpg"
      ],
      "createdAt": "2026-01-16T10:00:00Z"
    }
  }
}
```

---

## Job Board

Search and apply for employment opportunities.

### 1. Browse All Jobs

Get a paginated list of available job postings.

**Endpoint:** `GET /jobs`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page |
| category | string | - | Filter by category |
| location | string | - | Filter by location |
| jobType | string | - | Filter by type (full_time, part_time, contract) |
| minSalary | number | - | Minimum salary |
| maxSalary | number | - | Maximum salary |

**Example Request:**
```
GET /jobs?category=technology&location=Manila&jobType=full_time&page=1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job123",
        "title": "Senior Cleaner - Commercial Buildings",
        "company": {
          "name": "CleanPro Services Inc.",
          "logo": "https://cloudinary.com/logo.jpg",
          "verified": true
        },
        "category": "cleaning",
        "description": "Seeking experienced cleaner for commercial buildings",
        "location": {
          "city": "Manila",
          "state": "Metro Manila",
          "country": "Philippines",
          "isRemote": false
        },
        "jobType": "full_time",
        "salaryRange": {
          "min": 18000,
          "max": 25000,
          "currency": "PHP",
          "period": "monthly"
        },
        "experience": "2-5 years",
        "applicationCount": 45,
        "postedDate": "2026-01-05",
        "deadline": "2026-02-05"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 75
    }
  }
}
```

---

### 2. Search Jobs

Search for jobs with advanced filters.

**Endpoint:** `GET /jobs/search`

**Query Parameters:**
- `q`: Search query
- `location`: Location filter
- `category`: Category filter
- `jobType`: Job type (full_time, part_time, contract, freelance)
- `experienceLevel`: Experience level (entry, junior, mid, senior)
- `salaryMin`: Minimum salary
- `salaryMax`: Maximum salary
- `isRemote`: Remote work (true/false)

**Example Request:**
```
GET /jobs/search?q=cleaning&location=Manila&jobType=full_time
```

**Response:** Similar to Browse All Jobs

---

### 3. Get Job Details

Get detailed information about a specific job posting.

**Endpoint:** `GET /jobs/:id`

**Example Request:**
```
GET /jobs/job123
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job123",
      "title": "Senior Cleaner - Commercial Buildings",
      "company": {
        "id": "company123",
        "name": "CleanPro Services Inc.",
        "logo": "https://cloudinary.com/logo.jpg",
        "description": "Leading cleaning service provider in Metro Manila",
        "size": "50-200 employees",
        "industry": "Facility Services",
        "verified": true,
        "website": "https://cleanpro.com"
      },
      "category": "cleaning",
      "subcategory": "commercial_cleaning",
      "description": "We are seeking an experienced cleaner to join our commercial cleaning team...",
      "responsibilities": [
        "Clean and maintain commercial building spaces",
        "Operate cleaning equipment safely",
        "Follow safety protocols"
      ],
      "requirements": [
        "2+ years of commercial cleaning experience",
        "Able to work flexible hours",
        "Good physical condition"
      ],
      "benefits": [
        "Health insurance",
        "Paid time off",
        "Performance bonuses"
      ],
      "location": {
        "city": "Manila",
        "state": "Metro Manila",
        "country": "Philippines",
        "address": "Makati Business District",
        "isRemote": false
      },
      "jobType": "full_time",
      "salaryRange": {
        "min": 18000,
        "max": 25000,
        "currency": "PHP",
        "period": "monthly"
      },
      "workSchedule": {
        "hoursPerWeek": 40,
        "shift": "Morning shift (6 AM - 2 PM)"
      },
      "experienceLevel": "mid",
      "educationLevel": "High School",
      "applicationCount": 45,
      "viewCount": 234,
      "postedDate": "2026-01-05",
      "deadline": "2026-02-05",
      "contactEmail": "jobs@cleanpro.com",
      "contactPhone": "+639171234567"
    }
  }
}
```

---

### 4. Apply for Job

Submit a job application.

**Endpoint:** `POST /jobs/:id/apply`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `coverLetter`: String (required)
- `resume`: PDF/DOC file (optional, max 10MB)
- `expectedSalary`: Number (optional)
- `availableStartDate`: Date (optional)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "id": "app123",
      "jobId": "job123",
      "status": "pending",
      "coverLetter": "I am writing to express my interest...",
      "resumeUrl": "https://cloudinary.com/resume.pdf",
      "expectedSalary": 22000,
      "availableStartDate": "2026-02-01",
      "submittedAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 5. Get My Applications

Get all job applications submitted by the current user.

**Endpoint:** `GET /jobs/my-applications`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, reviewed, shortlisted, rejected, accepted)

**Example Request:**
```
GET /jobs/my-applications?status=pending&page=1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app123",
        "job": {
          "id": "job123",
          "title": "Senior Cleaner - Commercial Buildings",
          "company": {
            "name": "CleanPro Services Inc.",
            "logo": "https://cloudinary.com/logo.jpg"
          }
        },
        "status": "pending",
        "submittedAt": "2026-01-07T10:00:00Z",
        "lastUpdated": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

---

### 6. Withdraw Job Application

Withdraw a previously submitted job application.

**Endpoint:** `DELETE /jobs/:jobId/applications/:applicationId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Application withdrawn successfully"
}
```

---

### 7. Get Job Categories

Get list of available job categories.

**Endpoint:** `GET /jobs/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "cleaning",
        "displayName": "Cleaning & Janitorial",
        "jobCount": 234
      },
      {
        "name": "maintenance",
        "displayName": "Maintenance & Repairs",
        "jobCount": 187
      }
    ]
  }
}
```

---

## Search & Discovery

Global search functionality across all platform entities.

### 1. Global Search

Search across services, jobs, providers, courses, supplies, and more.

**Endpoint:** `GET /search`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required, min 2 characters) |
| type | string | Filter by entity type (services, jobs, providers, courses, supplies, rentals) |
| category | string | Filter by category |
| location | string | Filter by location/city |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| rating | number | Minimum rating (1-5) |
| page | integer | Page number |
| limit | integer | Items per page (max 100) |
| sortBy | string | Sort by (relevance, rating, price_low, price_high, newest) |

**Example Request:**
```
GET /search?q=cleaning&location=Manila&rating=4&sortBy=rating&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "query": "cleaning",
    "totalResults": 150,
    "results": [
      {
        "type": "service",
        "id": "507f191e810c19729de860ea",
        "title": "Professional House Cleaning",
        "description": "Deep cleaning service for homes",
        "category": "cleaning",
        "rating": 4.8,
        "price": 500,
        "location": "Manila",
        "imageUrl": "https://cloudinary.com/service.jpg"
      },
      {
        "type": "provider",
        "id": "provider123",
        "name": "Maria Santos",
        "avatar": "https://cloudinary.com/avatar.jpg",
        "specialties": ["cleaning", "deep_cleaning"],
        "rating": 4.9,
        "reviewCount": 234
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false,
      "limit": 20
    },
    "filters": {
      "appliedFilters": {
        "location": "Manila",
        "rating": 4
      }
    }
  }
}
```

---

### 2. Search Suggestions (Autocomplete)

Get search suggestions as user types.

**Endpoint:** `GET /search/suggestions`

**Query Parameters:**
- `q`: Search query (required, min 2 characters)
- `limit`: Maximum suggestions (default: 10, max: 20)

**Example Request:**
```
GET /search/suggestions?q=clean&limit=5
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "query": "clean",
    "suggestions": [
      {
        "text": "Cleaning Services",
        "type": "service",
        "category": "cleaning"
      },
      {
        "text": "Professional Cleaner Jobs",
        "type": "job",
        "category": "cleaning"
      },
      {
        "text": "Cleaning Supplies",
        "type": "supply",
        "category": "cleaning_supplies"
      }
    ]
  }
}
```

---

### 3. Popular Searches

Get popular search terms.

**Endpoint:** `GET /search/popular`

**Query Parameters:**
- `limit`: Number of results (default: 12, max: 50)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "popularSearches": [
      {
        "term": "cleaning services",
        "count": 1250,
        "category": "services"
      },
      {
        "term": "plumbing repair",
        "count": 890,
        "category": "services"
      }
    ]
  }
}
```

---

### 4. Get Search Categories

Get all available search categories.

**Endpoint:** `GET /search/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": {
      "services": ["cleaning", "plumbing", "electrical", ...],
      "jobs": ["technology", "healthcare", "education", ...],
      "supplies": ["cleaning_supplies", "tools", "materials", ...],
      "courses": ["cleaning", "plumbing", "business", ...],
      "rentals": ["tools", "vehicles", "equipment", ...]
    },
    "entityTypes": [
      {
        "value": "services",
        "label": "Services",
        "description": "Discover marketplace services"
      },
      {
        "value": "jobs",
        "label": "Job Opportunities",
        "description": "Browse available positions"
      }
    ]
  }
}
```

---

## Favorites

Save and manage favorite items (services, jobs, providers, courses, etc.).

### 1. Add to Favorites

Add an item to your favorites list.

**Endpoint:** `POST /favorites`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "itemType": "service",
  "itemId": "507f191e810c19729de860ea"
}
```

**Supported Item Types:**
- `service` - Marketplace services
- `job` - Job postings
- `provider` - Service providers
- `course` - Training courses
- `supply` - Supplies/products
- `rental` - Rental items
- `agency` - Service agencies

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Item added to favorites",
  "data": {
    "favorite": {
      "id": "fav123",
      "itemType": "service",
      "itemId": "507f191e810c19729de860ea",
      "addedAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 2. Get All Favorites

Get all favorite items for the current user.

**Endpoint:** `GET /favorites`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `itemType`: Filter by type (optional)

**Example Request:**
```
GET /favorites?page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "fav123",
        "itemType": "service",
        "itemId": "507f191e810c19729de860ea",
        "item": {
          "id": "507f191e810c19729de860ea",
          "title": "Professional House Cleaning",
          "category": "cleaning",
          "rating": 4.8,
          "price": 500,
          "imageUrl": "https://cloudinary.com/service.jpg"
        },
        "addedAt": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### 3. Get Favorites by Type

Get favorites filtered by specific item type.

**Endpoint:** `GET /favorites/type/:itemType`

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```
GET /favorites/type/service?page=1&limit=10
```

**Response:** Similar to Get All Favorites (filtered)

---

### 4. Check if Item is Favorited

Check if a specific item is in favorites.

**Endpoint:** `GET /favorites/check/:itemType/:itemId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```
GET /favorites/check/service/507f191e810c19729de860ea
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "isFavorited": true,
    "favoriteId": "fav123"
  }
}
```

---

### 5. Remove from Favorites

Remove an item from favorites.

**Endpoint:** `DELETE /favorites/:itemType/:itemId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```
DELETE /favorites/service/507f191e810c19729de860ea
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item removed from favorites"
}
```

---

### 6. Get Favorites Statistics

Get statistics about your favorites.

**Endpoint:** `GET /favorites/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalFavorites": 25,
    "byType": {
      "service": 10,
      "job": 5,
      "provider": 8,
      "course": 2
    }
  }
}
```

---

## Communication & Messaging

Real-time messaging with service providers and support.

### 1. Get Conversations

Get all conversations for the current user.

**Endpoint:** `GET /communication/conversations`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv123",
        "participants": [
          {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "avatar": "https://cloudinary.com/avatar.jpg"
          },
          {
            "id": "provider123",
            "firstName": "Maria",
            "lastName": "Santos",
            "avatar": "https://cloudinary.com/provider.jpg"
          }
        ],
        "lastMessage": {
          "content": "Thank you for booking!",
          "timestamp": "2026-01-07T10:00:00Z",
          "sender": "provider123"
        },
        "unreadCount": 2,
        "updatedAt": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

---

### 2. Get Conversation Details

Get detailed information about a specific conversation.

**Endpoint:** `GET /communication/conversations/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv123",
      "participants": [ ... ],
      "createdAt": "2026-01-05T10:00:00Z",
      "updatedAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 3. Create Conversation

Start a new conversation with a user/provider.

**Endpoint:** `POST /communication/conversations`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "participantId": "provider123",
  "initialMessage": "Hi! I'm interested in your cleaning service."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation": {
      "id": "conv123",
      "participants": [ ... ],
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 4. Get Messages

Get messages in a conversation.

**Endpoint:** `GET /communication/conversations/:id/messages`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Messages per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg123",
        "conversationId": "conv123",
        "sender": {
          "id": "user123",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://cloudinary.com/avatar.jpg"
        },
        "content": "Hi! I'm interested in your cleaning service.",
        "attachments": [],
        "isRead": true,
        "timestamp": "2026-01-07T09:00:00Z"
      },
      {
        "id": "msg124",
        "conversationId": "conv123",
        "sender": {
          "id": "provider123",
          "firstName": "Maria",
          "lastName": "Santos"
        },
        "content": "Hello! I'd be happy to help. What date works for you?",
        "attachments": [],
        "isRead": true,
        "timestamp": "2026-01-07T09:15:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 20
    }
  }
}
```

---

### 5. Send Message

Send a message in a conversation.

**Endpoint:** `POST /communication/conversations/:id/messages`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `content`: Message text (required)
- `attachments`: Array of files (optional, max 5 files)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "msg125",
      "conversationId": "conv123",
      "content": "How about next Monday at 10 AM?",
      "attachments": [],
      "timestamp": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 6. Mark Conversation as Read

Mark all messages in a conversation as read.

**Endpoint:** `PUT /communication/conversations/:id/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

---

### 7. Get Unread Count

Get the total count of unread messages.

**Endpoint:** `GET /communication/unread-count`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "unreadCount": 5,
    "unreadConversations": 3
  }
}
```

---

### 8. Search Conversations

Search through conversations.

**Endpoint:** `GET /communication/search`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q`: Search query

**Response:** Similar to Get Conversations (filtered by search)

---

### 9. Delete Conversation

Delete a conversation (removes from your view only).

**Endpoint:** `DELETE /communication/conversations/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## Notifications

Manage push, email, and SMS notifications.

### 1. Get Notifications

Get all notifications for the current user.

**Endpoint:** `GET /communication/notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `isRead`: Filter by read status (true/false)
- `type`: Filter by notification type

**Example Request:**
```
GET /communication/notifications?isRead=false&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif123",
        "type": "booking_confirmed",
        "title": "Booking Confirmed",
        "message": "Your booking for Professional House Cleaning has been confirmed",
        "data": {
          "bookingId": "booking123",
          "scheduledDate": "2026-01-15T10:00:00Z"
        },
        "isRead": false,
        "priority": "high",
        "createdAt": "2026-01-07T09:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45
    }
  }
}
```

**Notification Types:**
- `booking_created` - New booking created
- `booking_confirmed` - Booking confirmed by provider
- `booking_completed` - Service completed
- `booking_cancelled` - Booking cancelled
- `payment_received` - Payment processed
- `message_received` - New message
- `application_status` - Job application status update
- `referral_reward` - Referral reward earned
- `system_announcement` - System announcements

---

### 2. Get Notification Count

Get count of unread notifications.

**Endpoint:** `GET /communication/notifications/count`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isRead`: Filter by read status (optional)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalCount": 45,
    "unreadCount": 8
  }
}
```

---

### 3. Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `PUT /communication/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 4. Mark All Notifications as Read

Mark all notifications as read.

**Endpoint:** `PUT /communication/notifications/read-all`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 5. Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /communication/notifications/:notificationId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Additional Features

## Equipment Rentals

Rent tools, equipment, and vehicles for your projects.

### 1. Browse Rental Items

Get a list of available rental items.

**Endpoint:** `GET /rentals`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `category`: Filter by category (tools, vehicles, equipment, machinery)
- `search`: Search query
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

**Example Request:**
```
GET /rentals?category=tools&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rentals": [
      {
        "id": "rental123",
        "name": "Power Drill Set Professional",
        "description": "Professional grade power drill with accessories",
        "category": "tools",
        "pricing": {
          "hourly": 50,
          "daily": 300,
          "weekly": 1500,
          "currency": "PHP"
        },
        "images": [
          "https://cloudinary.com/drill.jpg"
        ],
        "owner": {
          "id": "owner123",
          "name": "Tools Rental Inc.",
          "rating": 4.7
        },
        "location": {
          "city": "Manila",
          "state": "Metro Manila"
        },
        "availability": "available",
        "rating": 4.8,
        "reviewCount": 45
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2. Get Rental Details

Get detailed information about a rental item.

**Endpoint:** `GET /rentals/:id`

**Response:** `200 OK` (detailed rental information)

---

### 3. Get Nearby Rentals

Find rental items near your location.

**Endpoint:** `GET /rentals/nearby`

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in km
- `category`: Filter by category

**Example Request:**
```
GET /rentals/nearby?lat=14.5995&lng=120.9842&radius=10
```

---

### 4. Book Rental Item

Create a rental booking.

**Endpoint:** `POST /rentals/:id/book`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "startDate": "2026-01-15T09:00:00Z",
  "endDate": "2026-01-17T18:00:00Z",
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Manila",
    "zipCode": "1000"
  },
  "deliveryOption": "pickup",
  "notes": "Need early morning pickup"
}
```

**Delivery Options:**
- `pickup` - Pick up from owner's location
- `delivery` - Deliver to specified address

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Rental booking created successfully",
  "data": {
    "booking": {
      "id": "booking456",
      "rentalItemId": "rental123",
      "startDate": "2026-01-15T09:00:00Z",
      "endDate": "2026-01-17T18:00:00Z",
      "totalCost": 900,
      "status": "pending",
      "deliveryOption": "pickup"
    }
  }
}
```

---

### 5. Get My Rental Bookings

Get all rental bookings made by the current user.

**Endpoint:** `GET /rentals/my-bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, confirmed, active, completed, cancelled)

---

### 6. Add Rental Review

Submit a review after rental completion.

**Endpoint:** `POST /rentals/:id/reviews`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bookingId": "booking456",
  "rating": 5,
  "comment": "Great equipment, well-maintained and easy to use"
}
```

---

### 7. Get Rental Categories

Get list of rental categories.

**Endpoint:** `GET /rentals/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "tools",
        "displayName": "Tools",
        "itemCount": 234
      },
      {
        "name": "vehicles",
        "displayName": "Vehicles",
        "itemCount": 89
      },
      {
        "name": "equipment",
        "displayName": "Equipment",
        "itemCount": 156
      },
      {
        "name": "machinery",
        "displayName": "Machinery",
        "itemCount": 67
      }
    ]
  }
}
```

---

## Supplies & Products

Purchase professional supplies and materials.

### 1. Browse Supplies

Get a list of available supplies and products.

**Endpoint:** `GET /supplies`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `category`: Filter by category
- `search`: Search query
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

**Example Request:**
```
GET /supplies?category=cleaning_supplies&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "supplies": [
      {
        "id": "supply123",
        "name": "Professional All-Purpose Cleaner",
        "description": "Industrial strength cleaning solution",
        "category": "cleaning_supplies",
        "pricing": {
          "price": 450,
          "unit": "per bottle",
          "currency": "PHP"
        },
        "images": [
          "https://cloudinary.com/cleaner.jpg"
        ],
        "supplier": {
          "id": "supplier123",
          "name": "CleanSupply Co.",
          "rating": 4.6
        },
        "inventory": {
          "inStock": true,
          "quantity": 150
        },
        "rating": 4.7,
        "reviewCount": 89
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2. Get Supply Details

Get detailed information about a supply item.

**Endpoint:** `GET /supplies/:id`

**Response:** `200 OK` (detailed supply information)

---

### 3. Get Nearby Supplies

Find supplies available near your location.

**Endpoint:** `GET /supplies/nearby`

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in km
- `category`: Filter by category

---

### 4. Order Supply

Place an order for supplies.

**Endpoint:** `POST /supplies/:id/order`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quantity": 5,
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Manila",
    "state": "Metro Manila",
    "zipCode": "1000",
    "country": "Philippines"
  },
  "deliveryOption": "delivery",
  "paymentMethod": "paypal",
  "notes": "Please deliver in the morning"
}
```

**Delivery Options:**
- `delivery` - Deliver to address
- `pickup` - Pick up from supplier

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "id": "order789",
      "orderNumber": "ORD-2026-001234",
      "supplyId": "supply123",
      "quantity": 5,
      "totalAmount": 2250,
      "status": "pending",
      "estimatedDelivery": "2026-01-10",
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 5. Get My Orders

Get all supply orders made by the current user.

**Endpoint:** `GET /supplies/my-orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, processing, shipped, delivered, cancelled)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order789",
        "orderNumber": "ORD-2026-001234",
        "supply": {
          "id": "supply123",
          "name": "Professional All-Purpose Cleaner",
          "image": "https://cloudinary.com/cleaner.jpg"
        },
        "quantity": 5,
        "totalAmount": 2250,
        "status": "processing",
        "estimatedDelivery": "2026-01-10",
        "createdAt": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 6. Add Supply Review

Submit a review after receiving your order.

**Endpoint:** `POST /supplies/:id/reviews`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "order789",
  "rating": 5,
  "comment": "Excellent quality, fast delivery"
}
```

---

### 7. Get Supply Categories

Get list of supply categories.

**Endpoint:** `GET /supplies/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "cleaning_supplies",
        "displayName": "Cleaning Supplies",
        "productCount": 345
      },
      {
        "name": "tools",
        "displayName": "Tools & Equipment",
        "productCount": 567
      }
    ]
  }
}
```

---

## Training Academy

Enroll in professional training courses and earn certifications.

### 1. Browse Courses

Get a list of available training courses.

**Endpoint:** `GET /academy/courses`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `category`: Filter by category
- `level`: Filter by level (beginner, intermediate, advanced, expert)
- `search`: Search query

**Example Request:**
```
GET /academy/courses?category=cleaning&level=beginner&page=1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course123",
        "title": "Professional Cleaning Fundamentals",
        "description": "Learn the basics of professional cleaning",
        "category": "cleaning",
        "level": "beginner",
        "instructor": {
          "id": "instructor123",
          "name": "John Smith",
          "avatar": "https://cloudinary.com/instructor.jpg",
          "rating": 4.9
        },
        "pricing": {
          "price": 1500,
          "currency": "PHP",
          "type": "one_time"
        },
        "duration": {
          "hours": 10,
          "weeks": 4
        },
        "thumbnail": "https://cloudinary.com/course.jpg",
        "enrollmentCount": 234,
        "rating": 4.8,
        "reviewCount": 89,
        "certificate": true
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2. Get Course Details

Get detailed information about a course.

**Endpoint:** `GET /academy/courses/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course123",
      "title": "Professional Cleaning Fundamentals",
      "description": "Comprehensive training in professional cleaning techniques...",
      "category": "cleaning",
      "level": "beginner",
      "instructor": { ... },
      "pricing": { ... },
      "duration": { ... },
      "curriculum": [
        {
          "module": 1,
          "title": "Introduction to Professional Cleaning",
          "lessons": [
            {
              "id": "lesson1",
              "title": "Cleaning Basics",
              "duration": "15 minutes",
              "type": "video"
            }
          ]
        }
      ],
      "requirements": [
        "Basic English reading skills",
        "No prior experience required"
      ],
      "whatYouLearn": [
        "Professional cleaning techniques",
        "Safety protocols",
        "Equipment operation"
      ],
      "certificate": {
        "available": true,
        "requirements": "Complete all modules with 80% score"
      },
      "enrollmentCount": 234,
      "rating": 4.8,
      "reviews": [ ... ]
    }
  }
}
```

---

### 3. Enroll in Course

Enroll in a training course.

**Endpoint:** `POST /academy/courses/:id/enroll`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentMethod": "paypal"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Enrollment successful",
  "data": {
    "enrollment": {
      "id": "enroll123",
      "courseId": "course123",
      "status": "active",
      "progress": 0,
      "enrolledAt": "2026-01-07T10:00:00Z",
      "expiresAt": "2027-01-07T10:00:00Z"
    }
  }
}
```

---

### 4. Update Course Progress

Track your progress in a course.

**Endpoint:** `PUT /academy/courses/:id/progress`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "progress": 45,
  "completedLessons": ["lesson1", "lesson2", "lesson3"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "enrollment": {
      "id": "enroll123",
      "progress": 45,
      "completedLessons": ["lesson1", "lesson2", "lesson3"],
      "lastAccessedAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 5. Get My Courses

Get all courses enrolled by the current user.

**Endpoint:** `GET /academy/my-courses`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (active, completed, expired)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "id": "enroll123",
        "course": {
          "id": "course123",
          "title": "Professional Cleaning Fundamentals",
          "thumbnail": "https://cloudinary.com/course.jpg"
        },
        "progress": 45,
        "status": "active",
        "enrolledAt": "2026-01-07T10:00:00Z",
        "lastAccessedAt": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 6. Add Course Review

Submit a review for a completed course.

**Endpoint:** `POST /academy/courses/:id/reviews`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent course! Very informative and well-structured."
}
```

---

### 7. Get Course Categories

Get list of course categories.

**Endpoint:** `GET /academy/categories`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "cleaning",
        "displayName": "Cleaning & Janitorial",
        "courseCount": 45
      },
      {
        "name": "plumbing",
        "displayName": "Plumbing",
        "courseCount": 32
      }
    ]
  }
}
```

---

## Referral System

Refer friends and earn rewards.

### 1. Get My Referral Information

Get your referral code and statistics.

**Endpoint:** `GET /referrals/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "referralCode": "JOHN2026",
    "referralLink": "https://localpro.app/r/JOHN2026",
    "stats": {
      "totalReferrals": 15,
      "successfulReferrals": 12,
      "pendingReferrals": 3,
      "totalEarnings": 5400,
      "currency": "PHP"
    },
    "tier": {
      "current": "silver",
      "nextTier": "gold",
      "progress": 60,
      "requiredReferrals": 20
    }
  }
}
```

**Referral Tiers:**
- **Bronze**: 0-9 successful referrals (100 PHP per referral)
- **Silver**: 10-19 successful referrals (150 PHP per referral)
- **Gold**: 20-49 successful referrals (200 PHP per referral)
- **Platinum**: 50+ successful referrals (300 PHP per referral)

---

### 2. Get Referral Statistics

Get detailed referral statistics.

**Endpoint:** `GET /referrals/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalReferrals": 15,
      "successfulReferrals": 12,
      "pendingReferrals": 3,
      "rejectedReferrals": 0
    },
    "earnings": {
      "totalEarnings": 5400,
      "pendingEarnings": 450,
      "paidEarnings": 4950,
      "currency": "PHP"
    },
    "performance": {
      "conversionRate": 80,
      "averageTimeToConvert": "3 days",
      "bestPerformingChannel": "whatsapp"
    },
    "recentReferrals": [
      {
        "id": "ref123",
        "referredUser": {
          "firstName": "Maria",
          "lastName": "G."
        },
        "status": "completed",
        "reward": 150,
        "date": "2026-01-05"
      }
    ]
  }
}
```

---

### 3. Get Referral Links

Get referral links for different sharing channels.

**Endpoint:** `GET /referrals/links`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "referralCode": "JOHN2026",
    "baseLink": "https://localpro.app/r/JOHN2026",
    "shareLinks": {
      "whatsapp": "https://wa.me/?text=Join%20LocalPro%20https://localpro.app/r/JOHN2026",
      "facebook": "https://www.facebook.com/sharer/sharer.php?u=https://localpro.app/r/JOHN2026",
      "twitter": "https://twitter.com/intent/tweet?text=Join%20LocalPro&url=https://localpro.app/r/JOHN2026",
      "email": "mailto:?subject=Join LocalPro&body=https://localpro.app/r/JOHN2026"
    },
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?data=https://localpro.app/r/JOHN2026"
  }
}
```

---

### 4. Send Referral Invitation

Send referral invitations via email.

**Endpoint:** `POST /referrals/invite`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "friend@example.com",
  "message": "Join LocalPro and get great home services!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

---

### 5. Get Referral Rewards

Get history of referral rewards earned.

**Endpoint:** `GET /referrals/rewards`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, paid, cancelled)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "reward123",
        "referral": {
          "id": "ref123",
          "referredUser": {
            "firstName": "Maria",
            "lastName": "G."
          }
        },
        "amount": 150,
        "currency": "PHP",
        "status": "paid",
        "earnedAt": "2026-01-05",
        "paidAt": "2026-01-06"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 6. Get Referral Leaderboard

View top referrers.

**Endpoint:** `GET /referrals/leaderboard`

**Query Parameters:**
- `limit`: Number of top referrers (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "firstName": "John",
          "lastName": "D.",
          "avatar": "https://cloudinary.com/avatar.jpg"
        },
        "successfulReferrals": 87,
        "totalEarnings": 17400,
        "tier": "platinum"
      }
    ],
    "yourRank": 23,
    "yourStats": {
      "successfulReferrals": 12,
      "totalEarnings": 5400
    }
  }
}
```

---

## Financial Features

Manage your wallet, transactions, and earnings.

### 1. Get Financial Overview

Get overview of your financial activities.

**Endpoint:** `GET /finance/overview`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 12500,
      "currency": "PHP",
      "pendingBalance": 2300
    },
    "thisMonth": {
      "earnings": 8500,
      "expenses": 3200,
      "bookings": 12
    },
    "recentTransactions": [
      {
        "id": "txn123",
        "type": "booking_payment",
        "amount": 600,
        "status": "completed",
        "date": "2026-01-07"
      }
    ]
  }
}
```

---

### 2. Get Transactions

Get all financial transactions.

**Endpoint:** `GET /finance/transactions`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type (booking, referral, withdrawal, refund)
- `status`: Filter by status (pending, completed, failed)
- `startDate`: Start date filter
- `endDate`: End date filter

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn123",
        "type": "booking_payment",
        "description": "Payment for Professional House Cleaning",
        "amount": 600,
        "currency": "PHP",
        "status": "completed",
        "booking": {
          "id": "booking123",
          "title": "Professional House Cleaning"
        },
        "date": "2026-01-07T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 3. Request Withdrawal

Request to withdraw funds from your wallet.

**Endpoint:** `POST /finance/withdraw`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 5000,
  "method": "bank_transfer",
  "bankDetails": {
    "accountName": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "BDO",
    "bankCode": "BDO"
  }
}
```

**Withdrawal Methods:**
- `bank_transfer` - Bank transfer
- `paypal` - PayPal
- `paymaya` - PayMaya
- `gcash` - GCash

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "withdrawal": {
      "id": "withdraw123",
      "amount": 5000,
      "currency": "PHP",
      "method": "bank_transfer",
      "status": "pending",
      "estimatedProcessingTime": "2-3 business days",
      "requestedAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 4. Get Financial Reports

Get detailed financial reports.

**Endpoint:** `GET /finance/reports`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: Time period (week, month, quarter, year)
- `startDate`: Start date
- `endDate`: End date

**Response:** `200 OK` (detailed financial analytics)

---

## User Profile & Settings

Manage your profile and app preferences.

### 1. Get User Settings

Get all user settings and preferences.

**Endpoint:** `GET /settings/user`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "privacy": {
      "profileVisibility": "public",
      "showPhoneNumber": false,
      "showEmail": false,
      "allowDirectMessages": true
    },
    "notifications": {
      "push": {
        "enabled": true,
        "newMessages": true,
        "bookingUpdates": true,
        "paymentUpdates": true,
        "marketing": false
      },
      "email": {
        "enabled": true,
        "newMessages": false,
        "bookingUpdates": true,
        "weeklyDigest": true
      },
      "sms": {
        "enabled": true,
        "urgentMessages": true,
        "bookingReminders": true
      }
    },
    "communication": {
      "preferredLanguage": "en",
      "timezone": "Asia/Manila",
      "dateFormat": "MM/DD/YYYY",
      "timeFormat": "12h",
      "currency": "PHP"
    },
    "app": {
      "theme": "light",
      "fontSize": "medium"
    }
  }
}
```

---

### 2. Update User Settings

Update user settings and preferences.

**Endpoint:** `PUT /settings/user`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notifications": {
    "push": {
      "enabled": true,
      "newMessages": true,
      "bookingUpdates": true,
      "marketing": false
    }
  },
  "app": {
    "theme": "dark"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": { ... }
  }
}
```

---

### 3. Update Specific Setting Category

Update a specific category of settings.

**Endpoint:** `PUT /settings/user/:category`

**Categories:**
- `privacy` - Privacy settings
- `notifications` - Notification preferences
- `communication` - Communication preferences
- `app` - App preferences

**Example Request:**
```
PUT /settings/user/notifications
```

**Request Body:**
```json
{
  "push": {
    "enabled": true,
    "newMessages": true,
    "bookingUpdates": true
  }
}
```

---

## Premium Features

## LocalPro Plus Subscription

Premium subscription for enhanced features and benefits.

### 1. Get Subscription Plans

Get all available subscription plans.

**Endpoint:** `GET /localpro-plus/plans`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_basic",
        "name": "Basic",
        "description": "Essential features for clients",
        "price": 99,
        "currency": "PHP",
        "billingPeriod": "monthly",
        "features": [
          "Priority customer support",
          "5% discount on all services",
          "Ad-free experience",
          "Extended booking history"
        ],
        "popular": false
      },
      {
        "id": "plan_premium",
        "name": "Premium",
        "description": "Full access to all features",
        "price": 199,
        "currency": "PHP",
        "billingPeriod": "monthly",
        "features": [
          "All Basic features",
          "10% discount on all services",
          "Priority booking",
          "Exclusive deals and offers",
          "Free cancellation within 24 hours",
          "Dedicated account manager"
        ],
        "popular": true
      }
    ]
  }
}
```

---

### 2. Subscribe to Plan

Subscribe to a premium plan.

**Endpoint:** `POST /localpro-plus/subscribe/:planId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentMethod": "paypal",
  "billingPeriod": "monthly"
}
```

**Billing Periods:**
- `monthly` - Billed monthly
- `quarterly` - Billed every 3 months (5% discount)
- `yearly` - Billed annually (15% discount)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": "sub123",
      "planId": "plan_premium",
      "status": "active",
      "startDate": "2026-01-07",
      "nextBillingDate": "2026-02-07",
      "amount": 199,
      "currency": "PHP",
      "billingPeriod": "monthly"
    }
  }
}
```

---

### 3. Get My Subscription

Get current subscription details.

**Endpoint:** `GET /localpro-plus/my-subscription`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub123",
      "plan": {
        "id": "plan_premium",
        "name": "Premium",
        "features": [ ... ]
      },
      "status": "active",
      "startDate": "2026-01-07",
      "nextBillingDate": "2026-02-07",
      "amount": 199,
      "currency": "PHP",
      "billingPeriod": "monthly",
      "autoRenew": true
    }
  }
}
```

---

### 4. Cancel Subscription

Cancel an active subscription.

**Endpoint:** `POST /localpro-plus/cancel`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Too expensive",
  "feedback": "Great service but beyond my budget"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "sub123",
      "status": "cancelled",
      "cancelledAt": "2026-01-07T10:00:00Z",
      "accessUntil": "2026-02-07"
    }
  }
}
```

---

### 5. Get Subscription Usage

Track subscription benefits usage.

**Endpoint:** `GET /localpro-plus/usage`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "usage": {
      "discountsApplied": 12,
      "totalSavings": 1200,
      "priorityBookings": 8,
      "currentMonth": {
        "discounts": 3,
        "savings": 300
      }
    }
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Valid email is required"
      }
    ]
  }
}
```

---

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTH_FAILED` | Authentication failed |
| `UNAUTHORIZED` | Not authorized to access resource |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYMENT_FAILED` | Payment processing failed |
| `BOOKING_UNAVAILABLE` | Booking slot not available |
| `INSUFFICIENT_BALANCE` | Insufficient wallet balance |

---

## Best Practices

### 1. Authentication

- **Store tokens securely** using secure storage (Keychain on iOS, Keystore on Android)
- **Implement token refresh** logic to handle expired tokens automatically
- **Handle authentication errors** gracefully and redirect to login when needed

### 2. API Requests

- **Include proper headers** in all authenticated requests
- **Handle network errors** and implement retry logic for failed requests
- **Implement request timeouts** to avoid hanging requests
- **Use pagination** for large data sets

### 3. Performance

- **Cache responses** where appropriate to reduce API calls
- **Implement lazy loading** for images and large content
- **Use request debouncing** for search and autocomplete
- **Optimize image uploads** by compressing before sending

### 4. User Experience

- **Show loading states** during API requests
- **Implement offline support** for core features
- **Handle errors gracefully** with user-friendly messages
- **Provide clear feedback** for all user actions

### 5. Security

- **Never log sensitive data** (passwords, tokens, payment info)
- **Validate all user inputs** on client side before sending
- **Use HTTPS only** for all API communications
- **Implement certificate pinning** for production apps

### 6. Notifications

- **Request notification permissions** at appropriate times
- **Handle notification interactions** properly
- **Implement deep linking** for notification taps
- **Respect user preferences** for notification settings

---

## API Rate Limits

To ensure fair usage and platform stability, the following rate limits apply:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Search | 30 requests | 1 minute |
| General API | 100 requests | 15 minutes |
| File Uploads | 10 requests | 1 hour |

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

---

## Webhook Events (for real-time updates)

The app supports webhooks for real-time event notifications. Contact support to set up webhook endpoints for your app.

**Supported Events:**
- `booking.confirmed` - Booking confirmed by provider
- `booking.completed` - Service completed
- `booking.cancelled` - Booking cancelled
- `message.received` - New message received
- `payment.successful` - Payment processed
- `payment.failed` - Payment failed
- `application.status_changed` - Job application status updated
- `referral.completed` - Referral completed
- `subscription.renewed` - Subscription renewed
- `subscription.cancelled` - Subscription cancelled

---

## Support & Resources

### Getting Help

- **Technical Support**: support@localpro.com
- **API Status**: https://status.localpro.com
- **Developer Portal**: https://developers.localpro.com

### Testing

- **Test Environment**: `https://api-staging.localpro.com/api`
- **Test Credentials**: Contact support for test accounts

---

## Changelog

### Version 1.0.0 (January 7, 2026)
- Initial API documentation release
- Core features: Authentication, Marketplace, Jobs, Search
- Additional features: Rentals, Supplies, Academy, Referrals
- Financial management and premium subscriptions

---

**© 2026 LocalPro Super App. All rights reserved.**
