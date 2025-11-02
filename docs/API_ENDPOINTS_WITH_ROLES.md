# API Endpoints with Role-Based Access Control

This document provides a comprehensive list of all API endpoints in the LocalPro Super App, organized by route groups with their required roles clearly labeled.

## Role Definitions

- **PUBLIC**: No authentication required
- **AUTHENTICATED**: Requires valid authentication token (any logged-in user)
- **admin**: System administrator
- **provider**: Service provider
- **client**: Client/customer
- **supplier**: Supplier
- **instructor**: Academy instructor
- **agency_admin**: Agency administrator
- **agency_owner**: Agency owner

---

## Base Routes

### Root & Health

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | PUBLIC | API information endpoint |
| GET | `/health` | PUBLIC | Health check |
| GET | `/monitoring` | PUBLIC | Monitoring dashboard |
| GET | `/LocalPro-Super-App-API.postman_collection.json` | PUBLIC | Postman collection download |

---

## Authentication (`/api/auth`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/send-code` | PUBLIC | Send verification code |
| POST | `/api/auth/verify-code` | PUBLIC | Verify code |
| POST | `/api/auth/register` | AUTHENTICATED | Register user |
| GET | `/api/auth/profile` | AUTHENTICATED | Get profile (minimal) |
| POST | `/api/auth/complete-onboarding` | AUTHENTICATED | Complete onboarding |
| GET | `/api/auth/profile-completion-status` | AUTHENTICATED | Get profile completion status |
| GET | `/api/auth/profile-completeness` | AUTHENTICATED | Get profile completeness |
| GET | `/api/auth/me` | AUTHENTICATED | Get current user |
| PUT | `/api/auth/profile` | AUTHENTICATED | Update profile |
| POST | `/api/auth/upload-avatar` | AUTHENTICATED | Upload avatar |
| POST | `/api/auth/upload-portfolio` | AUTHENTICATED | Upload portfolio images |
| POST | `/api/auth/logout` | AUTHENTICATED | Logout |

---

## Marketplace (`/api/marketplace`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/marketplace/services` | PUBLIC | Get services |
| GET | `/api/marketplace/services/categories` | PUBLIC | Get service categories |
| GET | `/api/marketplace/services/categories/:category` | PUBLIC | Get category details |
| GET | `/api/marketplace/services/nearby` | PUBLIC | Get nearby services |
| GET | `/api/marketplace/services/:id` | PUBLIC | Get service details |
| GET | `/api/marketplace/services/:id/providers` | PUBLIC | Get providers for service |
| GET | `/api/marketplace/providers/:id` | PUBLIC | Get provider details |
| GET | `/api/marketplace/my-services` | AUTHENTICATED | Get my services |
| GET | `/api/marketplace/my-bookings` | AUTHENTICATED | Get my bookings |
| POST | `/api/marketplace/services` | **provider, admin** | Create service |
| PUT | `/api/marketplace/services/:id` | **provider, admin** | Update service |
| DELETE | `/api/marketplace/services/:id` | **provider, admin** | Delete service |
| POST | `/api/marketplace/services/:id/images` | **provider, admin** | Upload service images |
| POST | `/api/marketplace/bookings` | AUTHENTICATED | Create booking |
| GET | `/api/marketplace/bookings` | AUTHENTICATED | Get bookings |
| PUT | `/api/marketplace/bookings/:id/status` | AUTHENTICATED | Update booking status |
| POST | `/api/marketplace/bookings/:id/photos` | AUTHENTICATED | Upload booking photos |
| POST | `/api/marketplace/bookings/:id/review` | AUTHENTICATED | Add review |
| POST | `/api/marketplace/bookings/paypal/approve` | AUTHENTICATED | Approve PayPal booking |
| GET | `/api/marketplace/bookings/paypal/order/:orderId` | AUTHENTICATED | Get PayPal order details |

---

