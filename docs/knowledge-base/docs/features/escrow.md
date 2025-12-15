# Escrow Feature

## Overview

The Escrow feature provides secure payment holding for service transactions, ensuring funds are held until service completion.

## Key Features

- **2-Phase Payment** - Authorization and capture
- **Dispute Resolution** - Handle payment disputes
- **Proof of Work** - Validate service completion
- **Automatic Payout** - Release funds automatically
- **Multi-Gateway** - Support for PayMongo, Xendit, Stripe

## API Endpoints

### Create Escrow

```
POST /api/escrows
Body: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
}
```

### Get Escrows

```
GET /api/escrows
GET /api/escrows/:id
```

### Capture Payment

```
POST /api/escrows/:id/capture
```

### Dispute

```
POST /api/escrows/:id/dispute
POST /api/escrows/:id/dispute/resolve  # Admin only
```

## Escrow Flow

```
1. Create escrow (authorize payment)
2. Hold funds
3. Service completion
4. Capture payment (release funds)
   OR
4. Dispute raised
5. Admin resolution
6. Release or refund
```

## Payment Methods

- PayMongo
- Xendit
- Stripe
- PayPal
- PayMaya

## Documentation

For complete escrow documentation:
- [Escrows API Endpoints](../../../features/escrows/api-endpoints.md)
- [PayMongo Integration](../../../features/escrows/PAYMONGO_INTEGRATION.md)

