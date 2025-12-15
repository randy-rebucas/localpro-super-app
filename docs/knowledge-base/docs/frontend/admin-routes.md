# Admin Routes Documentation

## Overview

This document provides comprehensive documentation for all admin routes in the LocalPro Super App. Admin routes require authentication with a valid JWT token and the `admin` role.

## Authentication

All admin routes require:
- **Authentication**: Valid JWT token in `Authorization: Bearer <token>` header
- **Authorization**: User must have `admin` role

```typescript
const headers = {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
};
```

---

## Table of Contents

1. [User Management](#user-management)
2. [Content Moderation](#content-moderation)
3. [Financial Management](#financial-management)
4. [Analytics & Reporting](#analytics--reporting)
5. [System Settings](#system-settings)
6. [Marketplace Management](#marketplace-management)
7. [Academy Management](#academy-management)
8. [Supplies Management](#supplies-management)
9. [Rentals Management](#rentals-management)
10. [Jobs Management](#jobs-management)
11. [Agencies Management](#agencies-management)
12. [Ads Management](#ads-management)
13. [Providers Management](#providers-management)
14. [Escrow Management](#escrow-management)
15. [Notifications Management](#notifications-management)
16. [Email Marketing](#email-marketing)
17. [Live Chat Management](#live-chat-management)
18. [Database & Monitoring](#database--monitoring)
19. [Audit Logs](#audit-logs)
20. [Error Monitoring](#error-monitoring)
21. [Partners Management](#partners-management)
22. [Scheduled Jobs](#scheduled-jobs)

---

## User Management

**Base Path**: `/api/users`

### Get All Users

```typescript
GET /api/users
Query Parameters:
  - page?: number (default: 1)
  - limit?: number (default: 10, max: 100)
  - role?: string (client, provider, supplier, instructor, admin)
  - status?: string (active, inactive, suspended, pending)
  - isVerified?: boolean
  - search?: string
  - sort?: string (e.g., "createdAt:desc")
```

**Response**:
```typescript
{
  success: true,
  data: {
    users: User[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

### Get User Statistics

```typescript
GET /api/users/stats
```

**Response**:
```typescript
{
  success: true,
  data: {
    total: number,
    byRole: { [role: string]: number },
    byStatus: { [status: string]: number },
    verified: number,
    unverified: number,
    recent: number // Last 30 days
  }
}
```

### Get User by ID

```typescript
GET /api/users/:id
```

### Create User

```typescript
POST /api/users
Body: {
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive?: boolean;
}
```

### Update User

```typescript
PUT /api/users/:id
Body: {
  // Any user fields to update
}
```

### Update User Status

```typescript
PATCH /api/users/:id/status
Body: {
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  reason?: string;
}
```

### Update User Verification

```typescript
PATCH /api/users/:id/verification
Body: {
  isVerified: boolean;
  verificationLevel?: 'basic' | 'standard' | 'premium';
  notes?: string;
}
```

### Add Badge to User

```typescript
POST /api/users/:id/badges
Body: {
  badge: string;
  reason?: string;
}
```

### Bulk Update Users

```typescript
PATCH /api/users/bulk
Body: {
  userIds: string[];
  updates: {
    status?: string;
    isVerified?: boolean;
    roles?: string[];
  };
}
```

### Delete User (Soft Delete)

```typescript
DELETE /api/users/:id
```

### Restore User

```typescript
PATCH /api/users/:id/restore
```

---

## Content Moderation

### Marketplace Services

**Base Path**: `/api/marketplace`

#### Manage Service Categories

```typescript
// List all categories (admin view)
GET /api/marketplace/services/categories/manage

// Create category
POST /api/marketplace/services/categories
Body: {
  name: string;
  description?: string;
  icon?: string;
  parentCategory?: string;
}

// Update category
PUT /api/marketplace/services/categories/:id
Body: {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

// Delete category
DELETE /api/marketplace/services/categories/:id
```

#### Manage Services

```typescript
// Deactivate service
PATCH /api/marketplace/services/:id/deactivate

// Activate service
PATCH /api/marketplace/services/:id/activate

// Delete service
DELETE /api/marketplace/services/:id
```

---

### Ads Moderation

**Base Path**: `/api/ads`

#### Get Pending Ads

```typescript
GET /api/ads/pending
Query Parameters:
  - page?: number
  - limit?: number
```

#### Approve Ad

```typescript
PUT /api/ads/:id/approve
Body: {
  notes?: string;
}
```

#### Reject Ad

```typescript
PUT /api/ads/:id/reject
Body: {
  reason: string;
  notes?: string;
}
```

#### Get Ad Statistics

```typescript
GET /api/ads/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

---

## Financial Management

**Base Path**: `/api/finance`

### Process Withdrawal Request

```typescript
PUT /api/finance/withdrawals/:withdrawalId/process
Body: {
  action: 'approve' | 'reject';
  adminNotes?: string;
  transactionId?: string; // For approved withdrawals
}
```

**Response**:
```typescript
{
  success: true,
  message: string,
  data: {
    withdrawal: Withdrawal;
    user: User;
  }
}
```

### Get All Top-Up Requests

```typescript
GET /api/finance/top-ups
Query Parameters:
  - status?: 'pending' | 'approved' | 'rejected'
  - page?: number
  - limit?: number
```

### Process Top-Up Request

```typescript
PUT /api/finance/top-ups/:topUpId/process
Body: {
  action: 'approve' | 'reject';
  adminNotes?: string;
}
```

---

## Analytics & Reporting

**Base Path**: `/api/analytics`

### Dashboard Analytics

```typescript
GET /api/analytics/dashboard
Query Parameters:
  - timeframe?: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
```

**Response**:
```typescript
{
  success: true,
  data: {
    overview: {
      totalUsers: number;
      activeUsers: number;
      totalBookings: number;
      totalRevenue: number;
      totalServices: number;
    };
    trends: {
      users: TrendData[];
      bookings: TrendData[];
      revenue: TrendData[];
    };
    topPerformers: {
      services: Service[];
      providers: Provider[];
    };
  }
}
```

### Real-Time Metrics

```typescript
GET /api/analytics/realtime
```

### Time Series Data

```typescript
GET /api/analytics/time-series
Query Parameters:
  - metric: 'users' | 'bookings' | 'revenue' | 'services' | 'jobs'
  - timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
  - granularity: 'hourly' | 'daily' | 'weekly' | 'monthly'
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Comparison Analytics

```typescript
GET /api/analytics/comparison
Query Parameters:
  - timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
```

### Export Analytics

```typescript
GET /api/analytics/export
Query Parameters:
  - type: 'overview' | 'users' | 'revenue' | 'bookings'
  - timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
  - format: 'json' | 'csv'
```

### User Analytics

```typescript
GET /api/analytics/users
Query Parameters:
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Financial Analytics

```typescript
GET /api/analytics/financial
Query Parameters:
  - timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
```

### Marketplace Analytics

```typescript
GET /api/analytics/marketplace
Query Parameters:
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Job Analytics

```typescript
GET /api/analytics/jobs
Query Parameters:
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Referral Analytics

```typescript
GET /api/analytics/referrals
Query Parameters:
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Agency Analytics

```typescript
GET /api/analytics/agencies
Query Parameters:
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Custom Analytics

```typescript
GET /api/analytics/custom
Query Parameters:
  - eventType?: string
  - module?: string
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Provider Analytics

```typescript
GET /api/analytics/provider/:providerId
Query Parameters:
  - timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
```

---

## System Settings

**Base Path**: `/api/settings`

### Get App Settings

```typescript
GET /api/settings/app
```

**Response**:
```typescript
{
  success: true,
  data: {
    general: {
      appName: string;
      appVersion: string;
      maintenanceMode: boolean;
    };
    business: {
      companyName: string;
      supportEmail: string;
      supportPhone: string;
    };
    features: {
      marketplace: { enabled: boolean };
      academy: { enabled: boolean };
      // ... other features
    };
    payments: {
      defaultCurrency: string;
      supportedCurrencies: string[];
    };
    // ... other settings
  }
}
```

### Update App Settings

```typescript
PUT /api/settings/app
Body: {
  general?: {
    appName?: string;
    maintenanceMode?: boolean;
  };
  business?: {
    companyName?: string;
    supportEmail?: string;
  };
  features?: {
    [featureName]: { enabled: boolean };
  };
  // ... other settings
}
```

### Update Settings Category

```typescript
PUT /api/settings/app/:category
Body: {
  // Category-specific settings
}
```

**Categories**: `general`, `business`, `features`, `uploads`, `payments`, `security`, `notifications`, `integrations`, `analytics`

### Toggle Feature Flag

```typescript
POST /api/settings/app/features/toggle
Body: {
  feature: string; // e.g., 'marketplace', 'academy'
  enabled: boolean;
}
```

### Get App Health

```typescript
GET /api/settings/app/health
```

---

## Marketplace Management

**Base Path**: `/api/marketplace`

### Service Category Management

See [Content Moderation - Marketplace Services](#marketplace-services)

### Service Statistics

```typescript
GET /api/marketplace/services/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

---

## Academy Management

**Base Path**: `/api/academy`

### Get Course Statistics

```typescript
GET /api/academy/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

### Category Management

```typescript
// Create category
POST /api/academy/categories
Body: {
  name: string;
  description?: string;
  icon?: string;
}

// Update category
PUT /api/academy/categories/:id
Body: {
  name?: string;
  description?: string;
  icon?: string;
}

// Delete category
DELETE /api/academy/categories/:id
```

### Certification Management

```typescript
// Create certification
POST /api/academy/certifications
Body: {
  name: string;
  description?: string;
  requirements?: string[];
}

// Update certification
PUT /api/academy/certifications/:id

// Delete certification
DELETE /api/academy/certifications/:id
```

### Enrollment Management

```typescript
// List all enrollments
GET /api/academy/enrollments
Query Parameters:
  - courseId?: string
  - status?: string
  - page?: number
  - limit?: number

// Update enrollment status
PUT /api/academy/enrollments/:id/status
Body: {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

// Delete enrollment
DELETE /api/academy/enrollments/:id
```

---

## Supplies Management

**Base Path**: `/api/supplies`

### Get Supply Statistics

```typescript
GET /api/supplies/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

---

## Rentals Management

**Base Path**: `/api/rentals`

### Get Rental Statistics

```typescript
GET /api/rentals/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

---

## Jobs Management

**Base Path**: `/api/jobs`

### Job Moderation

```typescript
// Approve job
PUT /api/jobs/:id/approve
Body: {
  notes?: string;
}

// Reject job
PUT /api/jobs/:id/reject
Body: {
  reason: string;
  notes?: string;
}

// Get pending jobs
GET /api/jobs/pending
Query Parameters:
  - page?: number
  - limit?: number
```

---

## Agencies Management

**Base Path**: `/api/agencies`

### Agency Moderation

```typescript
// Approve agency
PUT /api/agencies/:id/approve
Body: {
  notes?: string;
}

// Reject agency
PUT /api/agencies/:id/reject
Body: {
  reason: string;
  notes?: string;
}

// Get pending agencies
GET /api/agencies/pending
Query Parameters:
  - page?: number
  - limit?: number
```

---

## Providers Management

**Base Path**: `/api/providers`

### Get All Providers (Admin)

```typescript
GET /api/providers/admin/all
Query Parameters:
  - status?: string
  - verified?: boolean
  - page?: number
  - limit?: number
  - search?: string
```

### Update Provider Status (Admin)

```typescript
PUT /api/providers/admin/:id/status
Body: {
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  reason?: string;
}
```

### Update Provider (Admin)

```typescript
PUT /api/providers/admin/:id
Body: {
  // Provider fields to update
  professionalInfo?: {
    // Professional information
  };
  verification?: {
    // Verification details
  };
}
```

---

## Escrow Management

**Base Path**: `/api/escrows`

### Get All Escrows

```typescript
GET /api/escrows/admin/all
Query Parameters:
  - status?: string
  - page?: number
  - limit?: number
```

### Get Escrow Statistics

```typescript
GET /api/escrows/admin/stats
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

### Resolve Dispute

```typescript
POST /api/escrows/:id/dispute/resolve
Body: {
  resolution: 'refund_buyer' | 'release_seller' | 'split';
  amount?: number; // For split resolution
  notes?: string;
}
```

---

## Notifications Management

**Base Path**: `/api/notifications`

### Send Broadcast Notification

```typescript
POST /api/notifications/broadcast
Body: {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  targetAudience: 'all' | 'clients' | 'providers' | 'suppliers';
  data?: object;
}
```

### Get Notification Statistics

```typescript
GET /api/notifications/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

### Get All Notifications

```typescript
GET /api/notifications/all
Query Parameters:
  - userId?: string
  - type?: string
  - page?: number
  - limit?: number
```

---

## Email Marketing

**Base Path**: `/api/email-marketing`

### Campaign Management

```typescript
// Create campaign
POST /api/email-marketing/campaigns
Body: {
  name: string;
  subject: string;
  content: string;
  targetAudience: string;
  scheduledAt?: string;
}

// Get all campaigns
GET /api/email-marketing/campaigns
Query Parameters:
  - status?: string
  - page?: number
  - limit?: number

// Get campaign
GET /api/email-marketing/campaigns/:id

// Update campaign
PUT /api/email-marketing/campaigns/:id

// Delete campaign
DELETE /api/email-marketing/campaigns/:id

// Duplicate campaign
POST /api/email-marketing/campaigns/:id/duplicate

// Send campaign
POST /api/email-marketing/campaigns/:id/send

// Pause campaign
POST /api/email-marketing/campaigns/:id/pause

// Resume campaign
POST /api/email-marketing/campaigns/:id/resume

// Cancel campaign
POST /api/email-marketing/campaigns/:id/cancel

// Send test email
POST /api/email-marketing/campaigns/:id/test
Body: {
  email: string;
}

// Get campaign analytics
GET /api/email-marketing/campaigns/:id/analytics
```

### Subscriber Management

```typescript
// Get subscribers
GET /api/email-marketing/subscribers
Query Parameters:
  - page?: number
  - limit?: number
  - status?: string

// Get subscriber stats
GET /api/email-marketing/subscribers/stats

// Export subscribers
GET /api/email-marketing/subscribers/export
Query Parameters:
  - format?: 'json' | 'csv'

// Import subscribers
POST /api/email-marketing/subscribers/import
Body: FormData with CSV file

// Get subscriber
GET /api/email-marketing/subscribers/:id

// Update subscriber
PUT /api/email-marketing/subscribers/:id

// Delete subscriber
DELETE /api/email-marketing/subscribers/:id
```

### Analytics

```typescript
// Get overall analytics
GET /api/email-marketing/analytics

// Get top campaigns
GET /api/email-marketing/analytics/top-campaigns

// Get daily stats
GET /api/email-marketing/analytics/daily
```

---

## Live Chat Management

**Base Path**: `/api/admin/live-chat`

### Get All Chat Sessions

```typescript
GET /api/admin/live-chat/sessions
Query Parameters:
  - status?: string
  - page?: number
  - limit?: number
```

### Get Chat Analytics

```typescript
GET /api/admin/live-chat/analytics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

### Delete Chat Session

```typescript
DELETE /api/admin/live-chat/sessions/:sessionId
```

---

## Database & Monitoring

**Base Path**: `/api/database`

### Database Optimization

```typescript
// Get optimization recommendations
GET /api/database/optimization/recommendations

// Run optimization
POST /api/database/optimization/run
Body: {
  type: string;
  options?: object;
}
```

### Database Monitoring

```typescript
// Get database stats
GET /api/database/monitoring/stats

// Get slow queries
GET /api/database/monitoring/slow-queries
Query Parameters:
  - limit?: number
```

---

## Audit Logs

**Base Path**: `/api/audit-logs`

### Get Audit Logs

```typescript
GET /api/audit-logs
Query Parameters:
  - userId?: string
  - action?: string
  - module?: string
  - startDate?: string
  - endDate?: string
  - page?: number
  - limit?: number
```

### Get Audit Statistics

```typescript
GET /api/audit-logs/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

---

## Error Monitoring

**Base Path**: `/api/error-monitoring`

### Get Errors

```typescript
GET /api/error-monitoring/errors
Query Parameters:
  - severity?: 'low' | 'medium' | 'high' | 'critical'
  - status?: 'open' | 'resolved' | 'ignored'
  - page?: number
  - limit?: number
```

### Get Error Statistics

```typescript
GET /api/error-monitoring/statistics
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

### Resolve Error

```typescript
PUT /api/error-monitoring/errors/:id/resolve
Body: {
  notes?: string;
}
```

---

## Partners Management

**Base Path**: `/api/partners`

All partner routes require admin access.

### Create Partner

```typescript
POST /api/partners
Body: {
  name: string;
  email: string;
  phone?: string;
  type: string;
  status: string;
}
```

### Get Partners

```typescript
GET /api/partners
Query Parameters:
  - status?: string
  - type?: string
  - page?: number
  - limit?: number
```

### Update Partner

```typescript
PUT /api/partners/:id
```

### Delete Partner

```typescript
DELETE /api/partners/:id
```

---

## Scheduled Jobs

**Base Path**: `/api/scheduled-jobs`

All scheduled job routes require admin access.

### Get Scheduled Jobs

```typescript
GET /api/scheduled-jobs
Query Parameters:
  - status?: string
  - type?: string
```

### Create Scheduled Job

```typescript
POST /api/scheduled-jobs
Body: {
  name: string;
  type: string;
  schedule: string; // Cron expression
  enabled: boolean;
  config: object;
}
```

### Update Scheduled Job

```typescript
PUT /api/scheduled-jobs/:id
```

### Delete Scheduled Job

```typescript
DELETE /api/scheduled-jobs/:id
```

### Run Job Manually

```typescript
POST /api/scheduled-jobs/:id/run
```

---

## Activity Feed Management

**Base Path**: `/api/activities`

### Get Global Activity Stats

```typescript
GET /api/activities/stats/global
Query Parameters:
  - timeframe?: '24h' | '7d' | '30d' | '90d'
```

---

## Implementation Examples

### React/TypeScript Example

```typescript
import axios from 'axios';

const adminApi = {
  // User Management
  async getUsers(params: UserListParams) {
    const response = await axios.get('/api/users', { params });
    return response.data;
  },

  async updateUserStatus(userId: string, status: string) {
    const response = await axios.patch(
      `/api/users/${userId}/status`,
      { status }
    );
    return response.data;
  },

  // Financial Management
  async processWithdrawal(withdrawalId: string, action: 'approve' | 'reject') {
    const response = await axios.put(
      `/api/finance/withdrawals/${withdrawalId}/process`,
      { action }
    );
    return response.data;
  },

  // Analytics
  async getDashboardAnalytics(timeframe: string) {
    const response = await axios.get('/api/analytics/dashboard', {
      params: { timeframe }
    });
    return response.data;
  },

  // Settings
  async toggleFeature(feature: string, enabled: boolean) {
    const response = await axios.post('/api/settings/app/features/toggle', {
      feature,
      enabled
    });
    return response.data;
  }
};
```

### Vue.js Example

```javascript
// adminService.js
import apiClient from './apiClient';

export const adminService = {
  // User Management
  getUsers(params) {
    return apiClient.get('/api/users', { params });
  },

  updateUserStatus(userId, status) {
    return apiClient.patch(`/api/users/${userId}/status`, { status });
  },

  // Content Moderation
  approveAd(adId, notes) {
    return apiClient.put(`/api/ads/${adId}/approve`, { notes });
  },

  rejectAd(adId, reason) {
    return apiClient.put(`/api/ads/${adId}/reject`, { reason });
  },

  // Analytics
  getDashboardAnalytics(timeframe) {
    return apiClient.get('/api/analytics/dashboard', {
      params: { timeframe }
    });
  }
};
```

---

## Error Handling

All admin routes return standard error responses:

```typescript
{
  success: false,
  message: string,
  error: string,
  code?: string
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - User doesn't have admin role
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error

---

## Best Practices

1. **Always check admin role** before showing admin features
2. **Handle errors gracefully** with user-friendly messages
3. **Implement pagination** for list endpoints
4. **Use loading states** for async operations
5. **Cache analytics data** to reduce API calls
6. **Validate inputs** before sending requests
7. **Log admin actions** for audit purposes
8. **Implement confirmation dialogs** for destructive actions

---

## Next Steps

- Review [Frontend Implementation Guide](./implementation-guide.md)
- Check individual feature documentation
- Set up admin dashboard UI
- Implement role-based access control
- Add error handling and loading states

