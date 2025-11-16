# Provider Models Endpoints & Payloads

This document details the API endpoints and payloads for Provider-related models:
- ProviderProfessionalInfo
- ProviderFinancialInfo
- ProviderPreferences
- ProviderBusinessInfo
- ProviderPerformance

## Base Path
`/api/providers`

---

## 1. ProviderProfessionalInfo

### Endpoints

#### GET /api/providers/profile/me
**Access:** Authenticated (Provider)

**Description:** Get provider profile including professionalInfo

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": { ... },
    "professionalInfo": {
      "_id": "507f1f77bcf86cd799439012",
      "provider": "507f1f77bcf86cd799439011",
      "specialties": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "experience": 5,
          "certifications": [
            {
              "name": "Professional Cleaning Certification",
              "issuer": "Cleaning Institute",
              "dateIssued": "2023-01-15T00:00:00.000Z",
              "expiryDate": "2025-01-15T00:00:00.000Z",
              "certificateNumber": "CERT-12345"
            }
          ],
          "skills": [
            {
              "_id": "507f1f77bcf86cd799439014",
              "name": "House Cleaning",
              "description": "Professional house cleaning services",
              "category": {
                "_id": "507f1f77bcf86cd799439015",
                "key": "cleaning",
                "name": "Cleaning Services",
                "description": "Professional cleaning services",
                "metadata": {
                  "color": "#4CAF50",
                  "tags": ["cleaning"]
                }
              },
              "metadata": {
                "icon": "🧹",
                "tags": ["residential", "cleaning"]
              }
            }
          ],
          "hourlyRate": 500,
          "serviceAreas": [
            {
              "city": "Manila",
              "state": "Metro Manila",
              "radius": 10
            }
          ]
        }
      ],
      "languages": ["en", "fil"],
      "availability": {
        "monday": { "start": "08:00", "end": "17:00", "available": true },
        "tuesday": { "start": "08:00", "end": "17:00", "available": true },
        "wednesday": { "start": "08:00", "end": "17:00", "available": true },
        "thursday": { "start": "08:00", "end": "17:00", "available": true },
        "friday": { "start": "08:00", "end": "17:00", "available": true },
        "saturday": { "start": "09:00", "end": "15:00", "available": true },
        "sunday": { "start": "09:00", "end": "15:00", "available": false }
      },
      "emergencyServices": true,
      "travelDistance": 25,
      "minimumJobValue": 1000,
      "maximumJobValue": 50000,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-11-16T00:00:00.000Z"
    }
  }
}
```

#### POST /api/providers/profile
**Access:** Authenticated (Client upgrading to Provider)

**Description:** Create provider profile with professionalInfo

**Request Payload:**
```json
{
  "providerType": "individual",
  "professionalInfo": {
    "specialties": [
      {
        "experience": 5,
        "certifications": [
          {
            "name": "Professional Cleaning Certification",
            "issuer": "Cleaning Institute",
            "dateIssued": "2023-01-15T00:00:00.000Z",
            "expiryDate": "2025-01-15T00:00:00.000Z",
            "certificateNumber": "CERT-12345"
          }
        ],
        "skills": [
          "507f1f77bcf86cd799439014",
          "507f1f77bcf86cd799439015"
        ],
        "hourlyRate": 500,
        "serviceAreas": [
          {
            "city": "Manila",
            "state": "Metro Manila",
            "radius": 10
          }
        ]
      }
    ],
    "languages": ["en", "fil"],
    "availability": {
      "monday": { "start": "08:00", "end": "17:00", "available": true },
      "tuesday": { "start": "08:00", "end": "17:00", "available": true },
      "wednesday": { "start": "08:00", "end": "17:00", "available": true },
      "thursday": { "start": "08:00", "end": "17:00", "available": true },
      "friday": { "start": "08:00", "end": "17:00", "available": true },
      "saturday": { "start": "09:00", "end": "15:00", "available": true },
      "sunday": { "start": "09:00", "end": "15:00", "available": false }
    },
    "emergencyServices": true,
    "travelDistance": 25,
    "minimumJobValue": 1000,
    "maximumJobValue": 50000
  }
}
```

#### PUT /api/providers/profile
**Access:** Authenticated (Provider)

**Description:** Update provider profile including professionalInfo

**Request Payload:**
```json
{
  "professionalInfo": {
    "specialties": [
      {
        "experience": 6,
        "skills": ["507f1f77bcf86cd799439014"],
        "hourlyRate": 550,
        "serviceAreas": [
          {
            "city": "Manila",
            "state": "Metro Manila",
            "radius": 15
          }
        ]
      }
    ],
    "languages": ["en", "fil", "es"],
    "availability": {
      "monday": { "start": "09:00", "end": "18:00", "available": true }
    },
    "emergencyServices": false,
    "travelDistance": 30,
    "minimumJobValue": 1500,
    "maximumJobValue": 60000
  }
}
```

**Note:** All fields in professionalInfo are optional. Only provided fields will be updated.

---

## 2. ProviderBusinessInfo

### Endpoints

#### GET /api/providers/profile/me
**Access:** Authenticated (Provider)

**Description:** Get provider profile including businessInfo

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "businessInfo": {
      "_id": "507f1f77bcf86cd799439016",
      "provider": "507f1f77bcf86cd799439011",
      "businessName": "Maria's Cleaning Services",
      "businessType": "small_business",
      "businessRegistration": "REG-12345",
      "taxId": "TAX-12345",
      "businessAddress": {
        "street": "456 Business Avenue",
        "city": "Quezon City",
        "state": "Metro Manila",
        "zipCode": "1100",
        "country": "Philippines",
        "coordinates": {
          "lat": 14.6760,
          "lng": 121.0437
        }
      },
      "businessPhone": "+639171234570",
      "businessEmail": "business@example.com",
      "website": "https://example.com",
      "businessDescription": "Professional cleaning services",
      "yearEstablished": 2020,
      "numberOfEmployees": 10,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-11-16T00:00:00.000Z"
    }
  }
}
```

