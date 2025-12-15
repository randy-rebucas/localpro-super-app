# Payment Response Formats

This document shows all payment-related response formats used in the LocalPro Super App.

## PayMaya Payment Responses

### 1. Create Checkout Response
**POST** `/api/paymaya/checkout`

**Success Response (201):**
```json
{
  "success": true,
  "message": "PayMaya checkout created successfully",
  "data": {
    "checkoutId": "checkout_id_from_paymaya",
    "checkoutUrl": "https://pg-sandbox.paymaya.com/checkout/checkout_id",
    "requestReferenceNumber": "booking_123"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create PayMaya checkout",
  "error": "Error message from PayMaya",
  "details": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

### 2. Get Checkout Response
**GET** `/api/paymaya/checkout/:checkoutId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "checkoutId": "checkout_id",
    "status": "PAID",
    "totalAmount": {
      "amount": "1000.00",
      "currency": "PHP"
    },
    "buyer": {
      "firstName": "John",
      "lastName": "Doe",
      "contact": {
        "phone": "+639123456789",
        "email": "john@example.com"
      }
    },
    "items": [
      {
        "name": "Service booking payment",
        "code": "booking_123",
        "description": "Service booking payment",
        "quantity": 1,
        "totalAmount": {
          "amount": "1000.00",
          "currency": "PHP"
        }
      }
    ],
    "requestReferenceNumber": "booking_123",
    "redirectUrl": {
      "success": "https://example.com/payment/success",
      "failure": "https://example.com/payment/failure",
      "cancel": "https://example.com/payment/cancel"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Checkout not found",
  "error": "Error message"
}
```

### 3. Create Payment Response
**POST** `/api/paymaya/payment`

**Success Response (201):**
```json
{
  "success": true,
  "message": "PayMaya payment created successfully",
  "data": {
    "paymentId": "payment_id_from_paymaya",
    "status": "PAID",
    "totalAmount": {
      "amount": "1000.00",
      "currency": "PHP"
    },
    "requestReferenceNumber": "booking_123",
    "receiptNumber": "RECEIPT123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create PayMaya payment",
  "error": "Error message from PayMaya",
  "details": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

### 4. Get Payment Response
**GET** `/api/paymaya/payment/:paymentId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "status": "PAID",
    "totalAmount": {
      "amount": "1000.00",
      "currency": "PHP"
    },
    "buyer": {
      "firstName": "John",
      "lastName": "Doe",
      "contact": {
        "phone": "+639123456789",
        "email": "john@example.com"
      }
    },
    "items": [
      {
        "name": "Service booking payment",
        "code": "booking_123",
        "description": "Service booking payment",
        "quantity": 1,
        "totalAmount": {
          "amount": "1000.00",
          "currency": "PHP"
        }
      }
    ],
    "requestReferenceNumber": "booking_123",
    "receiptNumber": "RECEIPT123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Payment not found",
  "error": "Error message"
}
```

### 5. Create Invoice Response
**POST** `/api/paymaya/invoice`

**Success Response (201):**
```json
{
  "success": true,
  "message": "PayMaya invoice created successfully",
  "data": {
    "invoiceId": "invoice_id_from_paymaya",
    "invoiceUrl": "https://pg-sandbox.paymaya.com/invoices/invoice_id",
    "status": "PENDING",
    "totalAmount": {
      "amount": "1000.00",
      "currency": "PHP"
    },
    "requestReferenceNumber": "booking_123",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create PayMaya invoice",
  "error": "Error message from PayMaya",
  "details": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

### 6. Get Invoice Response
**GET** `/api/paymaya/invoice/:invoiceId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "invoice_id",
    "status": "PAID",
    "totalAmount": {
      "amount": "1000.00",
      "currency": "PHP"
    },
    "description": "Service booking payment",
    "buyer": {
      "firstName": "John",
      "lastName": "Doe",
      "contact": {
        "phone": "+639123456789",
        "email": "john@example.com"
      }
    },
    "items": [
      {
        "name": "Service booking payment",
        "code": "booking_123",
        "description": "Service booking payment",
        "quantity": 1,
        "totalAmount": {
          "amount": "1000.00",
          "currency": "PHP"
        }
      }
    ],
    "requestReferenceNumber": "booking_123",
    "redirectUrl": {
      "success": "https://example.com/payment/success",
      "failure": "https://example.com/payment/failure",
      "cancel": "https://example.com/payment/cancel"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Invoice not found",
  "error": "Error message"
}
```

### 7. Webhook Response
**POST** `/api/paymaya/webhook`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid webhook signature"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Webhook processing failed"
}
```

### 8. Validate Config Response
**GET** `/api/paymaya/config/validate`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "environment": "sandbox",
    "hasPublicKey": true,
    "hasSecretKey": true,
    "hasWebhookSecret": true
  }
}
```

### 9. Get Webhook Events Response
**GET** `/api/paymaya/webhook/events`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webhook events endpoint - implement logging as needed",
  "data": []
}
```

