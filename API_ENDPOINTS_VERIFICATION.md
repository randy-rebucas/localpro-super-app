# API Endpoints Server Verification Guide

This document provides a quick reference for verifying all API endpoints are implemented on the server.

## Quick Stats

- **Total Endpoints:** 95
- **Public Endpoints (No Auth):** ~35
- **Protected Endpoints (Auth Required):** ~60

## Endpoint Verification by Service

### 1. Authentication Service (10 endpoints)

**Base Path:** `/api/auth`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | POST | `/auth/register` | ❌ | ❌ |
| 2 | POST | `/auth/verify-email-otp` | ❌ | ❌ |
| 3 | POST | `/auth/login` | ❌ | ❌ |
| 4 | POST | `/auth/send-code` | ❌ | ❌ |
| 5 | POST | `/auth/verify-code` | ❌ | ❌ |
| 6 | GET | `/auth/me` | ✅ | ❌ |
| 7 | PUT | `/auth/profile` | ✅ | ❌ |
| 8 | POST | `/auth/avatar` | ✅ | ❌ |
| 9 | POST | `/auth/refresh` | ❌ | ❌ |
| 10 | POST | `/auth/logout` | ✅ | ⬜ |

---

### 2. Marketplace Service (9 endpoints)

**Base Path:** `/api/marketplace`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/marketplace/services` | ❌ | ❌ |
| 2 | GET | `/marketplace/services/categories` | ❌ | ❌ |
| 3 | GET | `/marketplace/services/nearby` | ❌ | ❌ |
| 4 | GET | `/marketplace/services/:id` | ❌ | ❌ |
| 5 | POST | `/marketplace/bookings` | ✅ | ❌ |
| 6 | GET | `/marketplace/my-bookings` | ✅ | ❌ |
| 7 | GET | `/marketplace/bookings/:id` | ✅ | ❌ |
| 8 | PUT | `/marketplace/bookings/:id/status` | ✅ | ❌ |
| 9 | POST | `/marketplace/bookings/:id/review` | ✅ | ❌ |

---

### 3. Jobs Service (7 endpoints)

**Base Path:** `/api/jobs`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/jobs` | ❌ | ❌ |
| 2 | GET | `/jobs/search` | ❌ | ❌ |
| 3 | GET | `/jobs/:id` | ❌ | ❌ |
| 4 | GET | `/jobs/categories` | ❌ | ❌ |
| 5 | POST | `/jobs/:id/apply` | ✅ | ❌ |
| 6 | GET | `/jobs/my-applications` | ✅ | ❌ |
| 7 | DELETE | `/jobs/:id/applications/:applicationId` | ✅ | ❌ |

---

### 4. Messaging Service (9 endpoints)

**Base Path:** `/api/communication`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/communication/conversations` | ✅ | ❌ |
| 2 | GET | `/communication/conversations/:id` | ✅ | ❌ |
| 3 | POST | `/communication/conversations` | ✅ | ❌ |
| 4 | GET | `/communication/conversations/:id/messages` | ✅ | ❌ |
| 5 | POST | `/communication/conversations/:id/messages` | ✅ | ❌ |
| 6 | PUT | `/communication/conversations/:id/read` | ✅ | ❌ |
| 7 | GET | `/communication/unread-count` | ✅ | ❌ |
| 8 | GET | `/communication/search` | ✅ | ❌ |
| 9 | DELETE | `/communication/conversations/:id` | ✅ | ❌ |

---

### 5. Favorites Service (6 endpoints)

**Base Path:** `/api/favorites`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | POST | `/favorites` | ✅ | ❌ |
| 2 | GET | `/favorites` | ✅ | ❌ |
| 3 | GET | `/favorites/type/:itemType` | ✅ | ❌ |
| 4 | GET | `/favorites/check/:itemType/:itemId` | ✅ | ❌ |
| 5 | DELETE | `/favorites/:itemType/:itemId` | ✅ | ❌ |
| 6 | GET | `/favorites/stats` | ✅ | ❌ |

**Item Types:** `service`, `job`, `rental`, `supply`, `course`, `provider`

---

### 6. Notifications Service (5 endpoints)

**Base Path:** `/api/communication`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/communication/notifications` | ✅ | ❌ |
| 2 | GET | `/communication/notifications/count` | ✅ | ❌ |
| 3 | PUT | `/communication/notifications/:id/read` | ✅ | ❌ |
| 4 | PUT | `/communication/notifications/read-all` | ✅ | ❌ |
| 5 | DELETE | `/communication/notifications/:id` | ✅ | ❌ |

