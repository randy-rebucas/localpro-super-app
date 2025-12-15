# Facility Care Feature

## Overview

The Facility Care feature provides recurring facility maintenance services including janitorial, landscaping, and pest control.

## Key Features

- **Facility Management** - Create and manage facilities
- **Work Orders** - Create and track work orders
- **Scheduling** - Recurring service scheduling
- **Vendor Management** - Manage service vendors
- **Compliance** - Track compliance documentation

## API Endpoints

### Facilities

```
GET    /api/facility-care/facilities      # List facilities
POST   /api/facility-care/facilities      # Create facility
GET    /api/facility-care/facilities/:id  # Get facility
PUT    /api/facility-care/facilities/:id  # Update facility
```

### Work Orders

```
GET    /api/facility-care/work-orders      # List work orders
POST   /api/facility-care/work-orders     # Create work order
GET    /api/facility-care/work-orders/:id  # Get work order
PUT    /api/facility-care/work-orders/:id  # Update work order
```

## Data Model

```typescript
interface Facility {
  _id: string;
  name: string;
  address: Address;
  type: string; // office, warehouse, etc.
  workOrders: WorkOrder[];
  createdAt: Date;
}
```

## Related Features

- [Marketplace](./marketplace.md) - Service marketplace
- [Bookings](./bookings.md) - Booking system

