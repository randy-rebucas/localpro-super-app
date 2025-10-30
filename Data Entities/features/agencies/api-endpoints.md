# Agencies API Endpoints

## Overview

The Agencies API provides comprehensive endpoints for managing agencies, providers, administrative controls, and analytics in the LocalPro Super App. All endpoints follow RESTful conventions and return standardized response formats.

## Base URLs

```
/api/agencies          # Agency endpoints
```

## Authentication

Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Admin endpoints require appropriate role permissions.

## Agency Management Endpoints

### Get All Agencies

Retrieve a paginated list of agencies with filtering and search options.

```http
GET /api/agencies
```

**Query Parameters:**
- `search` (string, optional): Search by agency name or description
- `location` (string, optional): Filter by city or location
- `serviceType` (string, optional): Filter by service category
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `sortBy` (string, optional): Sort field (default: 'createdAt')
- `sortOrder` (string, optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Elite Cleaning Services",
      "description": "Professional cleaning services for residential and commercial properties",
      "owner": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
          }
        }
      },
      "providers": [
        {
          "user": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
            "firstName": "Jane",
            "lastName": "Smith",
            "profile": {
              "avatar": {
                "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar2.jpg",
                "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar2.jpg"
              }
            }
          },
          "status": "active",
          "commissionRate": 15,
          "joinedAt": "2023-09-20T08:30:00.000Z",
          "performance": {
            "rating": 4.8,
            "totalJobs": 45,
            "completedJobs": 43,
            "cancellationRate": 4.4
          }
        }
      ],
      "contact": {
        "email": "info@elitecleaning.com",
        "phone": "+1-555-0123",
        "website": "https://elitecleaning.com",
        "address": {
          "street": "123 Business Ave",
          "city": "San Francisco",
          "state": "CA",
          "zipCode": "94102",
          "country": "USA",
          "coordinates": {
            "lat": 37.7749,
            "lng": -122.4194
          }
        }
      },
      "business": {
        "type": "llc",
        "registrationNumber": "LLC123456789",
        "taxId": "12-3456789",
        "licenseNumber": "LIC789012345",
        "insurance": {
          "provider": "State Farm",
          "policyNumber": "SF123456789",
          "coverageAmount": 1000000,
          "expiryDate": "2024-12-31T23:59:59.000Z"
        }
      },
      "serviceAreas": [
        {
          "name": "San Francisco Bay Area",
          "coordinates": {
            "lat": 37.7749,
            "lng": -122.4194
          },
          "radius": 50,
          "zipCodes": ["94102", "94103", "94104"]
        }
      ],
      "services": [
        {
          "category": "cleaning",
          "subcategories": ["residential", "commercial", "deep_cleaning"],
          "pricing": {
            "baseRate": 50,
            "currency": "USD"
          }
        }
      ],
      "subscription": {
        "plan": "professional",
        "startDate": "2023-01-01T00:00:00.000Z",
        "endDate": "2023-12-31T23:59:59.000Z",
        "isActive": true,
        "features": ["analytics", "custom_branding", "priority_support"]
      },
      "verification": {
        "isVerified": true,
        "verifiedAt": "2023-09-15T10:30:00.000Z",
        "documents": [
          {
            "type": "business_license",
            "url": "https://res.cloudinary.com/example/document/upload/v1234567890/license.pdf",
            "publicId": "localpro/agencies/documents/license_1234567890",
            "filename": "business_license.pdf",
            "uploadedAt": "2023-09-15T10:00:00.000Z"
          }
        ]
      },
      "analytics": {
        "totalBookings": 150,
        "totalRevenue": 7500,
        "averageRating": 4.7,
        "totalReviews": 45,
        "monthlyStats": [
          {
            "month": "September",
            "year": 2023,
            "bookings": 25,
            "revenue": 1250,
            "newProviders": 2
          }
        ]
      },
      "settings": {
        "autoApproveProviders": false,
        "requireProviderVerification": true,
        "defaultCommissionRate": 10,
        "notificationPreferences": {
          "email": {
            "newBookings": true,
            "providerUpdates": true,
            "paymentUpdates": true
          },
          "sms": {
            "newBookings": false,
            "urgentUpdates": true
          }
        }
      },
      "isActive": true,
      "createdAt": "2023-09-01T08:00:00.000Z",
      "updatedAt": "2023-09-20T10:30:00.000Z"
    }
  ]
}
```

### Get Single Agency

Retrieve detailed information about a specific agency.

```http
GET /api/agencies/:id
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Elite Cleaning Services",
    "description": "Professional cleaning services for residential and commercial properties",
    "owner": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": {
          "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
          "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
        },
        "bio": "Experienced business owner with 10+ years in the cleaning industry"
      }
    },
    "admins": [
      {
        "user": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
          "firstName": "Mike",
          "lastName": "Johnson",
          "profile": {
            "avatar": {
              "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar3.jpg",
              "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar3.jpg"
            }
          }
        },
        "role": "manager",
        "addedAt": "2023-09-10T14:30:00.000Z",
        "permissions": ["manage_providers", "view_analytics"]
      }
    ],
    "providers": [
      {
        "user": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
          "firstName": "Jane",
          "lastName": "Smith",
          "profile": {
            "avatar": {
              "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar2.jpg",
              "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar2.jpg"
            },
            "rating": 4.8,
            "skills": ["cleaning", "organization", "customer_service"]
          }
        },
        "status": "active",
        "commissionRate": 15,
        "joinedAt": "2023-09-20T08:30:00.000Z",
        "performance": {
          "rating": 4.8,
          "totalJobs": 45,
          "completedJobs": 43,
          "cancellationRate": 4.4
        }
      }
    ],
    "contact": {
      "email": "info@elitecleaning.com",
      "phone": "+1-555-0123",
      "website": "https://elitecleaning.com",
      "address": {
        "street": "123 Business Ave",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102",
        "country": "USA",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      }
    },
    "business": {
      "type": "llc",
      "registrationNumber": "LLC123456789",
      "taxId": "12-3456789",
      "licenseNumber": "LIC789012345",
      "insurance": {
        "provider": "State Farm",
        "policyNumber": "SF123456789",
        "coverageAmount": 1000000,
        "expiryDate": "2024-12-31T23:59:59.000Z"
      }
    },
    "serviceAreas": [
      {
        "name": "San Francisco Bay Area",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        },
        "radius": 50,
        "zipCodes": ["94102", "94103", "94104"]
      }
    ],
    "services": [
      {
        "category": "cleaning",
        "subcategories": ["residential", "commercial", "deep_cleaning"],
        "pricing": {
          "baseRate": 50,
          "currency": "USD"
        }
      }
    ],
    "subscription": {
      "plan": "professional",
      "startDate": "2023-01-01T00:00:00.000Z",
      "endDate": "2023-12-31T23:59:59.000Z",
      "isActive": true,
      "features": ["analytics", "custom_branding", "priority_support"]
    },
    "verification": {
      "isVerified": true,
      "verifiedAt": "2023-09-15T10:30:00.000Z",
      "documents": [
        {
          "type": "business_license",
          "url": "https://res.cloudinary.com/example/document/upload/v1234567890/license.pdf",
          "publicId": "localpro/agencies/documents/license_1234567890",
          "filename": "business_license.pdf",
          "uploadedAt": "2023-09-15T10:00:00.000Z"
        }
      ]
    },
    "analytics": {
      "totalBookings": 150,
      "totalRevenue": 7500,
      "averageRating": 4.7,
      "totalReviews": 45,
      "monthlyStats": [
        {
          "month": "September",
          "year": 2023,
          "bookings": 25,
          "revenue": 1250,
          "newProviders": 2
        }
      ]
    },
    "settings": {
      "autoApproveProviders": false,
      "requireProviderVerification": true,
      "defaultCommissionRate": 10,
      "notificationPreferences": {
        "email": {
          "newBookings": true,
          "providerUpdates": true,
          "paymentUpdates": true
        },
        "sms": {
          "newBookings": false,
          "urgentUpdates": true
        }
      }
    },
    "isActive": true,
    "createdAt": "2023-09-01T08:00:00.000Z",
    "updatedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### Create Agency

