# Webhooks

## Overview

Webhooks allow external services to notify the API of events (payments, subscriptions, etc.).

## Supported Webhooks

### PayPal Webhooks

**Endpoint**: `POST /api/paypal/webhook`

**Events**:
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`

**Verification**:
- PayPal signature verification required
- Headers: `paypal-transmission-id`, `paypal-cert-url`, `paypal-auth-algo`, `paypal-transmission-sig`, `paypal-transmission-time`

### PayMongo Webhooks

**Endpoint**: `POST /api/paymongo/webhook`

**Events**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`

**Verification**:
- PayMongo signature verification required
- Header: `paymongo-signature`

### Escrow Webhooks

**Endpoint**: `POST /api/escrows/webhook`

**Events**:
- Escrow created
- Payment captured
- Dispute raised
- Dispute resolved

## Webhook Setup

See [Webhook Setup Guide](../guides/webhook-setup.md) for configuration.

## Webhook Payload

### PayPal Example

```json
{
  "id": "WH-2W42680J3J406320L-67976317FL053053U",
  "event_version": "1.0",
  "create_time": "2018-10-23T22:46:01.000Z",
  "resource_type": "capture",
  "resource": {
    "id": "1JU08902T9135234L",
    "status": "COMPLETED",
    "amount": {
      "currency_code": "USD",
      "value": "100.00"
    }
  },
  "event_type": "PAYMENT.CAPTURE.COMPLETED"
}
```

### PayMongo Example

```json
{
  "data": {
    "id": "evt_1234567890",
    "type": "payment_intent.succeeded",
    "attributes": {
      "type": "payment_intent",
      "data": {
        "id": "pi_1234567890",
        "attributes": {
          "amount": 10000,
          "currency": "PHP",
          "status": "succeeded"
        }
      }
    }
  }
}
```

## Security

### Signature Verification

All webhooks verify signatures to ensure authenticity:

```javascript
// PayPal
const isValid = verifyPayPalWebhook(payload, headers);

// PayMongo
const isValid = verifyPayMongoWebhook(payload, signature);
```

### Best Practices

1. **Always verify signatures** - Never trust unverified webhooks
2. **Idempotency** - Handle duplicate events
3. **Error handling** - Return appropriate status codes
4. **Logging** - Log all webhook events
5. **Retry logic** - Handle failed webhook processing

## Testing

### PayPal Sandbox

Use PayPal sandbox webhook simulator for testing.

### PayMongo Test Mode

Use PayMongo test webhooks for development.

## Related Documentation

- [Webhook Setup Guide](../guides/webhook-setup.md)
- [Payment Integration](../guides/payment-integration.md)

