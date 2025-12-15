# Supplies Feature

## Overview

The Supplies feature provides an e-commerce platform for suppliers to list products and customers to purchase supplies and materials.

## Key Features

- **Product Listings** - Create and manage supply products
- **Order Management** - Complete order processing
- **Inventory Tracking** - Stock management
- **Supplier Profiles** - Supplier information and ratings
- **Delivery Scheduling** - Order delivery management

## API Endpoints

### Products

```
GET    /api/supplies/products            # List products
GET    /api/supplies/products/:id        # Get product details
POST   /api/supplies/products            # Create product (supplier/admin)
PUT    /api/supplies/products/:id        # Update product
DELETE /api/supplies/products/:id        # Delete product
```

### Orders

```
POST   /api/supplies/orders              # Create order
GET    /api/supplies/my-orders          # Get user orders
GET    /api/supplies/orders/:id          # Get order details
PUT    /api/supplies/orders/:id/status   # Update order status
```

## Data Model

```typescript
interface Supply {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  supplier: User;
  inventory: {
    quantity: number;
    inStock: boolean;
  };
  images: Image[];
}
```

## Related Features

- [Marketplace](./marketplace.md) - Service marketplace
- [Payments](./payments.md) - Payment processing
- [Finance](../api/endpoints.md#finance) - Financial management

## Documentation

For complete API documentation:
- [Supplies API Endpoints](../../../features/supplies/api-endpoints.md)

