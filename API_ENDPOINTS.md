# API Endpoints Documentation

Complete list of all API endpoints in the LocalPro Super App.

## Table of Contents

1. [Authentication](#authentication)
2. [API Keys](#api-keys)
3. [OAuth2 / Access Tokens](#oauth2--access-tokens)
4. [Marketplace](#marketplace)
3. [Supplies](#supplies)
4. [Academy](#academy)
5. [Finance](#finance)
6. [Rentals](#rentals)
7. [Advertising](#advertising)
8. [Facility Care](#facility-care)
9. [LocalPro Plus](#localpro-plus)
10. [Trust & Verification](#trust--verification)
11. [Communication](#communication)
12. [Analytics](#analytics)
13. [Maps](#maps)
14. [PayPal](#paypal)
15. [PayMaya](#paymaya)
16. [Jobs](#jobs)
17. [Job Categories](#job-categories)
18. [Referrals](#referrals)
19. [Agencies](#agencies)
20. [Settings](#settings)
21. [Error Monitoring](#error-monitoring)
22. [Audit Logs](#audit-logs)
23. [Providers](#providers)
24. [Logs](#logs)
25. [User Management](#user-management)
26. [Search](#search)
27. [Announcements](#announcements)
28. [Activities](#activities)
29. [Registration](#registration)
30. [Broadcaster](#broadcaster)
31. [Favorites](#favorites)
32. [AI Marketplace](#ai-marketplace)
33. [AI Users](#ai-users)
34. [Escrows](#escrows)
35. [Escrow Webhooks](#escrow-webhooks)
36. [Monitoring](#monitoring)
37. [Database Optimization](#database-optimization)
38. [Live Chat](#live-chat)
39. [Admin Live Chat](#admin-live-chat)
40. [Notifications](#notifications)
41. [Email Marketing](#email-marketing)
42. [Partners](#partners)

---

## Authentication

**Base Path:** `/api/auth`

The API supports multiple authentication methods:
- **JWT Token**: For user-facing applications (see endpoints below)
- **API Key/Secret**: For third-party integrations (see [API Keys](#api-keys) section)
- **Access Token**: OAuth2-style tokens with scopes (see [OAuth2 / Access Tokens](#oauth2--access-tokens) section)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/send-code` | Send verification code | No |
| POST | `/verify-code` | Verify code | No |
| POST | `/register` | Register user | Yes |
| GET | `/profile` | Get profile | Yes |
| POST | `/complete-onboarding` | Complete onboarding | Yes |
| GET | `/profile-completion-status` | Get profile completion status | Yes |
| GET | `/profile-completeness` | Get profile completeness | Yes |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update profile | Yes |
| POST | `/upload-avatar` | Upload avatar | Yes | 
| POST | `/upload-portfolio` | Upload portfolio images | Yes |
| POST | `/logout` | Logout user | Yes |

---

## API Keys

**Base Path:** `/api/api-keys`

The API Keys feature allows third-party applications to integrate with the LocalPro Super App using API key and secret authentication. This is ideal for server-to-server integrations.

### Authentication Methods

The API supports two authentication methods:

1. **JWT Token Authentication** (for user-facing applications)
   ```http
   Authorization: Bearer <jwt_token>
   ```

2. **API Key Authentication** (for third-party integrations)
   ```http
   X-API-Key: <access_key>
   X-API-Secret: <secret_key>
   ```
   
   Or via query parameters:
   ```
   ?apiKey=<access_key>&apiSecret=<secret_key>
   ```

### API Key Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create a new API key | Yes |
| GET | `/` | Get all API keys for user | Yes |
| GET | `/stats` | Get API key statistics | Yes |
| GET | `/:id` | Get single API key by ID | Yes |
| PUT | `/:id` | Update API key | Yes |
| DELETE | `/:id` | Revoke/Delete API key | Yes |
| POST | `/:id/regenerate-secret` | Regenerate secret key | Yes |

### Creating an API Key

**Request:**
```http
POST /api/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Third-Party App",
  "description": "API key for integration with my app",
  "expiresAt": "2025-12-31T23:59:59Z",
  "rateLimit": 1000,
  "allowedIPs": ["192.168.1.1", "10.0.0.1"],
  "scopes": ["read", "write"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "My Third-Party App",
    "accessKey": "lp_abc123def456...",
    "secretKey": "xyz789uvw012...",
    "expiresAt": "2025-12-31T23:59:59Z",
    "rateLimit": 1000,
    "allowedIPs": ["192.168.1.1", "10.0.0.1"],
    "scopes": ["read", "write"],
    "createdAt": "2024-01-01T00:00:00Z",
    "warning": "Save this secret key now. It will not be shown again."
  }
}
```

### Using API Key Authentication

Once you have your API key and secret, you can use them to authenticate requests:

**Example with Headers:**
```http
GET /api/marketplace/services
X-API-Key: lp_abc123def456...
X-API-Secret: xyz789uvw012...
```

**Example with Query Parameters:**
```http
GET /api/marketplace/services?apiKey=lp_abc123def456...&apiSecret=xyz789uvw012...
```

### API Key Features

- **Access Key**: Public identifier (starts with `lp_`)
- **Secret Key**: Private key (only shown once during creation)
- **IP Restrictions**: Optional IP whitelist for enhanced security
- **Rate Limiting**: Configurable requests per hour
- **Scopes**: Fine-grained permissions (read, write, admin)
- **Expiration**: Optional expiration date
- **Usage Tracking**: Last used timestamp and IP address

### Security Best Practices

1. **Store secrets securely**: Never commit API secrets to version control
2. **Use IP restrictions**: Limit API keys to specific IP addresses when possible
3. **Set expiration dates**: Regularly rotate API keys
4. **Use minimal scopes**: Only grant necessary permissions
5. **Monitor usage**: Regularly check API key statistics and last used information
6. **Rotate keys**: Regenerate secrets periodically

### Error Codes

- `MISSING_API_CREDENTIALS`: API key or secret not provided
- `INVALID_API_KEY`: API key not found
- `INVALID_API_SECRET`: Secret key does not match
- `API_KEY_INACTIVE`: API key has been deactivated
- `API_KEY_EXPIRED`: API key has expired
- `IP_NOT_ALLOWED`: Request IP is not in the allowed list
- `USER_INACTIVE`: User account associated with API key is inactive

---

## OAuth2 / Access Tokens

**Base Path:** `/api/oauth`

OAuth2-style access tokens with scope-based permissions. Exchange API keys for access tokens that can be revoked independently.

### Authentication Flow

1. Create an API key (see [API Keys](#api-keys))
2. Exchange API key/secret for access token
3. Use access token with Bearer authentication
4. Refresh token when it expires

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/token` | Exchange API key for access token | API Key/Secret |
| POST | `/refresh` | Refresh access token | Refresh Token |
| POST | `/revoke` | Revoke access or refresh token | None |
| GET | `/token-info` | Get current token information | Access Token |
| GET | `/tokens` | List user's access tokens | API Key/Secret |

### Token Exchange

**Request:**
```http
POST /api/oauth/token
X-API-Key: lp_abc123...
X-API-Secret: xyz789...
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "scope": "read marketplace.read",
  "expires_in": 3600
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2024-01-01T13:00:00.000Z",
  "refresh_token": "a1b2c3d4e5f6...",
  "scope": "read marketplace.read"
}
```

### Using Access Tokens

```http
GET /api/marketplace/services
Authorization: Bearer <access_token>
```

### Scopes

Access tokens support granular scope-based permissions:

- **General**: `read`, `write`, `admin`, `*`
- **Marketplace**: `marketplace.read`, `marketplace.write`
- **Users**: `users.read`, `users.write`
- **Analytics**: `analytics.read`
- **Finance**: `finance.read`, `finance.write`

Requested scopes must be a subset of the API key's scopes.

### Token Refresh

```http
POST /api/oauth/refresh
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4e5f6...",
  "scope": "read marketplace.read",
  "expires_in": 3600
}
```

### Token Revocation

```http
POST /api/oauth/revoke
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type_hint": "access_token"
}
```

For more details, see [ACCESS_TOKEN_GUIDE.md](./ACCESS_TOKEN_GUIDE.md).

---

## Marketplace

**Base Path:** `/api/marketplace`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/services` | Get all services | No |
| GET | `/services/categories` | Get service categories | No |
| GET | `/services/categories/:category` | Get category details | No |
| GET | `/services/nearby` | Get nearby services | No |
| GET | `/services/:id` | Get single service | No |
| GET | `/services/:id/providers` | Get providers for service | No |
| GET | `/providers/:providerId/services` | Get provider services | No |
| GET | `/providers/:id` | Get provider details | No |
| GET | `/services/categories/manage` | List categories (Admin) | Yes (Admin) |
| POST | `/services/categories` | Create category (Admin) | Yes (Admin) |
| PUT | `/services/categories/:id` | Update category (Admin) | Yes (Admin) |
| DELETE | `/services/categories/:id` | Delete category (Admin) | Yes (Admin) |
| GET | `/my-services` | Get my services | Yes |
| GET | `/my-bookings` | Get my bookings | Yes |
| POST | `/services` | Create service | Yes (Provider/Admin) |
| PUT | `/services/:id` | Update service | Yes (Provider/Admin) |
| PATCH | `/services/:id/deactivate` | Deactivate service | Yes (Provider/Admin) |
| PATCH | `/services/:id/activate` | Activate service | Yes (Provider/Admin) |
| DELETE | `/services/:id` | Delete service | Yes (Provider/Admin) |
| POST | `/services/:id/images` | Upload service images | Yes (Provider/Admin) |
| POST | `/bookings` | Create booking | Yes |
| GET | `/bookings` | Get bookings | Yes |
| GET | `/bookings/:id` | Get booking | Yes |
| PUT | `/bookings/:id/status` | Update booking status | Yes |
| POST | `/bookings/:id/photos` | Upload booking photos | Yes |
| POST | `/bookings/:id/review` | Add review | Yes |
| POST | `/bookings/paypal/approve` | Approve PayPal booking | Yes |
| GET | `/bookings/paypal/order/:orderId` | Get PayPal order details | Yes |

---

## Supplies

**Base Path:** `/api/supplies`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all supplies | No |
| GET | `/products` | Get all supplies (alias) | No |
| GET | `/products/:id` | Get supply (alias) | No |
| GET | `/categories` | Get supply categories | No |
| GET | `/featured` | Get featured supplies | No |
| GET | `/nearby` | Get nearby supplies | No |
| GET | `/:id` | Get single supply | No |
| POST | `/generate-description` | Generate description (AI) | Yes (Supplier/Admin) |
| POST | `/` | Create supply | Yes (Supplier/Admin) |
| POST | `/products` | Create supply (alias) | Yes (Supplier/Admin) |
| PUT | `/:id` | Update supply | Yes (Supplier/Admin) |
| DELETE | `/:id` | Delete supply | Yes (Supplier/Admin) |
| POST | `/:id/images` | Upload supply images | Yes (Supplier/Admin) |
| DELETE | `/:id/images/:imageId` | Delete supply image | Yes (Supplier/Admin) |
| POST | `/:id/order` | Order supply | Yes |
| PUT | `/:id/orders/:orderId/status` | Update order status | Yes |
| POST | `/:id/reviews` | Add supply review | Yes |
| GET | `/my-supplies` | Get my supplies | Yes |
| GET | `/my-orders` | Get my supply orders | Yes |
| GET | `/statistics` | Get supply statistics | Yes (Admin) |

---

## Academy

**Base Path:** `/api/academy`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/courses` | Get all courses | No |
| GET | `/courses/:id` | Get single course | No |
| GET | `/categories` | Get categories | No |
| GET | `/featured` | Get featured courses | No |
| GET | `/certifications` | Get certifications | No |
| POST | `/courses` | Create course | Yes (Instructor/Admin) |
| PUT | `/courses/:id` | Update course | Yes (Instructor/Admin) |
| DELETE | `/courses/:id` | Delete course | Yes (Instructor/Admin) |
| POST | `/courses/:id/thumbnail` | Upload course thumbnail | Yes (Instructor/Admin) |
| POST | `/courses/:id/videos` | Upload course video | Yes (Instructor/Admin) |
| DELETE | `/courses/:id/videos/:videoId` | Delete course video | Yes (Instructor/Admin) |
| POST | `/courses/:id/enroll` | Enroll in course | Yes |
| PUT | `/courses/:id/progress` | Update course progress | Yes |
| POST | `/courses/:id/reviews` | Add course review | Yes |
| POST | `/courses/:id/favorite` | Favorite course | Yes |
| DELETE | `/courses/:id/favorite` | Unfavorite course | Yes |
| GET | `/my-courses` | Get my courses | Yes |
| GET | `/my-created-courses` | Get my created courses | Yes |
| GET | `/my-favorite-courses` | Get my favorite courses | Yes |
| GET | `/statistics` | Get course statistics | Yes (Admin) |
| POST | `/categories` | Create category | Yes (Admin/Instructor) |
| PUT | `/categories/:id` | Update category | Yes (Admin/Instructor) |
| DELETE | `/categories/:id` | Delete category | Yes (Admin/Instructor) |
| POST | `/certifications` | Create certification | Yes (Admin/Instructor) |
| PUT | `/certifications/:id` | Update certification | Yes (Admin/Instructor) |
| DELETE | `/certifications/:id` | Delete certification | Yes (Admin/Instructor) |
| GET | `/enrollments` | List enrollments | Yes (Admin/Instructor) |
| PUT | `/enrollments/:id/status` | Update enrollment status | Yes (Admin/Instructor) |
| DELETE | `/enrollments/:id` | Delete enrollment | Yes (Admin) |

---

## Finance

**Base Path:** `/api/finance`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/overview` | Get financial overview | Yes |
| GET | `/transactions` | Get transactions | Yes |
| GET | `/earnings` | Get earnings | Yes |
| GET | `/expenses` | Get expenses | Yes |
| GET | `/reports` | Get financial reports | Yes |
| POST | `/expenses` | Add expense | Yes |
| POST | `/withdraw` | Request withdrawal | Yes |
| PUT | `/withdrawals/:withdrawalId/process` | Process withdrawal | Yes (Admin) |
| GET | `/tax-documents` | Get tax documents | Yes |
| PUT | `/wallet/settings` | Update wallet settings | Yes |
| POST | `/top-up` | Request top-up | Yes |
| GET | `/top-ups` | Get top-up requests | Yes (Admin) |
| GET | `/top-ups/my-requests` | Get my top-up requests | Yes |
| PUT | `/top-ups/:topUpId/process` | Process top-up | Yes (Admin) |

---

## Rentals

**Base Path:** `/api/rentals`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all rental items | No |
| GET | `/items` | Get rental items (alias) | No |
| GET | `/items/:id` | Get rental (alias) | No |
| GET | `/categories` | Get rental categories | No |
| GET | `/featured` | Get featured rentals | No |
| GET | `/nearby` | Get nearby rentals | No |
| GET | `/:id` | Get single rental | No |
| POST | `/generate-description` | Generate description (AI) | Yes (Provider/Admin) |
| POST | `/` | Create rental | Yes (Provider/Admin) |
| POST | `/items` | Create rental (alias) | Yes (Provider/Admin) |
| PUT | `/:id` | Update rental | Yes (Provider/Admin) |
| DELETE | `/:id` | Delete rental | Yes (Provider/Admin) |
| POST | `/:id/images` | Upload rental images | Yes (Provider/Admin) |
| DELETE | `/:id/images/:imageId` | Delete rental image | Yes (Provider/Admin) |
| POST | `/:id/book` | Book rental | Yes |
| PUT | `/:id/bookings/:bookingId/status` | Update booking status | Yes |
| POST | `/:id/reviews` | Add rental review | Yes |
| GET | `/my-rentals` | Get my rentals | Yes |
| GET | `/my-bookings` | Get my rental bookings | Yes |
| GET | `/statistics` | Get rental statistics | Yes (Admin) |

---

## Advertising

**Base Path:** `/api/ads`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all ads | No |
| GET | `/categories` | Get ad categories | No |
| GET | `/enum-values` | Get ad enum values | No |
| GET | `/featured` | Get featured ads | No |
| GET | `/:id` | Get single ad | No |
| POST | `/:id/click` | Track ad click | No |
| GET | `/statistics` | Get ad statistics | Yes (Admin) |
| POST | `/` | Create ad | Yes |
| PUT | `/:id` | Update ad | Yes |
| DELETE | `/:id` | Delete ad | Yes |
| POST | `/:id/images` | Upload ad images | Yes |
| DELETE | `/:id/images/:imageId` | Delete ad image | Yes |
| POST | `/:id/promote` | Promote ad | Yes |
| GET | `/pending` | Get pending ads | Yes (Admin) |
| PUT | `/:id/approve` | Approve ad | Yes (Admin) |
| PUT | `/:id/reject` | Reject ad | Yes (Admin) |
| GET | `/:id/analytics` | Get ad analytics | Yes |
| GET | `/my-ads` | Get my ads | Yes |

---

## Facility Care

**Base Path:** `/api/facility-care`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all facility care services | No |
| GET | `/nearby` | Get nearby services | No |
| GET | `/:id` | Get single service | No |
| POST | `/` | Create service | Yes (Provider/Admin) |
| PUT | `/:id` | Update service | Yes (Provider/Admin) |
| DELETE | `/:id` | Delete service | Yes (Provider/Admin) |
| POST | `/:id/images` | Upload service images | Yes (Provider/Admin) |
| DELETE | `/:id/images/:imageId` | Delete service image | Yes (Provider/Admin) |
| POST | `/:id/book` | Book service | Yes |
| PUT | `/:id/bookings/:bookingId/status` | Update booking status | Yes |
| POST | `/:id/reviews` | Add review | Yes |
| GET | `/my-services` | Get my services | Yes |
| GET | `/my-bookings` | Get my bookings | Yes |

---

## LocalPro Plus

**Base Path:** `/api/localpro-plus`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/plans` | Get subscription plans | No |
| GET | `/plans/:id` | Get single plan | No |
| POST | `/plans` | Create plan | Yes (Admin) |
| PUT | `/plans/:id` | Update plan | Yes (Admin) |
| DELETE | `/plans/:id` | Delete plan | Yes (Admin) |
| POST | `/subscribe/:planId` | Subscribe to plan | Yes |
| POST | `/confirm-payment` | Confirm subscription payment | Yes |
| POST | `/cancel` | Cancel subscription | Yes |
| POST | `/renew` | Renew subscription | Yes |
| GET | `/my-subscription` | Get my subscription | Yes |
| PUT | `/settings` | Update subscription settings | Yes |
| GET | `/usage` | Get subscription usage | Yes |
| GET | `/analytics` | Get subscription analytics | Yes (Admin) |
| POST | `/admin/subscriptions` | Create manual subscription | Yes (Admin) |
| GET | `/admin/subscriptions` | Get all subscriptions | Yes (Admin) |
| GET | `/admin/subscriptions/user/:userId` | Get subscription by user | Yes (Admin) |
| PUT | `/admin/subscriptions/:subscriptionId` | Update manual subscription | Yes (Admin) |
| DELETE | `/admin/subscriptions/:subscriptionId` | Delete manual subscription | Yes (Admin) |

---

## Trust & Verification

**Base Path:** `/api/trust-verification`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/verified-users` | Get verified users | No |
| GET | `/requests` | Get verification requests | Yes |
| GET | `/requests/:id` | Get single request | Yes |
| POST | `/requests` | Create verification request | Yes |
| PUT | `/requests/:id` | Update verification request | Yes |
| DELETE | `/requests/:id` | Delete verification request | Yes |
| POST | `/requests/:id/documents` | Upload verification documents | Yes |
| DELETE | `/requests/:id/documents/:documentId` | Delete verification document | Yes |
| GET | `/my-requests` | Get my verification requests | Yes |
| PUT | `/requests/:id/review` | Review verification request | Yes (Admin) |
| GET | `/statistics` | Get verification statistics | Yes (Admin) |

---

## Communication

**Base Path:** `/api/communication`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/conversations` | Get conversations | Yes |
| GET | `/conversations/:id` | Get single conversation | Yes |
| POST | `/conversations` | Create conversation | Yes |
| DELETE | `/conversations/:id` | Delete conversation | Yes |
| GET | `/conversations/:id/messages` | Get messages | Yes |
| POST | `/conversations/:id/messages` | Send message | Yes |
| PUT | `/conversations/:id/messages/:messageId` | Update message | Yes |
| DELETE | `/conversations/:id/messages/:messageId` | Delete message | Yes |
| PUT | `/conversations/:id/read` | Mark as read | Yes |
| GET | `/notifications` | Get notifications | Yes |
| GET | `/notifications/count` | Get notification count | Yes |
| PUT | `/notifications/:notificationId/read` | Mark notification as read | Yes |
| PUT | `/notifications/read-all` | Mark all notifications as read | Yes |
| DELETE | `/notifications/:notificationId` | Delete notification | Yes |
| POST | `/notifications/email` | Send email notification | Yes |
| POST | `/notifications/sms` | Send SMS notification | Yes |
| GET | `/unread-count` | Get unread count | Yes |
| GET | `/search` | Search conversations | Yes |
| GET | `/conversation-with/:userId` | Get conversation with user | Yes |

---

## Analytics

**Base Path:** `/api/analytics`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/metadata` | Get analytics metadata | Yes |
| GET | `/dashboard` | Get dashboard analytics | Yes (Admin) |
| GET | `/realtime` | Get real-time metrics | Yes (Admin) |
| GET | `/time-series` | Get time series data | Yes (Admin) |
| GET | `/comparison` | Get comparison analytics | Yes (Admin) |
| GET | `/export` | Export analytics data | Yes (Admin) |
| GET | `/overview` | Get analytics overview | Yes (Admin) |
| GET | `/users` | Get user analytics | Yes (Admin) |
| GET | `/financial` | Get financial analytics | Yes (Admin) |
| GET | `/marketplace` | Get marketplace analytics | Yes (Admin) |
| GET | `/jobs` | Get job analytics | Yes (Admin) |
| GET | `/referrals` | Get referral analytics | Yes (Admin) |
| GET | `/agencies` | Get agency analytics | Yes (Admin) |
| GET | `/provider` | Get provider analytics | Yes (Provider/Admin) |
| GET | `/provider/:providerId` | Get specific provider analytics | Yes |
| GET | `/custom` | Get custom analytics | Yes (Admin) |
| POST | `/track` | Track analytics event | Yes |

---

## Maps

**Base Path:** `/api/maps`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get maps info | No |
| POST | `/geocode` | Geocode address | No |
| POST | `/reverse-geocode` | Reverse geocode | No |
| POST | `/places/search` | Search places | No |
| GET | `/places/:placeId` | Get place details | No |
| POST | `/distance` | Calculate distance | No |
| POST | `/nearby` | Find nearby places | No |
| POST | `/validate-service-area` | Validate service area | No |
| POST | `/analyze-coverage` | Analyze service coverage | Yes |
| GET | `/test` | Test connection | Yes (Admin) |

---

## PayPal

**Base Path:** `/api/paypal`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/webhook` | Handle PayPal webhook | No |
| GET | `/webhook/events` | Get webhook events | Yes (Admin) |

---

## PayMaya

**Base Path:** `/api/paymaya`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/webhook` | Handle PayMaya webhook | No |
| POST | `/checkout` | Create checkout | Yes |
| GET | `/checkout/:checkoutId` | Get checkout | Yes |
| POST | `/payment` | Create payment | Yes |
| GET | `/payment/:paymentId` | Get payment | Yes |
| POST | `/invoice` | Create invoice | Yes |
| GET | `/invoice/:invoiceId` | Get invoice | Yes |
| GET | `/config/validate` | Validate config | Yes (Admin) |
| GET | `/webhook/events` | Get webhook events | Yes (Admin) |

---

## Jobs

**Base Path:** `/api/jobs`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get job categories | No |
| GET | `/search` | Search jobs | No |
| GET | `/` | Get all jobs | No |
| GET | `/my-applications` | Get my applications | Yes |
| GET | `/my-jobs` | Get my jobs | Yes (Provider/Admin) |
| POST | `/` | Create job | Yes (Provider/Admin) |
| GET | `/:id` | Get single job | No |
| PUT | `/:id` | Update job | Yes (Provider/Admin) |
| DELETE | `/:id` | Delete job | Yes (Provider/Admin) |
| POST | `/:id/logo` | Upload company logo | Yes (Provider/Admin) |
| GET | `/:id/stats` | Get job statistics | Yes (Provider/Admin) |
| POST | `/:id/apply` | Apply for job | Yes |
| DELETE | `/:id/applications/:applicationId` | Withdraw application | Yes |
| GET | `/:id/applications` | Get job applications | Yes (Provider/Admin) |
| PUT | `/:id/applications/:applicationId/status` | Update application status | Yes (Provider/Admin) |

---

## Job Categories

**Base Path:** `/api/job-categories`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/active` | Get active categories | No |
| GET | `/` | Get all categories | No |
| GET | `/:id` | Get category by ID | No |
| GET | `/:id/stats` | Get category statistics | No |
| POST | `/` | Create category | Yes (Admin) |
| PUT | `/:id` | Update category | Yes (Admin) |
| DELETE | `/:id` | Delete category | Yes (Admin) |

---

## Referrals

**Base Path:** `/api/referrals`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/validate` | Validate referral code | No |
| POST | `/track` | Track referral click | No |
| GET | `/leaderboard` | Get referral leaderboard | No |
| GET | `/me` | Get my referrals | Yes |
| GET | `/stats` | Get referral stats | Yes |
| GET | `/links` | Get referral links | Yes |
| GET | `/rewards` | Get referral rewards | Yes |
| POST | `/invite` | Send referral invitation | Yes |
| PUT | `/preferences` | Update referral preferences | Yes |
| POST | `/process` | Process referral completion | Yes (Admin) |
| GET | `/analytics` | Get referral analytics | Yes (Admin) |

---

## Agencies

**Base Path:** `/api/agencies`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all agencies | No |
| GET | `/:id` | Get single agency | No |
| PATCH | `/:id/verification` | Update agency verification | Yes |
| POST | `/` | Create agency | Yes |
| PUT | `/:id` | Update agency | Yes |
| DELETE | `/:id` | Delete agency | Yes |
| POST | `/:id/logo` | Upload agency logo | Yes |
| POST | `/:id/providers` | Add provider | Yes |
| DELETE | `/:id/providers/:providerId` | Remove provider | Yes |
| PUT | `/:id/providers/:providerId/status` | Update provider status | Yes |
| POST | `/:id/admins` | Add admin | Yes |
| DELETE | `/:id/admins/:adminId` | Remove admin | Yes |
| GET | `/:id/analytics` | Get agency analytics | Yes |
| GET | `/my/agencies` | Get my agencies | Yes |
| POST | `/join` | Join agency | Yes |
| POST | `/leave` | Leave agency | Yes |

---

## Settings

**Base Path:** `/api/settings`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get public app settings | No |
| GET | `/app/public` | Get public app settings | No |
| GET | `/app/health` | Get app health | No |
| GET | `/user` | Get user settings | Yes |
| PUT | `/user` | Update user settings | Yes |
| PUT | `/user/:category` | Update user settings category | Yes |
| POST | `/user/reset` | Reset user settings | Yes |
| DELETE | `/user` | Delete user settings | Yes |
| GET | `/app` | Get app settings | Yes |
| PUT | `/app` | Update app settings | Yes (Admin) |
| PUT | `/app/:category` | Update app settings category | Yes (Admin) |
| POST | `/app/features/toggle` | Toggle feature flag | Yes (Admin) |

---

## Error Monitoring

**Base Path:** `/api/error-monitoring`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get error monitoring info | No |
| GET | `/stats` | Get error statistics | Yes (Admin) |
| GET | `/unresolved` | Get unresolved errors | Yes (Admin) |
| GET | `/:errorId` | Get error details | Yes (Admin) |
| PATCH | `/:errorId/resolve` | Resolve error | Yes (Admin) |
| GET | `/dashboard/summary` | Get dashboard summary | Yes (Admin) |

---

## Audit Logs

**Base Path:** `/api/audit-logs`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get audit logs | Yes (Admin) |
| GET | `/stats` | Get audit statistics | Yes (Admin) |
| GET | `/user/:userId/activity` | Get user activity summary | Yes |
| GET | `/:auditId` | Get audit log details | Yes (Admin) |
| GET | `/export/data` | Export audit logs | Yes (Admin) |
| GET | `/dashboard/summary` | Get dashboard summary | Yes (Admin) |
| POST | `/cleanup` | Clean up expired logs | Yes (Admin) |
| GET | `/metadata/categories` | Get audit metadata | Yes (Admin) |

---

## Providers

**Base Path:** `/api/providers`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/skills` | Get provider skills | No |
| GET | `/` | Get all providers | No |
| GET | `/:id` | Get provider by ID | No |
| GET | `/profile/me` | Get my provider profile | Yes |
| POST | `/profile` | Create provider profile | Yes |
| PUT | `/profile` | Update provider profile | Yes |
| PUT | `/onboarding/step` | Update onboarding step | Yes |
| POST | `/documents/upload` | Upload documents | Yes |
| GET | `/dashboard/overview` | Get provider dashboard | Yes |
| GET | `/analytics/performance` | Get provider analytics | Yes |
| GET | `/admin/all` | Get all providers (Admin) | Yes (Admin) |
| PUT | `/admin/:id/status` | Update provider status | Yes (Admin) |
| PUT | `/:id/status` | Update provider status (alt) | Yes (Admin) |
| PUT | `/admin/:id` | Update provider (Admin) | Yes (Admin) |

---

## Logs

**Base Path:** `/api/logs`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/config` | Get logger configuration | Yes (Admin) |
| PUT | `/config/level` | Set global log level | Yes (Admin) |
| PUT | `/config/override` | Set log level override | Yes (Admin) |
| DELETE | `/config/override/:context` | Remove log level override | Yes (Admin) |
| GET | `/metrics` | Get real-time log metrics | Yes (Admin) |
| POST | `/metrics/reset` | Reset log metrics | Yes (Admin) |
| GET | `/correlation/:correlationId` | Get logs by correlation ID | Yes (Admin) |
| GET | `/errors/summary` | Get error summary | Yes (Admin) |
| GET | `/statistics` | Get log statistics | Yes (Admin) |
| GET | `/slow-operations` | Get slow operations | Yes (Admin) |
| GET | `/query` | Query logs | Yes (Admin) |
| GET | `/stats` | Get log statistics | Yes (Admin) |
| GET | `/` | Get logs | Yes (Admin) |
| GET | `/:logId` | Get log details | Yes (Admin) |
| GET | `/analytics/error-trends` | Get error trends | Yes (Admin) |
| GET | `/analytics/performance` | Get performance metrics | Yes (Admin) |
| GET | `/user/:userId/activity` | Get user activity logs | Yes |
| GET | `/export/data` | Export logs | Yes (Admin) |
| GET | `/dashboard/summary` | Get dashboard summary | Yes (Admin) |
| GET | `/search/global` | Search logs globally | Yes (Admin) |
| POST | `/cleanup` | Clean up expired logs | Yes (Admin) |
| POST | `/flush` | Flush all logs | Yes (Admin) |
| DELETE | `/flush` | Flush all logs (alt) | Yes (Admin) |

---

## User Management

**Base Path:** `/api/users`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all users | Yes (Admin/Agency) |
| GET | `/stats` | Get user statistics | Yes (Admin/Agency) |
| GET | `/:id` | Get user by ID | Yes |
| POST | `/` | Create user | Yes (Admin) |
| PUT | `/:id` | Update user | Yes |
| PATCH | `/:id/status` | Update user status | Yes (Admin/Agency) |
| PATCH | `/:id/verification` | Update user verification | Yes (Admin/Agency) |
| POST | `/:id/badges` | Add badge to user | Yes (Admin/Agency) |
| PATCH | `/bulk` | Bulk update users | Yes (Admin) |
| PATCH | `/:id/restore` | Restore soft-deleted user | Yes (Admin) |
| DELETE | `/:id` | Delete user | Yes (Admin) |

---

## Search

**Base Path:** `/api/search`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Global search | No |
| GET | `/suggestions` | Get search suggestions | No |
| GET | `/popular` | Get popular searches | No |
| GET | `/advanced` | Advanced search | No |
| GET | `/entities/:type` | Search within entity type | No |
| GET | `/categories` | Get search categories | No |
| GET | `/locations` | Get popular locations | No |
| GET | `/trending` | Get trending searches | No |
| POST | `/analytics` | Track search analytics | Yes (Admin) |

---

## Announcements

**Base Path:** `/api/announcements`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all announcements | No |
| GET | `/:id` | Get single announcement | No |
| GET | `/my/list` | Get my announcements | Yes |
| POST | `/` | Create announcement | Yes (Admin/Agency) |
| PUT | `/:id` | Update announcement | Yes |
| DELETE | `/:id` | Delete announcement | Yes |
| POST | `/:id/acknowledge` | Acknowledge announcement | Yes |
| POST | `/:id/comments` | Add comment | Yes |
| GET | `/admin/statistics` | Get announcement statistics | Yes (Admin) |

---

## Activities

**Base Path:** `/api/activities`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/feed` | Get activity feed | Yes |
| GET | `/my` | Get my activities | Yes |
| GET | `/user/:userId` | Get user activities | Yes |
| GET | `/:id` | Get single activity | Yes |
| POST | `/` | Create activity | Yes |
| PUT | `/:id` | Update activity | Yes |
| DELETE | `/:id` | Delete activity | Yes |
| POST | `/:id/interactions` | Add interaction | Yes |
| DELETE | `/:id/interactions` | Remove interaction | Yes |
| GET | `/stats/my` | Get my activity stats | Yes |
| GET | `/stats/global` | Get global activity stats | Yes (Admin) |
| GET | `/metadata` | Get activity metadata | Yes |
| GET | `/timeline` | Get activity timeline | Yes |
| GET | `/points` | Get total points | Yes |
| GET | `/leaderboard` | Get activity leaderboard | Yes |

---

## Registration

**Base Path:** `/api/registration`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/early` | Early registration | No |

---

## Broadcaster

**Base Path:** `/api/broadcaster`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/active` | Get active broadcasters | No |
| GET | `/stats` | Get broadcaster stats | No |
| POST | `/:id/view` | Track view | No |
| POST | `/:id/click` | Track click | No |
| GET | `/:id` | Get broadcaster by ID | No |
| POST | `/` | Create broadcaster or track | Yes/No |
| PUT | `/:id` | Update broadcaster | Yes |
| DELETE | `/:id` | Delete broadcaster | Yes |
| GET | `/` | List all broadcasters | Yes |

---

## Favorites

**Base Path:** `/api/favorites`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats` | Get favorites statistics | Yes |
| GET | `/check/:itemType/:itemId` | Check if favorited | Yes |
| GET | `/type/:itemType` | Get favorites by type | Yes |
| DELETE | `/:itemType/:itemId` | Remove favorite by item | Yes |
| GET | `/:id` | Get favorite by ID | Yes |
| PUT | `/:id` | Update favorite | Yes |
| DELETE | `/:id` | Remove favorite | Yes |
| GET | `/` | Get all favorites | Yes |
| POST | `/` | Add favorite | Yes |

---

## AI Marketplace

**Base Path:** `/api/ai/marketplace`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/recommendations` | Natural language search | Yes |
| POST | `/price-estimator` | AI price estimation | Yes |
| POST | `/service-matcher` | AI service matching | Yes |
| POST | `/review-sentiment` | Review sentiment analysis | Yes |
| POST | `/booking-assistant` | Booking assistant | Yes |
| POST | `/description-generator` | Generate service description | Yes (Provider/Admin) |
| POST | `/description-from-title` | Generate description from title | Yes |
| POST | `/pricing-optimizer` | Pricing optimization | Yes (Provider/Admin) |
| POST | `/demand-forecast` | Demand forecasting | Yes (Provider/Admin) |
| POST | `/review-insights` | Review insights | Yes (Provider/Admin) |
| POST | `/response-assistant` | Response assistant | Yes (Provider/Admin) |
| POST | `/listing-optimizer` | Listing optimization | Yes (Provider/Admin) |
| POST | `/scheduling-assistant` | Scheduling assistant | Yes |
| POST | `/form-prefiller` | Pre-fill form fields | Yes |

---

## AI Users

**Base Path:** `/api/ai/users`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bio-generator` | Generate user bio | Yes |

---

## Escrows

**Base Path:** `/api/escrows`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's escrows | Yes |
| GET | `/:id` | Get escrow details | Yes |
| GET | `/:id/transactions` | Get transaction history | Yes |
| GET | `/:id/payout` | Get payout details | Yes |
| POST | `/create` | Create escrow | Yes |
| POST | `/:id/capture` | Capture payment | Yes |
| POST | `/:id/refund` | Refund payment | Yes |
| POST | `/:id/dispute` | Initiate dispute | Yes |
| POST | `/:id/proof-of-work` | Upload proof of work | Yes |
| POST | `/:id/payout` | Request payout | Yes |
| GET | `/admin/all` | Get all escrows | Yes (Admin) |
| GET | `/admin/stats` | Get escrow statistics | Yes (Admin) |
| POST | `/:id/dispute/resolve` | Resolve dispute | Yes (Admin) |

---

## Escrow Webhooks

**Base Path:** `/webhooks`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments` | Handle payment webhook | No |
| POST | `/disbursements` | Handle disbursement webhook | No |
| POST | `/payments/paymongo` | PayMongo payment webhook | No |
| POST | `/payments/xendit` | Xendit payment webhook | No |
| POST | `/payments/stripe` | Stripe payment webhook | No |
| POST | `/disbursements/xendit` | Xendit disbursement webhook | No |
| POST | `/disbursements/stripe` | Stripe disbursement webhook | No |

---

## Monitoring

**Base Path:** `/api/monitoring`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/metrics` | Get Prometheus metrics | No |
| GET | `/metrics/json` | Get metrics as JSON | No |
| GET | `/health` | Health check with metrics | No |
| GET | `/system` | Get system information | No |
| GET | `/performance` | Get performance summary | No |
| GET | `/system-health` | Comprehensive system health | No |

---

## Database Optimization

**Base Path:** `/api/database/optimization`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/report` | Get optimization report | Yes (Admin) |
| GET | `/recommendations` | Get index recommendations | Yes (Admin) |
| POST | `/create-indexes` | Create recommended indexes | Yes (Admin) |
| GET | `/query-stats` | Get query statistics | Yes (Admin) |
| GET | `/health` | Get database health | Yes (Admin) |
| GET | `/collections` | Get collection statistics | Yes (Admin) |
| GET | `/slow-queries` | Analyze slow queries | Yes (Admin) |
| POST | `/clear-cache` | Clear query cache | Yes (Admin) |
| POST | `/reset-stats` | Reset performance stats | Yes (Admin) |
| GET | `/backups` | List database backups | Yes (Admin) |
| POST | `/backup` | Trigger database backup | Yes (Admin) |
| POST | `/restore` | Restore database | Yes (Admin) |

---

## Live Chat

**Base Path:** `/api/live-chat`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/sessions` | Create chat session | No |
| GET | `/sessions/:sessionId` | Get session details | No |
| POST | `/sessions/:sessionId/messages` | Send message | No |
| GET | `/sessions/:sessionId/messages` | Get messages | No |
| POST | `/upload` | Upload attachment | No |
| PATCH | `/sessions/:sessionId/end` | End session | No |
| POST | `/sessions/:sessionId/rate` | Rate session | No |
| POST | `/sessions/:sessionId/typing` | Send typing indicator | No |

---

## Admin Live Chat

**Base Path:** `/api/admin/live-chat`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/sessions` | Get all sessions | Yes (Admin/Support) |
| GET | `/analytics` | Get chat analytics | Yes (Admin) |
| GET | `/sessions/:sessionId` | Get session details | Yes (Admin/Support) |
| POST | `/sessions/:sessionId/reply` | Send agent reply | Yes (Admin/Support) |
| PATCH | `/sessions/:sessionId/assign` | Assign session | Yes (Admin/Support) |
| PATCH | `/sessions/:sessionId/status` | Update session status | Yes (Admin/Support) |
| POST | `/sessions/:sessionId/notes` | Add session note | Yes (Admin/Support) |
| POST | `/sessions/:sessionId/transfer` | Transfer session | Yes (Admin/Support) |
| POST | `/sessions/:sessionId/typing` | Send typing indicator | Yes (Admin/Support) |
| GET | `/customers/:email/history` | Get customer history | Yes (Admin/Support) |
| DELETE | `/sessions/:sessionId` | Delete session | Yes (Admin) |

---

## Notifications

**Base Path:** `/api/notifications`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/fcm-token` | Register FCM token | Yes |
| DELETE | `/fcm-token/:tokenOrDeviceId` | Remove FCM token | Yes |
| GET | `/fcm-tokens` | Get FCM tokens | Yes |
| GET | `/settings` | Get notification settings | Yes |
| GET | `/check/:type` | Check if notification enabled | Yes |
| POST | `/send` | Send notification | Yes (Admin) |
| POST | `/send-bulk` | Send bulk notification | Yes (Admin) |
| POST | `/announcement` | Send system announcement | Yes (Admin) |
| POST | `/test` | Send test notification | Yes |
| GET | `/` | Get notifications | Yes |
| GET | `/unread-count` | Get unread count | Yes |
| PUT | `/:id/read` | Mark as read | Yes |
| PUT | `/read-all` | Mark all as read | Yes |
| DELETE | `/:id` | Delete notification | Yes |
| DELETE | `/` | Delete all notifications | Yes |

---

## Email Marketing

**Base Path:** `/api/email-marketing`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/campaigns` | Create campaign | Yes (Admin) |
| GET | `/campaigns` | Get campaigns | Yes (Admin) |
| POST | `/campaigns/estimate-audience` | Estimate audience | Yes (Admin) |
| GET | `/campaigns/:id` | Get campaign | Yes (Admin) |
| PUT | `/campaigns/:id` | Update campaign | Yes (Admin) |
| DELETE | `/campaigns/:id` | Delete campaign | Yes (Admin) |
| POST | `/campaigns/:id/duplicate` | Duplicate campaign | Yes (Admin) |
| POST | `/campaigns/:id/send` | Send campaign | Yes (Admin) |
| POST | `/campaigns/:id/pause` | Pause campaign | Yes (Admin) |
| POST | `/campaigns/:id/resume` | Resume campaign | Yes (Admin) |
| POST | `/campaigns/:id/cancel` | Cancel campaign | Yes (Admin) |
| POST | `/campaigns/:id/test` | Send test email | Yes (Admin) |
| GET | `/campaigns/:id/analytics` | Get campaign analytics | Yes (Admin) |
| POST | `/subscribe` | Subscribe email | No |
| GET | `/confirm/:token` | Confirm subscription | No |
| GET | `/unsubscribe/:token` | Unsubscribe | No |
| PUT | `/preferences/:token` | Update preferences | No |
| GET | `/subscribers` | Get subscribers | Yes (Admin) |
| GET | `/subscribers/stats` | Get subscriber stats | Yes (Admin) |
| GET | `/subscribers/export` | Export subscribers | Yes (Admin) |
| POST | `/subscribers/import` | Import subscribers | Yes (Admin) |
| GET | `/subscribers/:id` | Get subscriber | Yes (Admin) |
| PUT | `/subscribers/:id` | Update subscriber | Yes (Admin) |
| DELETE | `/subscribers/:id` | Delete subscriber | Yes (Admin) |
| GET | `/track/open/:campaignId/:subscriberId` | Track email open | No |
| GET | `/track/click/:campaignId/:subscriberId` | Track link click | No |
| GET | `/analytics` | Get overall analytics | Yes (Admin) |
| GET | `/analytics/top-campaigns` | Get top campaigns | Yes (Admin) |
| GET | `/analytics/daily` | Get daily stats | Yes (Admin) |

---

## Partners

**Base Path:** `/api/partners`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/onboarding/start` | Start partner onboarding | No |
| GET | `/slug/:slug` | Get partner by slug | No |
| PUT | `/:id/business-info` | Update business info | No |
| PUT | `/:id/verification` | Complete verification | No |
| PUT | `/:id/api-setup` | Complete API setup | No |
| PUT | `/:id/activate` | Activate partner | No |
| POST | `/` | Create partner | Yes (Admin) |
| GET | `/` | Get all partners | Yes (Admin) |
| GET | `/:id` | Get partner by ID | Yes (Admin) |
| PUT | `/:id` | Update partner | Yes (Admin) |
| DELETE | `/:id` | Delete partner | Yes (Admin) |
| POST | `/:id/notes` | Add partner note | Yes (Admin) |

---

## Notes

- **Auth Required**: Indicates if authentication is required
- **Yes (Admin)**: Requires admin role
- **Yes (Provider/Admin)**: Requires provider or admin role
- **No**: Public endpoint, no authentication required
- **Yes**: Requires authentication (any authenticated user)

Some routes may have additional monitoring, alerts, or database monitoring endpoints that are not listed here. Refer to the route files for complete details.

---

**Last Updated:** Generated from route files analysis
**Total Endpoints:** 500+

