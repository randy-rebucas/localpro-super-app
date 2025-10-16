# PayPal Integration API Documentation

## Overview

This document provides comprehensive API documentation for the PayPal integration in the LocalPro Super App. The integration supports both one-time payments and recurring subscriptions across all major features.

## Authentication

All PayPal endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
Development: http://localhost:4000
Production: https://your-domain.com
```

## PayPal Configuration

### Environment Variables

```env
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or 'production'
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
```

### PayPal Developer Setup

1. Create a PayPal Developer account at https://developer.paypal.com/
2. Create a new application
3. Get your Client ID and Client Secret
4. Set up webhooks for your application
5. Configure the webhook URL: `https://your-domain.com/api/paypal/webhook`

## API Endpoints

### 1. LocalPro Plus Subscriptions

#### Get Subscription Plans
```http
GET /api/localpro-plus/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "plan_id",
      "name": "Basic",
      "type": "subscription",
      "tier": "basic",
      "pricing": {
        "monthly": 9.99,
        "yearly": 99.99,
        "currency": "USD"
      },
      "features": ["feature1", "feature2"]
    }
  ]
}
```

#### Subscribe with PayPal
```http
POST /api/localpro-plus/subscribe
```

**Request Body:**
```json
{
  "planId": "plan_id",
  "billingCycle": "monthly", // or "yearly"
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal subscription created successfully",
  "data": {
    "subscription": {
      "_id": "subscription_id",
      "user": "user_id",
      "plan": "plan_id",
      "status": "pending",
      "payment": {
        "paypalSubscriptionId": "paypal_subscription_id"
      }
    },
    "payment": {
      "_id": "payment_id",
      "amount": 9.99,
      "currency": "USD",
      "status": "pending",
      "paypalSubscriptionId": "paypal_subscription_id"
    },
    "paypalApprovalUrl": "https://www.sandbox.paypal.com/subscribe?token=..."
  }
}
```

#### Approve PayPal Subscription
```http
POST /api/localpro-plus/paypal/approve
```

**Request Body:**
```json
{
  "subscriptionId": "paypal_subscription_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal subscription approved successfully",
  "data": {
    "_id": "subscription_id",
    "status": "active",
    "billing": {
      "startDate": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Cancel PayPal Subscription
```http
POST /api/localpro-plus/paypal/cancel
```

**Request Body:**
```json
{
  "subscriptionId": "paypal_subscription_id",
  "reason": "User requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal subscription cancelled successfully"
}
```

### 2. Marketplace Service Bookings

#### Create Booking with PayPal
```http
POST /api/marketplace/bookings
```

**Request Body:**
```json
{
  "serviceId": "service_id",
  "scheduledDate": "2024-01-15T10:00:00Z",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "notes": "Please call before arriving",
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "_id": "booking_id",
      "service": "service_id",
      "user": "user_id",
      "scheduledDate": "2024-01-15T10:00:00Z",
      "status": "pending",
      "payment": {
        "method": "paypal",
        "amount": 50.00,
        "currency": "USD",
        "status": "pending",
        "paypalOrderId": "paypal_order_id"
      },
      "paypalApprovalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
    }
  }
}
```

#### Approve PayPal Booking Payment
```http
POST /api/marketplace/bookings/paypal/approve
```

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal payment approved successfully",
  "data": {
    "_id": "booking_id",
    "status": "confirmed",
    "payment": {
      "status": "completed",
      "paidAt": "2024-01-01T00:00:00.000Z",
      "paypalTransactionId": "paypal_transaction_id"
    }
  }
}
```

#### Get PayPal Order Details
```http
GET /api/marketplace/bookings/paypal/order/:orderId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "paypal_order_id",
    "status": "COMPLETED",
    "purchase_units": [
      {
        "amount": {
          "currency_code": "USD",
          "value": "50.00"
        }
      }
    ]
  }
}
```

### 3. Supplies Orders

#### Create Order with PayPal
```http
POST /api/supplies/orders
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 25.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "user": "user_id",
      "items": [
        {
          "productId": "product_id",
          "quantity": 2,
          "price": 25.99
        }
      ],
      "total": 51.98,
      "status": "pending",
      "payment": {
        "method": "paypal",
        "amount": 51.98,
        "currency": "USD",
        "status": "pending",
        "paypalOrderId": "paypal_order_id"
      },
      "paypalApprovalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
    }
  }
}
```

#### Approve PayPal Order Payment
```http
POST /api/supplies/orders/paypal/approve
```

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal payment approved successfully",
  "data": {
    "_id": "order_id",
    "status": "confirmed",
    "payment": {
      "status": "completed",
      "paidAt": "2024-01-01T00:00:00.000Z",
      "paypalTransactionId": "paypal_transaction_id"
    }
  }
}
```

### 4. Financial Services

#### Repay Loan with PayPal
```http
POST /api/finance/loans/:loanId/repay/paypal
```

**Request Body:**
```json
{
  "amount": 100.00,
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal payment order created for loan repayment",
  "data": {
    "transaction": {
      "_id": "transaction_id",
      "loan": "loan_id",
      "amount": 100.00,
      "currency": "USD",
      "type": "repayment",
      "status": "pending",
      "paypalOrderId": "paypal_order_id"
    },
    "paypalApprovalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
  }
}
```

#### Approve PayPal Loan Repayment
```http
POST /api/finance/loans/repay/paypal/approve
```

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal loan repayment approved successfully",
  "data": {
    "transaction": {
      "_id": "transaction_id",
      "status": "completed",
      "paypalTransactionId": "paypal_transaction_id"
    },
    "loan": {
      "_id": "loan_id",
      "remainingBalance": 400.00
    }
  }
}
```

