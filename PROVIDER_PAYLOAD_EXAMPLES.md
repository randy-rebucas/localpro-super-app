# Provider API Payload and Response Examples

## 1. Create Provider Profile

**Endpoint:** `POST /api/providers/profile`  
**Access:** Protected (Authentication required)

### Request Payload

#### Individual Provider (Minimal)

```json
{
  "providerType": "individual",
  "professionalInfo": {
    "specialties": [
      {
        "category": "plumbing",
        "serviceAreas": [
          {
            "city": "New York",
            "state": "NY",
            "radius": 25
          }
        ],
        "skills": ["507f1f77bcf86cd799439020"],
        "hourlyRate": 75,
        "experience": 5
      }
    ],
    "languages": ["en", "es"],
    "availability": {
      "monday": { "start": "08:00", "end": "18:00", "available": true },
      "tuesday": { "start": "08:00", "end": "18:00", "available": true },
      "wednesday": { "start": "08:00", "end": "18:00", "available": true },
      "thursday": { "start": "08:00", "end": "18:00", "available": true },
      "friday": { "start": "08:00", "end": "18:00", "available": true },
      "saturday": { "start": "09:00", "end": "15:00", "available": true },
      "sunday": { "available": false }
    },
    "emergencyServices": true,
    "travelDistance": 50,
    "minimumJobValue": 100,
    "maximumJobValue": 5000
  },
  "settings": {
    "profileVisibility": "public",
    "showContactInfo": true,
    "showPricing": true,
    "showReviews": true,
    "allowDirectBooking": true,
    "requireApproval": false
  }
}
```

#### Business Provider (Full Example)

```json
{
  "providerType": "business",
  "businessInfo": {
    "businessName": "John's Plumbing Services",
    "businessType": "small_business",
    "businessRegistration": "NY-123456",
    "businessAddress": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "businessPhone": "+1234567890",
    "businessEmail": "business@example.com",
    "website": "https://example.com",
    "businessDescription": "Professional plumbing and electrical services with 10+ years of experience serving New York area.",
    "yearEstablished": 2020,
    "numberOfEmployees": 10,
    "taxId": "12-3456789"
  },
  "professionalInfo": {
    "specialties": [
      {
        "category": "plumbing",
        "serviceAreas": [
          {
            "city": "New York",
            "state": "NY",
            "radius": 30
          },
          {
            "city": "Brooklyn",
            "state": "NY",
            "radius": 25
          }
        ],
        "skills": [
          "507f1f77bcf86cd799439020",
          "507f1f77bcf86cd799439021"
        ],
        "hourlyRate": 85,
        "experience": 10,
        "certifications": [
          {
            "name": "Licensed Master Plumber",
            "issuer": "New York State Board",
            "dateIssued": "2020-01-15T00:00:00.000Z",
            "expiryDate": "2025-01-15T00:00:00.000Z",
            "certificateNumber": "PL-12345"
          }
        ]
      },
      {
        "category": "electrical",
        "serviceAreas": [
          {
            "city": "New York",
            "state": "NY",
            "radius": 20
          }
        ],
        "skills": ["507f1f77bcf86cd799439022"],
        "hourlyRate": 95,
        "experience": 8
      }
    ],
    "languages": ["en", "es", "fr"],
    "availability": {
      "monday": { "start": "07:00", "end": "19:00", "available": true },
      "tuesday": { "start": "07:00", "end": "19:00", "available": true },
      "wednesday": { "start": "07:00", "end": "19:00", "available": true },
      "thursday": { "start": "07:00", "end": "19:00", "available": true },
      "friday": { "start": "07:00", "end": "19:00", "available": true },
      "saturday": { "start": "08:00", "end": "16:00", "available": true },
      "sunday": { "start": "09:00", "end": "14:00", "available": true }
    },
    "emergencyServices": true,
    "travelDistance": 50,
    "minimumJobValue": 150,
    "maximumJobValue": 10000
  },
  "verification": {
    "identityVerified": false,
    "businessVerified": false,
    "insurance": {
      "hasInsurance": true,
      "insuranceProvider": "State Farm",
      "policyNumber": "SF-123456",
      "coverageAmount": 1000000,
      "expiryDate": "2025-12-31T00:00:00.000Z"
    },
    "licenses": [
      {
        "type": "plumbing",
        "number": "PL-12345",
        "issuingAuthority": "New York State Board",
        "issueDate": "2020-01-15T00:00:00.000Z",
        "expiryDate": "2025-01-15T00:00:00.000Z"
      }
    ],
    "references": [
      {
        "name": "Jane Smith",
        "relationship": "Former Client",
        "phone": "+1987654321",
        "email": "jane@example.com",
        "company": "Smith Construction"
      }
    ],
    "portfolio": {
      "images": [
        "https://cloudinary.com/portfolio1.jpg",
        "https://cloudinary.com/portfolio2.jpg"
      ],
      "videos": [
        "https://youtube.com/watch?v=example1"
      ],
      "descriptions": [
        "Kitchen plumbing renovation",
        "Bathroom electrical upgrade"
      ],
      "beforeAfter": [
        {
          "before": "https://cloudinary.com/before1.jpg",
          "after": "https://cloudinary.com/after1.jpg",
          "description": "Complete bathroom renovation"
        }
      ]
    }
  },
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
      "avoidJobTypes": ["roofing"],
      "preferredTimeSlots": ["morning", "afternoon"],
      "maxJobsPerDay": 5,
      "advanceBookingDays": 30
    },
    "communicationPreferences": {
      "preferredContactMethod": "phone",
      "responseTimeExpectation": 60,
      "autoAcceptJobs": false
    }
  },
  "settings": {
    "profileVisibility": "public",
    "showContactInfo": true,
    "showPricing": true,
    "showReviews": true,
    "allowDirectBooking": true,
    "requireApproval": false
  }
}
```

