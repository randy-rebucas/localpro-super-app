# Automations Quick Reference

> **Quick access guide for LocalPro automated services**

## 🚀 Quick Enable/Disable

### Enable All Marketing Automations
```bash
ENABLE_AUTOMATED_MARKETING=true
ENABLE_AUTOMATED_MOBILE_LIFECYCLE=true
ENABLE_AUTOMATED_MESSAGE_NUDGES=true
ENABLE_AUTOMATED_CAMPAIGNS=true
```

### Enable All Payment Automations
```bash
ENABLE_AUTOMATED_PAYMENT_SYNC=true
ENABLE_AUTOMATED_FINANCE_REMINDERS=true
ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING=true
ENABLE_AUTOMATED_ESCROWS=true
ENABLE_AUTOMATED_SUBSCRIPTIONS=true
```

### Enable All E-commerce Automations
```bash
ENABLE_AUTOMATED_ORDERS_AUTOMATIONS=true
ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT=true
ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS=true
```

### Disable Non-Essential Services
```bash
ENABLE_AUTOMATED_MARKETING=false
ENABLE_AUTOMATED_MESSAGE_NUDGES=false
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=false
ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT=false
```

---

## ⏰ Default Schedules Cheat Sheet

| Service | Default Schedule | Cron Expression |
|---------|-----------------|-----------------|
| **Daily Backups** | 2:00 AM daily | `0 2 * * *` |
| **Weekly Backups** | 3:00 AM Sunday | `0 3 * * 0` |
| **Monthly Backups** | 4:00 AM 1st | `0 4 1 * *` |
| **Booking Reminders** | Every 15 min | `*/15 * * * *` |
| **Status Transitions** | Every 30 min | `*/30 * * * *` |
| **Subscription Renewals** | 2:00 AM daily | `0 2 * * *` |
| **Escrow Auto-Capture** | Every hour | `0 * * * *` |
| **Escrow Auto-Release** | Every 6 hours | `0 */6 * * *` |
| **Payment Sync** | Every 30 min | `*/30 * * * *` |
| **Re-engagement** | 10:15 AM daily | `15 10 * * *` |
| **Weekly Digest** | 9:00 AM Monday | `0 9 * * 1` |
| **Abandoned Bookings** | Every 2 hours | `0 */2 * * *` |
| **Log Cleanup** | 2:00 AM daily | `0 2 * * *` |
| **Index Maintenance** | 4:00 AM daily | `0 4 * * *` |

---

## 🔧 Common Configuration Patterns

### Production Setup (Minimal)
```bash
# Core services only
ENABLE_AUTOMATED_BACKUPS=true
ENABLE_AUTOMATED_BOOKINGS=true
ENABLE_AUTOMATED_SUBSCRIPTIONS=true
ENABLE_AUTOMATED_ESCROWS=true
ENABLE_AUTOMATED_CLEANUP=true
```

### Production Setup (Full)
```bash
# All essential services
ENABLE_AUTOMATED_BACKUPS=true
ENABLE_AUTOMATED_BOOKINGS=true
ENABLE_AUTOMATED_CAMPAIGNS=true
ENABLE_AUTOMATED_SUBSCRIPTIONS=true
ENABLE_AUTOMATED_ESCROWS=true
ENABLE_AUTOMATED_PAYMENT_SYNC=true
ENABLE_AUTOMATED_AVAILABILITY=true
ENABLE_AUTOMATED_SCHEDULING=true
ENABLE_AUTOMATED_CLEANUP=true
ENABLE_AUTOMATED_INDEXES=true
ENABLE_AI_BOT=true
```

### Marketing-Heavy Setup
```bash
# Essential + marketing
ENABLE_AUTOMATED_MARKETING=true
ENABLE_AUTOMATED_MOBILE_LIFECYCLE=true
ENABLE_AUTOMATED_MESSAGE_NUDGES=true
ENABLE_AUTOMATED_CAMPAIGNS=true
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=true
ENABLE_AUTOMATED_JOB_DIGEST=true
```

### Development/Testing
```bash
# Minimal for development
ENABLE_AUTOMATED_BACKUPS=false
ENABLE_AUTOMATED_MARKETING=false
ENABLE_AUTOMATED_CLEANUP=false
# Keep core booking/payment services enabled for testing
```

---

## 📊 Service Categories Reference

