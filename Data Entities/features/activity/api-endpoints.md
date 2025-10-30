# Activity API Endpoints

## Overview

The Activity API provides comprehensive endpoints for managing activities, social interactions, and analytics in the LocalPro Super App. All endpoints follow RESTful conventions and return standardized response formats.

## Base URLs

```
/api/activities          # Activity endpoints
```

## Authentication

Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Admin endpoints require appropriate role permissions.

## Activity Feed Endpoints

### Get Activity Feed

Retrieve a paginated activity feed with filtering and personalization options.

```http
GET /api/activities/feed
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `types` (string, optional): Comma-separated activity types to filter
- `categories` (string, optional): Comma-separated categories to filter
- `visibility` (string, optional): Visibility level (public, connections, followers)
- `includeOwn` (boolean, optional): Include user's own activities (default: true)
- `timeframe` (string, optional): Timeframe filter (1h, 1d, 7d, 30d, 90d, default: 7d)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "type": "service_created",
        "category": "marketplace",
        "action": "Created new service",
        "description": "John Doe created a new cleaning service",
        "targetEntity": {
          "type": "service",
          "id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "name": "Professional Cleaning Service",
          "url": "/services/60f7b3b3b3b3b3b3b3b3b3b4"
        },
        "relatedEntities": [
          {
            "type": "user",
            "id": "60f7b3b3b3b3b3b3b3b3b3b5",
            "name": "Jane Smith",
            "role": "client"
          }
        ],
        "location": {
          "type": "Point",
          "coordinates": [-122.4194, 37.7749],
          "address": "123 Main St, San Francisco, CA",
          "city": "San Francisco",
          "country": "USA"
        },
        "metadata": {
          "ipAddress": "192.168.1.1",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "device": "desktop",
          "browser": "Chrome",
          "os": "Windows 10",
          "appVersion": "1.0.0",
          "sessionId": "sess_1234567890",
          "requestId": "req_1234567890"
        },
        "visibility": "public",
        "isVisible": true,
        "tags": ["cleaning", "professional", "new"],
        "impact": "medium",
        "points": 15,
        "analytics": {
          "views": 25,
          "likes": 8,
          "shares": 3,
          "comments": 2
        },
        "interactions": [
          {
            "user": "60f7b3b3b3b3b3b3b3b3b3b6",
            "type": "like",
            "timestamp": "2023-09-20T10:30:00.000Z",
            "metadata": {
              "source": "mobile_app"
            }
          }
        ],
        "age": "2h ago",
        "summary": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "type": "service_created",
          "action": "Created new service",
          "description": "John Doe created a new cleaning service",
          "age": "2h ago",
          "points": 15,
          "impact": "medium",
          "targetEntity": {
            "type": "service",
            "id": "60f7b3b3b3b3b3b3b3b3b3b4",
            "name": "Professional Cleaning Service"
          },
          "analytics": {
            "views": 25,
            "likes": 8,
            "shares": 3,
            "comments": 2
          }
        },
        "user": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
          },
          "role": "provider"
        },
        "createdAt": "2023-09-20T08:30:00.000Z",
        "updatedAt": "2023-09-20T08:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get My Activities

Retrieve the current user's activities with filtering options.

```http
GET /api/activities/my
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `types` (string, optional): Comma-separated activity types to filter
- `categories` (string, optional): Comma-separated categories to filter
- `timeframe` (string, optional): Timeframe filter (1h, 1d, 7d, 30d, 90d, default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "type": "service_created",
        "category": "marketplace",
        "action": "Created new service",
        "description": "You created a new cleaning service",
        "targetEntity": {
          "type": "service",
          "id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "name": "Professional Cleaning Service"
        },
        "visibility": "public",
        "isVisible": true,
        "impact": "medium",
        "points": 15,
        "analytics": {
          "views": 25,
          "likes": 8,
          "shares": 3,
          "comments": 2
        },
        "createdAt": "2023-09-20T08:30:00.000Z",
        "updatedAt": "2023-09-20T08:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 50,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get User Activities

Retrieve activities for a specific user (admin or public activities only).

```http
GET /api/activities/user/:userId
```

**Path Parameters:**
- `userId` (string, required): User ID to get activities for

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `types` (string, optional): Comma-separated activity types to filter
- `categories` (string, optional): Comma-separated categories to filter
- `timeframe` (string, optional): Timeframe filter (1h, 1d, 7d, 30d, 90d, default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "type": "service_created",
        "category": "marketplace",
        "action": "Created new service",
        "description": "John Doe created a new cleaning service",
        "targetEntity": {
          "type": "service",
          "id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "name": "Professional Cleaning Service"
        },
        "visibility": "public",
        "isVisible": true,
        "impact": "medium",
        "points": 15,
        "analytics": {
          "views": 25,
          "likes": 8,
          "shares": 3,
          "comments": 2
        },
        "createdAt": "2023-09-20T08:30:00.000Z",
        "updatedAt": "2023-09-20T08:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 30,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Activity Management Endpoints

### Get Single Activity

Retrieve detailed information about a specific activity.

```http
GET /api/activities/:id
```

**Path Parameters:**
- `id` (string, required): Activity ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "service_created",
    "category": "marketplace",
    "action": "Created new service",
    "description": "John Doe created a new cleaning service",
    "details": {
      "serviceType": "cleaning",
      "price": 99.99,
      "duration": "2 hours"
    },
    "targetEntity": {
      "type": "service",
      "id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "Professional Cleaning Service",
      "url": "/services/60f7b3b3b3b3b3b3b3b3b3b4"
    },
    "relatedEntities": [
      {
        "type": "user",
        "id": "60f7b3b3b3b3b3b3b3b3b3b5",
        "name": "Jane Smith",
        "role": "client"
      }
    ],
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749],
      "address": "123 Main St, San Francisco, CA",
      "city": "San Francisco",
      "country": "USA"
    },
    "metadata": {
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "device": "desktop",
      "browser": "Chrome",
      "os": "Windows 10",
      "appVersion": "1.0.0",
      "sessionId": "sess_1234567890",
      "requestId": "req_1234567890"
    },
    "visibility": "public",
    "isVisible": true,
    "tags": ["cleaning", "professional", "new"],
    "impact": "medium",
    "points": 15,
    "analytics": {
      "views": 26,
      "likes": 8,
      "shares": 3,
      "comments": 2
    },
    "interactions": [
      {
        "user": {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@example.com",
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar2.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar2.jpg"
          }
        },
        "type": "like",
        "timestamp": "2023-09-20T10:30:00.000Z",
        "metadata": {
          "source": "mobile_app"
        }
      }
    ],
    "age": "2h ago",
    "summary": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "type": "service_created",
      "action": "Created new service",
      "description": "John Doe created a new cleaning service",
      "age": "2h ago",
      "points": 15,
      "impact": "medium",
      "targetEntity": {
        "type": "service",
        "id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "Professional Cleaning Service"
      },
      "analytics": {
        "views": 26,
        "likes": 8,
        "shares": 3,
        "comments": 2
      }
    },
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "avatar": {
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
        "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
      },
      "role": "provider"
    },
    "createdAt": "2023-09-20T08:30:00.000Z",
    "updatedAt": "2023-09-20T08:30:00.000Z"
  }
}
```

### Create Activity

Create a new activity.

```http
POST /api/activities
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "service_created",
  "action": "Created new service",
  "description": "John Doe created a new cleaning service",
  "details": {
    "serviceType": "cleaning",
    "price": 99.99,
    "duration": "2 hours"
  },
  "targetEntity": {
    "type": "service",
    "id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "name": "Professional Cleaning Service",
    "url": "/services/60f7b3b3b3b3b3b3b3b3b3b4"
  },
  "relatedEntities": [
    {
      "type": "user",
      "id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "name": "Jane Smith",
      "role": "client"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749],
    "address": "123 Main St, San Francisco, CA",
    "city": "San Francisco",
    "country": "USA"
  },
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "device": "desktop",
    "browser": "Chrome",
    "os": "Windows 10",
    "appVersion": "1.0.0",
    "sessionId": "sess_1234567890",
    "requestId": "req_1234567890"
  },
  "visibility": "public",
  "tags": ["cleaning", "professional", "new"],
  "impact": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "service_created",
    "category": "marketplace",
    "action": "Created new service",
    "description": "John Doe created a new cleaning service",
    "details": {
      "serviceType": "cleaning",
      "price": 99.99,
      "duration": "2 hours"
    },
    "targetEntity": {
      "type": "service",
      "id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "Professional Cleaning Service",
      "url": "/services/60f7b3b3b3b3b3b3b3b3b3b4"
    },
    "relatedEntities": [
      {
        "type": "user",
        "id": "60f7b3b3b3b3b3b3b3b3b3b5",
        "name": "Jane Smith",
        "role": "client"
      }
    ],
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749],
      "address": "123 Main St, San Francisco, CA",
      "city": "San Francisco",
      "country": "USA"
    },
    "metadata": {
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "device": "desktop",
      "browser": "Chrome",
      "os": "Windows 10",
      "appVersion": "1.0.0",
      "sessionId": "sess_1234567890",
      "requestId": "req_1234567890"
    },
    "visibility": "public",
    "isVisible": true,
    "tags": ["cleaning", "professional", "new"],
    "impact": "medium",
    "points": 15,
    "analytics": {
      "views": 0,
      "likes": 0,
      "shares": 0,
      "comments": 0
    },
    "interactions": [],
    "user": "60f7b3b3b3b3b3b3b3b3b3b5",
    "createdAt": "2023-09-20T08:30:00.000Z",
    "updatedAt": "2023-09-20T08:30:00.000Z"
  }
}
```

### Update Activity

Update an existing activity.

```http
PUT /api/activities/:id
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Activity ID

