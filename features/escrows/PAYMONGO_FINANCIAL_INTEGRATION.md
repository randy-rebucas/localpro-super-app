# PayMongo Financial Integration Guide

## Overview

PayMongo is now integrated across all financial transactions in the LocalPro Super App:

1. **Service Bookings** - Payment holds for marketplace bookings
2. **Subscription Payments** - LocalPro Plus subscription billing
3. **Wallet Top-Ups** - User wallet funding with authorization and capture
4. **Provider Payouts** - Escrow disbursement to provider accounts
5. **Refunds** - Full/partial refunds for cancelled services

## Financial Transaction Flows

### 1. Service Booking with PayMongo

**Flow**: Client selects PayMongo → Authorization Hold → Service Completion → Capture

```
1. Client creates booking with PayMongo payment method
   POST /api/marketplace/bookings
   {
     "serviceId": "service_id",
     "bookingDate": "2025-12-05T10:00:00",
     "duration": 2,
     "paymentMethod": "paymongo"
   }

2. System creates PayMongo authorization hold
   - Converts amount to cents (PHP * 100)
   - Calls paymongoService.createAuthorization()
   - Returns clientSecret and publishableKey for client-side confirmation

3. Response includes payment details:
   {
     "success": true,
     "data": {
       "booking": { ...booking details },
       "paymentDetails": {
         "clientSecret": "pi_xxx_secret_xxx",
         "publishableKey": "pk_test_xxx",
         "intentId": "pi_xxx"
       }
     }
   }

4. Client-side confirms payment with paymentMethodId
   POST /api/paymongo/confirm-payment
   {
     "intentId": "pi_xxx",
     "paymentMethodId": "pm_xxx",
     "bookingId": "booking_xxx"
   }

5. Payment captured when service is completed
   - Admin approves completion
   - System calls paymongoService.capturePayment()
   - Booking status → COMPLETE
   - Payment status → PAID
```

**Database Fields** (Booking model):
```javascript
payment: {
  method: "paymongo",
  status: "pending" | "paid" | "refunded" | "failed",
  paymongoIntentId: "pi_xxx",
  paymongoChargeId: "charge_xxx",
  paymongoPaymentId: "payment_xxx",
  paidAt: Date
}
```

**Integration Point**: `src/controllers/marketplaceController.js` → `createBooking()`

---

### 2. LocalPro Plus Subscription with PayMongo

**Flow**: Select PayMongo Payment Method → Create Authorization → Admin Confirmation → Capture

```
1. User initiates subscription upgrade
   POST /api/localpro-plus/subscribe
   {
     "planId": "plan_xxx",
     "paymentMethod": "paymongo",
     "billingCycle": "monthly"
   }

2. System creates PayMongo authorization for subscription amount
   - Amount: plan price converted to cents
   - Currency: PHP or user's currency
   - Description: Includes plan name and billing cycle

3. Creates pending UserSubscription record with PayMongo details
   {
     "status": "pending",
     "paymentMethod": "paymongo",
     "paymentDetails": {
       "paymongoIntentId": "pi_xxx",
       "paymongoCustomerId": "cus_xxx",
       "lastPaymentId": "pi_xxx",
       "nextPaymentAmount": price
     }
   }

4. Admin confirms subscription payment
   - Captures PayMongo authorization
   - Updates subscription status → "active"
   - Triggers feature enablement
   - Sets next billing date

5. Recurring billing (monthly/yearly)
   - Webhook from PayMongo on nextBillingDate
   - System creates new authorization and captures
   - Updates nextBillingDate for next cycle
```

**Database Fields** (UserSubscription model):
```javascript
paymentMethod: "paymongo",
paymentDetails: {
  paymongoCustomerId: "cus_xxx",
  paymongoIntentId: "pi_xxx",
  lastPaymentId: "pi_xxx",
  nextPaymentAmount: Number,
  lastPaymentDate: Date
}
```

**Integration Point**: `src/controllers/localproPlusController.js` → `subscribeToLocalProPlus()`

---

### 3. Wallet Top-Up with PayMongo

**Flow**: Initialize PayMongo Hold → Upload Receipt → Admin Approval → Capture → Balance Update

