# Supplies API Endpoints

## Overview

The Supplies API provides comprehensive endpoints for product management, order processing, and customer interactions. All endpoints follow RESTful conventions and return standardized JSON responses.

## 🔗 Base URL

```
/api/supplies
```

## 📋 Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": {}, // Response data (varies by endpoint)
  "count": 0, // Number of items returned (for list endpoints)
  "total": 0, // Total number of items available
  "page": 1, // Current page number
  "pages": 1, // Total number of pages
  "pagination": {} // Pagination metadata
}
```

## 🌐 Public Endpoints

### Get All Supplies

**GET** `/api/supplies`

Retrieve a paginated list of active supply items with filtering and sorting options.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `search` | string | Text search across name, description, and tags | - |
| `category` | string | Filter by product category | - |
| `location` | string | Filter by city name | - |
| `minPrice` | number | Minimum price filter | - |
| `maxPrice` | number | Maximum price filter | - |
| `page` | number | Page number for pagination | 1 |
| `limit` | number | Items per page | 10 |
| `sortBy` | string | Sort field (createdAt, price, rating) | createdAt |
| `sortOrder` | string | Sort direction (asc, desc) | desc |

#### Example Request

```http
GET /api/supplies?category=cleaning_supplies&minPrice=10&maxPrice=100&page=1&limit=20
```

#### Example Response

```json
{
  "success": true,
  "count": 15,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Cleaning Spray",
      "title": "Multi-Surface Cleaning Spray 32oz",
      "description": "Heavy-duty cleaning spray for all surfaces",
      "category": "cleaning_supplies",
      "subcategory": "sprays",
      "brand": "CleanPro",
      "sku": "CP-CS-32",
      "pricing": {
        "retailPrice": 12.99,
        "wholesalePrice": 9.99,
        "currency": "USD"
      },
      "inventory": {
        "quantity": 150,
        "minStock": 10,
        "maxStock": 500,
        "location": "Warehouse A"
      },
      "specifications": {
        "weight": "2.5 lbs",
        "dimensions": "8x3x12 inches",
        "material": "Plastic bottle",
        "color": "Blue",
        "warranty": "1 year"
      },
      "location": {
        "street": "123 Industrial Blvd",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94105",
        "country": "USA",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      },
      "images": [
        {
          "url": "https://res.cloudinary.com/example/image/upload/v1234567890/cleaning-spray.jpg",
          "publicId": "cleaning-spray",
          "thumbnail": "https://res.cloudinary.com/example/image/upload/w_200,h_200/cleaning-spray.jpg",
          "alt": "Professional Cleaning Spray"
        }
      ],
      "tags": ["cleaning", "professional", "multi-surface"],
      "isActive": true,
      "isFeatured": false,
      "views": 45,
      "isSubscriptionEligible": true,
      "averageRating": 4.5,
      "supplier": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Supplier",
        "profile": {
          "avatar": "https://example.com/avatar.jpg",
          "rating": 4.8
        }
      },
      "createdAt": "2023-07-01T10:00:00.000Z",
      "updatedAt": "2023-07-01T10:00:00.000Z"
    }
  ]
}
```

### Get Single Supply

**GET** `/api/supplies/:id`

Retrieve detailed information about a specific supply item.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ObjectId |

#### Example Request

```http
GET /api/supplies/64a1b2c3d4e5f6789012345
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Cleaning Spray",
    "title": "Multi-Surface Cleaning Spray 32oz",
    "description": "Heavy-duty cleaning spray for all surfaces...",
    "category": "cleaning_supplies",
    "subcategory": "sprays",
    "brand": "CleanPro",
    "sku": "CP-CS-32",
    "pricing": {
      "retailPrice": 12.99,
      "wholesalePrice": 9.99,
      "currency": "USD"
    },
    "inventory": {
      "quantity": 150,
      "minStock": 10,
      "maxStock": 500,
      "location": "Warehouse A"
    },
    "specifications": {
      "weight": "2.5 lbs",
      "dimensions": "8x3x12 inches",
      "material": "Plastic bottle",
      "color": "Blue",
      "warranty": "1 year"
    },
    "location": {
      "street": "123 Industrial Blvd",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "USA",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      }
    },
    "images": [
      {
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/cleaning-spray.jpg",
        "publicId": "cleaning-spray",
        "thumbnail": "https://res.cloudinary.com/example/image/upload/w_200,h_200/cleaning-spray.jpg",
        "alt": "Professional Cleaning Spray"
      }
    ],
    "tags": ["cleaning", "professional", "multi-surface"],
    "isActive": true,
    "isFeatured": false,
    "views": 46,
    "isSubscriptionEligible": true,
    "orders": [
      {
        "_id": "64a1b2c3d4e5f6789012347",
        "user": {
          "_id": "64a1b2c3d4e5f6789012348",
          "firstName": "Jane",
          "lastName": "Customer",
          "profile": {
            "avatar": "https://example.com/avatar2.jpg"
          }
        },
        "quantity": 5,
        "totalCost": 64.95,
        "deliveryAddress": {
          "street": "456 Customer St",
          "city": "San Francisco",
          "state": "CA",
          "zipCode": "94102",
          "country": "USA"
        },
        "specialInstructions": "Leave at front door",
        "contactInfo": {
          "phone": "+1-555-0123",
          "email": "jane@example.com"
        },
        "status": "delivered",
        "createdAt": "2023-07-01T14:30:00.000Z",
        "updatedAt": "2023-07-02T09:15:00.000Z"
      }
    ],
    "reviews": [
      {
        "_id": "64a1b2c3d4e5f6789012349",
        "user": {
          "_id": "64a1b2c3d4e5f6789012348",
          "firstName": "Jane",
          "lastName": "Customer",
          "profile": {
            "avatar": "https://example.com/avatar2.jpg"
          }
        },
        "rating": 5,
        "comment": "Excellent cleaning power, highly recommend!",
        "createdAt": "2023-07-03T10:00:00.000Z"
      }
    ],
    "averageRating": 4.5,
    "supplier": {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Supplier",
      "profile": {
        "avatar": "https://example.com/avatar.jpg",
        "bio": "Professional cleaning supplies supplier",
        "rating": 4.8
      }
    },
    "createdAt": "2023-07-01T10:00:00.000Z",
    "updatedAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### Get Supply Categories