**Request Body:**
```json
{
  "action": "Updated service",
  "description": "John Doe updated the cleaning service",
  "details": {
    "serviceType": "cleaning",
    "price": 119.99,
    "duration": "3 hours"
  },
  "visibility": "public",
  "tags": ["cleaning", "professional", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "service_created",
    "category": "marketplace",
    "action": "Updated service",
    "description": "John Doe updated the cleaning service",
    "details": {
      "serviceType": "cleaning",
      "price": 119.99,
      "duration": "3 hours"
    },
    "visibility": "public",
    "tags": ["cleaning", "professional", "updated"],
    "updatedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### Delete Activity

Delete an activity (soft delete).

```http
DELETE /api/activities/:id
Authorization: Bearer <user_token>
```

**Path Parameters:**
- `id` (string, required): Activity ID

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

## Interaction Endpoints

### Add Interaction

Add an interaction (like, share, comment, bookmark) to an activity.

```http
POST /api/activities/:id/interactions
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Activity ID

**Request Body:**
```json
{
  "type": "like",
  "metadata": {
    "source": "mobile_app",
    "timestamp": "2023-09-20T10:30:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interaction added successfully",
  "data": {
    "interactionType": "like",
    "analytics": {
      "views": 26,
      "likes": 9,
      "shares": 3,
      "comments": 2
    }
  }
}
```

