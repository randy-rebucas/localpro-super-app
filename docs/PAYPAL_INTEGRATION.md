# PayPal Integration Documentation

## Overview

This document describes the PayPal integration implemented in the LocalPro Super App. PayPal has been integrated across all major payment flows including marketplace bookings, supplies orders, and financial services.

**Current Status**: The integration uses the latest PayPal Server SDK (v1.1.0) for one-time payments and implements full subscription functionality using PayPal's REST API directly.

## Features Implemented

### 1. LocalPro Plus Subscriptions
- **Full PayPal Subscriptions**: Create recurring billing plans and subscriptions
- **Subscription Management**: Activate, cancel, suspend, and manage PayPal subscriptions
- **Automatic Renewals**: Handle subscription renewals and payment failures
- **Billing Plans**: Create and manage PayPal billing plans for different subscription tiers

### 2. Marketplace Service Bookings
- **One-time Payments**: PayPal payments for service bookings
- **Payment Approval**: Capture payments after user approval
- **Order Tracking**: Track PayPal order status and transaction details

### 3. Supplies Orders
- **E-commerce Payments**: PayPal payments for product orders
- **Subscription Kits**: PayPal payments for recurring supply deliveries
- **Order Management**: Handle payment approval and order confirmation

### 4. Financial Services
- **Loan Repayments**: PayPal payments for loan installments
- **Salary Advance Repayments**: PayPal payments for salary advance repayments
- **Transaction Tracking**: Complete transaction history with PayPal integration

### 5. Webhook Handling
- **Real-time Notifications**: Handle PayPal webhook events
- **Payment Status Updates**: Automatic status updates for all payment types
- **Subscription Management**: Handle subscription lifecycle events

## API Endpoints

### PayPal Webhook
```
POST /api/paypal/webhook
```
Handles PayPal webhook events for payment notifications.

### LocalPro Plus PayPal Routes
```
POST /api/localpro-plus/paypal/approve
POST /api/localpro-plus/paypal/cancel
```

### Marketplace PayPal Routes
```
POST /api/marketplace/bookings/paypal/approve
GET /api/marketplace/bookings/paypal/order/:orderId
```

### Supplies PayPal Routes
```
POST /api/supplies/orders/paypal/approve
GET /api/supplies/orders/paypal/order/:orderId
```

### Finance PayPal Routes
```
POST /api/finance/loans/:id/repay/paypal
POST /api/finance/loans/repay/paypal/approve
POST /api/finance/salary-advances/:id/repay/paypal
POST /api/finance/salary-advances/repay/paypal/approve
```

## Environment Variables

Add the following variables to your `.env` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
```

## Setup Instructions

### 1. PayPal Developer Account Setup
1. Create a PayPal Developer account at https://developer.paypal.com/
2. Create a new application to get your Client ID and Client Secret
3. Set up webhooks for your application
4. Configure return and cancel URLs

### 2. Environment Configuration
1. Copy the environment variables from `env.example` to your `.env` file
2. Update the PayPal credentials with your actual values
3. Set `PAYPAL_MODE` to `sandbox` for testing or `production` for live payments

### 3. Webhook Configuration
1. In your PayPal Developer Dashboard, create a webhook
2. Set the webhook URL to: `https://yourdomain.com/api/paypal/webhook`
3. Select the following events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

## Usage Examples

### Creating a PayPal Subscription

```javascript
// Request body for LocalPro Plus subscription
{
  "planId": "plan_id",
  "billingCycle": "monthly",
  "paymentMethod": "paypal"
}

// Response includes PayPal approval URL
{
  "success": true,
  "message": "PayPal subscription created successfully",
  "data": {
    "subscription": {...},
    "payment": {...},
    "paypalApprovalUrl": "https://www.sandbox.paypal.com/..."
  }
}
```

### Creating a PayPal Order for Marketplace Booking

