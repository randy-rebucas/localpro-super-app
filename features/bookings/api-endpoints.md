# Bookings API Endpoints

## Overview

The Bookings API provides comprehensive endpoints for managing services and bookings in the marketplace. All endpoints follow RESTful conventions and return standardized response formats.

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📋 Service Endpoints

### Get All Services
**GET** `/api/marketplace/services`

Retrieve a paginated list of services with filtering and sorting options.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | String | No | Filter by service category |
| `subcategory` | String | No | Filter by service subcategory |
| `location` | String | No | Filter by service area |
| `minPrice` | Number | No | Minimum price filter |
| `maxPrice` | Number | No | Maximum price filter |
| `rating` | Number | No | Minimum rating filter |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |
| `sortBy` | String | No | Sort field (default: createdAt) |
| `sortOrder` | String | No | Sort order: asc/desc (default: desc) |

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Professional House Cleaning",
      "description": "Complete house cleaning service...",
      "category": "cleaning",
      "subcategory": "residential",
      "provider": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg",
          "rating": 4.8,
          "experience": "5 years"
        }
      },
      "pricing": {
        "type": "hourly",
        "basePrice": 25,
        "currency": "USD"
      },
      "serviceArea": ["10001", "10002", "10003"],
      "rating": {
        "average": 4.8,
        "count": 127
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

### Get Single Service
**GET** `/api/marketplace/services/:id`

Retrieve detailed information about a specific service.

#### Response Format
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Professional House Cleaning",
    "description": "Complete house cleaning service...",
    "category": "cleaning",
    "subcategory": "residential",
    "provider": {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": "https://example.com/avatar.jpg",
        "rating": 4.8,
        "experience": "5 years",
        "skills": ["cleaning", "organization"]
      }
    },
    "pricing": {
      "type": "hourly",
      "basePrice": 25,
      "currency": "USD"
    },
    "availability": {
      "schedule": [
        {
          "day": "monday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        }
      ],
      "timezone": "UTC"
    },
    "serviceArea": ["10001", "10002", "10003"],
    "images": [
      {
        "url": "https://example.com/service1.jpg",
        "publicId": "service1",
        "thumbnail": "https://example.com/thumb1.jpg",
        "alt": "Cleaning service"
      }
    ],
    "features": ["Eco-friendly products", "Insured", "Same-day service"],
    "requirements": ["Access to all rooms", "Pets secured"],
    "serviceType": "one_time",
    "estimatedDuration": {
      "min": 2,
      "max": 4
    },
    "teamSize": 2,
    "equipmentProvided": true,
    "materialsIncluded": true,
    "warranty": {
      "hasWarranty": true,
      "duration": 30,
      "description": "30-day satisfaction guarantee"
    },
    "insurance": {
      "covered": true,
      "coverageAmount": 1000000
    },
    "emergencyService": {
      "available": true,
      "surcharge": 50,
      "responseTime": "within 2 hours"
    },
    "rating": {
      "average": 4.8,
      "count": 127
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Nearby Services
**GET** `/api/marketplace/services/nearby`

Find services within a specified radius of given coordinates.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | Number | Yes | Latitude coordinate |
| `lng` | Number | Yes | Longitude coordinate |
| `radius` | Number | No | Search radius in meters (default: 50000) |
| `category` | String | No | Filter by service category |
| `subcategory` | String | No | Filter by service subcategory |
| `minPrice` | Number | No | Minimum price filter |
| `maxPrice` | Number | No | Maximum price filter |
| `rating` | Number | No | Minimum rating filter |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |

#### Response Format
```json
{
  "success": true,
  "count": 15,
  "total": 15,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Professional House Cleaning",
      "distance": {
        "value": 2.5,
        "unit": "km",
        "text": "2.5 km"
      },
      "duration": {
        "value": 8,
        "unit": "minutes",
        "text": "8 minutes"
      },
      "isWithinRange": true,
      "provider": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg",
          "rating": 4.8
        }
      },
      "pricing": {
        "type": "hourly",
        "basePrice": 25,
        "currency": "USD"
      },
      "rating": {
        "average": 4.8,
        "count": 127
      }
    }
  ],
  "searchLocation": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "searchRadius": 50000
}
```

### Create Service
**POST** `/api/marketplace/services`
**Access**: Private (Provider/Admin)

Create a new service listing.

#### Request Body
```json
{
  "title": "Professional House Cleaning",
  "description": "Complete house cleaning service with eco-friendly products",
  "category": "cleaning",
  "subcategory": "residential",
  "pricing": {
    "type": "hourly",
    "basePrice": 25,
    "currency": "USD"
  },
  "serviceArea": ["10001", "10002", "10003"],
  "availability": {
    "schedule": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "17:00",
        "isAvailable": true
      }
    ],
    "timezone": "UTC"
  },
  "features": ["Eco-friendly products", "Insured", "Same-day service"],
  "requirements": ["Access to all rooms", "Pets secured"],
  "serviceType": "one_time",
  "estimatedDuration": {
    "min": 2,
    "max": 4
  },
  "teamSize": 2,
  "equipmentProvided": true,
  "materialsIncluded": true,
  "warranty": {
    "hasWarranty": true,
    "duration": 30,
    "description": "30-day satisfaction guarantee"
  },
  "insurance": {
    "covered": true,
    "coverageAmount": 1000000
  },
  "emergencyService": {
    "available": true,
    "surcharge": 50,
    "responseTime": "within 2 hours"
  }
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Professional House Cleaning",
    "description": "Complete house cleaning service...",
    "category": "cleaning",
    "subcategory": "residential",
    "provider": "64a1b2c3d4e5f6789012346",
    "pricing": {
      "type": "hourly",
      "basePrice": 25,
      "currency": "USD"
    },
    "serviceArea": ["10001", "10002", "10003"],
    "isActive": true,
    "rating": {
      "average": 0,
      "count": 0
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Service
**PUT** `/api/marketplace/services/:id`
**Access**: Private (Provider/Admin)

Update an existing service listing.

#### Response Format
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Professional House Cleaning - Updated",
    "description": "Updated description...",
    "pricing": {
      "type": "hourly",
      "basePrice": 30,
      "currency": "USD"
    },
    "updatedAt": "2024-01-15T11:30:00Z"
  }
}
```

### Delete Service
**DELETE** `/api/marketplace/services/:id`
**Access**: Private (Provider/Admin)

Delete a service listing.

#### Response Format
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

### Upload Service Images
**POST** `/api/marketplace/services/:id/images`
**Access**: Private (Provider/Admin)

Upload images for a service listing.

#### Request Body
- **Content-Type**: `multipart/form-data`
- **images**: Array of image files (max 5)

#### Response Format
```json
{
  "success": true,
  "message": "Service images uploaded successfully",
  "data": [
    {
      "url": "https://example.com/service1.jpg",
      "publicId": "service1",
      "thumbnail": "https://example.com/thumb1.jpg",
      "alt": "Service image for Professional House Cleaning"
    }
  ]
}
```

### Get My Services
**GET** `/api/marketplace/my-services`
**Access**: Private

Get services created by the authenticated user.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | String | No | Filter by service category |
| `status` | String | No | Filter by status: all/active/inactive |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |
| `sortBy` | String | No | Sort field (default: createdAt) |
| `sortOrder` | String | No | Sort order: asc/desc (default: desc) |

#### Response Format
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Professional House Cleaning",
        "category": "cleaning",
        "subcategory": "residential",
        "pricing": {
          "type": "hourly",
          "basePrice": 25,
          "currency": "USD"
        },
        "rating": {
          "average": 4.8,
          "count": 127
        },
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25,
      "limit": 10
    },
    "stats": {
      "totalServices": 25,
      "activeServices": 20,
      "inactiveServices": 5,
      "averageRating": 4.6,
      "totalBookings": 150
    }
  }
}
```

## 📅 Booking Endpoints

### Create Booking
**POST** `/api/marketplace/bookings`
**Access**: Private

Create a new service booking.

#### Request Body
```json
{
  "serviceId": "64a1b2c3d4e5f6789012345",
  "bookingDate": "2024-01-20T14:00:00Z",
  "duration": 3,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "specialInstructions": "Please use eco-friendly products only",
  "paymentMethod": "paypal"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Booking created successfully with PayPal payment",
  "data": {
    "booking": {
      "_id": "64a1b2c3d4e5f6789012347",
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Professional House Cleaning",
        "category": "cleaning",
        "pricing": {
          "type": "hourly",
          "basePrice": 25,
          "currency": "USD"
        }
      },
      "client": {
        "_id": "64a1b2c3d4e5f6789012348",
        "firstName": "Jane",
        "lastName": "Smith",
        "phoneNumber": "+1234567890",
        "email": "jane@example.com"
      },
      "provider": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+1234567891",
        "email": "john@example.com"
      },
      "bookingDate": "2024-01-20T14:00:00Z",
      "duration": 3,
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "specialInstructions": "Please use eco-friendly products only",
      "status": "pending",
      "pricing": {
        "basePrice": 25,
        "totalAmount": 75,
        "currency": "USD"
      },
      "payment": {
        "status": "pending",
        "method": "paypal",
        "paypalOrderId": "ORDER-123456789"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "paypalApprovalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123456789"
  }
}
```

### Get Bookings
**GET** `/api/marketplace/bookings`
**Access**: Private

Get bookings for the authenticated user.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | No | Filter by booking status |
| `type` | String | No | Filter by user role: all/client/provider |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |

#### Response Format
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012347",
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Professional House Cleaning",
        "category": "cleaning",
        "pricing": {
          "type": "hourly",
          "basePrice": 25,
          "currency": "USD"
        }
      },
      "client": {
        "_id": "64a1b2c3d4e5f6789012348",
        "firstName": "Jane",
        "lastName": "Smith",
        "phoneNumber": "+1234567890"
      },
      "provider": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+1234567891"
      },
      "bookingDate": "2024-01-20T14:00:00Z",
      "duration": 3,
      "status": "confirmed",
      "pricing": {
        "basePrice": 25,
        "totalAmount": 75,
        "currency": "USD"
      },
      "payment": {
        "status": "paid",
        "method": "paypal",
        "paidAt": "2024-01-15T10:35:00Z"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Update Booking Status
**PUT** `/api/marketplace/bookings/:id/status`
**Access**: Private

Update the status of a booking.

#### Request Body
```json
{
  "status": "confirmed"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "status": "confirmed",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Upload Booking Photos
**POST** `/api/marketplace/bookings/:id/photos`
**Access**: Private

Upload photos for a booking (before/after).

#### Request Body
- **Content-Type**: `multipart/form-data`
- **photos**: Array of image files (max 5)
- **type**: String - "before" or "after"

#### Response Format
```json
{
  "success": true,
  "message": "before photos uploaded successfully",
  "data": [
    {
      "url": "https://example.com/before1.jpg",
      "publicId": "before1",
      "thumbnail": "https://example.com/thumb_before1.jpg"
    }
  ]
}
```

### Add Review
**POST** `/api/marketplace/bookings/:id/review`
**Access**: Private

Add a review for a completed booking.

#### Request Body
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

#### Response Format
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "review": {
      "rating": 5,
      "comment": "Excellent service! Very professional and thorough.",
      "categories": {
        "quality": 5,
        "timeliness": 5,
        "communication": 4,
        "value": 5
      },
      "wouldRecommend": true,
      "createdAt": "2024-01-21T10:00:00Z"
    }
  }
}
```

### Get My Bookings
**GET** `/api/marketplace/my-bookings`
**Access**: Private

Get detailed booking information for the authenticated user.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | String | No | Filter by booking status |
| `type` | String | No | Filter by user role: all/client/provider |
| `paymentStatus` | String | No | Filter by payment status |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |
| `sortBy` | String | No | Sort field (default: createdAt) |
| `sortOrder` | String | No | Sort order: asc/desc (default: desc) |
| `dateFrom` | Date | No | Filter bookings from date |
| `dateTo` | Date | No | Filter bookings to date |

#### Response Format
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "64a1b2c3d4e5f6789012347",
        "service": {
          "_id": "64a1b2c3d4e5f6789012345",
          "title": "Professional House Cleaning",
          "category": "cleaning",
          "subcategory": "residential",
          "pricing": {
            "type": "hourly",
            "basePrice": 25,
            "currency": "USD"
          },
          "images": [
            {
              "url": "https://example.com/service1.jpg",
              "thumbnail": "https://example.com/thumb1.jpg"
            }
          ]
        },
        "client": {
          "_id": "64a1b2c3d4e5f6789012348",
          "firstName": "Jane",
          "lastName": "Smith",
          "phoneNumber": "+1234567890",
          "email": "jane@example.com",
          "profile": {
            "avatar": "https://example.com/avatar.jpg"
          }
        },
        "provider": {
          "_id": "64a1b2c3d4e5f6789012346",
          "firstName": "John",
          "lastName": "Doe",
          "phoneNumber": "+1234567891",
          "email": "john@example.com",
          "profile": {
            "avatar": "https://example.com/avatar.jpg"
          }
        },
        "bookingDate": "2024-01-20T14:00:00Z",
        "duration": 3,
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "US",
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        },
        "specialInstructions": "Please use eco-friendly products only",
        "status": "completed",
        "pricing": {
          "basePrice": 25,
          "additionalFees": [],
          "totalAmount": 75,
          "currency": "USD"
        },
        "payment": {
          "status": "paid",
          "method": "paypal",
          "paypalTransactionId": "TXN-123456789",
          "paidAt": "2024-01-15T10:35:00Z"
        },
        "review": {
          "rating": 5,
          "comment": "Excellent service!",
          "categories": {
            "quality": 5,
            "timeliness": 5,
            "communication": 4,
            "value": 5
          },
          "wouldRecommend": true,
          "createdAt": "2024-01-21T10:00:00Z"
        },
        "beforePhotos": [
          {
            "url": "https://example.com/before1.jpg",
            "thumbnail": "https://example.com/thumb_before1.jpg"
          }
        ],
        "afterPhotos": [
          {
            "url": "https://example.com/after1.jpg",
            "thumbnail": "https://example.com/thumb_after1.jpg"
          }
        ],
        "completionNotes": "Service completed successfully",
        "userRole": "client",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-21T10:00:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25,
      "limit": 10
    },
    "stats": {
      "totalBookings": 25,
      "clientBookings": 15,
      "providerBookings": 10,
      "pendingBookings": 3,
      "confirmedBookings": 8,
      "completedBookings": 12,
      "cancelledBookings": 2,
      "totalEarnings": 1500.00,
      "totalSpent": 750.00,
      "averageRating": 4.6
    }
  }
}
```

