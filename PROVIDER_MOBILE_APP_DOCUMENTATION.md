# LocalPro Provider Mobile App - API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 7, 2026  
> **Base URL:** `https://api.yourdomain.com/api` or `http://localhost:4000/api` (development)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Provider Registration](#provider-registration)
4. [Provider Profile Management](#provider-profile-management)
5. [Service Management](#service-management)
6. [Booking Management](#booking-management)
7. [Availability & Scheduling](#availability--scheduling)
8. [Financial Management](#financial-management)
9. [Provider Dashboard](#provider-dashboard)
10. [Reviews & Ratings](#reviews--ratings)
11. [Agency Features](#agency-features)
12. [Communication](#communication)
13. [Job Postings](#job-postings)
14. [Rentals Management](#rentals-management)
15. [Supplies Management](#supplies-management)
16. [Academy/Instructor Features](#academyinstructor-features)
17. [Best Practices](#best-practices)

---

## Overview

**LocalPro Provider App** enables service providers to manage their business on the platform. Providers can:

- 🎯 **Upgrade from Client** - Seamless transition from client to provider
- 📋 **Manage Services** - Create and update service offerings
- 📅 **Handle Bookings** - Accept, manage, and complete bookings
- 💰 **Track Earnings** - Monitor income and financial performance
- 📊 **View Analytics** - Access detailed business insights
- ⭐ **Build Reputation** - Collect reviews and ratings
- 🏢 **Join Agencies** - Collaborate with service agencies
- 📱 **Stay Connected** - Communicate with clients in real-time

---

## Getting Started

### Authentication

Providers use the same authentication system as clients. See the Client Documentation for authentication details.

**Provider Role:** After authentication, upgrade your account to `provider` role.

### Base URL
```
https://api.yourdomain.com/api
```

### Headers for Authenticated Requests
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Provider Registration

### 1. Upgrade from Client to Provider

Transform your client account into a provider account.

**Endpoint:** `POST /providers/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "providerType": "individual",
  "professionalInfo": {
    "specialties": [
      {
        "category": "cleaning",
        "subcategories": ["house_cleaning", "office_cleaning", "deep_cleaning"],
        "experience": 5,
        "hourlyRate": 250,
        "description": "Professional cleaning services with 5+ years experience",
        "certifications": [
          {
            "name": "Professional Cleaning Certificate",
            "issuedBy": "Cleaning Association of Philippines",
            "issueDate": "2021-03-15",
            "expiryDate": "2026-03-15"
          }
        ],
        "serviceAreas": [
          {
            "city": "Manila",
            "state": "Metro Manila",
            "radius": 15,
            "coordinates": {
              "latitude": 14.5995,
              "longitude": 120.9842
            }
          }
        ]
      }
    ],
    "languages": ["English", "Filipino", "Spanish"],
    "availability": {
      "monday": {
        "available": true,
        "start": "08:00",
        "end": "18:00"
      },
      "tuesday": {
        "available": true,
        "start": "08:00",
        "end": "18:00"
      },
      "wednesday": {
        "available": true,
        "start": "08:00",
        "end": "18:00"
      },
      "thursday": {
        "available": true,
        "start": "08:00",
        "end": "18:00"
      },
      "friday": {
        "available": true,
        "start": "08:00",
        "end": "18:00"
      },
      "saturday": {
        "available": true,
        "start": "09:00",
        "end": "15:00"
      },
      "sunday": {
        "available": false
      }
    }
  },
  "businessInfo": {
    "businessName": "Clean Pro Services",
    "businessType": "sole_proprietorship",
    "registrationNumber": "DTI-123456789",
    "taxId": "TAX-987654321",
    "yearsInBusiness": 5
  },
  "verificationDocuments": {
    "idType": "drivers_license",
    "idNumber": "N01-12-345678",
    "businessPermit": "permit_url",
    "insuranceCertificate": "insurance_url"
  }
}
```

**Provider Types:**
- `individual` - Solo service provider
- `business` - Registered business
- `agency` - Service agency with multiple providers

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Provider profile created successfully",
  "data": {
    "provider": {
      "id": "provider123",
      "userId": "user123",
      "providerType": "individual",
      "status": "pending_verification",
      "onboardingStep": "professional_info",
      "onboardingProgress": 60,
      "professionalInfo": { ... },
      "businessInfo": { ... },
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

**Verification Status:**
- `pending_verification` - Awaiting admin review
- `verified` - Approved and active
- `suspended` - Temporarily suspended
- `rejected` - Application rejected

---

### 2. Complete Onboarding Steps

Complete the multi-step provider onboarding process.

**Endpoint:** `PUT /providers/onboarding/step`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Onboarding Steps:**
1. `basic_info` - Basic information
2. `professional_info` - Professional details
3. `business_info` - Business information
4. `verification_documents` - Document upload
5. `service_areas` - Service coverage areas
6. `pricing` - Pricing structure
7. `availability` - Schedule and availability
8. `profile_complete` - Final review

**Request Body:**
```json
{
  "step": "verification_documents",
  "data": {
    "idType": "drivers_license",
    "idNumber": "N01-12-345678",
    "documents": [
      {
        "type": "government_id",
        "url": "https://cloudinary.com/id_front.jpg"
      },
      {
        "type": "business_permit",
        "url": "https://cloudinary.com/permit.pdf"
      }
    ]
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Onboarding step completed",
  "data": {
    "currentStep": "service_areas",
    "progress": 70,
    "completedSteps": [
      "basic_info",
      "professional_info",
      "business_info",
      "verification_documents"
    ],
    "nextStep": {
      "step": "service_areas",
      "title": "Define Service Areas",
      "description": "Select the areas where you provide services"
    }
  }
}
```

---

### 3. Upload Verification Documents

Upload required verification documents.

**Endpoint:** `POST /providers/documents/upload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `documents`: Array of files (PDF, JPG, PNG)
- `documentType`: Document type (government_id, business_permit, insurance, certification)
- `category`: Document category

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Documents uploaded successfully",
  "data": {
    "documents": [
      {
        "id": "doc123",
        "type": "government_id",
        "url": "https://cloudinary.com/id_front.jpg",
        "status": "pending_review",
        "uploadedAt": "2026-01-07T10:00:00Z"
      }
    ]
  }
}
```

---

### 4. Get Provider Profile

Get current provider profile information.

**Endpoint:** `GET /providers/profile/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "provider123",
      "user": {
        "id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "+639171234567",
        "avatar": "https://cloudinary.com/avatar.jpg"
      },
      "providerType": "individual",
      "status": "verified",
      "verificationDate": "2026-01-10T10:00:00Z",
      "professionalInfo": {
        "specialties": [ ... ],
        "languages": ["English", "Filipino"],
        "availability": { ... }
      },
      "businessInfo": {
        "businessName": "Clean Pro Services",
        "businessType": "sole_proprietorship",
        "yearsInBusiness": 5
      },
      "performance": {
        "rating": 4.8,
        "reviewCount": 156,
        "completionRate": 98,
        "responseTime": "2 hours",
        "totalBookings": 234
      },
      "onboardingProgress": 100,
      "memberSince": "2026-01-07"
    }
  }
}
```

---

### 5. Update Provider Profile

Update provider profile information.

**Endpoint:** `PUT /providers/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "professionalInfo": {
    "specialties": [
      {
        "category": "cleaning",
        "hourlyRate": 300,
        "description": "Updated description"
      }
    ],
    "languages": ["English", "Filipino", "Spanish"]
  },
  "businessInfo": {
    "businessName": "Clean Pro Services Ltd.",
    "yearsInBusiness": 6
  }
}
```

**Response:** `200 OK`

---

## Provider Profile Management

### 1. Get Provider Dashboard Overview

Get comprehensive dashboard overview with key metrics.

**Endpoint:** `GET /providers/dashboard/overview`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: Time period (today, week, month, year)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEarnings": 45600,
      "thisMonth": 12800,
      "pendingBookings": 5,
      "activeBookings": 3,
      "completedThisMonth": 24,
      "newMessages": 8
    },
    "performance": {
      "rating": 4.8,
      "reviewCount": 156,
      "completionRate": 98.5,
      "responseTime": "2 hours",
      "acceptanceRate": 95
    },
    "recentBookings": [
      {
        "id": "booking123",
        "service": "House Cleaning",
        "client": {
          "name": "Maria G.",
          "avatar": "https://cloudinary.com/avatar.jpg"
        },
        "scheduledDate": "2026-01-10T10:00:00Z",
        "status": "confirmed",
        "amount": 600
      }
    ],
    "upcomingSchedule": [
      {
        "date": "2026-01-10",
        "bookings": 3,
        "earnings": 1800
      }
    ],
    "alerts": [
      {
        "type": "pending_booking",
        "message": "You have 2 pending booking requests",
        "priority": "high"
      }
    ]
  }
}
```

---

### 2. Get Provider Analytics

Get detailed performance analytics.

**Endpoint:** `GET /providers/analytics/performance`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeframe`: Time period (7d, 30d, 90d, 1y)
- `metrics`: Comma-separated metrics (earnings, bookings, ratings, response_time)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "earnings": {
      "total": 12800,
      "average": 426.67,
      "trend": "+15%",
      "chart": [
        { "date": "2026-01-01", "amount": 800 },
        { "date": "2026-01-02", "amount": 600 }
      ]
    },
    "bookings": {
      "total": 24,
      "completed": 23,
      "cancelled": 1,
      "trend": "+8%",
      "chart": [
        { "date": "2026-01-01", "count": 2 },
        { "date": "2026-01-02", "count": 1 }
      ]
    },
    "ratings": {
      "average": 4.8,
      "distribution": {
        "5": 78,
        "4": 18,
        "3": 3,
        "2": 1,
        "1": 0
      },
      "trend": "+0.2"
    },
    "clients": {
      "total": 89,
      "new": 12,
      "returning": 77,
      "repeatRate": 86
    }
  }
}
```

---

## Service Management

### 1. Create Service Listing

Create a new service offering.

**Endpoint:** `POST /marketplace/services`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Professional House Cleaning",
  "description": "Comprehensive deep cleaning service for homes and apartments. We use eco-friendly products and professional equipment.",
  "category": "cleaning",
  "subcategories": ["house_cleaning", "deep_cleaning"],
  "pricing": {
    "type": "hourly",
    "basePrice": 500,
    "hourlyRate": 200,
    "currency": "PHP",
    "minimumCharge": 3
  },
  "serviceArea": {
    "cities": ["Manila", "Makati", "Quezon City"],
    "radius": 15,
    "coordinates": {
      "latitude": 14.5995,
      "longitude": 120.9842
    }
  },
  "features": [
    "Eco-friendly products",
    "Professional equipment",
    "Insured workers",
    "Flexible scheduling"
  ],
  "requirements": [
    "Access to water and electricity",
    "Clear workspace"
  ],
  "availability": {
    "bookingAdvance": 24,
    "cancellationPolicy": "24_hours"
  },
  "tags": ["cleaning", "deep-cleaning", "eco-friendly"]
}
```

**Pricing Types:**
- `hourly` - Hourly rate
- `fixed` - Fixed price per service
- `custom` - Custom pricing (contact for quote)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "service": {
      "id": "service123",
      "title": "Professional House Cleaning",
      "category": "cleaning",
      "status": "active",
      "provider": {
        "id": "provider123",
        "name": "John Doe"
      },
      "pricing": { ... },
      "createdAt": "2026-01-07T10:00:00Z",
      "viewCount": 0,
      "bookingCount": 0
    }
  }
}
```

---

### 2. Get My Services

Get all services created by the provider.

**Endpoint:** `GET /marketplace/my-services`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (active, inactive, pending)
- `category`: Filter by category

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service123",
        "title": "Professional House Cleaning",
        "category": "cleaning",
        "status": "active",
        "pricing": {
          "hourlyRate": 200
        },
        "images": ["https://cloudinary.com/service.jpg"],
        "stats": {
          "viewCount": 234,
          "bookingCount": 45,
          "rating": 4.8,
          "reviewCount": 38
        },
        "lastModified": "2026-01-05T10:00:00Z"
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

### 3. Update Service

Update an existing service.

**Endpoint:** `PUT /marketplace/services/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Service Title",
  "description": "Updated description",
  "pricing": {
    "hourlyRate": 250
  }
}
```

**Response:** `200 OK`

---

### 4. Upload Service Images

Add images to your service listing.

**Endpoint:** `POST /marketplace/services/:id/images`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `images`: Array of image files (max 5, JPEG/PNG, max 5MB each)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "images": [
      {
        "id": "img123",
        "url": "https://cloudinary.com/service1.jpg",
        "thumbnail": "https://cloudinary.com/service1_thumb.jpg",
        "order": 0
      }
    ]
  }
}
```

---

### 5. Activate/Deactivate Service

Toggle service availability.

**Activate:**
**Endpoint:** `PATCH /marketplace/services/:id/activate`

**Deactivate:**
**Endpoint:** `PATCH /marketplace/services/:id/deactivate`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Service status updated",
  "data": {
    "service": {
      "id": "service123",
      "status": "active"
    }
  }
}
```

---

### 6. Delete Service

Delete a service listing.

**Endpoint:** `DELETE /marketplace/services/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

## Booking Management

### 1. Get My Bookings

Get all bookings for the provider.

**Endpoint:** `GET /marketplace/my-bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, confirmed, in_progress, completed, cancelled)
- `role`: Must be `provider`
- `startDate`: Filter from date
- `endDate`: Filter to date

**Example Request:**
```
GET /marketplace/my-bookings?role=provider&status=pending&page=1
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
        "status": "pending",
        "service": {
          "id": "service123",
          "title": "Professional House Cleaning"
        },
        "client": {
          "id": "client123",
          "firstName": "Maria",
          "lastName": "Garcia",
          "avatar": "https://cloudinary.com/avatar.jpg",
          "phoneNumber": "+639171234567",
          "rating": 4.9
        },
        "scheduledDate": "2026-01-15T10:00:00Z",
        "duration": 3,
        "address": {
          "street": "123 Main Street",
          "city": "Manila",
          "coordinates": {
            "latitude": 14.5995,
            "longitude": 120.9842
          }
        },
        "pricing": {
          "subtotal": 600,
          "serviceFee": 60,
          "total": 660,
          "providerEarnings": 540
        },
        "notes": "Please bring eco-friendly products",
        "createdAt": "2026-01-07T08:00:00Z",
        "expiresAt": "2026-01-08T08:00:00Z"
      }
    ],
    "pagination": { ... },
    "summary": {
      "pending": 5,
      "confirmed": 3,
      "completed": 45,
      "cancelled": 2
    }
  }
}
```

---

### 2. Get Booking Details

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
      "client": {
        "id": "client123",
        "firstName": "Maria",
        "lastName": "Garcia",
        "avatar": "https://cloudinary.com/avatar.jpg",
        "phoneNumber": "+639171234567",
        "email": "maria@example.com",
        "rating": 4.9,
        "totalBookings": 23
      },
      "scheduledDate": "2026-01-15T10:00:00Z",
      "estimatedEndTime": "2026-01-15T13:00:00Z",
      "duration": 3,
      "address": {
        "street": "123 Main Street",
        "city": "Manila",
        "state": "Metro Manila",
        "zipCode": "1000",
        "coordinates": {
          "latitude": 14.5995,
          "longitude": 120.9842
        },
        "instructions": "Gate code: 1234"
      },
      "pricing": {
        "subtotal": 600,
        "serviceFee": 60,
        "platformFee": 60,
        "total": 660,
        "providerEarnings": 540,
        "currency": "PHP"
      },
      "payment": {
        "method": "paypal",
        "status": "paid",
        "paidAt": "2026-01-07T09:00:00Z"
      },
      "notes": "Please bring eco-friendly products",
      "specialRequirements": ["Pet-friendly products", "Hypoallergenic"],
      "timeline": [
        {
          "status": "pending",
          "timestamp": "2026-01-07T08:00:00Z",
          "actor": "client"
        },
        {
          "status": "confirmed",
          "timestamp": "2026-01-07T09:00:00Z",
          "actor": "provider"
        }
      ],
      "cancellationPolicy": {
        "type": "24_hours",
        "description": "Free cancellation up to 24 hours before service"
      }
    }
  }
}
```

---

### 3. Accept Booking

Confirm and accept a pending booking.

**Endpoint:** `PUT /marketplace/bookings/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "confirmed",
  "message": "Booking confirmed! I'll arrive at 10:00 AM sharp.",
  "estimatedArrivalTime": "2026-01-15T09:45:00Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "data": {
    "booking": {
      "id": "booking123",
      "status": "confirmed",
      "confirmedAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 4. Reject Booking

Decline a booking request.

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
  "reason": "schedule_conflict",
  "message": "Sorry, I'm not available at that time. Can we reschedule?",
  "suggestedDates": [
    "2026-01-16T10:00:00Z",
    "2026-01-17T10:00:00Z"
  ]
}
```

**Cancellation Reasons:**
- `schedule_conflict` - Schedule conflict
- `emergency` - Emergency situation
- `out_of_service_area` - Outside service area
- `other` - Other reason

**Response:** `200 OK`

---

### 5. Start Service

Mark service as started when you arrive.

**Endpoint:** `PUT /marketplace/bookings/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "in_progress",
  "startTime": "2026-01-15T10:00:00Z",
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842
  }
}
```

**Response:** `200 OK`

---

### 6. Complete Service

Mark service as completed.

**Endpoint:** `PUT /marketplace/bookings/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "completed",
  "completionTime": "2026-01-15T13:00:00Z",
  "actualDuration": 3,
  "notes": "Service completed successfully. All areas cleaned as requested.",
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Service marked as completed",
  "data": {
    "booking": {
      "id": "booking123",
      "status": "completed",
      "completedAt": "2026-01-15T13:00:00Z",
      "earnings": 540
    }
  }
}
```

---

### 7. Upload Service Photos

Upload before/after photos of completed work.

**Endpoint:** `POST /marketplace/bookings/:id/photos`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `photos`: Array of image files (max 5)
- `type`: Photo type (before, after, progress)
- `description`: Optional description

**Response:** `200 OK`

---

## Availability & Scheduling

### 1. Get Availability Schedule

Get your current availability settings.

**Endpoint:** `GET /availability`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "availability": {
      "monday": {
        "available": true,
        "slots": [
          {
            "start": "08:00",
            "end": "12:00"
          },
          {
            "start": "13:00",
            "end": "18:00"
          }
        ]
      },
      "tuesday": {
        "available": true,
        "slots": [
          {
            "start": "08:00",
            "end": "18:00"
          }
        ]
      }
    },
    "exceptions": [
      {
        "date": "2026-01-25",
        "available": false,
        "reason": "Holiday"
      }
    ],
    "bookingSettings": {
      "advanceBooking": 24,
      "maxBookingsPerDay": 5,
      "bufferBetweenBookings": 30
    }
  }
}
```

---

### 2. Update Availability

Update your availability schedule.

**Endpoint:** `PUT /availability`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "availability": {
    "monday": {
      "available": true,
      "slots": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ]
    },
    "sunday": {
      "available": false
    }
  },
  "bookingSettings": {
    "advanceBooking": 48,
    "maxBookingsPerDay": 4,
    "bufferBetweenBookings": 60
  }
}
```

**Response:** `200 OK`

---

### 3. Add Time Off

Block dates when you're unavailable.

**Endpoint:** `POST /availability/time-off`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "startDate": "2026-02-01",
  "endDate": "2026-02-07",
  "reason": "Vacation",
  "type": "unavailable"
}
```

**Response:** `201 Created`

---

### 4. Get Schedule

Get your upcoming schedule with bookings.

**Endpoint:** `GET /scheduling`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: Start date (default: today)
- `endDate`: End date (default: +7 days)
- `view`: View type (day, week, month)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "date": "2026-01-15",
        "bookings": [
          {
            "id": "booking123",
            "time": "10:00",
            "duration": 3,
            "service": "House Cleaning",
            "client": "Maria G.",
            "status": "confirmed",
            "address": "123 Main St, Manila"
          }
        ],
        "totalBookings": 3,
        "estimatedEarnings": 1800
      }
    ],
    "summary": {
      "totalBookings": 12,
      "estimatedEarnings": 7200,
      "busyHours": 36
    }
  }
}
```

---

## Financial Management

### 1. Get Earnings Overview

Get comprehensive earnings overview.

**Endpoint:** `GET /finance/earnings`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: Time period (today, week, month, year, custom)
- `startDate`: Start date (for custom period)
- `endDate`: End date (for custom period)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEarnings": 45600,
      "pendingEarnings": 2300,
      "availableBalance": 12500,
      "currency": "PHP"
    },
    "thisMonth": {
      "earnings": 12800,
      "bookings": 24,
      "averagePerBooking": 533
    },
    "breakdown": {
      "serviceEarnings": 40200,
      "tips": 2100,
      "bonuses": 3300
    },
    "trends": {
      "vsLastMonth": "+15%",
      "vsLastYear": "+42%"
    },
    "chart": [
      {
        "date": "2026-01-01",
        "earnings": 800
      }
    ]
  }
}
```

---

### 2. Get Transaction History

Get detailed transaction history.

**Endpoint:** `GET /finance/transactions`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type (booking, tip, bonus, withdrawal, refund)
- `status`: Filter by status (pending, completed, failed)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn123",
        "type": "booking",
        "amount": 540,
        "currency": "PHP",
        "status": "completed",
        "booking": {
          "id": "booking123",
          "service": "House Cleaning",
          "client": "Maria G."
        },
        "date": "2026-01-15T13:00:00Z",
        "description": "Service completion payment"
      },
      {
        "id": "txn124",
        "type": "tip",
        "amount": 100,
        "currency": "PHP",
        "status": "completed",
        "booking": {
          "id": "booking123"
        },
        "date": "2026-01-15T13:15:00Z",
        "description": "Client tip"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 3. Request Payout/Withdrawal

Request to withdraw available balance.

**Endpoint:** `POST /finance/withdraw`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 10000,
  "method": "bank_transfer",
  "bankDetails": {
    "accountName": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "BDO",
    "bankCode": "BDO"
  },
  "notes": "Regular payout"
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
  "message": "Withdrawal request submitted",
  "data": {
    "withdrawal": {
      "id": "withdraw123",
      "amount": 10000,
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

### 4. Get Payout History

Get history of all payouts/withdrawals.

**Endpoint:** `GET /finance/withdrawals`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending, processing, completed, failed)

**Response:** `200 OK`

---

### 5. Get Financial Reports

Generate detailed financial reports.

**Endpoint:** `GET /finance/reports`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: Time period (week, month, quarter, year)
- `type`: Report type (earnings, expenses, taxes, comprehensive)
- `format`: Format (json, pdf, csv)

**Response:** `200 OK` (comprehensive financial data)

---

## Provider Dashboard

### 1. Get Real-Time Metrics

Get real-time performance metrics.

**Endpoint:** `GET /providers/dashboard/metrics`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "today": {
      "earnings": 1200,
      "bookings": 3,
      "hours": 9,
      "newMessages": 5
    },
    "thisWeek": {
      "earnings": 6400,
      "bookings": 12,
      "hours": 36,
      "newClients": 4
    },
    "performance": {
      "rating": 4.8,
      "completionRate": 98.5,
      "responseTime": "2h",
      "acceptanceRate": 95
    },
    "goals": {
      "monthlyEarningsGoal": 15000,
      "progress": 85,
      "projectedCompletion": "2026-01-28"
    }
  }
}
```