### Response (201 Created)

```json
{
  "success": true,
  "message": "Provider profile created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "providerType": "business",
    "status": "pending",
    "businessInfo": "507f1f77bcf86cd799439013",
    "professionalInfo": "507f1f77bcf86cd799439014",
    "verification": "507f1f77bcf86cd799439016",
    "preferences": "507f1f77bcf86cd799439017",
    "performance": "507f1f77bcf86cd799439018",
    "onboarding": {
      "completed": false,
      "currentStep": "profile_setup",
      "progress": 10,
      "steps": [
        {
          "step": "profile_setup",
          "completed": true,
          "completedAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    },
    "settings": {
      "profileVisibility": "public",
      "showContactInfo": true,
      "showPricing": true,
      "showReviews": true,
      "allowDirectBooking": true,
      "requireApproval": false
    },
    "metadata": {
      "lastActive": "2024-01-15T10:30:00.000Z",
      "profileViews": 0,
      "searchRanking": 0,
      "featured": false,
      "promoted": false,
      "tags": []
    },
    "deleted": false,
    "deletedOn": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2. Get Provider Profile

**Endpoint:** `GET /api/providers/:id`  
**Access:** Public

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "profileImage": "https://cloudinary.com/avatar.jpg",
      "profile": {
        "avatar": {
          "url": "https://cloudinary.com/avatar.jpg",
          "publicId": "localpro/avatars/user123"
        },
        "bio": "Professional plumber with 10 years of experience",
        "address": {
          "city": "New York",
          "state": "NY"
        }
      },
      "roles": ["client", "provider"],
      "isActive": true,
      "verification": {
        "phoneVerified": true,
        "emailVerified": true
      },
      "badges": []
    },
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "profileImage": "https://cloudinary.com/avatar.jpg",
      "profile": {
        "avatar": {
          "url": "https://cloudinary.com/avatar.jpg",
          "publicId": "localpro/avatars/user123"
        },
        "bio": "Professional plumber with 10 years of experience",
        "address": {
          "city": "New York",
          "state": "NY"
        }
      },
      "roles": ["client", "provider"],
      "isActive": true,
      "verification": {
        "phoneVerified": true,
        "emailVerified": true
      },
      "badges": []
    },
    "userProfile": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "profileImage": "https://cloudinary.com/avatar.jpg",
      "profile": {
        "avatar": {
          "url": "https://cloudinary.com/avatar.jpg",
          "publicId": "localpro/avatars/user123"
        },
        "bio": "Professional plumber with 10 years of experience",
        "address": {
          "city": "New York",
          "state": "NY"
        }
      },
      "roles": ["client", "provider"],
      "isActive": true,
      "verification": {
        "phoneVerified": true,
        "emailVerified": true
      },
      "badges": []
    },
    "providerType": "business",
    "status": "active",
    "businessInfo": {
      "_id": "507f1f77bcf86cd799439013",
      "provider": "507f1f77bcf86cd799439015",
      "businessName": "John's Plumbing Services",
      "businessType": "small_business",
      "businessAddress": {
        "street": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "businessPhone": "+1234567890",
      "businessEmail": "business@example.com",
      "website": "https://example.com",
      "businessDescription": "Professional plumbing and electrical services with 10+ years of experience serving New York area.",
      "businessRegistration": "NY-123456",
      "yearEstablished": 2020,
      "numberOfEmployees": 10,
      "taxId": "12-3456789",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "professionalInfo": {
      "_id": "507f1f77bcf86cd799439014",
      "provider": "507f1f77bcf86cd799439015",
      "specialties": [
        {
          "_id": "507f1f77bcf86cd799439019",
          "category": "plumbing",
          "experience": 10,
          "certifications": [
            {
              "name": "Licensed Master Plumber",
              "issuer": "New York State Board",
              "dateIssued": "2020-01-15T00:00:00.000Z",
              "expiryDate": "2025-01-15T00:00:00.000Z",
              "certificateNumber": "PL-12345"
            }
          ],
          "skills": [
            {
              "_id": "507f1f77bcf86cd799439020",
              "name": "Plumbing",
              "description": "General plumbing services",
              "category": {
                "id": "507f1f77bcf86cd799439025",
                "key": "plumbing",
                "name": "Plumbing",
                "description": "Plumbing services",
                "metadata": {}
              },
              "metadata": {}
            },
            {
              "_id": "507f1f77bcf86cd799439021",
              "name": "Pipe Repair",
              "description": "Pipe repair and replacement",
              "category": {
                "id": "507f1f77bcf86cd799439025",
                "key": "plumbing",
                "name": "Plumbing",
                "description": "Plumbing services",
                "metadata": {}
              },
              "metadata": {}
            }
          ],
          "hourlyRate": 85,
          "serviceAreas": [
            {
              "city": "New York",
              "state": "NY",
              "radius": 30
            },
            {
              "city": "Brooklyn",
              "state": "NY",
              "radius": 25
            }
          ]
        },
        {
          "_id": "507f1f77bcf86cd799439026",
          "category": "electrical",
          "experience": 8,
          "skills": [
            {
              "_id": "507f1f77bcf86cd799439022",
              "name": "Electrical Repair",
              "description": "Electrical repair services",
              "category": {
                "id": "507f1f77bcf86cd799439027",
                "key": "electrical",
                "name": "Electrical",
                "description": "Electrical services",
                "metadata": {}
              },
              "metadata": {}
            }
          ],
          "hourlyRate": 95,
          "serviceAreas": [
            {
              "city": "New York",
              "state": "NY",
              "radius": 20
            }
          ]
        }
      ],
      "languages": ["en", "es", "fr"],
      "availability": {
        "monday": { "start": "07:00", "end": "19:00", "available": true },
        "tuesday": { "start": "07:00", "end": "19:00", "available": true },
        "wednesday": { "start": "07:00", "end": "19:00", "available": true },
        "thursday": { "start": "07:00", "end": "19:00", "available": true },
        "friday": { "start": "07:00", "end": "19:00", "available": true },
        "saturday": { "start": "08:00", "end": "16:00", "available": true },
        "sunday": { "start": "09:00", "end": "14:00", "available": true }
      },
      "emergencyServices": true,
      "travelDistance": 50,
      "minimumJobValue": 150,
      "maximumJobValue": 10000,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "verification": {
      "_id": "507f1f77bcf86cd799439016",
      "provider": "507f1f77bcf86cd799439015",
      "identityVerified": true,
      "businessVerified": true,
      "insurance": {
        "hasInsurance": true,
        "insuranceProvider": "State Farm",
        "policyNumber": "SF-123456",
        "coverageAmount": 1000000,
        "expiryDate": "2025-12-31T00:00:00.000Z"
      },
      "licenses": [
        {
          "_id": "507f1f77bcf86cd799439030",
          "type": "plumbing",
          "number": "PL-12345",
          "issuingAuthority": "New York State Board",
          "issueDate": "2020-01-15T00:00:00.000Z",
          "expiryDate": "2025-01-15T00:00:00.000Z",
          "documents": [
            "https://cloudinary.com/license1.pdf"
          ]
        }
      ],
      "references": [
        {
          "_id": "507f1f77bcf86cd799439031",
          "name": "Jane Smith",
          "relationship": "Former Client",
          "phone": "+1987654321",
          "email": "jane@example.com",
          "company": "Smith Construction",
          "verified": true
        }
      ],
      "portfolio": {
        "images": [
          "https://cloudinary.com/portfolio1.jpg",
          "https://cloudinary.com/portfolio2.jpg"
        ],
        "videos": [
          "https://youtube.com/watch?v=example1"
        ],
        "descriptions": [
          "Kitchen plumbing renovation",
          "Bathroom electrical upgrade"
        ],
        "beforeAfter": [
          {
            "before": "https://cloudinary.com/before1.jpg",
            "after": "https://cloudinary.com/after1.jpg",
            "description": "Complete bathroom renovation"
          }
        ]
      },
      "backgroundCheck": {
        "status": "passed",
        "dateCompleted": "2024-01-10T00:00:00.000Z"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "preferences": {
      "_id": "507f1f77bcf86cd799439017",
      "provider": "507f1f77bcf86cd799439015",
      "notificationSettings": {
        "newJobAlerts": true,
        "messageNotifications": true,
        "paymentNotifications": true,
        "reviewNotifications": true,
        "marketingEmails": false
      },
      "jobPreferences": {
        "preferredJobTypes": ["plumbing", "electrical"],
        "avoidJobTypes": ["roofing"],
        "preferredTimeSlots": ["morning", "afternoon"],
        "maxJobsPerDay": 5,
        "advanceBookingDays": 30
      },
      "communicationPreferences": {
        "preferredContactMethod": "phone",
        "responseTimeExpectation": 60,
        "autoAcceptJobs": false
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "performance": {
      "_id": "507f1f77bcf86cd799439018",
      "provider": "507f1f77bcf86cd799439015",
      "rating": 4.8,
      "totalReviews": 150,
      "totalJobs": 200,
      "completedJobs": 195,
      "cancelledJobs": 5,
      "completionRate": 97.5,
      "responseTime": 15,
      "repeatCustomerRate": 65,
      "earnings": {
        "total": 50000,
        "thisMonth": 5000,
        "lastMonth": 4500,
        "pending": 1000
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "settings": {
      "profileVisibility": "public",
      "showContactInfo": true,
      "showPricing": true,
      "showReviews": true,
      "allowDirectBooking": true,
      "requireApproval": false
    },
    "metadata": {
      "lastActive": "2024-01-20T14:45:00.000Z",
      "profileViews": 1250,
      "searchRanking": 8.5,
      "featured": true,
      "promoted": false,
      "tags": ["verified", "top_rated", "experienced"],
      "notes": "Excellent service provider"
    },
    "deleted": false,
    "deletedOn": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

**Note:** `financialInfo` is excluded from the response for security reasons.

---

## 3. Get My Provider Profile

**Endpoint:** `GET /api/providers/profile/me`  
**Access:** Protected (Authentication required)

### Response (200 OK)

Same structure as Get Provider Profile, but includes `financialInfo`:

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profileImage": "https://cloudinary.com/avatar.jpg"
    },
    "providerType": "business",
    "status": "active",
    "businessInfo": { /* ... same as above ... */ },
    "professionalInfo": { /* ... same as above ... */ },
    "verification": { /* ... same as above ... */ },
    "financialInfo": {
      "_id": "507f1f77bcf86cd799439019",
      "provider": "507f1f77bcf86cd799439015",
      "bankAccount": {
        "accountHolder": "John's Plumbing Services",
        "accountNumber": "****1234",
        "routingNumber": "****5678",
        "bankName": "Chase Bank",
        "accountType": "checking"
      },
      "taxInfo": {
        "ssn": "***-**-1234",
        "ein": "12-3456789",
        "taxClassification": "LLC",
        "w9Submitted": true
      },
      "paymentMethods": [
        {
          "_id": "507f1f77bcf86cd799439032",
          "type": "bank_transfer",
          "details": {
            "accountNumber": "****1234",
            "routingNumber": "****5678"
          },
          "isDefault": true
        },
        {
          "_id": "507f1f77bcf86cd799439033",
          "type": "paypal",
          "details": {
            "email": "payments@example.com"
          },
          "isDefault": false
        }
      ],
      "commissionRate": 0.15,
      "minimumPayout": 50,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "preferences": { /* ... same as above ... */ },
    "performance": { /* ... same as above ... */ },
    "settings": { /* ... same as above ... */ },
    "metadata": { /* ... same as above ... */ },
    "onboarding": {
      "completed": true,
      "currentStep": "review",
      "progress": 100,
      "steps": [
        {
          "step": "profile_setup",
          "completed": true,
          "completedAt": "2024-01-15T10:30:00.000Z"
        },
        {
          "step": "business_info",
          "completed": true,
          "completedAt": "2024-01-15T11:00:00.000Z"
        },
        {
          "step": "professional_info",
          "completed": true,
          "completedAt": "2024-01-15T12:00:00.000Z"
        },
        {
          "step": "verification",
          "completed": true,
          "completedAt": "2024-01-16T10:00:00.000Z"
        },
        {
          "step": "documents",
          "completed": true,
          "completedAt": "2024-01-17T10:00:00.000Z"
        },
        {
          "step": "portfolio",
          "completed": true,
          "completedAt": "2024-01-18T10:00:00.000Z"
        },
        {
          "step": "preferences",
          "completed": true,
          "completedAt": "2024-01-19T10:00:00.000Z"
        },
        {
          "step": "review",
          "completed": true,
          "completedAt": "2024-01-20T10:00:00.000Z"
        }
      ]
    },
    "deleted": false,
    "deletedOn": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

---

## 4. Update Provider Profile

**Endpoint:** `PUT /api/providers/profile`  
**Access:** Protected (Authentication required)

### Request Payload (Partial Update)

```json
{
  "providerType": "business",
  "professionalInfo": {
    "specialties": [
      {
        "category": "plumbing",
        "hourlyRate": 90,
        "serviceAreas": [
          {
            "city": "New York",
            "state": "NY",
            "radius": 35
          }
        ]
      }
    ],
    "emergencyServices": true,
    "travelDistance": 60
  },
  "settings": {
    "profileVisibility": "public",
    "showPricing": true,
    "allowDirectBooking": false
  }
}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011",
    "providerType": "business",
    "status": "active",
    /* ... updated fields ... */
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

