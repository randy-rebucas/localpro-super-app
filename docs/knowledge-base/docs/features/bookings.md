# Bookings Feature

## Overview

The Bookings feature provides a comprehensive service booking and management system that connects service providers with clients. It supports multiple payment methods, real-time status tracking, and complete booking lifecycle management.

## Key Features

- **Service Booking** - Create and manage service appointments
- **Payment Processing** - Multiple payment methods (PayPal, PayMongo, PayMaya)
- **Status Management** - Real-time booking status tracking
- **Communication** - Built-in messaging between parties
- **Photo Documentation** - Before/after photo capture
- **Review System** - Comprehensive feedback and rating
- **Timeline Tracking** - Complete booking history

## API Endpoints

### Create Booking

```
POST /api/marketplace/bookings
Body: {
  service: string;        // Service ID
  scheduledDate: string;  // ISO date
  scheduledTime: string;  // HH:mm
  address: {
    street: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  paymentMethod: string;  // paypal, paymongo, paymaya
}
```

### Get Bookings

```
GET /api/marketplace/my-bookings
Query Parameters:
  - status?: string (pending, confirmed, in_progress, completed, cancelled)
  - page?: number
  - limit?: number
```

### Update Booking Status

```
PUT /api/marketplace/bookings/:id/status
Body: {
  status: string;
  notes?: string;
}
```

### Add Review

```
POST /api/marketplace/bookings/:id/reviews
Body: {
  rating: number;  // 1-5
  comment: string;
}
```

## Booking Status Flow

```
pending → confirmed → in_progress → completed
                ↓
            cancelled
```

## Payment Integration

### PayPal

```javascript
POST /api/marketplace/bookings
Body: {
  ...bookingData,
  paymentMethod: "paypal"
}
```

### PayMongo

```javascript
POST /api/marketplace/bookings/paymongo/confirm
Body: {
  bookingId: string;
  paymentIntentId: string;
}
```

## Data Model

```typescript
interface Booking {
  _id: string;
  service: Service;
  client: User;
  provider: User;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  scheduledTime: string;
  address: Address;
  payment: {
    method: string;
    amount: number;
    status: string;
  };
  review?: Review;
  photos?: Photo[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Implementation Examples

See [Frontend Implementation Guide](../frontend/implementation-guide.md#bookings) for code examples.

## Related Features

- [Marketplace](./marketplace.md) - Service listings
- [Payments](./payments.md) - Payment processing
- [Communication](../api/endpoints.md#communication) - Messaging

## Documentation

For complete API documentation, see:
- [Bookings API Endpoints](../../../features/bookings/api-endpoints.md)
- [Bookings Data Entities](../../../features/bookings/data-entities.md)

