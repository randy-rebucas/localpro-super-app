# 🤖 LocalPro Super App — Automation Catalog

This is the **single source of truth** for all automations currently implemented in this repo: what they do, where they run, and how to configure them.

## How automations start

Most “automation services” start from `src/server.js` inside `initializeAutomatedServices()` and are controlled by **environment variables**.

Some monitoring automations start when their modules are loaded (interval timers).

---

## Automation Services (business + maintenance)

### 1) Automated Backups — `src/services/automatedBackupService.js`
- **What it does**: Scheduled DB backups + retention cleanup.
- **How it runs**: `node-cron` jobs (daily/weekly/monthly + daily cleanup).
- **Where it starts**: `src/server.js` (startup).
- **Enable**:
  - `ENABLE_AUTOMATED_BACKUPS=true`
- **Key config**:
  - `BACKUP_RETENTION_DAYS` (default 7)
  - `BACKUP_RETENTION_WEEKS` (default 4)
  - `BACKUP_RETENTION_MONTHS` (default 12)
  - `TZ` (timezone)
- **Notes**:
  - Backups are written to `backups/` (ignored in `.gitignore`).

---

### 2) Automated Booking Service — `src/services/automatedBookingService.js`
- **What it does**: Booking reminders, status transitions, review requests.
- **How it runs**: `node-cron` (multiple schedules).
- **Where it starts**: `src/server.js`.
- **Enable/disable**:
  - Enabled by default; set `ENABLE_AUTOMATED_BOOKINGS=false` to disable.

---

### 3) Automated Email Campaign Processor — `src/services/automatedCampaignProcessor.js`
- **What it does**: Sends scheduled + recurring email campaigns; retries failures.
- **How it runs**: `node-cron` (every few minutes + daily cleanup).
- **Where it starts**: `src/server.js`.
- **Enable/disable**:
  - Enabled by default; set `ENABLE_AUTOMATED_CAMPAIGNS=false` to disable.

---

### 4) Automated Subscription Service — `src/services/automatedSubscriptionService.js`
- **What it does**: Renewal reminders, auto-renewals, expirations/suspensions, reactivation offers.
- **How it runs**: `node-cron` (daily schedules).
- **Where it starts**: `src/server.js`.
- **Enable/disable**:
  - Enabled by default; set `ENABLE_AUTOMATED_SUBSCRIPTIONS=false` to disable.

---

### 5) Automated Escrow Service — `src/services/automatedEscrowService.js`
- **What it does**: Escrow capture/release/payout/refund workflows; flags stuck escrows.
- **How it runs**: `node-cron` (hourly/6h/12h + daily).
- **Where it starts**: `src/server.js`.
- **Enable/disable**:
  - Enabled by default; set `ENABLE_AUTOMATED_ESCROWS=false` to disable.

---

### 6) Automated Log + Audit Cleanup — `src/services/automatedLogCleanupService.js`
- **What it does**:
  - Deletes expired DB logs (Log collection)
  - Deletes expired audit logs (AuditLog collection)
- **How it runs**: `node-cron`.
- **Where it starts**: `src/server.js`.
- **Enable/disable**:
  - Enabled by default; set `ENABLE_AUTOMATED_CLEANUP=false` to disable.
- **Key config**:
  - `LOG_CLEANUP_SCHEDULE` (cron; default in `env.example`: `0 2 * * *`)
  - `AUDIT_CLEANUP_SCHEDULE` (cron; default in `env.example`: `0 2 * * *`)
  - `AUDIT_AUTO_CLEANUP` (default: true unless set to `false`)
  - `TZ`
- **Notes**:
  - DB Log entries also have a TTL index, but this service gives deterministic cleanup + explicit logs/metrics.

---

### 7) Automated Index Management — `src/services/automatedIndexManagementService.js`
- **What it does**: Automates index creation/maintenance by running existing scripts:
  - `scripts/create-database-indexes.js`
  - optional `scripts/create-slow-query-indexes.js`
- **How it runs**:
  - optional run at startup
  - scheduled run via `node-cron`
- **Where it starts**: `src/server.js`.
- **Enable**:
  - Startup run: `VALIDATE_INDEXES_ON_STARTUP=true`
  - Scheduled runs: `ENABLE_AUTOMATED_INDEXES=true`
- **Key config**:
  - `INDEX_MAINTENANCE_SCHEDULE` (default in `env.example`: `0 4 * * *`)
  - `ENABLE_SLOW_QUERY_INDEXES=true|false`
  - `TZ`