---

### 2. Get Activity Feed

Get recent activity and updates.

**Endpoint:** `GET /providers/dashboard/activity`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type (booking, review, payment, message)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity123",
        "type": "booking_completed",
        "title": "Booking Completed",
        "description": "You completed a house cleaning service for Maria G.",
        "amount": 540,
        "timestamp": "2026-01-15T13:00:00Z",
        "icon": "check_circle",
        "priority": "normal"
      },
      {
        "id": "activity124",
        "type": "new_review",
        "title": "New Review",
        "description": "Maria G. left you a 5-star review",
        "rating": 5,
        "timestamp": "2026-01-15T13:30:00Z",
        "icon": "star",
        "priority": "high"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## Reviews & Ratings

### 1. Get My Reviews

Get all reviews received.

**Endpoint:** `GET /providers/reviews`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `rating`: Filter by rating (1-5)
- `service`: Filter by service ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "averageRating": 4.8,
      "totalReviews": 156,
      "distribution": {
        "5": 120,
        "4": 28,
        "3": 6,
        "2": 2,
        "1": 0
      }
    },
    "reviews": [
      {
        "id": "review123",
        "booking": {
          "id": "booking123",
          "service": "House Cleaning"
        },
        "client": {
          "firstName": "Maria",
          "lastName": "G.",
          "avatar": "https://cloudinary.com/avatar.jpg"
        },
        "rating": 5,
        "comment": "Excellent service! Very professional and thorough.",
        "photos": [
          "https://cloudinary.com/review1.jpg"
        ],
        "createdAt": "2026-01-15T14:00:00Z",
        "helpful": 12
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 2. Respond to Review

Respond to a client review.

**Endpoint:** `POST /providers/reviews/:reviewId/respond`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "response": "Thank you for the wonderful feedback! It was a pleasure working with you."
}
```

**Response:** `201 Created`

---

## Agency Features

### 1. Get My Agencies

Get agencies you're associated with.

**Endpoint:** `GET /agencies/my/agencies`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "agencies": [
      {
        "id": "agency123",
        "name": "Clean Pro Agency",
        "logo": "https://cloudinary.com/agency.jpg",
        "role": "provider",
        "status": "active",
        "joinedAt": "2025-06-01",
        "stats": {
          "bookingsCompleted": 45,
          "totalEarnings": 23400,
          "rating": 4.8
        }
      }
    ]
  }
}
```

---

### 2. Join Agency

Request to join an agency.

**Endpoint:** `POST /agencies/join`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "agencyId": "agency123",
  "message": "I'd like to join your team. I have 5 years of experience in cleaning services.",
  "specialties": ["house_cleaning", "office_cleaning"]
}
```

**Response:** `201 Created`

---

### 3. Leave Agency

Leave an agency you're part of.

**Endpoint:** `POST /agencies/leave`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "agencyId": "agency123",
  "reason": "Moving to a different area"
}
```

