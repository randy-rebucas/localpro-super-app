# Supplies Feature Documentation

## Overview
The Supplies feature enables suppliers to list products and customers to browse, order, and purchase supplies.

## Base Path
`/api/supplies`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all supplies | page, limit, category, location, search |
| GET | `/products` | Get supplies (alias) | page, limit, category |
| GET | `/products/:id` | Get supply (alias) | - |
| GET | `/categories` | Get supply categories | - |
| GET | `/featured` | Get featured supplies | - |
| GET | `/nearby` | Get nearby supplies | lat, lng, radius |
| GET | `/:id` | Get supply details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/` | Create supply | **supplier, admin** |
| POST | `/products` | Create supply (alias) | **supplier, admin** |
| PUT | `/:id` | Update supply | **supplier, admin** |
| DELETE | `/:id` | Delete supply | **supplier, admin** |
| POST | `/:id/images` | Upload supply images | **supplier, admin** |
| DELETE | `/:id/images/:imageId` | Delete supply image | **supplier, admin** |
| POST | `/:id/order` | Order supply | AUTHENTICATED |
| PUT | `/:id/orders/:orderId/status` | Update order status | AUTHENTICATED |
| POST | `/:id/reviews` | Add supply review | AUTHENTICATED |
| GET | `/my-supplies` | Get my supplies | AUTHENTICATED |
| GET | `/my-orders` | Get my supply orders | AUTHENTICATED |
| GET | `/statistics` | Get supply statistics | **admin** |

## Request/Response Examples

### Create Supply (Supplier)
```http
POST /api/supplies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Cleaning Supplies Kit",
  "description": "Complete cleaning supplies kit",
  "category": "cleaning",
  "price": 1500,
  "stock": 50,
  "unit": "kit",
  "specifications": {
    "weight": "5kg",
    "contents": ["Bleach", "Detergent", "Sponges"]
  }
}
```

### Order Supply
```http
POST /api/supplies/:id/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Manila",
    "zipCode": "1000"
  },
  "paymentMethod": "paypal"
}
```

### Update Order Status
```http
PUT /api/supplies/:id/orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

## Supply Order Flow

1. **Product Discovery**:
   - Customer browses supplies
   - Customer filters by category, location
   - Customer views product details

2. **Order Creation**:
   - Customer adds to cart
   - Customer creates order
   - Payment processed

3. **Order Fulfillment**:
   - Supplier processes order
   - Order status: `pending` → `confirmed` → `shipped` → `delivered`
   - Customer receives order

4. **Review**:
   - Customer reviews product
   - Rating added

## Order Status

- `pending` - Order created, awaiting confirmation
- `confirmed` - Order confirmed by supplier
- `processing` - Order being prepared
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled

## Related Features
- Suppliers (User role)
- Finance (Payments)
- Reviews & Ratings
- Maps (Delivery tracking)