**GET** `/api/supplies/categories`

Retrieve available product categories with item counts.

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "cleaning_supplies",
      "count": 45
    },
    {
      "_id": "tools",
      "count": 32
    },
    {
      "_id": "materials",
      "count": 28
    },
    {
      "_id": "equipment",
      "count": 15
    }
  ]
}
```

### Get Featured Supplies

**GET** `/api/supplies/featured`

Retrieve featured supply items.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | number | Maximum number of items to return | 10 |

#### Example Response

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Cleaning Spray",
      "title": "Multi-Surface Cleaning Spray 32oz",
      "isFeatured": true,
      "pricing": {
        "retailPrice": 12.99,
        "currency": "USD"
      },
      "supplier": {
        "firstName": "John",
        "lastName": "Supplier",
        "profile": {
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    }
  ]
}
```

### Get Nearby Supplies

**GET** `/api/supplies/nearby`

Find supply items within a specified radius of given coordinates.

#### Query Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `lat` | number | Latitude coordinate | Yes |
| `lng` | number | Longitude coordinate | Yes |
| `radius` | number | Search radius in kilometers | No (default: 10) |
| `page` | number | Page number | No (default: 1) |
| `limit` | number | Items per page | No (default: 10) |

#### Example Request

```http
GET /api/supplies/nearby?lat=37.7749&lng=-122.4194&radius=5&limit=20
```

#### Example Response

```json
{
  "success": true,
  "count": 8,
  "total": 8,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Cleaning Spray",
      "title": "Multi-Surface Cleaning Spray 32oz",
      "location": {
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      },
      "supplier": {
        "firstName": "John",
        "lastName": "Supplier",
        "profile": {
          "avatar": "https://example.com/avatar.jpg",
          "rating": 4.8
        }
      }
    }
  ]
}
```

## 🔐 Protected Endpoints

### Create Supply

**POST** `/api/supplies`

Create a new supply item (Supplier/Admin only).

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Request Body

```json
{
  "name": "Professional Cleaning Spray",
  "title": "Multi-Surface Cleaning Spray 32oz",
  "description": "Heavy-duty cleaning spray for all surfaces",
  "category": "cleaning_supplies",
  "subcategory": "sprays",
  "brand": "CleanPro",
  "sku": "CP-CS-32",
  "pricing": {
    "retailPrice": 12.99,
    "wholesalePrice": 9.99,
    "currency": "USD"
  },
  "inventory": {
    "quantity": 150,
    "minStock": 10,
    "maxStock": 500,
    "location": "Warehouse A"
  },
  "specifications": {
    "weight": "2.5 lbs",
    "dimensions": "8x3x12 inches",
    "material": "Plastic bottle",
    "color": "Blue",
    "warranty": "1 year"
  },
  "location": {
    "street": "123 Industrial Blvd",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "USA"
  },
  "tags": ["cleaning", "professional", "multi-surface"],
  "isSubscriptionEligible": true
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Supply item created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Cleaning Spray",
    "title": "Multi-Surface Cleaning Spray 32oz",
    "supplier": "64a1b2c3d4e5f6789012346",
    "createdAt": "2023-07-01T10:00:00.000Z"
  }
}
```

### Update Supply

**PUT** `/api/supplies/:id`

