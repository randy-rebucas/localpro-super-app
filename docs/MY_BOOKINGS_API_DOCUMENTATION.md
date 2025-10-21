# My Bookings API Documentation

## Overview

The My Bookings API endpoint allows authenticated users to retrieve all bookings they are involved in, either as a client or as a provider. This endpoint is designed for the frontend "my-bookings" page where users can view and manage their booking history.

## Endpoint

**GET** `/api/marketplace/my-bookings`

## Authentication

This endpoint requires Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by booking status ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') |
| `type` | string | 'all' | Filter by user role ('all', 'client', 'provider') |
| `paymentStatus` | string | - | Filter by payment status ('pending', 'paid', 'refunded', 'failed') |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of bookings per page |
| `sortBy` | string | 'createdAt' | Field to sort by (createdAt, bookingDate, pricing.totalAmount) |
| `sortOrder` | string | 'desc' | Sort order ('asc' or 'desc') |
| `dateFrom` | string | - | Filter bookings from this date (ISO format) |
| `dateTo` | string | - | Filter bookings to this date (ISO format) |

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "booking_id",
        "service": {
          "_id": "service_id",
          "title": "Professional House Cleaning",
          "category": "cleaning",
          "subcategory": "residential_cleaning",
          "pricing": {
            "type": "hourly",
            "basePrice": 25,
            "currency": "USD"
          },
          "images": [
            {
              "url": "https://cloudinary.com/service.jpg",
              "publicId": "service_img_id",
              "thumbnail": "https://cloudinary.com/service_thumb.jpg",
              "alt": "Cleaning service"
            }
          ]
        },
        "client": {
          "_id": "client_id",
          "firstName": "Jane",
          "lastName": "Smith",
          "phoneNumber": "+1234567890",
          "email": "jane@example.com",
          "profile": {
            "avatar": {
              "url": "https://cloudinary.com/avatar.jpg",
              "publicId": "avatar_id",
              "thumbnail": "https://cloudinary.com/avatar_thumb.jpg"
            }
          }
        },
        "provider": {
          "_id": "provider_id",
          "firstName": "John",
          "lastName": "Doe",
          "phoneNumber": "+1234567891",
          "email": "john@example.com",
          "profile": {
            "avatar": {
              "url": "https://cloudinary.com/provider_avatar.jpg",
              "publicId": "provider_avatar_id",
              "thumbnail": "https://cloudinary.com/provider_avatar_thumb.jpg"
            }
          }
        },
        "bookingDate": "2024-01-20T14:00:00Z",
        "duration": 3,
        "address": {
          "street": "123 Main Street",
          "city": "Manila",
          "state": "NCR",
          "zipCode": "1000",
          "country": "Philippines",
          "coordinates": {
            "lat": 14.5995,
            "lng": 120.9842
          }
        },
        "specialInstructions": "Please use eco-friendly products",
        "status": "confirmed",
        "pricing": {
          "basePrice": 25,
          "additionalFees": [
            {
              "description": "Eco-friendly products",
              "amount": 10
            }
          ],
          "totalAmount": 85,
          "currency": "USD"
        },
        "payment": {
          "status": "paid",
          "method": "paypal",
          "transactionId": "TXN123456789",
          "paypalOrderId": "ORDER123456789",
          "paypalTransactionId": "PAY123456789",
          "paidAt": "2024-01-15T10:30:00Z"
        },
        "review": {
          "rating": 5,
          "comment": "Excellent service! Very professional and thorough.",
          "createdAt": "2024-01-21T16:00:00Z",
          "categories": {
            "quality": 5,
            "timeliness": 5,
            "communication": 4,
            "value": 5
          },
          "wouldRecommend": true,
          "photos": [
            {
              "url": "https://cloudinary.com/review_photo.jpg",
              "publicId": "review_photo_id",
              "thumbnail": "https://cloudinary.com/review_photo_thumb.jpg"
            }
          ]
        },
        "communication": {
          "messages": [
            {
              "sender": "client_id",
              "message": "What time will you arrive?",
              "timestamp": "2024-01-19T09:00:00Z",
              "type": "text"
            },
            {
              "sender": "provider_id",
              "message": "I'll be there at 2 PM as scheduled",
              "timestamp": "2024-01-19T09:15:00Z",
              "type": "text"
            }
          ],
          "lastMessageAt": "2024-01-19T09:15:00Z"
        },
        "timeline": [
          {
            "status": "pending",
            "timestamp": "2024-01-15T10:00:00Z",
            "note": "Booking created",
            "updatedBy": "client_id"
          },
          {
            "status": "confirmed",
            "timestamp": "2024-01-15T11:00:00Z",
            "note": "Booking confirmed by provider",
            "updatedBy": "provider_id"
          }
        ],
        "documents": [
          {
            "name": "Service Agreement",
            "url": "https://cloudinary.com/agreement.pdf",
            "publicId": "agreement_id",
            "type": "pdf",
            "uploadedBy": "provider_id",
            "uploadedAt": "2024-01-15T12:00:00Z"
          }
        ],
        "beforePhotos": [
          {
            "url": "https://cloudinary.com/before.jpg",
            "publicId": "before_photo_id",
            "thumbnail": "https://cloudinary.com/before_thumb.jpg"
          }
        ],
        "afterPhotos": [
          {
            "url": "https://cloudinary.com/after.jpg",
            "publicId": "after_photo_id",
            "thumbnail": "https://cloudinary.com/after_thumb.jpg"
          }
        ],
        "completionNotes": "All areas cleaned thoroughly. Eco-friendly products used as requested.",
        "clientSatisfaction": {
          "rating": 5,
          "feedback": "Very satisfied with the service",
          "submittedAt": "2024-01-21T16:00:00Z"
        },
        "userRole": "client",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-21T16:00:00Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 45,
      "limit": 10
    },
    "stats": {
      "totalBookings": 45,
      "clientBookings": 30,
      "providerBookings": 15,
      "pendingBookings": 5,
      "confirmedBookings": 8,
      "completedBookings": 30,
      "cancelledBookings": 2,
      "totalEarnings": 2500.00,
      "totalSpent": 1800.00,
      "averageRating": 4.7
    }
  }
}
```

### Error Response (401)

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "Server error"
}
```