#### POST /api/providers/profile
**Access:** Authenticated (Client upgrading to Provider)

**Description:** Create provider profile with businessInfo (for business/agency providers)

**Request Payload:**
```json
{
  "providerType": "business",
  "businessInfo": {
    "businessName": "Maria's Cleaning Services",
    "businessType": "small_business",
    "businessRegistration": "REG-12345",
    "taxId": "TAX-12345",
    "businessAddress": {
      "street": "456 Business Avenue",
      "city": "Quezon City",
      "state": "Metro Manila",
      "zipCode": "1100",
      "country": "Philippines",
      "coordinates": {
        "lat": 14.6760,
        "lng": 121.0437
      }
    },
    "businessPhone": "+639171234570",
    "businessEmail": "business@example.com",
    "website": "https://example.com",
    "businessDescription": "Professional cleaning services",
    "yearEstablished": 2020,
    "numberOfEmployees": 10
  }
}
```

#### PUT /api/providers/profile
**Access:** Authenticated (Provider)

**Description:** Update provider profile including businessInfo

**Request Payload:**
```json
{
  "businessInfo": {
    "businessName": "Updated Business Name",
    "businessPhone": "+639171234571",
    "businessEmail": "newemail@example.com",
    "website": "https://newwebsite.com",
    "businessDescription": "Updated description",
    "numberOfEmployees": 15
  }
}
```

**Note:** businessInfo is only applicable for `business` or `agency` provider types.

---

## 3. ProviderFinancialInfo

### Endpoints

**Note:** FinancialInfo is typically managed through separate finance endpoints or during onboarding. It's not directly exposed in the main provider profile endpoints for security reasons.

#### GET /api/providers/profile/me
**Access:** Authenticated (Provider)

**Description:** Provider profile does NOT include financialInfo by default (excluded for security)

**Response:** FinancialInfo is excluded from the response

#### Internal Usage
FinancialInfo is accessed through:
- Provider model's `ensureFinancialInfo()` method
- Finance-related endpoints (if implemented separately)

**Model Structure:**
```json
{
  "provider": "507f1f77bcf86cd799439011",
  "bankAccount": {
    "accountHolder": "John Doe",
    "accountNumber": "****1234", // encrypted
    "routingNumber": "****5678", // encrypted
    "bankName": "Bank Name",
    "accountType": "checking"
  },
  "taxInfo": {
    "ssn": "***-**-****", // encrypted
    "ein": "**-*******", // encrypted
    "taxClassification": "sole_proprietorship",
    "w9Submitted": true
  },
  "paymentMethods": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "type": "bank_transfer",
      "details": { ... },
      "isDefault": true
    }
  ],
  "commissionRate": 0.1,
  "minimumPayout": 50
}
```

---

## 4. ProviderPreferences

### Endpoints

#### GET /api/providers/profile/me
**Access:** Authenticated (Provider)