- **Notes**:
  - This turns “manual deployment steps” into background maintenance.

---

### 8) Automated Payment Status Sync (PayPal + PayMongo) — `src/services/automatedPaymentSyncService.js`
- **What it does**: Hourly reconciliation for “stuck / missed webhook” payments.
  - **PayPal**: reads order state via `PayPalService.getOrder(orderId)` and updates:
    - Marketplace `Booking.payment.status`
    - Supplies `Order.payment.status`
    - Finance `Transaction.status`
    - LocalPro Plus `Payment.status`
  - **PayMongo**: reads payment intent state via `paymongoService.getPaymentIntent(intentId)` and updates:
    - LocalPro Plus `Payment.status`
- **How it runs**: `node-cron`.
- **Where it starts**: `src/server.js`.
- **Enable**:
  - `ENABLE_AUTOMATED_PAYMENT_SYNC=true` (default: false)
- **Key config**:
  - `PAYMENT_SYNC_SCHEDULE` (default hourly: `0 * * * *`)
  - `PAYMENT_SYNC_MAX_CONCURRENCY` (default: 5)
  - `PAYMENT_SYNC_ON_STARTUP=true|false`
  - `TZ`
- **Safety note**:
  - This is **status synchronization only**. It does **not** auto-capture PayPal orders.

---

### 9) Automated Lifecycle Marketing (opt-in) — `src/services/automatedLifecycleMarketingService.js`
- **What it does**: Runs lifecycle marketing automations using the existing Email Marketing system (campaigns, tracking, unsubscribe links).
- **How it runs**: `node-cron`.
- **Where it starts**: `src/server.js`.
- **Enable (master switch)**:
  - `ENABLE_AUTOMATED_MARKETING=true`
- **Current automation implemented**:
  - **Inactive user re-engagement (email)**:
    - Requires explicit opt-in via `UserSettings.notifications.email.marketing=true`
    - Creates/uses `EmailSubscriber` records (status `subscribed`)
    - Sends a `re_engagement` campaign using the `promotional` email template
    - Cooldown enforced per subscriber
- **Config**:
  - `ENABLE_AUTOMATED_MARKETING_REENGAGEMENT=true`
  - `MARKETING_REENGAGEMENT_SCHEDULE` (cron; default `15 10 * * *`)
  - `MARKETING_INACTIVE_DAYS` (default 30)
  - `MARKETING_REENGAGEMENT_COOLDOWN_DAYS` (default 14)
  - `MARKETING_REENGAGEMENT_DAILY_LIMIT` (default 200)
  - `MARKETING_REENGAGEMENT_SUBJECT` (optional)
  - `TZ`

