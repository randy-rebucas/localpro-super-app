const logger = require('./logger');

/**
 * Environment Variable Validation Schema
 * Defines required and optional environment variables with their validation rules
 */
const ENV_SCHEMA = {
  // Core Application Settings
  NODE_ENV: {
    required: true,
    type: 'string',
    validValues: ['development', 'production', 'test'],
    description: 'Application environment (development, production, test)'
  },
  PORT: {
    required: true,
    type: 'number',
    min: 1,
    max: 65535,
    description: 'Server port number'
  },
  FRONTEND_URL: {
    required: true,
    type: 'url',
    description: 'Frontend application URL for CORS'
  },
  TZ: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'Timezone for cron jobs (e.g., UTC, Asia/Manila)'
  },

  // Database Configuration
  MONGODB_URI: {
    required: true,
    type: 'string',
    pattern: /^mongodb(\+srv)?:\/\//,
    description: 'MongoDB connection string'
  },
  MONGODB_MAX_POOL_SIZE: {
    required: false,
    type: 'number',
    min: 1,
    max: 200,
    description: 'MongoDB max connection pool size'
  },
  MONGODB_MIN_POOL_SIZE: {
    required: false,
    type: 'number',
    min: 0,
    max: 200,
    description: 'MongoDB min connection pool size'
  },
  MONGODB_SERVER_SELECTION_TIMEOUT: {
    required: false,
    type: 'number',
    min: 1000,
    max: 600000,
    description: 'MongoDB server selection timeout (ms)'
  },
  MONGODB_SOCKET_TIMEOUT: {
    required: false,
    type: 'number',
    min: 1000,
    max: 600000,
    description: 'MongoDB socket timeout (ms)'
  },
  MONGODB_CONNECT_TIMEOUT: {
    required: false,
    type: 'number',
    min: 1000,
    max: 600000,
    description: 'MongoDB connect timeout (ms)'
  },
  MONGODB_READ_PREFERENCE: {
    required: false,
    type: 'string',
    validValues: ['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'],
    description: 'MongoDB read preference'
  },
  MONGODB_USER: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'MongoDB username (optional, if not embedded in URI)'
  },
  MONGODB_PASSWORD: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'MongoDB password (optional, if not embedded in URI)'
  },
  MONGODB_TLS: {
    required: false,
    type: 'boolean',
    description: 'Enable TLS for MongoDB connections (legacy flag)'
  },
  MONGODB_SSL: {
    required: false,
    type: 'boolean',
    description: 'Enable SSL/TLS for MongoDB connections (legacy flag)'
  },
  MONGODB_TLS_ALLOW_INVALID_CERTS: {
    required: false,
    type: 'boolean',
    description: 'Allow invalid MongoDB TLS certificates (NOT recommended)'
  },

  // JWT Configuration
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT secret key for token signing'
  },

  // Email Service Configuration
  EMAIL_SERVICE: {
    required: true,
    type: 'string',
    validValues: ['resend', 'sendgrid', 'smtp', 'hostinger'],
    description: 'Email service provider'
  },
  FROM_EMAIL: {
    required: true,
    type: 'email',
    description: 'Default sender email address'
  },

  // File Upload Configuration
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Cloudinary cloud name'
  },
  CLOUDINARY_API_KEY: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Cloudinary API key'
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Cloudinary API secret'
  },

  // Google Maps Configuration
  GOOGLE_MAPS_API_KEY: {
    required: true,
    type: 'string',
    minLength: 1,
    description: 'Google Maps API key'
  },


  // Twilio Configuration (Optional - for SMS/verification)
  TWILIO_ACCOUNT_SID: {
    required: false,
    type: 'string',
    pattern: /^AC[a-f0-9]{32}$/,
    description: 'Twilio Account SID'
  },
  TWILIO_AUTH_TOKEN: {
    required: false,
    type: 'string',
    minLength: 32,
    description: 'Twilio Auth Token'
  },
  TWILIO_VERIFY_SERVICE_SID: {
    required: false,
    type: 'string',
    pattern: /^VA[a-f0-9]{32}$/,
    description: 'Twilio Verify Service SID'
  },

  // PayPal Configuration (Optional - for payments)
  PAYPAL_CLIENT_ID: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayPal Client ID'
  },
  PAYPAL_CLIENT_SECRET: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayPal Client Secret'
  },
  PAYPAL_MODE: {
    required: false,
    type: 'string',
    validValues: ['sandbox', 'live', 'production'],
    description: 'PayPal mode ("sandbox" or "live"; "production" is accepted as an alias for "live")'
  },

  // PayMaya Configuration (Optional - for payments)
  PAYMAYA_PUBLIC_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMaya Public Key'
  },
  PAYMAYA_SECRET_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMaya Secret Key'
  },
  PAYMAYA_MODE: {
    required: false,
    type: 'string',
    validValues: ['sandbox', 'production'],
    description: 'PayMaya mode (sandbox or production)'
  },

  // Email Service Specific Configurations
  RESEND_API_KEY: {
    required: false,
    type: 'string',
    pattern: /^re_[a-zA-Z0-9_]+$/,
    description: 'Resend API key (required if EMAIL_SERVICE=resend)'
  },
  SENDGRID_API_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'SendGrid API key (required if EMAIL_SERVICE=sendgrid)'
  },
  SMTP_HOST: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'SMTP host (required if EMAIL_SERVICE=smtp or hostinger)'
  },
  SMTP_PORT: {
    required: false,
    type: 'number',
    min: 1,
    max: 65535,
    description: 'SMTP port (required if EMAIL_SERVICE=smtp or hostinger)'
  },
  SMTP_SECURE: {
    required: false,
    type: 'boolean',
    description: 'SMTP secure flag ("true" for 465)'
  },
  SMTP_USER: {
    required: false,
    type: 'email',
    description: 'SMTP username (required if EMAIL_SERVICE=smtp or hostinger)'
  },
  SMTP_PASS: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'SMTP password (required if EMAIL_SERVICE=smtp or hostinger)'
  },

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    type: 'number',
    min: 1000,
    max: 3600000,
    description: 'Rate limit window in milliseconds'
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: 'number',
    min: 1,
    max: 100000,
    description: 'Max requests per window'
  },

  // Branding / Public-facing defaults (used as fallbacks if AppSettings not configured)
  APP_NAME: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
    description: 'Public app name fallback'
  },
  APP_VERSION: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    description: 'Public app version fallback'
  },
  COMPANY_NAME: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
    description: 'Company name fallback for emails/public settings'
  },
  SUPPORT_EMAIL: {
    required: false,
    type: 'email',
    description: 'Support email address fallback'
  },
  SUPPORT_PHONE: {
    required: false,
    type: 'string',
    minLength: 3,
    maxLength: 32,
    description: 'Support phone number fallback'
  },

  // Payments / Webhooks (optional)
  PAYPAL_WEBHOOK_ID: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayPal webhook ID'
  },
  PAYMAYA_WEBHOOK_SECRET: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMaya webhook secret'
  },
  PAYMONGO_PUBLIC_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMongo public key'
  },
  PAYMONGO_SECRET_KEY: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMongo secret key'
  },
  PAYMONGO_WEBHOOK_SECRET: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'PayMongo webhook secret'
  },
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'Stripe webhook signing secret'
  },

  // Logging
  LOG_LEVEL: {
    required: false,
    type: 'string',
    validValues: ['error', 'warn', 'info', 'http', 'debug'],
    description: 'Application log level'
  },
  LOG_DATABASE_ENABLED: {
    required: false,
    type: 'boolean',
    description: 'Enable database log transport'
  },
  LOG_BATCH_SIZE: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
    description: 'Database log transport batch size'
  },
  LOG_FLUSH_INTERVAL: {
    required: false,
    type: 'number',
    min: 100,
    max: 600000,
    description: 'Database log transport flush interval (ms)'
  },
  LOG_HTTP_REQUESTS: {
    required: false,
    type: 'boolean',
    description: 'Enable HTTP request logging'
  },
  LOG_FILE_MAX_SIZE: {
    required: false,
    type: 'string',
    minLength: 2,
    maxLength: 16,
    description: 'Rotate log file max size (e.g., 20m, 50m)'
  },
  LOG_FILE_MAX_FILES: {
    required: false,
    type: 'string',
    minLength: 2,
    maxLength: 16,
    description: 'Rotate log file retention (e.g., 14d, 30d)'
  },
  LOG_SLOW_REQUESTS_THRESHOLD: {
    required: false,
    type: 'number',
    min: 1,
    max: 600000,
    description: 'Slow request threshold (ms)'
  },

  // Automated log cleanup
  ENABLE_AUTOMATED_CLEANUP: {
    required: false,
    type: 'boolean',
    description: 'Enable automated log cleanup job'
  },
  LOG_CLEANUP_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for log cleanup'
  },
  AUDIT_AUTO_CLEANUP: {
    required: false,
    type: 'boolean',
    description: 'Enable automated audit log cleanup job'
  },
  AUDIT_CLEANUP_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for audit log cleanup'
  },

  // Automated backups
  ENABLE_AUTOMATED_BACKUPS: {
    required: false,
    type: 'boolean',
    description: 'Enable automated backups'
  },
  BACKUP_RETENTION_DAYS: {
    required: false,
    type: 'number',
    min: 1,
    max: 3650,
    description: 'Backup retention in days'
  },
  BACKUP_RETENTION_WEEKS: {
    required: false,
    type: 'number',
    min: 0,
    max: 520,
    description: 'Backup retention in weeks'
  },
  BACKUP_RETENTION_MONTHS: {
    required: false,
    type: 'number',
    min: 0,
    max: 120,
    description: 'Backup retention in months'
  },
  BACKUP_UPLOAD_TO_CLOUD: {
    required: false,
    type: 'boolean',
    description: 'Upload backups to cloud storage'
  },
  AWS_S3_BACKUP_BUCKET: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'S3 bucket for backups'
  },

  // Automated payment sync
  ENABLE_AUTOMATED_PAYMENT_SYNC: {
    required: false,
    type: 'boolean',
    description: 'Enable automated payment status sync'
  },
  PAYMENT_SYNC_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for payment sync'
  },
  PAYMENT_SYNC_MAX_CONCURRENCY: {
    required: false,
    type: 'number',
    min: 1,
    max: 100,
    description: 'Max concurrent payment sync operations'
  },
  PAYMENT_SYNC_ON_STARTUP: {
    required: false,
    type: 'boolean',
    description: 'Run payment sync on startup'
  },

  // Automated services toggles
  ENABLE_AUTOMATED_BOOKINGS: {
    required: false,
    type: 'boolean',
    description: 'Enable automated bookings service'
  },
  ENABLE_AUTOMATED_CAMPAIGNS: {
    required: false,
    type: 'boolean',
    description: 'Enable automated campaigns service'
  },
  ENABLE_AUTOMATED_SUBSCRIPTIONS: {
    required: false,
    type: 'boolean',
    description: 'Enable automated subscriptions service'
  },
  ENABLE_AUTOMATED_ESCROWS: {
    required: false,
    type: 'boolean',
    description: 'Enable automated escrows service'
  },

  // Feature automations (notifications + reminders)
  ENABLE_AUTOMATED_MESSAGE_NUDGES: {
    required: false,
    type: 'boolean',
    description: 'Enable unread message nudges'
  },
  MESSAGE_NUDGE_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for message nudges'
  },
  MESSAGE_NUDGE_MIN_AGE_MINUTES: {
    required: false,
    type: 'number',
    min: 1,
    max: 10080,
    description: 'Minimum age of last message (minutes) before nudging'
  },
  MESSAGE_NUDGE_DEDUP_MINUTES: {
    required: false,
    type: 'number',
    min: 0,
    max: 10080,
    description: 'Dedupe window for nudges (minutes)'
  },

  ENABLE_AUTOMATED_ORDERS_AUTOMATIONS: {
    required: false,
    type: 'boolean',
    description: 'Enable supplies orders automations (master switch)'
  },
  ENABLE_AUTOMATED_ORDER_ABANDONED_PAYMENT: {
    required: false,
    type: 'boolean',
    description: 'Enable abandoned order payment nudges'
  },
  ORDER_ABANDONED_PAYMENT_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for abandoned order payment nudges'
  },
  ENABLE_AUTOMATED_ORDER_SLA_ALERTS: {
    required: false,
    type: 'boolean',
    description: 'Enable order processing SLA alerts'
  },
  ORDER_SLA_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for order SLA alerts'
  },

  ENABLE_AUTOMATED_FINANCE_REMINDERS: {
    required: false,
    type: 'boolean',
    description: 'Enable finance repayment reminders'
  },
  FINANCE_REMINDER_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for finance reminders'
  },

  ENABLE_AUTOMATED_RENTAL_REMINDERS: {
    required: false,
    type: 'boolean',
    description: 'Enable rental due/overdue reminders'
  },
  RENTAL_REMINDER_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for rental reminders'
  },

  ENABLE_AUTOMATED_JOB_DIGEST: {
    required: false,
    type: 'boolean',
    description: 'Enable job board digest'
  },
  JOB_DIGEST_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for job digest'
  },

  ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT: {
    required: false,
    type: 'boolean',
    description: 'Enable academy engagement nudges'
  },
  ACADEMY_ENGAGEMENT_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for academy engagement nudges'
  },

  ENABLE_AUTOMATED_LIVECHAT_SLA: {
    required: false,
    type: 'boolean',
    description: 'Enable live chat SLA alerts'
  },
  LIVECHAT_SLA_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for live chat SLA alerts'
  },

  ENABLE_AUTOMATED_BOOKING_FOLLOWUPS: {
    required: false,
    type: 'boolean',
    description: 'Enable marketplace booking follow-up nudges'
  },
  BOOKING_FOLLOWUP_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for marketplace booking follow-ups'
  },

  ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT: {
    required: false,
    type: 'boolean',
    description: 'Enable supplies fulfillment automations (master switch)'
  },
  ENABLE_AUTOMATED_SUPPLIES_DELIVERY_CONFIRMATION: {
    required: false,
    type: 'boolean',
    description: 'Enable supplies delivery confirmation reminders'
  },
  SUPPLIES_DELIVERY_CONFIRMATION_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for supplies delivery confirmation'
  },
  ENABLE_AUTOMATED_SUPPLIES_LATE_DELIVERY_ALERTS: {
    required: false,
    type: 'boolean',
    description: 'Enable supplies late delivery admin alerts'
  },
  SUPPLIES_LATE_DELIVERY_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for supplies late delivery alerts'
  },

  ENABLE_AUTOMATED_ACADEMY_CERTIFICATES: {
    required: false,
    type: 'boolean',
    description: 'Enable academy certificate pending alerts'
  },
  ACADEMY_CERTIFICATE_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for academy certificate alerts'
  },

  ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS: {
    required: false,
    type: 'boolean',
    description: 'Enable job application follow-up reminders'
  },
  JOB_APPLICATION_FOLLOWUP_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for job application follow-ups'
  },

  ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS: {
    required: false,
    type: 'boolean',
    description: 'Enable automated escrow dispute escalation reminders'
  },
  ESCROW_DISPUTE_ADMIN_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for escrow dispute admin escalation'
  },
  ESCROW_DISPUTE_PARTY_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for escrow dispute party nudges'
  },

  ENABLE_AUTOMATED_REFERRAL_TIER_MILESTONES: {
    required: false,
    type: 'boolean',
    description: 'Enable referral tier milestone notifications'
  },
  REFERRAL_TIER_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for referral tier milestones'
  },

  ENABLE_AUTOMATED_SUPPLIES_AUTO_DELIVER: {
    required: false,
    type: 'boolean',
    description: 'Enable supplies auto-deliver (automatic state changes)'
  },
  SUPPLIES_AUTO_DELIVER_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for supplies auto-deliver'
  },

  ENABLE_AUTOMATED_BOOKING_NO_SHOW: {
    required: false,
    type: 'boolean',
    description: 'Enable marketplace booking no-show/overdue detection'
  },
  BOOKING_NO_SHOW_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for booking no-show detection'
  },

  ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS: {
    required: false,
    type: 'boolean',
    description: 'Enable supplies reorder reminders'
  },
  SUPPLIES_REORDER_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for supplies reorder reminders'
  },

  ENABLE_AUTOMATED_MESSAGE_MODERATION: {
    required: false,
    type: 'boolean',
    description: 'Enable message moderation (contact leakage flags)'
  },
  MESSAGE_MODERATION_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for message moderation'
  },

  ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING: {
    required: false,
    type: 'boolean',
    description: 'Enable LocalPro Plus subscription dunning reminders'
  },
  SUBSCRIPTION_DUNNING_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for subscription dunning'
  },

  // Automated marketing (high-level toggles + a few core tuning values)
  ENABLE_AUTOMATED_MARKETING: {
    required: false,
    type: 'boolean',
    description: 'Enable automated lifecycle marketing'
  },
  ENABLE_AUTOMATED_MARKETING_REENGAGEMENT: {
    required: false,
    type: 'boolean',
    description: 'Enable re-engagement automation'
  },
  MARKETING_REENGAGEMENT_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for re-engagement automation'
  },
  MARKETING_INACTIVE_DAYS: {
    required: false,
    type: 'number',
    min: 1,
    max: 3650,
    description: 'Inactivity threshold (days)'
  },
  MARKETING_REENGAGEMENT_COOLDOWN_DAYS: {
    required: false,
    type: 'number',
    min: 0,
    max: 3650,
    description: 'Cooldown between re-engagement sends (days)'
  },
  MARKETING_REENGAGEMENT_DAILY_LIMIT: {
    required: false,
    type: 'number',
    min: 1,
    max: 100000,
    description: 'Daily re-engagement send limit'
  },
  ENABLE_AUTOMATED_MARKETING_WEEKLY_DIGEST: {
    required: false,
    type: 'boolean',
    description: 'Enable weekly digest automation'
  },
  MARKETING_WEEKLY_DIGEST_SCHEDULE: {
    required: false,
    type: 'cron',
    description: 'Cron schedule for weekly digest automation'
  },
  MARKETING_WEEKLY_DIGEST_COOLDOWN_DAYS: {
    required: false,
    type: 'number',
    min: 0,
    max: 3650,
    description: 'Cooldown between weekly digest sends (days)'
  },
  MARKETING_WEEKLY_DIGEST_DAILY_LIMIT: {
    required: false,
    type: 'number',
    min: 1,
    max: 100000,
    description: 'Daily weekly digest send limit'
  },
  MARKETING_WEEKLY_DIGEST_SUBJECT: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 200,
    description: 'Weekly digest subject'
  },

  // Alerts monitoring
  ENABLE_ALERT_MONITORING: {
    required: false,
    type: 'boolean',
    description: 'Enable performance alert monitoring'
  },
  ALERT_CHECK_INTERVAL_MS: {
    required: false,
    type: 'number',
    min: 1000,
    max: 600000,
    description: 'Alert check interval in ms'
  },
  ALERT_DEDUP_WINDOW_MS: {
    required: false,
    type: 'number',
    min: 0,
    max: 86400000,
    description: 'Alert dedupe window in ms'
  },
  ALERT_HEAP_USAGE_RATIO: {
    required: false,
    type: 'number',
    min: 0,
    max: 1,
    description: 'Heap usage ratio threshold (0-1)'
  },
  ALERT_HEAP_MIN_TOTAL_MB: {
    required: false,
    type: 'number',
    min: 0,
    max: 1048576,
    description: 'Minimum heap total MB to start alerting'
  },
  ALERT_RSS_MB: {
    required: false,
    type: 'number',
    min: 0,
    max: 1048576,
    description: 'RSS memory threshold in MB (0 disables)'
  },
  ALERT_SYSTEM_MEMORY_PERCENT: {
    required: false,
    type: 'number',
    min: 0,
    max: 100,
    description: 'System memory usage percent threshold (0 disables)'
  },
  ALERT_CPU_PERCENT: {
    required: false,
    type: 'number',
    min: 0,
    max: 100,
    description: 'CPU usage percent threshold'
  },
  ALERT_ACTIVE_CONNECTIONS: {
    required: false,
    type: 'number',
    min: 0,
    max: 10000000,
    description: 'Active connections threshold'
  },
  ALERT_ERROR_RATE_PER_MIN: {
    required: false,
    type: 'number',
    min: 0,
    max: 1000000,
    description: 'Error rate per minute threshold'
  },
  ALERT_RESPONSE_TIME_MS: {
    required: false,
    type: 'number',
    min: 0,
    max: 600000,
    description: 'Response time threshold in ms'
  },

  // Email marketing operations
  EMAIL_BATCH_SIZE: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
    description: 'Email marketing batch size'
  },
  EMAIL_BATCH_DELAY: {
    required: false,
    type: 'number',
    min: 0,
    max: 600000,
    description: 'Delay between email batches (ms)'
  },
  TRACKING_DOMAIN: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'Domain for email tracking links (fallback)'
  },
  API_DOMAIN: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'Backend public domain for email tracking links (fallback)'
  },
  BACKEND_URL: {
    required: false,
    type: 'url',
    description: 'Backend base URL (fallback)'
  },

  // Push notifications (optional)
  FIREBASE_PROJECT_ID: {
    required: false,
    type: 'string',
    minLength: 1,
    description: 'Firebase project ID for FCM'
  },
  FIREBASE_CLIENT_EMAIL: {
    required: false,
    type: 'email',
    description: 'Firebase service account client email'
  },
  FIREBASE_PRIVATE_KEY: {
    required: false,
    type: 'string',
    minLength: 10,
    description: 'Firebase service account private key'
  },

  // AI integrations (optional)
  OPENAI_API_KEY: {
    required: false,
    type: 'string',
    minLength: 10,
    description: 'OpenAI API key'
  },
  OPENAI_BASE_URL: {
    required: false,
    type: 'url',
    description: 'OpenAI base URL'
  },
  AI_API_KEY: {
    required: false,
    type: 'string',
    minLength: 10,
    description: 'Generic AI API key (fallback)'
  },
  AI_PROVIDER: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 50,
    description: 'AI provider identifier'
  },
  AI_MODEL: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
    description: 'AI model identifier'
  }
};