## Usage Examples

### Basic Request
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?status=completed" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filter by User Role
```bash
# Get only bookings where user is the client
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?type=client" \
  -H "Authorization: Bearer your-jwt-token"

# Get only bookings where user is the provider
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?type=provider" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filter by Payment Status
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?paymentStatus=paid" \
  -H "Authorization: Bearer your-jwt-token"
```

### Date Range Filtering
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "Authorization: Bearer your-jwt-token"
```

### Pagination
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?page=2&limit=5" \
  -H "Authorization: Bearer your-jwt-token"
```

### Sorting
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?sortBy=bookingDate&sortOrder=asc" \
  -H "Authorization: Bearer your-jwt-token"
```

### Combined Filters
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-bookings?type=provider&status=completed&paymentStatus=paid&page=1&limit=10&sortBy=pricing.totalAmount&sortOrder=desc" \
  -H "Authorization: Bearer your-jwt-token"
```

## Frontend Integration

### React/JavaScript Example

```javascript
// Fetch user's bookings
const fetchMyBookings = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/marketplace/my-bookings?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    throw error;
  }
};

// Usage examples
const loadMyBookings = async () => {
  try {
    // Get all bookings
    const allBookings = await fetchMyBookings();
    
    // Get only client bookings
    const clientBookings = await fetchMyBookings({ type: 'client' });
    
    // Get only provider bookings
    const providerBookings = await fetchMyBookings({ type: 'provider' });
    
    // Get completed bookings
    const completedBookings = await fetchMyBookings({ status: 'completed' });
    
    // Get bookings with pagination
    const paginatedBookings = await fetchMyBookings({ 
      page: 1, 
      limit: 10,
      sortBy: 'bookingDate',
      sortOrder: 'desc'
    });
    
    // Get bookings for specific date range
    const monthlyBookings = await fetchMyBookings({
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31'
    });
    
    console.log('My Bookings:', allBookings);
    console.log('Stats:', allBookings.stats);
  } catch (error) {
    console.error('Failed to load bookings:', error);
  }
};
```

### Vue.js Example

```javascript
// Vue.js component method
async fetchMyBookings() {
  try {
    this.loading = true;
    const response = await this.$http.get('/api/marketplace/my-bookings', {
      params: this.filters,
      headers: {
        'Authorization': `Bearer ${this.$store.state.auth.token}`
      }
    });
    
    if (response.data.success) {
      this.bookings = response.data.data.bookings;
      this.pagination = response.data.data.pagination;
      this.stats = response.data.data.stats;
    }
  } catch (error) {
    this.$toast.error('Failed to load bookings');
    console.error('Error:', error);
  } finally {
    this.loading = false;
  }
}
```

## Booking Statuses

The API supports filtering by the following booking statuses:

- `pending` - Booking created but not yet confirmed
- `confirmed` - Booking confirmed by provider
- `in_progress` - Service is currently being performed
- `completed` - Service has been completed
- `cancelled` - Booking has been cancelled

## Payment Statuses

The API supports filtering by the following payment statuses:

- `pending` - Payment is pending
- `paid` - Payment has been completed
- `refunded` - Payment has been refunded
- `failed` - Payment failed

## User Roles

The API distinguishes between different user roles in bookings:

- `client` - User who booked the service
- `provider` - User who provides the service

The `userRole` field in each booking indicates whether the current user is the client or provider for that specific booking.

## Statistics

The API returns comprehensive statistics about the user's bookings:

- **totalBookings**: Total number of bookings
- **clientBookings**: Number of bookings where user is the client
- **providerBookings**: Number of bookings where user is the provider
- **pendingBookings**: Number of pending bookings
- **confirmedBookings**: Number of confirmed bookings
- **completedBookings**: Number of completed bookings
- **cancelledBookings**: Number of cancelled bookings
- **totalEarnings**: Total earnings as a provider
- **totalSpent**: Total amount spent as a client
- **averageRating**: Average rating received

## Advanced Features

### Communication History
Each booking includes the complete communication history between client and provider, including messages, timestamps, and message types.

### Timeline Tracking
Bookings include a detailed timeline showing all status changes, who made the changes, and when they occurred.

### Document Management
Bookings can include uploaded documents such as service agreements, contracts, or other relevant files.

### Photo Documentation
Bookings support before and after photos for service documentation and review purposes.

### Review System
Comprehensive review system with category-based ratings and photo uploads.

## Error Handling

The API handles various error scenarios:

1. **Authentication Errors**: Returns 401 for invalid or missing tokens
2. **Validation Errors**: Returns 400 for invalid query parameters
3. **Server Errors**: Returns 500 for internal server errors

## Rate Limiting

This endpoint is subject to the same rate limiting as other API endpoints:
- 100 requests per 15 minutes per IP address

## Security

- All requests require valid JWT authentication
- Users can only access their own bookings
- Input validation and sanitization
- Audit logging for all requests

This API endpoint provides everything needed for a comprehensive "My Bookings" page in the frontend, allowing users to view, filter, and manage their booking history effectively.