- **Additional automation implemented**:
  - **Weekly digest (email)**:
    - Targets users with `UserSettings.notifications.email.weeklyDigest=true` and `EmailSubscriber.preferences.weeklyDigest=true`
    - Cooldown enforced per subscriber
    - Sends a `digest` campaign using the `digest` email template
  - **Config**:
    - `ENABLE_AUTOMATED_MARKETING_WEEKLY_DIGEST=true`
    - `MARKETING_WEEKLY_DIGEST_SCHEDULE` (cron; default `0 9 * * 1`)
    - `MARKETING_WEEKLY_DIGEST_COOLDOWN_DAYS` (default 6)
    - `MARKETING_WEEKLY_DIGEST_DAILY_LIMIT` (default 500)
    - `MARKETING_WEEKLY_DIGEST_SUBJECT` (optional)

  - **Welcome series follow-ups (email)**:
    - Sends follow-up emails to new users on **Day 2** and **Day 7**
    - Opt-in: `UserSettings.notifications.email.systemUpdates=true` + `notifications.email.enabled=true`
    - Cooldown enforced per subscriber (`lastWelcomeDay2SentAt`, `lastWelcomeDay7SentAt`)
    - **Config**:
      - `ENABLE_AUTOMATED_MARKETING_WELCOME_SERIES=true`
      - `MARKETING_WELCOME_SERIES_SCHEDULE` (cron; default `30 11 * * *`)
      - `MARKETING_WELCOME_SERIES_DAILY_LIMIT` (default 300)
      - `MARKETING_WELCOME_SERIES_COOLDOWN_DAYS` (default 30)
      - `MARKETING_WELCOME_DAY2_SUBJECT`
      - `MARKETING_WELCOME_DAY7_SUBJECT`

  - **Abandoned booking/payment nudges (email)**:
    - Targets marketplace bookings stuck in `status=pending` + `payment.status=pending`
    - Opt-in: `UserSettings.notifications.email.bookingUpdates=true` + `notifications.email.enabled=true`
    - Cooldown enforced per subscriber (`lastAbandonedBookingNudgeAt`)
    - **Config**:
      - `ENABLE_AUTOMATED_MARKETING_ABANDONED_BOOKING=true`
      - `MARKETING_ABANDONED_BOOKING_SCHEDULE` (cron; default `0 */2 * * *`)
      - `MARKETING_ABANDONED_BOOKING_MIN_AGE_MINUTES` (default 60)
      - `MARKETING_ABANDONED_BOOKING_MAX_AGE_DAYS` (default 7)
      - `MARKETING_ABANDONED_BOOKING_LIMIT` (default 200)
      - `MARKETING_ABANDONED_BOOKING_COOLDOWN_DAYS` (default 3)
      - `MARKETING_ABANDONED_BOOKING_SUBJECT`

  - **Referral nudges (email)**:
    - Targets users with no referrals yet; ensures a referral code exists
    - Opt-in: `UserSettings.notifications.email.referralUpdates=true` + `notifications.email.enabled=true`
    - Cooldown enforced per subscriber (`lastReferralNudgeSentAt`)
    - **Config**:
      - `ENABLE_AUTOMATED_MARKETING_REFERRAL_NUDGE=true`
      - `MARKETING_REFERRAL_NUDGE_SCHEDULE` (cron; default `0 13 * * *`)
      - `MARKETING_REFERRAL_MIN_ACCOUNT_AGE_DAYS` (default 14)
      - `MARKETING_REFERRAL_NUDGE_DAILY_LIMIT` (default 200)
      - `MARKETING_REFERRAL_NUDGE_COOLDOWN_DAYS` (default 14)
      - `MARKETING_REFERRAL_NUDGE_SUBJECT`

  - **Provider activation nudges (email)**:
    - Targets providers (role `provider`) who have **zero services** published/created
    - Opt-in: `UserSettings.notifications.email.systemUpdates=true` + `notifications.email.enabled=true`
    - Cooldown enforced per subscriber (`lastProviderActivationSentAt`)
    - **Config**:
      - `ENABLE_AUTOMATED_MARKETING_PROVIDER_ACTIVATION=true`
      - `MARKETING_PROVIDER_ACTIVATION_SCHEDULE` (cron; default `30 13 * * *`)
      - `MARKETING_PROVIDER_ACTIVATION_MIN_ACCOUNT_AGE_DAYS` (default 7)
      - `MARKETING_PROVIDER_ACTIVATION_DAILY_LIMIT` (default 200)
      - `MARKETING_PROVIDER_ACTIVATION_COOLDOWN_DAYS` (default 14)
      - `MARKETING_PROVIDER_ACTIVATION_SUBJECT`

  - **Subscription churn prevention (email)**:
    - Targets active subscriptions ending soon (default: **3 days before endDate**)
    - Opt-in: `UserSettings.notifications.email.paymentUpdates=true` + `notifications.email.enabled=true`
    - Cooldown enforced per subscriber (`lastChurnPreventionSentAt`)
    - **Config**:
      - `ENABLE_AUTOMATED_MARKETING_CHURN_PREVENTION=true`
      - `MARKETING_CHURN_PREVENTION_SCHEDULE` (cron; default `0 14 * * *`)
      - `MARKETING_CHURN_DAYS_BEFORE` (default 3)
      - `MARKETING_CHURN_DAILY_LIMIT` (default 200)
      - `MARKETING_CHURN_COOLDOWN_DAYS` (default 7)
      - `MARKETING_CHURN_SUBJECT`

---

