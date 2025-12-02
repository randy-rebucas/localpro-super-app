# Escrow Feature

## Overview

The Escrow feature provides a secure payment holding system for LocalPro bookings. It ensures that client funds are protected until the provider completes the work and the client approves the outcome.

### How It Works

1. **Client requests service** → Provider submits quote
2. **Client pays** → System creates an authorization/hold (payment not captured). Funds are held and marked as `FUNDS_HELD`
3. **Provider performs work** → Uploads proof of completion
4. **Client approves** → Upon approval, held payment is captured. Escrow is marked as `COMPLETE`
5. **Payout to provider** → Provider can request payout of their portion
6. **Dispute handling** → If dispute arises, admin can refund client or release payment to provider

## Key Features

- **Secure Payment Hold**: Funds are authorized but not captured until client approval
- **Immutable Audit Trail**: All transactions are logged in an immutable ledger for compliance
- **Multi-Gateway Support**: Integrates with PayMongo, Xendit, Stripe, and PayPal
- **Dispute Resolution**: Built-in dispute workflow with admin mediation
- **Proof of Work**: Providers can upload evidence of completed work
- **Automatic Payouts**: Seamless disbursement to provider accounts
- **Webhook Integration**: Real-time updates from payment gateways

## Database Schema

### Escrow

```javascript
{
  id: UUID,
  bookingId: ObjectId,
  clientId: ObjectId,
  providerId: ObjectId,
  currency: String, // USD, PHP, EUR, GBP, JPY
  amount: Number, // in cents
  holdProvider: String, // paymongo, xendit, stripe, paypal, paymaya
  providerHoldId: String, // authorization id from gateway
  status: String, // CREATED, FUNDS_HELD, IN_PROGRESS, COMPLETE, DISPUTE, REFUNDED, PAYOUT_INITIATED, PAYOUT_COMPLETED
  proofOfWork: {
    uploadedAt: Date,
    documents: [{
      type: String,
      url: String,
      uploadedAt: Date,
      metadata: { fileSize, mimeType }
    }],
    notes: String
  },
  clientApproval: {
    approved: Boolean,
    approvedAt: Date,
    notes: String
  },
  dispute: {
    raised: Boolean,
    raisedAt: Date,
    raisedBy: ObjectId,
    reason: String,
    evidence: [{ type, url, uploadedAt }],
    adminResolution: {
      decidedAt: Date,
      decidedBy: ObjectId,
      decision: String, // REFUND_CLIENT, PAYOUT_PROVIDER, SPLIT
      notes: String
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Payout

```javascript
{
  id: UUID,
  escrowId: ObjectId,
  providerId: ObjectId,
  amount: Number, // in cents
  currency: String,
  payoutProvider: String, // xendit, stripe, paypal, paymaya, bank_transfer
  gatewayPayoutId: String,
  providerPayoutMethod: {
    type: String, // bank_account, wallet, crypto
    accountDetails: {
      accountNumber: String,
      accountName: String,
      bankCode: String,
      walletAddress: String
    }
  },
  status: String, // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  metadata: {
    reference: String,
    description: String,
    tags: [String]
  },
  initiatedAt: Date,
  completedAt: Date,
  failureReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### EscrowTransaction (Audit Log)

Immutable ledger for all escrow activities:

```javascript
{
  id: UUID,
  escrowId: ObjectId,
  transactionType: String, // HOLD, CAPTURE, REFUND, DISPUTE_INITIATED, DISPUTE_RESOLVED, PAYOUT
  amount: Number,
  currency: String,
  status: String, // PENDING, SUCCESS, FAILED
  initiatedBy: ObjectId,
  gateway: {
    provider: String,
    transactionId: String,
    responseCode: String,
    responseMessage: String
  },
  metadata: {
    reason: String,
    notes: String,
    relatedPayoutId: ObjectId,
    tags: [String]
  },
  previousBalance: Number,
  newBalance: Number,
  timestamp: Date
}
```

## API Endpoints

### Client Endpoints

#### Create Escrow
```
POST /api/escrows/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "bookingId": "ObjectId",
  "providerId": "ObjectId",
  "amount": 50000, // in cents
  "currency": "USD",
  "holdProvider": "xendit" // or paymongo, stripe, paypal
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "FUNDS_HELD",
    "amount": 50000,
    "currency": "USD"
  },
  "message": "Escrow created successfully with funds held"
}
```

