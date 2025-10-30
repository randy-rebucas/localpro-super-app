# Users API Endpoints

## Overview

The Users API provides comprehensive endpoints for user management, authentication, and profile operations. The API supports both public endpoints for registration/authentication and protected endpoints for user management operations.

## Base URLs

```
/api/auth          # Authentication and profile endpoints
/api/users         # User management endpoints (Admin/Agency)
```

## Authentication

Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Admin-only endpoints require admin role in addition to authentication.

## Authentication Endpoints

### Send Verification Code

Send SMS verification code to phone number for registration or login.

```http
POST /api/auth/send-code
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "phoneNumber": "+1234567890",
    "isNewUser": false,
    "expiresIn": 300
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Invalid phone number format. Please use international format (e.g., +1234567890)",
  "code": "INVALID_PHONE_FORMAT"
}
```

### Verify Code and Register/Login

Verify SMS code and complete registration or login.

```http
POST /api/auth/verify-code
Content-Type: application/json
```

**Request Body:**
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
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "phoneNumber": "+1234567890",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "client",
      "isVerified": true,
      "profile": {
        "avatar": {
          "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
          "publicId": "avatar_1234567890",
          "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
        },
        "bio": "Professional service provider",
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
        "skills": ["cleaning", "maintenance"],
        "experience": 5,
        "rating": 4.8,
        "totalReviews": 150,
        "businessName": "John's Services",
        "businessType": "individual",
        "yearsInBusiness": 5,
        "serviceAreas": ["New York", "Brooklyn"],
        "specialties": ["residential_cleaning", "office_maintenance"],
        "certifications": [
          {
            "name": "Certified Professional Cleaner",
            "issuer": "Cleaning Institute",
            "issueDate": "2023-01-15T00:00:00.000Z",
            "expiryDate": "2025-01-15T00:00:00.000Z",
            "document": {
              "url": "https://res.cloudinary.com/example/document/upload/v1234567890/cert.pdf",
              "publicId": "cert_1234567890",
              "filename": "certification.pdf"
            }
          }
        ],
        "insurance": {
          "hasInsurance": true,
          "provider": "ABC Insurance",
          "policyNumber": "POL123456789",
          "coverageAmount": 1000000,
          "expiryDate": "2024-12-31T00:00:00.000Z",
          "document": {
            "url": "https://res.cloudinary.com/example/document/upload/v1234567890/insurance.pdf",
            "publicId": "insurance_1234567890",
            "filename": "insurance.pdf"
          }
        },
        "backgroundCheck": {
          "status": "approved",
          "completedAt": "2023-06-15T00:00:00.000Z",
          "document": {
            "url": "https://res.cloudinary.com/example/document/upload/v1234567890/bg_check.pdf",
            "publicId": "bg_check_1234567890",
            "filename": "background_check.pdf"
          }
        },
        "portfolio": [
          {
            "title": "Office Building Cleaning",
            "description": "Complete cleaning of 50-story office building",
            "images": [
              {
                "url": "https://res.cloudinary.com/example/image/upload/v1234567890/portfolio1.jpg",
                "publicId": "portfolio1_1234567890",
                "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/portfolio1.jpg"
              }
            ],
            "category": "commercial_cleaning",
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
            },
            {
              "day": "tuesday",
              "startTime": "09:00",
              "endTime": "17:00",
              "isAvailable": true
            }
          ],
          "timezone": "America/New_York",
          "emergencyService": true
        }
      },
      "preferences": {
        "notifications": {
          "sms": true,
          "email": true,
          "push": true
        },
        "language": "en"
      },
      "wallet": {
        "balance": 0,
        "currency": "USD"
      },
      "agency": {
        "agencyId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "role": "provider",
        "joinedAt": "2023-07-20T10:30:00.000Z",
        "status": "active",
        "commissionRate": 10
      },
      "isActive": true,
      "trustScore": 85,
      "verification": {
        "phoneVerified": true,
        "emailVerified": true,
        "identityVerified": true,
        "businessVerified": true,
        "addressVerified": true,
        "bankAccountVerified": false,
        "verifiedAt": "2023-07-20T10:30:00.000Z"
      },
      "badges": [
        {
          "type": "verified_provider",
          "earnedAt": "2023-07-20T10:30:00.000Z",
          "description": "Verified service provider"
        },
        {
          "type": "top_rated",
          "earnedAt": "2023-08-15T10:30:00.000Z",
          "description": "Top rated provider"
        }
      ],
      "responseTime": {
        "average": 15,
        "totalResponses": 50
      },
      "completionRate": 98,
      "cancellationRate": 2,
      "referral": {
        "referralCode": "JD123456",
        "referredBy": null,
        "referralSource": null,
        "referralStats": {
          "totalReferrals": 5,
          "successfulReferrals": 3,
          "totalRewardsEarned": 150,
          "totalRewardsPaid": 100,
          "lastReferralAt": "2023-09-15T10:30:00.000Z",
          "referralTier": "silver"
        },
        "referralPreferences": {
          "autoShare": true,
          "shareOnSocial": false,
          "emailNotifications": true,
          "smsNotifications": false
        }
      },
      "lastLoginAt": "2023-09-20T10:30:00.000Z",
      "lastLoginIP": "192.168.1.1",
      "loginCount": 25,
      "status": "active",
      "activity": {
        "lastActiveAt": "2023-09-20T10:30:00.000Z",
        "totalSessions": 25,
        "averageSessionDuration": 45,
        "preferredLoginTime": "morning",
        "deviceInfo": [
          {
            "deviceType": "mobile",
            "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
            "lastUsed": "2023-09-20T10:30:00.000Z"
          }
        ]
      },
      "createdAt": "2023-07-20T10:30:00.000Z",
      "updatedAt": "2023-09-20T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": false,
    "onboardingComplete": true
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Invalid verification code",
  "code": "INVALID_VERIFICATION_CODE"
}
```

### Complete Onboarding

Complete user onboarding process with profile information.

```http
POST /api/auth/complete-onboarding
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "profile": {
    "bio": "Professional service provider with 5 years of experience",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "skills": ["cleaning", "maintenance", "repair"],
    "experience": 5,
    "businessName": "John's Services",
    "businessType": "individual",
    "yearsInBusiness": 5,
    "serviceAreas": ["New York", "Brooklyn", "Queens"],
    "specialties": ["residential_cleaning", "office_maintenance"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user": {
      // Updated user object
    },
    "onboardingComplete": true
  }
}
```

### Get Profile Completeness

Check if user has completed onboarding.

```http
GET /api/auth/profile-completeness
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isComplete": true,
    "completeness": 100,
    "missingFields": [],
    "nextSteps": []
  }
}
```

### Get Current User

Get current user profile information.

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Complete user object as shown in verify-code response
  }
}
```