### 10) Automated Messaging Nudges — `src/services/automatedMessagingNudgeService.js`
- **What it does**: Sends reminders for **unread messages** in active conversations after a configurable delay.
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_MESSAGE_NUDGES=true`
- **Config**:
  - `MESSAGE_NUDGE_SCHEDULE` (default `*/30 * * * *`)
  - `MESSAGE_NUDGE_MIN_AGE_MINUTES` (default 60)
  - `MESSAGE_NUDGE_DEDUP_MINUTES` (default 360)
  - `MESSAGE_NUDGE_MAX_CONVERSATIONS` (default 200)
  - `MESSAGE_NUDGE_MAX_NOTIFICATIONS` (default 500)
- **Notes**:
  - Uses `NotificationService.sendMessageNotification()` so it respects user notification preferences.

---

### 11) Automated Orders Automations (Supplies) — `src/services/automatedOrdersAutomationService.js`
- **What it does**:
  - **Abandoned payment nudges** for orders with `payment.status=pending`
  - **Processing SLA alerts** for orders stuck in `status=processing` too long
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable (master switch)**:
  - `ENABLE_AUTOMATED_ORDERS_AUTOMATIONS=true`
- **Abandoned payment nudge config**:
  - `ENABLE_AUTOMATED_ORDER_ABANDONED_PAYMENT=true`
  - `ORDER_ABANDONED_PAYMENT_SCHEDULE` (default `0 */2 * * *`)
  - `ORDER_ABANDONED_MIN_AGE_MINUTES` (default 60)
  - `ORDER_ABANDONED_MAX_AGE_DAYS` (default 7)
  - `ORDER_ABANDONED_LIMIT` (default 200)
  - `ORDER_ABANDONED_DEDUP_HOURS` (default 24)
- **SLA alert config**:
  - `ENABLE_AUTOMATED_ORDER_SLA_ALERTS=true`
  - `ORDER_SLA_SCHEDULE` (default `15 9 * * *`)
  - `ORDER_PROCESSING_SLA_DAYS` (default 3)
  - `ORDER_SLA_LIMIT` (default 200)
  - `ORDER_SLA_DEDUP_HOURS` (default 24)
  - `ORDER_SLA_NOTIFY_ADMINS=true|false` (default false)
- **Notes**:
  - Sends notifications only (no automatic status changes).

---

### 12) Automated Finance Reminders — `src/services/automatedFinanceReminderService.js`
- **What it does**:
  - Loan repayment **due soon** reminders + **overdue** alerts
  - Salary advance **due soon** reminders + **overdue** alerts
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_FINANCE_REMINDERS=true`
- **Config**:
  - `FINANCE_REMINDER_SCHEDULE` (default `0 10 * * *`)
  - `FINANCE_REMINDER_DAYS_BEFORE` (default 3)
  - `FINANCE_REMINDER_DEDUP_HOURS` (default 24)
  - `FINANCE_REMINDER_LOAN_LIMIT` (default 300)
  - `FINANCE_REMINDER_ADVANCE_LIMIT` (default 300)
- **Notes**:
  - Notifications only (no debits or state changes).

---

### 13) Automated Rental Reminders — `src/services/automatedRentalReminderService.js`
- **What it does**:
  - Rental **due soon** reminders (default: 1 day before end)
  - Rental **overdue** reminders (after endDate for active rentals)
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_RENTAL_REMINDERS=true`
- **Config**:
  - `RENTAL_REMINDER_SCHEDULE` (default `0 9 * * *`)
  - `RENTAL_DUE_SOON_DAYS_BEFORE` (default 1)
  - `RENTAL_REMINDER_DEDUP_HOURS` (default 24)
  - `RENTAL_REMINDER_LIMIT` (default 300)
  - `RENTAL_REMINDER_NOTIFY_OWNER=true|false` (default false)

---

### 14) Automated Job Board Digest — `src/services/automatedJobBoardDigestService.js`
- **What it does**: Sends a periodic digest notifying users about **new active jobs** posted in the last N days.
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_JOB_DIGEST=true`
- **Config**:
  - `JOB_DIGEST_SCHEDULE` (default `0 9 * * 1`)
  - `JOB_DIGEST_LOOKBACK_DAYS` (default 7)
  - `JOB_DIGEST_DEDUP_DAYS` (default 6)
  - `JOB_DIGEST_MAX_USERS` (default 1000)
- **Notes**:
  - Uses `NotificationService` and notification type `job_digest` (respects user settings under `jobMatches`).

---