## Ads (`/api/ads`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/ads` | PUBLIC | Get ads |
| GET | `/api/ads/categories` | PUBLIC | Get ad categories |
| GET | `/api/ads/enum-values` | PUBLIC | Get enum values |
| GET | `/api/ads/featured` | PUBLIC | Get featured ads |
| GET | `/api/ads/:id` | PUBLIC | Get ad details |
| POST | `/api/ads/:id/click` | PUBLIC | Track ad click |
| POST | `/api/ads` | AUTHENTICATED | Create ad |
| PUT | `/api/ads/:id` | AUTHENTICATED | Update ad |
| DELETE | `/api/ads/:id` | AUTHENTICATED | Delete ad |
| POST | `/api/ads/:id/images` | AUTHENTICATED | Upload ad images |
| DELETE | `/api/ads/:id/images/:imageId` | AUTHENTICATED | Delete ad image |
| POST | `/api/ads/:id/promote` | AUTHENTICATED | Promote ad |
| GET | `/api/ads/pending` | **admin** | Get pending ads |
| PUT | `/api/ads/:id/approve` | **admin** | Approve ad |
| PUT | `/api/ads/:id/reject` | **admin** | Reject ad |
| GET | `/api/ads/:id/analytics` | AUTHENTICATED | Get ad analytics |
| GET | `/api/ads/my-ads` | AUTHENTICATED | Get my ads |
| GET | `/api/ads/statistics` | **admin** | Get ad statistics |

---

## Jobs (`/api/jobs`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/jobs` | PUBLIC | Get jobs |
| GET | `/api/jobs/search` | PUBLIC | Search jobs |
| GET | `/api/jobs/:id` | PUBLIC | Get job details |
| POST | `/api/jobs` | **provider, admin** | Create job |
| PUT | `/api/jobs/:id` | **provider, admin** | Update job |
| DELETE | `/api/jobs/:id` | **provider, admin** | Delete job |
| POST | `/api/jobs/:id/logo` | **provider, admin** | Upload company logo |
| GET | `/api/jobs/:id/stats` | **provider, admin** | Get job stats |
| POST | `/api/jobs/:id/apply` | AUTHENTICATED | Apply for job |
| GET | `/api/jobs/my-applications` | AUTHENTICATED | Get my applications |
| GET | `/api/jobs/my-jobs` | **provider, admin** | Get my jobs |
| GET | `/api/jobs/:id/applications` | **provider, admin** | Get job applications |
| PUT | `/api/jobs/:id/applications/:applicationId/status` | **provider, admin** | Update application status |

---

## Rentals (`/api/rentals`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/rentals` | PUBLIC | Get rental items |
| GET | `/api/rentals/items` | PUBLIC | Get rental items (alias) |
| GET | `/api/rentals/items/:id` | PUBLIC | Get rental item (alias) |
| GET | `/api/rentals/categories` | PUBLIC | Get rental categories |
| GET | `/api/rentals/featured` | PUBLIC | Get featured rentals |
| GET | `/api/rentals/nearby` | PUBLIC | Get nearby rentals |
| GET | `/api/rentals/:id` | PUBLIC | Get rental details |
| POST | `/api/rentals` | **provider, admin** | Create rental |
| POST | `/api/rentals/items` | **provider, admin** | Create rental (alias) |
| PUT | `/api/rentals/:id` | **provider, admin** | Update rental |
| DELETE | `/api/rentals/:id` | **provider, admin** | Delete rental |
| POST | `/api/rentals/:id/images` | **provider, admin** | Upload rental images |
| DELETE | `/api/rentals/:id/images/:imageId` | **provider, admin** | Delete rental image |
| POST | `/api/rentals/:id/book` | AUTHENTICATED | Book rental |
| PUT | `/api/rentals/:id/bookings/:bookingId/status` | AUTHENTICATED | Update booking status |
| POST | `/api/rentals/:id/reviews` | AUTHENTICATED | Add rental review |
| GET | `/api/rentals/my-rentals` | AUTHENTICATED | Get my rentals |
| GET | `/api/rentals/my-bookings` | AUTHENTICATED | Get my rental bookings |
| GET | `/api/rentals/statistics` | **admin** | Get rental statistics |

---

