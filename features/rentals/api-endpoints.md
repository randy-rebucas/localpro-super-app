# Rentals API Endpoints

This document defines the API endpoints and response formats for the rentals feature in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Standard Response Format](#standard-response-format)
- [Authentication](#authentication)
- [Rental Item Endpoints](#rental-item-endpoints)
- [Booking Endpoints](#booking-endpoints)
- [Review Endpoints](#review-endpoints)
- [Search Endpoints](#search-endpoints)
- [Error Handling](#error-handling)

## Overview

The rentals API provides endpoints for managing rental items, handling bookings, processing reviews, and searching for equipment.

## Standard Response Format

### Success Response
```javascript
{
  "success": true,
  "data": object | array,
  "message": string,     // Optional
  "count": number,       // For list endpoints
  "total": number,       // For paginated endpoints
  "page": number,        // For paginated endpoints
  "pages": number        // For paginated endpoints
}
```

### Error Response
```javascript
{
  "success": false,
  "message": string,
  "errors": array        // Optional validation errors
}
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## Rental Item Endpoints

### GET /api/rentals
Get all rental items with filtering and pagination.

**Query Parameters:**
- `search` (string) - Text search in name, title, description, and tags
- `category` (string) - Filter by equipment category
- `location` (string) - Filter by location city
- `minPrice` (number) - Minimum daily price
- `maxPrice` (number) - Maximum daily price
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)
- `sortBy` (string) - Sort field (default: 'createdAt')
- `sortOrder` (string) - Sort direction 'asc' or 'desc' (default: 'desc')

**Response:**
```javascript
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Drill Set",
      "title": "Heavy Duty Cordless Drill Set",
      "description": "Complete professional drill set with multiple bits",
      "category": "tools",
      "subcategory": "power_tools",
      "owner": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg",
          "rating": 4.8
        }
      },
      "pricing": {
        "hourly": 15,
        "daily": 50,
        "weekly": 300,
        "monthly": 1000,
        "currency": "USD"
      },
      "location": {
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        },
        "pickupRequired": true,
        "deliveryAvailable": false
      },
      "specifications": {
        "brand": "DeWalt",
        "model": "DCD996B",
        "year": 2023,
        "condition": "excellent",
        "features": ["cordless", "brushless", "LED light"],
        "dimensions": {
          "length": 12,
          "width": 3,
          "height": 8,
          "unit": "inches"
        },
        "weight": {
          "value": 3.2,
          "unit": "lbs"
        }
      },
      "requirements": {
        "minAge": 18,
        "licenseRequired": false,
        "deposit": 100,
        "insuranceRequired": true
      },
      "rating": {
        "average": 4.8,
        "count": 25
      },
      "isActive": true,
      "isFeatured": false,
      "views": 150,
      "tags": ["drill", "power_tools", "construction"],
      "createdAt": "2023-07-01T10:00:00.000Z",
      "updatedAt": "2023-07-01T10:00:00.000Z"
    }
    // ... more rental items
  ]
}
```

### GET /api/rentals/:id
Get a single rental item by ID.

**Parameters:**
- `id` (string) - Rental item ID

**Response:**
```javascript
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Drill Set",
    "title": "Heavy Duty Cordless Drill Set",
    "description": "Complete professional drill set with multiple bits",
    "category": "tools",
    "subcategory": "power_tools",
    "owner": {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": "https://example.com/avatar.jpg",
        "bio": "Professional contractor with 10+ years experience",
        "rating": 4.8
      }
    },
    "pricing": {
      "hourly": 15,
      "daily": 50,
      "weekly": 300,
      "monthly": 1000,
      "currency": "USD"
    },
    "availability": {
      "isAvailable": true,
      "schedule": []
    },
    "location": {
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "pickupRequired": true,
      "deliveryAvailable": false
    },
    "specifications": {
      "brand": "DeWalt",
      "model": "DCD996B",
      "year": 2023,
      "condition": "excellent",
      "features": ["cordless", "brushless", "LED light"],
      "dimensions": {
        "length": 12,
        "width": 3,
        "height": 8,
        "unit": "inches"
      },
      "weight": {
        "value": 3.2,
        "unit": "lbs"
      }
    },
    "requirements": {
      "minAge": 18,
      "licenseRequired": false,
      "deposit": 100,
      "insuranceRequired": true
    },
    "images": [
      {
        "url": "https://example.com/drill1.jpg",
        "publicId": "drill_image_123",
        "thumbnail": "https://example.com/drill1_thumb.jpg",
        "alt": "Drill set main view"
      }
    ],
    "documents": [
      {
        "type": "manual",
        "url": "https://example.com/manual.pdf",
        "publicId": "manual_123",
        "name": "User Manual"
      }
    ],
    "maintenance": {
      "lastService": "2023-06-15T00:00:00.000Z",
      "nextService": "2023-09-15T00:00:00.000Z",
      "serviceHistory": [
        {
          "date": "2023-06-15T00:00:00.000Z",
          "type": "routine",
          "description": "Battery replacement and cleaning",
          "cost": 45
        }
      ]
    },
    "rating": {
      "average": 4.8,
      "count": 25
    },
    "isActive": true,
    "isFeatured": false,
    "views": 151,
    "tags": ["drill", "power_tools", "construction"],
    "bookings": [
      // Embedded booking records
    ],
    "reviews": [
      // Embedded review records
    ],
    "averageRating": 4.8,
    "createdAt": "2023-07-01T10:00:00.000Z",
    "updatedAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### POST /api/rentals
