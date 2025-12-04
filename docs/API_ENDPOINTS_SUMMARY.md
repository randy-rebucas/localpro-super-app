# API Endpoints Summary

## Overview
This document provides a quick reference for all API endpoints organized by feature.

## Authentication (`/api/auth`)

### Public
- `POST /api/auth/send-code` - Send SMS verification code
- `POST /api/auth/verify-code` - Verify code and login/register

### Authenticated
- `POST /api/auth/register` - Register user
- `GET /api/auth/profile` - Get minimal profile
- `POST /api/auth/complete-onboarding` - Complete onboarding
- `GET /api/auth/profile-completion-status` - Get completion status
- `GET /api/auth/profile-completeness` - Get completeness percentage
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/upload-avatar` - Upload avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio images
- `POST /api/auth/logout` - Logout

## Marketplace (`/api/marketplace`)

### Public
- `GET /api/marketplace/services` - Get services
- `GET /api/marketplace/services/categories` - Get categories
- `GET /api/marketplace/services/categories/:category` - Get category details
- `GET /api/marketplace/services/nearby` - Get nearby services
- `GET /api/marketplace/services/:id` - Get service details
- `GET /api/marketplace/services/:id/providers` - Get providers for service
- `GET /api/marketplace/providers/:id` - Get provider details

### Authenticated
- `GET /api/marketplace/my-services` - Get my services
- `GET /api/marketplace/my-bookings` - Get my bookings
- `POST /api/marketplace/services` - Create service (provider, admin)
- `PUT /api/marketplace/services/:id` - Update service (provider, admin)
- `DELETE /api/marketplace/services/:id` - Delete service (provider, admin)
- `POST /api/marketplace/services/:id/images` - Upload images (provider, admin)
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/bookings` - Get bookings
- `GET /api/marketplace/bookings/:id` - Get booking details
- `PUT /api/marketplace/bookings/:id/status` - Update booking status
- `POST /api/marketplace/bookings/:id/photos` - Upload photos
- `POST /api/marketplace/bookings/:id/review` - Add review
- `POST /api/marketplace/bookings/paypal/approve` - Approve PayPal booking
- `GET /api/marketplace/bookings/paypal/order/:orderId` - Get PayPal order

## Jobs (`/api/jobs`)

### Public
- `GET /api/jobs` - Get jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/:id` - Get job details

### Authenticated
- `POST /api/jobs` - Create job (provider, admin)
- `PUT /api/jobs/:id` - Update job (provider, admin)
- `DELETE /api/jobs/:id` - Delete job (provider, admin)
- `POST /api/jobs/:id/logo` - Upload logo (provider, admin)
- `GET /api/jobs/:id/stats` - Get stats (provider, admin)
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/my-applications` - Get my applications
- `GET /api/jobs/my-jobs` - Get my jobs (provider, admin)
- `GET /api/jobs/:id/applications` - Get applications (provider, admin)
- `PUT /api/jobs/:id/applications/:applicationId/status` - Update status (provider, admin)

## Providers (`/api/providers`)

### Public
- `GET /api/providers` - Get providers
- `GET /api/providers/:id` - Get provider details

### Authenticated
- `GET /api/providers/profile/me` - Get my profile
- `POST /api/providers/profile` - Create profile
- `PUT /api/providers/profile` - Update profile
- `PUT /api/providers/onboarding/step` - Update onboarding step
- `POST /api/providers/documents/upload` - Upload documents
- `GET /api/providers/dashboard/overview` - Get dashboard
- `GET /api/providers/analytics/performance` - Get analytics
- `GET /api/providers/admin/all` - Get all providers
- `PUT /api/providers/admin/:id/status` - Update status

## Finance (`/api/finance`)