---

### 7. Rentals Service (7 endpoints)

**Base Path:** `/api/rentals`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/rentals` | ❌ | ❌ |
| 2 | GET | `/rentals/:id` | ❌ | ❌ |
| 3 | GET | `/rentals/nearby` | ❌ | ❌ |
| 4 | POST | `/rentals/:id/book` | ✅ | ❌ |
| 5 | GET | `/rentals/my-bookings` | ✅ | ❌ |
| 6 | POST | `/rentals/:id/reviews` | ✅ | ❌ |
| 7 | GET | `/rentals/categories` | ❌ | ❌ |

---

### 8. Supplies Service (7 endpoints)

**Base Path:** `/api/supplies`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/supplies` | ❌ | ❌ |
| 2 | GET | `/supplies/:id` | ❌ | ❌ |
| 3 | GET | `/supplies/nearby` | ❌ | ❌ |
| 4 | POST | `/supplies/:id/order` | ✅ | ❌ |
| 5 | GET | `/supplies/my-orders` | ✅ | ❌ |
| 6 | POST | `/supplies/:id/reviews` | ✅ | ❌ |
| 7 | GET | `/supplies/categories` | ❌ | ❌ |

---

### 9. Academy Service (7 endpoints)

**Base Path:** `/api/academy`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/academy/courses` | ❌ | ❌ |
| 2 | GET | `/academy/courses/:id` | ❌ | ❌ |
| 3 | POST | `/academy/courses/:id/enroll` | ✅ | ❌ |
| 4 | PUT | `/academy/courses/:id/progress` | ✅ | ❌ |
| 5 | GET | `/academy/my-courses` | ✅ | ❌ |
| 6 | POST | `/academy/courses/:id/reviews` | ✅ | ❌ |
| 7 | GET | `/academy/categories` | ❌ | ❌ |

---

### 10. Referral Service (6 endpoints)

**Base Path:** `/api/referrals`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/referrals/me` | ✅ | ❌ |
| 2 | GET | `/referrals/stats` | ✅ | ❌ |
| 3 | GET | `/referrals/links` | ✅ | ❌ |
| 4 | POST | `/referrals/invite` | ✅ | ❌ |
| 5 | GET | `/referrals/rewards` | ✅ | ❌ |
| 6 | GET | `/referrals/leaderboard` | ✅ | ❌ |

---

### 11. Finance Service (5 endpoints)

**Base Path:** `/api/finance`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/finance/overview` | ✅ | ❌ |
| 2 | GET | `/finance/transactions` | ✅ | ❌ |
| 3 | POST | `/finance/withdraw` | ✅ | ❌ |
| 4 | GET | `/finance/reports` | ✅ | ❌ |
| 5 | GET | `/finance/withdrawals` | ✅ | ❌ |

---

### 12. Subscription Service (5 endpoints)

**Base Path:** `/api/localpro-plus`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/localpro-plus/plans` | ❌ | ❌ |
| 2 | POST | `/localpro-plus/subscribe/:planId` | ✅ | ❌ |
| 3 | GET | `/localpro-plus/my-subscription` | ✅ | ❌ |
| 4 | POST | `/localpro-plus/cancel` | ✅ | ❌ |
| 5 | GET | `/localpro-plus/usage` | ✅ | ❌ |

