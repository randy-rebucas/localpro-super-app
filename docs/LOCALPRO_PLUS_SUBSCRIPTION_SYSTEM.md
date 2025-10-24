# LocalPro Plus Subscription System

## Overview

The LocalPro Plus subscription system provides a comprehensive subscription management solution with multiple pricing tiers, usage tracking, and payment integration. It supports both PayPal and PayMaya payment methods with automatic billing and webhook handling.

## Features

### 🎯 Core Features
- **Multiple Subscription Plans**: Basic, Standard, Premium, and Enterprise tiers
- **Flexible Billing**: Monthly and yearly billing cycles
- **Usage Tracking**: Real-time usage monitoring with limits
- **Payment Integration**: PayPal and PayMaya support
- **Webhook Handling**: Automatic subscription status updates
- **Feature Gating**: Middleware for access control
- **Analytics**: Comprehensive subscription and usage analytics

### 💳 Payment Methods
- **PayPal**: Full subscription support with webhooks
- **PayMaya**: Local payment processing
- **Automatic Billing**: Recurring payment handling
- **Payment History**: Complete transaction tracking

## Architecture

### Models

#### SubscriptionPlan
```javascript
{
  name: String,
  description: String,
  price: {
    monthly: Number,
    yearly: Number,
    currency: String
  },
  features: [{
    name: String,
    description: String,
    included: Boolean,
    limit: Number,
    unit: String
  }],
  limits: {
    maxServices: Number,
    maxBookings: Number,
    maxProviders: Number,
    maxStorage: Number,
    maxApiCalls: Number
  },
  benefits: [String],
  isActive: Boolean,
  isPopular: Boolean
}
```

#### UserSubscription
```javascript
{
  user: ObjectId,
  plan: ObjectId,
  status: String, // 'active', 'cancelled', 'expired', 'suspended', 'pending'
  billingCycle: String, // 'monthly', 'yearly'
  startDate: Date,
  endDate: Date,
  nextBillingDate: Date,
  paymentMethod: String,
  paymentDetails: Object,
  usage: {
    services: { current: Number, limit: Number },
    bookings: { current: Number, limit: Number },
    storage: { current: Number, limit: Number },
    apiCalls: { current: Number, limit: Number }
  },
  features: {
    prioritySupport: Boolean,
    advancedAnalytics: Boolean,
    customBranding: Boolean,
    apiAccess: Boolean,
    whiteLabel: Boolean
  }
}
```

#### Payment
```javascript
{
  user: ObjectId,
  subscription: ObjectId,
  amount: Number,
  currency: String,
  status: String, // 'pending', 'completed', 'failed', 'refunded', 'cancelled'
  paymentMethod: String,
  paymentDetails: Object,
  billingPeriod: { startDate: Date, endDate: Date },
  description: String,
  processedAt: Date
}
```

## API Endpoints

### Public Endpoints

#### Get All Plans
```http
GET /api/localpro-plus/plans
```
Returns all active subscription plans.

#### Get Single Plan
```http
GET /api/localpro-plus/plans/:id
```
Returns details of a specific plan.

### Protected Endpoints

#### Subscribe to Plan
```http
POST /api/localpro-plus/subscribe
```
**Body:**
```json
{
  "planId": "plan_id",
  "paymentMethod": "paypal|paymaya",
  "billingCycle": "monthly|yearly"
}
```

#### Confirm Payment
```http
POST /api/localpro-plus/confirm-payment
```
**Body:**
```json
{
  "paymentId": "payment_id",
  "paymentMethod": "paypal|paymaya"
}
```

#### Get My Subscription
```http
GET /api/localpro-plus/my-subscription
```
Returns current user's subscription details.

#### Cancel Subscription
```http
POST /api/localpro-plus/cancel
```
**Body:**
```json
{
  "reason": "Cancellation reason"
}
```

#### Get Usage Statistics
```http
GET /api/localpro-plus/usage
```
Returns current usage and limits.