**Response:** `200 OK`

---

## Communication

### 1. Get Client Conversations

Get all conversations with clients.

**Endpoint:** `GET /communication/conversations`

**Headers:**
```
Authorization: Bearer <token>
```

(See Client Documentation for full messaging API details)

---

### 2. Send Message to Client

Send a message to a client.

**Endpoint:** `POST /communication/conversations/:id/messages`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `content`: Message text
- `attachments`: Optional files

**Response:** `201 Created`

---

## Job Postings

### 1. Create Job Posting

Post a job opening (if you're looking to hire).

**Endpoint:** `POST /jobs`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Experienced Cleaner Needed",
  "description": "Looking for an experienced cleaner to join our team",
  "category": "cleaning",
  "location": {
    "city": "Manila",
    "state": "Metro Manila",
    "isRemote": false
  },
  "jobType": "full_time",
  "salaryRange": {
    "min": 18000,
    "max": 25000,
    "currency": "PHP",
    "period": "monthly"
  },
  "requirements": [
    "2+ years experience",
    "Good physical condition"
  ],
  "benefits": [
    "Health insurance",
    "Paid time off"
  ],
  "deadline": "2026-02-15"
}
```

**Response:** `201 Created`

---

### 2. Get My Job Postings

Get all job postings you've created.

**Endpoint:** `GET /jobs/my-jobs`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Get Job Applications

Get applications for your job posting.

**Endpoint:** `GET /jobs/:id/applications`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app123",
        "applicant": {
          "id": "user456",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://cloudinary.com/avatar.jpg",
          "rating": 4.7
        },
        "coverLetter": "I am very interested in this position...",
        "resumeUrl": "https://cloudinary.com/resume.pdf",
        "status": "pending",
        "submittedAt": "2026-01-08T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 4. Update Application Status

Update the status of a job application.

**Endpoint:** `PUT /jobs/:jobId/applications/:applicationId/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "shortlisted",
  "notes": "Good qualifications, schedule interview"
}
```

**Status Options:**
- `pending` - Under review
- `reviewed` - Reviewed
- `shortlisted` - Shortlisted
- `interview_scheduled` - Interview scheduled
- `accepted` - Job offer accepted
- `rejected` - Application rejected

**Response:** `200 OK`

---

## Rentals Management

### 1. Create Rental Listing

List equipment or tools for rent.

**Endpoint:** `POST /rentals`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Professional Power Drill Set",
  "description": "Complete professional drill set with accessories",
  "category": "tools",
  "pricing": {
    "hourly": 50,
    "daily": 300,
    "weekly": 1500,
    "monthly": 5000,
    "currency": "PHP"
  },
  "condition": "excellent",
  "specifications": {
    "brand": "Bosch",
    "model": "GSB 13 RE",
    "year": 2024
  },
  "availability": {
    "minRentalPeriod": 4,
    "maxRentalPeriod": 720,
    "advanceBooking": 24
  },
  "location": {
    "city": "Manila",
    "state": "Metro Manila"
  },
  "deposit": 2000,
  "insurance": true
}
```