---

### 13. Settings Service (7 endpoints)

**Base Path:** `/api/settings`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/settings/user` | ✅ | ❌ |
| 2 | PUT | `/settings/user` | ✅ | ❌ |
| 3 | PUT | `/settings/user/privacy` | ✅ | ❌ |
| 4 | PUT | `/settings/user/notifications` | ✅ | ❌ |
| 5 | PUT | `/settings/user/communication` | ✅ | ❌ |
| 6 | PUT | `/settings/user/app` | ✅ | ❌ |
| 7 | PUT | `/settings/user/:category` | ✅ | ❌ |

---

### 14. Search Service (4 endpoints)

**Base Path:** `/api/search`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/search` | ❌ | ❌ |
| 2 | GET | `/search/suggestions` | ❌ | ❌ |
| 3 | GET | `/search/popular` | ❌ | ❌ |
| 4 | GET | `/search/categories` | ❌ | ❌ |

---

### 15. Webhook Service (1 endpoint)

**Base Path:** `/api/webhooks`

| # | Method | Endpoint | Auth | Status |
|---|--------|----------|------|--------|
| 1 | GET | `/webhooks/events` | ✅ | ❌ |

---

## Testing Instructions

### For Each Endpoint:

1. **Check if endpoint exists** - Verify route is registered
2. **Test request format** - Ensure request body/params match expected format
3. **Test response format** - Verify response follows standard format:
   ```json
   {
     "success": boolean,
     "message": string,
     "data": object
   }
   ```
4. **Test authentication** - For protected endpoints, verify:
   - Returns 401 without token
   - Works with valid token
   - Handles token refresh correctly
5. **Test error handling** - Verify proper error responses for:
   - Invalid input
   - Missing required fields
   - Unauthorized access
   - Resource not found

### Priority Testing Order:

1. **Critical Path (Must Work):**
   - Authentication endpoints (login, register, refresh)
   - Marketplace services (browse, book)
   - Jobs (browse, apply)

2. **High Priority:**
   - Messaging (conversations, messages)
   - Notifications
   - Favorites

3. **Medium Priority:**
   - Rentals
   - Supplies
   - Academy

4. **Lower Priority:**
   - Referral
   - Finance
   - Subscription
   - Settings
   - Search
   - Webhooks

---

## Common Issues to Check

### 1. Response Format Consistency
- All endpoints should return `{ success, message, data }` format
- Pagination should be consistent across list endpoints

### 2. Authentication
- Token validation on protected routes
- Token refresh mechanism
- Proper 401 responses

### 3. File Uploads
- Multipart/form-data handling for:
  - Avatar uploads
  - Resume uploads
  - Review photos
  - Message attachments

### 4. Pagination
- Consistent pagination structure
- Proper page/limit handling
- hasNext/hasPrev flags

### 5. Error Handling
- Standard error response format
- Proper HTTP status codes
- Meaningful error messages

---

## Verification Checklist

Use this checklist to track verification progress:

```
Authentication:        [ ] 0/10
Marketplace:           [ ] 0/9
Jobs:                  [ ] 0/7
Messaging:             [ ] 0/9
Favorites:             [ ] 0/6
Notifications:         [ ] 0/5
Rentals:               [ ] 0/7
Supplies:              [ ] 0/7
Academy:               [ ] 0/7
Referral:              [ ] 0/6
Finance:               [ ] 0/5
Subscription:          [ ] 0/5
Settings:              [ ] 0/7
Search:                [ ] 0/4
Webhook:               [ ] 0/1
─────────────────────────────
Total:                 [ ] 0/95
```

---

## Notes

- Mark endpoints as ✅ (implemented) or ❌ (not implemented) in the Status column
- Update this document as endpoints are verified
- Document any deviations from expected behavior
- Note any missing endpoints that need to be implemented

---

**Last Updated:** January 7, 2026