Create a new rental item.

**Request Body:**
```javascript
{
  "name": "Professional Drill Set",
  "title": "Heavy Duty Cordless Drill Set",
  "description": "Complete professional drill set with multiple bits",
  "category": "tools",
  "subcategory": "power_tools",
  "pricing": {
    "hourly": 15,
    "daily": 50,
    "weekly": 300,
    "monthly": 1000,
    "currency": "USD"
  },
  "location": {
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "pickupRequired": true,
    "deliveryAvailable": false
  },
  "specifications": {
    "brand": "DeWalt",
    "model": "DCD996B",
    "year": 2023,
    "condition": "excellent",
    "features": ["cordless", "brushless", "LED light"],
    "dimensions": {
      "length": 12,
      "width": 3,
      "height": 8,
      "unit": "inches"
    },
    "weight": {
      "value": 3.2,
      "unit": "lbs"
    }
  },
  "requirements": {
    "minAge": 18,
    "licenseRequired": false,
    "deposit": 100,
    "insuranceRequired": true
  },
  "tags": ["drill", "power_tools", "construction"]
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Rental item created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Drill Set",
    "title": "Heavy Duty Cordless Drill Set",
    "description": "Complete professional drill set with multiple bits",
    "category": "tools",
    "subcategory": "power_tools",
    "owner": "64a1b2c3d4e5f6789012346",
    "pricing": {
      "hourly": 15,
      "daily": 50,
      "weekly": 300,
      "monthly": 1000,
      "currency": "USD"
    },
    "isActive": true,
    "isFeatured": false,
    "views": 0,
    "createdAt": "2023-07-01T10:00:00.000Z",
    "updatedAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### PUT /api/rentals/:id
Update an existing rental item.

**Parameters:**
- `id` (string) - Rental item ID

**Request Body:** Same as POST /api/rentals (all fields optional)

**Response:**
```javascript
{
  "success": true,
  "message": "Rental item updated successfully",
  "data": {
    // Updated rental item object
  }
}
```

### DELETE /api/rentals/:id
Delete a rental item (soft delete).

**Parameters:**
- `id` (string) - Rental item ID

**Response:**
```javascript
{
  "success": true,
  "message": "Rental item deleted successfully"
}
```

### POST /api/rentals/:id/images
Upload images for a rental item.

**Parameters:**
- `id` (string) - Rental item ID

**Request:** Multipart form data with image files

**Response:**
```javascript
{
  "success": true,
  "message": "2 image(s) uploaded successfully",
  "data": [
    {
      "url": "https://example.com/drill1.jpg",
      "publicId": "drill_image_123"
    },
    {
      "url": "https://example.com/drill2.jpg",
      "publicId": "drill_image_124"
    }
  ]
}
```

### DELETE /api/rentals/:id/images/:imageId
Delete an image from a rental item.

**Parameters:**
- `id` (string) - Rental item ID
- `imageId` (string) - Image ID

**Response:**
```javascript
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Booking Endpoints

### POST /api/rentals/:id/book
Book a rental item.

**Parameters:**
- `id` (string) - Rental item ID