/**
 * Validation functions
 */
const validators = {
  string: (value, rules) => {
    if (typeof value !== 'string') return false;
    if (rules.minLength && value.length < rules.minLength) return false;
    if (rules.maxLength && value.length > rules.maxLength) return false;
    if (rules.pattern && !rules.pattern.test(value)) return false;
    if (rules.validValues && !rules.validValues.includes(value)) return false;
    return true;
  },

  number: (value, rules) => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (rules.min !== undefined && num < rules.min) return false;
    if (rules.max !== undefined && num > rules.max) return false;
    return true;
  },

  boolean: (value) => {
    // Accept common env encodings
    return ['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase());
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  cron: (value) => {
    try {
      const cron = require('node-cron');
      return cron.validate(String(value));
    } catch {
      // If cron validation isn't available for some reason, be permissive
      return typeof value === 'string' && value.trim().length > 0;
    }
  }
};

/**
 * Validate a single environment variable
 */
function validateEnvVar(varName, value, rules) {
  const errors = [];

  // Check if required variable is missing
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`Required environment variable ${varName} is missing`);
    return errors;
  }

  // Skip validation for optional variables that are not set
  if (!rules.required && (!value || value.trim() === '')) {
    return errors;
  }

  // Type validation
  const validator = validators[rules.type];
  if (!validator) {
    errors.push(`Unknown validation type: ${rules.type} for ${varName}`);
    return errors;
  }

  if (!validator(value, rules)) {
    errors.push(`Invalid value for ${varName}: ${value}`);
    
    // Add specific validation hints
    if (rules.type === 'string' && rules.minLength) {
      errors.push(`  - Must be at least ${rules.minLength} characters long`);
    }
    if (rules.type === 'string' && rules.maxLength) {
      errors.push(`  - Must be at most ${rules.maxLength} characters long`);
    }
    if (rules.type === 'string' && rules.pattern) {
      errors.push(`  - Must match required pattern`);
    }
    if (rules.type === 'string' && rules.validValues) {
      errors.push(`  - Must be one of: ${rules.validValues.join(', ')}`);
    }
    if (rules.type === 'number' && rules.min !== undefined) {
      errors.push(`  - Must be at least ${rules.min}`);
    }
    if (rules.type === 'number' && rules.max !== undefined) {
      errors.push(`  - Must be at most ${rules.max}`);
    }
  }

  return errors;
}

