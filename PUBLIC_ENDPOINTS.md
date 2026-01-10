# Public Endpoints - Complete List

This document lists all public endpoints that do not require authentication.

**Total Public Endpoints:** ~50+

---

## 1. Authentication Service (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-code` | Send verification code (SMS/Phone) |
| POST | `/api/auth/verify-code` | Verify code and login/register |
| POST | `/api/auth/register-email` | Register with email |
| POST | `/api/auth/login-email` | Login with email |
| POST | `/api/auth/verify-email-otp` | Verify email OTP |
| POST | `/api/auth/check-email` | Check if email exists |
| POST | `/api/auth/set-password` | Set password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/register` | Register (alias for register-email) |
| POST | `/api/auth/login` | Login (alias for login-email) |

---

## 2. Marketplace Service (`/api/marketplace`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/services` | Get all services (with pagination, filters) |
| GET | `/api/marketplace/services/categories` | Get service categories |
| GET | `/api/marketplace/services/categories/:category` | Get category details |
| GET | `/api/marketplace/services/nearby` | Get nearby services |
| GET | `/api/marketplace/services/:id` | Get single service by ID |
| GET | `/api/marketplace/services/:id/providers` | Get providers for a service |
| GET | `/api/marketplace/providers/:providerId/services` | Get services by provider |
| GET | `/api/marketplace/providers/:id` | Get provider details |

---

## 3. Jobs Service (`/api/jobs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Get all jobs (with pagination, filters) |
| GET | `/api/jobs/search` | Search jobs |
| GET | `/api/jobs/:id` | Get single job by ID |
| GET | `/api/jobs/categories` | Get job categories |

---

## 4. Rentals Service (`/api/rentals`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rentals` | Get all rental items |
| GET | `/api/rentals/items` | Get all rental items (alias) |
| GET | `/api/rentals/items/:id` | Get rental item by ID (alias) |
| GET | `/api/rentals/:id` | Get rental item by ID |
| GET | `/api/rentals/categories` | Get rental categories |
| GET | `/api/rentals/featured` | Get featured rental items |
| GET | `/api/rentals/nearby` | Get nearby rental items |

---

## 5. Supplies Service (`/api/supplies`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/supplies` | Get all supplies/products |
| GET | `/api/supplies/products` | Get all supplies (alias) |
| GET | `/api/supplies/products/:id` | Get supply by ID (alias) |
| GET | `/api/supplies/:id` | Get supply by ID |
| GET | `/api/supplies/categories` | Get supply categories |
| GET | `/api/supplies/featured` | Get featured supplies |
| GET | `/api/supplies/nearby` | Get nearby supplies |

---

## 6. Academy Service (`/api/academy`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/academy/courses` | Get all courses |
| GET | `/api/academy/courses/:id` | Get course by ID |
| GET | `/api/academy/categories` | Get course categories |
| GET | `/api/academy/featured` | Get featured courses |
| GET | `/api/academy/certifications` | Get certifications list |

---

## 7. Search Service (`/api/search`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Global search across all entities |
| GET | `/api/search/suggestions` | Get search suggestions/autocomplete |
| GET | `/api/search/popular` | Get popular search terms |
| GET | `/api/search/advanced` | Advanced search with more filters |
| GET | `/api/search/entities/:type` | Search within specific entity type |
| GET | `/api/search/categories` | Get all available search categories |
| GET | `/api/search/locations` | Get popular search locations |
| GET | `/api/search/trending` | Get trending search terms |

---

## 8. Providers Service (`/api/providers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | Get all providers |
| GET | `/api/providers/skills` | Get provider skills |
| GET | `/api/providers/:id` | Get provider by ID |

---

## 9. LocalPro Plus Service (`/api/localpro-plus`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/localpro-plus/plans` | Get subscription plans |
| GET | `/api/localpro-plus/plans/:id` | Get subscription plan by ID |

---

## 10. Announcements Service (`/api/announcements`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | Get all announcements (with filtering) |
| GET | `/api/announcements/:id` | Get single announcement by ID |

---

## 11. Agencies Service (`/api/agencies`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agencies` | Get all agencies |
| GET | `/api/agencies/:id` | Get single agency by ID |

---

## 12. Maps Service (`/api/maps`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maps` | Get maps information |
| POST | `/api/maps/geocode` | Geocode address to coordinates |
| POST | `/api/maps/reverse-geocode` | Reverse geocode coordinates to address |
| GET | `/api/maps/address` | Get address from coordinates |
| POST | `/api/maps/places/search` | Search places |
| GET | `/api/maps/places/:placeId` | Get place details |
| POST | `/api/maps/distance` | Calculate distance |
| POST | `/api/maps/nearby` | Find nearby places |
| POST | `/api/maps/validate-service-area` | Validate service area |

---

## 13. Root & Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check endpoint |

---

## Notes

1. **Rate Limiting**: Some public endpoints may have rate limiting applied (e.g., `/api/auth/*`, `/api/search/*`)

2. **Query Parameters**: Most GET endpoints support pagination (`page`, `limit`) and filtering parameters

3. **Swagger Documentation**: All endpoints are documented in Swagger UI at `/api-docs`

4. **CORS**: Public endpoints are accessible from configured origins

5. **Security**: Even though these endpoints are public, they may still have:
   - Input validation
   - Rate limiting
   - Request size limits
   - CORS restrictions

---

**Last Updated:** January 8, 2026
