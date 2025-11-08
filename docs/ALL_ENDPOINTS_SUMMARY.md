# LocalPro Super App - Complete API Endpoints Summary

**Last Updated:** January 2025  
**Total Endpoints:** 400+  
**Base URL:** `/api`

---

## Quick Navigation

- [Base Routes](#base-routes)
- [Authentication](#authentication)
- [Marketplace](#marketplace)
- [Finance](#finance) ⭐ **NEW: Top-Up Feature**
- [Supplies](#supplies)
- [Academy](#academy)
- [Rentals](#rentals)
- [Jobs](#jobs)
- [Ads](#ads)
- [Facility Care](#facility-care)
- [LocalPro Plus](#localpro-plus)
- [Trust Verification](#trust-verification)
- [Communication](#communication)
- [Analytics](#analytics)
- [Maps](#maps)
- [Payments](#payments)
- [Referrals](#referrals)
- [Agencies](#agencies)
- [Providers](#providers)
- [Settings](#settings)
- [User Management](#user-management)
- [Search](#search)
- [Announcements](#announcements)
- [Activities](#activities)
- [Registration](#registration)
- [Monitoring & Performance](#monitoring--performance)
- [Admin & System](#admin--system)

---

## Base Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | API information |
| GET | `/health` | PUBLIC | Health check |
| GET | `/monitoring` | PUBLIC | Monitoring dashboard |
| GET | `/LocalPro-Super-App-API.postman_collection.json` | PUBLIC | Postman collection |

---

## Authentication

**Base:** `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/send-code` | PUBLIC | Send verification code |
| POST | `/verify-code` | PUBLIC | Verify code |
| POST | `/register` | AUTHENTICATED | Register user |
| GET | `/profile` | AUTHENTICATED | Get profile (minimal) |
| GET | `/me` | AUTHENTICATED | Get current user |
| GET | `/profile-completion-status` | AUTHENTICATED | Get profile completion status |
| GET | `/profile-completeness` | AUTHENTICATED | Get profile completeness |
| PUT | `/profile` | AUTHENTICATED | Update profile |
| POST | `/complete-onboarding` | AUTHENTICATED | Complete onboarding |
| POST | `/upload-avatar` | AUTHENTICATED | Upload avatar |
| POST | `/upload-portfolio` | AUTHENTICATED | Upload portfolio images |
| POST | `/logout` | AUTHENTICATED | Logout |

---

## Marketplace

**Base:** `/api/marketplace`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/services` | PUBLIC | Get services |
| GET | `/services/categories` | PUBLIC | Get service categories |
| GET | `/services/categories/:category` | PUBLIC | Get category details |
| GET | `/services/nearby` | PUBLIC | Get nearby services |
| GET | `/services/:id` | PUBLIC | Get service details |
| GET | `/services/:id/providers` | PUBLIC | Get providers for service |
| GET | `/providers/:id` | PUBLIC | Get provider details |
| GET | `/my-services` | AUTHENTICATED | Get my services |
| GET | `/my-bookings` | AUTHENTICATED | Get my bookings |
| POST | `/services` | **provider, admin** | Create service |
| PUT | `/services/:id` | **provider, admin** | Update service |
| DELETE | `/services/:id` | **provider, admin** | Delete service |
| POST | `/services/:id/images` | **provider, admin** | Upload service images |
| POST | `/bookings` | AUTHENTICATED | Create booking |
| GET | `/bookings` | AUTHENTICATED | Get bookings |
| PUT | `/bookings/:id/status` | AUTHENTICATED | Update booking status |
| POST | `/bookings/:id/photos` | AUTHENTICATED | Upload booking photos |
| POST | `/bookings/:id/review` | AUTHENTICATED | Add review |
| POST | `/bookings/paypal/approve` | AUTHENTICATED | Approve PayPal booking |
| GET | `/bookings/paypal/order/:orderId` | AUTHENTICATED | Get PayPal order details |

---

## Finance ⭐

**Base:** `/api/finance`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/overview` | AUTHENTICATED | Get financial overview |
| GET | `/transactions` | AUTHENTICATED | Get transactions |
| GET | `/earnings` | AUTHENTICATED | Get earnings |
| GET | `/expenses` | AUTHENTICATED | Get expenses |
| GET | `/reports` | AUTHENTICATED | Get financial reports |
| POST | `/expenses` | AUTHENTICATED | Add expense |
| POST | `/withdraw` | AUTHENTICATED | Request withdrawal |
| PUT | `/withdrawals/:withdrawalId/process` | **admin** | Process withdrawal |
| GET | `/tax-documents` | AUTHENTICATED | Get tax documents |
| PUT | `/wallet/settings` | AUTHENTICATED | Update wallet settings |
| **POST** | **`/top-up`** | **AUTHENTICATED** | **Request top-up (with receipt upload)** ⭐ NEW |
| **PUT** | **`/top-ups/:topUpId/process`** | **admin** | **Process top-up request** ⭐ NEW |

**Top-Up Details:**
- Requires receipt image upload (multipart/form-data)
- Minimum amount: $10
- Admin approval required
- Automatically adds to wallet when approved

---

## Supplies

**Base:** `/api/supplies`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get supplies |
| GET | `/categories` | PUBLIC | Get supply categories |
| GET | `/featured` | PUBLIC | Get featured supplies |
| GET | `/nearby` | PUBLIC | Get nearby supplies |
| GET | `/:id` | PUBLIC | Get supply details |
| POST | `/` | **supplier, admin** | Create supply |
| PUT | `/:id` | **supplier, admin** | Update supply |
| DELETE | `/:id` | **supplier, admin** | Delete supply |
| POST | `/:id/images` | **supplier, admin** | Upload supply images |
| DELETE | `/:id/images/:imageId` | **supplier, admin** | Delete supply image |
| POST | `/:id/order` | AUTHENTICATED | Order supply |
| PUT | `/:id/orders/:orderId/status` | AUTHENTICATED | Update order status |
| POST | `/:id/reviews` | AUTHENTICATED | Add supply review |
| GET | `/my-supplies` | AUTHENTICATED | Get my supplies |
| GET | `/my-orders` | AUTHENTICATED | Get my supply orders |
| GET | `/statistics` | **admin** | Get supply statistics |

---

## Academy

**Base:** `/api/academy`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/courses` | PUBLIC | Get courses |
| GET | `/courses/:id` | PUBLIC | Get course details |
| GET | `/categories` | PUBLIC | Get course categories |
| GET | `/featured` | PUBLIC | Get featured courses |
| POST | `/courses` | **instructor, admin** | Create course |
| PUT | `/courses/:id` | **instructor, admin** | Update course |
| DELETE | `/courses/:id` | **instructor, admin** | Delete course |
| POST | `/courses/:id/thumbnail` | **instructor, admin** | Upload course thumbnail |
| POST | `/courses/:id/videos` | **instructor, admin** | Upload course video |
| DELETE | `/courses/:id/videos/:videoId` | **instructor, admin** | Delete course video |
| POST | `/courses/:id/enroll` | AUTHENTICATED | Enroll in course |
| PUT | `/courses/:id/progress` | AUTHENTICATED | Update course progress |
| POST | `/courses/:id/reviews` | AUTHENTICATED | Add course review |
| GET | `/my-courses` | AUTHENTICATED | Get my courses |
| GET | `/my-created-courses` | AUTHENTICATED | Get my created courses |
| GET | `/statistics` | **admin** | Get course statistics |

---

## Rentals

**Base:** `/api/rentals`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get rental items |
| GET | `/categories` | PUBLIC | Get rental categories |
| GET | `/featured` | PUBLIC | Get featured rentals |
| GET | `/nearby` | PUBLIC | Get nearby rentals |
| GET | `/:id` | PUBLIC | Get rental details |
| POST | `/` | **provider, admin** | Create rental |
| PUT | `/:id` | **provider, admin** | Update rental |
| DELETE | `/:id` | **provider, admin** | Delete rental |
| POST | `/:id/images` | **provider, admin** | Upload rental images |
| DELETE | `/:id/images/:imageId` | **provider, admin** | Delete rental image |
| POST | `/:id/book` | AUTHENTICATED | Book rental |
| PUT | `/:id/bookings/:bookingId/status` | AUTHENTICATED | Update booking status |
| POST | `/:id/reviews` | AUTHENTICATED | Add rental review |
| GET | `/my-rentals` | AUTHENTICATED | Get my rentals |
| GET | `/my-bookings` | AUTHENTICATED | Get my rental bookings |
| GET | `/statistics` | **admin** | Get rental statistics |

---

## Jobs

**Base:** `/api/jobs`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get jobs |
| GET | `/search` | PUBLIC | Search jobs |
| GET | `/:id` | PUBLIC | Get job details |
| POST | `/` | **provider, admin** | Create job |
| PUT | `/:id` | **provider, admin** | Update job |
| DELETE | `/:id` | **provider, admin** | Delete job |
| POST | `/:id/logo` | **provider, admin** | Upload company logo |
| GET | `/:id/stats` | **provider, admin** | Get job stats |
| POST | `/:id/apply` | AUTHENTICATED | Apply for job |
| GET | `/my-applications` | AUTHENTICATED | Get my applications |
| GET | `/my-jobs` | **provider, admin** | Get my jobs |
| GET | `/:id/applications` | **provider, admin** | Get job applications |
| PUT | `/:id/applications/:applicationId/status` | **provider, admin** | Update application status |

---

## Ads

**Base:** `/api/ads`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get ads |
| GET | `/categories` | PUBLIC | Get ad categories |
| GET | `/enum-values` | PUBLIC | Get enum values |
| GET | `/featured` | PUBLIC | Get featured ads |
| GET | `/:id` | PUBLIC | Get ad details |
| POST | `/:id/click` | PUBLIC | Track ad click |
| POST | `/` | AUTHENTICATED | Create ad |
| PUT | `/:id` | AUTHENTICATED | Update ad |
| DELETE | `/:id` | AUTHENTICATED | Delete ad |
| POST | `/:id/images` | AUTHENTICATED | Upload ad images |
| DELETE | `/:id/images/:imageId` | AUTHENTICATED | Delete ad image |
| POST | `/:id/promote` | AUTHENTICATED | Promote ad |
| GET | `/pending` | **admin** | Get pending ads |
| PUT | `/:id/approve` | **admin** | Approve ad |
| PUT | `/:id/reject` | **admin** | Reject ad |
| GET | `/:id/analytics` | AUTHENTICATED | Get ad analytics |
| GET | `/my-ads` | AUTHENTICATED | Get my ads |
| GET | `/statistics` | **admin** | Get ad statistics |

---

## Facility Care

**Base:** `/api/facility-care`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get facility care services |
| GET | `/nearby` | PUBLIC | Get nearby facility care services |
| GET | `/:id` | PUBLIC | Get facility care service |
| POST | `/` | **provider, admin** | Create facility care service |
| PUT | `/:id` | **provider, admin** | Update facility care service |
| DELETE | `/:id` | **provider, admin** | Delete facility care service |
| POST | `/:id/images` | **provider, admin** | Upload facility care images |
| DELETE | `/:id/images/:imageId` | **provider, admin** | Delete facility care image |
| POST | `/:id/book` | AUTHENTICATED | Book facility care service |
| PUT | `/:id/bookings/:bookingId/status` | AUTHENTICATED | Update booking status |
| POST | `/:id/reviews` | AUTHENTICATED | Add facility care review |
| GET | `/my-services` | AUTHENTICATED | Get my facility care services |
| GET | `/my-bookings` | AUTHENTICATED | Get my facility care bookings |

---

## LocalPro Plus

**Base:** `/api/localpro-plus`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/plans` | PUBLIC | Get subscription plans |
| GET | `/plans/:id` | PUBLIC | Get plan details |
| POST | `/plans` | **admin** | Create plan |
| PUT | `/plans/:id` | **admin** | Update plan |
| DELETE | `/plans/:id` | **admin** | Delete plan |
| POST | `/subscribe/:planId` | AUTHENTICATED | Subscribe to plan |
| POST | `/confirm-payment` | AUTHENTICATED | Confirm subscription payment |
| POST | `/cancel` | AUTHENTICATED | Cancel subscription |
| POST | `/renew` | AUTHENTICATED | Renew subscription |
| GET | `/my-subscription` | AUTHENTICATED | Get my subscription |
| PUT | `/settings` | AUTHENTICATED | Update subscription settings |
| GET | `/usage` | AUTHENTICATED | Get subscription usage |
| GET | `/analytics` | **admin** | Get subscription analytics |

---

## Trust Verification

**Base:** `/api/trust-verification`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/verified-users` | PUBLIC | Get verified users |
| GET | `/requests` | AUTHENTICATED | Get verification requests |
| GET | `/requests/:id` | AUTHENTICATED | Get verification request |
| POST | `/requests` | AUTHENTICATED | Create verification request |
| PUT | `/requests/:id` | AUTHENTICATED | Update verification request |
| DELETE | `/requests/:id` | AUTHENTICATED | Delete verification request |
| POST | `/requests/:id/documents` | AUTHENTICATED | Upload verification documents |
| DELETE | `/requests/:id/documents/:documentId` | AUTHENTICATED | Delete verification document |
| GET | `/my-requests` | AUTHENTICATED | Get my verification requests |
| PUT | `/requests/:id/review` | **admin** | Review verification request |
| GET | `/statistics` | **admin** | Get verification statistics |

---

## Communication

**Base:** `/api/communication`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/conversations` | AUTHENTICATED | Get conversations |
| GET | `/conversations/:id` | AUTHENTICATED | Get conversation |
| POST | `/conversations` | AUTHENTICATED | Create conversation |
| DELETE | `/conversations/:id` | AUTHENTICATED | Delete conversation |
| POST | `/conversations/:id/messages` | AUTHENTICATED | Send message |
| PUT | `/conversations/:id/messages/:messageId` | AUTHENTICATED | Update message |
| DELETE | `/conversations/:id/messages/:messageId` | AUTHENTICATED | Delete message |
| PUT | `/conversations/:id/read` | AUTHENTICATED | Mark as read |
| GET | `/notifications` | AUTHENTICATED | Get notifications |
| GET | `/notifications/count` | AUTHENTICATED | Get notification count |
| PUT | `/notifications/:notificationId/read` | AUTHENTICATED | Mark notification as read |
| PUT | `/notifications/read-all` | AUTHENTICATED | Mark all notifications as read |
| DELETE | `/notifications/:notificationId` | AUTHENTICATED | Delete notification |
| POST | `/notifications/email` | AUTHENTICATED | Send email notification |
| POST | `/notifications/sms` | AUTHENTICATED | Send SMS notification |
| GET | `/unread-count` | AUTHENTICATED | Get unread count |
| GET | `/search` | AUTHENTICATED | Search conversations |
| GET | `/conversation-with/:userId` | AUTHENTICATED | Get conversation with user |

---

## Analytics

**Base:** `/api/analytics`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/overview` | AUTHENTICATED | Get analytics overview |
| GET | `/user` | AUTHENTICATED | Get user analytics |
| GET | `/marketplace` | AUTHENTICATED | Get marketplace analytics |
| GET | `/jobs` | AUTHENTICATED | Get job analytics |
| GET | `/referrals` | AUTHENTICATED | Get referral analytics |
| GET | `/agencies` | AUTHENTICATED | Get agency analytics |
| GET | `/custom` | **admin** | Get custom analytics |
| POST | `/track` | AUTHENTICATED | Track event |

---

## Maps

**Base:** `/api/maps`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get maps info |
| POST | `/geocode` | PUBLIC | Geocode address |
| POST | `/reverse-geocode` | PUBLIC | Reverse geocode |
| POST | `/places/search` | PUBLIC | Search places |
| GET | `/places/:placeId` | PUBLIC | Get place details |
| POST | `/distance` | PUBLIC | Calculate distance |
| POST | `/nearby` | PUBLIC | Find nearby places |
| POST | `/validate-service-area` | PUBLIC | Validate service area |
| POST | `/analyze-coverage` | AUTHENTICATED | Analyze service coverage |
| GET | `/test` | **admin** | Test connection |

---

## Payments

### PayPal

**Base:** `/api/paypal`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/webhook` | PUBLIC | PayPal webhook |
| GET | `/webhook/events` | **admin** | Get webhook events |

### PayMaya

**Base:** `/api/paymaya`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/webhook` | PUBLIC | PayMaya webhook |
| POST | `/checkout` | AUTHENTICATED | Create checkout |
| GET | `/checkout/:checkoutId` | AUTHENTICATED | Get checkout |
| POST | `/payment` | AUTHENTICATED | Create payment |
| GET | `/payment/:paymentId` | AUTHENTICATED | Get payment |
| POST | `/invoice` | AUTHENTICATED | Create invoice |
| GET | `/invoice/:invoiceId` | AUTHENTICATED | Get invoice |
| GET | `/config/validate` | **admin** | Validate config |
| GET | `/webhook/events` | **admin** | Get webhook events |

---

## Referrals

**Base:** `/api/referrals`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/validate` | PUBLIC | Validate referral code |
| POST | `/track` | PUBLIC | Track referral click |
| GET | `/leaderboard` | PUBLIC | Get referral leaderboard |
| GET | `/me` | AUTHENTICATED | Get my referrals |
| GET | `/stats` | AUTHENTICATED | Get referral stats |
| GET | `/links` | AUTHENTICATED | Get referral links |
| GET | `/rewards` | AUTHENTICATED | Get referral rewards |
| POST | `/invite` | AUTHENTICATED | Send referral invitation |
| PUT | `/preferences` | AUTHENTICATED | Update referral preferences |
| POST | `/process` | **admin** | Process referral completion |
| GET | `/analytics` | **admin** | Get referral analytics |

---

## Agencies

**Base:** `/api/agencies`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get all agencies |
| GET | `/:id` | PUBLIC | Get agency |
| POST | `/` | AUTHENTICATED | Create agency |
| PUT | `/:id` | AUTHENTICATED | Update agency |
| DELETE | `/:id` | AUTHENTICATED | Delete agency |
| POST | `/:id/logo` | AUTHENTICATED | Upload agency logo |
| POST | `/:id/providers` | AUTHENTICATED | Add provider |
| DELETE | `/:id/providers/:providerId` | AUTHENTICATED | Remove provider |
| PUT | `/:id/providers/:providerId/status` | AUTHENTICATED | Update provider status |
| POST | `/:id/admins` | AUTHENTICATED | Add admin |
| DELETE | `/:id/admins/:adminId` | AUTHENTICATED | Remove admin |
| GET | `/:id/analytics` | AUTHENTICATED | Get agency analytics |
| GET | `/my/agencies` | AUTHENTICATED | Get my agencies |
| POST | `/join` | AUTHENTICATED | Join agency |
| POST | `/leave` | AUTHENTICATED | Leave agency |

---

## Providers

**Base:** `/api/providers`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get providers |
| GET | `/:id` | PUBLIC | Get provider |
| GET | `/profile/me` | AUTHENTICATED | Get my provider profile |
| POST | `/profile` | AUTHENTICATED | Create provider profile |
| PUT | `/profile` | AUTHENTICATED | Update provider profile |
| PUT | `/onboarding/step` | AUTHENTICATED | Update onboarding step |
| POST | `/documents/upload` | AUTHENTICATED | Upload documents |
| GET | `/dashboard/overview` | AUTHENTICATED | Get provider dashboard |
| GET | `/analytics/performance` | AUTHENTICATED | Get provider analytics |
| GET | `/admin/all` | AUTHENTICATED | Get providers for admin |
| PUT | `/admin/:id/status` | AUTHENTICATED | Update provider status (admin) |

---

## Settings

**Base:** `/api/settings`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get public app settings |
| GET | `/app/public` | PUBLIC | Get public app settings |
| GET | `/app/health` | PUBLIC | Get app health |
| GET | `/user` | AUTHENTICATED | Get user settings |
| PUT | `/user` | AUTHENTICATED | Update user settings |
| PUT | `/user/:category` | AUTHENTICATED | Update user settings category |
| POST | `/user/reset` | AUTHENTICATED | Reset user settings |
| DELETE | `/user` | AUTHENTICATED | Delete user settings |
| GET | `/app` | AUTHENTICATED | Get app settings |
| PUT | `/app` | **admin** | Update app settings |
| PUT | `/app/:category` | **admin** | Update app settings category |
| POST | `/app/features/toggle` | **admin** | Toggle feature flag |

---

## User Management

**Base:** `/api/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | **admin, agency_admin, agency_owner** | Get all users |
| GET | `/stats` | **admin, agency_admin, agency_owner** | Get user statistics |
| GET | `/:id` | **admin, agency_admin, agency_owner, provider, client** | Get user by ID |
| POST | `/` | **admin** | Create user |
| PUT | `/:id` | **admin, agency_admin, agency_owner, provider, client** | Update user |
| PATCH | `/:id/status` | **admin, agency_admin** | Update user status |
| PATCH | `/:id/verification` | **admin, agency_admin** | Update user verification |
| POST | `/:id/badges` | **admin, agency_admin** | Add badge to user |
| PATCH | `/bulk` | **admin** | Bulk update users |
| DELETE | `/:id` | **admin** | Delete user |

---

## Search

**Base:** `/api/search`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Global search |
| GET | `/suggestions` | PUBLIC | Get search suggestions |
| GET | `/popular` | PUBLIC | Get popular searches |
| GET | `/advanced` | PUBLIC | Advanced search |
| GET | `/entities/:type` | PUBLIC | Search within entity type |
| GET | `/categories` | PUBLIC | Get search categories |
| GET | `/locations` | PUBLIC | Get popular locations |
| GET | `/trending` | PUBLIC | Get trending searches |
| POST | `/analytics` | **admin** | Track search analytics |

---

## Announcements

**Base:** `/api/announcements`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Get announcements |
| GET | `/:id` | PUBLIC | Get announcement |
| GET | `/my/list` | AUTHENTICATED | Get my announcements |
| POST | `/` | **admin, agency_admin, agency_owner** | Create announcement |
| PUT | `/:id` | AUTHENTICATED | Update announcement |
| DELETE | `/:id` | AUTHENTICATED | Delete announcement |
| POST | `/:id/acknowledge` | AUTHENTICATED | Acknowledge announcement |
| POST | `/:id/comments` | AUTHENTICATED | Add comment |
| GET | `/admin/statistics` | **admin** | Get announcement statistics |

---

## Activities

**Base:** `/api/activities`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/feed` | AUTHENTICATED | Get activity feed |
| GET | `/my` | AUTHENTICATED | Get my activities |
| GET | `/user/:userId` | AUTHENTICATED | Get user activities |
| GET | `/:id` | AUTHENTICATED | Get activity |
| POST | `/` | AUTHENTICATED | Create activity |
| PUT | `/:id` | AUTHENTICATED | Update activity |
| DELETE | `/:id` | AUTHENTICATED | Delete activity |
| POST | `/:id/interactions` | AUTHENTICATED | Add interaction |
| DELETE | `/:id/interactions` | AUTHENTICATED | Remove interaction |
| GET | `/stats/my` | AUTHENTICATED | Get my activity stats |
| GET | `/stats/global` | **admin** | Get global activity stats |
| GET | `/metadata` | AUTHENTICATED | Get activity metadata |

---

## Registration

**Base:** `/api/registration`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/early` | PUBLIC | Early registration |

---

## Monitoring & Performance

### Monitoring

**Base:** `/api/monitoring`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/metrics` | PUBLIC | Get Prometheus metrics |
| GET | `/metrics/json` | PUBLIC | Get metrics as JSON |
| GET | `/health` | PUBLIC | Health check with metrics |
| GET | `/system` | PUBLIC | Get system information |
| GET | `/performance` | PUBLIC | Get performance summary |

### Database Monitoring

**Base:** `/api/monitoring/database`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/stats` | PUBLIC | Get database stats |
| GET | `/collections` | PUBLIC | Get collection stats |
| GET | `/queries` | PUBLIC | Get query stats |
| GET | `/connections` | PUBLIC | Get connection stats |
| POST | `/reset` | PUBLIC | Reset performance stats |
| GET | `/slow-queries` | PUBLIC | Get slow queries |
| GET | `/health` | PUBLIC | Database health check |

### Database Optimization

**Base:** `/api/database/optimization`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/report` | **admin** | Get optimization report |
| GET | `/recommendations` | **admin** | Get index recommendations |
| POST | `/create-indexes` | **admin** | Create recommended indexes |
| GET | `/query-stats` | **admin** | Get query stats |
| GET | `/health` | **admin** | Get database health |
| GET | `/collections` | **admin** | Get collection stats |
| GET | `/slow-queries` | **admin** | Analyze slow queries |
| POST | `/clear-cache` | **admin** | Clear query cache |
| POST | `/reset-stats` | **admin** | Reset performance stats |

### Metrics Stream

**Base:** `/api/monitoring/stream`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/stream` | PUBLIC | Metrics streaming (SSE) |
| GET | `/alerts/stream` | PUBLIC | Alerts streaming (SSE) |
| GET | `/ws` | PUBLIC | WebSocket-like stream |
| GET | `/connections/count` | PUBLIC | Get active connections count |
| POST | `/broadcast` | PUBLIC | Manual metrics broadcast |
| POST | `/stop` | PUBLIC | Stop broadcasting |
| POST | `/start` | PUBLIC | Start broadcasting |

### Alerts

**Base:** `/api/monitoring/alerts`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/alerts` | PUBLIC | Get current alerts |
| GET | `/alerts/history` | PUBLIC | Get alert history |
| POST | `/alerts/thresholds` | PUBLIC | Update alert thresholds |
| GET | `/alerts/thresholds` | PUBLIC | Get alert thresholds |
| POST | `/alerts/trigger` | PUBLIC | Manual alert trigger |
| DELETE | `/alerts/history` | PUBLIC | Clear alert history |

---

## Admin & System

### Error Monitoring

**Base:** `/api/error-monitoring`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | PUBLIC | Error monitoring info |
| GET | `/stats` | **admin** | Get error statistics |
| GET | `/unresolved` | **admin** | Get unresolved errors |
| GET | `/:errorId` | **admin** | Get error details |
| PATCH | `/:errorId/resolve` | **admin** | Resolve error |
| GET | `/dashboard/summary` | **admin** | Get dashboard summary |

### Audit Logs

**Base:** `/api/audit-logs`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | **admin** | Get audit logs |
| GET | `/stats` | **admin** | Get audit statistics |
| GET | `/user/:userId/activity` | **admin** (or own user) | Get user activity summary |
| GET | `/:auditId` | **admin** | Get audit log details |
| GET | `/export/data` | **admin** | Export audit logs |
| GET | `/dashboard/summary` | **admin** | Get dashboard summary |
| POST | `/cleanup` | **admin** | Cleanup expired logs |
| GET | `/metadata/categories` | **admin** | Get audit metadata |

### Logs

**Base:** `/api/logs`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/stats` | **admin** | Get log statistics |
| GET | `/` | **admin** | Get logs |
| GET | `/:logId` | **admin** | Get log details |
| GET | `/analytics/error-trends` | **admin** | Get error trends |
| GET | `/analytics/performance` | **admin** | Get performance metrics |
| GET | `/user/:userId/activity` | **admin** (or own user) | Get user activity logs |
| GET | `/export/data` | **admin** | Export logs |
| GET | `/dashboard/summary` | **admin** | Get dashboard summary |
| GET | `/search/global` | **admin** | Search logs globally |
| POST | `/cleanup` | **admin** | Cleanup expired logs |
| POST | `/flush` | **admin** | Flush all logs |
| DELETE | `/flush` | **admin** | Flush all logs (alternative) |

---

## Summary Statistics

- **Total Endpoints:** 400+
- **Public Endpoints:** ~80
- **Authenticated Endpoints:** ~250+
- **Admin-Only Endpoints:** ~70
- **Role-Specific Endpoints:** ~50+
  - Provider: ~30
  - Supplier: ~10
  - Instructor: ~10
  - Agency Admin/Owner: ~15

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained through the authentication endpoints in `/api/auth`.

---

## Notes

1. **Public Routes**: Can be accessed without authentication
2. **Authenticated Routes**: Require valid JWT token in Authorization header
3. **Role-Based Routes**: Require specific role in addition to authentication
4. **Admin Routes**: Typically marked with `[ADMIN ONLY]` comment in code
5. **Agency Routes**: Agency admins/owners can typically access their own agency data
6. **Self-Access**: Most routes allow users to access their own data regardless of role
7. **File Uploads**: Some endpoints support file uploads (images, documents) using `multipart/form-data`
8. **Rate Limiting**: Some endpoints have rate limiting applied (search, auth, payments)

---

## Recent Updates

- ✅ **Finance Top-Up Feature** (January 2025)
  - Added top-up request endpoint with receipt upload
  - Added admin approval workflow for top-ups
  - Automatic wallet balance update on approval

---

For detailed payload examples, see:
- `docs/FINANCE_TOPUP_PAYLOADS.md` - Top-up payload examples
- `docs/API_ENDPOINTS_WITH_ROLES.md` - Complete endpoint reference with roles

