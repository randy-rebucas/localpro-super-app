# PayMongo Feature Documentation

## Overview
The PayMongo feature provides payment processing integration for the Philippines market, supporting payment intents, charges, and refunds with escrow integration.

## Base Path
`/api/paymongo`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/create-intent` | Create payment intent | AUTHENTICATED |
| POST | `/confirm-payment` | Confirm payment with payment method | AUTHENTICATED |
| GET | `/intent/:intentId` | Get payment intent details | AUTHENTICATED |
| GET | `/charge/:chargeId` | Get charge details | AUTHENTICATED |
| POST | `/refund` | Create refund | AUTHENTICATED |
| GET | `/refund/:refundId` | Get refund details | AUTHENTICATED |

### Admin Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/intents` | List all payment intents | **admin** |
| GET | `/charges` | List all charges | **admin** |

## Request/Response Examples

### Create Payment Intent
```http
POST /api/paymongo/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "amount": 1500,
  "currency": "PHP"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "intentId": "pi_123456789",
    "clientSecret": "pi_123456789_secret_xyz",
    "publishableKey": "pk_test_...",
    "amount": 1500,
    "currency": "PHP"
  },
  "message": "Payment intent created successfully"
}
```

### Confirm Payment
```http
POST /api/paymongo/confirm-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "intentId": "pi_123456789",
  "paymentMethodId": "pm_987654321",
  "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "amount": 1500,
  "currency": "PHP"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "status": "FUNDS_HELD",
      "amount": 1500
    },
    "payment": {
      "intentId": "pi_123456789",
      "status": "succeeded"
    }
  },
  "message": "Payment confirmed and escrow created"
}
```

### Get Payment Intent Details
```http
GET /api/paymongo/intent/:intentId
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "pi_123456789",
    "status": "succeeded",
    "amount": 150000,
    "currency": "PHP",
    "charges": [...]
  }
}
```

### Get Charge Details
```http
GET /api/paymongo/charge/:chargeId
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "ch_123456789",
    "status": "paid",
    "amount": 150000,
    "currency": "PHP",
    "receipt_number": "RN123456789",
    "fees": 3750
  }
}
```

### Create Refund
```http
POST /api/paymongo/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "chargeId": "ch_123456789",
  "amount": 150000,
  "reason": "customer_request"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "refundId": "rf_123456789",
    "status": "pending",
    "amount": 150000
  },
  "message": "Refund created successfully"
}
```

### Get Refund Details
```http
GET /api/paymongo/refund/:refundId
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "rf_123456789",
    "status": "succeeded",
    "amount": 150000,
    "reason": "customer_request",
    "charge_id": "ch_123456789",
    "receipt_number": "RF123456789"
  }
}
```

### List Payment Intents (Admin)
```http
GET /api/paymongo/intents?limit=20
Authorization: Bearer <token>
```

### List Charges (Admin)
```http
GET /api/paymongo/charges?limit=20
Authorization: Bearer <token>
```

## Payment Flow with Escrow

1. **Payment Initiation**:
   - Client creates payment intent via `/create-intent`
   - Receives client secret for frontend

2. **Payment Processing**:
   - Client-side collects payment method
   - Payment confirmed via `/confirm-payment`
   - Escrow automatically created

3. **Escrow Management**:
   - Funds held until service completion
   - Client approves via escrow capture
   - Provider receives payout

4. **Refunds (if needed)**:
   - Refund created via `/refund`
   - Funds returned to customer
   - Escrow updated accordingly

## Payment Statuses

### Payment Intent Status
- `requires_payment_method` - Awaiting payment method
- `requires_confirmation` - Awaiting confirmation
- `processing` - Payment processing
- `succeeded` - Payment successful
- `failed` - Payment failed

### Charge Status
- `pending` - Charge pending
- `paid` - Charge successful
- `failed` - Charge failed

### Refund Status
- `pending` - Refund processing
- `succeeded` - Refund completed
- `failed` - Refund failed

## Supported Payment Methods

- **Cards**: Visa, Mastercard
- **E-Wallets**: GCash, GrabPay, Maya
- **Online Banking**: BPI, UnionBank, etc.

## Amount Handling

- Amounts are in centavos (PHP currency)
- Example: ₱1,500.00 = 150000 centavos
- Minimum amount: ₱100.00 (10000 centavos)

## Environment Variables

```env
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
```

## Related Features
- Escrows (Payment protection)
- Finance (Transaction recording)
- Marketplace (Booking payments)
- Payments (Other payment gateways)

