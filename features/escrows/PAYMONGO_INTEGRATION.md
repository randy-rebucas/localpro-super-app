# PayMongo Integration Guide

## Overview

PayMongo integration enables secure payment authorization, capture, refunds, and full webhook support for the LocalPro escrow system.

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# PayMongo API Keys
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# PayMongo Webhook Configuration
PAYMONGO_WEBHOOK_URL=https://your-domain.com/webhooks/payments?provider=paymongo
```

### 2. Get Your Keys

1. Sign up at [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to Settings > API Keys
3. Copy your Public and Secret keys
4. Configure webhook endpoint in Dashboard > Webhooks

### 3. Configure Webhook

In PayMongo Dashboard:

1. Go to Webhooks
2. Add new webhook with URL: `https://your-domain.com/webhooks/payments?provider=paymongo`
3. Subscribe to these events:
   - `payment_intent.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.awaiting_next_action`
   - `charge.refunded`

4. Copy the webhook secret to `PAYMONGO_WEBHOOK_SECRET`

## How It Works

### Payment Flow

```
Client
  ↓ Creates Escrow
  ↓ POST /api/paymongo/create-intent
PayMongo API
  ↓ Returns Payment Intent + Client Secret
  ↓ Client compiles payment method
  ↓ POST /api/paymongo/confirm-payment
  ↓ Funds Held (Authorization)
  ↓ Escrow Status: FUNDS_HELD
  ↓ Webhook: payment_intent.succeeded
```

### Authorization vs Capture

**Authorization (Hold)**: Funds are reserved but not captured
- Used for: Escrow payment holds
- Duration: Up to 7 days
- Reversible: Yes

**Capture**: Funds are actually deducted
- Used for: Final payment when client approves work
- Duration: Permanent
- Reversible: Only via refund

## API Endpoints

### Create Payment Intent

Create a payment authorization for escrow.

```http
POST /api/paymongo/create-intent
Content-Type: application/json
Authorization: Bearer <token>

{
  "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "amount": 50000,
  "currency": "PHP"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intentId": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abcdef",
    "publishableKey": "pk_test_...",
    "amount": 50000,
    "currency": "PHP"
  },
  "message": "Payment intent created successfully"
}
```

### Confirm Payment

Confirm payment with payment method to complete authorization.

```http
POST /api/paymongo/confirm-payment
Content-Type: application/json
Authorization: Bearer <token>

{
  "intentId": "pi_1234567890",
  "paymentMethodId": "pm_abcdef1234567890",
  "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "amount": 50000,
  "currency": "PHP"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "escrow_uuid",
      "status": "FUNDS_HELD",
      "amount": 50000
    },
    "payment": {
      "intentId": "pi_1234567890",
      "status": "succeeded"
    }
  },
  "message": "Payment confirmed and escrow created"
}
```

### Get Payment Intent

Retrieve payment intent details.

```http
GET /api/paymongo/intent/:intentId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pi_1234567890",
    "status": "succeeded",
    "amount": 50000,
    "currency": "PHP",
    "charges": {...}
  }
}
```

### Get Charge Details

```http
GET /api/paymongo/charge/:chargeId
Authorization: Bearer <token>
```

### Create Refund

```http
POST /api/paymongo/refund
Content-Type: application/json
Authorization: Bearer <token>

{
  "chargeId": "charge_1234567890",
  "amount": 50000,
  "reason": "customer_request"
}
```

### Get Refund Details

```http
GET /api/paymongo/refund/:refundId
Authorization: Bearer <token>
```

### List Payment Intents (Admin)

```http
GET /api/paymongo/intents?limit=20
Authorization: Bearer <admin_token>
```

### List Charges (Admin)

```http
GET /api/paymongo/charges?limit=20
Authorization: Bearer <admin_token>
```

## Client-Side Implementation

### 1. Install PayMongo Libraries

```bash
npm install @paymongo/paymongo-js
```

### 2. Create Payment Intent

```javascript
// Frontend code
const response = await fetch('/api/paymongo/create-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    bookingId: '64f1a2b3c4d5e6f7g8h9i0j1',
    providerId: '64f1a2b3c4d5e6f7g8h9i0j2',
    amount: 50000,
    currency: 'PHP'
  })
});

const { data } = await response.json();
const { intentId, clientSecret, publishableKey } = data;
```

### 3. Initialize PayMongo Client

```javascript
import { PayMongo } from '@paymongo/paymongo-js';

const paymongo = new PayMongo({
  publicKey: publishableKey
});
```

### 4. Create Payment Method

```javascript
// Create card payment method
const { paymentMethod, error } = await paymongo.createPaymentMethod({
  type: 'card',
  card: {
    number: cardNumber,
    exp_month: expiryMonth,
    exp_year: expiryYear,
    cvc: cvc
  },
  billing: {
    name: holderName,
    email: email,
    phone: phone
  }
});

if (error) {
  console.error('Payment method creation failed:', error);
  return;
}
```

### 5. Confirm Payment

```javascript
const confirmResponse = await fetch('/api/paymongo/confirm-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    intentId,
    paymentMethodId: paymentMethod.id,
    bookingId,
    providerId,
    amount,
    currency: 'PHP'
  })
});

const result = await confirmResponse.json();

if (result.success) {
  // Payment successful, funds held in escrow
  console.log('Escrow created:', result.data.escrow);
} else {
  // Payment failed
  console.error('Payment failed:', result.message);
}
```

## Webhook Events

### Payment Intent Succeeded

Fired when authorization is confirmed.

```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "id": "pi_1234567890",
    "attributes": {
      "status": "succeeded",
      "amount": 50000,
      "currency": "PHP",
      "charges": {
        "data": [
          {
            "id": "charge_123",
            "attributes": {
              "status": "authorized",
              "amount": 50000
            }
          }
        ]
      }
    }
  }
}
```