**Response:** `201 Created`

---

### 2. Get My Rental Items

Get all your rental listings.

**Endpoint:** `GET /rentals/my-rentals`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Manage Rental Bookings

Get bookings for your rental items.

**Endpoint:** `GET /rentals/my-bookings`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Supplies Management

### 1. Create Supply Listing

List supplies or products for sale (if you're a supplier).

**Endpoint:** `POST /supplies`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Professional All-Purpose Cleaner",
  "description": "Industrial strength cleaning solution",
  "category": "cleaning_supplies",
  "pricing": {
    "price": 450,
    "unit": "bottle",
    "currency": "PHP",
    "bulkPricing": [
      {
        "minQuantity": 10,
        "pricePerUnit": 400
      },
      {
        "minQuantity": 50,
        "pricePerUnit": 350
      }
    ]
  },
  "inventory": {
    "quantity": 500,
    "lowStockThreshold": 50,
    "reorderLevel": 100
  },
  "specifications": {
    "volume": "1 liter",
    "weight": "1 kg",
    "brand": "CleanPro"
  },
  "shipping": {
    "dimensions": {
      "length": 20,
      "width": 10,
      "height": 25
    },
    "weight": 1.2,
    "freeShippingThreshold": 5
  }
}
```

**Response:** `201 Created`

---

### 2. Get My Supplies

Get all your supply listings.

**Endpoint:** `GET /supplies/my-supplies`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Manage Orders

Get and manage orders for your supplies.

**Endpoint:** `GET /supplies/my-orders`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 4. Update Order Status

Update the status of a supply order.

**Endpoint:** `PUT /supplies/:id/orders/:orderId/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "carrier": "LBC",
  "estimatedDelivery": "2026-01-12"
}
```

**Order Status:**
- `pending` - Order received
- `processing` - Preparing order
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled

**Response:** `200 OK`

---

## Academy/Instructor Features

### 1. Create Course

Create a training course (if you're an instructor).

**Endpoint:** `POST /academy/courses`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Professional Cleaning Fundamentals",
  "description": "Learn the basics of professional cleaning",
  "category": "cleaning",
  "level": "beginner",
  "pricing": {
    "price": 1500,
    "currency": "PHP",
    "type": "one_time"
  },
  "duration": {
    "hours": 10,
    "weeks": 4
  },
  "curriculum": [
    {
      "module": 1,
      "title": "Introduction to Cleaning",
      "lessons": [
        {
          "title": "Cleaning Basics",
          "duration": 15,
          "type": "video"
        }
      ]
    }
  ],
  "requirements": [
    "Basic English skills"
  ],
  "certificate": {
    "available": true,
    "requirements": "Complete all modules with 80% score"
  }
}
```