Create a new agency.

```http
POST /api/agencies
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Elite Cleaning Services",
  "description": "Professional cleaning services for residential and commercial properties",
  "contact": {
    "email": "info@elitecleaning.com",
    "phone": "+1-555-0123",
    "website": "https://elitecleaning.com",
    "address": {
      "street": "123 Business Ave",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    }
  },
  "business": {
    "type": "llc",
    "registrationNumber": "LLC123456789",
    "taxId": "12-3456789",
    "licenseNumber": "LIC789012345",
    "insurance": {
      "provider": "State Farm",
      "policyNumber": "SF123456789",
      "coverageAmount": 1000000,
      "expiryDate": "2024-12-31T23:59:59.000Z"
    }
  },
  "serviceAreas": [
    {
      "name": "San Francisco Bay Area",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      },
      "radius": 50,
      "zipCodes": ["94102", "94103", "94104"]
    }
  ],
  "services": [
    {
      "category": "cleaning",
      "subcategories": ["residential", "commercial", "deep_cleaning"],
      "pricing": {
        "baseRate": 50,
        "currency": "USD"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agency created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Elite Cleaning Services",
    "description": "Professional cleaning services for residential and commercial properties",
    "owner": "60f7b3b3b3b3b3b3b3b3b3b4",
    "contact": {
      "email": "info@elitecleaning.com",
      "phone": "+1-555-0123",
      "website": "https://elitecleaning.com",
      "address": {
        "street": "123 Business Ave",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102",
        "country": "USA",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      }
    },
    "business": {
      "type": "llc",
      "registrationNumber": "LLC123456789",
      "taxId": "12-3456789",
      "licenseNumber": "LIC789012345",
      "insurance": {
        "provider": "State Farm",
        "policyNumber": "SF123456789",
        "coverageAmount": 1000000,
        "expiryDate": "2024-12-31T23:59:59.000Z"
      }
    },
    "serviceAreas": [
      {
        "name": "San Francisco Bay Area",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        },
        "radius": 50,
        "zipCodes": ["94102", "94103", "94104"]
      }
    ],
    "services": [
      {
        "category": "cleaning",
        "subcategories": ["residential", "commercial", "deep_cleaning"],
        "pricing": {
          "baseRate": 50,
          "currency": "USD"
        }
      }
    ],
    "subscription": {
      "plan": "basic",
      "isActive": true,
      "features": []
    },
    "verification": {
      "isVerified": false,
      "documents": []
    },
    "analytics": {
      "totalBookings": 0,
      "totalRevenue": 0,
      "averageRating": 0,
      "totalReviews": 0,
      "monthlyStats": []
    },
    "settings": {
      "autoApproveProviders": false,
      "requireProviderVerification": true,
      "defaultCommissionRate": 10,
      "notificationPreferences": {
        "email": {
          "newBookings": true,
          "providerUpdates": true,
          "paymentUpdates": true
        },
        "sms": {
          "newBookings": false,
          "urgentUpdates": true
        }
      }
    },
    "isActive": true,
    "createdAt": "2023-09-20T10:30:00.000Z",
    "updatedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### Update Agency

Update an existing agency.

```http
PUT /api/agencies/:id
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Request Body:**
```json
{
  "name": "Elite Cleaning Services - Updated",
  "description": "Updated description for professional cleaning services",
  "contact": {
    "email": "contact@elitecleaning.com",
    "phone": "+1-555-0124",
    "website": "https://elitecleaning.com"
  },
  "services": [
    {
      "category": "cleaning",
      "subcategories": ["residential", "commercial", "deep_cleaning", "post_construction"],
      "pricing": {
        "baseRate": 55,
        "currency": "USD"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agency updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Elite Cleaning Services - Updated",
    "description": "Updated description for professional cleaning services",
    "contact": {
      "email": "contact@elitecleaning.com",
      "phone": "+1-555-0124",
      "website": "https://elitecleaning.com"
    },
    "services": [
      {
        "category": "cleaning",
        "subcategories": ["residential", "commercial", "deep_cleaning", "post_construction"],
        "pricing": {
          "baseRate": 55,
          "currency": "USD"
        }
      }
    ],
    "updatedAt": "2023-09-20T11:00:00.000Z"
  }
}
```