### Update User Profile

Update user profile information.

```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "profile": {
    "bio": "Updated bio information",
    "skills": ["cleaning", "maintenance", "repair", "painting"],
    "businessName": "John's Professional Services",
    "serviceAreas": ["New York", "Brooklyn", "Queens", "Manhattan"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated user object
  }
}
```

### Upload Avatar

Upload user profile avatar.

```http
POST /api/auth/upload-avatar
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
avatar: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
      "publicId": "avatar_1234567890",
      "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
    }
  }
}
```

### Upload Portfolio Images

Upload portfolio images for user profile.

```http
POST /api/auth/upload-portfolio
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
images: <file1>
images: <file2>
images: <file3>
```

**Response:**
```json
{
  "success": true,
  "message": "Portfolio images uploaded successfully",
  "data": {
    "portfolio": [
      {
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/portfolio1.jpg",
        "publicId": "portfolio1_1234567890",
        "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/portfolio1.jpg"
      },
      {
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/portfolio2.jpg",
        "publicId": "portfolio2_1234567890",
        "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/portfolio2.jpg"
      }
    ]
  }
}
```

### Logout User

Logout user and invalidate token.

```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Management Endpoints (Admin/Agency)

### Get All Users

Retrieve paginated list of users with filtering and sorting options.

```http
GET /api/users
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `role` (string, optional): Filter by user role
- `isActive` (boolean, optional): Filter by active status
- `isVerified` (boolean, optional): Filter by verification status
- `search` (string, optional): Search in name, email, phone, or business name
- `sortBy` (string, optional): Sort field (default: 'createdAt')
- `sortOrder` (string, optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "phoneNumber": "+1234567890",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "provider",
        "isVerified": true,
        "isActive": true,
        "trustScore": 85,
        "profile": {
          "businessName": "John's Services",
          "rating": 4.8,
          "totalReviews": 150
        },
        "agency": {
          "agencyId": "60f7b3b3b3b3b3b3b3b3b3b4",
          "role": "provider",
          "status": "active"
        },
        "createdAt": "2023-07-20T10:30:00.000Z",
        "updatedAt": "2023-09-20T10:30:00.000Z"
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

### Get User by ID

Retrieve specific user by ID.

```http
GET /api/users/:id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Complete user object
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "User not found"
}
```

### Create User (Admin Only)

Create new user (Admin only).

```http
POST /api/users
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "provider",
  "agencyId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "agencyRole": "provider"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    // Created user object
  }
}
```

### Update User

Update user information.

```http
PUT /api/users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "profile": {
    "bio": "Updated bio information",
    "skills": ["cleaning", "maintenance", "repair"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    // Updated user object
  }
}
```

### Update User Status

Activate or deactivate user.

```http
PATCH /api/users/:id/status
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isActive": true,
  "reason": "User account reactivated"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "isActive": true
  }
}
```

### Update User Verification

Update user verification status.

```http
PATCH /api/users/:id/verification
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "message": "User verification updated successfully",
  "data": {
    "verification": {
      "phoneVerified": true,
      "emailVerified": true,
      "identityVerified": true,
      "businessVerified": true,
      "addressVerified": true,
      "bankAccountVerified": false
    },
    "isVerified": true,
    "trustScore": 85
  }
}
```

### Add Badge to User

Add achievement badge to user.

```http
POST /api/users/:id/badges
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "top_rated",
  "description": "Top rated provider with excellent reviews"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Badge added successfully",
  "data": {
    "badges": [
      {
        "type": "top_rated",
        "earnedAt": "2023-09-20T10:30:00.000Z",
        "description": "Top rated provider with excellent reviews"
      }
    ],
    "trustScore": 90
  }
}
```

### Get User Statistics

Get user statistics and analytics.

```http
GET /api/users/stats
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `agencyId` (string, optional): Filter by agency ID

**Response:**
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
      { "_id": "supplier", "count": 50 },
      { "_id": "instructor", "count": 30 },
      { "_id": "admin", "count": 10 },
      { "_id": "agency_owner", "count": 5 },
      { "_id": "agency_admin", "count": 5 }
    ],
    "recentUsers": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "createdAt": "2023-09-20T10:30:00.000Z"
      }
    ],
    "topRatedUsers": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
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

### Bulk Update Users (Admin Only)

Update multiple users at once.

```http
PATCH /api/users/bulk
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userIds": [
    "60f7b3b3b3b3b3b3b3b3b3b3",
    "60f7b3b3b3b3b3b3b3b3b3b4",
    "60f7b3b3b3b3b3b3b3b3b3b5"
  ],
  "updateData": {
    "isActive": true,
    "status": "active"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Updated 3 users successfully",
  "data": {
    "matchedCount": 3,
    "modifiedCount": 3
  }
}
```

### Delete User (Admin Only)

Soft delete user (Admin only).

```http
DELETE /api/users/:id
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Phone number is required",
  "code": "MISSING_PHONE_NUMBER"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "User with this phone number or email already exists"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "message": "Too many verification attempts. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

