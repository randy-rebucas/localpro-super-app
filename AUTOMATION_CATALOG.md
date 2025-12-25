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

---

## Monitoring / Observability Automations

These aren’t “business workflows”, but they run automatically and can affect logs/CPU/memory.

### 10) System Metrics Collection — `src/middleware/metricsMiddleware.js`
- **What it does**: Collects Prometheus metrics on an interval:
  - process memory (`rss`, `heapUsed`, `heapTotal`, `external`)
  - system RAM percent (`system_memory_usage_percent`)
  - CPU usage, disk usage, DB connections (best-effort)
- **How it runs**: `setInterval(collectSystemMetrics, 30000)`
- **Notes**: Skips in `NODE_ENV=test`.

---

### 11) Alert Monitoring (Performance Alerts) — `src/routes/alerts.js`
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

### 12) CI pipeline + Render deploy hook — `.github/workflows/ci-cd.yml`
- **What it does**:
  - Runs lint + tests + env validation
  - Triggers Render deployment on `main` (after CI passes)
- **Required GitHub secret**:
  - `RENDER_DEPLOY_HOOK_URL`


