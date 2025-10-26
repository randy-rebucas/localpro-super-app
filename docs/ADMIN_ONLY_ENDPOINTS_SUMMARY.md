# Admin-Only API Endpoints Summary

This document provides a comprehensive list of all admin-only API endpoints in the LocalPro Super App, organized by module.

## Overview

The following endpoints require admin privileges and have been labeled with `[ADMIN ONLY]` or `[ADMIN/AGENCY ONLY]` comments in the code.

## Academy Module

### Admin-Only Endpoints
- `GET /api/academy/statistics` - [ADMIN ONLY] - Get course statistics

## Activities Module

### Admin-Only Endpoints
- `GET /api/activities/stats/global` - [ADMIN ONLY] - Get global activity statistics

## Ads Module

### Admin-Only Endpoints
- `GET /api/ads/statistics` - [ADMIN ONLY] - Get ad statistics

## Analytics Module

### Admin-Only Endpoints
- `GET /api/analytics/custom` - [ADMIN ONLY] - Get custom analytics

## Announcements Module

### Admin/Agency-Only Endpoints
- `POST /api/announcements` - [ADMIN/AGENCY ONLY] - Create announcement
- `GET /api/announcements/admin/statistics` - [ADMIN ONLY] - Get announcement statistics

## Audit Logs Module (ALL ADMIN-ONLY)

### Admin-Only Endpoints
- `GET /api/audit-logs/` - [ADMIN ONLY] - Get audit logs with filtering and pagination
- `GET /api/audit-logs/stats` - [ADMIN ONLY] - Get audit statistics
- `GET /api/audit-logs/user/:userId/activity` - [ADMIN ONLY] - Get user activity summary
- `GET /api/audit-logs/:auditId` - [ADMIN ONLY] - Get audit log details
- `GET /api/audit-logs/export/data` - [ADMIN ONLY] - Export audit logs
- `GET /api/audit-logs/dashboard/summary` - [ADMIN ONLY] - Get audit dashboard summary
- `POST /api/audit-logs/cleanup` - [ADMIN ONLY] - Clean up expired audit logs
- `GET /api/audit-logs/metadata/categories` - [ADMIN ONLY] - Get audit log categories and actions

## Error Monitoring Module (ALL ADMIN-ONLY)

### Admin-Only Endpoints
- `GET /api/error-monitoring/stats` - [ADMIN ONLY] - Get error statistics
- `GET /api/error-monitoring/unresolved` - [ADMIN ONLY] - Get unresolved errors
- `GET /api/error-monitoring/:errorId` - [ADMIN ONLY] - Get error details
- `PATCH /api/error-monitoring/:errorId/resolve` - [ADMIN ONLY] - Resolve error
- `GET /api/error-monitoring/dashboard/summary` - [ADMIN ONLY] - Get error monitoring dashboard data

## Finance Module

### Admin-Only Endpoints
- `PUT /api/finance/withdrawals/:withdrawalId/process` - [ADMIN ONLY] - Process withdrawal

## LocalPro Plus Module

### Admin-Only Endpoints
- `POST /api/localpro-plus/plans` - [ADMIN ONLY] - Create subscription plan
- `PUT /api/localpro-plus/plans/:id` - [ADMIN ONLY] - Update subscription plan
- `DELETE /api/localpro-plus/plans/:id` - [ADMIN ONLY] - Delete subscription plan
- `GET /api/localpro-plus/analytics` - [ADMIN ONLY] - Get subscription analytics

## Logs Module (ALL ADMIN-ONLY)

### Admin-Only Endpoints
- `GET /api/logs/stats` - [ADMIN ONLY] - Get log statistics
- `GET /api/logs/` - [ADMIN ONLY] - Get logs with filtering and pagination
- `GET /api/logs/:logId` - [ADMIN ONLY] - Get log details
- `GET /api/logs/analytics/error-trends` - [ADMIN ONLY] - Get error trends
- `GET /api/logs/analytics/performance` - [ADMIN ONLY] - Get performance metrics
- `GET /api/logs/user/:userId/activity` - [ADMIN ONLY] - Get user activity logs
- `GET /api/logs/export/data` - [ADMIN ONLY] - Export logs
- `GET /api/logs/dashboard/summary` - [ADMIN ONLY] - Get log dashboard summary
- `GET /api/logs/search/global` - [ADMIN ONLY] - Search logs across all collections
- `POST /api/logs/cleanup` - [ADMIN ONLY] - Clean up expired logs
- `POST /api/logs/flush` - [ADMIN ONLY] - Flush all logs
- `DELETE /api/logs/flush` - [ADMIN ONLY] - Flush all logs (alternative endpoint)