### 15) Automated Academy Engagement — `src/services/automatedAcademyEngagementService.js`
- **What it does**:
  - Nudges students who **enrolled but haven’t started**
  - Nudges students whose **progress stalled**
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT=true`
- **Config**:
  - `ACADEMY_ENGAGEMENT_SCHEDULE` (default `30 9 * * *`)
  - `ACADEMY_NOT_STARTED_DAYS` (default 3)
  - `ACADEMY_STALLED_DAYS` (default 5)
  - `ACADEMY_ENGAGEMENT_LIMIT` (default 300)
  - `ACADEMY_ENGAGEMENT_DEDUP_DAYS` (default 3)
- **Notes**:
  - Uses notification types `academy_not_started` and `academy_progress_stalled`.

---

### 16) Automated Live Chat SLA Alerts — `src/services/automatedLiveChatSlaService.js`
- **What it does**: Alerts admins when a **pending live chat** has been waiting longer than X minutes.
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_LIVECHAT_SLA=true`
- **Config**:
  - `LIVECHAT_SLA_SCHEDULE` (default `*/5 * * * *`)
  - `LIVECHAT_SLA_WAIT_MINUTES` (default 10)
  - `LIVECHAT_SLA_LIMIT` (default 50)
  - `LIVECHAT_SLA_DEDUP_MINUTES` (default 30)

---

### 17) Marketplace Booking Follow-ups — `src/services/automatedMarketplaceBookingFollowUpService.js`
- **What it does**:
  - Provider confirmation reminder when a booking stays `pending` for too long
  - “Booking soon” reminder when a `pending` booking is within a time window
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=true`
- **Config**:
  - `BOOKING_FOLLOWUP_SCHEDULE` (default `*/30 * * * *`)
  - `BOOKING_PENDING_CONFIRMATION_HOURS` (default 2)
  - `BOOKING_SOON_HOURS` (default 24)
  - `BOOKING_FOLLOWUP_DEDUP_MINUTES` (default 360)
  - `BOOKING_FOLLOWUP_LIMIT` (default 300)
- **Notes**:
  - Uses notification types `booking_confirmation_needed` and `booking_pending_soon`.
  - Notifications only (no automatic state changes).

---

### 18) Supplies Fulfillment / Delivery Confirmation — `src/services/automatedSuppliesFulfillmentService.js`
- **What it does**:
  - Sends **delivery confirmation request** for orders stuck in `status=shipped`
  - Optional **admin alert** for very late deliveries
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable (master switch)**:
  - `ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT=true`
- **Enable (sub-features)**:
  - `ENABLE_AUTOMATED_SUPPLIES_DELIVERY_CONFIRMATION=true`
  - `ENABLE_AUTOMATED_SUPPLIES_LATE_DELIVERY_ALERTS=true`
- **Config**:
  - `SUPPLIES_DELIVERY_CONFIRMATION_SCHEDULE` (default `0 */6 * * *`)
  - `SUPPLIES_DELIVERY_DEDUP_HOURS` (default 24)
  - `SUPPLIES_DELIVERY_MAX_SHIPPED_DAYS` (default 14)
  - `SUPPLIES_DELIVERY_LIMIT` (default 300)
  - `SUPPLIES_LATE_DELIVERY_SCHEDULE` (default `30 9 * * *`)
  - `SUPPLIES_LATE_DELIVERY_DAYS` (default 7)
  - `SUPPLIES_LATE_DELIVERY_DEDUP_HOURS` (default 24)
  - `SUPPLIES_LATE_DELIVERY_LIMIT` (default 200)
- **Notes**:
  - Uses notification types `order_delivery_confirmation` and `order_delivery_late_alert`.
  - Notifications only (no automatic state changes).

---

### 19) Academy Certificates (admin alerts) — `src/services/automatedAcademyCertificateService.js`
- **What it does**: Alerts admins when a completed enrollment has no certificate issued.
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_ACADEMY_CERTIFICATES=true`
- **Config**:
  - `ACADEMY_CERTIFICATE_SCHEDULE` (default `0 11 * * *`)
  - `ACADEMY_CERTIFICATE_DEDUP_HOURS` (default 24)
  - `ACADEMY_CERTIFICATE_LIMIT` (default 200)
  - `ACADEMY_CERTIFICATE_MIN_COMPLETED_DAYS` (default 0)
- **Notes**:
  - Uses notification type `academy_certificate_pending`.
  - Notifications only (no automatic certificate generation).

---

### 20) Job Application Follow-ups — `src/services/automatedJobApplicationFollowUpService.js`
- **What it does**: Reminds employers to review applications that stayed `pending` past N days.
- **How it runs**: `node-cron`
- **Where it starts**: `src/server.js`
- **Enable**:
  - `ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS=true`
