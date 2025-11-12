# Agency Admin Use Cases

## Overview
This document describes the primary use cases for agency administrators in the LocalPro Super App.

## Role Definition
**Agency Admin**: Users who assist agency owners in managing agency operations with limited permissions.

## Use Cases

### UC-AA-001: Manage Agency Providers
**Description**: Agency admin manages providers (limited permissions)

**Actors**: Agency Admin

**Preconditions**: Admin is assigned to agency

**Main Flow**:
1. Admin views agency providers
2. Admin updates provider status (if permitted)
3. Admin assists with provider onboarding

**Related Endpoints**:
- `GET /api/agencies/:id`
- `PUT /api/agencies/:id/providers/:providerId/status`

---

### UC-AA-002: View Agency Analytics
**Description**: Agency admin views agency performance data

**Actors**: Agency Admin

**Main Flow**:
1. Admin views agency analytics via `/api/agencies/:id/analytics`
2. Admin tracks provider performance
3. Admin generates reports

**Related Endpoints**:
- `GET /api/agencies/:id/analytics`

---

### UC-AA-003: User Management (Limited)
**Description**: Agency admin manages users within agency (limited scope)

**Actors**: Agency Admin

**Main Flow**:
1. Admin views users via `/api/users` (agency filtered)
2. Admin updates user status via `/api/users/:id/status`
3. Admin manages user verification

**Related Endpoints**:
- `GET /api/users`
- `PATCH /api/users/:id/status`
- `PATCH /api/users/:id/verification`

---

## Summary
Agency admins have limited permissions compared to agency owners. They can manage providers, view analytics, and perform limited user management within their agency scope. They cannot create agencies or manage agency admins.

