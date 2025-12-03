# Escrows Feature Documentation

## Overview
The Escrows feature provides secure payment protection between clients and service providers. Funds are held in escrow until service completion, protecting both parties.

## Base Path
`/api/escrows`

## Endpoints

### Authenticated Endpoints (User)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Get user's escrows | AUTHENTICATED |
| GET | `/:id` | Get escrow details | AUTHENTICATED |
| GET | `/:id/transactions` | Get escrow transaction history | AUTHENTICATED |
| GET | `/:id/payout` | Get payout details | AUTHENTICATED |
| POST | `/create` | Create new escrow | AUTHENTICATED |
| POST | `/:id/capture` | Capture held payment (client approval) | AUTHENTICATED |
| POST | `/:id/refund` | Request refund (before capture) | AUTHENTICATED |
| POST | `/:id/dispute` | Initiate dispute | AUTHENTICATED |
| POST | `/:id/proof-of-work` | Upload proof of work completion | **provider** |
| POST | `/:id/payout` | Request payout | **provider** |

### Admin Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/admin/all` | Get all escrows | **admin** |
| GET | `/admin/stats` | Get escrow statistics | **admin** |
| POST | `/:id/dispute/resolve` | Resolve dispute | **admin** |

## Request/Response Examples

### Create Escrow (Client)
```http
POST /api/escrows/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "amount": 50000,
  "currency": "PHP",
  "holdProvider": "paymongo"
}
```

### Capture Payment (Client Approval)
```http
POST /api/escrows/:id/capture
Authorization: Bearer <token>
```

### Upload Proof of Work (Provider)
```http
POST /api/escrows/:id/proof-of-work
Authorization: Bearer <token>
Content-Type: application/json

{
  "documents": [
    {
      "type": "photo",
      "url": "https://cloudinary.com/.../completed-work.jpg"
    }
  ],
  "notes": "Work completed successfully. All requirements met."
}
```

### Request Payout (Provider)
```http
POST /api/escrows/:id/payout
Authorization: Bearer <token>
```

### Initiate Dispute
```http
POST /api/escrows/:id/dispute
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Provider did not complete work as agreed",
  "evidence": [
    {
      "type": "photo",
      "url": "https://cloudinary.com/.../evidence.jpg"
    }
  ]
}
```

### Resolve Dispute (Admin)
```http
POST /api/escrows/:id/dispute/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "decision": "PAYOUT_PROVIDER",
  "notes": "Provider has furnished adequate proof of work completion"
}
```

**Decision options:**
- `REFUND_CLIENT`: Refund payment to client
- `PAYOUT_PROVIDER`: Process payout to provider
- `SPLIT`: Split funds between parties (50/50)

## Escrow Flow

1. **Escrow Creation**:
   - Client creates escrow when booking service
   - Funds held by payment gateway
   - Status: `FUNDS_HELD`

2. **Service Completion**:
   - Provider completes service
   - Provider uploads proof of work
   - Status remains: `FUNDS_HELD`

3. **Client Approval**:
   - Client reviews work
   - Client captures payment (approves)
   - Status: `IN_PROGRESS` → `COMPLETE`

4. **Payout**:
   - Provider requests payout
   - Funds released to provider
   - Status: `PAYOUT_INITIATED` → `PAYOUT_COMPLETE`

5. **Dispute (if needed)**:
   - Either party can initiate dispute
   - Admin reviews and resolves
   - Status: `DISPUTE` → (resolution applied)

## Escrow Status Flow

```
FUNDS_HELD → IN_PROGRESS → PAYOUT_INITIATED → PAYOUT_COMPLETE
     ↓            ↓               ↓
  REFUNDED     DISPUTE    →  (Admin Resolution)
                              ↓        ↓        ↓
                           REFUNDED  PAYOUT   SPLIT
```

## Escrow Statuses

- `FUNDS_HELD` - Funds held, awaiting service completion
- `IN_PROGRESS` - Payment captured, service in progress
- `PAYOUT_INITIATED` - Payout requested, processing
- `PAYOUT_COMPLETE` - Payout completed to provider
- `REFUNDED` - Payment refunded to client
- `DISPUTE` - Dispute raised, awaiting resolution
- `CANCELLED` - Escrow cancelled

## Transaction Types

- `HOLD` - Initial payment hold
- `CAPTURE` - Payment captured (client approved)
- `REFUND` - Payment refunded
- `PAYOUT` - Funds disbursed to provider

## Supported Payment Gateways

- `paymongo` - PayMongo (primary)
- `paypal` - PayPal
- `paymaya` - PayMaya
- `xendit` - Xendit
- `stripe` - Stripe

## Related Features
- Marketplace (Bookings)
- Payments (PayMongo, PayPal, PayMaya)
- Finance (Payouts)
- Trust Verification

## Detailed Documentation
See `/features/escrows/` for comprehensive escrow documentation:
- [API Endpoints](../../features/escrows/api-endpoints.md)
- [PayMongo Integration](../../features/escrows/PAYMONGO_INTEGRATION.md)
- [Best Practices](../../features/escrows/best-practices.md)