## PayPal Payment Responses

### 1. Approve PayPal Booking Response
**POST** `/api/marketplace/bookings/paypal/approve`

**Success Response (200):**
```json
{
  "success": true,
  "message": "PayPal payment approved successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "payment": {
      "status": "paid",
      "method": "paypal",
      "paypalTransactionId": "TXN-123456789",
      "paidAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

### 2. Get PayPal Order Details Response
**GET** `/api/marketplace/bookings/paypal/order/:orderId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "_id": "64a1b2c3d4e5f6789012347",
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "title": "Professional House Cleaning"
      },
      "pricing": {
        "totalAmount": 75,
        "currency": "USD"
      },
      "payment": {
        "status": "pending",
        "method": "paypal",
        "paypalOrderId": "ORDER-123456789"
      }
    },
    "paypalOrder": {
      "id": "ORDER-123456789",
      "status": "APPROVED",
      "purchase_units": [
        {
          "amount": {
            "currency_code": "USD",
            "value": "75.00"
          }
        }
      ]
    }
  }
}
```

## Booking Payment Responses

### Booking with Payment Information
**GET** `/api/marketplace/bookings/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "service": {
      "_id": "service_id",
      "title": "Home Cleaning"
    },
    "provider": {
      "_id": "provider_id",
      "name": "John Doe"
    },
    "client": {
      "_id": "client_id",
      "name": "Jane Smith"
    },
    "scheduledDate": "2025-01-20T10:00:00.000Z",
    "status": "pending",
    "pricing": {
      "basePrice": 25,
      "totalAmount": 75,
      "currency": "USD"
    },
    "payment": {
      "status": "paid",
      "method": "paypal",
      "paypalTransactionId": "TXN-123456789",
      "paidAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

## Standard Error Response Format

All payment endpoints follow this standard error format:

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Server error"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Error details"
}
```

## Common Payment Status Values

- **PayMaya**: `PENDING`, `PAID`, `FAILED`, `EXPIRED`
- **PayPal**: `pending`, `paid`, `failed`, `cancelled`
- **Internal**: `pending`, `completed`, `failed`, `expired`, `cancelled`

## Payment Methods

- `paypal` - PayPal payment gateway
- `paymaya` - PayMaya payment gateway
- `cash` - Cash payment (if applicable)
- `bank_transfer` - Bank transfer (if applicable)

## Finance Transactions Response

### Get Transactions
**GET** `/api/finance/transactions`

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `type` (optional) - Filter by transaction type: `income`, `expense`, `withdrawal`, `refund`, `bonus`, `referral`, `topup`
- `status` (optional) - Filter by status: `pending`, `completed`, `failed`, `cancelled`

**Success Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "transaction_id_1",
      "type": "income",
      "amount": 5000,
      "category": "service_booking",
      "description": "Payment for booking #12345",
      "paymentMethod": "paypal",
      "status": "completed",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "reference": "BOOKING-12345",
      "accountDetails": {
        "paypalTransactionId": "TXN-123456789"
      },
      "processedAt": "2024-01-15T10:35:00.000Z",
      "processedBy": "admin_user_id"
    },
    {
      "_id": "transaction_id_2",
      "type": "expense",
      "amount": 500,
      "category": "service_fee",
      "description": "Platform service fee",
      "paymentMethod": "wallet",
      "status": "completed",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "reference": "FEE-12345"
    },
    {
      "_id": "transaction_id_3",
      "type": "withdrawal",
      "amount": 2000,
      "category": "payout",
      "description": "Withdrawal to bank account",
      "paymentMethod": "bank_transfer",
      "status": "pending",
      "timestamp": "2024-01-16T09:00:00.000Z",
      "reference": "WITHDRAW-001",
      "accountDetails": {
        "bankName": "BPI",
        "accountNumber": "1234567890",
        "accountName": "John Doe"
      },
      "adminNotes": "Processing withdrawal request"
    },
    {
      "_id": "transaction_id_4",
      "type": "topup",
      "amount": 1000,
      "category": "wallet_topup",
      "description": "Wallet top-up via PayMaya",
      "paymentMethod": "paymaya",
      "status": "completed",
      "timestamp": "2024-01-14T14:20:00.000Z",
      "reference": "TOPUP-001",
      "accountDetails": {
        "paymayaCheckoutId": "checkout_123",
        "paymayaTransactionId": "payment_456"
      }
    },
    {
      "_id": "transaction_id_5",
      "type": "refund",
      "amount": 750,
      "category": "booking_refund",
      "description": "Refund for cancelled booking #12340",
      "paymentMethod": "paypal",
      "status": "completed",
      "timestamp": "2024-01-13T16:45:00.000Z",
      "reference": "REFUND-001",
      "accountDetails": {
        "paypalTransactionId": "TXN-987654321"
      }
    },
    {
      "_id": "transaction_id_6",
      "type": "bonus",
      "amount": 100,
      "category": "referral_bonus",
      "description": "Referral bonus for new user signup",
      "paymentMethod": "wallet",
      "status": "completed",
      "timestamp": "2024-01-12T11:00:00.000Z",
      "reference": "BONUS-REF-001"
    },
    {
      "_id": "transaction_id_7",
      "type": "referral",
      "amount": 50,
      "category": "referral_earning",
      "description": "Referral commission",
      "paymentMethod": "wallet",
      "status": "completed",
      "timestamp": "2024-01-11T08:30:00.000Z",
      "reference": "REF-COMM-001"
    },
    {
      "_id": "transaction_id_8",
      "type": "income",
      "amount": 3000,
      "category": "service_booking",
      "description": "Payment for booking #12338",
      "paymentMethod": "paymaya",
      "status": "completed",
      "timestamp": "2024-01-10T15:20:00.000Z",
      "reference": "BOOKING-12338",
      "accountDetails": {
        "paymayaCheckoutId": "checkout_789",
        "paymayaTransactionId": "payment_012"
      }
    },
    {
      "_id": "transaction_id_9",
      "type": "withdrawal",
      "amount": 5000,
      "category": "payout",
      "description": "Withdrawal to mobile money",
      "paymentMethod": "mobile_money",
      "status": "failed",
      "timestamp": "2024-01-09T10:15:00.000Z",
      "reference": "WITHDRAW-002",
      "accountDetails": {
        "phoneNumber": "+639123456789",
        "provider": "GCash"
      },
      "adminNotes": "Invalid account number"
    },
    {
      "_id": "transaction_id_10",
      "type": "expense",
      "amount": 250,
      "category": "transaction_fee",
      "description": "Transaction processing fee",
      "paymentMethod": "wallet",
      "status": "completed",
      "timestamp": "2024-01-08T12:00:00.000Z",
      "reference": "FEE-12344"
    }
  ]
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Financial data not found"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Server error"
}
```