**Description:** Get provider profile including preferences

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "preferences": {
      "_id": "507f1f77bcf86cd799439018",
      "provider": "507f1f77bcf86cd799439011",
      "notificationSettings": {
        "newJobAlerts": true,
        "messageNotifications": true,
        "paymentNotifications": true,
        "reviewNotifications": true,
        "marketingEmails": false
      },
      "jobPreferences": {
        "preferredJobTypes": ["cleaning", "maintenance"],
        "avoidJobTypes": ["heavy_lifting"],
        "preferredTimeSlots": ["morning", "afternoon"],
        "maxJobsPerDay": 5,
        "advanceBookingDays": 30
      },
      "communicationPreferences": {
        "preferredContactMethod": "app",
        "responseTimeExpectation": 60,
        "autoAcceptJobs": false
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-11-16T00:00:00.000Z"
    }
  }
}
```

#### POST /api/providers/profile
**Access:** Authenticated (Client upgrading to Provider)

**Description:** Create provider profile with preferences

**Request Payload:**
```json
{
  "providerType": "individual",
  "preferences": {
    "notificationSettings": {
      "newJobAlerts": true,
      "messageNotifications": true,
      "paymentNotifications": true,
      "reviewNotifications": true,
      "marketingEmails": false
    },
    "jobPreferences": {
      "preferredJobTypes": ["cleaning", "maintenance"],
      "avoidJobTypes": ["heavy_lifting"],
      "preferredTimeSlots": ["morning", "afternoon"],
      "maxJobsPerDay": 5,
      "advanceBookingDays": 30
    },
    "communicationPreferences": {
      "preferredContactMethod": "app",
      "responseTimeExpectation": 60,
      "autoAcceptJobs": false
    }
  }
}
```

#### PUT /api/providers/profile
**Access:** Authenticated (Provider)

**Description:** Update provider profile including preferences

**Request Payload:**
```json
{
  "preferences": {
    "notificationSettings": {
      "newJobAlerts": false,
      "marketingEmails": true
    },
    "jobPreferences": {
      "maxJobsPerDay": 8,
      "advanceBookingDays": 60
    },
    "communicationPreferences": {
      "preferredContactMethod": "email",
      "responseTimeExpectation": 30,
      "autoAcceptJobs": true
    }
  }
}
```

---

## 5. ProviderPerformance

### Endpoints

#### GET /api/providers/profile/me
**Access:** Authenticated (Provider)

**Description:** Get provider profile including performance

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "performance": {
      "_id": "507f1f77bcf86cd799439019",
      "provider": "507f1f77bcf86cd799439011",
      "rating": 4.8,
      "totalReviews": 150,
      "totalJobs": 200,
      "completedJobs": 195,
      "cancelledJobs": 5,
      "responseTime": 15,
      "completionRate": 97.5,
      "repeatCustomerRate": 85,
      "earnings": {
        "total": 500000,
        "thisMonth": 50000,
        "lastMonth": 45000,
        "pending": 10000
      },
      "badges": [
        {
          "name": "Top Rated",
          "description": "Consistently high ratings",
          "earnedDate": "2024-01-15T00:00:00.000Z",
          "category": "quality"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-11-16T00:00:00.000Z"
    }
  }
}
```

#### GET /api/providers/dashboard/overview
**Access:** Authenticated (Provider)

**Description:** Get provider dashboard with performance data

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "status": "active",
      "rating": 4.8,
      "totalJobs": 200,
      "completionRate": 97.5
    },
    "earnings": {
      "total": 500000,
      "thisMonth": 50000,
      "lastMonth": 45000,
      "pending": 10000
    },
    "recentActivity": {
      "recentBookings": [],
      "recentReviews": [],
      "recentMessages": []
    },
    "notifications": {
      "pendingJobs": 0,
      "unreadMessages": 0,
      "pendingReviews": 0
    },
    "performance": {
      "thisMonth": {
        "jobs": 0,
        "earnings": 50000,
        "rating": 4.8
      },
      "lastMonth": {
        "jobs": 0,
        "earnings": 45000,
        "rating": 4.8
      }
    }
  }
}
```

#### GET /api/providers/analytics/performance
**Access:** Authenticated (Provider)

**Description:** Get provider performance analytics

**Query Parameters:**
- `timeframe` (optional): `'7d'`, `'30d'`, `'90d'`, `'1y'` (default: `'30d'`)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "rating": {
      "current": 4.8,
      "previous": 4.7,
      "change": 0.1
    },
    "jobs": {
      "total": 200,
      "completed": 195,
      "cancelled": 5,
      "completionRate": 97.5
    },
    "earnings": {
      "total": 500000,
      "thisPeriod": 50000,
      "previousPeriod": 45000,
      "change": 11.1
    },
    "responseTime": {
      "average": 15,
      "trend": "improving"
    },
    "repeatCustomerRate": 85
  }
}
```

**Note:** Performance data is read-only and automatically updated by the system based on provider activity.

---

## Summary

### Endpoints Overview

| Model | GET | POST | PUT | Notes |
|-------|-----|------|-----|-------|
| **ProviderProfessionalInfo** | `/profile/me` | `/profile` | `/profile` | Included in provider profile |
| **ProviderBusinessInfo** | `/profile/me` | `/profile` | `/profile` | Only for business/agency types |
| **ProviderFinancialInfo** | N/A | N/A | N/A | Excluded from profile (security) |
| **ProviderPreferences** | `/profile/me` | `/profile` | `/profile` | Included in provider profile |
| **ProviderPerformance** | `/profile/me`, `/dashboard/overview`, `/analytics/performance` | N/A | N/A | Read-only, system-managed |

### Common Request/Response Pattern

All these models are accessed through the main provider profile endpoints:
- **GET** `/api/providers/profile/me` - Get all provider data (except financialInfo)
- **POST** `/api/providers/profile` - Create provider with initial data
- **PUT** `/api/providers/profile` - Update provider data (partial updates supported)

### Notes

1. **ProviderFinancialInfo** is excluded from profile responses for security reasons
2. **ProviderPerformance** is read-only and automatically updated by the system
3. All models use the `ensure*()` helper methods on the Provider model for automatic creation
4. Partial updates are supported - only provided fields are updated
5. All endpoints require authentication
6. Provider must have `provider` role to access these endpoints

