# Quick Start Guide

## Overview
This guide helps you get started quickly with the LocalPro Super App API.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Common Tasks](#common-tasks)
4. [Next Steps](#next-steps)

---

## Getting Started

### Prerequisites
- API Base URL: `https://api.localpro.com` (or your environment URL)
- Valid phone number for registration
- Internet connection

### Step 1: Register and Authenticate

```javascript
// 1. Send verification code
const response = await fetch('https://api.localpro.com/api/auth/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+639123456789' })
});

// 2. Verify code (user enters code from SMS)
const authResponse = await fetch('https://api.localpro.com/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+639123456789',
    code: '123456' // Code from SMS
  })
});

const { token } = await authResponse.json();
// Store token securely for future requests
```

### Step 2: Complete Profile

```javascript
// Complete onboarding
await fetch('https://api.localpro.com/api/auth/complete-onboarding', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    address: {
      street: '123 Main St',
      city: 'Manila',
      state: 'Metro Manila',
      zipCode: '1000',
      country: 'Philippines'
    }
  })
});
```

---

## Authentication

### Using the Token

All authenticated endpoints require the token in the Authorization header:

```javascript
fetch('https://api.localpro.com/api/marketplace/services', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Token Refresh

Tokens expire after a period. Handle expiration:

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  let token = getStoredToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, refresh or redirect to login
    token = await refreshToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  return response;
}
```

---

## Common Tasks

### For Clients

#### Browse Services
```javascript
GET /api/marketplace/services?category=cleaning&location=Manila
```

#### Book a Service
```javascript
POST /api/marketplace/bookings
{
  "serviceId": "service_id",
  "providerId": "provider_id",
  "scheduledDate": "2025-01-20T10:00:00Z",
  "address": { ... }
}
```

#### View My Bookings
```javascript
GET /api/marketplace/my-bookings
```

#### Add Review
```javascript
POST /api/marketplace/bookings/:id/review
{
  "rating": 5,
  "comment": "Great service!"
}
```

### For Providers

#### Create Service Listing
```javascript
POST /api/marketplace/services
{
  "title": "Home Cleaning",
  "description": "Professional cleaning service",
  "category": "cleaning",
  "price": 500
}
```

#### View Dashboard
```javascript
GET /api/providers/dashboard/overview
```

#### Manage Bookings
```javascript
PUT /api/marketplace/bookings/:id/status
{
  "status": "confirmed"
}
```

#### View Earnings
```javascript
GET /api/finance/earnings
```

#### Request Withdrawal
```javascript
POST /api/finance/withdraw
{
  "amount": 10000,
  "paymentMethod": "bank_transfer",
  "accountDetails": { ... }
}
```

---

## Next Steps

1. **Read Feature Documentation**: Check `docs/features/` for detailed endpoint documentation
2. **Review Best Practices**: See `docs/BEST_PRACTICES.md` for security and performance tips
3. **Explore Sample Code**: Check `docs/SAMPLE_USAGE.md` for complete examples
4. **Understand Your Role**: Review role-specific documentation in `docs/roles/`

## Common Endpoints by Role

### Client Endpoints
- Browse: `GET /api/marketplace/services`
- Book: `POST /api/marketplace/bookings`
- Jobs: `GET /api/jobs`, `POST /api/jobs/:id/apply`
- Courses: `GET /api/academy/courses`, `POST /api/academy/courses/:id/enroll`
- Supplies: `GET /api/supplies`, `POST /api/supplies/:id/order`

### Provider Endpoints
- Services: `POST /api/marketplace/services`
- Dashboard: `GET /api/providers/dashboard/overview`
- Analytics: `GET /api/providers/analytics/performance`
- Earnings: `GET /api/finance/earnings`
- Withdraw: `POST /api/finance/withdraw`

### Admin Endpoints
- Users: `GET /api/users`
- Settings: `GET /api/settings/app`, `PUT /api/settings/app`
- Monitoring: `GET /api/monitoring/system-health`
- Logs: `GET /api/logs`

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Support

For detailed documentation:
- Feature docs: `docs/features/`
- API reference: `docs/API_ENDPOINTS_SUMMARY.md`
- Best practices: `docs/BEST_PRACTICES.md`
- Code examples: `docs/SAMPLE_USAGE.md`

