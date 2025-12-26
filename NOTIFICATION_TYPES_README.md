# Notification Types Reference

This document provides a comprehensive list of all notification types available in the LocalPro Super App for frontend mapping and implementation.

## Overview

The notification system supports **60+ notification types** organized into **16 groups** and **7 categories**. Each notification type has:
- A unique `type` identifier
- A `category` for push/email settings
- An optional `smsCategory` for SMS settings
- A `priority` level (low, medium, high, urgent)
- A `description` for UI display
- A `group` for organization

## Files

- **`NOTIFICATION_TYPES.json`** - JSON format for easy import
- **`NOTIFICATION_TYPES.ts`** - TypeScript definitions with helper functions

## Notification Groups

### 1. Bookings (9 types)
- `booking_created` - New booking created
- `booking_confirmed` - Booking confirmed
- `booking_cancelled` - Booking cancelled
- `booking_completed` - Booking completed
- `booking_in_progress` - Booking in progress
- `booking_confirmation_needed` - Booking confirmation needed
- `booking_pending_soon` - Booking pending soon
- `booking_overdue_completion` - Booking overdue completion
- `booking_overdue_admin_alert` - Booking overdue admin alert

### 2. Jobs (5 types)
- `job_application` - New job application
- `application_status_update` - Application status changed
- `job_posted` - New job posted
- `job_digest` - Job digest (weekly summary)
- `job_application_followup` - Job application follow-up

### 3. Messages (3 types)
- `message_received` - New message received
- `message_moderation_flag` - Message flagged for moderation
- `message_policy_warning` - Message policy violation warning

### 4. Payments (2 types)
- `payment_received` - Payment received
- `payment_failed` - Payment failed

### 5. Subscriptions (4 types)
- `subscription_renewal` - Subscription renewed
- `subscription_cancelled` - Subscription cancelled
- `subscription_dunning_reminder` - Payment reminder for subscription
- `subscription_expiring_soon` - Subscription expiring soon

### 6. Referrals (3 types)
- `referral_reward` - Referral reward earned
- `referral_tier_upgraded` - Referral tier upgraded
- `referral_nudge` - Referral reminder

### 7. Academy (4 types)
- `course_enrollment` - Course enrollment
- `academy_not_started` - Course not started
- `academy_progress_stalled` - Course progress stalled
- `academy_certificate_pending` - Certificate pending

### 8. Orders (7 types)
- `order_confirmation` - Order confirmed
- `order_payment_pending` - Order payment pending
- `order_sla_alert` - Order SLA alert
- `order_delivery_confirmation` - Order delivered
- `order_delivery_late_alert` - Order delivery late
- `order_auto_delivered` - Order auto-delivered
- `supplies_reorder_reminder` - Supplies reorder reminder

### 9. Rentals (2 types)
- `rental_due_soon` - Rental due soon
- `rental_overdue` - Rental overdue

### 10. Finance (4 types)
- `loan_repayment_due` - Loan repayment due
- `loan_repayment_overdue` - Loan repayment overdue
- `salary_advance_due` - Salary advance due
- `salary_advance_overdue` - Salary advance overdue

### 11. Escrow (2 types)
- `escrow_dispute_unresolved` - Escrow dispute unresolved
- `escrow_dispute_evidence_needed` - Escrow dispute evidence needed

### 12. Support (1 type)
- `livechat_sla_alert` - Live chat SLA alert

### 13. System (1 type)
- `system_announcement` - System announcement

### 14. Security (2 types)
- `security_alert` - Security alert
- `login_alert` - Login alert

### 15. Marketing (2 types)
- `marketing_reengagement` - Marketing re-engagement
- `marketing_weekly_digest` - Marketing weekly digest

### 16. Onboarding (3 types)
- `welcome_followup_day2` - Welcome follow-up day 2
- `welcome_followup_day7` - Welcome follow-up day 7
- `provider_activation_nudge` - Provider activation reminder

## Notification Categories

Categories are used for user notification settings (push/email):