---

## Field Descriptions

### Provider Status
- `pending`: Profile created but not yet reviewed
- `active`: Profile approved and active
- `suspended`: Temporarily suspended
- `inactive`: Inactive by provider choice
- `rejected`: Profile rejected by admin

### Provider Type
- `individual`: Solo provider
- `business`: Small business
- `agency`: Agency with multiple providers

### Specialty Categories
Valid categories: `cleaning`, `plumbing`, `electrical`, `moving`, `landscaping`, `pest_control`, `handyman`, `painting`, `carpentry`, `flooring`, `roofing`, `hvac`, `appliance_repair`, `locksmith`, `home_security`, `pool_maintenance`, `carpet_cleaning`, `window_cleaning`, `gutter_cleaning`, `power_washing`, `snow_removal`, `other`

### Profile Visibility
- `public`: Visible to everyone
- `private`: Only visible to verified users
- `verified_only`: Only visible to verified providers

---

## Complete Field Reference

### Provider Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | ObjectId | Yes | Reference to User model |
| `providerType` | String | Yes | `individual`, `business`, or `agency` |
| `status` | String | No | `pending`, `active`, `suspended`, `inactive`, `rejected` |
| `businessInfo` | ObjectId | No | Reference to ProviderBusinessInfo (required for business/agency) |
| `professionalInfo` | ObjectId | No | Reference to ProviderProfessionalInfo |
| `verification` | ObjectId | No | Reference to ProviderVerification |
| `financialInfo` | ObjectId | No | Reference to ProviderFinancialInfo |
| `performance` | ObjectId | No | Reference to ProviderPerformance |
| `preferences` | ObjectId | No | Reference to ProviderPreferences |
| `onboarding` | Object | No | Onboarding progress tracking |
| `settings` | Object | No | Provider profile settings |
| `metadata` | Object | No | Metadata (views, ranking, tags, etc.) |
| `deleted` | Boolean | No | Soft delete flag |
| `deletedOn` | Date | No | Soft delete timestamp |

