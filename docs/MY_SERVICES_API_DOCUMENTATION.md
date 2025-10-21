# My Services API Documentation

## Overview

The My Services API endpoint allows authenticated users to retrieve all services they have created as providers. This endpoint is designed for the frontend "my-services" page where users can view and manage their own services.

## Endpoint

**GET** `/api/marketplace/my-services`

## Authentication

This endpoint requires Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter services by category (cleaning, plumbing, electrical, etc.) |
| `status` | string | 'all' | Filter by service status ('all', 'active', 'inactive') |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of services per page |
| `sortBy` | string | 'createdAt' | Field to sort by (createdAt, title, rating.average, pricing.basePrice) |
| `sortOrder` | string | 'desc' | Sort order ('asc' or 'desc') |

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "service_id",
        "title": "Professional House Cleaning",
        "description": "Complete house cleaning service with eco-friendly products",
        "category": "cleaning",
        "subcategory": "residential_cleaning",
        "provider": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "profile": {
            "avatar": {
              "url": "https://cloudinary.com/avatar.jpg",
              "publicId": "avatar_id",
              "thumbnail": "https://cloudinary.com/avatar_thumb.jpg"
            },
            "rating": 4.8
          }
        },
        "pricing": {
          "type": "hourly",
          "basePrice": 25,
          "currency": "USD"
        },
        "serviceArea": ["Manila", "Quezon City", "Makati"],
        "images": [
          {
            "url": "https://cloudinary.com/service1.jpg",
            "publicId": "service_img_id",
            "thumbnail": "https://cloudinary.com/service1_thumb.jpg",
            "alt": "Cleaning service image"
          }
        ],
        "features": ["Eco-friendly products", "Insured", "Same-day service"],
        "requirements": ["Access to water", "Parking space"],
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
          "coverageAmount": 100000
        },
        "emergencyService": {
          "available": true,
          "surcharge": 50,
          "responseTime": "within 2 hours"
        },
        "servicePackages": [
          {
            "name": "Basic Cleaning",
            "description": "Standard cleaning service",
            "price": 50,
            "features": ["Dusting", "Vacuuming", "Bathroom cleaning"],
            "duration": 2
          },
          {
            "name": "Deep Cleaning",
            "description": "Comprehensive cleaning service",
            "price": 100,
            "features": ["Everything in Basic", "Window cleaning", "Appliance cleaning"],
            "duration": 4
          }
        ],
        "addOns": [
          {
            "name": "Window Cleaning",
            "description": "Interior and exterior window cleaning",
            "price": 25,
            "category": "additional_services"
          }
        ],
        "isActive": true,
        "rating": {
          "average": 4.8,
          "count": 15
        },
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
          "timezone": "Asia/Manila"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:45:00Z"
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
curl -X GET "http://localhost:5000/api/marketplace/my-services" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filter by Category
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-services?category=cleaning" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-services?status=active" \
  -H "Authorization: Bearer your-jwt-token"
```

### Pagination
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-services?page=2&limit=5" \
  -H "Authorization: Bearer your-jwt-token"
```

### Sorting
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-services?sortBy=title&sortOrder=asc" \
  -H "Authorization: Bearer your-jwt-token"
```

### Combined Filters
```bash
curl -X GET "http://localhost:5000/api/marketplace/my-services?category=plumbing&status=active&page=1&limit=10&sortBy=rating.average&sortOrder=desc" \
  -H "Authorization: Bearer your-jwt-token"
```

## Frontend Integration

### React/JavaScript Example

```javascript
// Fetch user's services
const fetchMyServices = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/marketplace/my-services?${queryParams}`, {
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
    console.error('Error fetching my services:', error);
    throw error;
  }
};

// Usage examples
const loadMyServices = async () => {
  try {
    // Get all services
    const allServices = await fetchMyServices();
    
    // Get only active services
    const activeServices = await fetchMyServices({ status: 'active' });
    
    // Get plumbing services
    const plumbingServices = await fetchMyServices({ category: 'plumbing' });
    
    // Get services with pagination
    const paginatedServices = await fetchMyServices({ 
      page: 1, 
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    console.log('My Services:', allServices);
    console.log('Stats:', allServices.stats);
  } catch (error) {
    console.error('Failed to load services:', error);
  }
};
```

### Vue.js Example

```javascript
// Vue.js component method
async fetchMyServices() {
  try {
    this.loading = true;
    const response = await this.$http.get('/api/marketplace/my-services', {
      params: this.filters,
      headers: {
        'Authorization': `Bearer ${this.$store.state.auth.token}`
      }
    });
    
    if (response.data.success) {
      this.services = response.data.data.services;
      this.pagination = response.data.data.pagination;
      this.stats = response.data.data.stats;
    }
  } catch (error) {
    this.$toast.error('Failed to load services');
    console.error('Error:', error);
  } finally {
    this.loading = false;
  }
}
```

## Service Categories

The API supports filtering by the following service categories:

- `cleaning` - House and office cleaning services
- `plumbing` - Plumbing repairs and installations
- `electrical` - Electrical work and repairs
- `moving` - Moving and relocation services
- `landscaping` - Garden and lawn care
- `painting` - Interior and exterior painting
- `carpentry` - Woodwork and furniture
- `flooring` - Floor installation and repair
- `roofing` - Roof repairs and installation
- `hvac` - Heating, ventilation, and air conditioning
- `appliance_repair` - Appliance repair services
- `locksmith` - Lock and key services
- `handyman` - General repair services
- `home_security` - Security system installation
- `pool_maintenance` - Swimming pool maintenance
- `pest_control` - Pest control services
- `carpet_cleaning` - Carpet and upholstery cleaning
- `window_cleaning` - Window cleaning services
- `gutter_cleaning` - Gutter cleaning and maintenance
- `power_washing` - Pressure washing services
- `snow_removal` - Snow removal services
- `other` - Other services not listed

## Statistics

The API returns comprehensive statistics about the user's services:

- **totalServices**: Total number of services created
- **activeServices**: Number of currently active services
- **inactiveServices**: Number of inactive services
- **averageRating**: Average rating across all services
- **totalBookings**: Total number of bookings received

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
- Users can only access their own services
- Input validation and sanitization
- Audit logging for all requests

This API endpoint provides everything needed for a comprehensive "My Services" page in the frontend, allowing users to view, filter, and manage their service offerings effectively.
