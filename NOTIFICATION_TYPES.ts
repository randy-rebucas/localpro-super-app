/**
 * Notification Types for Frontend Mapping
 * 
 * This file contains all notification types, their categories, priorities, and groups
 * for use in the frontend application.
 */

export type NotificationType =
  // Bookings
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_in_progress'
  | 'booking_confirmation_needed'
  | 'booking_pending_soon'
  | 'booking_overdue_completion'
  | 'booking_overdue_admin_alert'
  // Jobs
  | 'job_application'
  | 'application_status_update'
  | 'job_posted'
  | 'job_digest'
  | 'job_application_followup'
  // Messages
  | 'message_received'
  | 'message_moderation_flag'
  | 'message_policy_warning'
  // Payments
  | 'payment_received'
  | 'payment_failed'
  // Subscriptions
  | 'subscription_renewal'
  | 'subscription_cancelled'
  | 'subscription_dunning_reminder'
  | 'subscription_expiring_soon'
  // Referrals
  | 'referral_reward'
  | 'referral_tier_upgraded'
  | 'referral_nudge'
  // Academy
  | 'course_enrollment'
  | 'academy_not_started'
  | 'academy_progress_stalled'
  | 'academy_certificate_pending'
  // Orders
  | 'order_confirmation'
  | 'order_payment_pending'
  | 'order_sla_alert'
  | 'order_delivery_confirmation'
  | 'order_delivery_late_alert'
  | 'order_auto_delivered'
  | 'supplies_reorder_reminder'
  // Rentals
  | 'rental_due_soon'
  | 'rental_overdue'
  // Finance
  | 'loan_repayment_due'
  | 'loan_repayment_overdue'
  | 'salary_advance_due'
  | 'salary_advance_overdue'
  // Escrow
  | 'escrow_dispute_unresolved'
  | 'escrow_dispute_evidence_needed'
  // Support
  | 'livechat_sla_alert'
  // System
  | 'system_announcement'
  // Security
  | 'security_alert'
  | 'login_alert'
  // Marketing
  | 'marketing_reengagement'
  | 'marketing_weekly_digest'
  // Onboarding
  | 'welcome_followup_day2'
  | 'welcome_followup_day7'
  | 'provider_activation_nudge';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationCategory = 
  | 'bookingUpdates'
  | 'jobMatches'
  | 'newMessages'
  | 'paymentUpdates'
  | 'referralUpdates'
  | 'systemUpdates'
  | 'marketing';

export type SmsCategory = 
  | 'bookingReminders'
  | 'urgentMessages'
  | 'paymentAlerts'
  | 'securityAlerts'
  | null;

export type NotificationGroup =
  | 'Bookings'
  | 'Jobs'
  | 'Messages'
  | 'Payments'
  | 'Subscriptions'
  | 'Referrals'
  | 'Academy'
  | 'Orders'
  | 'Rentals'
  | 'Finance'
  | 'Escrow'
  | 'Support'
  | 'System'
  | 'Security'
  | 'Marketing'
  | 'Onboarding';

export interface NotificationTypeConfig {
  type: NotificationType;
  category: NotificationCategory;
  smsCategory: SmsCategory;
  priority: NotificationPriority;
  description: string;
  group: NotificationGroup;
}