**Action**: Escrow marked as FUNDS_HELD

### Payment Failed

Fired when payment authorization fails.

```json
{
  "type": "payment_intent.payment_failed",
  "data": {
    "id": "pi_1234567890",
    "attributes": {
      "failure_code": "card_declined",
      "failure_message": "Your card was declined"
    }
  }
}
```

**Action**: Refund initiated, escrow cancelled

### Charge Refunded

Fired when a charge is refunded.

```json
{
  "type": "charge.refunded",
  "data": {
    "id": "charge_123",
    "attributes": {
      "status": "refunded",
      "amount_refunded": 50000,
      "amount": 50000
    }
  }
}
```

**Action**: Escrow status updated to REFUNDED

## Error Handling

### Common Errors

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| `card_declined` | Card was declined | Use different card |
| `insufficient_funds` | Account has insufficient funds | Use different payment method |
| `invalid_card` | Card details are invalid | Verify card information |
| `processing_error` | Gateway processing error | Retry transaction |
| `authentication_required` | 3D Secure required | Complete 3DS challenge |

### Example Error Response

```json
{
  "success": false,
  "message": "Your card was declined",
  "error": {
    "code": "card_declined",
    "message": "Your card was declined",
    "param": "card"
  }
}
```

## Testing

### Test Cards

Use these cards in test mode:

| Card Number | CVC | Exp | Status |
|------------|-----|-----|--------|
| 4242 4242 4242 4242 | 123 | 12/25 | Success |
| 4000 0000 0000 0002 | 123 | 12/25 | Declined |
| 4000 0000 0000 0341 | 123 | 12/25 | 3D Secure |
| 5555 5555 5555 4444 | 123 | 12/25 | Success (Mastercard) |

### Test Webhook

Use PayMongo CLI to test webhooks:

```bash
# Install PayMongo CLI
npm install -g @paymongo/cli

# Test webhook
paymongo webhook trigger payment_intent.succeeded
```

## Rate Limits

PayMongo applies rate limits:

- **10 requests per second** per API key
- **1000 requests per hour** per API key

Recommended retry strategy:

```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.statusCode === 429 && i < maxRetries - 1) {
        // Rate limited, wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } else {
        throw error;
      }
    }
  }
};
```

## Security Best Practices

### 1. Never Log Sensitive Data

```javascript
// ✅ GOOD: Don't log payment details
logger.info('Payment created', { intentId: 'pi_123' });

// ❌ BAD: Never log card or secret
logger.info('Payment details', { secret_key: process.env.PAYMONGO_SECRET_KEY });
```

### 2. Verify Webhook Signatures

```javascript
const verifyPaymongoSignature = (payload, signature) => {
  const crypto = require('crypto');
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};
```

### 3. Use HTTPS Only

All communication with PayMongo API must use HTTPS.

### 4. Store Keys Securely

Never commit API keys to version control:

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

## Troubleshooting

### Webhook Not Received

1. Verify webhook URL is publicly accessible
2. Check firewall allows HTTPS traffic (port 443)
3. Verify webhook secret in environment
4. Check PayMongo dashboard for webhook logs
5. Test webhook with PayMongo CLI

### Payment Authorization Failing

1. Verify card details are correct
2. Check card has sufficient balance
3. Verify currency is supported
4. Check amount is in correct format (cents)
5. Review PayMongo error response

### Signature Verification Failing

1. Verify `PAYMONGO_WEBHOOK_SECRET` is correct
2. Check webhook payload hasn't been modified
3. Ensure signature is in correct header
4. Verify secret in dashboard matches environment

### Charge Not Capturing

1. Verify authorization is still valid (< 7 days)
2. Check escrow status is IN_PROGRESS
3. Verify client approval was recorded
4. Review gateway response for errors

## Integration with Escrow Feature

### Full Payment Workflow

```
1. Client initiates payment
   POST /api/paymongo/create-intent
   ↓ Returns intentId + clientSecret

2. Client completes payment on frontend
   paymongo.createPaymentMethod() + confirm
   ↓ Calls /api/paymongo/confirm-payment

3. Funds held in escrow
   POST /api/escrows/create (called internally)
   ↓ Escrow status = FUNDS_HELD

4. Provider completes work
   POST /api/escrows/:id/proof-of-work
   ↓ Upload evidence

5. Client approves
   POST /api/escrows/:id/capture
   ↓ Calls paymongoService.capturePayment()
   ↓ Escrow status = IN_PROGRESS

6. Provider requests payout
   POST /api/escrows/:id/payout
   ↓ Payout status = PROCESSING

7. Webhook confirms capture
   Webhook: charge captured
   ↓ Update transaction log

8. Payout completes
   Webhook: disbursement succeeded
   ↓ Escrow status = PAYOUT_COMPLETED
```

## API Reference

For detailed PayMongo API documentation, visit:
- [PayMongo Documentation](https://developers.paymongo.com/docs)
- [Payment Intents Guide](https://developers.paymongo.com/docs/payment-intents)
- [Charges Guide](https://developers.paymongo.com/docs/charges)
- [Refunds Guide](https://developers.paymongo.com/docs/refunds)
- [Webhooks Guide](https://developers.paymongo.com/docs/webhooks)

## Support

For issues:
1. Check [PayMongo Status Page](https://status.paymongo.com)
2. Review error logs in dashboard
3. Contact PayMongo support: support@paymongo.com
4. Check our [Troubleshooting Guide](./troubleshooting.md)

## Example Implementation

See `features/escrows/` for complete integration examples including:
- Full escrow workflow
- Error handling
- Webhook processing
- Testing strategies
