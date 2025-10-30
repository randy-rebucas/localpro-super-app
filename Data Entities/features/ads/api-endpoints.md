# Ads API Endpoints

This document defines the API endpoints and response formats for the advertising feature in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Standard Response Format](#standard-response-format)
- [Authentication](#authentication)
- [Ad Campaign Endpoints](#ad-campaign-endpoints)
- [Advertiser Endpoints](#advertiser-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [Error Handling](#error-handling)

## Overview

The ads API provides endpoints for managing advertising campaigns, tracking performance, and handling advertiser accounts.

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

## Ad Campaign Endpoints

### GET /api/ads
Get all active ads with filtering and pagination.

**Query Parameters:**
- `search` (string) - Text search in title and description
- `category` (string) - Filter by ad category
- `location` (string) - Filter by location city
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
      "title": "Hardware Store Sale",
      "description": "50% off all tools this weekend",
      "type": "banner",
      "category": "hardware_stores",
      "advertiser": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg"
        }
      },
      "budget": {
        "total": 1000,
        "daily": 100,
        "currency": "USD"
      },
      "status": "active",
      "isActive": true,
      "isFeatured": false,
      "views": 150,
      "clicks": 25,
      "impressions": 500,
      "createdAt": "2023-07-01T10:00:00.000Z",
      "updatedAt": "2023-07-01T10:00:00.000Z"
    }
    // ... more ads
  ]
}
```

### GET /api/ads/:id
Get a single ad by ID.

**Parameters:**
- `id` (string) - Ad campaign ID

**Response:**
```javascript
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Hardware Store Sale",
    "description": "50% off all tools this weekend",
    "type": "banner",
    "category": "hardware_stores",
    "advertiser": {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": "https://example.com/avatar.jpg",
        "bio": "Hardware store owner"
      }
    },
    "targetAudience": {
      "demographics": {
        "ageRange": [25, 65],
        "gender": ["male", "female"],
        "location": ["New York", "California"]
      },
      "behavior": {
        "userTypes": ["providers", "clients"],
        "activityLevel": "active"
      }
    },
    "location": {
      "city": "New York",
      "state": "NY",
      "country": "USA"
    },
    "images": [
      {
        "url": "https://example.com/ad-image.jpg",
        "publicId": "ad_image_123",
        "thumbnail": "https://example.com/ad-image-thumb.jpg"
      }
    ],
    "content": {
      "headline": "Special Weekend Offer",
      "body": "Get 50% off all tools and equipment",
      "callToAction": {
        "text": "Shop Now",
        "url": "https://example.com/shop"
      }
    },
    "budget": {
      "total": 1000,
      "daily": 100,
      "currency": "USD"
    },
    "bidding": {
      "strategy": "cpc",
      "bidAmount": 2.50,
      "maxBid": 5.00
    },
    "schedule": {
      "startDate": "2023-07-01T00:00:00.000Z",
      "endDate": "2023-07-31T23:59:59.000Z",
      "timeSlots": [
        {
          "day": "monday",
          "startTime": "09:00",
          "endTime": "17:00"
        }
      ]
    },
    "performance": {
      "impressions": 500,
      "clicks": 25,
      "conversions": 5,
      "spend": 62.50,
      "ctr": 5.0,
      "cpc": 2.50,
      "cpm": 125.00
    },
    "status": "active",
    "isActive": true,
    "isFeatured": false,
    "views": 150,
    "clicks": 25,
    "impressions": 500,
    "createdAt": "2023-07-01T10:00:00.000Z",
    "updatedAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### POST /api/ads
Create a new ad campaign.