## Academy (`/api/academy`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/academy/courses` | PUBLIC | Get courses |
| GET | `/api/academy/courses/:id` | PUBLIC | Get course details |
| GET | `/api/academy/categories` | PUBLIC | Get course categories |
| GET | `/api/academy/featured` | PUBLIC | Get featured courses |
| POST | `/api/academy/courses` | **instructor, admin** | Create course |
| PUT | `/api/academy/courses/:id` | **instructor, admin** | Update course |
| DELETE | `/api/academy/courses/:id` | **instructor, admin** | Delete course |
| POST | `/api/academy/courses/:id/thumbnail` | **instructor, admin** | Upload course thumbnail |
| POST | `/api/academy/courses/:id/videos` | **instructor, admin** | Upload course video |
| DELETE | `/api/academy/courses/:id/videos/:videoId` | **instructor, admin** | Delete course video |
| POST | `/api/academy/courses/:id/enroll` | AUTHENTICATED | Enroll in course |
| PUT | `/api/academy/courses/:id/progress` | AUTHENTICATED | Update course progress |
| POST | `/api/academy/courses/:id/reviews` | AUTHENTICATED | Add course review |
| GET | `/api/academy/my-courses` | AUTHENTICATED | Get my courses |
| GET | `/api/academy/my-created-courses` | AUTHENTICATED | Get my created courses |
| GET | `/api/academy/statistics` | **admin** | Get course statistics |

---

## Supplies (`/api/supplies`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/supplies` | PUBLIC | Get supplies |
| GET | `/api/supplies/products` | PUBLIC | Get supplies (alias) |
| GET | `/api/supplies/products/:id` | PUBLIC | Get supply (alias) |
| GET | `/api/supplies/categories` | PUBLIC | Get supply categories |
| GET | `/api/supplies/featured` | PUBLIC | Get featured supplies |
| GET | `/api/supplies/nearby` | PUBLIC | Get nearby supplies |
| GET | `/api/supplies/:id` | PUBLIC | Get supply details |
| POST | `/api/supplies` | **supplier, admin** | Create supply |
| POST | `/api/supplies/products` | **supplier, admin** | Create supply (alias) |
| PUT | `/api/supplies/:id` | **supplier, admin** | Update supply |
| DELETE | `/api/supplies/:id` | **supplier, admin** | Delete supply |
| POST | `/api/supplies/:id/images` | **supplier, admin** | Upload supply images |
| DELETE | `/api/supplies/:id/images/:imageId` | **supplier, admin** | Delete supply image |
| POST | `/api/supplies/:id/order` | AUTHENTICATED | Order supply |
| PUT | `/api/supplies/:id/orders/:orderId/status` | AUTHENTICATED | Update order status |
| POST | `/api/supplies/:id/reviews` | AUTHENTICATED | Add supply review |
| GET | `/api/supplies/my-supplies` | AUTHENTICATED | Get my supplies |
| GET | `/api/supplies/my-orders` | AUTHENTICATED | Get my supply orders |
| GET | `/api/supplies/statistics` | **admin** | Get supply statistics |

---

## Finance (`/api/finance`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/finance/overview` | AUTHENTICATED | Get financial overview |
| GET | `/api/finance/transactions` | AUTHENTICATED | Get transactions |
| GET | `/api/finance/earnings` | AUTHENTICATED | Get earnings |
| GET | `/api/finance/expenses` | AUTHENTICATED | Get expenses |
| GET | `/api/finance/reports` | AUTHENTICATED | Get financial reports |
| POST | `/api/finance/expenses` | AUTHENTICATED | Add expense |
| POST | `/api/finance/withdraw` | AUTHENTICATED | Request withdrawal |
| PUT | `/api/finance/withdrawals/:withdrawalId/process` | **admin** | Process withdrawal |
| GET | `/api/finance/tax-documents` | AUTHENTICATED | Get tax documents |
| PUT | `/api/finance/wallet/settings` | AUTHENTICATED | Update wallet settings |

---

## Facility Care (`/api/facility-care`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/facility-care` | PUBLIC | Get facility care services |
| GET | `/api/facility-care/nearby` | PUBLIC | Get nearby facility care services |
| GET | `/api/facility-care/:id` | PUBLIC | Get facility care service |
| POST | `/api/facility-care` | **provider, admin** | Create facility care service |
| PUT | `/api/facility-care/:id` | **provider, admin** | Update facility care service |
| DELETE | `/api/facility-care/:id` | **provider, admin** | Delete facility care service |
| POST | `/api/facility-care/:id/images` | **provider, admin** | Upload facility care images |
| DELETE | `/api/facility-care/:id/images/:imageId` | **provider, admin** | Delete facility care image |
| POST | `/api/facility-care/:id/book` | AUTHENTICATED | Book facility care service |
| PUT | `/api/facility-care/:id/bookings/:bookingId/status` | AUTHENTICATED | Update booking status |
| POST | `/api/facility-care/:id/reviews` | AUTHENTICATED | Add facility care review |
| GET | `/api/facility-care/my-services` | AUTHENTICATED | Get my facility care services |
| GET | `/api/facility-care/my-bookings` | AUTHENTICATED | Get my facility care bookings |