#### Capture Payment (Client Approval)
```
POST /api/escrows/:id/capture
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "clientApproval": {
      "approved": true,
      "approvedAt": "2024-12-01T10:00:00Z"
    }
  },
  "message": "Payment captured successfully"
}
```

#### Refund Payment
```
POST /api/escrows/:id/refund
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Client requested refund"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REFUNDED"
  },
  "message": "Payment refunded successfully"
}
```

#### Initiate Dispute
```
POST /api/escrows/:id/dispute
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Work not completed",
  "evidence": [
    {
      "type": "photo",
      "url": "https://..."
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "DISPUTE",
    "dispute": {
      "raised": true,
      "raisedAt": "2024-12-01T10:00:00Z",
      "reason": "Work not completed"
    }
  },
  "message": "Dispute raised successfully"
}
```

### Provider Endpoints

#### Upload Proof of Work
```
POST /api/escrows/:id/proof-of-work
Content-Type: application/json
Authorization: Bearer <token>

{
  "documents": [
    {
      "type": "photo",
      "url": "https://cloudinary.com/..."
    },
    {
      "type": "video",
      "url": "https://..."
    }
  ],
  "notes": "Work completed as requested"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "proofOfWork": {
      "uploadedAt": "2024-12-01T10:00:00Z",
      "documents": [...],
      "notes": "Work completed as requested"
    }
  },
  "message": "Proof of work uploaded successfully"
}
```

#### Request Payout
```
POST /api/escrows/:id/payout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "escrow": {
      "id": "uuid",
      "status": "PAYOUT_INITIATED"
    },
    "payout": {
      "id": "uuid",
      "status": "PROCESSING",
      "amount": 50000,
      "currency": "USD"
    }
  },
  "message": "Payout initiated successfully"
}
```

### Query/Retrieve Endpoints

#### Get Escrow Details
```
GET /api/escrows/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "escrow": {...},
    "payout": {...},
    "transactions": [...]
  }
}
```

#### Get User's Escrows
```
GET /api/escrows?status=COMPLETE&page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Escrow Transactions (Audit Log)
```
GET /api/escrows/:id/transactions?page=1&limit=50
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "transactionType": "HOLD",
      "amount": 50000,
      "status": "SUCCESS",
      "timestamp": "2024-12-01T09:00:00Z"
    },
    {
      "id": "uuid",
      "transactionType": "CAPTURE",
      "amount": 50000,
      "status": "SUCCESS",
      "timestamp": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### Get Payout Details
```
GET /api/escrows/:id/payout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "amount": 50000,
    "currency": "USD",
    "completedAt": "2024-12-02T15:30:00Z"
  }
}
```

### Admin Endpoints

#### Get All Escrows
```
GET /api/escrows/admin/all?status=DISPUTE&clientId=...&providerId=...&page=1&limit=20
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### Get Escrow Statistics
```
GET /api/escrows/admin/stats?startDate=2024-11-01&endDate=2024-12-01
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "byStatus": [
      {
        "_id": "COMPLETE",
        "count": 150,
        "totalAmount": 500000000 // in cents
      },
      {
        "_id": "DISPUTE",
        "count": 5,
        "totalAmount": 25000000
      }
    ],
    "totalVolume": [
      {
        "total": 525000000,
        "count": 155
      }
    ],
    "byProvider": [
      {
        "_id": "ObjectId",
        "count": 30,
        "totalAmount": 150000000
      }
    ]
  }
}
```

#### Resolve Dispute
```
POST /api/escrows/:id/dispute/resolve
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "decision": "PAYOUT_PROVIDER", // or REFUND_CLIENT, SPLIT
  "notes": "Provider fulfilled work requirements"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS", // Or REFUNDED depending on decision
    "dispute": {
      "adminResolution": {
        "decidedAt": "2024-12-01T14:00:00Z",
        "decision": "PAYOUT_PROVIDER",
        "notes": "Provider fulfilled work requirements"
      }
    }
  },
  "message": "Dispute resolved: PAYOUT_PROVIDER"
}
```

## Webhook Endpoints

Payment gateways send events to these endpoints:

### Payment Gateway Webhooks

```
POST /webhooks/payments?provider=xendit
POST /webhooks/payments?provider=paymongo
POST /webhooks/payments?provider=stripe

Headers:
x-signature: <gateway-signature>
```

Example Xendit payload:
```json
{
  "provider": "xendit",
  "event": "xendit_auth.authorization_success",
  "data": {
    "id": "auth_123456",
    "status": "APPROVED",
    "reference_id": "escrow_uuid"
  }
}
```

### Payout/Disbursement Webhooks

```
POST /webhooks/disbursements?provider=xendit
POST /webhooks/disbursements?provider=stripe

