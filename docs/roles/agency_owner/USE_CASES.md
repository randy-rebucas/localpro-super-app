# Agency Owner Use Cases

## Overview
This document describes the primary use cases for agency owners in the LocalPro Super App.

## Role Definition
**Agency Owner**: Users who own and manage agencies, coordinating multiple providers and managing agency operations.

## Use Cases

### UC-AO-001: Create Agency
**Description**: User creates an agency

**Actors**: Agency Owner

**Preconditions**: User is authenticated

**Main Flow**:
1. User creates agency via `/api/agencies`
2. User adds agency details (name, description, location)
3. User uploads agency logo via `/api/agencies/:id/logo`
4. Agency created with status pending/active

**Related Endpoints**:
- `POST /api/agencies`
- `POST /api/agencies/:id/logo`
- `GET /api/agencies/my/agencies`

---

### UC-AO-002: Manage Agency Providers
**Description**: Agency owner manages providers in agency

**Actors**: Agency Owner

**Main Flow**:
1. Owner views agency providers
2. Owner adds provider via `/api/agencies/:id/providers`
3. Owner removes provider via `/api/agencies/:id/providers/:providerId`
4. Owner updates provider status via `/api/agencies/:id/providers/:providerId/status`

**Related Endpoints**:
- `POST /api/agencies/:id/providers`
- `DELETE /api/agencies/:id/providers/:providerId`
- `PUT /api/agencies/:id/providers/:providerId/status`

---

### UC-AO-003: Manage Agency Admins
**Description**: Agency owner manages agency administrators

**Actors**: Agency Owner

**Main Flow**:
1. Owner adds admin via `/api/agencies/:id/admins`
2. Owner removes admin via `/api/agencies/:id/admins/:adminId`
3. Owner manages admin permissions

**Related Endpoints**:
- `POST /api/agencies/:id/admins`
- `DELETE /api/agencies/:id/admins/:adminId`

---

### UC-AO-004: View Agency Analytics
**Description**: Agency owner views agency performance

**Actors**: Agency Owner

**Main Flow**:
1. Owner views agency analytics via `/api/agencies/:id/analytics`
2. Owner tracks provider performance
3. Owner views agency bookings and revenue

**Related Endpoints**:
- `GET /api/agencies/:id/analytics`
- `GET /api/agencies/:id`

---

### UC-AO-005: User Management (Agency Scope)
**Description**: Agency owner manages users within agency scope

**Actors**: Agency Owner

**Main Flow**:
1. Owner views users via `/api/users` (filtered by agency)
2. Owner updates user status via `/api/users/:id/status`
3. Owner manages user verification

**Related Endpoints**:
- `GET /api/users`
- `PATCH /api/users/:id/status`
- `PATCH /api/users/:id/verification`

---

## Summary
Agency owners manage agencies, coordinate providers, manage agency admins, view analytics, and have limited user management capabilities within their agency scope.

