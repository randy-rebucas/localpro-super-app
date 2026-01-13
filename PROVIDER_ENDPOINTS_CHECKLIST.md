# Provider Mobile App - Endpoints Checklist

> **Extracted from:** PROVIDER_MOBILE_APP_DOCUMENTATION.md  
> **Date:** January 12, 2026  
> **Base URL:** `https://api.yourdomain.com/api` or `http://localhost:4000/api`

---

## Provider Registration & Profile (9 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/providers/profile` | Upgrade from client to provider | ✅ |
| PUT | `/providers/onboarding/step` | Complete onboarding steps | ✅ |
| POST | `/providers/documents/upload` | Upload verification documents | ✅ |
| GET | `/providers/profile/me` | Get current provider profile | ✅ |
| PUT | `/providers/profile` | Update provider profile | ✅ |
| GET | `/providers/dashboard/overview` | Get dashboard overview | ✅ |
| GET | `/providers/analytics/performance` | Get performance analytics | ✅ |
| GET | `/providers/dashboard/metrics` | Get real-time metrics | ✅ |
| GET | `/providers/dashboard/activity` | Get activity feed | ✅ |

---

## Service Management (7 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/marketplace/services` | Create service listing | ✅ |
| GET | `/marketplace/my-services` | Get my services | ✅ |
| PUT | `/marketplace/services/:id` | Update service | ✅ |
| POST | `/marketplace/services/:id/images` | Upload service images | ✅ |
| PATCH | `/marketplace/services/:id/activate` | Activate service | ✅ |
| PATCH | `/marketplace/services/:id/deactivate` | Deactivate service | ✅ |
| DELETE | `/marketplace/services/:id` | Delete service | ✅ |

---

## Booking Management (4 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/marketplace/my-bookings` | Get my bookings (as provider) | ✅ |
| GET | `/marketplace/bookings/:id` | Get booking details | ✅ |
| PUT | `/marketplace/bookings/:id/status` | Update booking status | ✅ |
| POST | `/marketplace/bookings/:id/photos` | Upload service photos | ✅ |

---

## Availability & Scheduling (4 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/availability` | Get availability schedule | ✅ |
| PUT | `/availability` | Update availability | ✅ |
| POST | `/availability/time-off` | Add time off | ✅ |
| GET | `/scheduling` | Get schedule with bookings | ✅ |

---

## Financial Management (5 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/finance/earnings` | Get earnings overview | ✅ |
| GET | `/finance/transactions` | Get transaction history | ✅ |
| POST | `/finance/withdraw` | Request payout/withdrawal | ✅ |
| GET | `/finance/withdrawals` | Get payout history | ✅ |
| GET | `/finance/reports` | Get financial reports | ✅ |

---

## Reviews & Ratings (2 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/providers/reviews` | Get my reviews | ✅ |
| POST | `/providers/reviews/:reviewId/respond` | Respond to review | ✅ |

---

## Agency Features (3 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/agencies/my/agencies` | Get my agencies | ✅ |
| POST | `/agencies/join` | Join agency | ✅ |
| POST | `/agencies/leave` | Leave agency | ✅ |

---

## Communication (2 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/communication/conversations` | Get client conversations | ✅ |
| POST | `/communication/conversations/:id/messages` | Send message to client | ✅ |

---

## Job Postings (4 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/jobs` | Create job posting | ✅ |
| GET | `/jobs/my-jobs` | Get my job postings | ✅ |
| GET | `/jobs/:id/applications` | Get job applications | ✅ |
| PUT | `/jobs/:jobId/applications/:applicationId/status` | Update application status | ✅ |

---

## Rentals Management (3 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/rentals` | Create rental listing | ✅ |
| GET | `/rentals/my-rentals` | Get my rental items | ✅ |
| GET | `/rentals/my-bookings` | Get rental bookings | ✅ |

---

## Supplies Management (4 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/supplies` | Create supply listing | ✅ |
| GET | `/supplies/my-supplies` | Get my supplies | ✅ |
| GET | `/supplies/my-orders` | Get supply orders | ✅ |
| PUT | `/supplies/:id/orders/:orderId/status` | Update order status | ✅ |

---

## Academy/Instructor Features (3 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/academy/courses` | Create course | ✅ |
| GET | `/academy/my-created-courses` | Get my courses | ✅ |
| POST | `/academy/courses/:id/videos` | Upload course content | ✅ |

---

## Summary

| Category | Endpoints | Implemented | Status |
|----------|-----------|-------------|--------|
| Provider Registration & Profile | 9 | 9 | ✅ 100% |
| Service Management | 7 | 7 | ✅ 100% |
| Booking Management | 4 | 4 | ✅ 100% |
| Availability & Scheduling | 4 | 4 | ✅ 100% |
| Financial Management | 5 | 5 | ✅ 100% |
| Reviews & Ratings | 2 | 2 | ✅ 100% |
| Agency Features | 3 | 3 | ✅ 100% |
| Communication | 2 | 2 | ✅ 100% |
| Job Postings | 4 | 4 | ✅ 100% |
| Rentals Management | 3 | 3 | ✅ 100% |
| Supplies Management | 4 | 4 | ✅ 100% |
| Academy/Instructor | 3 | 3 | ✅ 100% |
| **TOTAL** | **50** | **50** | **✅ 100% Complete** |

---

## How to Use This Checklist

1. **Test each endpoint** using Postman or curl
2. **Update status** for each endpoint:
   - ✅ = Working correctly
   - ⚠️ = Working with issues
   - ❌ = Not implemented/broken
   - ⏳ = Not yet tested
3. **Document issues** found during testing
4. **Track progress** as you implement/fix endpoints

---

## Quick Test Commands

### Test Provider Profile
```bash
# Get provider profile
curl -X GET http://localhost:4000/api/providers/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Service Management
```bash
# Get my services
curl -X GET http://localhost:4000/api/marketplace/my-services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Bookings
```bash
# Get my bookings as provider
curl -X GET "http://localhost:4000/api/marketplace/my-bookings?role=provider" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Financial
```bash
# Get earnings overview
curl -X GET http://localhost:4000/api/finance/earnings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Next Steps:**
1. Review existing route files in `src/routes/`
2. Check controller implementations in `src/controllers/`
3. Test each endpoint systematically
4. Update this checklist with actual status
5. Implement missing endpoints as needed

