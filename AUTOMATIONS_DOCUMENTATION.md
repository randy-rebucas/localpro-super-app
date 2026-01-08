# LocalPro Super App - Automated Services Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Configuration Guide](#configuration-guide)
- [Core Business Automations](#core-business-automations)
- [Marketing & Communication](#marketing--communication)
- [E-commerce & Orders](#e-commerce--orders)
- [Payment & Financial](#payment--financial)
- [Job Board & Marketplace](#job-board--marketplace)
- [Academy & Learning](#academy--learning)
- [Referral & Gamification](#referral--gamification)
- [Support & Chat](#support--chat)
- [System Maintenance](#system-maintenance)
- [AI & Intelligence](#ai--intelligence)
- [Environment Variables Reference](#environment-variables-reference)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Overview

The LocalPro Super App includes **33 automated services** that handle various business processes, notifications, maintenance tasks, and customer engagement activities. These services run as scheduled cron jobs using the `node-cron` package, with support for configurable schedules and timezones.

### Key Features

- ✅ **Automated Background Processing**: Tasks run independently without blocking the main application
- 🕐 **Configurable Schedules**: All schedules can be customized via environment variables
- 🌍 **Timezone Support**: All services respect the `TZ` environment variable
- 🔒 **Opt-in by Default**: Most marketing/communication services are opt-in to respect user preferences
- 📊 **Comprehensive Logging**: All services log their activities using Winston logger
- 🔄 **Graceful Degradation**: Services can fail independently without affecting the main application

### Service Status

- **8 Services** - Enabled by default
- **25 Services** - Opt-in (require explicit configuration)
- **Production Ready** - All services include error handling and logging

---

## Quick Reference

| Service | Default Status | Schedule | Purpose |
|---------|---------------|----------|---------|
| **Backup Service** | Enabled (Production) | Daily 2 AM | Database backups |
| **Booking Service** | Enabled | Every 15 min | Booking reminders & transitions |
| **Subscription Service** | Enabled | Daily 2-11 AM | Renewal processing |
| **Escrow Service** | Enabled | Hourly/Daily | Escrow automation |
| **Campaign Processor** | Enabled | Varies | Email campaigns |
| **Availability Service** | Enabled | Varies | Job schedule reminders |
| **Scheduling Service** | Enabled | Daily | Cleanup expired data |
| **Log Cleanup Service** | Enabled | Daily 2 AM | Log maintenance |
| **Payment Sync** | Opt-in | Configurable | Payment status sync |
| **Lifecycle Marketing** | Opt-in | Daily/Hourly | Marketing campaigns |
| **Message Nudges** | Opt-in | Configurable | Unread message alerts |
| **Orders Automation** | Opt-in | Every 2 hours | Order reminders |
| **Finance Reminders** | Opt-in | Configurable | Loan/advance reminders |
| **Rental Reminders** | Opt-in | Configurable | Rental due dates |
| **Job Digest** | Opt-in | Configurable | Job board emails |
| **Academy Engagement** | Opt-in | Configurable | Course reminders |
| **Live Chat SLA** | Opt-in | Configurable | Response time alerts |
| **AI Bot Service** | Enabled | Event-driven | AI assistance |

---

## Configuration Guide

### Global Configuration

```bash
# Timezone (affects all scheduled jobs)
TZ=Asia/Manila

# Node Environment
NODE_ENV=production
```

### Enabling Services

Services use two patterns:

**Pattern 1: Enabled by Default** (disable with `false`)
```bash
ENABLE_AUTOMATED_BOOKINGS=false  # Disable booking service
```

**Pattern 2: Opt-in** (enable with `true`)
```bash
ENABLE_AUTOMATED_MARKETING=true  # Enable lifecycle marketing
```

### Custom Schedules

Most services support custom cron schedules:

```bash
# Backup schedules
BACKUP_DAILY_SCHEDULE="0 2 * * *"      # 2:00 AM daily
BACKUP_WEEKLY_SCHEDULE="0 3 * * 0"     # 3:00 AM Sunday
BACKUP_MONTHLY_SCHEDULE="0 4 1 * *"    # 4:00 AM 1st of month

# Marketing schedules
MARKETING_REENGAGEMENT_SCHEDULE="15 10 * * *"        # 10:15 AM daily
MARKETING_WEEKLY_DIGEST_SCHEDULE="0 9 * * 1"         # 9:00 AM Monday
MARKETING_WELCOME_SERIES_SCHEDULE="30 11 * * *"      # 11:30 AM daily
MARKETING_ABANDONED_BOOKING_SCHEDULE="0 */2 * * *"   # Every 2 hours

# Payment sync
PAYMENT_SYNC_SCHEDULE="*/30 * * * *"   # Every 30 minutes
PAYMENT_SYNC_ON_STARTUP=true           # Run on startup
```

### Cron Expression Guide

```
*    *    *    *    *
┬    ┬    ┬    ┬    ┬
│    │    │    │    │
│    │    │    │    └── Day of Week (0-7, 0 or 7 = Sunday)
│    │    │    └────── Month (1-12)
│    │    └──────────── Day of Month (1-31)
│    └────────────────── Hour (0-23)
└──────────────────────── Minute (0-59)
```

**Examples:**
- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1` - Every Monday at 9 AM
- `0 2 * * *` - Daily at 2 AM
- `0 4 1 * *` - Monthly on 1st at 4 AM

---

## Core Business Automations

### 1. Automated Booking Service

**Service File:** `src/services/automatedBookingService.js`

#### Description
Manages the complete booking lifecycle including reminders, status transitions, and review collection.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_BOOKINGS=true  # Default: enabled (use false to disable)
```

#### Schedule

| Task | Schedule | Purpose |
|------|----------|---------|
| Send Reminders | Every 15 minutes | Reminds users of upcoming bookings |
| Status Transitions | Every 30 minutes | Updates booking status based on time |
| Review Requests | Daily at 9 AM | Requests reviews for completed bookings |
| Cleanup Tracking | Daily at midnight | Prevents memory leaks |

#### Features
- ✅ Deduplication: Tracks sent reminders to avoid duplicates
- ✅ Timezone aware: Respects `TZ` environment variable
- ✅ Graceful failure: Errors don't crash the service

#### Methods
- `sendBookingReminders()` - Sends reminders for upcoming bookings
- `processBookingStatusTransitions()` - Transitions booking states
- `sendReviewRequests()` - Requests reviews from clients

#### Notifications Sent
- `booking_reminder` - X hours before booking
- `booking_status_changed` - When status transitions
- `review_request` - After booking completion

---

### 2. Automated Subscription Service

**Service File:** `src/services/automatedSubscriptionService.js`

#### Description
Handles subscription renewals, expirations, and reactivation campaigns.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_SUBSCRIPTIONS=true  # Default: enabled
```

#### Schedule

| Task | Schedule | Purpose |
|------|----------|---------|
| Renewal Reminders | Daily at 10 AM | Reminds users of upcoming renewals |
| Process Renewals | Daily at 2 AM | Processes automatic renewals |
| Handle Expirations | Daily at 3 AM | Manages expired subscriptions |
| Reactivation Offers | Daily at 11 AM | Sends win-back campaigns |
| Cleanup Tracking | Daily at midnight | Clears tracking sets |

#### Features
- ✅ Auto-renewal processing with payment integration
- ✅ Dunning management for failed payments
- ✅ Win-back campaigns for expired subscriptions
- ✅ Reminder tracking to avoid spam

#### Methods
- `sendRenewalReminders()` - Notifies users before expiration
- `processAutomaticRenewals()` - Charges and renews subscriptions
- `handleExpiredSubscriptions()` - Downgrades/cancels expired plans
- `sendReactivationOffers()` - Re-engagement campaigns

#### Payment Integration
- Supports PayPal, PayMongo, PayMaya
- Handles payment failures gracefully
- Retries failed payments based on configuration

---

### 3. Automated Escrow Service

**Service File:** `src/services/automatedEscrowService.js`

#### Description
Manages escrow lifecycle including capture, release, and payout automation.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_ESCROWS=true  # Default: enabled
```

#### Schedule

| Task | Schedule | Purpose |
|------|----------|---------|
| Auto-Capture | Every hour | Captures authorized payments |
| Auto-Release | Every 6 hours | Releases funds to providers |
| Auto-Payout | Every 12 hours | Processes provider payouts |
| Flag Stuck Escrows | Daily at 4 AM | Identifies problematic escrows |
| Cleanup Tracking | Daily at midnight | Clears processing sets |

#### Features
- ✅ Automated fund capture after job start
- ✅ Automatic release after job completion
- ✅ Provider payout processing
- ✅ Stuck escrow detection and alerting

#### Escrow States
1. **Authorized** → Auto-capture after job starts
2. **Captured** → Auto-release after job completion
3. **Released** → Auto-payout to provider wallet
4. **Stuck** → Flagged for manual review

---

### 4. Automated Availability Service

**Service File:** `src/services/automatedAvailabilityService.js`

#### Description
Sends job start reminders and lateness alerts based on provider schedules.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_AVAILABILITY=false  # Default: enabled
```

#### Features
- Job start reminders
- Lateness detection
- Schedule conflict alerts
- Automatic status updates

---

### 5. Automated Scheduling Service

**Service File:** `src/services/automatedSchedulingService.js`

#### Description
Maintains scheduling data by cleaning up expired rankings and suggestions.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_SCHEDULING=false  # Default: enabled
```

#### Features
- Cleanup expired schedule suggestions
- Remove old ranking data
- Optimize scheduling performance

---

## Marketing & Communication

### 6. Automated Email Campaign Processor

**Service File:** `src/services/automatedCampaignProcessor.js`

#### Description
Processes scheduled email campaigns created through the admin panel.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_CAMPAIGNS=true  # Default: enabled
```

#### Features
- Processes scheduled campaigns
- Supports segmentation
- Tracks delivery status
- Handles retries for failures

---

### 7. Automated Lifecycle Marketing Service

**Service File:** `src/services/automatedLifecycleMarketingService.js`

#### Description
Comprehensive lifecycle marketing automation including re-engagement, welcome series, and churn prevention.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_MARKETING=true  # Opt-in: disabled by default

# Custom schedules
MARKETING_REENGAGEMENT_SCHEDULE="15 10 * * *"        # Default: 10:15 AM daily
MARKETING_WEEKLY_DIGEST_SCHEDULE="0 9 * * 1"         # Default: 9:00 AM Monday
MARKETING_WELCOME_SERIES_SCHEDULE="30 11 * * *"      # Default: 11:30 AM daily
MARKETING_ABANDONED_BOOKING_SCHEDULE="0 */2 * * *"   # Default: Every 2 hours
MARKETING_REFERRAL_NUDGE_SCHEDULE="0 13 * * *"       # Default: 1:00 PM daily
MARKETING_PROVIDER_ACTIVATION_SCHEDULE="30 13 * * *" # Default: 1:30 PM daily
MARKETING_CHURN_PREVENTION_SCHEDULE="0 14 * * *"     # Default: 2:00 PM daily
```

#### Campaigns

| Campaign | Schedule | Target Audience | Purpose |
|----------|----------|----------------|---------|
| **Re-engagement** | Daily 10:15 AM | Inactive users (30+ days) | Win back dormant users |
| **Weekly Digest** | Monday 9:00 AM | Active users | Keep users engaged |
| **Welcome Series** | Daily 11:30 AM | New users (Day 2, Day 7) | Onboarding emails |
| **Abandoned Booking** | Every 2 hours | Cart abandoners | Recover lost bookings |
| **Referral Nudges** | Daily 1:00 PM | Active users | Encourage referrals |
| **Provider Activation** | Daily 1:30 PM | Inactive providers | Activate dormant providers |
| **Churn Prevention** | Daily 2:00 PM | At-risk users | Prevent churn |

#### Methods
- `runReengagementOnce()` - Sends re-engagement emails
- `runWeeklyDigestOnce()` - Sends weekly activity summaries
- `runWelcomeSeriesOnce()` - Onboarding email sequences
- `runAbandonedBookingNudgesOnce()` - Cart abandonment recovery
- `runReferralNudgesOnce()` - Referral program promotion
- `runProviderActivationOnce()` - Provider re-engagement
- `runChurnPreventionOnce()` - Retention campaigns

#### Best Practices
- 🎯 Always respect user opt-out preferences
- 📊 Monitor email metrics (open rate, click rate)
- ⏱️ Adjust schedules based on user timezone
- 🚫 Implement frequency capping to avoid spam

---

### 8. Automated Lifecycle Mobile Notifications Service

**Service File:** `src/services/automatedLifecycleMobileNotificationsService.js`

#### Description
Mobile-first alternative to email marketing, using push notifications for lifecycle campaigns.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_MOBILE_LIFECYCLE=true  # Opt-in: disabled by default
```

#### Features
- Push notification campaigns
- Mobile-optimized timing
- Rich notification support
- Deep linking to app screens

---

### 9. Automated Messaging Nudge Service

**Service File:** `src/services/automatedMessagingNudgeService.js`

#### Description
Reminds users about unread messages to improve engagement.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_MESSAGE_NUDGES=true  # Opt-in: disabled by default
```

#### Features
- Unread message reminders
- Configurable delay before nudge
- Multi-channel support (email, push)
- Respects user notification preferences

---

### 10. Automated Messaging Moderation Service

**Service File:** `src/services/automatedMessagingModerationService.js`

#### Description
Automatically flags messages containing contact information to prevent off-platform transactions.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_MESSAGE_MODERATION=true  # Opt-in: disabled by default
```

#### Features
- Detects phone numbers, emails, social media handles
- Flags suspicious messages for review
- Notifies moderators
- Protects platform revenue

#### Detection Patterns
- Phone numbers (various formats)
- Email addresses
- Social media handles
- External payment links

---

## E-commerce & Orders

### 11. Automated Orders Automation Service

**Service File:** `src/services/automatedOrdersAutomationService.js`

#### Description
Manages supplies orders including payment reminders and SLA monitoring.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_ORDERS_AUTOMATIONS=true  # Opt-in: disabled by default

# Custom schedules
ORDER_ABANDONED_PAYMENT_SCHEDULE="0 */2 * * *"  # Default: Every 2 hours
ORDER_SLA_SCHEDULE="15 9 * * *"                  # Default: 9:15 AM daily
```

#### Schedule

| Task | Schedule | Purpose |
|------|----------|---------|
| Abandoned Payment | Every 2 hours | Reminds users to complete payment |
| SLA Monitoring | Daily 9:15 AM | Alerts for processing delays |

#### Features
- Payment abandonment recovery
- SLA breach detection
- Automated refund processing
- Order status notifications

---

### 12. Automated Supplies Fulfillment Service

**Service File:** `src/services/automatedSuppliesFulfillmentService.js`

#### Description
Sends delivery confirmation reminders and tracks fulfillment status.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT=true  # Opt-in: disabled by default
```

#### Features
- Delivery confirmation requests
- Fulfillment status tracking
- Late delivery alerts
- Customer satisfaction follow-ups

---

### 13. Automated Supplies Reorder Reminder Service

**Service File:** `src/services/automatedSuppliesReorderReminderService.js`

#### Description
Reminds providers to reorder supplies based on usage patterns.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS=true  # Opt-in: disabled by default
```

#### Features
- Low stock detection
- Predictive reorder suggestions
- Seasonal demand patterns
- Bulk order recommendations

---

## Payment & Financial

### 14. Automated Payment Sync Service

**Service File:** `src/services/automatedPaymentSyncService.js`

#### Description
Synchronizes payment statuses with external payment providers (PayPal, PayMongo, PayMaya).

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_PAYMENT_SYNC=true  # Opt-in: disabled by default

# Custom schedule
PAYMENT_SYNC_SCHEDULE="*/30 * * * *"  # Default: Every 30 minutes
PAYMENT_SYNC_MAX_CONCURRENCY=5        # Max concurrent API calls
PAYMENT_SYNC_ON_STARTUP=true          # Run on startup
```

#### Features
- Multi-provider support (PayPal, PayMongo, PayMaya)
- Webhook fallback synchronization
- Failed payment detection
- Refund status updates
- Dispute tracking

#### Payment Providers
- **PayPal**: Order and subscription status sync
- **PayMongo**: Payment intent and source sync
- **PayMaya**: Transaction status verification

---

### 15. Automated Finance Reminder Service

**Service File:** `src/services/automatedFinanceReminderService.js`

#### Description
Sends payment reminders for loans and salary advances.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_FINANCE_REMINDERS=true  # Opt-in: disabled by default
```

#### Features
- Loan payment reminders
- Salary advance repayment alerts
- Overdue payment notifications
- Payment plan adjustments

---

### 16. Automated LocalPro Plus Dunning Service

**Service File:** `src/services/automatedLocalProPlusDunningService.js`

#### Description
Handles failed subscription payments with retry logic and grace periods.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING=true  # Opt-in: disabled by default
```

#### Features
- Failed payment retries
- Grace period management
- Downgrade warnings
- Account suspension automation

#### Dunning Process
1. Day 0: Payment fails
2. Day 1: First retry + email
3. Day 3: Second retry + email
4. Day 7: Final retry + warning
5. Day 10: Downgrade/suspend account

---

### 17. Automated Rental Reminder Service

**Service File:** `src/services/automatedRentalReminderService.js`

#### Description
Manages rental equipment due dates and overdue returns.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_RENTAL_REMINDERS=true  # Opt-in: disabled by default
```

#### Features
- Rental due reminders
- Overdue notifications
- Late fee calculations
- Return confirmation requests

---

### 18. Automated Escrow Dispute Escalation Service

**Service File:** `src/services/automatedEscrowDisputeEscalationService.js`

#### Description
Escalates unresolved escrow disputes to administrators.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS=true  # Opt-in: disabled by default
```

#### Features
- Time-based escalation
- Admin notifications
- Party response tracking
- Resolution deadline enforcement

---

## Job Board & Marketplace

### 19. Automated Job Board Digest Service

**Service File:** `src/services/automatedJobBoardDigestService.js`

#### Description
Sends periodic job listings digest to providers based on their skills.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_JOB_DIGEST=true  # Opt-in: disabled by default
```

#### Features
- Personalized job recommendations
- Skill-based matching
- Location-based filtering
- Weekly digest emails

---

### 20. Automated Job Application Follow-Up Service

**Service File:** `src/services/automatedJobApplicationFollowUpService.js`

#### Description
Reminds employers to review pending job applications.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS=true  # Opt-in: disabled by default
```

#### Features
- Application aging alerts
- Employer response reminders
- Candidate status updates
- Auto-rejection after timeout

---

### 21. Automated Marketplace Booking Follow-Up Service

**Service File:** `src/services/automatedMarketplaceBookingFollowUpService.js`

#### Description
Sends additional engagement nudges for marketplace bookings without changing states.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=true  # Opt-in: disabled by default
```

#### Features
- Pre-booking reminders
- Post-booking surveys
- Service upsells
- Related service recommendations

---

### 22. Automated Marketplace No-Show Service

**Service File:** `src/services/automatedMarketplaceNoShowService.js`

#### Description
Detects and handles no-shows and overdue bookings.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_BOOKING_NO_SHOW=true  # Opt-in: disabled by default
```

#### Features
- No-show detection
- Automatic cancellations
- Penalty assessments
- Refund processing

---

## Academy & Learning

### 23. Automated Academy Engagement Service

**Service File:** `src/services/automatedAcademyEngagementService.js`

#### Description
Engages learners with course completion reminders and motivational messages.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT=true  # Opt-in: disabled by default
```

#### Features
- Course completion reminders
- Progress milestone celebrations
- Inactive learner re-engagement
- New course recommendations

---

### 24. Automated Academy Certificate Service

**Service File:** `src/services/automatedAcademyCertificateService.js`

#### Description
Alerts administrators about pending certificate requests.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_ACADEMY_CERTIFICATES=true  # Opt-in: disabled by default
```

#### Features
- Pending certificate alerts
- Approval deadline tracking
- Bulk certificate generation
- Distribution notifications

---

## Referral & Gamification

### 25. Automated Referral Tier Milestone Service

**Service File:** `src/services/automatedReferralTierMilestoneService.js`

#### Description
Celebrates referral achievements and tier progressions.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_REFERRAL_TIER_MILESTONES=true  # Opt-in: disabled by default
```

#### Features
- Tier achievement notifications
- Reward distribution
- Progress tracking
- Next tier motivations

---

## Support & Chat

### 26. Automated Live Chat SLA Service

**Service File:** `src/services/automatedLiveChatSlaService.js`

#### Description
Monitors live chat response times and sends SLA breach alerts.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_LIVECHAT_SLA=true  # Opt-in: disabled by default
```

#### Features
- Response time monitoring
- SLA breach alerts
- Agent availability tracking
- Queue management

#### SLA Metrics
- First response time
- Average response time
- Resolution time
- Customer satisfaction

---

## System Maintenance

### 27. Automated Backup Service

**Service File:** `src/services/automatedBackupService.js`

#### Description
Performs regular database backups with retention management.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_BACKUPS=true  # Enabled by default in production

# Retention settings
BACKUP_RETENTION_DAYS=30  # Keep backups for 30 days

# Custom schedules
BACKUP_DAILY_SCHEDULE="0 2 * * *"    # Default: 2:00 AM daily
BACKUP_WEEKLY_SCHEDULE="0 3 * * 0"   # Default: 3:00 AM Sunday
BACKUP_MONTHLY_SCHEDULE="0 4 1 * *"  # Default: 4:00 AM 1st of month
```

#### Schedule

| Task | Default Schedule | Purpose |
|------|-----------------|---------|
| Daily Backup | 2:00 AM daily | Regular backups |
| Weekly Backup | 3:00 AM Sunday | Weekly snapshots |
| Monthly Backup | 4:00 AM 1st of month | Long-term archives |
| Cleanup Old Backups | 5:00 AM daily | Maintain retention policy |

#### Backup Storage
- Location: `./backups/` directory
- Format: JSON exports
- Naming: `backup-{type}-{timestamp}.json`
- Compression: Optional gzip support

#### Retention Policy
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months
- Configurable via `BACKUP_RETENTION_DAYS`

---

### 28. Automated Log Cleanup Service

**Service File:** `src/services/automatedLogCleanupService.js`

#### Description
Maintains log and audit trail databases by removing old entries.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_CLEANUP=true  # Enabled by default

# Retention settings
LOG_RETENTION_DAYS=90          # Keep logs for 90 days
AUDIT_RETENTION_DAYS=365       # Keep audit logs for 1 year
AUDIT_AUTO_CLEANUP=true        # Enable audit cleanup

# Custom schedules
LOG_CLEANUP_SCHEDULE="0 2 * * *"    # Default: 2:00 AM daily
AUDIT_CLEANUP_SCHEDULE="0 2 * * *"  # Default: 2:00 AM daily
```

#### Cleanup Targets
- **Log Collection**: Application logs
- **AuditLog Collection**: User activity logs
- **File Logs**: Winston log files in `./logs/`

#### Features
- Configurable retention periods
- Selective cleanup (logs vs audit)
- Archive before delete (optional)
- Performance optimization

---

### 29. Automated Index Management Service

**Service File:** `src/services/automatedIndexManagementService.js`

#### Description
Maintains database indexes by running index creation and slow query optimization scripts.

#### Configuration
```bash
# Enable/disable service
ENABLE_AUTOMATED_INDEXES=true        # Opt-in: disabled by default
VALIDATE_INDEXES_ON_STARTUP=true     # Run on server startup

# Schedule
INDEX_MAINTENANCE_SCHEDULE="0 4 * * *"  # Default: 4:00 AM daily

# Features
ENABLE_SLOW_QUERY_INDEXES=true       # Create indexes for slow queries
```

#### Schedule

| Task | Default Schedule | Purpose |
|------|-----------------|---------|
| Index Maintenance | 4:00 AM daily | Create/update indexes |
| Startup Validation | On startup (optional) | Verify indexes exist |

#### Scripts Executed
1. `create-database-indexes.js` - Standard indexes
2. `create-slow-query-indexes.js` - Performance indexes (if enabled)

#### Benefits
- Improved query performance
- Automatic index creation
- Slow query optimization
- Reduced manual maintenance

---

## AI & Intelligence

### 30. AI Bot Service (AI Operating System)

**Service Files:**
- `src/services/aiBotService.js`
- `src/services/aiBotEventListener.js`

#### Description
AI-powered assistant that provides intelligent automation, recommendations, and customer support.

#### Configuration
```bash
# Enable/disable service
ENABLE_AI_BOT=true  # Enabled by default

# AI Provider configuration
AI_PROVIDER=openai              # openai, anthropic, etc.
OPENAI_API_KEY=your_key_here
AI_MODEL=gpt-4

# Features
AI_BOT_AUTO_RESPOND=true        # Auto-respond to queries
AI_BOT_LEARN_FROM_FEEDBACK=true # Learn from user feedback
```

#### Features
- **Intelligent Chat Support**: Answers customer questions
- **Recommendation Engine**: Suggests services and providers
- **Automated Triage**: Routes complex issues to human agents
- **Learning System**: Improves responses over time
- **Multi-language Support**: Detects and responds in user's language

#### Event-Driven Actions
The AI Bot responds to various system events:
- New user registration → Welcome message
- Booking inquiry → Service recommendations
- Payment issues → Troubleshooting assistance
- Complex queries → Human agent escalation

#### AI Capabilities
- Natural language understanding
- Context-aware responses
- Sentiment analysis
- Intent classification
- Entity extraction

---

## Environment Variables Reference

### Essential Configuration

```bash
# ============================================
# CORE SETTINGS
# ============================================
NODE_ENV=production
TZ=Asia/Manila
PORT=3000

# ============================================
# AUTOMATION CONTROLS (Default Enabled)
# ============================================
ENABLE_AUTOMATED_BACKUPS=true           # Backup service
ENABLE_AUTOMATED_BOOKINGS=true          # Booking automation
ENABLE_AUTOMATED_CAMPAIGNS=true         # Email campaigns
ENABLE_AUTOMATED_SUBSCRIPTIONS=true     # Subscription management
ENABLE_AUTOMATED_ESCROWS=true           # Escrow automation
ENABLE_AUTOMATED_AVAILABILITY=true      # Availability service
ENABLE_AUTOMATED_SCHEDULING=true        # Scheduling cleanup
ENABLE_AUTOMATED_CLEANUP=true           # Log cleanup
ENABLE_AI_BOT=true                      # AI assistant

# ============================================
# OPT-IN AUTOMATIONS
# ============================================
# Payment & Financial
ENABLE_AUTOMATED_PAYMENT_SYNC=true              # Payment status sync
ENABLE_AUTOMATED_FINANCE_REMINDERS=true         # Loan reminders
ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING=true      # Failed payment handling
ENABLE_AUTOMATED_RENTAL_REMINDERS=true          # Rental due dates
ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS=true # Dispute escalation

# Marketing & Communication
ENABLE_AUTOMATED_MARKETING=true                 # Lifecycle marketing
ENABLE_AUTOMATED_MOBILE_LIFECYCLE=true          # Mobile notifications
ENABLE_AUTOMATED_MESSAGE_NUDGES=true            # Unread message alerts
ENABLE_AUTOMATED_MESSAGE_MODERATION=true        # Content moderation

# E-commerce
ENABLE_AUTOMATED_ORDERS_AUTOMATIONS=true        # Order reminders
ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT=true      # Delivery tracking
ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS=true # Reorder alerts

# Job Board & Marketplace
ENABLE_AUTOMATED_JOB_DIGEST=true                # Job board emails
ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS=true # Application reminders
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=true         # Booking engagement
ENABLE_AUTOMATED_BOOKING_NO_SHOW=true           # No-show detection

# Learning & Engagement
ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT=true        # Course reminders
ENABLE_AUTOMATED_ACADEMY_CERTIFICATES=true      # Certificate alerts
ENABLE_AUTOMATED_REFERRAL_TIER_MILESTONES=true  # Referral rewards

# Support
ENABLE_AUTOMATED_LIVECHAT_SLA=true              # Chat SLA monitoring

# System
ENABLE_AUTOMATED_INDEXES=true                   # Index management
VALIDATE_INDEXES_ON_STARTUP=true                # Startup validation

# ============================================
# BACKUP CONFIGURATION
# ============================================
BACKUP_RETENTION_DAYS=30
BACKUP_DAILY_SCHEDULE="0 2 * * *"
BACKUP_WEEKLY_SCHEDULE="0 3 * * 0"
BACKUP_MONTHLY_SCHEDULE="0 4 1 * *"

# ============================================
# MARKETING SCHEDULES
# ============================================
MARKETING_REENGAGEMENT_SCHEDULE="15 10 * * *"
MARKETING_WEEKLY_DIGEST_SCHEDULE="0 9 * * 1"
MARKETING_WELCOME_SERIES_SCHEDULE="30 11 * * *"
MARKETING_ABANDONED_BOOKING_SCHEDULE="0 */2 * * *"
MARKETING_REFERRAL_NUDGE_SCHEDULE="0 13 * * *"
MARKETING_PROVIDER_ACTIVATION_SCHEDULE="30 13 * * *"
MARKETING_CHURN_PREVENTION_SCHEDULE="0 14 * * *"

# ============================================
# PAYMENT SYNC CONFIGURATION
# ============================================
PAYMENT_SYNC_SCHEDULE="*/30 * * * *"
PAYMENT_SYNC_MAX_CONCURRENCY=5
PAYMENT_SYNC_ON_STARTUP=true

# ============================================
# ORDER AUTOMATION
# ============================================
ORDER_ABANDONED_PAYMENT_SCHEDULE="0 */2 * * *"
ORDER_SLA_SCHEDULE="15 9 * * *"

# ============================================
# LOG CLEANUP
# ============================================
LOG_RETENTION_DAYS=90
AUDIT_RETENTION_DAYS=365
AUDIT_AUTO_CLEANUP=true
LOG_CLEANUP_SCHEDULE="0 2 * * *"
AUDIT_CLEANUP_SCHEDULE="0 2 * * *"

# ============================================
# INDEX MANAGEMENT
# ============================================
INDEX_MAINTENANCE_SCHEDULE="0 4 * * *"
ENABLE_SLOW_QUERY_INDEXES=true

# ============================================
# AI BOT CONFIGURATION
# ============================================
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
AI_MODEL=gpt-4
AI_BOT_AUTO_RESPOND=true
AI_BOT_LEARN_FROM_FEEDBACK=true
```

---

## Monitoring & Troubleshooting

### Checking Service Status

All services log their startup status. Check logs for confirmation:

```bash
# Check if services started
grep "✅" logs/combined-*.log | grep "started"

# Check for service errors
grep "❌" logs/error-*.log | grep "automated"

# Monitor specific service
tail -f logs/combined-*.log | grep "Automated booking"
```

### Common Issues

#### 1. Service Not Starting

**Symptoms:** No log entries for a service

**Possible Causes:**
- Environment variable not set correctly
- Service disabled in configuration
- Dependency missing

**Solution:**
```bash
# Check environment variables
env | grep ENABLE_AUTOMATED

# Verify service file exists
ls src/services/automated*.js

# Check for startup errors
grep "Failed to initialize automated services" logs/error-*.log
```

#### 2. Cron Jobs Not Running

**Symptoms:** Service starts but tasks don't execute

**Possible Causes:**
- Invalid cron expression
- Timezone mismatch
- Runtime error in task

**Solution:**
```bash
# Validate cron expression online: crontab.guru

# Check timezone
echo $TZ

# Look for runtime errors
grep "Error" logs/error-*.log | grep "automated"
```

#### 3. Duplicate Notifications

**Symptoms:** Users receive multiple notifications

**Possible Causes:**
- Multiple server instances running
- Tracking not persisting
- Memory cleanup failed

**Solution:**
```bash
# Ensure single instance
pm2 list

# Check tracking sets
# Services clear tracking at midnight - wait 24 hours

# Review deduplication logic in service code
```

#### 4. High Memory Usage

**Symptoms:** Server memory grows over time

**Possible Causes:**
- Tracking sets not clearing
- Too many concurrent jobs
- Memory leaks

**Solution:**
```bash
# Monitor memory
pm2 monit

# Check tracking cleanup jobs
grep "Cleared.*tracking" logs/combined-*.log

# Reduce concurrency
PAYMENT_SYNC_MAX_CONCURRENCY=3
```

### Performance Optimization

#### Adjusting Schedule Frequency

If services are running too frequently:

```bash
# Reduce frequency
PAYMENT_SYNC_SCHEDULE="0 * * * *"  # From every 30 min to hourly

# Spread load across time
MARKETING_REENGAGEMENT_SCHEDULE="15 10 * * *"  # 10:15 AM
MARKETING_WELCOME_SERIES_SCHEDULE="30 11 * * *"  # 11:30 AM
# Avoid scheduling all at same time
```

#### Concurrency Control

Limit concurrent API calls:

```bash
PAYMENT_SYNC_MAX_CONCURRENCY=3  # Reduce from 5 to 3
```

#### Selective Enablement

Only enable services you need:

```bash
# Disable non-critical services
ENABLE_AUTOMATED_MARKETING=false
ENABLE_AUTOMATED_MESSAGE_NUDGES=false
```

### Monitoring Dashboard

Create a monitoring endpoint to check service health:

**Example Endpoint:** `GET /api/admin/automation-status`

Response:
```json
{
  "automatedBackupService": {
    "status": "running",
    "lastRun": "2026-01-07T02:00:00Z",
    "nextRun": "2026-01-08T02:00:00Z"
  },
  "automatedBookingService": {
    "status": "running",
    "lastRun": "2026-01-07T14:45:00Z",
    "nextRun": "2026-01-07T15:00:00Z"
  }
}
```

### Logging Best Practices

Services log at different levels:

- **INFO**: Normal operations, job completions
- **WARN**: Non-critical issues, retries
- **ERROR**: Failures requiring attention

Configure Winston log levels:

```bash
LOG_LEVEL=info  # info, warn, error, debug
```

### Testing Automations

#### Manual Trigger

Most services expose a `runOnce()` or similar method:

```javascript
// In Node REPL or test script
const service = require('./src/services/automatedBookingService');
await service.sendBookingReminders();
```

#### Dry Run Mode

Some services support dry-run:

```bash
DRY_RUN=true  # Log actions without executing
```

---

## Additional Resources

### Related Documentation
- [API Documentation](./API_DOCUMENTATION_INDEX.md)
- [Admin Dashboard Guide](./ADMIN_DASHBOARD_DOCUMENTATION.md)
- [Client Mobile App](./CLIENT_MOBILE_APP_DOCUMENTATION.md)
- [Provider Mobile App](./PROVIDER_MOBILE_APP_DOCUMENTATION.md)

### External References
- [Cron Expression Guide](https://crontab.guru/)
- [Node-Cron Documentation](https://www.npmjs.com/package/node-cron)
- [Winston Logger](https://github.com/winstonjs/winston)

### Support
For issues or questions about automations:
1. Check logs: `logs/error-*.log`
2. Review environment variables
3. Verify service configuration
4. Contact development team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial documentation |

---

**Last Updated:** January 7, 2026  
**Maintained By:** LocalPro Development Team