```
1. User initiates wallet top-up
   POST /api/finance/top-up
   Headers: multipart/form-data
   Body:
   {
     "amount": 100,
     "paymentMethod": "paymongo",
     "reference": "optional_reference"
   }
   File: receipt_image

2. System processes top-up request:
   a. Validates amount (minimum $10)
   b. Uploads receipt to Cloudinary
   c. Creates PayMongo authorization hold
   d. Saves top-up request with PayMongo details
   e. Notifies admin with receipt and payment status

   Top-up Status:
   - "pending" = awaiting admin approval
   - "authorized" = PayMongo hold created, awaiting capture

3. Response includes PayMongo details:
   {
     "success": true,
     "data": {
       "topUpRequest": {
         "paymongoDetails": {
           "intentId": "pi_xxx",
           "clientSecret": "pi_xxx_secret_xxx",
           "publishableKey": "pk_test_xxx"
         }
       }
     }
   }

4. Admin reviews receipt and approves top-up
   PUT /api/finance/top-ups/:topUpId/process
   {
     "status": "approved",
     "adminNotes": "Receipt verified"
   }

5. System captures PayMongo payment:
   - Calls paymongoService.capturePayment()
   - Updates finance.wallet.balance
   - Creates transaction record with PayMongo IDs
   - Notifies user of successful top-up

6. Final state:
   {
     "wallet": {
       "balance": previousBalance + 100,
       "lastUpdated": Date
     },
     "transactions": [{
       "type": "topup",
       "amount": 100,
       "paymentMethod": "paymongo",
       "paymongoIntentId": "pi_xxx",
       "paymongoChargeId": "charge_xxx",
       "status": "completed"
     }]
   }
```

**Database Fields** (Finance model):
```javascript
topUpRequests: [{
  amount: Number,
  paymentMethod: "paymongo",
  paymongoIntentId: "pi_xxx",
  paymongoChargeId: "charge_xxx",
  status: "pending" | "authorized" | "approved" | "rejected"
}],

transactions: [{
  paymongoIntentId: "pi_xxx",
  paymongoChargeId: "charge_xxx",
  paymongoPaymentId: "payment_xxx"
}]
```

**Integration Point**: `src/controllers/financeController.js` → `requestTopUp()`, `processTopUp()`

---

### 4. Escrow Payment Holds (Service Completion)

**Flow**: Create Escrow Hold → Service Delivery → Capture or Refund

```
1. Booking automatically creates escrow hold
   - Amount held from client's PayMongo card
   - Duration: Until service completion or dispute resolution
   - Maximum hold duration: 7 days (PayMongo limit)

2. After service completion:
   - Provider uploads proof of work
   - Client approves completion
   - System captures escrow payment
   - Funds released to provider payout

3. Dispute scenario:
   - If client initiates dispute
   - Funds remain on hold
   - Admin investigates and decides
   - Either refunds client or releases to provider

4. Automatic release:
   - If not captured within 7 days
   - PayMongo automatically releases authorization
   - Client is not charged
```

**Integration Point**: `src/services/escrowService.js`, `src/routes/escrows.js`

---

### 5. Provider Payouts with PayMongo

**Flow**: Service Captured → Payout Requested → Admin Processes → Fund Disbursement

```
1. Provider requests payout
   POST /api/escrows/:escrowId/payout
   {
     "payoutMethod": "paymongo_wallet"
   }

2. System creates Payout record:
   {
     "escrowId": "escrow_xxx",
     "providerId": "provider_xxx",
     "amount": service_price,
     "payoutProvider": "paymongo",
     "status": "PENDING"
   }

3. Admin processes payout:
   - Verifies provider has PayMongo wallet/account
   - Initiates payout from platform to provider
   - Webhook receives payout confirmation
   - Updates payout status → "COMPLETED"

4. Provider receives funds:
   - If PayMongo Wallet: Direct credit
   - If Bank Transfer: 1-2 business day settlement
```

**Integration Point**: `src/services/escrowService.js` → `processPayout()`

---

## API Integration Points

### Models Updated

| Model | Payment Fields Added | Purpose |
|-------|---------------------|---------|
| `Finance.js` | `paymongoIntentId`, `paymongoChargeId`, `paymongoPaymentId` | Track top-up and withdrawal payments |
| `LocalProPlus.js` | `paymongoCustomerId`, `paymongoIntentId` | Subscription billing tracking |
| `Marketplace.js` (Booking) | `paymongoIntentId`, `paymongoChargeId`, `paymongoPaymentId` | Service booking payments |
| `Payout.js` | Already supports multiple providers | Provider disbursement tracking |
| `Escrow.js` | Already supports multiple providers | Escrow hold and capture tracking |

### Controllers Updated

| Controller | Method | Changes |
|------------|--------|---------|
| `marketplaceController.js` | `createBooking()` | Added PayMongo authorization flow |
| `localproPlusController.js` | `subscribeToLocalProPlus()` | Added PayMongo payment option |
| `financeController.js` | `requestTopUp()` | Added PayMongo hold creation |
| `financeController.js` | `processTopUp()` | Added PayMongo capture |
| `escrowController.js` | `createEscrow()` | Uses existing paymongoService |
| `escrowController.js` | `capturePayment()` | Uses existing paymongoService |

### Services

