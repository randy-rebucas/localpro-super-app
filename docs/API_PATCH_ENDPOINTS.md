# PATCH Endpoints Documentation

This document covers all PATCH endpoints for partial updates to Agency, Instructor (Course), and Supplier (Product) resources.

---

## Table of Contents

1. [Agency PATCH Endpoint](#agency-patch-endpoint)
2. [Instructor Course PATCH Endpoint](#instructor-course-patch-endpoint)
3. [Supplier Product PATCH Endpoint](#supplier-product-patch-endpoint)

---

## Agency PATCH Endpoint

### Overview

The PATCH endpoint allows partial updates to an agency profile. Only the fields you specify will be updated, with deep merging for nested objects.

**Endpoint:** `PATCH /api/agencies/:id`  
**Authentication:** Required (Bearer Token)  
**Authorization:** User must be agency owner, admin, or provider with access

### Request

#### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String (ObjectId) | Agency ID |

#### Request Body

All fields are optional. Only send the fields you want to update.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | String | Agency name | 2-100 characters |
| `description` | String | Agency description | Max 500 characters |
| `contact` | Object | Contact information (deep merge) | See Contact Object below |
| `business` | Object | Business information (deep merge) | See Business Object below |
| `serviceAreas` | Array | Service areas | Array of service area objects |
| `services` | Array | Services offered | Array of service objects |
| `subscription` | Object | Subscription details (deep merge) | See Subscription Object below |
| `verification` | Object | Verification details (deep merge) | See Verification Object below |
| `analytics` | Object | Analytics data (deep merge) | See Analytics Object below |
| `settings` | Object | Agency settings (deep merge) | See Settings Object below |
| `isActive` | Boolean | Active status | true/false |

#### Contact Object

```json
{
  "contact": {
    "email": "contact@agency.com",
    "phone": "+1234567890",
    "website": "https://agency.com",
    "address": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zipCode": "12345",
      "country": "Country",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    }
  }
}
```

#### Business Object

```json
{
  "business": {
    "type": "sole_proprietorship" | "partnership" | "corporation" | "llc" | "nonprofit",
    "registrationNumber": "REG123456",
    "taxId": "TAX123456",
    "licenseNumber": "LIC123456",
    "insurance": {
      "provider": "Insurance Co",
      "policyNumber": "POL123456",
      "coverageAmount": 1000000,
      "expiryDate": "2025-12-31T00:00:00.000Z"
    }
  }
}
```

#### Settings Object

```json
{
  "settings": {
    "autoApproveProviders": true | false,
    "requireProviderVerification": true | false,
    "defaultCommissionRate": 10,
    "notificationPreferences": {
      "email": {
        "newBookings": true | false,
        "providerUpdates": true | false,
        "paymentUpdates": true | false
      },
      "sms": {
        "newBookings": true | false,
        "urgentUpdates": true | false
      }
    }
  }
}
```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Agency updated successfully",
  "data": {
    "agency": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Agency Name",
      "description": "Agency description",
      "owner": { /* populated User */ },
      "contact": { /* ... */ },
      "business": { /* ... */ },
      "settings": { /* ... */ },
      "createdAt": "2025-01-30T00:00:00.000Z",
      "updatedAt": "2025-01-30T00:00:00.000Z"
    },
    "updatedFields": ["name", "contact", "settings"]
  }
}
```

### Examples

**Update Agency Name and Contact Email:**

```http
PATCH /api/agencies/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Agency Name",
  "contact": {
    "email": "newemail@agency.com"
  }
}
```

**Update Settings Only:**

```http
PATCH /api/agencies/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "autoApproveProviders": true,
    "defaultCommissionRate": 15
  }
}
```

---

## Instructor Course PATCH Endpoint

### Overview

The PATCH endpoint allows partial updates to a course. Only instructors who own the course or admins can update it.

**Endpoint:** `PATCH /api/academy/courses/:id`  
**Authentication:** Required (Bearer Token)  
**Authorization:** User must be the course instructor or admin

### Request

#### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String (ObjectId) | Course ID |

#### Request Body

All fields are optional. Only send the fields you want to update.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `title` | String | Course title | Required if provided |
| `description` | String | Course description | Required if provided |
| `category` | String/ObjectId | Course category | Must be valid category ID or name |
| `level` | String | Course level | Enum: `beginner`, `intermediate`, `advanced`, `expert` |
| `duration` | Object | Course duration (deep merge) | See Duration Object below |
| `pricing` | Object | Pricing information (deep merge) | See Pricing Object below |
| `curriculum` | Array | Course curriculum | Array of module objects |
| `prerequisites` | Array | Prerequisites | Array of strings |
| `learningOutcomes` | Array | Learning outcomes | Array of strings |
| `certification` | Object | Certification details (deep merge) | See Certification Object below |
| `enrollment` | Object | Enrollment settings (deep merge) | See Enrollment Object below |
| `schedule` | Object | Course schedule (deep merge) | See Schedule Object below |
| `thumbnail` | Object | Thumbnail image (deep merge) | See Thumbnail Object below |
| `tags` | Array | Course tags | Array of strings |
| `isActive` | Boolean | Active status | true/false |

#### Duration Object

```json
{
  "duration": {
    "hours": 40,
    "weeks": 8
  }
}
```

#### Pricing Object

```json
{
  "pricing": {
    "regularPrice": 299,
    "discountedPrice": 199,
    "currency": "PHP"
  }
}
```

#### Enrollment Object

```json
{
  "enrollment": {
    "maxCapacity": 50,
    "isOpen": true
  }
}
```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "course": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Course Title",
      "description": "Course description",
      "instructor": { /* populated User */ },
      "category": { /* populated AcademyCategory */ },
      "level": "intermediate",
      "pricing": { /* ... */ },
      "createdAt": "2025-01-30T00:00:00.000Z",
      "updatedAt": "2025-01-30T00:00:00.000Z"
    },
    "updatedFields": ["title", "pricing", "level"]
  }
}
```