### BusinessInfo Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessName` | String | Yes* | Business name (*required for business/agency) |
| `businessType` | String | No | Type of business |
| `businessRegistration` | String | No | Business registration number |
| `businessAddress` | Object | No | Business address with coordinates |
| `businessPhone` | String | No | Business phone number |
| `businessEmail` | String | No | Business email |
| `website` | String | No | Business website URL |
| `businessDescription` | String | No | Business description |
| `yearEstablished` | Number | No | Year business was established |
| `numberOfEmployees` | Number | No | Number of employees |
| `taxId` | String | No | Tax identification number |

### ProfessionalInfo Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `specialties` | Array | Yes | Array of specialty objects |
| `specialties[].category` | String | Yes | Service category key |
| `specialties[].experience` | Number | No | Years of experience |
| `specialties[].certifications` | Array | No | Array of certification objects |
| `specialties[].skills` | Array[ObjectId] | No | Array of ProviderSkill IDs |
| `specialties[].hourlyRate` | Number | No | Hourly rate for this specialty |
| `specialties[].serviceAreas` | Array | Yes | Array of service area objects |
| `specialties[].serviceAreas[].city` | String | Yes | City name |
| `specialties[].serviceAreas[].state` | String | Yes | State name |
| `specialties[].serviceAreas[].radius` | Number | No | Service radius in miles/km |
| `languages` | Array[String] | No | Array of language codes |
| `availability` | Object | No | Weekly availability schedule |
| `emergencyServices` | Boolean | No | Whether emergency services are offered |
| `travelDistance` | Number | No | Maximum travel distance |
| `minimumJobValue` | Number | No | Minimum job value accepted |
| `maximumJobValue` | Number | No | Maximum job value accepted |