1. **bookingUpdates** - Booking-related notifications
2. **jobMatches** - Job application and posting notifications
3. **newMessages** - New message notifications
4. **paymentUpdates** - Payment and subscription notifications
5. **referralUpdates** - Referral program notifications
6. **systemUpdates** - System and administrative notifications
7. **marketing** - Marketing and promotional notifications

## SMS Categories

SMS categories are used for SMS notification settings:

1. **bookingReminders** - Booking reminders via SMS
2. **urgentMessages** - Urgent message notifications
3. **paymentAlerts** - Payment and financial alerts
4. **securityAlerts** - Security-related alerts

## Priority Levels

- **low** - Low priority notifications (e.g., marketing, digests)
- **medium** - Medium priority notifications (e.g., updates, confirmations)
- **high** - High priority notifications (e.g., important updates, alerts)
- **urgent** - Urgent notifications (e.g., payment failures, security alerts)

## Frontend Usage Examples

### TypeScript/React Example

```typescript
import { 
  NOTIFICATION_TYPES, 
  getNotificationTypeConfig,
  getNotificationsByGroup,
  CATEGORY_LABELS,
  PRIORITY_LABELS
} from './NOTIFICATION_TYPES';

// Get config for a specific notification type
const config = getNotificationTypeConfig('booking_created');
// Returns: { type: 'booking_created', category: 'bookingUpdates', ... }

// Get all booking notifications
const bookingNotifications = getNotificationsByGroup('Bookings');

// Display category label
const label = CATEGORY_LABELS['bookingUpdates']; // "Booking Updates"

// Display priority label
const priorityLabel = PRIORITY_LABELS['high']; // "High"
```

### JavaScript Example

```javascript
import notificationTypes from './NOTIFICATION_TYPES.json';

// Find notification type
const notification = notificationTypes.notificationTypes.find(
  nt => nt.type === 'booking_created'
);

// Filter by group
const bookingNotifications = notificationTypes.notificationTypes.filter(
  nt => nt.group === 'Bookings'
);

// Filter by priority
const urgentNotifications = notificationTypes.notificationTypes.filter(
  nt => nt.priority === 'urgent'
);
```

## API Endpoints

### Get Notifications
```
GET /api/notifications
GET /api/communication/notifications
```

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `isRead` - Filter by read status (true/false)
- `type` - Filter by notification type

### Get Unread Count
```
GET /api/notifications/unread-count
```

### Mark as Read
```
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
```

### Get Notification Settings
```
GET /api/notifications/settings
```

### Check if Notification Type is Enabled
```
GET /api/notifications/check/:type?channel=push
```

## Notification Object Structure

```typescript
interface Notification {
  _id: string;
  user: string; // User ID
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>; // Additional data
  isRead: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  scheduledFor?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## User Notification Settings Structure

```typescript
interface NotificationSettings {
  push: {
    enabled: boolean;
    newMessages: boolean;
    jobMatches: boolean;
    bookingUpdates: boolean;
    paymentUpdates: boolean;
    referralUpdates: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  email: {
    enabled: boolean;
    newMessages: boolean;
    jobMatches: boolean;
    bookingUpdates: boolean;
    paymentUpdates: boolean;
    referralUpdates: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  sms: {
    enabled: boolean;
    urgentMessages: boolean;
    bookingReminders: boolean;
    paymentAlerts: boolean;
    securityAlerts: boolean;
  };
}
```

## Notes

1. **`login_alert`** is defined in `NOTIFICATION_TYPE_MAP` but is **NOT** currently in the database enum in `src/models/Communication.js`. If you need to use this notification type, it must be added to the enum first.

2. Notifications respect user settings - if a user has disabled a category, notifications in that category won't be sent via that channel.

3. SMS notifications are only sent for specific SMS categories, not all notification types.

4. Security notifications (`security_alert`, `login_alert`) are always sent via SMS if SMS is enabled, regardless of other settings.

5. Notifications can have an `expiresAt` date - expired notifications are automatically filtered out in queries.

## Related Files

- `src/models/Communication.js` - Notification model definition
- `src/services/notificationService.js` - Notification service with type mappings
- `src/routes/notifications.js` - Notification API routes
- `src/models/UserSettings.js` - User notification preferences