### Examples

**Update Course Title and Level:**

```http
PATCH /api/academy/courses/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced Web Development",
  "level": "advanced"
}
```

**Update Pricing Only:**

```http
PATCH /api/academy/courses/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "pricing": {
    "regularPrice": 399,
    "discountedPrice": 299
  }
}
```

**Update Enrollment Capacity:**

```http
PATCH /api/academy/courses/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "enrollment": {
    "maxCapacity": 100,
    "isOpen": true
  }
}
```

---

## Supplier Product PATCH Endpoint

### Overview

The PATCH endpoint allows partial updates to a product/supply item. Only suppliers who own the product or admins can update it.

**Endpoint:** `PATCH /api/supplies/:id`  
**Authentication:** Required (Bearer Token)  
**Authorization:** User must be the product supplier or admin

### Request

#### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String (ObjectId) | Product/Supply ID |

#### Request Body

All fields are optional. Only send the fields you want to update.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | String | Product name | Required if provided |
| `title` | String | Product title | Required if provided |
| `description` | String | Product description | Required if provided |
| `category` | String | Product category | Enum: `cleaning_supplies`, `tools`, `materials`, `equipment` |
| `subcategory` | String | Product subcategory | Required if category provided |
| `brand` | String | Product brand | Required if provided |
| `sku` | String | SKU code | Unique, required if provided |
| `pricing` | Object | Pricing information (deep merge) | See Pricing Object below |
| `inventory` | Object | Inventory details (deep merge) | See Inventory Object below |
| `specifications` | Object | Product specifications (deep merge) | See Specifications Object below |
| `location` | Object | Product location (deep merge) | See Location Object below |
| `images` | Array | Product images | Array of image objects |
| `tags` | Array | Product tags | Array of strings |
| `isActive` | Boolean | Active status | true/false |
| `isFeatured` | Boolean | Featured status | true/false |
| `isSubscriptionEligible` | Boolean | Subscription eligibility | true/false |