export const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  // Bookings
  {
    type: 'booking_created',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'high',
    description: 'New booking created',
    group: 'Bookings'
  },
  {
    type: 'booking_confirmed',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'high',
    description: 'Booking confirmed',
    group: 'Bookings'
  },
  {
    type: 'booking_cancelled',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'high',
    description: 'Booking cancelled',
    group: 'Bookings'
  },
  {
    type: 'booking_completed',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'medium',
    description: 'Booking completed',
    group: 'Bookings'
  },
  {
    type: 'booking_in_progress',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'medium',
    description: 'Booking in progress',
    group: 'Bookings'
  },
  {
    type: 'booking_confirmation_needed',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'high',
    description: 'Booking confirmation needed',
    group: 'Bookings'
  },
  {
    type: 'booking_pending_soon',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'high',
    description: 'Booking pending soon',
    group: 'Bookings'
  },
  {
    type: 'booking_overdue_completion',
    category: 'bookingUpdates',
    smsCategory: 'bookingReminders',
    priority: 'medium',
    description: 'Booking overdue completion',
    group: 'Bookings'
  },
  {
    type: 'booking_overdue_admin_alert',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'high',
    description: 'Booking overdue admin alert',
    group: 'Bookings'
  },
  // Jobs
  {
    type: 'job_application',
    category: 'jobMatches',
    smsCategory: null,
    priority: 'high',
    description: 'New job application',
    group: 'Jobs'
  },
  {
    type: 'application_status_update',
    category: 'jobMatches',
    smsCategory: null,
    priority: 'high',
    description: 'Application status update',
    group: 'Jobs'
  },
  {
    type: 'job_posted',
    category: 'jobMatches',
    smsCategory: null,
    priority: 'medium',
    description: 'New job posted',
    group: 'Jobs'
  },
  {
    type: 'job_digest',
    category: 'jobMatches',
    smsCategory: null,
    priority: 'low',
    description: 'Job digest',
    group: 'Jobs'
  },
  {
    type: 'job_application_followup',
    category: 'jobMatches',
    smsCategory: null,
    priority: 'medium',
    description: 'Job application follow-up',
    group: 'Jobs'
  },
  // Messages
  {
    type: 'message_received',
    category: 'newMessages',
    smsCategory: 'urgentMessages',
    priority: 'medium',
    description: 'New message received',
    group: 'Messages'
  },
  {
    type: 'message_moderation_flag',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Message moderation flag',
    group: 'Messages'
  },
  {
    type: 'message_policy_warning',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Message policy warning',
    group: 'Messages'
  },
  // Payments
  {
    type: 'payment_received',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'high',
    description: 'Payment received',
    group: 'Payments'
  },
  {
    type: 'payment_failed',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'urgent',
    description: 'Payment failed',
    group: 'Payments'
  },
  // Subscriptions
  {
    type: 'subscription_renewal',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'medium',
    description: 'Subscription renewal',
    group: 'Subscriptions'
  },
  {
    type: 'subscription_cancelled',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'high',
    description: 'Subscription cancelled',
    group: 'Subscriptions'
  },
  {
    type: 'subscription_dunning_reminder',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'medium',
    description: 'Subscription dunning reminder',
    group: 'Subscriptions'
  },
  {
    type: 'subscription_expiring_soon',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'medium',
    description: 'Subscription expiring soon',
    group: 'Subscriptions'
  },
  // Referrals
  {
    type: 'referral_reward',
    category: 'referralUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Referral reward',
    group: 'Referrals'
  },
  {
    type: 'referral_tier_upgraded',
    category: 'referralUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Referral tier upgraded',
    group: 'Referrals'
  },
  {
    type: 'referral_nudge',
    category: 'referralUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Referral nudge',
    group: 'Referrals'
  },
  // Academy
  {
    type: 'course_enrollment',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Course enrollment',
    group: 'Academy'
  },
  {
    type: 'academy_not_started',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Academy course not started',
    group: 'Academy'
  },
  {
    type: 'academy_progress_stalled',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Academy progress stalled',
    group: 'Academy'
  },
  {
    type: 'academy_certificate_pending',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Academy certificate pending',
    group: 'Academy'
  },
  // Orders
  {
    type: 'order_confirmation',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Order confirmation',
    group: 'Orders'
  },
  {
    type: 'order_payment_pending',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'medium',
    description: 'Order payment pending',
    group: 'Orders'
  },
  {
    type: 'order_sla_alert',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Order SLA alert',
    group: 'Orders'
  },
  {
    type: 'order_delivery_confirmation',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Order delivery confirmation',
    group: 'Orders'
  },
  {
    type: 'order_delivery_late_alert',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'high',
    description: 'Order delivery late alert',
    group: 'Orders'
  },
  {
    type: 'order_auto_delivered',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Order auto-delivered',
    group: 'Orders'
  },
  {
    type: 'supplies_reorder_reminder',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Supplies reorder reminder',
    group: 'Orders'
  },
  // Rentals
  {
    type: 'rental_due_soon',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Rental due soon',
    group: 'Rentals'
  },
  {
    type: 'rental_overdue',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'high',
    description: 'Rental overdue',
    group: 'Rentals'
  },
  // Finance
  {
    type: 'loan_repayment_due',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'medium',
    description: 'Loan repayment due',
    group: 'Finance'
  },
  {
    type: 'loan_repayment_overdue',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'high',
    description: 'Loan repayment overdue',
    group: 'Finance'
  },
  {
    type: 'salary_advance_due',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'medium',
    description: 'Salary advance due',
    group: 'Finance'
  },
  {
    type: 'salary_advance_overdue',
    category: 'paymentUpdates',
    smsCategory: 'paymentAlerts',
    priority: 'high',
    description: 'Salary advance overdue',
    group: 'Finance'
  },
  // Escrow
  {
    type: 'escrow_dispute_unresolved',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'high',
    description: 'Escrow dispute unresolved',
    group: 'Escrow'
  },
  {
    type: 'escrow_dispute_evidence_needed',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'medium',
    description: 'Escrow dispute evidence needed',
    group: 'Escrow'
  },
  // Support
  {
    type: 'livechat_sla_alert',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'high',
    description: 'Live chat SLA alert',
    group: 'Support'
  },
  // System
  {
    type: 'system_announcement',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'System announcement',
    group: 'System'
  },
  // Security
  {
    type: 'security_alert',
    category: 'systemUpdates',
    smsCategory: 'securityAlerts',
    priority: 'urgent',
    description: 'Security alert',
    group: 'Security'
  },
  {
    type: 'login_alert',
    category: 'systemUpdates',
    smsCategory: 'securityAlerts',
    priority: 'high',
    description: 'Login alert',
    group: 'Security'
  },
  // Marketing
  {
    type: 'marketing_reengagement',
    category: 'marketing',
    smsCategory: null,
    priority: 'low',
    description: 'Marketing re-engagement',
    group: 'Marketing'
  },
  {
    type: 'marketing_weekly_digest',
    category: 'marketing',
    smsCategory: null,
    priority: 'low',
    description: 'Marketing weekly digest',
    group: 'Marketing'
  },
  // Onboarding
  {
    type: 'welcome_followup_day2',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Welcome follow-up day 2',
    group: 'Onboarding'
  },
  {
    type: 'welcome_followup_day7',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Welcome follow-up day 7',
    group: 'Onboarding'
  },
  {
    type: 'provider_activation_nudge',
    category: 'systemUpdates',
    smsCategory: null,
    priority: 'low',
    description: 'Provider activation nudge',
    group: 'Onboarding'
  }
];