## Rate Limiting

- **Send Verification Code**: 5 requests per minute per phone number
- **Verify Code**: 10 requests per minute per phone number
- **Profile Updates**: 20 requests per hour per user
- **User Management**: 100 requests per hour per admin

## Validation Rules

### Phone Number Validation
- Must be in international format (e.g., +1234567890)
- Must be unique across all users
- Must be between 10-15 digits

### Email Validation
- Must be valid email format
- Must be unique when provided
- Must be lowercase

### Profile Validation
- Business name required for business users
- Skills must be array of strings
- Service areas must be array of strings
- Rating must be between 0-5
- Trust score must be between 0-100

### Role Validation
- Must be one of the defined user roles
- Admin can assign any role
- Agency users can only assign roles within their agency

## Examples

### Complete User Registration Flow

```javascript
// 1. Send verification code
const sendCodeResponse = await fetch('/api/auth/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+1234567890' })
});

// 2. Verify code and register
const verifyResponse = await fetch('/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    phoneNumber: '+1234567890',
    code: '123456'
  })
});

const { data } = await verifyResponse.json();
const { user, token } = data;

// 3. Complete onboarding
const onboardingResponse = await fetch('/api/auth/complete-onboarding', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profile: {
      bio: 'Professional service provider',
      skills: ['cleaning', 'maintenance'],
      businessName: 'John\'s Services'
    }
  })
});
```

### User Profile Update

```javascript
const updateProfile = async (profileData) => {
  const response = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  
  return await response.json();
};

// Example usage
const result = await updateProfile({
  profile: {
    bio: 'Updated bio information',
    skills: ['cleaning', 'maintenance', 'repair'],
    businessName: 'John\'s Professional Services'
  }
});
```

### Admin User Management

```javascript
const getUsers = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/users?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return await response.json();
};

// Example usage
const users = await getUsers({
  role: 'provider',
  isActive: true,
  search: 'John',
  page: 1,
  limit: 10
});
```