## Maps Module

### Admin-Only Endpoints
- `GET /api/maps/test` - [ADMIN ONLY] - Test Google Maps connection

## PayMaya Module

### Admin-Only Endpoints
- `GET /api/paymaya/config/validate` - [ADMIN ONLY] - Validate PayMaya configuration
- `GET /api/paymaya/webhook/events` - [ADMIN ONLY] - Get webhook events

## PayPal Module

### Admin-Only Endpoints
- `GET /api/paypal/webhook/events` - [ADMIN ONLY] - Get webhook events

## Referrals Module

### Admin-Only Endpoints
- `POST /api/referrals/process` - [ADMIN ONLY] - Process referral completion
- `GET /api/referrals/analytics` - [ADMIN ONLY] - Get referral analytics

## Rentals Module

### Admin-Only Endpoints
- `GET /api/rentals/statistics` - [ADMIN ONLY] - Get rental statistics

## Search Module

### Admin-Only Endpoints
- `POST /api/search/analytics` - [ADMIN ONLY] - Track search analytics

## Settings Module

### Admin-Only Endpoints
- `GET /api/settings/app` - [ADMIN ONLY] - Get app settings
- `PUT /api/settings/app` - [ADMIN ONLY] - Update app settings
- `PUT /api/settings/app/:category` - [ADMIN ONLY] - Update app settings category
- `POST /api/settings/app/features/toggle` - [ADMIN ONLY] - Toggle feature flag

## Supplies Module

### Admin-Only Endpoints
- `GET /api/supplies/statistics` - [ADMIN ONLY] - Get supply statistics

## Trust Verification Module

### Admin-Only Endpoints
- `PUT /api/trust-verification/requests/:id/review` - [ADMIN ONLY] - Review trust verification request
- `GET /api/trust-verification/statistics` - [ADMIN ONLY] - Get trust verification statistics

## User Management Module (ALL ADMIN/AGENCY-ONLY)

### Admin/Agency-Only Endpoints
- `GET /api/users/` - [ADMIN/AGENCY ONLY] - Get all users with filtering and pagination
- `GET /api/users/stats` - [ADMIN/AGENCY ONLY] - Get user statistics
- `GET /api/users/:id` - [ADMIN/AGENCY/USER ONLY] - Get user by ID
- `POST /api/users/` - [ADMIN ONLY] - Create new user
- `PUT /api/users/:id` - [ADMIN/AGENCY/USER ONLY] - Update user
- `PATCH /api/users/:id/status` - [ADMIN/AGENCY ONLY] - Update user status
- `PATCH /api/users/:id/verification` - [ADMIN/AGENCY ONLY] - Update user verification status
- `POST /api/users/:id/badges` - [ADMIN/AGENCY ONLY] - Add badge to user
- `PATCH /api/users/bulk` - [ADMIN ONLY] - Bulk update users
- `DELETE /api/users/:id` - [ADMIN ONLY] - Delete user (soft delete)

## Summary Statistics

- **Total Admin-Only Endpoints**: 65+
- **Modules with Admin-Only Endpoints**: 15
- **Fully Admin-Only Modules**: 3 (Audit Logs, Error Monitoring, Logs)
- **Mixed Access Modules**: 12

## Access Control Patterns

1. **Pure Admin Only**: Endpoints that require `admin` role exclusively
2. **Admin/Agency Only**: Endpoints that allow both `admin` and `agency_admin`/`agency_owner` roles
3. **Admin/User Only**: Endpoints that allow `admin` and specific user roles
4. **Role-Based Checks**: Endpoints that check `req.user.role !== 'admin'` in the handler

## Security Notes

- All admin-only endpoints are properly protected with authentication middleware
- Role-based authorization is implemented using the `authorize()` middleware
- Some endpoints have additional role checks in the handler logic
- Admin-only modules (Audit Logs, Error Monitoring, Logs) provide comprehensive system monitoring capabilities
- User Management module provides granular control over user accounts and permissions

## Recommendations

1. **API Documentation**: Ensure all admin-only endpoints are clearly documented in API documentation
2. **Rate Limiting**: Consider implementing stricter rate limiting for admin endpoints
3. **Audit Logging**: All admin actions should be logged for security and compliance
4. **Access Monitoring**: Monitor admin endpoint usage for suspicious activity
5. **Role Hierarchy**: Consider implementing a clear role hierarchy for different admin levels