---

## LocalPro Plus (`/api/localpro-plus`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/localpro-plus/plans` | PUBLIC | Get subscription plans |
| GET | `/api/localpro-plus/plans/:id` | PUBLIC | Get plan details |
| POST | `/api/localpro-plus/plans` | **admin** | Create plan |
| PUT | `/api/localpro-plus/plans/:id` | **admin** | Update plan |
| DELETE | `/api/localpro-plus/plans/:id` | **admin** | Delete plan |
| POST | `/api/localpro-plus/subscribe/:planId` | AUTHENTICATED | Subscribe to plan |
| POST | `/api/localpro-plus/confirm-payment` | AUTHENTICATED | Confirm subscription payment |
| POST | `/api/localpro-plus/cancel` | AUTHENTICATED | Cancel subscription |
| POST | `/api/localpro-plus/renew` | AUTHENTICATED | Renew subscription |
| GET | `/api/localpro-plus/my-subscription` | AUTHENTICATED | Get my subscription |
| PUT | `/api/localpro-plus/settings` | AUTHENTICATED | Update subscription settings |
| GET | `/api/localpro-plus/usage` | AUTHENTICATED | Get subscription usage |
| GET | `/api/localpro-plus/analytics` | **admin** | Get subscription analytics |

---

## Trust Verification (`/api/trust-verification`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/trust-verification/verified-users` | PUBLIC | Get verified users |
| GET | `/api/trust-verification/requests` | AUTHENTICATED | Get verification requests |
| GET | `/api/trust-verification/requests/:id` | AUTHENTICATED | Get verification request |
| POST | `/api/trust-verification/requests` | AUTHENTICATED | Create verification request |
| PUT | `/api/trust-verification/requests/:id` | AUTHENTICATED | Update verification request |
| DELETE | `/api/trust-verification/requests/:id` | AUTHENTICATED | Delete verification request |
| POST | `/api/trust-verification/requests/:id/documents` | AUTHENTICATED | Upload verification documents |
| DELETE | `/api/trust-verification/requests/:id/documents/:documentId` | AUTHENTICATED | Delete verification document |
| GET | `/api/trust-verification/my-requests` | AUTHENTICATED | Get my verification requests |
| PUT | `/api/trust-verification/requests/:id/review` | **admin** | Review verification request |
| GET | `/api/trust-verification/statistics` | **admin** | Get verification statistics |

---

## Communication (`/api/communication`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/communication/conversations` | AUTHENTICATED | Get conversations |
| GET | `/api/communication/conversations/:id` | AUTHENTICATED | Get conversation |
| POST | `/api/communication/conversations` | AUTHENTICATED | Create conversation |
| DELETE | `/api/communication/conversations/:id` | AUTHENTICATED | Delete conversation |
| POST | `/api/communication/conversations/:id/messages` | AUTHENTICATED | Send message |
| PUT | `/api/communication/conversations/:id/messages/:messageId` | AUTHENTICATED | Update message |
| DELETE | `/api/communication/conversations/:id/messages/:messageId` | AUTHENTICATED | Delete message |
| PUT | `/api/communication/conversations/:id/read` | AUTHENTICATED | Mark as read |
| GET | `/api/communication/notifications` | AUTHENTICATED | Get notifications |
| GET | `/api/communication/notifications/count` | AUTHENTICATED | Get notification count |
| PUT | `/api/communication/notifications/:notificationId/read` | AUTHENTICATED | Mark notification as read |
| PUT | `/api/communication/notifications/read-all` | AUTHENTICATED | Mark all notifications as read |
| DELETE | `/api/communication/notifications/:notificationId` | AUTHENTICATED | Delete notification |
| POST | `/api/communication/notifications/email` | AUTHENTICATED | Send email notification |
| POST | `/api/communication/notifications/sms` | AUTHENTICATED | Send SMS notification |
| GET | `/api/communication/unread-count` | AUTHENTICATED | Get unread count |
| GET | `/api/communication/search` | AUTHENTICATED | Search conversations |
| GET | `/api/communication/conversation-with/:userId` | AUTHENTICATED | Get conversation with user |

