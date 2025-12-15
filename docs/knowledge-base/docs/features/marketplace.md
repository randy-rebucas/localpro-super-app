# Marketplace Feature

## Overview

The Marketplace feature enables service providers to list their services and clients to discover, book, and manage service appointments. It supports multiple service categories with advanced filtering, location-based search, and payment processing.

## Key Features

- **Service Listings**: Create and manage service offerings
- **Service Discovery**: Advanced search and filtering
- **Location-Based Search**: Find nearby services
- **Category Management**: Organized service categories
- **Provider Profiles**: Service provider information
- **Reviews & Ratings**: Customer feedback system
- **Image Management**: Multiple service images

## API Endpoints

### Public Endpoints

#### List Services
```
GET /api/marketplace/services
Query Parameters:
  - page?: number
  - limit?: number
  - category?: string
  - search?: string
  - lat?: number
  - lng?: number
  - radius?: number (in meters)
  - minPrice?: number
  - maxPrice?: number
  - sort?: string
```

#### Get Service Details
```
GET /api/marketplace/services/:id
```

#### Get Service Categories
```
GET /api/marketplace/services/categories
```

#### Get Nearby Services
```
GET /api/marketplace/services/nearby
Query Parameters:
  - lat: number (required)
  - lng: number (required)
  - radius?: number (default: 10000m)
  - category?: string
```

### Protected Endpoints

#### Create Service (Provider/Admin)
```
POST /api/marketplace/services
Body: {
  title: string;
  description: string;
  category: string;
  pricing: {
    basePrice: number;
    hourlyRate?: number;
  };
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}
```

#### Update Service
```
PUT /api/marketplace/services/:id
```

#### Delete Service
```
DELETE /api/marketplace/services/:id
```

#### Upload Service Images
```
POST /api/marketplace/services/:id/images
Content-Type: multipart/form-data
Body: {
  images: File[] (max 5)
}
```

### Admin Endpoints

#### Manage Categories
```
GET    /api/marketplace/services/categories/manage
POST   /api/marketplace/services/categories
PUT    /api/marketplace/services/categories/:id
DELETE /api/marketplace/services/categories/:id
```

## Data Model

### Service

```typescript
interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  provider: {
    _id: string;
    name: string;
    rating: number;
  };
  pricing: {
    basePrice: number;
    hourlyRate?: number;
    currency: string;
  };
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: Array<{
    url: string;
    thumbnail: string;
    publicId: string;
  }>;
  rating: number;
  reviewCount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}
```

## Implementation Examples

### Search Services

```typescript
const searchServices = async (filters: ServiceFilters) => {
  const params = new URLSearchParams({
    page: filters.page?.toString() || '1',
    limit: '20',
    ...(filters.category && { category: filters.category }),
    ...(filters.search && { search: filters.search }),
    ...(filters.location && {
      lat: filters.location.lat.toString(),
      lng: filters.location.lng.toString(),
      radius: '10000'
    })
  });
  
  const response = await fetch(`/api/marketplace/services?${params}`);
  return response.json();
};
```

### Create Service

```typescript
const createService = async (serviceData: CreateServiceData) => {
  const response = await fetch('/api/marketplace/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(serviceData)
  });
  return response.json();
};
```

## Best Practices

1. **Use pagination** for service lists
2. **Implement caching** for categories
3. **Optimize images** before upload
4. **Validate location** coordinates
5. **Handle errors** gracefully
6. **Show loading states** during searches

## Related Features

- [Bookings](./bookings.md) - Service booking system
- [Payments](./payments.md) - Payment processing
- [Reviews](./bookings.md#reviews) - Review system