### Delete Agency

Delete an agency (soft delete).

```http
DELETE /api/agencies/:id
Authorization: Bearer <user_token>
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Response:**
```json
{
  "success": true,
  "message": "Agency deleted successfully"
}
```

## Provider Management Endpoints

### Add Provider

Add a provider to an agency.

```http
POST /api/agencies/:id/providers
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Request Body:**
```json
{
  "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
  "commissionRate": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider added successfully"
}
```

### Remove Provider

Remove a provider from an agency.

```http
DELETE /api/agencies/:id/providers/:providerId
Authorization: Bearer <user_token>
```

**Path Parameters:**
- `id` (string, required): Agency ID
- `providerId` (string, required): Provider User ID

**Response:**
```json
{
  "success": true,
  "message": "Provider removed successfully"
}
```

### Update Provider Status

Update the status of a provider.

```http
PUT /api/agencies/:id/providers/:providerId/status
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Agency ID
- `providerId` (string, required): Provider User ID

**Request Body:**
```json
{
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider status updated successfully"
}
```

## Administrative Management Endpoints

### Add Admin

Add an admin to an agency.

```http
POST /api/agencies/:id/admins
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Request Body:**
```json
{
  "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
  "role": "manager",
  "permissions": ["manage_providers", "view_analytics"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin added successfully"
}
```

### Remove Admin

Remove an admin from an agency.

```http
DELETE /api/agencies/:id/admins/:adminId
Authorization: Bearer <user_token>
```