```javascript
// Request body for marketplace booking
{
  "serviceId": "service_id",
  "bookingDate": "2024-01-15T10:00:00Z",
  "duration": 2,
  "address": {...},
  "paymentMethod": "paypal"
}

// Response includes PayPal approval URL
{
  "success": true,
  "message": "Booking created successfully with PayPal payment",
  "data": {
    "booking": {...},
    "paypalApprovalUrl": "https://www.sandbox.paypal.com/..."
  }
}
```

### Approving a PayPal Payment

```javascript
// POST to /api/marketplace/bookings/paypal/approve
{
  "orderId": "paypal_order_id"
}

// Response confirms payment capture
{
  "success": true,
  "message": "PayPal payment approved successfully",
  "data": {
    "booking": {...}
  }
}
```

## Database Schema Updates

### Payment Models Enhanced
All payment-related models now include PayPal-specific fields:

```javascript
{
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'mobile_money', 'wallet', 'paypal']
  },
  paypalOrderId: String,
  paypalSubscriptionId: String,
  paypalTransactionId: String
}
```

## Webhook Event Handling

The system automatically handles the following PayPal webhook events:

1. **PAYMENT.CAPTURE.COMPLETED**: Updates payment status to completed
2. **PAYMENT.CAPTURE.DENIED**: Updates payment status to failed
3. **BILLING.SUBSCRIPTION.ACTIVATED**: Activates subscription
4. **BILLING.SUBSCRIPTION.CANCELLED**: Cancels subscription
5. **BILLING.SUBSCRIPTION.PAYMENT.COMPLETED**: Processes renewal payment
6. **BILLING.SUBSCRIPTION.PAYMENT.FAILED**: Handles payment failure

## Security Considerations

1. **Webhook Verification**: All webhooks are verified using PayPal's signature verification
2. **Environment Variables**: Sensitive credentials are stored in environment variables
3. **HTTPS Required**: PayPal requires HTTPS for production webhooks
4. **Rate Limiting**: API endpoints are protected with rate limiting

## Testing

### Sandbox Testing
1. Use PayPal sandbox credentials for testing
2. Create sandbox buyer and seller accounts
3. Test all payment flows in sandbox mode
4. Verify webhook events are received correctly

### Production Deployment
1. Update environment variables with production credentials
2. Set `PAYPAL_MODE=production`
3. Configure production webhook URL
4. Test with small amounts initially

## Error Handling

The integration includes comprehensive error handling:

1. **PayPal API Errors**: Graceful handling of PayPal API failures
2. **Network Timeouts**: Retry logic for network issues
3. **Invalid Signatures**: Webhook signature verification
4. **Database Errors**: Transaction rollback on failures

## Monitoring and Logging

1. **Payment Logs**: All PayPal transactions are logged
2. **Webhook Events**: Webhook processing is logged
3. **Error Tracking**: Comprehensive error logging
4. **Performance Monitoring**: Track API response times

## Support and Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Verify webhook URL is accessible
   - Check webhook configuration in PayPal dashboard
   - Ensure HTTPS is enabled

2. **Payment Approval Fails**
   - Verify PayPal order ID is correct
   - Check if order is in correct state
   - Ensure user has sufficient funds

3. **Subscription Issues**
   - Verify billing plan is created correctly
   - Check subscription status in PayPal dashboard
   - Ensure webhook events are being processed

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs of PayPal API calls and webhook processing.

## Future Enhancements

1. **Refund Processing**: Implement PayPal refund functionality
2. **Payouts**: Add PayPal payout capabilities for providers
3. **Multi-currency**: Support for multiple currencies
4. **Advanced Analytics**: Enhanced payment analytics and reporting
5. **Mobile SDK**: Integration with PayPal mobile SDKs

## Conclusion

The PayPal integration provides a comprehensive payment solution for the LocalPro Super App, supporting all major payment flows with robust error handling, security measures, and real-time webhook processing. The implementation follows PayPal best practices and provides a solid foundation for future enhancements.