### Authenticated
- `GET /api/finance/overview` - Get overview
- `GET /api/finance/transactions` - Get transactions
- `GET /api/finance/earnings` - Get earnings
- `GET /api/finance/expenses` - Get expenses
- `GET /api/finance/reports` - Get reports
- `POST /api/finance/expenses` - Add expense
- `POST /api/finance/withdraw` - Request withdrawal
- `PUT /api/finance/withdrawals/:withdrawalId/process` - Process withdrawal (admin)
- `GET /api/finance/tax-documents` - Get tax documents
- `PUT /api/finance/wallet/settings` - Update wallet settings
- `POST /api/finance/top-up` - Request top-up
- `PUT /api/finance/top-ups/:topUpId/process` - Process top-up (admin)

## Communication (`/api/communication`)

### Authenticated
- `GET /api/communication/conversations` - Get conversations
- `GET /api/communication/conversations/:id` - Get conversation
- `POST /api/communication/conversations` - Create conversation
- `DELETE /api/communication/conversations/:id` - Delete conversation
- `GET /api/communication/conversations/:id/messages` - Get messages
- `POST /api/communication/conversations/:id/messages` - Send message
- `PUT /api/communication/conversations/:id/messages/:messageId` - Update message
- `DELETE /api/communication/conversations/:id/messages/:messageId` - Delete message
- `PUT /api/communication/conversations/:id/read` - Mark as read
- `GET /api/communication/notifications` - Get notifications
- `GET /api/communication/notifications/count` - Get count
- `PUT /api/communication/notifications/:notificationId/read` - Mark read
- `PUT /api/communication/notifications/read-all` - Mark all read
- `DELETE /api/communication/notifications/:notificationId` - Delete notification
- `POST /api/communication/notifications/email` - Send email
- `POST /api/communication/notifications/sms` - Send SMS
- `GET /api/communication/unread-count` - Get unread count
- `GET /api/communication/search` - Search conversations
- `GET /api/communication/conversation-with/:userId` - Get conversation with user

## Academy (`/api/academy`)

### Public
- `GET /api/academy/courses` - Get courses
- `GET /api/academy/courses/:id` - Get course details
- `GET /api/academy/categories` - Get categories
- `GET /api/academy/featured` - Get featured courses

### Authenticated
- `POST /api/academy/courses` - Create course (instructor, admin)
- `PUT /api/academy/courses/:id` - Update course (instructor, admin)
- `DELETE /api/academy/courses/:id` - Delete course (instructor, admin)
- `POST /api/academy/courses/:id/thumbnail` - Upload thumbnail (instructor, admin)
- `POST /api/academy/courses/:id/videos` - Upload video (instructor, admin)
- `DELETE /api/academy/courses/:id/videos/:videoId` - Delete video (instructor, admin)
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `PUT /api/academy/courses/:id/progress` - Update progress
- `POST /api/academy/courses/:id/reviews` - Add review
- `GET /api/academy/my-courses` - Get my courses
- `GET /api/academy/my-created-courses` - Get my created courses
- `GET /api/academy/statistics` - Get statistics (admin)

## Supplies (`/api/supplies`)

### Public
- `GET /api/supplies` - Get supplies
- `GET /api/supplies/products` - Get products (alias)
- `GET /api/supplies/products/:id` - Get product (alias)
- `GET /api/supplies/categories` - Get categories
- `GET /api/supplies/featured` - Get featured
- `GET /api/supplies/nearby` - Get nearby
- `GET /api/supplies/:id` - Get supply details

### Authenticated
- `POST /api/supplies` - Create supply (supplier, admin)
- `POST /api/supplies/products` - Create product (supplier, admin)
- `PUT /api/supplies/:id` - Update supply (supplier, admin)
- `DELETE /api/supplies/:id` - Delete supply (supplier, admin)
- `POST /api/supplies/:id/images` - Upload images (supplier, admin)
- `DELETE /api/supplies/:id/images/:imageId` - Delete image (supplier, admin)
- `POST /api/supplies/:id/order` - Order supply
- `PUT /api/supplies/:id/orders/:orderId/status` - Update order status
- `POST /api/supplies/:id/reviews` - Add review
- `GET /api/supplies/my-supplies` - Get my supplies
- `GET /api/supplies/my-orders` - Get my orders
- `GET /api/supplies/statistics` - Get statistics (admin)