**Request Body:**
```javascript
{
  "startDate": "2023-07-15T09:00:00.000Z",
  "endDate": "2023-07-17T17:00:00.000Z",
  "quantity": 1,
  "specialRequests": "Please ensure fully charged batteries",
  "contactInfo": {
    "phone": "+1234567890",
    "email": "renter@example.com"
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Rental item booked successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012347",
    "startDate": "2023-07-15T09:00:00.000Z",
    "endDate": "2023-07-17T17:00:00.000Z",
    "quantity": 1,
    "totalCost": 100,
    "specialRequests": "Please ensure fully charged batteries",
    "contactInfo": {
      "phone": "+1234567890",
      "email": "renter@example.com"
    },
    "status": "pending",
    "createdAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### PUT /api/rentals/:id/bookings/:bookingId/status
Update booking status.

**Parameters:**
- `id` (string) - Rental item ID
- `bookingId` (string) - Booking ID

**Request Body:**
```javascript
{
  "status": "confirmed"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012347",
    "startDate": "2023-07-15T09:00:00.000Z",
    "endDate": "2023-07-17T17:00:00.000Z",
    "quantity": 1,
    "totalCost": 100,
    "status": "confirmed",
    "updatedAt": "2023-07-01T10:30:00.000Z"
  }
}
```

## Review Endpoints

### POST /api/rentals/:id/reviews
Add a review for a rental item.

**Parameters:**
- `id` (string) - Rental item ID

**Request Body:**
```javascript
{
  "rating": 5,
  "comment": "Excellent drill set, very reliable and easy to use. Owner was very professional and helpful."
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012347",
    "rating": 5,
    "comment": "Excellent drill set, very reliable and easy to use. Owner was very professional and helpful.",
    "createdAt": "2023-07-01T10:00:00.000Z"
  }
}
```

## Search Endpoints

### GET /api/rentals/nearby
Find nearby rental items.

**Query Parameters:**
- `lat` (number) - Latitude (required)
- `lng` (number) - Longitude (required)
- `radius` (number) - Search radius in kilometers (default: 10)
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:**
```javascript
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [
    // Array of nearby rental items
  ]
}
```

### GET /api/rentals/categories
Get rental categories with usage counts.

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "_id": "tools",
      "count": 45
    },
    {
      "_id": "vehicles",
      "count": 32
    },
    {
      "_id": "equipment",
      "count": 28
    },
    {
      "_id": "machinery",
      "count": 15
    }
  ]
}
```

### GET /api/rentals/featured
Get featured rental items.

**Query Parameters:**
- `limit` (number) - Number of featured items to return (default: 10)

**Response:**
```javascript
{
  "success": true,
  "count": 5,
  "data": [
    // Array of featured rental items
  ]
}
```

### GET /api/rentals/my-rentals
Get current user's rental items.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:**
```javascript
{
  "success": true,
  "count": 3,
  "total": 12,
  "page": 1,
  "pages": 2,
  "data": [
    // Array of user's rental items
  ]
}
```

### GET /api/rentals/my-bookings
Get current user's rental bookings.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Response:**
```javascript
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "booking_id_123",
      "user": "64a1b2c3d4e5f6789012347",
      "startDate": "2023-07-15T09:00:00.000Z",
      "endDate": "2023-07-17T17:00:00.000Z",
      "quantity": 1,
      "totalCost": 100,
      "status": "confirmed",
      "rental": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Heavy Duty Cordless Drill Set",
        "owner": {
          "_id": "64a1b2c3d4e5f6789012346",
          "firstName": "John",
          "lastName": "Doe",
          "profile": {
            "avatar": "https://example.com/avatar.jpg"
          }
        }
      },
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
    // ... more bookings
  ]
}
```

### GET /api/rentals/statistics
Get rental statistics (Admin only).

**Response:**
```javascript
{
  "success": true,
  "data": {
    "totalRentalItem": 150,
    "rentalsByCategory": [
      {
        "_id": "tools",
        "count": 45
      },
      {
        "_id": "vehicles",
        "count": 32
      },
      {
        "_id": "equipment",
        "count": 28
      },
      {
        "_id": "machinery",
        "count": 15
      }
    ],
    "totalBookings": 1250,
    "monthlyTrends": [
      {
        "_id": {
          "year": 2023,
          "month": 6
        },
        "count": 25
      },
      {
        "_id": {
          "year": 2023,
          "month": 7
        },
        "count": 30
      }
      // ... more months
    ]
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```javascript
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Name is required",
    "Invalid category specified",
    "Start date must be before end date"
  ]
}
```

**401 Unauthorized:**
```javascript
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

**403 Forbidden:**
```javascript
{
  "success": false,
  "message": "Not authorized to update this rental item"
}
```

**404 Not Found:**
```javascript
{
  "success": false,
  "message": "Rental item not found"
}
```

**500 Internal Server Error:**
```javascript
{
  "success": false,
  "message": "Server error"
}
```

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Upload endpoints**: 10 requests per 15 minutes
- **Booking endpoints**: 20 requests per 15 minutes
- **Search endpoints**: 200 requests per 15 minutes

## Caching

- **Featured rentals**: Cached for 5 minutes
- **Categories**: Cached for 10 minutes
- **Statistics**: Cached for 1 hour
- **Search results**: Cached for 2 minutes