### Remove Interaction

Remove an interaction from an activity.

```http
DELETE /api/activities/:id/interactions
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required): Activity ID

**Request Body:**
```json
{
  "type": "like"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interaction removed successfully",
  "data": {
    "interactionType": "like",
    "analytics": {
      "views": 26,
      "likes": 8,
      "shares": 3,
      "comments": 2
    }
  }
}
```

## Analytics Endpoints

### Get My Activity Statistics

Get activity statistics for the current user.

```http
GET /api/activities/stats/my
Authorization: Bearer <user_token>
```

**Query Parameters:**
- `timeframe` (string, optional): Timeframe filter (1h, 1d, 7d, 30d, 90d, default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "stats": {
      "totalActivities": 150,
      "totalPoints": 1250,
      "categoryBreakdown": {
        "marketplace": 45,
        "academy": 30,
        "job_board": 25,
        "financial": 20,
        "communication": 15,
        "other": 15
      },
      "typeBreakdown": {
        "service_created": 20,
        "service_updated": 15,
        "booking_created": 10,
        "course_enrolled": 25,
        "course_completed": 5,
        "job_applied": 15,
        "payment_made": 20,
        "message_sent": 15,
        "other": 25
      }
    }
  }
}
```

### Get Global Activity Statistics

Get global activity statistics (admin only).

```http
GET /api/activities/stats/global
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `timeframe` (string, optional): Timeframe filter (1h, 1d, 7d, 30d, 90d, default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "stats": {
      "totalActivities": 15000,
      "totalPoints": 125000,
      "uniqueUserCount": 2500,
      "categoryBreakdown": {
        "marketplace": 4500,
        "academy": 3000,
        "job_board": 2500,
        "financial": 2000,
        "communication": 1500,
        "other": 1500
      },
      "typeBreakdown": {
        "service_created": 2000,
        "service_updated": 1500,
        "booking_created": 1000,
        "course_enrolled": 2500,
        "course_completed": 500,
        "job_applied": 1500,
        "payment_made": 2000,
        "message_sent": 1500,
        "other": 2500
      }
    }
  }
}
```

## Metadata Endpoints

### Get Activity Metadata