**Request Body:**
```javascript
{
  "title": "Hardware Store Sale",
  "description": "50% off all tools this weekend",
  "type": "banner",
  "category": "hardware_stores",
  "targetAudience": {
    "demographics": {
      "ageRange": [25, 65],
      "gender": ["male", "female"],
      "location": ["New York", "California"],
      "interests": ["construction", "diy"]
    },
    "behavior": {
      "userTypes": ["providers", "clients"],
      "activityLevel": "active"
    }
  },
  "location": {
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "content": {
    "headline": "Special Weekend Offer",
    "body": "Get 50% off all tools and equipment",
    "callToAction": {
      "text": "Shop Now",
      "url": "https://example.com/shop"
    }
  },
  "budget": {
    "total": 1000,
    "daily": 100,
    "currency": "USD"
  },
  "bidding": {
    "strategy": "cpc",
    "bidAmount": 2.50,
    "maxBid": 5.00
  },
  "schedule": {
    "startDate": "2023-07-01T00:00:00.000Z",
    "endDate": "2023-07-31T23:59:59.000Z",
    "timeSlots": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ]
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Ad created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Hardware Store Sale",
    "description": "50% off all tools this weekend",
    "type": "banner",
    "category": "hardware_stores",
    "advertiser": "64a1b2c3d4e5f6789012346",
    "budget": {
      "total": 1000,
      "daily": 100,
      "currency": "USD"
    },
    "status": "draft",
    "isActive": true,
    "createdAt": "2023-07-01T10:00:00.000Z",
    "updatedAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### PUT /api/ads/:id
Update an existing ad campaign.

**Parameters:**
- `id` (string) - Ad campaign ID

**Request Body:** Same as POST /api/ads (all fields optional)

**Response:**
```javascript
{
  "success": true,
  "message": "Ad updated successfully",
  "data": {
    // Updated ad campaign object
  }
}
```

### DELETE /api/ads/:id
Delete an ad campaign (soft delete).

**Parameters:**
- `id` (string) - Ad campaign ID

**Response:**
```javascript
{
  "success": true,
  "message": "Ad deleted successfully"
}
```

### GET /api/ads/featured
Get featured ads.

**Query Parameters:**
- `limit` (number) - Number of featured ads to return (default: 10)

**Response:**
```javascript
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Featured Hardware Sale",
      "type": "banner",
      "category": "hardware_stores",
      "advertiser": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg"
        }
      },
      "isFeatured": true,
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
    // ... more featured ads
  ]
}
```

### GET /api/ads/categories
Get ad categories with usage counts.

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "_id": "hardware_stores",
      "count": 45
    },
    {
      "_id": "suppliers",
      "count": 32
    },
    {
      "_id": "training_schools",
      "count": 18
    },
    {
      "_id": "services",
      "count": 28
    },
    {
      "_id": "products",
      "count": 15
    }
  ]
}
```

### GET /api/ads/my-ads
Get current user's ads.

**Query Parameters:**
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
    // User's ad campaigns
  ]
}
```

### POST /api/ads/:id/images
Upload images for an ad campaign.

**Parameters:**
- `id` (string) - Ad campaign ID

**Request:** Multipart form data with image files

**Response:**
```javascript
{
  "success": true,
  "message": "2 image(s) uploaded successfully",
  "data": [
    {
      "url": "https://example.com/ad-image1.jpg",
      "publicId": "ad_image_123"
    },
    {
      "url": "https://example.com/ad-image2.jpg",
      "publicId": "ad_image_124"
    }
  ]
}
```

### DELETE /api/ads/:id/images/:imageId
Delete an image from an ad campaign.

**Parameters:**
- `id` (string) - Ad campaign ID
- `imageId` (string) - Image ID

**Response:**
```javascript
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### POST /api/ads/:id/promote
Promote an ad campaign.

**Parameters:**
- `id` (string) - Ad campaign ID

**Request Body:**
```javascript
{
  "promotionType": "featured",
  "duration": 30,
  "budget": 500
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Ad promoted successfully",
  "data": {
    "type": "featured",
    "duration": 30,
    "budget": 500,
    "startDate": "2023-07-01T10:00:00.000Z",
    "endDate": "2023-07-31T10:00:00.000Z",
    "status": "active"
  }
}
```

### POST /api/ads/:id/click
Track an ad click.

**Parameters:**
- `id` (string) - Ad campaign ID

**Response:**
```javascript
{
  "success": true,
  "message": "Click tracked successfully"
}
```

## Analytics Endpoints

### GET /api/ads/:id/analytics
Get analytics for a specific ad campaign.

**Parameters:**
- `id` (string) - Ad campaign ID

**Response:**
```javascript
{
  "success": true,
  "data": {
    "views": 150,
    "clicks": 25,
    "impressions": 500,
    "ctr": 5.0,
    "createdAt": "2023-07-01T10:00:00.000Z",
    "updatedAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### GET /api/ads/statistics
Get overall ad statistics (Admin only).

**Response:**
```javascript
{
  "success": true,
  "data": {
    "totalAds": 150,
    "adsByStatus": [
      {
        "_id": true,
        "count": 120
      },
      {
        "_id": false,
        "count": 30
      }
    ],
    "adsByCategory": [
      {
        "_id": "hardware_stores",
        "count": 45
      },
      {
        "_id": "suppliers",
        "count": 32
      }
      // ... more categories
    ],
    "totalViews": {
      "totalViews": 15000,
      "totalClicks": 2500
    },
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

### GET /api/ads/enum-values
Get valid enum values for ad creation.

**Response:**
```javascript
{
  "success": true,
  "data": {
    "types": ["banner", "sponsored_listing", "video", "text", "interactive"],
    "categories": ["hardware_stores", "suppliers", "training_schools", "services", "products"],
    "biddingStrategies": ["cpc", "cpm", "cpa", "fixed"],
    "statuses": ["draft", "pending", "approved", "active", "paused", "completed", "rejected"]
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
    "Title is required",
    "Invalid category specified",
    "Budget total must be a positive number"
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
  "message": "Not authorized to update this ad"
}
```

**404 Not Found:**
```javascript
{
  "success": false,
  "message": "Ad not found"
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
- **Analytics endpoints**: 50 requests per 15 minutes

## Caching

- **Featured ads**: Cached for 5 minutes
- **Categories**: Cached for 10 minutes
- **Statistics**: Cached for 1 hour