#### Update Settings
```http
PUT /api/localpro-plus/subscription/settings
```
**Body:**
```json
{
  "autoRenew": true,
  "notificationSettings": {
    "email": true,
    "sms": false
  }
}
```

#### Renew Subscription
```http
POST /api/localpro-plus/renew
```
**Body:**
```json
{
  "paymentMethod": "paypal|paymaya",
  "paymentDetails": {}
}
```

### Admin Endpoints

#### Create Plan
```http
POST /api/localpro-plus/plans
```
**Access:** Admin only

#### Update Plan
```http
PUT /api/localpro-plus/plans/:id
```
**Access:** Admin only

#### Delete Plan
```http
DELETE /api/localpro-plus/plans/:id
```
**Access:** Admin only

#### Get Analytics
```http
GET /api/localpro-plus/analytics
```
**Access:** Admin only

## Middleware

### Subscription Access Control

#### requireActiveSubscription
Ensures user has an active subscription.

```javascript
const { requireActiveSubscription } = require('../middleware/subscriptionAccess');

router.get('/premium-feature', requireActiveSubscription, (req, res) => {
  // Feature only available to subscribers
});
```

#### requireFeatureAccess
Checks if user has access to a specific feature.

```javascript
const { requireFeatureAccess } = require('../middleware/subscriptionAccess');

router.get('/advanced-analytics', requireFeatureAccess('advanced_analytics'), (req, res) => {
  // Feature only available to users with advanced analytics
});
```

#### checkUsageLimit
Validates usage limits before allowing actions.

```javascript
const { checkUsageLimit } = require('../middleware/subscriptionAccess');

router.post('/create-service', checkUsageLimit('service_creation'), (req, res) => {
  // Check if user can create another service
});
```

#### incrementUsage
Tracks usage after successful operations.

```javascript
const { incrementUsage } = require('../middleware/subscriptionAccess');

router.post('/create-service', 
  checkUsageLimit('service_creation'),
  createService,
  incrementUsage('service_creation')
);
```

## Usage Tracking

### UsageTrackingService

#### Track Usage
```javascript
const UsageTrackingService = require('../services/usageTrackingService');

// Track feature usage
await UsageTrackingService.trackUsage(userId, 'service_creation', 1, {
  serviceId: 'service_123',
  category: 'home_repair'
});
```

#### Check Permissions
```javascript
// Check if user can perform an action
const canPerform = await UsageTrackingService.canPerformAction(
  userId, 
  'service_creation', 
  1
);

if (!canPerform.canPerform) {
  return res.status(429).json({
    error: canPerform.reason,
    remaining: canPerform.remaining
  });
}
```

#### Get Usage Stats
```javascript
// Get user's usage statistics
const stats = await UsageTrackingService.getUserUsageStats(userId, 'month');
```

## Default Plans

### Basic Plan - $9.99/month, $99.99/year
- Up to 5 services
- 20 bookings per month
- Basic analytics
- Email support
- 100MB storage

### Standard Plan - $19.99/month, $199.99/year ⭐ Popular
- Up to 15 services
- 100 bookings per month
- Advanced analytics
- Priority support
- Custom branding
- Team management (up to 3 providers)
- 500MB storage
- API access

### Premium Plan - $39.99/month, $399.99/year
- Up to 50 services
- 500 bookings per month
- Advanced analytics
- Priority support
- Custom branding
- Team management (up to 10 providers)
- Full API access
- White-label options
- 2GB storage

### Enterprise Plan - $99.99/month, $999.99/year
- Unlimited services
- Unlimited bookings
- Advanced analytics
- Dedicated support
- Custom branding
- Unlimited team members
- Full API access
- White-label options
- Custom integrations
- SLA guarantee
- 10GB storage

## Webhook Integration

### PayPal Webhooks

The system handles these PayPal webhook events:

