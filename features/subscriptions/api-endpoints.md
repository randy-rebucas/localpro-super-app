# Subscriptions API Endpoints (LocalPro Plus)

Base path: `/api/localpro-plus`

## Public
### GET `/plans`
List active plans.

### GET `/plans/:id`
Plan details.

## Admin (auth + admin)
### POST `/plans`
Create plan.

### PUT `/plans/:id`
Update plan.

### DELETE `/plans/:id`
Delete plan.

## Authenticated
### POST `/subscribe/:planId`
Subscribe to a plan. Body: `{ paymentMethod, billingCycle('monthly'|'yearly') }` (controller variant also supports planId in body).

### POST `/confirm-payment`
Confirm subscription payment (provider-specific payload).

### POST `/cancel`
Cancel current subscription.

### POST `/renew`
Renew current subscription (body may include `paymentMethod`, `paymentDetails`).

### GET `/my-subscription`
Get current user subscription.

### PUT `/settings`
Update subscription settings (e.g., auto-renew, notifications).

### GET `/usage`
Get current usage, limits, feature flags, billing cycle, and daysUntilRenewal.

## Admin Analytics
### GET `/analytics`
Subscription usage/analytics overview.

## Responses
- Success: `{ success, data }` or `{ success, message, data }`
- Errors: `{ success:false, message }`
