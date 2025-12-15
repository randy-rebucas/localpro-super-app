# Payment Integration Guide

## Overview

LocalPro Super App supports multiple payment methods: PayPal and PayMaya (via PayMongo).

## PayPal Integration

### Setup

1. **Get PayPal Credentials**:
   - Create PayPal app in developer dashboard
   - Get Client ID and Secret
   - Choose Sandbox or Live mode

2. **Configure Environment**:
   ```env
   PAYPAL_CLIENT_ID=your-client-id
   PAYPAL_CLIENT_SECRET=your-secret
   PAYPAL_MODE=sandbox  # or live
   ```

### Create Payment

```javascript
POST /api/paypal/create-order
Body: {
  amount: 100,
  currency: 'USD',
  description: 'Service booking'
}
```

### Process Payment

```javascript
POST /api/paypal/capture-order
Body: {
  orderId: 'paypal-order-id'
}
```

## PayMaya/PayMongo Integration

### Setup

1. **Get PayMongo Credentials**:
   - Create PayMongo account
   - Get Secret and Public keys

2. **Configure Environment**:
   ```env
   PAYMONGO_SECRET_KEY=sk_test_...
   PAYMONGO_PUBLIC_KEY=pk_test_...
   ```

### Create Payment Intent

```javascript
POST /api/paymongo/payment-intents
Body: {
  amount: 10000,  // in cents
  currency: 'PHP',
  description: 'Service booking'
}
```

## Webhooks

### PayPal Webhook

```javascript
POST /api/paypal/webhook
Headers: {
  'paypal-transmission-id': '...',
  'paypal-cert-url': '...',
  'paypal-auth-algo': '...',
  'paypal-transmission-sig': '...',
  'paypal-transmission-time': '...'
}
```

### PayMongo Webhook

```javascript
POST /api/paymongo/webhook
Headers: {
  'paymongo-signature': '...'
}
```

## Best Practices

1. **Always verify webhooks** - Check signatures
2. **Handle failures** - Implement retry logic
3. **Store transaction IDs** - For reconciliation
4. **Test thoroughly** - Use sandbox/test mode
5. **Monitor transactions** - Set up alerts

## Testing

### PayPal Sandbox

- Use sandbox credentials
- Test with PayPal test accounts
- Verify webhook delivery

### PayMongo Test Mode

- Use test API keys
- Test payment intents
- Verify webhook signatures

## Next Steps

- Review [Webhook Setup](./webhook-setup.md)
- Check [API Documentation](../api/endpoints.md)

