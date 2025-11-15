# User and Provider Payload Documentation

This document describes the complete payload structure returned by the Users API endpoints when fetching users with provider data.

## Endpoints

- `GET /api/users` - Get all users (with provider data if user has provider role)
- `GET /api/users/:id` - Get user by ID (with provider data if user has provider role)

## Response Structure

```json
{
  "success": true,
  "data": {
    "users": [
      {
        // User Payload (see below)
        "provider": {
          // Provider Payload (see below) - Only present if user has "provider" role
        }
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 100,
      "limit": 10
    }
  }
}
```

---

## User Payload

The user payload contains all user information. Fields marked with `*` are excluded from the response (`verificationCode` is always excluded).

### Basic Information

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "phoneNumber": "+1234567890",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["client", "provider"],
  "isVerified": true,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:45:00.000Z"
}
```

### Profile Information

```json
{
  "profile": {
    "avatar": {
      "url": "https://cloudinary.com/image.jpg",
      "publicId": "localpro/avatars/user123",
      "thumbnail": "https://cloudinary.com/image_thumb.jpg"
    },
    "bio": "Professional service provider with 10 years of experience",
    "address": {
      "street": "123 Main Street",
      "city": "Manila",
      "state": "Metro Manila",
      "zipCode": "1000",
      "country": "Philippines",
      "coordinates": {
        "lat": 14.5995,
        "lng": 120.9842
      }
    },
    "skills": ["plumbing", "electrical", "handyman"],
    "experience": 10,
    "rating": 4.5,
    "totalReviews": 150,
    "businessName": "John's Professional Services",
    "businessType": "small_business",
    "yearsInBusiness": 5,
    "serviceAreas": ["Manila", "Quezon City", "Makati"],
    "specialties": ["plumbing", "electrical"],
    "certifications": [
      {
        "name": "Licensed Plumber",
        "issuer": "Professional Licensing Board",
        "issueDate": "2020-01-15T00:00:00.000Z",
        "expiryDate": "2025-01-15T00:00:00.000Z",
        "document": {
          "url": "https://cloudinary.com/cert.pdf",
          "publicId": "localpro/certs/cert123",
          "filename": "plumber_license.pdf"
        }
      }
    ],
    "insurance": {
      "hasInsurance": true,
      "provider": "ABC Insurance",
      "policyNumber": "POL-123456",
      "coverageAmount": 100000,
      "expiryDate": "2025-12-31T00:00:00.000Z",
      "document": {
        "url": "https://cloudinary.com/insurance.pdf",
        "publicId": "localpro/insurance/ins123",
        "filename": "insurance_policy.pdf"
      }
    },
    "backgroundCheck": {
      "status": "approved",
      "completedAt": "2024-01-10T00:00:00.000Z",
      "document": {
        "url": "https://cloudinary.com/bgcheck.pdf",
        "publicId": "localpro/bgcheck/bg123",
        "filename": "background_check.pdf"
      }
    },
    "portfolio": [
      {
        "title": "Kitchen Renovation",
        "description": "Complete kitchen remodeling project",
        "images": [
          {
            "url": "https://cloudinary.com/portfolio1.jpg",
            "publicId": "localpro/portfolio/img1",
            "thumbnail": "https://cloudinary.com/portfolio1_thumb.jpg"
          }
        ],
        "category": "renovation",
        "completedAt": "2024-01-05T00:00:00.000Z"
      }
    ],
    "availability": {
      "schedule": [
        {
          "day": "monday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        }
      ],
      "timezone": "Asia/Manila",
      "emergencyService": true
    }
  }
}
```

### Preferences

```json
{
  "preferences": {
    "notifications": {
      "sms": true,
      "email": true,
      "push": true
    },
    "language": "en"
  }
}
```

### Wallet Information

```json
{
  "wallet": {
    "balance": 1250.50,
    "currency": "USD"
  }
}
```

### Agency Relationship

```json
{
  "agency": {
    "agencyId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC Agency",
      "type": "service_provider"
    },
    "role": "provider",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "status": "active",
    "commissionRate": 10
  }
}
```

### Referral Information

```json
{
  "referral": {
    "referredBy": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "referralCode": "REF123456",
    "referredUsers": 5
  }
}
```

### Trust & Verification

```json
{
  "trustScore": 95,
  "verification": {
    "phoneVerified": true,
    "emailVerified": true,
    "identityVerified": true,
    "businessVerified": true
  },
  "badges": [
    {
      "name": "Verified Provider",
      "description": "Identity and business verified",
      "icon": "verified",
      "earnedAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

### Subscription

```json
{
  "localProPlusSubscription": "507f1f77bcf86cd799439014"
}
```

---

## Provider Payload

The provider payload is **only included** when the user has `"provider"` in their `roles` array. If a user has the provider role but no provider profile exists, `provider` will be `null`.

**Note:** Sensitive fields are excluded from the provider payload:
- `financialInfo` (bank accounts, tax info, payment methods)
- `verification.backgroundCheck` (background check details)
- `verification.insurance.documents` (insurance document URLs)
- `onboarding` (onboarding progress data)

### Basic Provider Information

```json
{
  "provider": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "status": "active",
    "providerType": "individual",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

### Business Information

```json
{
  "provider": {
    "businessInfo": {
      "businessName": "John's Professional Services",
      "businessType": "LLC",
      "businessRegistration": "REG-123456",
      "taxId": "TAX-789012",
      "businessAddress": {
        "street": "123 Business Street",
        "city": "Manila",
        "state": "Metro Manila",
        "zipCode": "1000",
        "country": "Philippines",
        "coordinates": {
          "lat": 14.5995,
          "lng": 120.9842
        }
      },
      "businessPhone": "+1234567890",
      "businessEmail": "business@example.com",
      "website": "https://johnsproservices.com",
      "businessDescription": "Professional home services provider",
      "yearEstablished": 2019,
      "numberOfEmployees": 15
    }
  }
}
```

### Professional Information

```json
{
  "provider": {
    "professionalInfo": {
      "specialties": [
        {
          "category": "plumbing",
          "subcategories": ["pipe_repair", "drain_cleaning", "installation"],
          "experience": 10,
          "certifications": [
            {
              "name": "Master Plumber License",
              "issuer": "Professional Licensing Board",
              "dateIssued": "2020-01-15T00:00:00.000Z",
              "expiryDate": "2025-01-15T00:00:00.000Z",
              "certificateNumber": "CERT-123456"
            }
          ],
          "skills": ["pipe_installation", "leak_detection", "water_heater_repair"],
          "hourlyRate": 50,
          "serviceAreas": [
            {
              "city": "Manila",
              "state": "Metro Manila",
              "radius": 25
            }
          ]
        }
      ],
      "languages": ["en", "tl"],
      "availability": {
        "monday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "tuesday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "wednesday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "thursday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "friday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "saturday": {
          "start": "10:00",
          "end": "14:00",
          "available": true
        },
        "sunday": {
          "start": null,
          "end": null,
          "available": false
        }
      },
      "emergencyServices": true,
      "travelDistance": 50,
      "minimumJobValue": 100,
      "maximumJobValue": 10000
    }
  }
}
```

### Verification Information

```json
{
  "provider": {
    "verification": {
      "identityVerified": true,
      "businessVerified": true,
      "backgroundCheck": {
        "status": "passed",
        "dateCompleted": "2024-01-10T00:00:00.000Z",
        "reportId": "BG-123456"
        // Note: Full background check details are excluded
      },
      "insurance": {
        "hasInsurance": true,
        "insuranceProvider": "ABC Insurance",
        "policyNumber": "POL-123456",
        "coverageAmount": 100000,
        "expiryDate": "2025-12-31T00:00:00.000Z"
        // Note: insurance.documents array is excluded
      },
      "licenses": [
        {
          "type": "business_license",
          "number": "LIC-123456",
          "issuingAuthority": "City Business Bureau",
          "issueDate": "2020-01-15T00:00:00.000Z",
          "expiryDate": "2025-01-15T00:00:00.000Z",
          "documents": [
            "https://cloudinary.com/license.pdf"
          ]
        }
      ],
      "references": [
        {
          "name": "Jane Smith",
          "relationship": "former_client",
          "phone": "+1234567890",
          "email": "jane@example.com",
          "company": "Smith Enterprises",
          "verified": true
        }
      ],
      "portfolio": {
        "images": [
          "https://cloudinary.com/portfolio1.jpg",
          "https://cloudinary.com/portfolio2.jpg"
        ],
        "videos": [
          "https://youtube.com/watch?v=abc123"
        ],
        "descriptions": [
          "Kitchen renovation project",
          "Bathroom remodeling"
        ],
        "beforeAfter": [
          {
            "before": "https://cloudinary.com/before1.jpg",
            "after": "https://cloudinary.com/after1.jpg",
            "description": "Complete kitchen transformation"
          }
        ]
      }
    }
  }
}
```

### Performance Metrics

```json
{
  "provider": {
    "performance": {
      "rating": 4.5,
      "totalReviews": 150,
      "totalJobs": 200,
      "completedJobs": 195,
      "cancelledJobs": 5,
      "responseTime": 15,
      "completionRate": 97.5,
      "repeatCustomerRate": 45,
      "earnings": {
        "total": 50000,
        "thisMonth": 5000,
        "lastMonth": 4500,
        "pending": 500
      },
      "badges": [
        {
          "name": "Top Rated",
          "description": "Consistently high ratings",
          "earnedDate": "2024-01-15T00:00:00.000Z",
          "category": "performance"
        }
      ]
    }
  }
}
```

### Provider Preferences

```json
{
  "provider": {
    "preferences": {
      "notificationSettings": {
        "newJobAlerts": true,
        "messageNotifications": true,
        "paymentNotifications": true,
        "reviewNotifications": true,
        "marketingEmails": false
      },
      "jobPreferences": {
        "preferredJobTypes": ["plumbing", "electrical"],
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
}
```

### Subscription & Plans

```json
{
  "provider": {
    "subscription": {
      "plan": "professional",
      "features": [
        "unlimited_services",
        "priority_support",
        "advanced_analytics"
      ],
      "limits": {
        "maxServices": 20,
        "maxBookingsPerMonth": 200,
        "prioritySupport": true,
        "advancedAnalytics": true
      },
      "billingCycle": "monthly",
      "nextBillingDate": "2024-02-15T00:00:00.000Z",
      "autoRenew": true
    }
  }
}
```

### Provider Settings

```json
{
  "provider": {
    "settings": {
      "profileVisibility": "public",
      "showContactInfo": true,
      "showPricing": true,
      "showReviews": true,
      "allowDirectBooking": true,
      "requireApproval": false
    }
  }
}
```

### Metadata

```json
{
  "provider": {
    "metadata": {
      "lastActive": "2024-01-20T14:45:00.000Z",
      "profileViews": 1250,
      "searchRanking": 8.5,
      "featured": true,
      "promoted": false,
      "tags": ["verified", "top_rated", "experienced"],
      "notes": "Excellent service provider"
    }
  }
}
```

---

## Complete Example Response

### User with Provider Role and Profile

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "phoneNumber": "+1234567890",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "roles": ["client", "provider"],
        "isVerified": true,
        "isActive": true,
        "profile": {
          "avatar": {
            "url": "https://cloudinary.com/avatar.jpg",
            "publicId": "localpro/avatars/user123"
          },
          "bio": "Professional service provider",
          "address": {
            "city": "Manila",
            "state": "Metro Manila"
          },
          "rating": 4.5,
          "totalReviews": 150
        },
        "wallet": {
          "balance": 1250.50,
          "currency": "USD"
        },
        "provider": {
          "_id": "507f1f77bcf86cd799439015",
          "userId": "507f1f77bcf86cd799439011",
          "status": "active",
          "providerType": "individual",
          "businessInfo": {
            "businessName": "John's Professional Services",
            "businessType": "LLC"
          },
          "professionalInfo": {
            "specialties": [
              {
                "category": "plumbing",
                "hourlyRate": 50,
                "experience": 10
              }
            ],
            "emergencyServices": true
          },
          "verification": {
            "identityVerified": true,
            "businessVerified": true
          },
          "performance": {
            "rating": 4.5,
            "totalReviews": 150,
            "totalJobs": 200,
            "completedJobs": 195
          },
          "createdAt": "2024-01-15T10:30:00.000Z",
          "updatedAt": "2024-01-20T14:45:00.000Z"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T14:45:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 100,
      "limit": 10
    }
  }
}
```

### User with Provider Role but No Profile

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "phoneNumber": "+1234567890",
        "email": "jane@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "roles": ["client", "provider"],
        "isVerified": true,
        "isActive": true,
        "provider": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T14:45:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 1,
      "total": 1,
      "limit": 10
    }
  }
}
```

### User without Provider Role

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "phoneNumber": "+1234567890",
        "email": "client@example.com",
        "firstName": "Client",
        "lastName": "User",
        "roles": ["client"],
        "isVerified": true,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T14:45:00.000Z"
        // No "provider" field - user doesn't have provider role
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 1,
      "total": 1,
      "limit": 10
    }
  }
}
```

---

## Field Exclusions

The following fields are **excluded** from the provider payload for security and privacy:

1. **Financial Information** (`financialInfo`)
   - Bank account details
   - Tax information (SSN, EIN)
   - Payment methods
   - Commission rates

2. **Background Check Details** (`verification.backgroundCheck`)
   - Full background check report details

3. **Insurance Documents** (`verification.insurance.documents`)
   - Insurance document URLs

4. **Onboarding Data** (`onboarding`)
   - Onboarding progress and step data

5. **User Verification Code** (`verificationCode`)
   - Always excluded from user payload

---

## Notes

1. **Provider Field Presence:**
   - Only present if user has `"provider"` in `roles` array
   - Will be `null` if user has provider role but no provider profile exists
   - Will be absent if user doesn't have provider role

2. **Data Consistency:**
   - Provider `userId` always matches the user `_id`
   - Provider data is fetched in batch for efficiency

3. **Error Handling:**
   - If provider data fetch fails, the request continues without provider data
   - User data is always returned even if provider data is unavailable

4. **Performance:**
   - Provider data is fetched in a single batch query for all users with provider role
   - Uses efficient Map-based lookup for attaching provider data to users

