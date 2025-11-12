# Admin Use Cases

## Overview
This document describes the primary use cases for administrators in the LocalPro Super App.

## Role Definition
**Admin**: System administrators with full access to manage users, content, settings, and platform operations.

## Use Cases

### UC-AD-001: User Management
**Description**: Admin manages all users on the platform

**Actors**: Admin

**Preconditions**: Admin is authenticated

**Main Flow**:
1. Admin views all users via `/api/users`
2. Admin filters by role, status, verification
3. Admin views user details via `/api/users/:id`
4. Admin updates user status via `/api/users/:id/status`
5. Admin verifies users via `/api/users/:id/verification`
6. Admin adds badges via `/api/users/:id/badges`
7. Admin performs bulk operations via `/api/users/bulk`

**Related Endpoints**:
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id/status`
- `PATCH /api/users/:id/verification`
- `POST /api/users/:id/badges`

---

### UC-AD-002: Content Moderation
**Description**: Admin moderates content (ads, services, courses)

**Actors**: Admin

**Main Flow**:
1. Admin views pending ads via `/api/ads/pending`
2. Admin approves/rejects ads via `/api/ads/:id/approve` or `/api/ads/:id/reject`
3. Admin reviews services, courses, jobs
4. Admin manages content visibility

**Related Endpoints**:
- `GET /api/ads/pending`
- `PUT /api/ads/:id/approve`
- `PUT /api/ads/:id/reject`

---

### UC-AD-003: Financial Management
**Description**: Admin processes withdrawals and top-ups

**Actors**: Admin

**Main Flow**:
1. Admin views withdrawal requests via `/api/finance/withdrawals`
2. Admin processes withdrawal via `/api/finance/withdrawals/:id/process`
3. Admin views top-up requests via `/api/finance/top-ups`
4. Admin processes top-up via `/api/finance/top-ups/:id/process`

**Related Endpoints**:
- `PUT /api/finance/withdrawals/:withdrawalId/process`
- `PUT /api/finance/top-ups/:topUpId/process`

---

### UC-AD-004: System Monitoring
**Description**: Admin monitors system health and performance

**Actors**: Admin

**Main Flow**:
1. Admin views system health via `/api/monitoring/system-health`
2. Admin checks error monitoring via `/api/error-monitoring`
3. Admin views audit logs via `/api/audit-logs`
4. Admin checks application logs via `/api/logs`
5. Admin views database stats via `/api/monitoring/database/stats`

**Related Endpoints**:
- `GET /api/monitoring/system-health`
- `GET /api/error-monitoring`
- `GET /api/audit-logs`
- `GET /api/logs`

---

### UC-AD-005: Platform Settings
**Description**: Admin manages platform settings

**Actors**: Admin

**Main Flow**:
1. Admin views app settings via `/api/settings/app`
2. Admin updates settings via `/api/settings/app`
3. Admin toggles feature flags via `/api/settings/app/features/toggle`
4. Admin manages subscription plans via `/api/localpro-plus/plans`

**Related Endpoints**:
- `GET /api/settings/app`
- `PUT /api/settings/app`
- `POST /api/settings/app/features/toggle`
- `POST /api/localpro-plus/plans`

---

### UC-AD-006: Analytics & Reporting
**Description**: Admin views platform analytics

**Actors**: Admin

**Main Flow**:
1. Admin views custom analytics via `/api/analytics/custom`
2. Admin views subscription analytics via `/api/localpro-plus/analytics`
3. Admin views ad statistics via `/api/ads/statistics`
4. Admin exports data for reporting

**Related Endpoints**:
- `GET /api/analytics/custom`
- `GET /api/localpro-plus/analytics`
- `GET /api/ads/statistics`

---

## Summary
Admins have comprehensive access to manage all aspects of the platform including users, content, finances, system monitoring, settings, and analytics. All admin actions require authentication and admin role verification.