## 💳 Payment Endpoints

### Approve PayPal Booking
**POST** `/api/marketplace/bookings/paypal/approve`
**Access**: Private

Approve a PayPal payment for a booking.

#### Request Body
```json
{
  "orderId": "ORDER-123456789"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "PayPal payment approved successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "payment": {
      "status": "paid",
      "method": "paypal",
      "paypalTransactionId": "TXN-123456789",
      "paidAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

### Get PayPal Order Details
**GET** `/api/marketplace/bookings/paypal/order/:orderId`
**Access**: Private

Get details of a PayPal order.

#### Response Format
```json
{
  "success": true,
  "data": {
    "booking": {
      "_id": "64a1b2c3d4e5f6789012347",
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Professional House Cleaning"
      },
      "pricing": {
        "totalAmount": 75,
        "currency": "USD"
      },
      "payment": {
        "status": "pending",
        "method": "paypal",
        "paypalOrderId": "ORDER-123456789"
      }
    },
    "paypalOrder": {
      "id": "ORDER-123456789",
      "status": "APPROVED",
      "purchase_units": [
        {
          "amount": {
            "currency_code": "USD",
            "value": "75.00"
          }
        }
      ]
    }
  }
}
```

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Codes
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **409** - Conflict (duplicate resource)
- **422** - Unprocessable Entity (validation failed)
- **500** - Internal Server Error

### Example Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "bookingDate",
      "message": "Booking date is required"
    },
    {
      "field": "duration",
      "message": "Duration must be a positive number"
    }
  ]
}
```

---

*This documentation covers all available API endpoints. For implementation examples and best practices, see the related documentation files.*