---

## Analytics (`/api/analytics`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/analytics/overview` | AUTHENTICATED | Get analytics overview |
| GET | `/api/analytics/user` | AUTHENTICATED | Get user analytics |
| GET | `/api/analytics/marketplace` | AUTHENTICATED | Get marketplace analytics |
| GET | `/api/analytics/jobs` | AUTHENTICATED | Get job analytics |
| GET | `/api/analytics/referrals` | AUTHENTICATED | Get referral analytics |
| GET | `/api/analytics/agencies` | AUTHENTICATED | Get agency analytics |
| GET | `/api/analytics/custom` | **admin** | Get custom analytics |
| POST | `/api/analytics/track` | AUTHENTICATED | Track event |

---

## Maps (`/api/maps`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/maps` | PUBLIC | Get maps info |
| POST | `/api/maps/geocode` | PUBLIC | Geocode address |
| POST | `/api/maps/reverse-geocode` | PUBLIC | Reverse geocode |
| POST | `/api/maps/places/search` | PUBLIC | Search places |
| GET | `/api/maps/places/:placeId` | PUBLIC | Get place details |
| POST | `/api/maps/distance` | PUBLIC | Calculate distance |
| POST | `/api/maps/nearby` | PUBLIC | Find nearby places |
| POST | `/api/maps/validate-service-area` | PUBLIC | Validate service area |
| POST | `/api/maps/analyze-coverage` | AUTHENTICATED | Analyze service coverage |
| GET | `/api/maps/test` | **admin** | Test connection |

---

## PayPal (`/api/paypal`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/paypal/webhook` | PUBLIC | PayPal webhook |
| GET | `/api/paypal/webhook/events` | **admin** | Get webhook events |

---

## PayMaya (`/api/paymaya`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/paymaya/webhook` | PUBLIC | PayMaya webhook |
| POST | `/api/paymaya/checkout` | AUTHENTICATED | Create checkout |
| GET | `/api/paymaya/checkout/:checkoutId` | AUTHENTICATED | Get checkout |
| POST | `/api/paymaya/payment` | AUTHENTICATED | Create payment |
| GET | `/api/paymaya/payment/:paymentId` | AUTHENTICATED | Get payment |
| POST | `/api/paymaya/invoice` | AUTHENTICATED | Create invoice |
| GET | `/api/paymaya/invoice/:invoiceId` | AUTHENTICATED | Get invoice |
| GET | `/api/paymaya/config/validate` | **admin** | Validate config |
| GET | `/api/paymaya/webhook/events` | **admin** | Get webhook events |

---

## Referrals (`/api/referrals`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/referrals/validate` | PUBLIC | Validate referral code |
| POST | `/api/referrals/track` | PUBLIC | Track referral click |
| GET | `/api/referrals/leaderboard` | PUBLIC | Get referral leaderboard |
| GET | `/api/referrals/me` | AUTHENTICATED | Get my referrals |
| GET | `/api/referrals/stats` | AUTHENTICATED | Get referral stats |
| GET | `/api/referrals/links` | AUTHENTICATED | Get referral links |
| GET | `/api/referrals/rewards` | AUTHENTICATED | Get referral rewards |
| POST | `/api/referrals/invite` | AUTHENTICATED | Send referral invitation |
| PUT | `/api/referrals/preferences` | AUTHENTICATED | Update referral preferences |
| POST | `/api/referrals/process` | **admin** | Process referral completion |
| GET | `/api/referrals/analytics` | **admin** | Get referral analytics |

---

