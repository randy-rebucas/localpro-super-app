# Admin Frontend Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Admin Dashboard Structure](#admin-dashboard-structure)
4. [Feature Modules](#feature-modules)
5. [API Integration](#api-integration)
6. [UI/UX Recommendations](#uiux-recommendations)
7. [Data Models](#data-models)
8. [Implementation Examples](#implementation-examples)
9. [Best Practices](#best-practices)
10. [Error Handling](#error-handling)

---

## Overview

This document provides comprehensive guidance for implementing a frontend admin panel for the LocalPro Super App. The admin panel allows administrators to manage all aspects of the platform including users, content, finances, system monitoring, settings, and analytics.

### Key Features

- **User Management**: Complete CRUD operations for users, status management, verification
- **Content Moderation**: Review and approve/reject services, jobs, ads, courses
- **Financial Management**: Process withdrawals, approve top-ups, view financial reports
- **System Monitoring**: Error tracking, audit logs, performance metrics, database monitoring
- **Settings Management**: App-wide configuration, feature flags, subscription plans
- **Analytics & Reporting**: Platform-wide analytics, user statistics, business insights
- **Provider Management**: Verify providers, manage onboarding, track performance
- **Agency Management**: Manage agencies, providers, and commissions

### Base API URL

```
Production: https://api.localpro.com
Development: http://localhost:4000
```

### Authentication

All admin endpoints require:
- **JWT Token** in Authorization header: `Bearer <token>`
- **Admin Role** verification (role: `admin`)

---

## Authentication & Authorization

### Login Flow

1. Admin logs in via mobile authentication (SMS verification)
2. Backend returns JWT token with user information
3. Store token in secure storage (httpOnly cookie or secure localStorage)
4. Include token in all API requests

### Authentication Endpoints

```javascript
// Send verification code
POST /api/auth/send-code
Body: { phoneNumber: "+1234567890" }

// Verify code and login
POST /api/auth/verify-code
Body: { 
  phoneNumber: "+1234567890",
  code: "123456"
}

// Get current user (verify token)
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Role Verification

The backend automatically verifies admin role for protected endpoints. If user doesn't have admin role, they'll receive a `403 Forbidden` response.

### Token Management

```javascript
// Store token securely
localStorage.setItem('adminToken', token);

// Include in requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
  'Content-Type': 'application/json'
};

// Handle token expiration
// Backend returns 401 Unauthorized when token expires
// Redirect to login page
```

---

## Admin Dashboard Structure

### Recommended Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Search | Notifications | User Menu     │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Content Area                          │
│          │                                              │
│ - Dashboard                                             │
│ - Users                                                 │
│ - Providers                                             │
│ - Agencies                                              │
│ - Marketplace                                           │
│ - Jobs                                                  │
│ - Finance                                               │
│ - Content Moderation                                    │
│ - Settings                                              │
│ - Analytics                                             │
│ - Monitoring                                            │
│ - Logs                                                  │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Navigation Structure

```javascript
const adminMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/admin/dashboard'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: 'users',
    path: '/admin/users',
    children: [
      { id: 'all-users', label: 'All Users', path: '/admin/users' },
      { id: 'providers', label: 'Providers', path: '/admin/users?role=provider' },
      { id: 'clients', label: 'Clients', path: '/admin/users?role=client' },
      { id: 'stats', label: 'Statistics', path: '/admin/users/stats' }
    ]
  },
  {
    id: 'providers',
    label: 'Provider Management',
    icon: 'briefcase',
    path: '/admin/providers'
  },
  {
    id: 'agencies',
    label: 'Agency Management',
    icon: 'building',
    path: '/admin/agencies'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'store',
    path: '/admin/marketplace'
  },
  {
    id: 'jobs',
    label: 'Job Board',
    icon: 'briefcase',
    path: '/admin/jobs'
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'dollar-sign',
    path: '/admin/finance',
    children: [
      { id: 'withdrawals', label: 'Withdrawals', path: '/admin/finance/withdrawals' },
      { id: 'top-ups', label: 'Top-Ups', path: '/admin/finance/top-ups' },
      { id: 'transactions', label: 'Transactions', path: '/admin/finance/transactions' }
    ]
  },
  {
    id: 'content',
    label: 'Content Moderation',
    icon: 'file-text',
    path: '/admin/content'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/admin/settings'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'bar-chart',
    path: '/admin/analytics'
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: 'activity',
    path: '/admin/monitoring',
    children: [
      { id: 'errors', label: 'Error Monitoring', path: '/admin/monitoring/errors' },
      { id: 'audit-logs', label: 'Audit Logs', path: '/admin/monitoring/audit-logs' },
      { id: 'logs', label: 'Application Logs', path: '/admin/monitoring/logs' },
      { id: 'database', label: 'Database', path: '/admin/monitoring/database' }
    ]
  },
  {
    id: 'trust-verification',
    label: 'Trust & Verification',
    icon: 'shield-check',
    path: '/admin/trust-verification'
  },
  {
    id: 'referrals',
    label: 'Referrals',
    icon: 'users',
    path: '/admin/referrals'
  },
  {
    id: 'escrows',
    label: 'Escrows',
    icon: 'lock',
    path: '/admin/escrows'
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: 'credit-card',
    path: '/admin/subscriptions'
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: 'megaphone',
    path: '/admin/announcements'
  },
  {
    id: 'live-chat',
    label: 'Live Chat',
    icon: 'message-circle',
    path: '/admin/live-chat'
  },
  {
    id: 'supplies',
    label: 'Supplies',
    icon: 'package',
    path: '/admin/supplies'
  },
  {
    id: 'rentals',
    label: 'Rentals',
    icon: 'tool',
    path: '/admin/rentals'
  },
  {
    id: 'academy',
    label: 'Academy',
    icon: 'graduation-cap',
    path: '/admin/academy'
  },
  {
    id: 'ads',
    label: 'Ads',
    icon: 'ad',
    path: '/admin/ads'
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: 'activity',
    path: '/admin/activities'
  },
  {
    id: 'payments',
    label: 'Payment Gateways',
    icon: 'wallet',
    path: '/admin/payments'
  }
];
```

---

## Feature Modules

### 1. User Management

#### Endpoints

```javascript
// Get all users with filtering
GET /api/users?page=1&limit=20&role=provider&isActive=true&search=john

// Get user statistics
GET /api/users/stats

// Get user by ID
GET /api/users/:id

// Create new user
POST /api/users
Body: {
  phoneNumber: "+1234567890",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "client"
}

// Update user
PUT /api/users/:id
Body: {
  firstName: "Updated Name",
  profile: { bio: "Updated bio" }
}

// Update user status (activate/deactivate/suspend/ban)
PATCH /api/users/:id/status
Body: {
  isActive: false,
  reason: "Violation of terms"
}

// Update verification status
PATCH /api/users/:id/verification
Body: {
  verification: {
    phoneVerified: true,
    emailVerified: true,
    identityVerified: true
  }
}

// Add badge to user
POST /api/users/:id/badges
Body: {
  type: "verified_provider",
  description: "Completed identity verification"
}

// Bulk update users
PATCH /api/users/bulk
Body: {
  userIds: ["id1", "id2"],
  updateData: {
    tags: ["vip_customer"],
    status: "active"
  }
}

// Delete user (soft delete)
DELETE /api/users/:id

// Restore soft-deleted user
PATCH /api/users/:id/restore
```

#### UI Components

```javascript
// User List Component
<UserList
  filters={{
    role: 'provider',
    isActive: true,
    search: 'john'
  }}
  onUserClick={(user) => navigate(`/admin/users/${user.id}`)}
/>

// User Detail Component
<UserDetail
  userId={userId}
  onStatusUpdate={(status, reason) => updateUserStatus(userId, status, reason)}
  onVerificationUpdate={(verification) => updateVerification(userId, verification)}
/>

// User Statistics Dashboard
<UserStats
  timeframe="30d"
  onTimeframeChange={(timeframe) => fetchStats(timeframe)}
/>
```

#### Data Structure

```typescript
interface User {
  _id: string;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  profile: {
    avatar?: string;
    bio?: string;
    address?: Address;
    businessName?: string;
  };
  verification: {
    phoneVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
  };
  badges: Badge[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: Record<string, number>;
  verificationStats: {
    phoneVerified: number;
    emailVerified: number;
    identityVerified: number;
  };
  activityStats: {
    logins24h: number;
    logins7d: number;
    logins30d: number;
  };
}
```

---

### 2. Provider Management

#### Endpoints

```javascript
// Get all providers (admin)
GET /api/providers/admin/all?page=1&limit=20&status=active&search=john

// Get provider by ID
GET /api/providers/:id

// Update provider status
PUT /api/providers/admin/:id/status
Body: {
  status: "active", // active, pending, suspended, rejected
  notes: "Profile approved after verification"
}

// Update provider (admin - full update)
PUT /api/providers/admin/:id
Body: {
  professionalInfo: {
    specialties: [...],
    experience: 5,
    hourlyRate: 30
  },
  verification: {
    identityVerified: true,
    businessVerified: true
  }
}
```

#### UI Components

```javascript
// Provider List
<ProviderList
  filters={{ status: 'pending', search: 'john' }}
  onProviderClick={(provider) => navigate(`/admin/providers/${provider.id}`)}
/>

// Provider Detail
<ProviderDetail
  providerId={providerId}
  onStatusUpdate={(status, notes) => updateProviderStatus(providerId, status, notes)}
  onFullUpdate={(providerData) => updateProvider(providerId, providerData)}
/>

// Provider Statistics
<ProviderStats
  timeframe="30d"
  showMetrics={['totalProviders', 'active', 'pending', 'verified']}
/>
```

#### Data Structure

```typescript
interface Provider {
  _id: string;
  userId: string;
  providerType: 'individual' | 'business' | 'agency';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  professionalInfo: {
    specialties: Array<{
      category: string;
      subcategories: string[];
      experience: number;
      hourlyRate: number;
      serviceAreas: Array<{
        city: string;
        state: string;
        radius: number;
      }>;
    }>;
    languages: string[];
    availability: Record<string, {
      start: string;
      end: string;
      available: boolean;
    }>;
  };
  verification: {
    identityVerified: boolean;
    businessVerified: boolean;
    backgroundCheckVerified: boolean;
    insuranceVerified: boolean;
  };
  performance: {
    rating: number;
    totalReviews: number;
    completionRate: number;
    responseTime: number;
    totalEarnings: number;
  };
  onboarding: {
    currentStep: string;
    completedSteps: string[];
    progress: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. Finance Management

#### Endpoints

```javascript
// Get all withdrawal requests
GET /api/finance/withdrawals?page=1&limit=20&status=pending

// Process withdrawal
PUT /api/finance/withdrawals/:withdrawalId/process
Body: {
  status: "approved", // approved, rejected
  adminNotes: "Payment processed successfully"
}

// Get all top-up requests
GET /api/finance/top-ups?page=1&limit=20&status=pending

// Process top-up
PUT /api/finance/top-ups/:topUpId/process
Body: {
  status: "approved", // approved, rejected
  adminNotes: "Receipt verified, payment confirmed"
}
```

#### UI Components

```javascript
// Withdrawal Requests List
<WithdrawalList
  status="pending"
  onProcess={(withdrawalId, status, notes) => 
    processWithdrawal(withdrawalId, status, notes)
  }
/>

// Top-Up Requests List
<TopUpList
  status="pending"
  onProcess={(topUpId, status, notes) => 
    processTopUp(topUpId, status, notes)
  }
/>

// Financial Dashboard
<FinancialDashboard
  timeframe="30d"
  showMetrics={['withdrawals', 'top-ups', 'transactions']}
/>
```

#### Data Structure

```typescript
interface WithdrawalRequest {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile: { avatar?: string };
  };
  amount: number;
  paymentMethod: string;
  accountDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

interface TopUpRequest {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile: { avatar?: string };
  };
  amount: number;
  paymentMethod: string;
  receipt: {
    url: string;
    publicId: string;
  };
  reference?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}
```

---

### 4. Content Moderation

#### Endpoints

```javascript
// Marketplace Services
GET /api/marketplace/services?status=pending
PUT /api/marketplace/services/:id/approve
PUT /api/marketplace/services/:id/reject

// Job Postings
GET /api/jobs?status=pending
PUT /api/jobs/:id/approve
PUT /api/jobs/:id/reject

// Ads
GET /api/ads?status=pending
PUT /api/ads/:id/approve
PUT /api/ads/:id/reject

// Academy Courses
GET /api/academy/courses?status=pending
PUT /api/academy/courses/:id/approve
PUT /api/academy/courses/:id/reject
```

#### UI Components

```javascript
// Content Moderation Queue
<ModerationQueue
  contentType="services" // services, jobs, ads, courses
  status="pending"
  onApprove={(id) => approveContent(id)}
  onReject={(id, reason) => rejectContent(id, reason)}
/>

// Content Review Modal
<ContentReviewModal
  content={content}
  onApprove={() => approveContent(content.id)}
  onReject={(reason) => rejectContent(content.id, reason)}
/>
```

---

### 5. Settings Management

#### Endpoints

```javascript
// Get app settings
GET /api/settings/app

// Update app settings
PUT /api/settings/app
Body: {
  general: {
    appName: "LocalPro",
    appVersion: "1.0.0",
    maintenanceMode: false
  },
  features: {
    marketplace: true,
    academy: true,
    jobBoard: true
  }
}

// Update specific category
PUT /api/settings/app/general
Body: {
  appName: "LocalPro",
  maintenanceMode: false
}

// Toggle feature flag
POST /api/settings/app/features/toggle
Body: {
  feature: "marketplace",
  enabled: true
}

// Get public app settings (no auth required)
GET /api/settings/app/public

// Get app health
GET /api/settings/app/health
```

#### UI Components

```javascript
// Settings Dashboard
<SettingsDashboard
  settings={appSettings}
  onUpdate={(category, data) => updateSettings(category, data)}
/>

// Feature Flags Toggle
<FeatureFlags
  features={features}
  onToggle={(feature, enabled) => toggleFeature(feature, enabled)}
/>

// Maintenance Mode Toggle
<MaintenanceMode
  enabled={maintenanceMode}
  onToggle={(enabled) => setMaintenanceMode(enabled)}
/>
```

---

### 6. System Monitoring

#### Error Monitoring

```javascript
// Get error dashboard summary
GET /api/error-monitoring/dashboard/summary

// Get error statistics
GET /api/error-monitoring/stats?timeframe=24h

// Get unresolved errors
GET /api/error-monitoring/unresolved?limit=50

// Get error details
GET /api/error-monitoring/:errorId

// Resolve error
PATCH /api/error-monitoring/:errorId/resolve
Body: {
  resolution: "Fixed database connection issue"
}
```

#### Audit Logs

```javascript
// Get audit logs
GET /api/audit-logs?category=financial&severity=high&limit=20

// Get audit statistics
GET /api/audit-logs/stats?timeframe=30d

// Get user activity
GET /api/audit-logs/user/:userId/activity?timeframe=7d

// Get audit log details
GET /api/audit-logs/:auditId

// Export audit logs
GET /api/audit-logs/export/data?format=csv&startDate=2024-01-01

// Get audit dashboard
GET /api/audit-logs/dashboard/summary
```

#### Application Logs

```javascript
// Get log statistics
GET /api/logs/stats?timeframe=24h

// Get logs with filtering
GET /api/logs?level=error&category=application&limit=20

// Get log details
GET /api/logs/:logId

// Get error trends
GET /api/logs/analytics/error-trends?timeframe=7d

// Get performance metrics
GET /api/logs/analytics/performance?timeframe=24h

// Export logs
GET /api/logs/export/data?format=csv&level=error&startDate=2024-01-01

// Search logs globally
GET /api/logs/search/global?q=payment&timeframe=7d
```

#### UI Components

```javascript
// Error Monitoring Dashboard
<ErrorMonitoringDashboard
  timeframe="24h"
  onErrorClick={(errorId) => navigate(`/admin/monitoring/errors/${errorId}`)}
/>

// Audit Logs Viewer
<AuditLogsViewer
  filters={{ category: 'financial', severity: 'high' }}
  onExport={(format) => exportAuditLogs(format)}
/>

// Logs Viewer
<LogsViewer
  filters={{ level: 'error', category: 'application' }}
  onSearch={(query) => searchLogs(query)}
/>
```

---

### 7. Analytics & Reporting

#### Endpoints

```javascript
// Get analytics overview
GET /api/analytics/overview?timeframe=30d

// Get user analytics
GET /api/analytics/users?timeframe=30d

// Get marketplace analytics
GET /api/analytics/marketplace?timeframe=30d

// Get job analytics
GET /api/analytics/jobs?timeframe=30d

// Get referral analytics
GET /api/analytics/referrals?timeframe=30d

// Get agency analytics
GET /api/analytics/agencies?timeframe=30d

// Get custom analytics
GET /api/analytics/custom?timeframe=30d&metrics=users,bookings,revenue
```

#### UI Components

```javascript
// Analytics Dashboard
<AnalyticsDashboard
  timeframe="30d"
  metrics={['users', 'bookings', 'revenue', 'referrals']}
  onTimeframeChange={(timeframe) => fetchAnalytics(timeframe)}
/>

// Chart Components
<LineChart data={userGrowthData} title="User Growth" />
<BarChart data={revenueData} title="Revenue by Category" />
<PieChart data={roleDistribution} title="User Distribution" />
```

---

### 8. Agency Management

#### Endpoints

```javascript
// Get all agencies
GET /api/agencies?page=1&limit=20

// Get agency by ID
GET /api/agencies/:id

// Create agency
POST /api/agencies
Body: {
  name: "Agency Name",
  type: "business",
  description: "Agency description"
}

// Update agency
PUT /api/agencies/:id

// Delete agency
DELETE /api/agencies/:id

// Get agency analytics
GET /api/agencies/:id/analytics
```

---

### 9. Trust & Verification Management

#### Endpoints

```javascript
// Get all verification requests
GET /api/trust-verification/requests?page=1&limit=20&status=pending

// Get verification request by ID
GET /api/trust-verification/requests/:id

// Review verification request (approve/reject)
PUT /api/trust-verification/requests/:id/review
Body: {
  status: "approved", // approved, rejected, pending
  notes: "Identity documents verified"
}

// Get verification statistics
GET /api/trust-verification/statistics

// Get verified users
GET /api/trust-verification/verified-users?page=1&limit=20
```

#### UI Components

```javascript
// Verification Requests Queue
<VerificationQueue
  status="pending"
  onReview={(requestId, status, notes) => 
    reviewVerification(requestId, status, notes)
  }
/>

// Verification Statistics
<VerificationStats
  timeframe="30d"
  showMetrics={['pending', 'approved', 'rejected']}
/>
```

---

### 10. Referral Management

#### Endpoints

```javascript
// Process referral completion (admin)
POST /api/referrals/process
Body: {
  referralId: "referral_id",
  status: "completed",
  rewardAmount: 50
}

// Get referral analytics
GET /api/referrals/analytics?timeframe=30d
```

#### UI Components

```javascript
// Referral Analytics Dashboard
<ReferralAnalytics
  timeframe="30d"
  showMetrics={['totalReferrals', 'completed', 'pending', 'rewards']}
/>

// Process Referral Modal
<ProcessReferralModal
  referral={referral}
  onProcess={(referralId, status, reward) => 
    processReferral(referralId, status, reward)
  }
/>
```

---

### 11. Escrow Management

#### Endpoints

```javascript
// Get all escrows (admin)
GET /api/escrows/admin/all?page=1&limit=20&status=active

// Get escrow statistics
GET /api/escrows/admin/stats?timeframe=30d

// Resolve dispute (admin)
POST /api/escrows/:id/dispute/resolve
Body: {
  resolution: "favor_client", // favor_client, favor_provider, partial_refund
  refundAmount: 100,
  notes: "Dispute resolved in favor of client"
}
```

#### UI Components

```javascript
// Escrow Management Dashboard
<EscrowDashboard
  filters={{ status: 'active' }}
  onDisputeResolve={(escrowId, resolution) => 
    resolveDispute(escrowId, resolution)
  }
/>

// Escrow Statistics
<EscrowStats
  timeframe="30d"
  showMetrics={['totalEscrows', 'active', 'completed', 'disputed']}
/>
```

---

### 12. Subscription Management (LocalPro Plus)

#### Endpoints

```javascript
// Create subscription plan
POST /api/localpro-plus/plans
Body: {
  name: "Premium Plan",
  description: "Premium subscription plan",
  price: 29.99,
  billingCycle: "monthly", // monthly, yearly
  features: ["feature1", "feature2"]
}

// Update subscription plan
PUT /api/localpro-plus/plans/:id
Body: {
  price: 39.99,
  features: ["feature1", "feature2", "feature3"]
}

// Delete subscription plan
DELETE /api/localpro-plus/plans/:id

// Get subscription analytics
GET /api/localpro-plus/analytics?timeframe=30d

// Get all subscriptions (admin)
GET /api/localpro-plus/admin/subscriptions?page=1&limit=20&status=active

// Create manual subscription (admin)
POST /api/localpro-plus/admin/subscriptions
Body: {
  userId: "user_id",
  planId: "plan_id",
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}

// Get subscription by user ID
GET /api/localpro-plus/admin/subscriptions/user/:userId

// Update manual subscription (admin)
PUT /api/localpro-plus/admin/subscriptions/:subscriptionId
Body: {
  status: "active",
  endDate: "2024-12-31"
}

// Delete manual subscription (admin)
DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId
```

#### UI Components

```javascript
// Subscription Plans Management
<SubscriptionPlans
  plans={plans}
  onCreate={(planData) => createPlan(planData)}
  onUpdate={(planId, planData) => updatePlan(planId, planData)}
  onDelete={(planId) => deletePlan(planId)}
/>

// Subscription Analytics
<SubscriptionAnalytics
  timeframe="30d"
  showMetrics={['totalSubscriptions', 'active', 'revenue', 'churn']}
/>

// All Subscriptions List
<SubscriptionsList
  filters={{ status: 'active' }}
  onManage={(subscriptionId) => manageSubscription(subscriptionId)}
/>
```

---

### 13. Announcements Management

#### Endpoints

```javascript
// Create announcement
POST /api/announcements
Body: {
  title: "System Maintenance",
  content: "Scheduled maintenance on...",
  summary: "Brief summary",
  type: "maintenance", // system, maintenance, feature, security, etc.
  priority: "high", // low, medium, high, urgent
  targetAudience: "all", // all, providers, clients, agencies, etc.
  scheduledAt: "2024-01-15T10:00:00Z",
  expiresAt: "2024-01-20T10:00:00Z",
  isSticky: true,
  requireAcknowledgment: true
}

// Update announcement
PUT /api/announcements/:id
Body: {
  status: "published", // draft, scheduled, published, archived
  priority: "urgent"
}

// Delete announcement
DELETE /api/announcements/:id

// Get announcement statistics
GET /api/announcements/admin/statistics?timeframe=30d
```

#### UI Components

```javascript
// Announcements Management
<AnnouncementsManager
  announcements={announcements}
  onCreate={(announcement) => createAnnouncement(announcement)}
  onUpdate={(id, data) => updateAnnouncement(id, data)}
  onDelete={(id) => deleteAnnouncement(id)}
/>

// Announcement Statistics
<AnnouncementStats
  timeframe="30d"
  showMetrics={['total', 'published', 'views', 'acknowledgments']}
/>
```

---

### 14. Live Chat Management

#### Endpoints

```javascript
// Get live chat analytics
GET /api/admin/live-chat/analytics?timeframe=30d

// Get all chat sessions (admin)
GET /api/admin/live-chat/sessions?page=1&limit=20&status=active

// Delete chat session (admin)
DELETE /api/admin/live-chat/sessions/:sessionId
```

#### UI Components

```javascript
// Live Chat Dashboard
<LiveChatDashboard
  timeframe="30d"
  showMetrics={['totalSessions', 'active', 'resolved', 'avgResponseTime']}
/>

// Chat Sessions List
<ChatSessionsList
  filters={{ status: 'active' }}
  onSessionClick={(sessionId) => viewSession(sessionId)}
/>
```

---

### 15. Supplies Management

#### Endpoints

```javascript
// Get supply statistics (admin)
GET /api/supplies/statistics?timeframe=30d
```

#### UI Components

```javascript
// Supplies Statistics
<SuppliesStats
  timeframe="30d"
  showMetrics={['totalSupplies', 'active', 'orders', 'revenue']}
/>
```

---

### 16. Rentals Management

#### Endpoints

```javascript
// Get rental statistics (admin)
GET /api/rentals/statistics?timeframe=30d
```

#### UI Components

```javascript
// Rentals Statistics
<RentalsStats
  timeframe="30d"
  showMetrics={['totalRentals', 'active', 'bookings', 'revenue']}
/>
```

---

### 17. Academy Management

#### Endpoints

```javascript
// Get course statistics (admin)
GET /api/academy/statistics?timeframe=30d
```

#### UI Components

```javascript
// Academy Statistics
<AcademyStats
  timeframe="30d"
  showMetrics={['totalCourses', 'enrollments', 'completions', 'revenue']}
/>
```

---

### 18. Ads Management

#### Endpoints

```javascript
// Get pending ads (admin)
GET /api/ads/pending?page=1&limit=20

// Approve ad (admin)
PUT /api/ads/:id/approve
Body: {
  notes: "Ad approved"
}

// Reject ad (admin)
PUT /api/ads/:id/reject
Body: {
  reason: "Violates policy",
  notes: "Ad rejected due to policy violation"
}

// Get ad statistics (admin)
GET /api/ads/statistics?timeframe=30d
```

#### UI Components

```javascript
// Ads Moderation Queue
<AdsModerationQueue
  status="pending"
  onApprove={(adId, notes) => approveAd(adId, notes)}
  onReject={(adId, reason, notes) => rejectAd(adId, reason, notes)}
/>

// Ads Statistics
<AdsStats
  timeframe="30d"
  showMetrics={['totalAds', 'pending', 'active', 'clicks', 'revenue']}
/>
```

---

### 19. Activities Management

#### Endpoints

```javascript
// Get global activity statistics (admin)
GET /api/activities/stats/global?timeframe=30d
```

#### UI Components

```javascript
// Global Activity Stats
<GlobalActivityStats
  timeframe="30d"
  showMetrics={['totalActivities', 'byType', 'byUser', 'trends']}
/>
```

---

### 20. Payment Gateway Management

#### Endpoints

```javascript
// Get PayPal webhook events (admin)
GET /api/paypal/webhook/events?page=1&limit=20

// Get PayMongo intents (admin)
GET /api/paymongo/intents?page=1&limit=20

// Get PayMongo charges (admin)
GET /api/paymongo/charges?page=1&limit=20

// Validate PayMaya configuration (admin)
GET /api/paymaya/config/validate
```

#### UI Components

```javascript
// Payment Gateway Dashboard
<PaymentGatewayDashboard
  gateways={['paypal', 'paymongo', 'paymaya']}
  onViewEvents={(gateway) => viewWebhookEvents(gateway)}
/>

// Webhook Events Viewer
<WebhookEventsViewer
  gateway="paypal"
  events={events}
  onEventClick={(eventId) => viewEventDetails(eventId)}
/>
```

---

### 21. Database Optimization

#### Endpoints

```javascript
// All database optimization endpoints require admin role
// Get optimization recommendations
GET /api/database/optimization/recommendations

// Run optimization
POST /api/database/optimization/run
Body: {
  optimizationType: "index",
  collection: "users"
}
```

#### UI Components

```javascript
// Database Optimization Dashboard
<DatabaseOptimization
  recommendations={recommendations}
  onOptimize={(type, collection) => runOptimization(type, collection)}
/>
```

---

## API Integration

### API Client Setup

```javascript
// apiClient.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Service Examples

```javascript
// services/userService.js
import apiClient from '../apiClient';

export const userService = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/api/users', { params });
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await apiClient.get('/api/users/stats');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await apiClient.post('/api/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId, status, reason) => {
    const response = await apiClient.patch(`/api/users/${userId}/status`, {
      isActive: status === 'active',
      reason
    });
    return response.data;
  },

  // Update verification
  updateVerification: async (userId, verification) => {
    const response = await apiClient.patch(`/api/users/${userId}/verification`, {
      verification
    });
    return response.data;
  },

  // Add badge
  addBadge: async (userId, badge) => {
    const response = await apiClient.post(`/api/users/${userId}/badges`, badge);
    return response.data;
  },

  // Bulk update
  bulkUpdate: async (userIds, updateData) => {
    const response = await apiClient.patch('/api/users/bulk', {
      userIds,
      updateData
    });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/api/users/${userId}`);
    return response.data;
  }
};
```

```javascript
// services/financeService.js
import apiClient from '../apiClient';

export const financeService = {
  // Get withdrawal requests
  getWithdrawals: async (params = {}) => {
    const response = await apiClient.get('/api/finance/withdrawals', { params });
    return response.data;
  },

  // Process withdrawal
  processWithdrawal: async (withdrawalId, status, adminNotes) => {
    const response = await apiClient.put(
      `/api/finance/withdrawals/${withdrawalId}/process`,
      { status, adminNotes }
    );
    return response.data;
  },

  // Get top-up requests
  getTopUps: async (params = {}) => {
    const response = await apiClient.get('/api/finance/top-ups', { params });
    return response.data;
  },

  // Process top-up
  processTopUp: async (topUpId, status, adminNotes) => {
    const response = await apiClient.put(
      `/api/finance/top-ups/${topUpId}/process`,
      { status, adminNotes }
    );
    return response.data;
  }
};
```

---

## UI/UX Recommendations

### Design System

```javascript
// Recommended color palette
const colors = {
  primary: '#3B82F6',      // Blue
  secondary: '#8B5CF6',     // Purple
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Orange
  error: '#EF4444',        // Red
  info: '#06B6D4',         // Cyan
  dark: '#1F2937',         // Dark gray
  light: '#F9FAFB'         // Light gray
};

// Typography
const typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  }
};
```

### Component Library Recommendations

- **React**: Material-UI, Ant Design, or Chakra UI
- **Vue**: Vuetify, Element Plus, or Quasar
- **Angular**: Angular Material or PrimeNG

### Key UI Patterns

1. **Data Tables**: Use pagination, sorting, filtering, and search
2. **Modals**: For confirmations, forms, and detail views
3. **Toast Notifications**: For success/error messages
4. **Loading States**: Skeleton loaders or spinners
5. **Empty States**: Helpful messages when no data
6. **Error Boundaries**: Graceful error handling

---

## Data Models

### Common Response Structure

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}
```

### User Model

```typescript
interface User {
  _id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  profile: {
    avatar?: string;
    bio?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    businessName?: string;
  };
  verification: {
    phoneVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
  };
  badges: Array<{
    type: string;
    description: string;
    awardedAt: string;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Implementation Examples

### React Example: User Management Page

```jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import UserTable from '../components/UserTable';
import UserFilters from '../components/UserFilters';
import UserStats from '../components/UserStats';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(filters);
      setUsers(response.data.data);
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        page: response.data.page
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await userService.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleStatusUpdate = async (userId, status, reason) => {
    try {
      await userService.updateUserStatus(userId, status, reason);
      fetchUsers(); // Refresh list
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="user-management-page">
      <h1>User Management</h1>
      
      {stats && <UserStats stats={stats} />}
      
      <UserFilters
        filters={filters}
        onChange={handleFilterChange}
      />
      
      <UserTable
        users={users}
        loading={loading}
        onStatusUpdate={handleStatusUpdate}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default UserManagementPage;
```

### React Example: Finance Processing Modal

```jsx
import React, { useState } from 'react';
import { financeService } from '../services/financeService';

const ProcessWithdrawalModal = ({ withdrawal, onClose, onSuccess }) => {
  const [status, setStatus] = useState('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await financeService.processWithdrawal(
        withdrawal._id,
        status,
        adminNotes
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Process Withdrawal</h2>
        
        <div className="withdrawal-info">
          <p><strong>User:</strong> {withdrawal.user.firstName} {withdrawal.user.lastName}</p>
          <p><strong>Amount:</strong> ${withdrawal.amount}</p>
          <p><strong>Payment Method:</strong> {withdrawal.paymentMethod}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          </div>

          <div className="form-group">
            <label>Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Add notes about this decision..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessWithdrawalModal;
```

---

## Best Practices

### 1. Error Handling

```javascript
// Centralized error handler
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { message: data.message || 'Invalid request', type: 'error' };
      case 401:
        // Redirect to login
        window.location.href = '/admin/login';
        return { message: 'Session expired', type: 'error' };
      case 403:
        return { message: 'You do not have permission', type: 'error' };
      case 404:
        return { message: 'Resource not found', type: 'error' };
      case 500:
        return { message: 'Server error. Please try again later.', type: 'error' };
      default:
        return { message: data.message || 'An error occurred', type: 'error' };
    }
  } else if (error.request) {
    // Request made but no response
    return { message: 'Network error. Please check your connection.', type: 'error' };
  } else {
    // Error setting up request
    return { message: error.message || 'An unexpected error occurred', type: 'error' };
  }
};
```

### 2. Loading States

```javascript
// Use loading states for better UX
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await apiService.getData();
    setData(data);
  } finally {
    setLoading(false);
  }
};
```

### 3. Optimistic Updates

```javascript
// Update UI immediately, rollback on error
const handleStatusUpdate = async (userId, newStatus) => {
  // Optimistic update
  const previousStatus = users.find(u => u.id === userId)?.status;
  setUsers(users.map(u => 
    u.id === userId ? { ...u, status: newStatus } : u
  ));

  try {
    await userService.updateStatus(userId, newStatus);
  } catch (error) {
    // Rollback on error
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: previousStatus } : u
    ));
    showError('Failed to update status');
  }
};
```

### 4. Pagination

```javascript
// Implement efficient pagination
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});

const handlePageChange = (newPage) => {
  setPagination({ ...pagination, page: newPage });
  fetchData({ ...filters, page: newPage });
};
```

### 5. Search Debouncing

```javascript
import { useDebounce } from 'use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    fetchData({ ...filters, search: debouncedSearchTerm });
  }
}, [debouncedSearchTerm]);
```

---

## Error Handling

### Common Error Codes

```javascript
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};
```

### Error Display Component

```jsx
const ErrorMessage = ({ error, onRetry }) => {
  return (
    <div className="error-message">
      <p>{error.message}</p>
      {onRetry && (
        <button onClick={onRetry}>Retry</button>
      )}
    </div>
  );
};
```

---

## Security Considerations

1. **Token Storage**: Use httpOnly cookies or secure storage
2. **HTTPS**: Always use HTTPS in production
3. **Input Validation**: Validate all user inputs
4. **XSS Protection**: Sanitize user-generated content
5. **CSRF Protection**: Implement CSRF tokens if needed
6. **Rate Limiting**: Respect API rate limits
7. **Error Messages**: Don't expose sensitive information in errors

---

## Testing Recommendations

1. **Unit Tests**: Test individual components and services
2. **Integration Tests**: Test API integration
3. **E2E Tests**: Test complete user flows
4. **Error Scenarios**: Test error handling
5. **Loading States**: Test loading and empty states

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API base URL set correctly
- [ ] Authentication flow tested
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design verified
- [ ] Browser compatibility tested
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Analytics tracking configured

---

## Support & Resources

- **API Documentation**: See `/docs` folder for detailed API docs
- **Postman Collection**: Available at `/LocalPro-Super-App-API.postman_collection.json`
- **Health Check**: `GET /health` for API status
- **Support Email**: api-support@localpro.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0

