# Webhook Setup Guide

## Overview

This guide covers setting up webhooks for payment gateways and external services.

## PayPal Webhooks

### 1. Configure Webhook URL

In PayPal Developer Dashboard:
1. Go to your app
2. Navigate to Webhooks
3. Add webhook URL: `https://api.localpro.com/api/paypal/webhook`

### 2. Subscribe to Events

Select events to receive:
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`

### 3. Verify Webhook

```javascript
// Webhook endpoint automatically verifies signature
POST /api/paypal/webhook
Headers: {
  'paypal-transmission-id': '...',
  'paypal-cert-url': '...',
  'paypal-auth-algo': '...',
  'paypal-transmission-sig': '...',
  'paypal-transmission-time': '...'
}
```

## PayMongo Webhooks

### 1. Configure Webhook URL

In PayMongo Dashboard:
1. Go to Webhooks
2. Add webhook URL: `https://api.localpro.com/api/paymongo/webhook`

### 2. Subscribe to Events

Select events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`

### 3. Get Webhook Secret

Copy webhook secret from dashboard.

### 4. Configure Secret

```env
PAYMONGO_WEBHOOK_SECRET=whsec_...
```

### 5. Verify Webhook

```javascript
// Webhook endpoint verifies signature
POST /api/paymongo/webhook
Headers: {
  'paymongo-signature': '...'
}
```

## Testing Webhooks

### PayPal Sandbox

1. Use PayPal webhook simulator
2. Send test events
3. Verify processing

### PayMongo Test Mode

1. Use test webhook secret
2. Send test events
3. Verify processing

### Local Testing

Use ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 5000

# Use ngrok URL in webhook configuration
https://abc123.ngrok.io/api/paypal/webhook
```

## Webhook Security

### Signature Verification

All webhooks verify signatures:
- PayPal: Multiple headers
- PayMongo: Signature header

### Best Practices

1. **Always verify signatures** - Never trust unverified webhooks
2. **Use HTTPS** - Encrypt webhook traffic
3. **Idempotency** - Handle duplicate events
4. **Logging** - Log all webhook events
5. **Error handling** - Return appropriate status codes

## Webhook Events

### PayPal Events

- `PAYMENT.CAPTURE.COMPLETED` - Payment successful
- `PAYMENT.CAPTURE.DENIED` - Payment failed
- `PAYMENT.CAPTURE.REFUNDED` - Payment refunded

### PayMongo Events

- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `charge.succeeded` - Charge completed

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is correct
2. Verify server is accessible
3. Check firewall settings
4. Review webhook logs

### Signature Verification Failed

1. Verify webhook secret is correct
2. Check signature algorithm
3. Ensure payload is not modified

## Next Steps

- Review [Payment Integration](./payment-integration.md)
- Check [API Webhooks](../api/webhooks.md)

