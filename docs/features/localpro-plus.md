# LocalPro Plus Feature Documentation

## Overview
The LocalPro Plus feature provides subscription plans with premium features and benefits for users.

## Base Path
`/api/localpro-plus`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get subscription plans |
| GET | `/plans/:id` | Get plan details |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/plans` | Create plan | **admin** |
| PUT | `/plans/:id` | Update plan | **admin** |
| DELETE | `/plans/:id` | Delete plan | **admin** |
| POST | `/subscribe/:planId` | Subscribe to plan | AUTHENTICATED |
| POST | `/confirm-payment` | Confirm subscription payment | AUTHENTICATED |
| POST | `/cancel` | Cancel subscription | AUTHENTICATED |
| POST | `/renew` | Renew subscription | AUTHENTICATED |
| GET | `/my-subscription` | Get my subscription | AUTHENTICATED |
| PUT | `/settings` | Update subscription settings | AUTHENTICATED |
| GET | `/usage` | Get subscription usage | AUTHENTICATED |
| GET | `/analytics` | Get subscription analytics | **admin** |
| POST | `/admin/subscriptions` | Create manual subscription | **admin** |
| GET | `/admin/subscriptions` | Get all subscriptions | **admin** |
| GET | `/admin/subscriptions/user/:userId` | Get subscription by user ID | **admin** |
| PUT | `/admin/subscriptions/:subscriptionId` | Update manual subscription | **admin** |
| DELETE | `/admin/subscriptions/:subscriptionId` | Delete manual subscription | **admin** |

## Request/Response Examples

### Subscribe to Plan
```http
POST /api/localpro-plus/subscribe/:planId
Authorization: Bearer <token>
```

### Cancel Subscription
```http
POST /api/localpro-plus/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer needed"
}
```

## Subscription Plans

Plans typically include:
- Basic features
- Premium features
- Priority support
- Analytics access
- Custom branding

## Subscription Status

- `active` - Subscription active
- `cancelled` - Subscription cancelled
- `expired` - Subscription expired
- `pending` - Subscription pending payment

## Related Features
- Finance (Subscription payments)
- Settings
- Analytics