## Agencies (`/api/agencies`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/agencies` | PUBLIC | Get all agencies |
| GET | `/api/agencies/:id` | PUBLIC | Get agency |
| POST | `/api/agencies` | AUTHENTICATED | Create agency |
| PUT | `/api/agencies/:id` | AUTHENTICATED | Update agency |
| DELETE | `/api/agencies/:id` | AUTHENTICATED | Delete agency |
| POST | `/api/agencies/:id/logo` | AUTHENTICATED | Upload agency logo |
| POST | `/api/agencies/:id/providers` | AUTHENTICATED | Add provider |
| DELETE | `/api/agencies/:id/providers/:providerId` | AUTHENTICATED | Remove provider |
| PUT | `/api/agencies/:id/providers/:providerId/status` | AUTHENTICATED | Update provider status |
| POST | `/api/agencies/:id/admins` | AUTHENTICATED | Add admin |
| DELETE | `/api/agencies/:id/admins/:adminId` | AUTHENTICATED | Remove admin |
| GET | `/api/agencies/:id/analytics` | AUTHENTICATED | Get agency analytics |
| GET | `/api/agencies/my/agencies` | AUTHENTICATED | Get my agencies |
| POST | `/api/agencies/join` | AUTHENTICATED | Join agency |
| POST | `/api/agencies/leave` | AUTHENTICATED | Leave agency |

---

## Providers (`/api/providers`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/providers` | PUBLIC | Get providers |
| GET | `/api/providers/:id` | PUBLIC | Get provider |
| GET | `/api/providers/profile/me` | AUTHENTICATED | Get my provider profile |
| POST | `/api/providers/profile` | AUTHENTICATED | Create provider profile |
| PUT | `/api/providers/profile` | AUTHENTICATED | Update provider profile |
| PUT | `/api/providers/onboarding/step` | AUTHENTICATED | Update onboarding step |
| POST | `/api/providers/documents/upload` | AUTHENTICATED | Upload documents |
| GET | `/api/providers/dashboard/overview` | AUTHENTICATED | Get provider dashboard |
| GET | `/api/providers/analytics/performance` | AUTHENTICATED | Get provider analytics |
| GET | `/api/providers/admin/all` | AUTHENTICATED | Get providers for admin |
| PUT | `/api/providers/admin/:id/status` | AUTHENTICATED | Update provider status (admin) |

---

## Settings (`/api/settings`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/settings` | PUBLIC | Get public app settings |
| GET | `/api/settings/app/public` | PUBLIC | Get public app settings |
| GET | `/api/settings/app/health` | PUBLIC | Get app health |
| GET | `/api/settings/user` | AUTHENTICATED | Get user settings |
| PUT | `/api/settings/user` | AUTHENTICATED | Update user settings |
| PUT | `/api/settings/user/:category` | AUTHENTICATED | Update user settings category |
| POST | `/api/settings/user/reset` | AUTHENTICATED | Reset user settings |
| DELETE | `/api/settings/user` | AUTHENTICATED | Delete user settings |
| GET | `/api/settings/app` | AUTHENTICATED | Get app settings |
| PUT | `/api/settings/app` | **admin** | Update app settings |
| PUT | `/api/settings/app/:category` | **admin** | Update app settings category |
| POST | `/api/settings/app/features/toggle` | **admin** | Toggle feature flag |

---

## User Management (`/api/users`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/users` | **admin, agency_admin, agency_owner** | Get all users |
| GET | `/api/users/stats` | **admin, agency_admin, agency_owner** | Get user statistics |
| GET | `/api/users/:id` | **admin, agency_admin, agency_owner, provider, client** | Get user by ID |
| POST | `/api/users` | **admin** | Create user |
| PUT | `/api/users/:id` | **admin, agency_admin, agency_owner, provider, client** | Update user |
| PATCH | `/api/users/:id/status` | **admin, agency_admin** | Update user status |
| PATCH | `/api/users/:id/verification` | **admin, agency_admin** | Update user verification |
| POST | `/api/users/:id/badges` | **admin, agency_admin** | Add badge to user |
| PATCH | `/api/users/bulk` | **admin** | Bulk update users |
| DELETE | `/api/users/:id` | **admin** | Delete user |

---

## Search (`/api/search`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/search` | PUBLIC | Global search |
| GET | `/api/search/suggestions` | PUBLIC | Get search suggestions |
| GET | `/api/search/popular` | PUBLIC | Get popular searches |
| GET | `/api/search/advanced` | PUBLIC | Advanced search |
| GET | `/api/search/entities/:type` | PUBLIC | Search within entity type |
| GET | `/api/search/categories` | PUBLIC | Get search categories |
| GET | `/api/search/locations` | PUBLIC | Get popular locations |
| GET | `/api/search/trending` | PUBLIC | Get trending searches |
| POST | `/api/search/analytics` | **admin** | Track search analytics |