- **Config**:
  - `JOB_APPLICATION_FOLLOWUP_SCHEDULE` (default `0 10 * * *`)
  - `JOB_APPLICATION_PENDING_DAYS` (default 7)
  - `JOB_APPLICATION_FOLLOWUP_DEDUP_HOURS` (default 24)
  - `JOB_APPLICATION_FOLLOWUP_LIMIT` (default 300)
- **Notes**:
  - Uses notification type `job_application_followup`.
  - Notifications only (no automatic status updates).

---

## Monitoring / Observability Automations

These aren’t “business workflows”, but they run automatically and can affect logs/CPU/memory.

### 21) System Metrics Collection — `src/middleware/metricsMiddleware.js`
- **What it does**: Collects Prometheus metrics on an interval:
  - process memory (`rss`, `heapUsed`, `heapTotal`, `external`)
  - system RAM percent (`system_memory_usage_percent`)
  - CPU usage, disk usage, DB connections (best-effort)
- **How it runs**: `setInterval(collectSystemMetrics, 30000)`
- **Notes**: Skips in `NODE_ENV=test`.

---

### 22) Alert Monitoring (Performance Alerts) — `src/routes/alerts.js`
- **What it does**:
  - Runs `checkAlerts()` on an interval
  - Logs “Performance Alert …” (deduped)
  - Maintains an in-memory alert history (bounded)
- **How it runs**: module-level `setInterval` when the router module loads.
- **Enable/disable**:
  - `ENABLE_ALERT_MONITORING=false` disables the background checker.
- **Key config**:
  - Interval: `ALERT_CHECK_INTERVAL_MS` (default 60000)
  - Log dedupe window: `ALERT_DEDUP_WINDOW_MS` (default 600000)
  - Heap alerts:
    - `ALERT_HEAP_USAGE_RATIO` (default 0.9)
    - `ALERT_HEAP_MIN_TOTAL_MB` (default 128)
  - RSS alert: `ALERT_RSS_MB` (0 disables)
  - System RAM alert: `ALERT_SYSTEM_MEMORY_PERCENT` (0 disables)
  - CPU: `ALERT_CPU_PERCENT`
  - Active connections: `ALERT_ACTIVE_CONNECTIONS`
  - Error rate: `ALERT_ERROR_RATE_PER_MIN`
  - Response time: `ALERT_RESPONSE_TIME_MS`
- **Notes**:
  - The heap ratio alert can be noisy at small heap sizes; the `ALERT_HEAP_MIN_TOTAL_MB` gate reduces that.

---

## CI/CD Automation (GitHub → Render)

### 23) CI pipeline + Render deploy hook — `.github/workflows/ci-cd.yml`
- **What it does**:
  - Runs lint + tests + env validation
  - Triggers Render deployment on `main` (after CI passes)
- **Required GitHub secret**:
  - `RENDER_DEPLOY_HOOK_URL`

---

## Additional “Suggested” Automations (newly implemented)

### Escrow Dispute Escalation — `src/services/automatedEscrowDisputeEscalationService.js`
- **What it does**:
  - Alerts admins if a dispute remains unresolved after N days
  - Nudges client/provider to add evidence if none exists after X hours
- **Enable**:
  - `ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS=true`
- **Config**:
  - `ESCROW_DISPUTE_ADMIN_SCHEDULE`, `ESCROW_DISPUTE_ADMIN_UNRESOLVED_DAYS`, `ESCROW_DISPUTE_ADMIN_DEDUP_HOURS`, `ESCROW_DISPUTE_ADMIN_LIMIT`
  - `ESCROW_DISPUTE_PARTY_SCHEDULE`, `ESCROW_DISPUTE_PARTY_EVIDENCE_AFTER_HOURS`, `ESCROW_DISPUTE_PARTY_DEDUP_HOURS`, `ESCROW_DISPUTE_PARTY_LIMIT`

### Supplies Auto-Deliver (optional) — `src/services/automatedSuppliesFulfillmentService.js`
- **What it does**: Marks long-shipped **paid** orders as `delivered` and sets `shipping.actualDelivery`.
- **Enable**:
  - `ENABLE_AUTOMATED_SUPPLIES_AUTO_DELIVER=true`
- **Config**:
  - `SUPPLIES_AUTO_DELIVER_SCHEDULE`, `SUPPLIES_AUTO_DELIVER_AFTER_DAYS`, `SUPPLIES_AUTO_DELIVER_LIMIT`
