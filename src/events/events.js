/**
 * Application Event Constants
 *
 * All event names used by the internal event bus in one place.
 * Import this file instead of hard-coding string literals:
 *
 *   const EVENTS = require('./events');
 *   eventBus.emit(EVENTS.JOB_COMPLETED, payload);
 *
 * Convention: `DOMAIN_ACTION` — past-tense action.
 */

const EVENTS = Object.freeze({
  // ── Auth ────────────────────────────────────────────────────────────────────
  USER_REGISTERED:              'user.registered',
  USER_LOGGED_IN:               'user.logged_in',
  USER_PASSWORD_RESET:          'user.password_reset',
  USER_VERIFIED:                'user.verified',
  USER_DEACTIVATED:             'user.deactivated',

  // ── Jobs ────────────────────────────────────────────────────────────────────
  JOB_CREATED:                  'job.created',
  JOB_APPLIED:                  'job.applied',
  JOB_ACCEPTED:                 'job.accepted',
  JOB_COMPLETED:                'job.completed',
  JOB_CANCELLED:                'job.cancelled',
  JOB_DISPUTED:                 'job.disputed',

  // ── Marketplace ─────────────────────────────────────────────────────────────
  BOOKING_CREATED:              'marketplace.booking_created',
  BOOKING_CONFIRMED:            'marketplace.booking_confirmed',
  BOOKING_COMPLETED:            'marketplace.booking_completed',
  BOOKING_CANCELLED:            'marketplace.booking_cancelled',
  BOOKING_NO_SHOW:              'marketplace.booking_no_show',

  // ── Finance / Payments ───────────────────────────────────────────────────────
  PAYMENT_RECEIVED:             'finance.payment_received',
  PAYMENT_FAILED:               'finance.payment_failed',
  PAYOUT_PROCESSED:             'finance.payout_processed',
  WALLET_CREDITED:              'finance.wallet_credited',
  WALLET_DEBITED:               'finance.wallet_debited',
  ESCROW_FUNDED:                'finance.escrow_funded',
  ESCROW_RELEASED:              'finance.escrow_released',
  ESCROW_DISPUTED:              'finance.escrow_disputed',
  INVOICE_CREATED:              'finance.invoice_created',
  INVOICE_PAID:                 'finance.invoice_paid',

  // ── Referrals ────────────────────────────────────────────────────────────────
  REFERRAL_CONVERTED:           'referral.converted',
  REFERRAL_MILESTONE_REACHED:   'referral.milestone_reached',

  // ── Provider ─────────────────────────────────────────────────────────────────
  PROVIDER_VERIFIED:            'provider.verified',
  PROVIDER_SUSPENDED:           'provider.suspended',
  PROVIDER_PROFILE_UPDATED:     'provider.profile_updated',

  // ── Academy ──────────────────────────────────────────────────────────────────
  COURSE_ENROLLED:              'academy.course_enrolled',
  COURSE_COMPLETED:             'academy.course_completed',
  CERTIFICATE_ISSUED:           'academy.certificate_issued',

  // ── Supplies ─────────────────────────────────────────────────────────────────
  ORDER_PLACED:                 'supplies.order_placed',
  ORDER_SHIPPED:                'supplies.order_shipped',
  ORDER_DELIVERED:              'supplies.order_delivered',
  ORDER_CANCELLED:              'supplies.order_cancelled',
  LOW_STOCK_ALERT:              'supplies.low_stock_alert',

  // ── Rentals ──────────────────────────────────────────────────────────────────
  RENTAL_STARTED:               'rentals.started',
  RENTAL_OVERDUE:               'rentals.overdue',
  RENTAL_RETURNED:              'rentals.returned',

  // ── Scheduling ───────────────────────────────────────────────────────────────
  APPOINTMENT_BOOKED:           'scheduling.appointment_booked',
  APPOINTMENT_RESCHEDULED:      'scheduling.appointment_rescheduled',
  APPOINTMENT_CANCELLED:        'scheduling.appointment_cancelled',

  // ── Support ───────────────────────────────────────────────────────────────────
  TICKET_CREATED:               'support.ticket_created',
  TICKET_RESOLVED:              'support.ticket_resolved',
  TICKET_ESCALATED:             'support.ticket_escalated',

  // ── Feeds ────────────────────────────────────────────────────────────────────
  FEED_POST_CREATED:            'feeds.post_created',
  FEED_POST_LIKED:              'feeds.post_liked',
  FEED_COMMENT_ADDED:           'feeds.comment_added',

  // ── Notifications (cross-cutting) ────────────────────────────────────────────
  NOTIFICATION_SEND:            'notification.send',
  EMAIL_SEND:                   'email.send',
  SMS_SEND:                     'sms.send',
  PUSH_SEND:                    'push.send',

  // ── System ───────────────────────────────────────────────────────────────────
  APP_STARTED:                  'system.app_started',
  APP_SHUTDOWN:                 'system.app_shutdown',
});

module.exports = EVENTS;