#### Repay Salary Advance with PayPal
```http
POST /api/finance/salary-advances/:salaryAdvanceId/repay/paypal
```

**Request Body:**
```json
{
  "amount": 50.00,
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal payment order created for salary advance repayment",
  "data": {
    "transaction": {
      "_id": "transaction_id",
      "salaryAdvance": "salary_advance_id",
      "amount": 50.00,
      "currency": "USD",
      "type": "repayment",
      "status": "pending",
      "paypalOrderId": "paypal_order_id"
    },
    "paypalApprovalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
  }
}
```

#### Approve PayPal Salary Advance Repayment
```http
POST /api/finance/salary-advances/repay/paypal/approve
```

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayPal salary advance repayment approved successfully",
  "data": {
    "transaction": {
      "_id": "transaction_id",
      "status": "completed",
      "paypalTransactionId": "paypal_transaction_id"
    },
    "salaryAdvance": {
      "_id": "salary_advance_id",
      "remainingBalance": 0.00
    }
  }
}
```

### 5. PayPal Webhooks

#### Webhook Handler
```http
POST /api/paypal/webhook
```

**Headers:**
```
Content-Type: application/json
PayPal-Transmission-Id: webhook-transmission-id
PayPal-Cert-Id: webhook-cert-id
PayPal-Transmission-Sig: webhook-signature
PayPal-Transmission-Time: 2024-01-01T00:00:00Z
PayPal-Auth-Algo: SHA256withRSA
```

**Request Body (Example - Payment Completed):**
```json
{
  "id": "WH-2W42680HY53905350-67976317FL5552",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "create_time": "2024-01-01T00:00:00Z",
  "resource_type": "capture",
  "resource_version": "2.0",
  "event_version": "1.0",
  "summary": "Payment completed for $ 10.00 USD",
  "resource": {
    "amount": {
      "currency_code": "USD",
      "value": "10.00"
    },
    "id": "2GG279541U471931P",
    "status": "COMPLETED",
    "supplementary_data": {
      "related_ids": {
        "order_id": "5O190127TN364715T"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

#### Get Webhook Events (Admin)
```http
GET /api/paypal/webhook/events
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook events endpoint - implement logging as needed",
  "data": []
}
```

## Webhook Events

The PayPal integration handles the following webhook events:

### One-time Payment Events
- `PAYMENT.CAPTURE.COMPLETED` - Payment successfully captured
- `PAYMENT.CAPTURE.DENIED` - Payment capture denied

### Subscription Events
- `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- `BILLING.SUBSCRIPTION.SUSPENDED` - Subscription suspended
- `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED` - Subscription payment completed
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED` - Subscription payment failed
- `BILLING.SUBSCRIPTION.EXPIRED` - Subscription expired

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
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
  "message": "Server error"
}
```

### PayPal-Specific Errors

#### PayPal API Error
```json
{
  "success": false,
  "message": "PayPal API error",
  "error": "INVALID_REQUEST",
  "details": {
    "name": "INVALID_REQUEST",
    "message": "Request is not well-formed, syntactically incorrect, or violates schema."
  }
}
```

#### Webhook Verification Failed
```json
{
  "success": false,
  "message": "Invalid webhook signature"
}
```

## Testing

### Sandbox Environment

1. Use PayPal sandbox credentials
2. Set `PAYPAL_MODE=sandbox` in your environment
3. Use sandbox PayPal accounts for testing
4. Test webhook events using PayPal's webhook simulator

### Test Data

#### Test PayPal Accounts
- **Buyer**: sb-buyer@personal.example.com
- **Seller**: sb-seller@business.example.com

#### Test Credit Cards
- **Visa**: 4032035518382011
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005

### Postman Collection

Import the provided Postman collection (`LocalPro_Super_App_PayPal_Collection.postman_collection.json`) to test all endpoints.

## Production Deployment

### Environment Setup

1. **PayPal Production Account**
   - Create production PayPal application
   - Get production Client ID and Client Secret
   - Set up production webhooks

2. **Environment Variables**
   ```env
   PAYPAL_CLIENT_ID=your-production-client-id
   PAYPAL_CLIENT_SECRET=your-production-client-secret
   PAYPAL_MODE=production
   PAYPAL_WEBHOOK_ID=your-production-webhook-id
   ```

3. **Webhook Configuration**
   - URL: `https://your-domain.com/api/paypal/webhook`
   - Events: All payment and subscription events
   - Verify webhook signature in production

### Security Considerations

1. **Webhook Verification**
   - Always verify webhook signatures
   - Use HTTPS for webhook endpoints
   - Implement idempotency for webhook processing

2. **API Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all input data
   - Log all payment transactions

3. **Data Protection**
   - Encrypt sensitive data
   - Follow PCI DSS guidelines
   - Implement proper access controls

## Support

For PayPal integration support:
- PayPal Developer Documentation: https://developer.paypal.com/docs/
- PayPal Support: https://www.paypal.com/support/
- LocalPro Support: support@localpro.com