---

## Announcements (`/api/announcements`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/announcements` | PUBLIC | Get announcements |
| GET | `/api/announcements/:id` | PUBLIC | Get announcement |
| GET | `/api/announcements/my/list` | AUTHENTICATED | Get my announcements |
| POST | `/api/announcements` | **admin, agency_admin, agency_owner** | Create announcement |
| PUT | `/api/announcements/:id` | AUTHENTICATED | Update announcement |
| DELETE | `/api/announcements/:id` | AUTHENTICATED | Delete announcement |
| POST | `/api/announcements/:id/acknowledge` | AUTHENTICATED | Acknowledge announcement |
| POST | `/api/announcements/:id/comments` | AUTHENTICATED | Add comment |
| GET | `/api/announcements/admin/statistics` | **admin** | Get announcement statistics |

---

## Activities (`/api/activities`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/activities/feed` | AUTHENTICATED | Get activity feed |
| GET | `/api/activities/my` | AUTHENTICATED | Get my activities |
| GET | `/api/activities/user/:userId` | AUTHENTICATED | Get user activities |
| GET | `/api/activities/:id` | AUTHENTICATED | Get activity |
| POST | `/api/activities` | AUTHENTICATED | Create activity |
| PUT | `/api/activities/:id` | AUTHENTICATED | Update activity |
| DELETE | `/api/activities/:id` | AUTHENTICATED | Delete activity |
| POST | `/api/activities/:id/interactions` | AUTHENTICATED | Add interaction |
| DELETE | `/api/activities/:id/interactions` | AUTHENTICATED | Remove interaction |
| GET | `/api/activities/stats/my` | AUTHENTICATED | Get my activity stats |
| GET | `/api/activities/stats/global` | **admin** | Get global activity stats |
| GET | `/api/activities/metadata` | AUTHENTICATED | Get activity metadata |

---

## Registration (`/api/registration`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/registration/early` | PUBLIC | Early registration |

---

## Monitoring (`/api/monitoring`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/monitoring/metrics` | PUBLIC | Get Prometheus metrics |
| GET | `/api/monitoring/metrics/json` | PUBLIC | Get metrics as JSON |
| GET | `/api/monitoring/health` | PUBLIC | Health check with metrics |
| GET | `/api/monitoring/system` | PUBLIC | Get system information |
| GET | `/api/monitoring/performance` | PUBLIC | Get performance summary |

---

## Error Monitoring (`/api/error-monitoring`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/error-monitoring` | PUBLIC | Error monitoring info |
| GET | `/api/error-monitoring/stats` | **admin** | Get error statistics |
| GET | `/api/error-monitoring/unresolved` | **admin** | Get unresolved errors |
| GET | `/api/error-monitoring/:errorId` | **admin** | Get error details |
| PATCH | `/api/error-monitoring/:errorId/resolve` | **admin** | Resolve error |
| GET | `/api/error-monitoring/dashboard/summary` | **admin** | Get dashboard summary |

---

## Audit Logs (`/api/audit-logs`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/audit-logs` | **admin** | Get audit logs |
| GET | `/api/audit-logs/stats` | **admin** | Get audit statistics |
| GET | `/api/audit-logs/user/:userId/activity` | **admin** (or own user) | Get user activity summary |
| GET | `/api/audit-logs/:auditId` | **admin** | Get audit log details |
| GET | `/api/audit-logs/export/data` | **admin** | Export audit logs |
| GET | `/api/audit-logs/dashboard/summary` | **admin** | Get dashboard summary |
| POST | `/api/audit-logs/cleanup` | **admin** | Cleanup expired logs |
| GET | `/api/audit-logs/metadata/categories` | **admin** | Get audit metadata |

---