// Helper functions for frontend use
export const getNotificationTypeConfig = (type: NotificationType): NotificationTypeConfig | undefined => {
  return NOTIFICATION_TYPES.find(nt => nt.type === type);
};

export const getNotificationsByGroup = (group: NotificationGroup): NotificationTypeConfig[] => {
  return NOTIFICATION_TYPES.filter(nt => nt.group === group);
};

export const getNotificationsByCategory = (category: NotificationCategory): NotificationTypeConfig[] => {
  return NOTIFICATION_TYPES.filter(nt => nt.category === category);
};

export const getNotificationsByPriority = (priority: NotificationPriority): NotificationTypeConfig[] => {
  return NOTIFICATION_TYPES.filter(nt => nt.priority === priority);
};

// Category labels for UI
export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  bookingUpdates: 'Booking Updates',
  jobMatches: 'Job Matches',
  newMessages: 'New Messages',
  paymentUpdates: 'Payment Updates',
  referralUpdates: 'Referral Updates',
  systemUpdates: 'System Updates',
  marketing: 'Marketing'
};

// SMS Category labels for UI
export const SMS_CATEGORY_LABELS: Record<NonNullable<SmsCategory>, string> = {
  bookingReminders: 'Booking Reminders',
  urgentMessages: 'Urgent Messages',
  paymentAlerts: 'Payment Alerts',
  securityAlerts: 'Security Alerts'
};

// Priority labels for UI
export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