### Category: Core Business (Always Enable)
```bash
ENABLE_AUTOMATED_BOOKINGS=true          # Default: enabled
ENABLE_AUTOMATED_SUBSCRIPTIONS=true     # Default: enabled
ENABLE_AUTOMATED_ESCROWS=true           # Default: enabled
ENABLE_AUTOMATED_AVAILABILITY=true      # Default: enabled
ENABLE_AUTOMATED_SCHEDULING=true        # Default: enabled
```

### Category: Marketing (Opt-in)
```bash
ENABLE_AUTOMATED_MARKETING=true
ENABLE_AUTOMATED_MOBILE_LIFECYCLE=true
ENABLE_AUTOMATED_CAMPAIGNS=true
ENABLE_AUTOMATED_MESSAGE_NUDGES=true
```

### Category: Payment (Opt-in)
```bash
ENABLE_AUTOMATED_PAYMENT_SYNC=true
ENABLE_AUTOMATED_FINANCE_REMINDERS=true
ENABLE_AUTOMATED_SUBSCRIPTION_DUNNING=true
ENABLE_AUTOMATED_RENTAL_REMINDERS=true
```

### Category: E-commerce (Opt-in)
```bash
ENABLE_AUTOMATED_ORDERS_AUTOMATIONS=true
ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT=true
ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS=true
```

### Category: Marketplace (Opt-in)
```bash
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=true
ENABLE_AUTOMATED_BOOKING_NO_SHOW=true
ENABLE_AUTOMATED_ESCROW_DISPUTE_ESCALATIONS=true
```

### Category: Jobs (Opt-in)
```bash
ENABLE_AUTOMATED_JOB_DIGEST=true
ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS=true
```

### Category: Learning (Opt-in)
```bash
ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT=true
ENABLE_AUTOMATED_ACADEMY_CERTIFICATES=true
```

### Category: Support (Opt-in)
```bash
ENABLE_AUTOMATED_LIVECHAT_SLA=true
ENABLE_AUTOMATED_MESSAGE_MODERATION=true
```

### Category: System (Recommended)
```bash
ENABLE_AUTOMATED_BACKUPS=true           # Default: enabled (production)
ENABLE_AUTOMATED_CLEANUP=true           # Default: enabled
ENABLE_AUTOMATED_INDEXES=true
ENABLE_AI_BOT=true                      # Default: enabled
```

---

## 🎯 Use Case Examples

### E-commerce Platform
```bash
ENABLE_AUTOMATED_ORDERS_AUTOMATIONS=true
ENABLE_AUTOMATED_SUPPLIES_FULFILLMENT=true
ENABLE_AUTOMATED_SUPPLIES_REORDER_REMINDERS=true
ENABLE_AUTOMATED_PAYMENT_SYNC=true
ENABLE_AUTOMATED_MARKETING=true
```

### Service Marketplace
```bash
ENABLE_AUTOMATED_BOOKINGS=true
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=true
ENABLE_AUTOMATED_BOOKING_NO_SHOW=true
ENABLE_AUTOMATED_AVAILABILITY=true
ENABLE_AUTOMATED_ESCROWS=true
```

### Educational Platform
```bash
ENABLE_AUTOMATED_ACADEMY_ENGAGEMENT=true
ENABLE_AUTOMATED_ACADEMY_CERTIFICATES=true
ENABLE_AUTOMATED_SUBSCRIPTIONS=true
ENABLE_AUTOMATED_MARKETING=true
```

### Rental Service
```bash
ENABLE_AUTOMATED_RENTAL_REMINDERS=true
ENABLE_AUTOMATED_BOOKING_NO_SHOW=true
ENABLE_AUTOMATED_FINANCE_REMINDERS=true
ENABLE_AUTOMATED_PAYMENT_SYNC=true
```

### Job Board
```bash
ENABLE_AUTOMATED_JOB_DIGEST=true
ENABLE_AUTOMATED_JOB_APPLICATION_FOLLOWUPS=true
ENABLE_AUTOMATED_MARKETING=true
```

---

## 🕐 Custom Schedule Examples

### Change Backup Times (Off-peak Hours)
```bash
BACKUP_DAILY_SCHEDULE="0 3 * * *"      # 3 AM instead of 2 AM
BACKUP_WEEKLY_SCHEDULE="0 4 * * 0"     # 4 AM Sunday
```

### More Frequent Payment Sync
```bash
PAYMENT_SYNC_SCHEDULE="*/15 * * * *"   # Every 15 min instead of 30
```

### Less Frequent Marketing (Reduce Load)
```bash
MARKETING_REENGAGEMENT_SCHEDULE="0 10 * * 1,4"  # Mon & Thu only
MARKETING_WEEKLY_DIGEST_SCHEDULE="0 9 * * 1"    # Keep Monday
```