### Transaction Object Fields

Each transaction object in the `data` array contains:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `_id` | String | Transaction ID | Yes |
| `type` | String | Transaction type: `income`, `expense`, `withdrawal`, `refund`, `bonus`, `referral`, `topup` | Yes |
| `amount` | Number | Transaction amount | Yes |
| `category` | String | Transaction category (e.g., `service_booking`, `service_fee`, `payout`) | No |
| `description` | String | Transaction description | No |
| `paymentMethod` | String | Payment method: `wallet`, `bank_transfer`, `mobile_money`, `card`, `cash`, `paypal`, `paymaya` | Yes (default: `wallet`) |
| `status` | String | Transaction status: `pending`, `completed`, `failed`, `cancelled` | Yes (default: `completed`) |
| `timestamp` | Date | Transaction timestamp (ISO 8601) | Yes |
| `reference` | String | Reference number or ID | No |
| `accountDetails` | Object | Payment account details (varies by payment method) | No |
| `adminNotes` | String | Admin notes (if any) | No |
| `processedAt` | Date | When transaction was processed | No |
| `processedBy` | String | User ID who processed the transaction | No |

### Transaction Types

- **`income`** - Money received (e.g., from service bookings, sales)
- **`expense`** - Money spent (e.g., service fees, transaction fees)
- **`withdrawal`** - Money withdrawn from wallet
- **`refund`** - Money refunded to user
- **`bonus`** - Bonus payments (e.g., referral bonuses)
- **`referral`** - Referral commissions
- **`topup`** - Wallet top-up transactions

### Payment Methods in Transactions

- **`wallet`** - Internal wallet balance
- **`bank_transfer`** - Bank transfer
- **`mobile_money`** - Mobile money (GCash, PayMaya, etc.)
- **`card`** - Credit/debit card
- **`cash`** - Cash payment
- **`paypal`** - PayPal payment
- **`paymaya`** - PayMaya payment

