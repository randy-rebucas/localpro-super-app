# Complete User Management API Endpoints

Complete documentation of all user management endpoints with full request/response payloads.

**Base Path:** `/api/users`

**Authentication:** All endpoints require authentication via:
- Bearer token: `Authorization: Bearer <jwt_token>`
- API key: `X-API-Key` and `X-API-Secret` headers
- Access token: `Authorization: Bearer <access_token>`

---

## Table of Contents

1. [Get All Users](#1-get-all-users)
2. [Get User Statistics](#2-get-user-statistics)
3. [Get User by ID](#3-get-user-by-id)
4. [Create User](#4-create-user)
5. [Update User](#5-update-user)
6. [Update User Status](#6-update-user-status)
7. [Update User Verification](#7-update-user-verification)
8. [Add User Badge](#8-add-user-badge)
9. [Bulk Update Users](#9-bulk-update-users)
10. [Delete User](#10-delete-user)
11. [Restore User](#11-restore-user)
12. [Ban User](#12-ban-user)
13. [Get User Roles](#13-get-user-roles)
14. [Update User Roles](#14-update-user-roles)
15. [Get User Badges](#15-get-user-badges)
16. [Delete User Badge](#16-delete-user-badge)
17. [Reset User Password](#17-reset-user-password)
18. [Send Email to User](#18-send-email-to-user)
19. [Export User Data](#19-export-user-data)

---

## 1. Get All Users

**Endpoint:** `GET /api/users`  
**Access:** Admin, Agency Admin, Agency Owner

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | Number | Page number | 1 |
| `limit` | Number | Items per page | 10 |
| `role` | String/Array | Filter by role(s) | - |
| `isActive` | Boolean | Filter by active status | - |
| `isVerified` | Boolean | Filter by verified status | - |
| `search` | String | Search in name, email, phone | - |
| `sortBy` | String | Sort field | `createdAt` |
| `sortOrder` | String | `asc` or `desc` | `desc` |
| `includeDeleted` | Boolean | Include soft-deleted users | `false` |

### Request Example

```http
GET /api/users?page=1&limit=20&role=provider&isActive=true&search=john&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

### Response Example

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "roles": ["provider", "client"],
        "isActive": true,
        "isVerified": true,
        "profile": {
          "avatar": {
            "url": "https://example.com/avatar.jpg",
            "publicId": "avatar_123",
            "thumbnail": "https://example.com/avatar_thumb.jpg"
          },
          "bio": "Experienced professional",
          "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA",
            "coordinates": {
              "lat": 40.7128,
              "lng": -74.0060
            }
          },
          "rating": 4.8,
          "totalReviews": 150
        },
        "agency": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "agencyId": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
            "name": "ABC Agency",
            "type": "enterprise"
          },
          "role": "provider",
          "status": "active"
        },
        "referral": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
          "referralCode": "JOHN1234",
          "referredBy": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@example.com"
          }
        },
        "provider": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
          "userId": "64a1b2c3d4e5f6789012345",
          "professionalInfo": {
            "specialties": [
              {
                "name": "Cleaning",
                "skills": [
                  {
                    "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
                    "name": "Deep Cleaning",
                    "description": "Professional deep cleaning services"
                  }
                ]
              }
            ]
          }
        },
        "lastLoginAt": "2024-01-15T10:30:00.000Z",
        "lastLoginDisplay": "2024-01-15T10:30:00.000Z",
        "status": "active",
        "statusReason": null,
        "statusUpdatedAt": "2024-01-01T00:00:00.000Z",
        "statusUpdatedBy": "60f7b3b3b3b3b3b3b3b3b3b9",
        "isDeleted": false,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 100,
      "limit": 20
    }
  }
}
```

---

## 2. Get User Statistics

**Endpoint:** `GET /api/users/stats`  
**Access:** Admin, Agency Admin, Agency Owner

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `agencyId` | String | Filter by agency (non-admin only) |

### Request Example

```http
GET /api/users/stats?agencyId=60f7b3b3b3b3b3b3b3b3b3b4
Authorization: Bearer <token>
```

### Response Example

```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeUsers": 850,
    "verifiedUsers": 750,
    "usersByRole": [
      { "_id": "client", "count": 600 },
      { "_id": "provider", "count": 300 },
      { "_id": "admin", "count": 10 }
    ],
    "recentUsers": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "topRatedUsers": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "rating": 4.9,
          "totalReviews": 200
        }
      }
    ]
  }
}
```

---

## 3. Get User by ID

**Endpoint:** `GET /api/users/:id`  
**Access:** Admin, Agency Admin, Agency Owner, Provider, Client (own profile)

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `includeDeleted` | Boolean | Include soft-deleted users | `false` |

### Request Example

```http
GET /api/users/64a1b2c3d4e5f6789012345?includeDeleted=false
Authorization: Bearer <token>
```

### Response Example

```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "gender": "male",
    "birthdate": "1990-01-15T00:00:00.000Z",
    "roles": ["provider", "client"],
    "isVerified": true,
    "isActive": true,
    "profile": {
      "avatar": {
        "url": "https://example.com/avatar.jpg",
        "publicId": "avatar_123",
        "thumbnail": "https://example.com/avatar_thumb.jpg"
      },
      "bio": "Experienced professional with 10+ years",
      "address": {
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
      "skills": ["cleaning", "maintenance", "repair"],
      "experience": 10,
      "rating": 4.8,
      "totalReviews": 150,
      "businessName": "John's Professional Services",
      "businessType": "individual",
      "yearsInBusiness": 5,
      "serviceAreas": ["New York", "Brooklyn"],
      "specialties": ["residential", "commercial"],
      "certifications": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b10",
          "name": "Certified Professional Cleaner",
          "issuer": "Professional Cleaning Association",
          "issueDate": "2020-01-15T00:00:00.000Z",
          "expiryDate": "2025-01-15T00:00:00.000Z",
          "document": {
            "url": "https://example.com/cert.pdf",
            "publicId": "cert_123",
            "filename": "certification.pdf"
          }
        }
      ],
      "insurance": {
        "hasInsurance": true,
        "provider": "ABC Insurance",
        "policyNumber": "POL-123456",
        "coverageAmount": 1000000,
        "expiryDate": "2025-12-31T00:00:00.000Z",
        "document": {
          "url": "https://example.com/insurance.pdf",
          "publicId": "insurance_123",
          "filename": "insurance.pdf"
        }
      },
      "backgroundCheck": {
        "status": "approved",
        "completedAt": "2023-06-01T00:00:00.000Z",
        "document": {
          "url": "https://example.com/bgcheck.pdf",
          "publicId": "bgcheck_123",
          "filename": "background_check.pdf"
        }
      },
      "portfolio": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b11",
          "title": "Office Cleaning Project",
          "description": "Complete office cleaning",
          "images": [
            {
              "url": "https://example.com/portfolio1.jpg",
              "publicId": "portfolio_1",
              "thumbnail": "https://example.com/portfolio1_thumb.jpg"
            }
          ],
          "category": "cleaning",
          "completedAt": "2023-08-15T00:00:00.000Z"
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
        "timezone": "America/New_York",
        "emergencyService": true
      }
    },
    "localProPlusSubscription": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b12",
      "plan": "premium",
      "status": "active",
      "expiresAt": "2025-01-01T00:00:00.000Z"
    },
    "wallet": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b13",
      "balance": 1000.50,
      "currency": "USD",
      "pendingBalance": 200.00,
      "availableBalance": 800.50
    },
    "trust": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b14",
      "trustScore": 85,
      "verification": {
        "phoneVerified": true,
        "emailVerified": true,
        "identityVerified": true,
        "businessVerified": true,
        "addressVerified": true,
        "bankAccountVerified": false
      },
      "badges": [
        {
          "type": "verified_provider",
          "earnedAt": "2023-06-01T00:00:00.000Z",
          "description": "Verified provider badge"
        }
      ],
      "completionRate": 95,
      "cancellationRate": 2
    },
    "referral": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b15",
      "referralCode": "JOHN1234",
      "referredBy": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "phoneNumber": "+1987654321"
      },
      "referralStats": {
        "totalReferrals": 10,
        "successfulReferrals": 8,
        "totalRewardsEarned": 500,
        "totalRewardsPaid": 400
      }
    },
    "settings": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b16",
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      },
      "language": "en"
    },
    "management": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b17",
      "status": "active",
      "lastLoginAt": "2024-01-15T10:30:00.000Z",
      "deletedAt": null
    },
    "activity": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b18",
      "lastActiveAt": "2024-01-15T10:30:00.000Z",
      "totalSessions": 150,
      "averageSessionDuration": 30
    },
    "agency": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b19",
      "agencyId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "ABC Agency",
        "type": "enterprise",
        "contact": {
          "address": "123 Agency St"
        },
        "description": "Leading service agency"
      },
      "role": "provider",
      "status": "active",
      "joinedAt": "2023-01-01T00:00:00.000Z"
    },
    "provider": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
      "userId": "64a1b2c3d4e5f6789012345",
      "professionalInfo": {
        "specialties": [
          {
            "name": "Cleaning",
            "skills": [
              {
                "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
                "name": "Deep Cleaning",
                "description": "Professional deep cleaning",
                "category": "cleaning",
                "metadata": {}
              }
            ]
          }
        ]
      },
      "businessInfo": {},
      "verification": {},
      "preferences": {},
      "performance": {}
    },
    "apiKeys": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
        "name": "My API Key",
        "description": "API key for integration",
        "accessKey": "lp_abc123def456",
        "isActive": true,
        "expiresAt": "2025-12-31T23:59:59.000Z",
        "rateLimit": 1000,
        "scopes": ["read", "write"],
        "lastUsedAt": "2024-01-15T09:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "accessTokens": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b21",
        "apiKeyId": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
          "name": "My API Key",
          "description": "API key for integration",
          "scopes": ["read", "write"]
        },
        "scopes": ["read", "write"],
        "isActive": true,
        "expiresAt": "2024-02-01T00:00:00.000Z",
        "lastUsedAt": "2024-01-15T09:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "lastLoginDisplay": "2024-01-15T10:30:00.000Z",
    "status": "active",
    "statusReason": null,
    "statusUpdatedAt": "2024-01-01T00:00:00.000Z",
    "statusUpdatedBy": "60f7b3b3b3b3b3b3b3b3b3b9",
    "isDeleted": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 4. Create User

**Endpoint:** `POST /api/users`  
**Access:** Admin

### Request Body

```json
{
  "phoneNumber": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "gender": "male",
  "birthdate": "1990-01-15T00:00:00.000Z",
  "roles": ["client"],
  "isVerified": false,
  "isActive": true,
  "profile": {
    "bio": "New user profile",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
}
```

### Request Example

```http
POST /api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

### Response Example

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "phoneNumber": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "roles": ["client"],
    "isVerified": false,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

## 5. Update User

**Endpoint:** `PUT /api/users/:id`  
**Access:** Admin, Agency Admin, Agency Owner, Provider, Client (own profile)

### Request Body (Full Example)

See `PUT_USER_PAYLOAD_EXAMPLE.md` for complete payload documentation.

### Minimal Update Example

```json
{
  "firstName": "Jane",
  "profile": {
    "bio": "Updated bio"
  }
}
```

### Request Example

```http
PUT /api/users/64a1b2c3d4e5f6789012345
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "profile": {
    "bio": "Updated bio",
    "address": {
      "city": "Los Angeles",
      "state": "CA"
    }
  }
}
```

### Response Example

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "profile": {
      "bio": "Updated bio",
      "address": {
        "city": "Los Angeles",
        "state": "CA"
      }
    },
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 6. Update User Status

**Endpoint:** `PATCH /api/users/:id/status`  
**Access:** Admin, Agency Admin

### Request Body

```json
{
  "isActive": true,
  "reason": "Account reactivated after review"
}
```

### Request Example

```http
PATCH /api/users/64a1b2c3d4e5f6789012345/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": false,
  "reason": "Account suspended due to policy violation"
}
```

### Response Example

```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "isActive": false
  }
}
```

---

## 7. Update User Verification

**Endpoint:** `PATCH /api/users/:id/verification`  
**Access:** Admin, Agency Admin

### Request Body

```json
{
  "verification": {
    "phoneVerified": true,
    "emailVerified": true,
    "identityVerified": true,
    "businessVerified": true,
    "addressVerified": true,
    "bankAccountVerified": false
  }
}
```

### Request Example

```http
PATCH /api/users/64a1b2c3d4e5f6789012345/verification
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "verification": {
    "phoneVerified": true,
    "emailVerified": true,
    "identityVerified": true
  }
}
```

### Response Example

```json
{
  "success": true,
  "message": "User verification updated successfully",
  "data": {
    "verification": {
      "phoneVerified": true,
      "emailVerified": true,
      "identityVerified": true,
      "businessVerified": false,
      "addressVerified": false,
      "bankAccountVerified": false
    },
    "isVerified": true,
    "trustScore": 45
  }
}
```

---

## 8. Add User Badge

**Endpoint:** `POST /api/users/:id/badges`  
**Access:** Admin, Agency Admin

### Request Body

```json
{
  "type": "top_rated",
  "description": "Top rated provider with excellent reviews"
}
```

### Valid Badge Types

- `verified_provider`
- `top_rated`
- `fast_response`
- `reliable`
- `expert`
- `newcomer`
- `trusted`

### Request Example

```http
POST /api/users/64a1b2c3d4e5f6789012345/badges
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "top_rated",
  "description": "Consistently receives 5-star ratings"
}
```

### Response Example

```json
{
  "success": true,
  "message": "Badge added successfully",
  "data": {
    "badges": [
      {
        "type": "top_rated",
        "earnedAt": "2024-01-15T10:30:00.000Z",
        "description": "Consistently receives 5-star ratings"
      }
    ],
    "trustScore": 90
  }
}
```

---

## 9. Bulk Update Users

**Endpoint:** `PATCH /api/users/bulk`  
**Access:** Admin

### Request Body

```json
{
  "userIds": [
    "64a1b2c3d4e5f6789012345",
    "64a1b2c3d4e5f6789012346",
    "64a1b2c3d4e5f6789012347"
  ],
  "updateData": {
    "isActive": true,
    "isVerified": true
  }
}
```

### Request Example

```http
PATCH /api/users/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userIds": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"],
  "updateData": {
    "isActive": false
  }
}
```

### Response Example

```json
{
  "success": true,
  "message": "Updated 2 users successfully",
  "data": {
    "matchedCount": 2,
    "modifiedCount": 2
  }
}
```

---

## 10. Delete User

**Endpoint:** `DELETE /api/users/:id`  
**Access:** Admin

### Request Example

```http
DELETE /api/users/64a1b2c3d4e5f6789012345
Authorization: Bearer <admin_token>
```

### Response Example

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Note:** This is a soft delete. Use the restore endpoint to restore the user.

---

## 11. Restore User

**Endpoint:** `PATCH /api/users/:id/restore`  
**Access:** Admin

### Request Example

```http
PATCH /api/users/64a1b2c3d4e5f6789012345/restore
Authorization: Bearer <admin_token>
```

### Response Example

```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true
  }
}
```

---

## 12. Ban User

**Endpoint:** `POST /api/users/:id/ban`  
**Access:** Admin

### Request Body

```json
{
  "reason": "Violation of terms of service"
}
```

### Request Example

```http
POST /api/users/64a1b2c3d4e5f6789012345/ban
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Repeated policy violations"
}
```

### Response Example

```json
{
  "success": true,
  "message": "User banned successfully",
  "data": {
    "isActive": false,
    "status": "banned"
  }
}
```

---

## 13. Get User Roles

**Endpoint:** `GET /api/users/:id/roles`  
**Access:** Admin, Agency Admin, Agency Owner

### Request Example

```http
GET /api/users/64a1b2c3d4e5f6789012345/roles
Authorization: Bearer <token>
```

### Response Example

```json
{
  "success": true,
  "data": {
    "userId": "64a1b2c3d4e5f6789012345",
    "roles": ["client", "provider"]
  }
}
```

---

## 14. Update User Roles

**Endpoint:** `PUT /api/users/:id/roles`  
**Access:** Admin

### Request Body

```json
{
  "roles": ["client", "provider", "supplier"]
}
```

### Valid Roles

- `client`
- `provider`
- `admin`
- `supplier`
- `instructor`
- `agency_owner`
- `agency_admin`
- `partner`
- `staff`

### Request Example

```http
PUT /api/users/64a1b2c3d4e5f6789012345/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roles": ["provider", "supplier"]
}
```

### Response Example

```json
{
  "success": true,
  "message": "User roles updated successfully",
  "data": {
    "userId": "64a1b2c3d4e5f6789012345",
    "roles": ["provider", "supplier"]
  }
}
```

---

## 15. Get User Badges

**Endpoint:** `GET /api/users/:id/badges`  
**Access:** Admin, Agency Admin, Agency Owner

### Request Example

```http
GET /api/users/64a1b2c3d4e5f6789012345/badges
Authorization: Bearer <token>
```

### Response Example

```json
{
  "success": true,
  "data": {
    "userId": "64a1b2c3d4e5f6789012345",
    "badges": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b22",
        "type": "top_rated",
        "earnedAt": "2024-01-01T00:00:00.000Z",
        "description": "Top rated provider"
      },
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b23",
        "type": "verified_provider",
        "earnedAt": "2023-06-01T00:00:00.000Z",
        "description": "Verified provider badge"
      }
    ]
  }
}
```

---

## 16. Delete User Badge

**Endpoint:** `DELETE /api/users/:id/badges/:badgeId`  
**Access:** Admin, Agency Admin

### Request Example

```http
DELETE /api/users/64a1b2c3d4e5f6789012345/badges/60f7b3b3b3b3b3b3b3b3b3b22
Authorization: Bearer <admin_token>
```

### Response Example

```json
{
  "success": true,
  "message": "Badge removed successfully",
  "data": {
    "userId": "64a1b2c3d4e5f6789012345",
    "badges": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b23",
        "type": "verified_provider",
        "earnedAt": "2023-06-01T00:00:00.000Z",
        "description": "Verified provider badge"
      }
    ]
  }
}
```

---

## 17. Reset User Password

**Endpoint:** `POST /api/users/:id/reset-password`  
**Access:** Admin

### Request Body

```json
{
  "sendEmail": true
}
```

### Request Example

```http
POST /api/users/64a1b2c3d4e5f6789012345/reset-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "sendEmail": false
}
```

### Response Example (sendEmail: false)

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "temporaryPassword": "TempPass123",
    "email": "john.doe@example.com",
    "warning": "Please send this password to the user securely"
  }
}
```

### Response Example (sendEmail: true)

```json
{
  "success": true,
  "message": "Password reset successfully. Email sent to user."
}
```

---

## 18. Send Email to User

**Endpoint:** `POST /api/users/:id/send-email`  
**Access:** Admin, Agency Admin, Agency Owner

### Request Body (Plain Email)

```json
{
  "subject": "Important Notice",
  "message": "<p>This is a custom email message.</p>"
}
```

### Request Body (Templated Email)

```json
{
  "subject": "Welcome Email",
  "template": "welcome",
  "templateData": {
    "firstName": "John",
    "customField": "value"
  }
}
```

### Request Example

```http
POST /api/users/64a1b2c3d4e5f6789012345/send-email
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subject": "Account Update",
  "message": "<h1>Hello John</h1><p>Your account has been updated.</p>"
}
```

### Response Example

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "recipient": "john.doe@example.com",
    "subject": "Account Update"
  }
}
```

---

## 19. Export User Data

**Endpoint:** `GET /api/users/:id/export`  
**Access:** Admin

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `format` | String | Export format: `json` or `csv` | `json` |

### Request Example

```http
GET /api/users/64a1b2c3d4e5f6789012345/export?format=json
Authorization: Bearer <admin_token>
```

### Response Example (JSON)

The response is a downloadable JSON file containing:

```json
{
  "user": {
    "_id": "64a1b2c3d4e5f6789012345",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "roles": ["provider", "client"],
    "profile": { /* full profile data */ }
  },
  "provider": { /* provider data if applicable */ },
  "management": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b17",
    "status": "active",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  },
  "recentActivities": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b24",
      "action": "login",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "wallet": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b13",
    "balance": 1000.50,
    "currency": "USD"
  },
  "exportedAt": "2024-01-15T11:00:00.000Z",
  "exportedBy": "60f7b3b3b3b3b3b3b3b3b3b9"
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation error message",
  "code": "ERROR_CODE"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Server error",
  "error": "Detailed error (development only)"
}
```

---

## Common Error Codes

- `PHONE_NUMBER_ALREADY_EXISTS` - Phone number is already registered
- `INVALID_PHONE_FORMAT` - Invalid phone number format
- `USER_NOT_FOUND` - User doesn't exist
- `ACCESS_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error

---

## Notes

1. **Partial Updates**: Most update endpoints support partial updates. Only send fields you want to change.

2. **Profile Deep Merge**: The `profile` object in update requests is deep-merged, so you can update nested fields without affecting others.

3. **Phone Number Format**: Must be in international format: `+[country code][number]` (e.g., `+1234567890`)

4. **Date Formats**: All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

5. **Soft Delete**: The delete endpoint performs a soft delete. Users can be restored using the restore endpoint.

6. **Populated References**: The `GET /api/users/:id` endpoint returns all populated references including:
   - `localProPlusSubscription`
   - `wallet`
   - `trust`
   - `referral` (with nested `referredBy`)
   - `settings`
   - `management`
   - `activity`
   - `agency` (with nested `agencyId`)
   - `provider` (if user has provider role)
   - `apiKeys` (all API keys for the user)
   - `accessTokens` (recent access tokens)

---

**Last Updated:** 2024-01-15  
**All endpoints are implemented and ready for use.**