- `PAYMENT.CAPTURE.COMPLETED` - Payment successful
- `PAYMENT.CAPTURE.DENIED` - Payment failed
- `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- `BILLING.SUBSCRIPTION.SUSPENDED` - Subscription suspended
- `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED` - Renewal payment completed
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED` - Renewal payment failed
- `BILLING.SUBSCRIPTION.EXPIRED` - Subscription expired

### Webhook Endpoint
```http
POST /api/paypal/webhook
```

## Setup Instructions

### 1. Initialize Subscription System
```bash
node setup-subscription.js
```

### 2. Configure Environment Variables
```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_MODE=sandbox # or live

# PayMaya Configuration
PAYMAYA_PUBLIC_KEY=your_paymaya_public_key
PAYMAYA_SECRET_KEY=your_paymaya_secret_key
PAYMAYA_MODE=sandbox # or live
```

### 3. Configure PayPal Webhook
1. Go to PayPal Developer Dashboard
2. Create a webhook with URL: `https://yourdomain.com/api/paypal/webhook`
3. Subscribe to subscription events
4. Copy webhook ID to environment variables

### 4. Test Subscription Flow
1. Use sandbox accounts for testing
2. Test subscription creation
3. Test payment confirmation
4. Test webhook handling
5. Test usage tracking

## Usage Examples

### Protecting Routes with Subscription
```javascript
const express = require('express');
const { requireActiveSubscription, requireFeatureAccess } = require('../middleware/subscriptionAccess');

const router = express.Router();

// Premium feature requiring active subscription
router.get('/premium-dashboard', requireActiveSubscription, (req, res) => {
  res.json({ message: 'Welcome to premium dashboard' });
});

// Advanced analytics requiring specific feature
router.get('/advanced-analytics', requireFeatureAccess('advanced_analytics'), (req, res) => {
  res.json({ analytics: 'Advanced analytics data' });
});
```

### Tracking Usage in Controllers
```javascript
const UsageTrackingService = require('../services/usageTrackingService');

const createService = async (req, res) => {
  try {
    // Check if user can create service
    const canCreate = await UsageTrackingService.canPerformAction(
      req.user.id, 
      'service_creation'
    );

    if (!canCreate.canPerform) {
      return res.status(429).json({
        error: canCreate.reason,
        remaining: canCreate.remaining
      });
    }

    // Create service
    const service = await Service.create(req.body);

    // Track usage
    await UsageTrackingService.trackUsage(
      req.user.id, 
      'service_creation', 
      1, 
      { serviceId: service._id }
    );

    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Analytics and Reporting

### Subscription Analytics
- Total subscriptions
- Active subscriptions
- Cancelled subscriptions
- Revenue analytics
- Plan distribution
- Monthly trends

### Usage Analytics
- Feature usage statistics
- Top users by usage
- Usage trends over time
- Limit utilization

## Security Considerations

1. **Webhook Verification**: All PayPal webhooks are verified using signature validation
2. **Access Control**: Middleware ensures proper subscription validation
3. **Usage Limits**: Real-time usage tracking prevents abuse
4. **Payment Security**: All payment data is handled securely through PayPal/PayMaya
5. **Data Privacy**: User subscription data is protected and encrypted

## Monitoring and Maintenance

### Health Checks
- Monitor subscription status
- Track payment failures
- Monitor usage limits
- Alert on webhook failures

### Regular Tasks
- Reset usage counters (monthly)
- Process failed payments
- Update subscription statuses
- Generate analytics reports

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL configuration
   - Verify webhook ID in environment
   - Check PayPal webhook logs

2. **Usage Limits Not Working**
   - Verify middleware is applied correctly
   - Check subscription status
   - Validate usage tracking implementation

3. **Payment Failures**
   - Check payment method configuration
   - Verify PayPal/PayMaya credentials
   - Review payment logs

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=subscription:*
```

## Support

For technical support or questions about the subscription system:
- Check the logs for detailed error messages
- Review webhook delivery status in PayPal dashboard
- Monitor usage tracking in the analytics dashboard
- Contact the development team for complex issues