### Verification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identityVerified` | Boolean | No | Identity verification status |
| `businessVerified` | Boolean | No | Business verification status |
| `backgroundCheck` | Object | No | Background check information |
| `backgroundCheck.status` | String | No | `pending`, `passed`, `failed`, `not_required` |
| `backgroundCheck.dateCompleted` | Date | No | Date background check completed |
| `insurance` | Object | No | Insurance information |
| `insurance.hasInsurance` | Boolean | No | Whether provider has insurance |
| `insurance.insuranceProvider` | String | No | Insurance provider name |
| `insurance.policyNumber` | String | No | Insurance policy number |
| `insurance.coverageAmount` | Number | No | Coverage amount |
| `insurance.expiryDate` | Date | No | Insurance expiry date |
| `licenses` | Array | No | Array of license objects |
| `licenses[].type` | String | No | License type |
| `licenses[].number` | String | No | License number |
| `licenses[].issuingAuthority` | String | No | Issuing authority |
| `licenses[].issueDate` | Date | No | Issue date |
| `licenses[].expiryDate` | Date | No | Expiry date |
| `licenses[].documents` | Array[String] | No | Document URLs |
| `references` | Array | No | Array of reference objects |
| `references[].name` | String | No | Reference name |
| `references[].relationship` | String | No | Relationship to provider |
| `references[].phone` | String | No | Reference phone |
| `references[].email` | String | No | Reference email |
| `references[].company` | String | No | Reference company |
| `references[].verified` | Boolean | No | Whether reference is verified |
| `portfolio` | Object | No | Portfolio information |
| `portfolio.images` | Array[String] | No | Portfolio image URLs |
| `portfolio.videos` | Array[String] | No | Portfolio video URLs |
| `portfolio.descriptions` | Array[String] | No | Portfolio descriptions |
| `portfolio.beforeAfter` | Array | No | Before/after project images |