**Path Parameters:**
- `id` (string, required): Agency ID
- `adminId` (string, required): Admin User ID

**Response:**
```json
{
  "success": true,
  "message": "Admin removed successfully"
}
```

## File Upload Endpoints

### Upload Agency Logo

Upload a logo for an agency.

```http
POST /api/agencies/:id/logo
Authorization: Bearer <user_token>
Content-Type: multipart/form-data
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Form Data:**
- `logo` (file, required): Logo image file

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/example/image/upload/v1234567890/logo.jpg",
    "publicId": "localpro/agencies/logos/logo_1234567890"
  }
}
```

## Analytics Endpoints

### Get Agency Analytics

Get analytics data for an agency.

```http
GET /api/agencies/:id/analytics
Authorization: Bearer <user_token>
```

**Path Parameters:**
- `id` (string, required): Agency ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProviders": 5,
    "activeProviders": 4,
    "totalBookings": 150,
    "totalRevenue": 7500,
    "averageRating": 4.7,
    "totalReviews": 45,
    "monthlyStats": [
      {
        "month": "September",
        "year": 2023,
        "bookings": 25,
        "revenue": 1250,
        "newProviders": 2
      }
    ],
    "providerPerformance": [
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "status": "active",
        "commissionRate": 15,
        "performance": {
          "rating": 4.8,
          "totalJobs": 45,
          "completedJobs": 43,
          "cancellationRate": 4.4
        }
      }
    ]
  }
}
```

## User-Specific Endpoints

### Get My Agencies

Get agencies associated with the current user.

```http
GET /api/agencies/my/agencies
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "Elite Cleaning Services",
      "description": "Professional cleaning services for residential and commercial properties",
      "owner": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
          }
        }
      },
      "providers": [
        {
          "user": {
            "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
            "firstName": "Jane",
            "lastName": "Smith",
            "profile": {
              "avatar": {
                "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar2.jpg",
                "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar2.jpg"
              }
            }
          },
          "status": "active",
          "commissionRate": 15,
          "joinedAt": "2023-09-20T08:30:00.000Z",
          "performance": {
            "rating": 4.8,
            "totalJobs": 45,
            "completedJobs": 43,
            "cancellationRate": 4.4
          }
        }
      ],
      "isActive": true,
      "createdAt": "2023-09-01T08:00:00.000Z",
      "updatedAt": "2023-09-20T10:30:00.000Z"
    }
  ]
}
```

### Join Agency

Request to join an agency as a provider.

```http
POST /api/agencies/join
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "agencyId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully requested to join agency"
}
```

### Leave Agency

Leave an agency.

```http
POST /api/agencies/leave
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "agencyId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully left agency"
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "User ID is required"
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
  "message": "Not authorized to update this agency"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Agency not found"
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

- **Agency Creation**: 10 requests per hour per user
- **Agency Updates**: 50 requests per hour per user
- **Provider Management**: 100 requests per hour per user
- **Analytics**: 200 requests per hour per user

## Validation Rules

### Agency Creation Validation
- **Name**: Required, 2-100 characters
- **Description**: Required, maximum 500 characters
- **Contact Email**: Required, valid email format
- **Contact Phone**: Required, 10-15 characters
- **Business Type**: Must be one of the defined business types

### Provider Management Validation
- **User ID**: Required, valid User ID
- **Commission Rate**: Optional, 0-100 range
- **Status**: Must be one of: active, inactive, suspended, pending

### Admin Management Validation
- **User ID**: Required, valid User ID
- **Role**: Must be one of: admin, manager, supervisor
- **Permissions**: Array of permission strings

## Examples

### Complete Agency Management Flow

```javascript
// 1. Create agency
const createAgency = async (agencyData) => {
  const response = await fetch('/api/agencies', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(agencyData)
  });
  
  return await response.json();
};

// 2. Get agencies with filtering
const getAgencies = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/agencies?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 3. Add provider
const addProvider = async (agencyId, userId, commissionRate = 10) => {
  const response = await fetch(`/api/agencies/${agencyId}/providers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, commissionRate })
  });
  
  return await response.json();
};

// 4. Get analytics
const getAgencyAnalytics = async (agencyId) => {
  const response = await fetch(`/api/agencies/${agencyId}/analytics`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Agency Search and Filtering

```javascript
// Search agencies by name and location
const searchAgencies = async (searchTerm, location) => {
  const response = await fetch(`/api/agencies?search=${searchTerm}&location=${location}&page=1&limit=20`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Filter agencies by service type
const getAgenciesByService = async (serviceType) => {
  const response = await fetch(`/api/agencies?serviceType=${serviceType}&page=1&limit=20`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

This comprehensive API provides all the functionality needed for a robust agency management system.