## Additional Features

### Rentals (`/api/rentals`)
- See feature documentation for complete endpoint list

### Ads (`/api/ads`)
- See feature documentation for complete endpoint list

### Facility Care (`/api/facility-care`)
- See feature documentation for complete endpoint list

### LocalPro Plus (`/api/localpro-plus`)
- See feature documentation for complete endpoint list

### Trust Verification (`/api/trust-verification`)
- See feature documentation for complete endpoint list

### Analytics (`/api/analytics`)
- See feature documentation for complete endpoint list

### Maps (`/api/maps`)
- See feature documentation for complete endpoint list

### PayPal (`/api/paypal`)
- See feature documentation for complete endpoint list

### PayMaya (`/api/paymaya`)
- See feature documentation for complete endpoint list

### Referrals (`/api/referrals`)
- See feature documentation for complete endpoint list

### Agencies (`/api/agencies`)
- See feature documentation for complete endpoint list

### Settings (`/api/settings`)
- See feature documentation for complete endpoint list

### User Management (`/api/users`)
- See feature documentation for complete endpoint list

### Search (`/api/search`)
- See feature documentation for complete endpoint list

### Announcements (`/api/announcements`)
- See feature documentation for complete endpoint list

### Activities (`/api/activities`)
- See feature documentation for complete endpoint list

### Registration (`/api/registration`)
- See feature documentation for complete endpoint list

### Monitoring (`/api/monitoring`)
- See feature documentation for complete endpoint list

### AI Marketplace (`/api/ai/marketplace`)
- See feature documentation for complete endpoint list

### Live Chat (`/api/live-chat` & `/api/admin/live-chat`)

#### Public (Guest Users)
- `POST /api/live-chat/sessions` - Create chat session
- `GET /api/live-chat/sessions/:sessionId` - Get session details
- `POST /api/live-chat/sessions/:sessionId/messages` - Send message
- `GET /api/live-chat/sessions/:sessionId/messages` - Get messages
- `POST /api/live-chat/upload` - Upload attachments
- `PATCH /api/live-chat/sessions/:sessionId/end` - End session
- `POST /api/live-chat/sessions/:sessionId/rate` - Rate session
- `POST /api/live-chat/sessions/:sessionId/typing` - Typing indicator

#### Admin (Authenticated - admin, super_admin, support)
- `GET /api/admin/live-chat/sessions` - List all sessions
- `GET /api/admin/live-chat/sessions/:sessionId` - Get session with messages
- `POST /api/admin/live-chat/sessions/:sessionId/reply` - Send agent reply
- `PATCH /api/admin/live-chat/sessions/:sessionId/assign` - Assign to agent
- `PATCH /api/admin/live-chat/sessions/:sessionId/status` - Update status
- `POST /api/admin/live-chat/sessions/:sessionId/notes` - Add internal note
- `POST /api/admin/live-chat/sessions/:sessionId/transfer` - Transfer session
- `GET /api/admin/live-chat/analytics` - Get chat analytics
- `GET /api/admin/live-chat/customers/:email/history` - Customer history
- `DELETE /api/admin/live-chat/sessions/:sessionId` - Delete session

#### WebSocket
- `ws://localhost:5000/ws/live-chat` - Real-time chat connection

See **[Live Chat API Documentation](features/LIVE_CHAT_API.md)** for complete details.

## Role-Based Access Summary

- **PUBLIC**: No authentication required
- **AUTHENTICATED**: Any authenticated user
- **provider**: Service providers
- **admin**: System administrators
- **supplier**: Suppliers
- **instructor**: Academy instructors
- **agency_admin**: Agency administrators
- **agency_owner**: Agency owners

## Notes

1. All authenticated endpoints require JWT token in Authorization header
2. Role-specific endpoints require both authentication and specific role
3. Some endpoints have rate limiting applied
4. File upload endpoints have size and type restrictions
5. See individual feature documentation for detailed request/response examples