### Preferences Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notificationSettings` | Object | No | Notification preferences |
| `notificationSettings.newJobAlerts` | Boolean | No | New job alert notifications |
| `notificationSettings.messageNotifications` | Boolean | No | Message notifications |
| `notificationSettings.paymentNotifications` | Boolean | No | Payment notifications |
| `notificationSettings.reviewNotifications` | Boolean | No | Review notifications |
| `notificationSettings.marketingEmails` | Boolean | No | Marketing email opt-in |
| `jobPreferences` | Object | No | Job preference settings |
| `jobPreferences.preferredJobTypes` | Array[String] | No | Preferred job types |
| `jobPreferences.avoidJobTypes` | Array[String] | No | Job types to avoid |
| `jobPreferences.preferredTimeSlots` | Array[String] | No | Preferred time slots |
| `jobPreferences.maxJobsPerDay` | Number | No | Maximum jobs per day |
| `jobPreferences.advanceBookingDays` | Number | No | Days in advance for booking |
| `communicationPreferences` | Object | No | Communication preferences |
| `communicationPreferences.preferredContactMethod` | String | No | `phone`, `email`, `sms`, `app` |
| `communicationPreferences.responseTimeExpectation` | Number | No | Expected response time in minutes |
| `communicationPreferences.autoAcceptJobs` | Boolean | No | Auto-accept jobs setting |