**Response:** `201 Created`

---

### 2. Get My Courses

Get all courses you've created.

**Endpoint:** `GET /academy/my-created-courses`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. Upload Course Content

Upload videos and materials.

**Endpoint:** `POST /academy/courses/:id/videos`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

## Best Practices

### 1. Booking Management

- **Respond quickly** to booking requests (within 2 hours)
- **Accept bookings** you can fulfill to maintain high acceptance rate
- **Communicate clearly** with clients about expectations
- **Arrive on time** and notify clients of any delays
- **Document work** with before/after photos

### 2. Service Quality

- **Provide accurate descriptions** of your services
- **Set realistic pricing** based on market rates
- **Maintain professional appearance** and behavior
- **Follow safety protocols** at all times
- **Request reviews** from satisfied clients

### 3. Financial Management

- **Track all transactions** regularly
- **Schedule regular payouts** to maintain cash flow
- **Save tax documents** for record keeping
- **Monitor earnings trends** to optimize pricing
- **Reinvest in equipment** and training

### 4. Communication

- **Respond promptly** to client messages
- **Be professional** in all communications
- **Set clear expectations** about services
- **Follow up** after service completion
- **Handle complaints** professionally

### 5. Performance Optimization

- **Maintain high ratings** (4.5+ stars)
- **Complete bookings** on time (95%+ completion rate)
- **Update availability** regularly
- **Optimize service areas** for efficiency
- **Continuously improve** based on feedback

### 6. Safety & Security

- **Verify client identity** before service
- **Share location** with trusted contacts
- **Follow insurance requirements**
- **Report suspicious activity**
- **Maintain professional boundaries**

---

## API Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Booking Management | 50 requests | 15 minutes |
| Service Updates | 20 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| File Uploads | 10 requests | 1 hour |

---

## Support & Resources

### Getting Help

- **Provider Support**: providers@localpro.com
- **Technical Support**: support@localpro.com
- **Provider Portal**: https://provider.localpro.com
- **API Status**: https://status.localpro.com

### Training Resources

- **Provider Academy**: Online courses for skill development
- **Best Practices Guide**: Tips for success
- **Community Forum**: Connect with other providers

---

**© 2026 LocalPro Super App. All rights reserved.**
