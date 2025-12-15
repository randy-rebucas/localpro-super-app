# Frontend Implementation Guide

## Overview

This guide provides comprehensive documentation for implementing the LocalPro Super App frontend. It covers all features, modules, API integrations, and admin functionality.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Integration](#api-integration)
4. [Feature Modules](#feature-modules)
5. [Admin Dashboard](#admin-dashboard)
6. [Best Practices](#best-practices)
7. [Error Handling](#error-handling)
8. [State Management](#state-management)

---

## Getting Started

### Base API URL

```
Production: https://api.localpro.com
Development: http://localhost:5000
```

### API Version

All endpoints use version `/api/v1` (or just `/api` for current version).

### Required Headers

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <JWT_TOKEN>', // Required for authenticated routes
  'X-Request-ID': '<unique-request-id>', // Optional but recommended
}
```

### Response Format

All API responses follow this structure:

```typescript
interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  code?: string;
  details?: any;
}
```

---

## Authentication & Authorization

### User Roles

| Role | Code | Description |
|------|------|-------------|
| Client | `client` | Regular users who book services |
| Provider | `provider` | Service providers |
| Supplier | `supplier` | Product suppliers |
| Instructor | `instructor` | Academy instructors |
| Agency Admin | `agency_admin` | Agency administrators |
| Agency Owner | `agency_owner` | Agency owners |
| Admin | `admin` | Platform administrators |
| Partner | `partner` | Business partners |

### Authentication Flow

1. **Send Verification Code**
   ```typescript
   POST /api/auth/send-code
   Body: { phoneNumber: string }
   ```

2. **Verify Code & Login**
   ```typescript
   POST /api/auth/verify-code
   Body: { phoneNumber: string, code: string }
   Response: { token, user, expiresIn }
   ```

3. **Store Token**
   - Store JWT token securely (AsyncStorage/Keychain)
   - Include in all authenticated requests

4. **Get Current User**
   ```typescript
   GET /api/auth/me
   Headers: { Authorization: 'Bearer <token>' }
   ```

### Authorization Checks

Always check user roles before showing/hiding features:

```typescript
const hasRole = (user: User, role: string): boolean => {
  return user.roles?.includes(role) || false;
};

const isAdmin = (user: User): boolean => {
  return hasRole(user, 'admin');
};
```

---

## API Integration

### HTTP Client Setup

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      clearStoredToken();
      redirectToLogin();
    }
    return Promise.reject(error.response?.data || error);
  }
);
```

### Pagination

All list endpoints support pagination:

```typescript
interface PaginationParams {
  page?: number;      // Default: 1
  limit?: number;     // Default: 10, Max: 100
  sort?: string;      // e.g., "createdAt:desc"
  search?: string;    // Search query
}
```

Example:
```typescript
GET /api/services?page=1&limit=20&sort=createdAt:desc&search=plumbing
```

### File Uploads

For file uploads, use `multipart/form-data`:

```typescript
const formData = new FormData();
formData.append('image', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg',
});

await apiClient.post('/api/services/images', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

---

## Feature Modules

### 1. Marketplace (Services)

**Base Path**: `/api/marketplace`

#### Key Endpoints

- `GET /services` - List all services (public)
- `GET /services/:id` - Get service details
- `GET /services/nearby` - Get nearby services
- `GET /services/categories` - Get service categories
- `POST /services` - Create service (provider/admin)
- `PUT /services/:id` - Update service (provider/admin)
- `DELETE /services/:id` - Delete service (provider/admin)

#### Implementation Example

```typescript
// Get services with filters
const getServices = async (filters: ServiceFilters) => {
  const params = new URLSearchParams({
    page: filters.page?.toString() || '1',
    limit: filters.limit?.toString() || '20',
    ...(filters.category && { category: filters.category }),
    ...(filters.search && { search: filters.search }),
    ...(filters.location && { 
      lat: filters.location.lat.toString(),
      lng: filters.location.lng.toString(),
      radius: filters.radius?.toString() || '10'
    }),
  });
  
  return apiClient.get(`/marketplace/services?${params}`);
};
```

See [Marketplace Implementation](./marketplace.md) for details.

---

### 2. Bookings

**Base Path**: `/api/marketplace`

#### Key Endpoints

- `POST /bookings` - Create booking
- `GET /my-bookings` - Get user bookings
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id/status` - Update booking status
- `POST /bookings/:id/reviews` - Add review

See [Bookings Implementation](./bookings.md) for details.

---

### 3. Academy & Courses

**Base Path**: `/api/academy`

#### Key Endpoints

- `GET /courses` - List courses
- `GET /courses/:id` - Get course details
- `POST /courses/:id/enroll` - Enroll in course
- `GET /my-courses` - Get enrolled courses
- `GET /courses/:id/progress` - Get course progress

See [Academy Implementation](./academy.md) for details.

---

### 4. Supplies (E-Commerce)

**Base Path**: `/api/supplies`

#### Key Endpoints

- `GET /products` - List products
- `GET /products/:id` - Get product details
- `POST /orders` - Create order
- `GET /my-orders` - Get user orders
- `GET /orders/:id` - Get order details

See [Supplies Implementation](./supplies.md) for details.

---

### 5. Rentals

**Base Path**: `/api/rentals`

#### Key Endpoints

- `GET /items` - List rental items
- `GET /items/:id` - Get item details
- `POST /bookings` - Create rental booking
- `GET /my-bookings` - Get rental bookings

See [Rentals Implementation](./rentals.md) for details.

---

### 6. Jobs (Job Board)

**Base Path**: `/api/jobs`

#### Key Endpoints

- `GET /jobs` - List job postings
- `GET /jobs/:id` - Get job details
- `POST /jobs/:id/apply` - Apply for job
- `GET /my-applications` - Get user applications

See [Jobs Implementation](./jobs.md) for details.

---

### 7. Finance & Wallet

**Base Path**: `/api/finance`

#### Key Endpoints

- `GET /wallet` - Get wallet balance
- `POST /wallet/top-up` - Top up wallet
- `POST /wallet/withdraw` - Request withdrawal
- `GET /transactions` - Get transaction history

See [Finance Implementation](./finance.md) for details.

---

### 8. LocalPro Plus (Subscriptions)

**Base Path**: `/api/localpro-plus`

#### Key Endpoints

- `GET /subscriptions` - Get subscriptions
- `POST /subscribe` - Subscribe to plan
- `PUT /cancel` - Cancel subscription
- `GET /benefits` - Get subscription benefits

See [Subscriptions Implementation](./subscriptions.md) for details.

---

### 9. Communication & Messaging

**Base Path**: `/api/communication`

#### Key Endpoints

- `GET /conversations` - Get conversations
- `GET /conversations/:id/messages` - Get messages
- `POST /conversations/:id/messages` - Send message
- `POST /conversations` - Create conversation

See [Communication Implementation](./communication.md) for details.

---

### 10. Trust Verification

**Base Path**: `/api/trust-verification`

#### Key Endpoints

- `GET /status` - Get verification status
- `POST /request` - Request verification
- `POST /documents` - Upload verification documents

See [Trust Verification Implementation](./trust-verification.md) for details.

---

### 11. Referrals

**Base Path**: `/api/referrals`

#### Key Endpoints

- `GET /code` - Get referral code
- `GET /stats` - Get referral statistics
- `GET /history` - Get referral history

See [Referrals Implementation](./referrals.md) for details.

---

### 12. Agencies

**Base Path**: `/api/agencies`

#### Key Endpoints

- `GET /agencies` - List agencies
- `GET /agencies/:id` - Get agency details
- `POST /agencies` - Create agency (agency_owner)
- `PUT /agencies/:id` - Update agency

See [Agencies Implementation](./agencies.md) for details.

---

### 13. Facility Care

**Base Path**: `/api/facility-care`

#### Key Endpoints

- `GET /facilities` - List facilities
- `POST /facilities` - Create facility
- `POST /work-orders` - Create work order
- `GET /work-orders` - Get work orders

See [Facility Care Implementation](./facility-care.md) for details.

---

### 14. Ads (Advertising)

**Base Path**: `/api/ads`

#### Key Endpoints

- `GET /ads` - List ads
- `POST /ads` - Create ad
- `GET /my-ads` - Get user ads
- `PUT /ads/:id` - Update ad

See [Ads Implementation](./ads.md) for details.

---

### 15. Announcements

**Base Path**: `/api/announcements`

#### Key Endpoints

- `GET /announcements` - List announcements
- `GET /announcements/:id` - Get announcement details
- `POST /announcements` - Create announcement (admin)

See [Announcements Implementation](./announcements.md) for details.

---

### 16. Activity Feed

**Base Path**: `/api/activities`

#### Key Endpoints

- `GET /activities` - Get activity feed
- `POST /activities` - Create activity
- `GET /activities/:id` - Get activity details

See [Activity Feed Implementation](./activity-feed.md) for details.

---

### 17. Search

**Base Path**: `/api/search`

#### Key Endpoints

- `GET /global` - Global search across all entities
- `GET /services` - Search services
- `GET /users` - Search users
- `GET /products` - Search products

See [Search Implementation](./search.md) for details.

---

### 18. Analytics

**Base Path**: `/api/analytics`

#### Key Endpoints

- `GET /dashboard` - Get analytics dashboard
- `GET /revenue` - Get revenue analytics
- `GET /users` - Get user analytics
- `GET /services` - Get service analytics

See [Analytics Implementation](./analytics.md) for details.

---

### 19. Notifications

**Base Path**: `/api/notifications`

#### Key Endpoints

- `GET /notifications` - Get notifications
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read
- `GET /settings` - Get notification settings
- `PUT /settings` - Update notification settings

See [Notifications Implementation](./notifications.md) for details.

---

### 20. Settings

**Base Path**: `/api/settings`

#### Key Endpoints

- `GET /app/public` - Get public app settings
- `GET /user` - Get user settings
- `PUT /user` - Update user settings
- `GET /app` - Get app settings (admin)
- `PUT /app` - Update app settings (admin)

See [Settings Implementation](./settings.md) for details.

---

## Admin Dashboard

The admin dashboard provides comprehensive management tools for all platform features.

### Admin Routes Overview

All admin routes require:
- **Authentication**: Valid JWT token
- **Authorization**: `admin` role

See [Admin Routes Documentation](./admin-routes.md) for complete details.

### Quick Access

- **User Management**: `/api/users`
- **Content Moderation**: Feature-specific admin endpoints
- **Financial Management**: `/api/finance` (admin endpoints)
- **System Settings**: `/api/settings/app`
- **Analytics**: `/api/analytics`
- **Audit Logs**: `/api/audit-logs`
- **Error Monitoring**: `/api/error-monitoring`

---

## Best Practices

### 1. Error Handling

```typescript
try {
  const response = await apiClient.get('/api/services');
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    switch (status) {
      case 400:
        // Bad request
        break;
      case 401:
        // Unauthorized - redirect to login
        break;
      case 403:
        // Forbidden - show access denied
        break;
      case 404:
        // Not found
        break;
      case 500:
        // Server error
        break;
    }
  } else if (error.request) {
    // Request made but no response
    // Network error
  }
}
```

### 2. Loading States

Always show loading indicators for async operations:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await apiClient.get('/api/services');
    // Handle data
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Caching

Implement caching for frequently accessed data:

```typescript
// Use React Query, SWR, or similar
import { useQuery } from 'react-query';

const { data, isLoading, error } = useQuery(
  'services',
  () => apiClient.get('/api/services'),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);
```

### 4. Optimistic Updates

For better UX, update UI optimistically:

```typescript
const updateService = async (id, updates) => {
  // Optimistically update UI
  const previousData = queryClient.getQueryData('services');
  queryClient.setQueryData('services', (old) => 
    old.map(service => 
      service.id === id ? { ...service, ...updates } : service
    )
  );
  
  try {
    await apiClient.put(`/api/services/${id}`, updates);
  } catch (error) {
    // Revert on error
    queryClient.setQueryData('services', previousData);
    throw error;
  }
};
```

---

## State Management

### Recommended Approach

Use a combination of:
- **React Query / SWR**: For server state
- **Context API / Redux**: For client state
- **Local Storage**: For persistence

### Example Structure

```typescript
// Store structure
{
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  },
  services: {
    list: Service[];
    selected: Service | null;
    filters: ServiceFilters;
  },
  bookings: {
    list: Booking[];
    active: Booking[];
  },
  // ... other features
}
```

---

## Next Steps

1. Review [Admin Routes Documentation](./admin-routes.md) for admin functionality
2. Review individual feature implementation guides
3. Set up your development environment
4. Implement authentication flow
5. Start with core features (Marketplace, Bookings)
6. Add admin dashboard functionality

---

## Additional Resources

- [API Reference](../api/endpoints.md)
- [Error Codes Reference](../reference/error-codes.md)
- [Environment Variables Reference](../reference/environment-variables.md)
- [Postman Collection](../../../LocalPro-Super-App-API.postman_collection.json)