## Logs (`/api/logs`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/logs/stats` | **admin** | Get log statistics |
| GET | `/api/logs` | **admin** | Get logs |
| GET | `/api/logs/:logId` | **admin** | Get log details |
| GET | `/api/logs/analytics/error-trends` | **admin** | Get error trends |
| GET | `/api/logs/analytics/performance` | **admin** | Get performance metrics |
| GET | `/api/logs/user/:userId/activity` | **admin** (or own user) | Get user activity logs |
| GET | `/api/logs/export/data` | **admin** | Export logs |
| GET | `/api/logs/dashboard/summary` | **admin** | Get dashboard summary |
| GET | `/api/logs/search/global` | **admin** | Search logs globally |
| POST | `/api/logs/cleanup` | **admin** | Cleanup expired logs |
| POST | `/api/logs/flush` | **admin** | Flush all logs |
| DELETE | `/api/logs/flush` | **admin** | Flush all logs (alternative) |

---

## Database Monitoring (`/api/monitoring/database`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/monitoring/database/stats` | PUBLIC | Get database stats |
| GET | `/api/monitoring/database/collections` | PUBLIC | Get collection stats |
| GET | `/api/monitoring/database/queries` | PUBLIC | Get query stats |
| GET | `/api/monitoring/database/connections` | PUBLIC | Get connection stats |
| POST | `/api/monitoring/database/reset` | PUBLIC | Reset performance stats |
| GET | `/api/monitoring/database/slow-queries` | PUBLIC | Get slow queries |
| GET | `/api/monitoring/database/health` | PUBLIC | Database health check |

---

## Database Optimization (`/api/database/optimization`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/database/optimization/report` | **admin** | Get optimization report |
| GET | `/api/database/optimization/recommendations` | **admin** | Get index recommendations |
| POST | `/api/database/optimization/create-indexes` | **admin** | Create recommended indexes |
| GET | `/api/database/optimization/query-stats` | **admin** | Get query stats |
| GET | `/api/database/optimization/health` | **admin** | Get database health |
| GET | `/api/database/optimization/collections` | **admin** | Get collection stats |
| GET | `/api/database/optimization/slow-queries` | **admin** | Analyze slow queries |
| POST | `/api/database/optimization/clear-cache` | **admin** | Clear query cache |
| POST | `/api/database/optimization/reset-stats` | **admin** | Reset performance stats |

---

## Metrics Stream (`/api/monitoring/stream`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/monitoring/stream/stream` | PUBLIC | Metrics streaming (SSE) |
| GET | `/api/monitoring/stream/alerts/stream` | PUBLIC | Alerts streaming (SSE) |
| GET | `/api/monitoring/stream/ws` | PUBLIC | WebSocket-like stream |
| GET | `/api/monitoring/stream/connections/count` | PUBLIC | Get active connections count |
| POST | `/api/monitoring/stream/broadcast` | PUBLIC | Manual metrics broadcast |
| POST | `/api/monitoring/stream/stop` | PUBLIC | Stop broadcasting |
| POST | `/api/monitoring/stream/start` | PUBLIC | Start broadcasting |

---

## Alerts (`/api/monitoring/alerts`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/monitoring/alerts/alerts` | PUBLIC | Get current alerts |
| GET | `/api/monitoring/alerts/alerts/history` | PUBLIC | Get alert history |
| POST | `/api/monitoring/alerts/alerts/thresholds` | PUBLIC | Update alert thresholds |
| GET | `/api/monitoring/alerts/alerts/thresholds` | PUBLIC | Get alert thresholds |
| POST | `/api/monitoring/alerts/alerts/trigger` | PUBLIC | Manual alert trigger |
| DELETE | `/api/monitoring/alerts/alerts/history` | PUBLIC | Clear alert history |

---

## Summary Statistics

- **Total Endpoints**: ~400+
- **Public Endpoints**: ~80
- **Authenticated Endpoints**: ~250+
- **Admin-Only Endpoints**: ~70
- **Role-Specific Endpoints**: ~50+
  - Provider: ~30
  - Supplier: ~10
  - Instructor: ~10
  - Agency Admin/Owner: ~15

---

## Notes

1. **Public Routes**: Can be accessed without authentication
2. **Authenticated Routes**: Require valid JWT token in Authorization header
3. **Role-Based Routes**: Require specific role in addition to authentication
4. **Admin Routes**: Typically marked with `[ADMIN ONLY]` comment in code
5. **Agency Routes**: Agency admins/owners can typically access their own agency data
6. **Self-Access**: Most routes allow users to access their own data regardless of role

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are obtained through the authentication endpoints in `/api/auth`.