### FinancialInfo Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bankAccount` | Object | No | Bank account information |
| `bankAccount.accountHolder` | String | No | Account holder name |
| `bankAccount.accountNumber` | String | No | Account number (encrypted) |
| `bankAccount.routingNumber` | String | No | Routing number (encrypted) |
| `bankAccount.bankName` | String | No | Bank name |
| `bankAccount.accountType` | String | No | `checking` or `savings` |
| `taxInfo` | Object | No | Tax information |
| `taxInfo.ssn` | String | No | SSN (encrypted) |
| `taxInfo.ein` | String | No | EIN (encrypted) |
| `taxInfo.taxClassification` | String | No | Tax classification |
| `taxInfo.w9Submitted` | Boolean | No | W9 form submission status |
| `paymentMethods` | Array | No | Payment method objects |
| `paymentMethods[].type` | String | No | `bank_transfer`, `paypal`, `paymaya`, `check` |
| `paymentMethods[].details` | Object | No | Payment method details |
| `paymentMethods[].isDefault` | Boolean | No | Whether this is the default method |
| `commissionRate` | Number | No | Commission rate (0-1) |
| `minimumPayout` | Number | No | Minimum payout amount |

### Settings Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileVisibility` | String | No | `public`, `private`, `verified_only` |
| `showContactInfo` | Boolean | No | Show contact information |
| `showPricing` | Boolean | No | Show pricing information |
| `showReviews` | Boolean | No | Show reviews |
| `allowDirectBooking` | Boolean | No | Allow direct booking |
| `requireApproval` | Boolean | No | Require approval for bookings |

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lastActive` | Date | No | Last active timestamp |
| `profileViews` | Number | No | Total profile views |
| `searchRanking` | Number | No | Search ranking score |
| `featured` | Boolean | No | Featured provider flag |
| `promoted` | Boolean | No | Promoted provider flag |
| `tags` | Array[String] | No | Provider tags |
| `notes` | String | No | Admin notes |

---

## Error Responses

### 400 Bad Request (Validation Error)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Provider type must be individual, business, or agency",
      "param": "providerType",
      "location": "body"
    },
    {
      "msg": "At least one specialty is required",
      "param": "professionalInfo.specialties",
      "location": "body"
    }
  ]
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Provider profile not found",
  "hint": "This user has not completed provider registration. They need to create a provider profile first."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create provider profile"
}
```