#### Pricing Object

```json
{
  "pricing": {
    "retailPrice": 99.99,
    "wholesalePrice": 79.99,
    "currency": "USD"
  }
}
```

#### Inventory Object

```json
{
  "inventory": {
    "quantity": 100,
    "minStock": 10,
    "maxStock": 1000,
    "location": "Warehouse A"
  }
}
```

#### Specifications Object

```json
{
  "specifications": {
    "weight": "2.5 lbs",
    "dimensions": "10x8x6 inches",
    "material": "Plastic",
    "color": "Blue",
    "warranty": "1 year"
  }
}
```

#### Location Object

```json
{
  "location": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345",
    "country": "Country",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "message": "Supply item updated successfully",
  "data": {
    "supply": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Product Name",
      "title": "Product Title",
      "description": "Product description",
      "supplier": { /* populated User */ },
      "category": "cleaning_supplies",
      "pricing": { /* ... */ },
      "inventory": { /* ... */ },
      "createdAt": "2025-01-30T00:00:00.000Z",
      "updatedAt": "2025-01-30T00:00:00.000Z"
    },
    "updatedFields": ["name", "pricing", "inventory"]
  }
}
```

### Examples

**Update Product Name and Price:**

```http
PATCH /api/supplies/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Cleaning Solution",
  "pricing": {
    "retailPrice": 49.99
  }
}
```

**Update Inventory Only:**

```http
PATCH /api/supplies/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "inventory": {
    "quantity": 150,
    "minStock": 20
  }
}
```

**Update Multiple Fields:**

```http
PATCH /api/supplies/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "pricing": {
    "retailPrice": 59.99
  },
  "inventory": {
    "quantity": 200
  },
  "isFeatured": true,
  "tags": ["premium", "eco-friendly"]
}
```

---

## Common Features

### Deep Merging

All three PATCH endpoints use **deep merging** for nested objects. This means:

- Existing nested values are preserved unless explicitly overridden
- You can update a single nested field without affecting others
- Arrays are replaced entirely (not merged)

### Protected Fields

The following fields **cannot** be updated via PATCH:

**Agency:**
- `_id` - Agency ID
- `owner` - Owner ID (immutable)
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp (automatically managed)

**Course:**
- `_id` - Course ID
- `instructor` - Instructor ID (immutable)
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp (automatically managed)

**Product:**
- `_id` - Product ID
- `supplier` - Supplier ID (immutable)
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp (automatically managed)
- `orders` - Order history (immutable)
- `reviews` - Review history (immutable)
- `averageRating` - Calculated field (immutable)

### Error Responses

All endpoints return consistent error responses:

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Invalid field value",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "message": "Not authorized to update this resource"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to update resource",
  "error": "Error message (only in development)"
}
```

---

## Best Practices

1. **Update Only What You Need**: PATCH is designed for partial updates. Only send the fields you want to change.

2. **Use Deep Merging Wisely**: Remember that nested objects are merged, not replaced. This allows incremental updates.

3. **Validate Before Sending**: Ensure all enum values and types are correct before sending the request.

4. **Handle Errors Gracefully**: Always check the `success` field and handle errors appropriately.

5. **Check Updated Fields**: The response includes an `updatedFields` array showing which fields were actually updated.

6. **Location Updates**: When updating location/address fields, coordinates are automatically geocoded if address changes.

---

## Version History

- **v1.0.0** (2025-01-30): Initial implementation
  - Agency PATCH endpoint
  - Instructor Course PATCH endpoint
  - Supplier Product PATCH endpoint
  - Deep merging for nested objects
  - Comprehensive validation
  - Automatic geocoding for address updates

---

## Support

For issues or questions regarding these endpoints, please contact the API support team or refer to the main API documentation.
