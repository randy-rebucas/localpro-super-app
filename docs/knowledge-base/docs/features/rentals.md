# Rentals Feature

## Overview

The Rentals feature enables equipment and vehicle rental services, allowing providers to list rental items and customers to book rentals.

## Key Features

- **Rental Listings** - Create and manage rental items
- **Booking System** - Rental booking and reservation
- **Pricing Management** - Daily/weekly/monthly rates
- **Deposit Handling** - Security deposit management
- **Return Processing** - Rental return and inspection

## API Endpoints

### Rental Items

```
GET    /api/rentals/items                # List rental items
GET    /api/rentals/items/:id            # Get item details
POST   /api/rentals/items                # Create item (provider/admin)
PUT    /api/rentals/items/:id            # Update item
DELETE /api/rentals/items/:id           # Delete item
```

### Bookings

```
POST   /api/rentals/bookings            # Create rental booking
GET    /api/rentals/my-bookings         # Get user bookings
PUT    /api/rentals/bookings/:id/return # Process return
```

## Data Model

```typescript
interface Rental {
  _id: string;
  name: string;
  type: string;  // equipment, vehicle, etc.
  pricing: {
    daily: number;
    weekly?: number;
    monthly?: number;
  };
  deposit: number;
  availability: {
    startDate: Date;
    endDate: Date;
  };
}
```

## Related Features

- [Marketplace](./marketplace.md) - Service marketplace
- [Bookings](./bookings.md) - Booking system
- [Payments](./payments.md) - Payment processing

## Documentation

For complete API documentation:
- [Rentals API Endpoints](../../../features/rentals/api-endpoints.md)