/**
 * Validate conditional requirements based on other environment variables
 */
function validateConditionalRequirements() {
  const errors = [];
  const emailService = process.env.EMAIL_SERVICE;

  // Email service specific validations
  if (emailService === 'resend' && !process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required when EMAIL_SERVICE=resend');
  }

  if (emailService === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY is required when EMAIL_SERVICE=sendgrid');
  }

  if ((emailService === 'smtp' || emailService === 'hostinger')) {
    if (!process.env.SMTP_HOST) errors.push('SMTP_HOST is required when EMAIL_SERVICE=smtp or hostinger');
    if (!process.env.SMTP_PORT) errors.push('SMTP_PORT is required when EMAIL_SERVICE=smtp or hostinger');
    if (!process.env.SMTP_USER) errors.push('SMTP_USER is required when EMAIL_SERVICE=smtp or hostinger');
    if (!process.env.SMTP_PASS) errors.push('SMTP_PASS is required when EMAIL_SERVICE=smtp or hostinger');
  }

  // Payment service validations
  if (process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_SECRET) {
    errors.push('PAYPAL_CLIENT_SECRET is required when PAYPAL_CLIENT_ID is set');
  }

  if (process.env.PAYPAL_CLIENT_SECRET && !process.env.PAYPAL_CLIENT_ID) {
    errors.push('PAYPAL_CLIENT_ID is required when PAYPAL_CLIENT_SECRET is set');
  }

  if (process.env.PAYMAYA_PUBLIC_KEY && !process.env.PAYMAYA_SECRET_KEY) {
    errors.push('PAYMAYA_SECRET_KEY is required when PAYMAYA_PUBLIC_KEY is set');
  }

  if (process.env.PAYMAYA_SECRET_KEY && !process.env.PAYMAYA_PUBLIC_KEY) {
    errors.push('PAYMAYA_PUBLIC_KEY is required when PAYMAYA_SECRET_KEY is set');
  }

  // PayMongo validations
  if (process.env.PAYMONGO_SECRET_KEY && !process.env.PAYMONGO_PUBLIC_KEY) {
    errors.push('PAYMONGO_PUBLIC_KEY is required when PAYMONGO_SECRET_KEY is set');
  }
  if (process.env.PAYMONGO_WEBHOOK_SECRET && !process.env.PAYMONGO_SECRET_KEY) {
    errors.push('PAYMONGO_SECRET_KEY is required when PAYMONGO_WEBHOOK_SECRET is set');
  }

  // Payment sync validations
  if (process.env.ENABLE_AUTOMATED_PAYMENT_SYNC === 'true') {
    if (!process.env.PAYMENT_SYNC_SCHEDULE) errors.push('PAYMENT_SYNC_SCHEDULE is required when ENABLE_AUTOMATED_PAYMENT_SYNC=true');
    if (!process.env.PAYMENT_SYNC_MAX_CONCURRENCY) errors.push('PAYMENT_SYNC_MAX_CONCURRENCY is required when ENABLE_AUTOMATED_PAYMENT_SYNC=true');
  }

  // Twilio validations
  if (process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_AUTH_TOKEN) {
    errors.push('TWILIO_AUTH_TOKEN is required when TWILIO_ACCOUNT_SID is set');
  }

  if (process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_ACCOUNT_SID) {
    errors.push('TWILIO_ACCOUNT_SID is required when TWILIO_AUTH_TOKEN is set');
  }

  return errors;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  logger.info('🔍 Starting environment variable validation...');

  // Validate each environment variable according to schema
  for (const [varName, rules] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[varName];
    const varErrors = validateEnvVar(varName, value, rules);
    errors.push(...varErrors);
  }

  // Validate conditional requirements
  const conditionalErrors = validateConditionalRequirements();
  errors.push(...conditionalErrors);

  // Check for security warnings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      warnings.push('⚠️  JWT_SECRET should be at least 64 characters long in production');
    }
    
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
      warnings.push('⚠️  Using localhost MongoDB in production is not recommended');
    }
  }

  // Log results
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:');
    errors.forEach(error => logger.error(`  ${error}`));
  }

  if (warnings.length > 0) {
    logger.warn('⚠️  Environment validation warnings:');
    warnings.forEach(warning => logger.warn(`  ${warning}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info('✅ All environment variables validated successfully');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get environment configuration summary
 */
function getEnvironmentSummary() {
  const summary = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    database: {
      configured: !!process.env.MONGODB_URI,
      type: 'MongoDB'
    },
    email: {
      service: process.env.EMAIL_SERVICE || 'not configured',
      configured: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_HOST)
    },
    fileUpload: {
      service: 'Cloudinary',
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    },
    maps: {
      service: 'Google Maps',
      configured: !!process.env.GOOGLE_MAPS_API_KEY
    },
    payments: {
      paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      paymaya: !!(process.env.PAYMAYA_PUBLIC_KEY && process.env.PAYMAYA_SECRET_KEY)
    },
    sms: {
      service: 'Twilio',
      configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    },
  };

  return summary;
}

module.exports = {
  validateEnvironment,
  getEnvironmentSummary,
  ENV_SCHEMA
};

