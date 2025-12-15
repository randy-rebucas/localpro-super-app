# API Endpoints Reference

## Base URL

```
Production: https://api.localpro.com/api
Development: http://localhost:5000/api
```

## Endpoint Categories

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Marketplace
- `GET /api/marketplace/services` - List services
- `POST /api/marketplace/services` - Create service
- `GET /api/marketplace/services/:id` - Get service
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/my-bookings` - Get bookings

### Academy
- `GET /api/academy/courses` - List courses
- `POST /api/academy/courses` - Create course
- `POST /api/academy/courses/:id/enroll` - Enroll in course

### Finance
- `GET /api/finance/wallet` - Get wallet
- `POST /api/finance/wallet/top-up` - Top up wallet
- `POST /api/finance/wallet/withdraw` - Request withdrawal
- `GET /api/finance/transactions` - Get transactions

### Payments
- `POST /api/paypal/create-order` - Create PayPal order
- `POST /api/paypal/capture-order` - Capture PayPal order
- `POST /api/paymongo/payment-intents` - Create PayMongo intent

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update status (admin)

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/settings` - Get settings

### Search
- `GET /api/search/global` - Global search
- `GET /api/search/services` - Search services
- `GET /api/search/users` - Search users

### Analytics (Admin)
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/financial` - Revenue analytics

## Complete Documentation

For detailed endpoint documentation:

- **Swagger UI**: Available at `/api-docs` when server is running
- **Postman Collection**: See repository root
- **Feature Documentation**: See [Features](../features/README.md)

## Response Format

All endpoints return standardized responses:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

## Pagination

List endpoints support pagination:

```
GET /api/marketplace/services?page=1&limit=20
```

## Error Handling

See [Error Handling](./error-handling.md) for error codes and formats.

## Related Documentation

- [API Overview](./overview.md)
- [Authentication](./authentication.md)
- [Webhooks](./webhooks.md)

