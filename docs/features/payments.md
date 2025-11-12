# Payments Feature Documentation

## Overview
The Payments feature integrates PayPal and PayMaya payment gateways for processing transactions across the platform.

## PayPal (`/api/paypal`)

### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/webhook` | PayPal webhook | PUBLIC |
| GET | `/webhook/events` | Get webhook events | **admin** |

## PayMaya (`/api/paymaya`)

### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/webhook` | PayMaya webhook | PUBLIC |
| POST | `/checkout` | Create checkout | AUTHENTICATED |
| GET | `/checkout/:checkoutId` | Get checkout | AUTHENTICATED |
| POST | `/payment` | Create payment | AUTHENTICATED |
| GET | `/payment/:paymentId` | Get payment | AUTHENTICATED |
| POST | `/invoice` | Create invoice | AUTHENTICATED |
| GET | `/invoice/:invoiceId` | Get invoice | AUTHENTICATED |
| GET | `/config/validate` | Validate config | **admin** |
| GET | `/webhook/events` | Get webhook events | **admin** |

## Request/Response Examples

### Create PayMaya Checkout
```http
POST /api/paymaya/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalAmount": 1000,
  "description": "Service booking payment",
  "referenceId": "booking_123",
  "buyer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+639123456789"
  },
  "currency": "PHP"
}
```

## Payment Flow

1. **Payment Initiation**:
   - User initiates payment
   - System creates payment/checkout
   - User redirected to payment gateway

2. **Payment Processing**:
   - User completes payment
   - Gateway processes payment
   - Webhook received

3. **Payment Confirmation**:
   - System verifies payment
   - Transaction recorded
   - User notified

## Related Features
- Finance (Transaction recording)
- Marketplace (Booking payments)
- Academy (Course payments)

