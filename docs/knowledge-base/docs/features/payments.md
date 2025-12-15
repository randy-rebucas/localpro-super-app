# Payments Feature

## Overview

The Payments feature provides comprehensive payment processing with support for multiple payment gateways including PayPal, PayMongo (PayMaya), and more.

## Supported Payment Methods

- **PayPal** - PayPal payments and subscriptions
- **PayMongo** - PayMaya and card payments (Philippines)
- **Stripe** - Card payments
- **Xendit** - Southeast Asia payments
- **Bank Transfer** - Direct bank transfers
- **Cash** - Cash payments

## Payment Features

- **One-time Payments** - Single transaction processing
- **Recurring Payments** - Subscription billing
- **Escrow Payments** - Secure payment holding
- **Refunds** - Payment refund processing
- **Webhooks** - Payment event notifications

## API Endpoints

### PayPal

```
POST /api/paypal/create-order
POST /api/paypal/capture-order
POST /api/paypal/webhook
```

### PayMongo

```
POST /api/paymongo/payment-intents
POST /api/paymongo/confirm-payment
POST /api/paymongo/webhook
```

### Finance/Wallet

```
GET  /api/finance/wallet
POST /api/finance/wallet/top-up
POST /api/finance/wallet/withdraw
GET  /api/finance/transactions
```

## Payment Flow

### Standard Payment

```
1. Create payment intent/order
2. User approves payment
3. Capture payment
4. Process webhook
5. Update booking/service status
```

### Escrow Payment

```
1. Authorize payment (hold funds)
2. Service completion
3. Capture payment (release funds)
4. Or refund if dispute
```

## Webhooks

All payment gateways send webhooks for:
- Payment success
- Payment failure
- Refunds
- Subscription events

See [Webhook Setup Guide](../guides/webhook-setup.md) for configuration.

## Security

- **PCI Compliance** - No card data stored
- **Webhook Verification** - Signature validation
- **Encryption** - All transactions encrypted
- **Audit Trail** - Complete transaction logging

## Documentation

For complete payment integration:
- [Payment Integration Guide](../guides/payment-integration.md)
- [Webhook Setup](../guides/webhook-setup.md)
- [Finance API](../../../features/finance/api-endpoints.md)