Get available activity types, categories, and other metadata.

```http
GET /api/activities/metadata
```

**Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      "user_login", "user_logout", "user_register", "profile_update", "avatar_upload",
      "password_change", "email_verification", "phone_verification",
      "service_created", "service_updated", "service_deleted", "service_published",
      "service_viewed", "service_favorited", "service_shared",
      "booking_created", "booking_accepted", "booking_rejected", "booking_completed",
      "booking_cancelled", "booking_rescheduled",
      "review_created", "review_updated", "review_deleted",
      "job_created", "job_updated", "job_deleted", "job_published", "job_closed",
      "job_applied", "job_application_withdrawn", "job_application_approved",
      "job_application_rejected", "job_application_shortlisted",
      "course_created", "course_updated", "course_deleted", "course_published",
      "course_enrolled", "course_completed", "course_progress_updated",
      "course_review_created", "certificate_earned",
      "payment_made", "payment_received", "payment_failed", "payment_refunded",
      "withdrawal_requested", "withdrawal_approved", "withdrawal_rejected",
      "invoice_created", "invoice_paid", "invoice_overdue",
      "message_sent", "message_received", "conversation_started",
      "notification_sent", "notification_read", "email_sent",
      "agency_joined", "agency_left", "agency_created", "agency_updated",
      "provider_added", "provider_removed", "provider_status_updated",
      "referral_sent", "referral_accepted", "referral_completed",
      "referral_reward_earned", "referral_invitation_sent",
      "verification_requested", "verification_approved", "verification_rejected",
      "document_uploaded", "document_verified", "badge_earned",
      "supply_created", "supply_ordered", "supply_delivered", "supply_reviewed",
      "rental_created", "rental_booked", "rental_returned", "rental_reviewed",
      "ad_created", "ad_updated", "ad_published", "ad_clicked", "ad_promoted",
      "settings_updated", "preferences_changed", "subscription_created",
      "subscription_cancelled", "subscription_renewed",
      "connection_made", "connection_removed", "follow_started", "follow_stopped",
      "content_liked", "content_shared", "content_commented",
      "search_performed", "filter_applied", "export_requested", "report_generated"
    ],
    "categories": [
      "authentication", "profile", "marketplace", "job_board", "academy",
      "financial", "communication", "agency", "referral", "verification",
      "supplies", "rentals", "advertising", "system", "social", "other"
    ],
    "impactLevels": ["low", "medium", "high", "critical"],
    "visibilityLevels": ["public", "private", "connections", "followers"],
    "timeframes": ["1h", "1d", "7d", "30d", "90d"]
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Type, action, and description are required"
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
  "message": "Access denied to this activity"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Activity not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to retrieve activity feed"
}
```

## Rate Limiting

- **Activity Creation**: 100 requests per hour per user
- **Activity Feed**: 200 requests per hour per user
- **Interactions**: 500 requests per hour per user
- **Statistics**: 50 requests per hour per user

## Validation Rules

### Activity Creation Validation
- **Type**: Required, must be one of the defined activity types
- **Action**: Required, maximum 100 characters
- **Description**: Required, maximum 500 characters
- **Visibility**: Must be one of the defined visibility levels
- **Impact**: Must be one of the defined impact levels

### Interaction Validation
- **Type**: Required, must be one of: view, like, share, comment, bookmark
- **Metadata**: Optional, flexible object for additional data

## Examples

### Complete Activity Flow

```javascript
// 1. Create activity
const createActivity = async (activityData) => {
  const response = await fetch('/api/activities', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(activityData)
  });
  
  return await response.json();
};

// 2. Get activity feed
const getActivityFeed = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/activities/feed?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// 3. Add interaction
const addInteraction = async (activityId, type, metadata = {}) => {
  const response = await fetch(`/api/activities/${activityId}/interactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type, metadata })
  });
  
  return await response.json();
};

// 4. Get statistics
const getActivityStats = async (timeframe = '30d') => {
  const response = await fetch(`/api/activities/stats/my?timeframe=${timeframe}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

### Activity Feed with Filtering

```javascript
// Get marketplace activities from the last 7 days
const getMarketplaceActivities = async () => {
  const response = await fetch('/api/activities/feed?categories=marketplace&timeframe=7d&limit=50', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Get my activities from the last 30 days
const getMyActivities = async () => {
  const response = await fetch('/api/activities/my?timeframe=30d&limit=100', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

This comprehensive API provides all the functionality needed for a robust activity tracking and social engagement system.
