# Subscriptions Usage Examples

## List plans (public)
```javascript
const res = await fetch('/api/localpro-plus/plans');
const { data } = await res.json();
```

## Subscribe
```javascript
await fetch(`/api/localpro-plus/subscribe/${planId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ paymentMethod: 'paypal', billingCycle: 'monthly' })
});
```

## Get my subscription
```javascript
const res = await fetch('/api/localpro-plus/my-subscription', { headers: { Authorization: `Bearer ${token}` } });
const { data } = await res.json();
```

## Get usage
```javascript
const usage = await fetch('/api/localpro-plus/usage', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
```

## Track feature usage (server)
```javascript
const UsageTrackingService = require('../../src/services/usageTrackingService');
await UsageTrackingService.trackUsage(userId, 'service_creation', 1, { serviceId });
```

## Renew subscription
```javascript
await fetch('/api/localpro-plus/renew', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ paymentMethod: 'paypal' })
});
```