- **Note**: This **changes order state**; keep it off until you’re comfortable.

### Referral Tier Milestones — `src/services/automatedReferralTierMilestoneService.js`
- **What it does**: Notifies users when their referral tier is upgraded (silver/gold/platinum).
- **Enable**:
  - `ENABLE_AUTOMATED_REFERRAL_TIER_MILESTONES=true`
- **Config**:
  - `REFERRAL_TIER_SCHEDULE`, `REFERRAL_TIER_LOOKBACK_DAYS`, `REFERRAL_TIER_DEDUP_DAYS`, `REFERRAL_TIER_LIMIT`

### Marketplace No-Show / Overdue Booking Detection — `src/services/automatedMarketplaceNoShowService.js`
- **What it does**: Flags bookings that should have ended but are still `confirmed`/`in_progress`, and notifies parties (and optionally admins).
- **Enable**:
  - `ENABLE_AUTOMATED_BOOKING_NO_SHOW=true`
- **Config**:
  - `BOOKING_NO_SHOW_SCHEDULE`, `BOOKING_NO_SHOW_GRACE_MINUTES`, `BOOKING_NO_SHOW_LOOKBACK_HOURS`
  - `BOOKING_NO_SHOW_DEDUP_HOURS`, `BOOKING_NO_SHOW_LIMIT`, `BOOKING_NO_SHOW_NOTIFY_ADMINS`

### Supplies Reorder Reminders — `src/services/automatedSuppliesReorderReminderService.js`
- **What it does**: Reminds customers to reorder supplies when it’s been N days since their last delivered order.
- **Enable**:
  - `ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS=true`
- **Config**:
  - `SUPPLIES_REORDER_SCHEDULE`, `SUPPLIES_REORDER_DAYS_SINCE_LAST`, `SUPPLIES_REORDER_DEDUP_DAYS`, `SUPPLIES_REORDER_LIMIT`

### Messaging Moderation (contact leakage flags) — `src/services/automatedMessagingModerationService.js`
- **What it does**: Flags messages that appear to contain email/phone numbers and notifies admins (optional sender warning).
- **Enable**:
  - `ENABLE_AUTOMATED_MESSAGE_MODERATION=true`
- **Config**:
  - `MESSAGE_MODERATION_SCHEDULE`, `MESSAGE_MODERATION_LOOKBACK_MINUTES`, `MESSAGE_MODERATION_DEDUP_HOURS`, `MESSAGE_MODERATION_LIMIT`, `MESSAGE_MODERATION_WARN_SENDER`

### LocalPro Plus Dunning Reminders — `src/services/automatedLocalProPlusDunningService.js`
- **What it does**: Sends follow-up reminders for recently inactive subscriptions (best-effort).
- **Enable**:
  - `ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING=true`
- **Config**:
  - `SUBSCRIPTION_DUNNING_SCHEDULE`, `SUBSCRIPTION_DUNNING_LOOKBACK_DAYS`, `SUBSCRIPTION_DUNNING_REMIND_DAYS`, `SUBSCRIPTION_DUNNING_DEDUP_HOURS`, `SUBSCRIPTION_DUNNING_LIMIT`

### Mobile-first Lifecycle Notifications (Option A) — `src/services/automatedLifecycleMobileNotificationsService.js`
- **What it does**: Mobile-first replacements for email-only lifecycle marketing; sends **in-app + push** via `NotificationService`.
- **Enable (master)**:
  - `ENABLE_AUTOMATED_MOBILE_LIFECYCLE=true`
- **Enable (per automation)**:
  - `ENABLE_MOBILE_REENGAGEMENT=true` (targets `push.marketing` opted-in inactive users)
  - `ENABLE_MOBILE_WEEKLY_DIGEST=true` (targets `push.marketing` opted-in users)
  - `ENABLE_MOBILE_WELCOME_FOLLOWUPS=true` (targets `push.systemUpdates` opted-in users)
  - `ENABLE_MOBILE_REFERRAL_NUDGES=true` (targets `push.referralUpdates` opted-in users)
  - `ENABLE_MOBILE_PROVIDER_ACTIVATION=true` (targets `push.systemUpdates` opted-in providers)
  - `ENABLE_MOBILE_SUBSCRIPTION_EXPIRING_SOON=true` (targets `push.paymentUpdates` opted-in users)
- **Notes**:
  - Requires Firebase + FCM tokens for push delivery; still creates in-app notifications.