### Spread Load Throughout Day
```bash
MARKETING_REENGAGEMENT_SCHEDULE="15 10 * * *"        # 10:15 AM
MARKETING_WELCOME_SERIES_SCHEDULE="30 11 * * *"      # 11:30 AM
MARKETING_REFERRAL_NUDGE_SCHEDULE="0 13 * * *"       # 1:00 PM
MARKETING_PROVIDER_ACTIVATION_SCHEDULE="30 13 * * *" # 1:30 PM
MARKETING_CHURN_PREVENTION_SCHEDULE="0 14 * * *"     # 2:00 PM
```

---

## 🌍 Timezone Configuration

### Set Application Timezone
```bash
TZ=Asia/Manila           # Philippines
TZ=America/New_York      # US Eastern
TZ=Europe/London         # UK
TZ=UTC                   # Universal (default)
```

All cron jobs respect the `TZ` environment variable.

---

## 🔍 Quick Diagnostics

### Check if Services Started
```bash
grep "✅" logs/combined-*.log | grep "started"
```

### Check for Errors
```bash
grep "❌" logs/error-*.log | grep "automated"
```

### Monitor Specific Service
```bash
tail -f logs/combined-*.log | grep "Automated booking"
```

### Verify Cron Jobs Running
```bash
grep "Automated.*service started" logs/combined-*.log | tail -20
```

---

## 📈 Performance Tuning

### Reduce Memory Usage
```bash
# Disable non-essential services
ENABLE_AUTOMATED_MARKETING=false
ENABLE_AUTOMATED_MESSAGE_NUDGES=false
ENABLE_AUTOMATED_BOOKING_FOLLOWUPS=false

# Reduce concurrency
PAYMENT_SYNC_MAX_CONCURRENCY=3
```

### Reduce CPU Load
```bash
# Less frequent schedules
PAYMENT_SYNC_SCHEDULE="0 * * * *"              # Hourly instead of 30min
BACKUP_DAILY_SCHEDULE="0 4 * * *"              # 4 AM instead of 2 AM
ORDER_ABANDONED_PAYMENT_SCHEDULE="0 */4 * * *" # Every 4hrs instead of 2
```

### High-Performance Setup
```bash
# Increase concurrency for faster processing
PAYMENT_SYNC_MAX_CONCURRENCY=10

# Run on startup for immediate sync
PAYMENT_SYNC_ON_STARTUP=true
VALIDATE_INDEXES_ON_STARTUP=true
```

---

## 🚨 Troubleshooting Commands

### Service Won't Start
```bash
# Check environment variables
env | grep ENABLE_AUTOMATED

# Verify service file exists
ls -la src/services/automated*.js

# Check dependencies
npm list node-cron
```

### Jobs Not Running
```bash
# Validate cron expression at crontab.guru
# Check timezone
echo $TZ

# Look for runtime errors
grep "Error" logs/error-*.log | grep "automated" | tail -20
```

### Duplicate Notifications
```bash
# Check if multiple instances running
pm2 list

# Verify tracking cleanup
grep "Cleared.*tracking" logs/combined-*.log | tail -10
```

### High Memory Usage
```bash
# Monitor memory
pm2 monit

# Check tracking sets
# Services should clear at midnight

# Review last 100 log entries
tail -100 logs/combined-*.log
```

---

## 📚 Related Documentation

- [Full Automations Documentation](AUTOMATIONS_DOCUMENTATION.md) - Complete guide with detailed explanations
- [API Documentation Index](API_DOCUMENTATION_INDEX.md) - API reference
- [Quick Start Guide](QUICK_START_GUIDE.md) - Getting started

---

## 🆘 Support

### Log Locations
- Combined logs: `logs/combined-*.log`
- Error logs: `logs/error-*.log`
- HTTP logs: `logs/http-*.log`

### Key Log Patterns
- Service startup: `✅ Automated.*service started`
- Service errors: `❌ Failed to initialize automated services`
- Job execution: `Automated.*once` or `Running.*automation`
- Tracking cleanup: `Cleared.*tracking`

### Environment Check
```bash
# Quick env check
node -e "console.log('TZ:', process.env.TZ || 'UTC'); console.log('NODE_ENV:', process.env.NODE_ENV || 'development');"

# List all automation env vars
env | grep ENABLE_AUTOMATED | sort
```

---

**Last Updated:** January 7, 2026  
**Version:** 1.0.0