Update an existing supply item (Supplier/Admin only).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ObjectId |

#### Request Body

Same as create supply, but all fields are optional.

#### Example Response

```json
{
  "success": true,
  "message": "Supply item updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Updated Cleaning Spray",
    "updatedAt": "2023-07-01T15:30:00.000Z"
  }
}
```

### Delete Supply

**DELETE** `/api/supplies/:id`

Soft delete a supply item (Supplier/Admin only).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ObjectId |

#### Example Response

```json
{
  "success": true,
  "message": "Supply item deleted successfully"
}
```

### Upload Supply Images

**POST** `/api/supplies/:id/images`

Upload images for a supply item (Supplier/Admin only).

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### Request Body

Form data with image files.

#### Example Response

```json
{
  "success": true,
  "message": "2 image(s) uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/cleaning-spray-1.jpg",
      "publicId": "cleaning-spray-1"
    },
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/cleaning-spray-2.jpg",
      "publicId": "cleaning-spray-2"
    }
  ]
}
```

### Delete Supply Image

**DELETE** `/api/supplies/:id/images/:imageId`

Delete a specific image from a supply item (Supplier/Admin only).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ObjectId |
| `imageId` | string | Image ObjectId |

#### Example Response

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Order Supply

**POST** `/api/supplies/:id/order`

Place an order for a supply item.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Request Body

```json
{
  "quantity": 5,
  "deliveryAddress": {
    "street": "456 Customer St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  },
  "specialInstructions": "Leave at front door",
  "contactInfo": {
    "phone": "+1-555-0123",
    "email": "jane@example.com"
  }
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Supply item ordered successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "user": "64a1b2c3d4e5f6789012348",
    "quantity": 5,
    "totalCost": 64.95,
    "status": "pending",
    "createdAt": "2023-07-01T14:30:00.000Z"
  }
}
```

### Update Order Status

**PUT** `/api/supplies/:id/orders/:orderId/status`

Update the status of an order (Supplier/Admin only).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Product ObjectId |
| `orderId` | string | Order ObjectId |

#### Request Body

```json
{
  "status": "confirmed"
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "status": "confirmed",
    "updatedAt": "2023-07-01T15:00:00.000Z"
  }
}
```

### Add Supply Review

**POST** `/api/supplies/:id/reviews`

Add a review for a supply item.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Request Body

```json
{
  "rating": 5,
  "comment": "Excellent cleaning power, highly recommend!"
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012349",
    "user": "64a1b2c3d4e5f6789012348",
    "rating": 5,
    "comment": "Excellent cleaning power, highly recommend!",
    "createdAt": "2023-07-03T10:00:00.000Z"
  }
}
```

### Get My Supplies

**GET** `/api/supplies/my-supplies`

Get supplies created by the authenticated user.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page | 10 |

#### Example Response

```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Cleaning Spray",
      "title": "Multi-Surface Cleaning Spray 32oz",
      "category": "cleaning_supplies",
      "pricing": {
        "retailPrice": 12.99,
        "currency": "USD"
      },
      "inventory": {
        "quantity": 150
      },
      "isActive": true,
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  ]
}
```

### Get My Supply Orders

**GET** `/api/supplies/my-orders`

Get orders placed by the authenticated user.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page | 10 |

#### Example Response

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012347",
      "user": "64a1b2c3d4e5f6789012348",
      "quantity": 5,
      "totalCost": 64.95,
      "deliveryAddress": {
        "street": "456 Customer St",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102",
        "country": "USA"
      },
      "status": "delivered",
      "createdAt": "2023-07-01T14:30:00.000Z",
      "supply": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Multi-Surface Cleaning Spray 32oz",
        "supplier": {
          "_id": "64a1b2c3d4e5f6789012346",
          "firstName": "John",
          "lastName": "Supplier"
        }
      }
    }
  ]
}
```

## 🔧 Admin Endpoints

### Get Supply Statistics

**GET** `/api/supplies/statistics`

Get comprehensive statistics about supplies (Admin only).

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "totalSupplies": 150,
    "suppliesByCategory": [
      {
        "_id": "cleaning_supplies",
        "count": 45
      },
      {
        "_id": "tools",
        "count": 32
      },
      {
        "_id": "materials",
        "count": 28
      },
      {
        "_id": "equipment",
        "count": 15
      }
    ],
    "totalOrders": 1250,
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
    ]
  }
}
```

## ❌ Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid supply ID format"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Not authorized to update this supply item"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Supply item not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Server error"
}
```

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- ObjectIds are 24-character hexadecimal strings
- Image URLs are Cloudinary CDN links
- Geocoding is automatically performed for location fields
- View counts are incremented on each product view
- Order status updates trigger email notifications
- Inventory is automatically updated when orders are completed

---

*For implementation examples and best practices, see the usage-examples.md file.*