Headers:
x-signature: <gateway-signature>
```

Example Xendit payout event:
```json
{
  "provider": "xendit",
  "event": "disbursement_succeeded",
  "data": {
    "id": "disb_123456",
    "status": "COMPLETED",
    "reference_id": "payout_uuid"
  }
}
```

## Integration Guide

### Adding to Your Booking Flow

```javascript
// In your booking controller, when client initiates payment:

const booking = await Booking.findById(bookingId);
const escrow = await escrowService.createEscrow({
  bookingId: booking._id,
  clientId: booking.clientId,
  providerId: booking.providerId,
  amount: booking.pricing.total * 100, // Convert to cents
  currency: booking.currency,
  holdProvider: 'xendit' // Or get from config
});

// Update booking with escrow reference
booking.escrowId = escrow._id;
await booking.save();
```

### Handling Provider Completion

```javascript
// When provider uploads proof:

await escrowService.uploadProofOfWork(
  escrowId,
  providerId,
  documents,
  notes
);

// Notify client to review and approve
```

### Client Approval Workflow

```javascript
// When client approves:

const result = await escrowService.capturePayment(escrowId, clientId);

// Update booking status
booking.status = 'AWAITING_PROVIDER_COMPLETION';
await booking.save();
```

### Provider Payout

```javascript
// When provider requests payout:

const { payout, escrow } = await escrowService.processPayout(
  escrowId,
  providerId
);

// Payment gateway will handle actual disbursement
// Webhook will update status when complete
```

## Payment Gateway Configuration

### Xendit Setup

```env
XENDIT_API_KEY=xnd_...
XENDIT_WEBHOOK_TOKEN=...
XENDIT_PAYOUT_ACCOUNT_ID=...
```

### PayMongo Setup

```env
PAYMONGO_PUBLIC_KEY=pk_...
PAYMONGO_SECRET_KEY=sk_...
PAYMONGO_WEBHOOK_SECRET=...
```

### Stripe Setup

```env
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=...
```

### PayPal Setup

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
```

## Testing

### Create Escrow
```bash
curl -X POST http://localhost:5000/api/escrows/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "amount": 50000,
    "currency": "USD",
    "holdProvider": "xendit"
  }'
```

### Capture Payment
```bash
curl -X POST http://localhost:5000/api/escrows/64f1a2b3c4d5e6f7g8h9i0j3/capture \
  -H "Authorization: Bearer <token>"
```

### Get Escrow Details
```bash
curl -X GET http://localhost:5000/api/escrows/64f1a2b3c4d5e6f7g8h9i0j3 \
  -H "Authorization: Bearer <token>"
```

## Error Handling

Common error responses:

```json
{
  "success": false,
  "message": "Escrow not found",
  "code": "ESCROW_NOT_FOUND"
}

{
  "success": false,
  "message": "Cannot capture: Escrow status is REFUNDED",
  "code": "INVALID_STATUS"
}

{
  "success": false,
  "message": "Unauthorized: Only the client can approve capture",
  "code": "UNAUTHORIZED"
}

{
  "success": false,
  "message": "Payment hold failed: Insufficient funds",
  "code": "PAYMENT_FAILED"
}
```

## Best Practices

1. **Always verify user ownership** before allowing operations
2. **Log all transactions** for audit compliance
3. **Use webhook signatures** to verify gateway events
4. **Handle timeouts** gracefully with retry logic
5. **Implement monitoring** on webhook endpoints
6. **Test dispute flows** thoroughly before production
7. **Keep sensitive data** encrypted in logs
8. **Document all gateway integrations** thoroughly

## Troubleshooting

### Webhook Not Received
- Verify webhook URL is publicly accessible
- Check webhook signature verification
- Review gateway webhook logs
- Ensure firewall allows inbound traffic

### Payment Hold Failed
- Verify payment method is valid
- Check gateway API credentials
- Ensure amount is in correct format (cents)
- Review gateway response for specific error

### Payout Not Completing
- Verify provider payout method is configured
- Check account has sufficient balance
- Review gateway payout limits
- Check for compliance/regulatory holds

## Future Enhancements

- [ ] Partial refunds
- [ ] Multi-currency conversion
- [ ] Automated dispute resolution using AI
- [ ] Integration with more payment gateways
- [ ] Provider wallet balance management
- [ ] Advanced analytics and reporting
- [ ] Fraud detection and prevention