**`paymongoService.js`** provides all PayMongo operations:
- `createAuthorization()` - Create hold (capture: false)
- `confirmPayment()` - Confirm payment method
- `capturePayment()` - Capture hold
- `releaseAuthorization()` - Release/refund
- `refundPayment()` - Create refund
- `verifyWebhookSignature()` - Webhook validation

**`escrowService.js`** orchestrates escrow operations using paymongoService

---

## Webhook Integration

All PayMongo payment events are processed via webhooks:

**Webhook URL**: `POST /webhooks/payments?provider=paymongo`

**Events Handled**:
- `payment_intent.succeeded` - Payment authorized
- `payment_intent.payment_failed` - Authorization failed
- `charge.created` - Charge created
- `charge.updated` - Charge updated
- `charge.paid` - Charge captured
- `charge.refunded` - Refund processed

**Webhook Handler**: `src/routes/escrowWebhooks.js`

**Signature Verification**: HMAC-SHA256 using `PAYMONGO_WEBHOOK_SECRET`

---

## Environment Variables

```env
# PayMongo Configuration
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx

# Admin Email for notifications
ADMIN_EMAIL=admin@localpro.com

# Frontend URLs
FRONTEND_URL=https://app.localpro.com
```

---

## Request/Response Examples

### 1. Create Booking with PayMongo

**Request**:
```http
POST /api/marketplace/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "bookingDate": "2025-12-05T10:00:00",
  "duration": 2,
  "address": {
    "street": "123 Main St",
    "city": "Manila",
    "state": "NCR",
    "zipCode": "1000",
    "country": "PH",
    "coordinates": {
      "latitude": 14.5995,
      "longitude": 120.9842
    }
  },
  "paymentMethod": "paymongo"
}
```

**Response** (PayMongo):
```json
{
  "success": true,
  "message": "Booking created successfully with PayMongo payment",
  "data": {
    "booking": {
      "_id": "booking_xxx",
      "service": { ...service details },
      "client": { ...client details },
      "provider": { ...provider details },
      "bookingDate": "2025-12-05T10:00:00",
      "duration": 2,
      "pricing": {
        "basePrice": 50,
        "totalAmount": 100,
        "currency": "PHP"
      },
      "payment": {
        "method": "paymongo",
        "status": "pending",
        "paymongoIntentId": "pi_1234567890abcdef"
      }
    },
    "paymentDetails": {
      "clientSecret": "pi_1234567890abcdef_secret_xxxxx",
      "publishableKey": "pk_test_xxxxx",
      "intentId": "pi_1234567890abcdef"
    }
  }
}
```

### 2. Confirm PayMongo Payment

**Request**:
```http
POST /api/paymongo/confirm-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "intentId": "pi_1234567890abcdef",
  "paymentMethodId": "pm_card_visa_visa",
  "bookingId": "booking_xxx",
  "providerId": "provider_xxx",
  "amount": 10000,
  "currency": "PHP"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "escrow": {
      "_id": "escrow_xxx",
      "status": "FUNDS_HELD",
      "amount": 10000,
      "holdProvider": "paymongo",
      "providerHoldId": "pi_1234567890abcdef"
    },
    "payment": {
      "status": "captured",
      "chargeId": "charge_xxxxx"
    }
  }
}
```

### 3. Request Wallet Top-Up with PayMongo

**Request**:
```http
POST /api/finance/top-up
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- amount: 100
- paymentMethod: paymongo
- reference: top-up-001
- receipt: [image file]
```

**Response**:
```json
{
  "success": true,
  "message": "Top-up initiated with PayMongo. Please complete the payment.",
  "data": {
    "topUpRequest": {
      "_id": "topup_xxx",
      "amount": 100,
      "paymentMethod": "paymongo",
      "status": "authorized",
      "requestedAt": "2025-12-01T10:00:00Z",
      "paymongoDetails": {
        "intentId": "pi_topup_xxx",
        "clientSecret": "pi_topup_xxx_secret_xxxxx",
        "publishableKey": "pk_test_xxxxx"
      }
    }
  }
}
```

### 4. Subscribe with PayMongo

**Request**:
```http
POST /api/localpro-plus/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_pro",
  "paymentMethod": "paymongo",
  "billingCycle": "monthly"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription initiated. Please confirm payment.",
  "data": {
    "subscription": {
      "_id": "subscription_xxx",
      "plan": "plan_pro",
      "status": "pending",
      "billingCycle": "monthly",
      "paymentMethod": "paymongo",
      "paymentDetails": {
        "paymongoIntentId": "pi_sub_xxx",
        "nextPaymentAmount": 99
      },
      "startDate": "2025-12-01T00:00:00Z",
      "nextBillingDate": "2026-01-01T00:00:00Z"
    },
    "paymentUrl": "https://app.localpro.com/confirm-payment?intentId=pi_sub_xxx"
  }
}
```

---

## Error Handling

### PayMongo-Specific Errors

| Error | Handling | Recovery |
|-------|----------|----------|
| Invalid card | Return 422 error to client | Client selects different card |
| Insufficient funds | Return 402 error | Client adds funds or uses different card |
| 3D Secure required | Return awaiting_next_action | Redirect to 3DS verification |
| Authorization expired | Return 400 error | Create new authorization |
| Network timeout | Retry 3x with exponential backoff | Log and notify admin |
| Webhook signature invalid | Reject request (400) | Check webhook secret |

### Fallback Behavior

For each transaction type, if PayMongo fails:
- **Bookings**: Fall back to cash payment, admin manually collects
- **Subscriptions**: Reject subscription until PayMongo is fixed
- **Top-ups**: Mark as pending, await manual admin review
- **Payouts**: Mark as failed, notify provider to retry

---

## Testing PayMongo Integration

### Test Cards

| Card | Number | CVC | Exp |
|------|--------|-----|-----|
| Visa (Success) | 4005519200000004 | Any | Any |
| Visa (3DS) | 4012000033330026 | Any | Any |
| Visa (Fail) | 4000000400000002 | Any | Any |

### Local Testing

```bash
# 1. Start ngrok for webhook testing
ngrok http 5000

# 2. Configure PayMongo webhook
# https://dashboard.paymongo.com → Settings → Webhooks
# URL: https://<ngrok-url>/webhooks/payments?provider=paymongo

# 3. Run tests
npm test -- --testMatch="**/paymongo*"

# 4. Test webhook locally
npm run test:webhook
```

### Integration Testing

```javascript
// Example: Test booking with PayMongo
describe('Booking with PayMongo', () => {
  it('should create authorization hold', async () => {
    const res = await request(app)
      .post('/api/marketplace/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: 'service_xxx',
        bookingDate: '2025-12-05T10:00:00',
        duration: 2,
        paymentMethod: 'paymongo'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentDetails.intentId).toBeDefined();
    expect(res.body.data.booking.payment.paymongoIntentId).toBeDefined();
  });
});
```

---

## Monitoring & Debugging

### Logs to Check

```bash
# PayMongo API calls
grep "PayMongo" /var/log/app.log

# Webhook processing
grep "webhook" /var/log/app.log | grep "paymongo"

# Transaction failures
grep "payment.*failed" /var/log/app.log
```

### Database Queries

```javascript
// Find all PayMongo transactions
db.finances.find({
  "transactions.paymongoIntentId": { $exists: true }
})

// Find pending PayMongo holds
db.escrows.find({
  "holdProvider": "paymongo",
  "status": "FUNDS_HELD"
})

// Find failed PayMongo authorizations
db.escrows.find({
  "holdProvider": "paymongo",
  "status": "REFUNDED"
})
```

### Admin Dashboard

Recommended metrics to track:
- Total PayMongo transactions
- Success/failure rate
- Average authorization time
- Refund rate
- Webhook delivery success rate
- Failed payment recovery

---

## Migration Path

### From PayPal/PayMaya to PayMongo

1. **Existing Transactions**: No impact, continue processing with original gateway
2. **New Transactions**: Use PayMongo as default for all new users
3. **User Preference**: Allow users to choose payment method on each transaction
4. **Batch Migration**: Admin tool to migrate existing PayPal subscriptions to PayMongo

### Rollback Procedure

If PayMongo integration needs to be disabled:

1. Set `PAYMONGO_SECRET_KEY` to empty
2. Update controllers to skip PayMongo payment flow
3. Fall back to cash/manual payment for new transactions
4. Notify users via email
5. Provide PayPal/PayMaya as alternatives

---

## Compliance & Security

### PCI DSS Compliance

- ✅ No card data stored on platform (PayMongo PCI Level 1)
- ✅ Payment Intent ID stored, not card details
- ✅ Client-side token creation via PayMongo SDK
- ✅ HTTPS enforced on all payment endpoints

### Webhook Security

- ✅ HMAC-SHA256 signature verification
- ✅ Timestamp validation (within 5 minutes)
- ✅ Idempotency check (prevent duplicate processing)

### Data Encryption

- ✅ Sensitive PayMongo IDs are stored
- ✅ Transactions logged with sanitized details
- ✅ Audit trail maintained for all payments

---

## Support & Contact

For PayMongo integration issues:
1. Check `PAYMONGO_TESTING.md` for test procedures
2. Review PayMongo API docs: https://developers.paymongo.com
3. Contact PayMongo support: support@paymongo.com
4. Check application logs in `/logs` directory
5. Enable debug mode: `DEBUG=paymongo:* npm start`

