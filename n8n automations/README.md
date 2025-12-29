# n8n Automation Workflows for LocalPro Super App

This directory contains n8n workflow JSON files for automating various processes in the LocalPro Super App.

## Overview

These workflows are designed to integrate with the LocalPro Super App API and automate common business processes, notifications, and maintenance tasks.

## Workflows Included

### 1. User Registration & Onboarding Automation
**File:** `user-registration-onboarding-automation.json`
- Triggers on user registration webhook
- Sends welcome emails
- Creates in-app notifications
- Handles onboarding flow

### 2. Booking Confirmation Automation
**File:** `booking-confirmation-automation.json`
- Triggers on new booking creation
- Sends confirmation emails to clients
- Notifies providers of new bookings
- Creates in-app notifications

### 3. Payment Processing Automation
**File:** `payment-processing-automation.json`
- Handles payment webhook events
- Processes completed payments
- Sends payment confirmation emails
- Creates payment notifications

### 4. Referral Processing Automation
**File:** `referral-processing-automation.json`
- Runs hourly to check pending referrals
- Processes completed referrals
- Sends reward notifications
- Updates referral status

### 5. Subscription Renewal Automation
**File:** `subscription-renewal-automation.json`
- Daily check for expiring subscriptions
- Sends renewal reminders
- Handles auto-renewal for enabled subscriptions
- Manages subscription lifecycle

### 6. Email Marketing Automation
**File:** `email-marketing-automation.json`
- Weekly schedule for campaign processing
- Sends scheduled email campaigns
- Tracks campaign analytics
- Manages campaign lifecycle

### 7. Error Monitoring Automation
**File:** `error-monitoring-automation.json`
- Runs every 15 minutes
- Checks for unresolved critical errors
- Sends admin alerts for critical issues
- Tracks error statistics

### 8. Escrow Management Automation
**File:** `escrow-management-automation.json`
- Runs every 6 hours
- Checks pending escrows
- Automates payment capture and release
- Notifies providers of released payments

### 9. Database Backup Automation
**File:** `database-backup-automation.json`
- Daily backup at 2 AM
- Triggers database backups
- Sends success/failure notifications
- Manages backup retention

### 10. Booking Reminders & Follow-ups Automation
**File:** `booking-reminders-automation.json`
- Runs every 30 minutes
- Sends provider confirmation reminders
- Sends booking soon reminders
- Manages booking follow-ups

### 11. Job Application Follow-up Automation
**File:** `job-application-followup-automation.json`
- Daily check at 10 AM
- Reminds employers of pending applications
- Tracks application review status
- Sends follow-up notifications

### 12. Academy Engagement Automation
**File:** `academy-engagement-automation.json`
- Daily check at 9:30 AM
- Nudges students who haven't started courses
- Reminds students with stalled progress
- Improves course completion rates

### 13. Finance Reminders Automation
**File:** `finance-reminders-automation.json`
- Daily check at 10 AM
- Sends payment due soon reminders
- Alerts on overdue payments
- Manages loan and salary advance reminders

### 14. Supplies Order Automation
**File:** `supplies-order-automation.json`
- Runs every 2 hours
- Handles abandoned payment nudges
- Sends delivery confirmation requests
- Manages order SLA alerts

### 15. Log Cleanup Automation
**File:** `log-cleanup-automation.json`
- Daily cleanup at 2 AM
- Removes expired application logs
- Cleans up audit logs
- Manages log retention

### 16. Analytics Reporting Automation
**File:** `analytics-reporting-automation.json`
- Weekly report on Mondays at 8 AM
- Compiles analytics data
- Generates comprehensive reports
- Sends reports to administrators

## Setup Instructions

### Prerequisites
1. n8n instance (self-hosted or cloud)
2. LocalPro Super App API access
3. API authentication token

### Configuration

1. **Import Workflows**
   - Open your n8n instance
   - Go to Workflows → Import from File
   - Select the JSON files from this directory

2. **Configure Variables**
   Set the following variables in n8n (accessed via `$vars.VARIABLE_NAME`):
   - `BASE_URL`: Your LocalPro Super App API base URL (e.g., `https://api.localpro.com`)
   - `API_KEY`: Your API access key (starts with `lp_`)
   - `API_SECRET`: Your API secret key
   - `ADMIN_EMAIL`: Administrator email for alerts
   
   **Note:** 
   - Variables in n8n are accessed using `$vars.VARIABLE_NAME` format
   - You need to create an API key through the LocalPro Super App API first. See the [API Key Integration Guide](../API_KEY_INTEGRATION_GUIDE.md) for details.
   - Set these variables in n8n's Settings → Variables or via environment variables when running n8n

3. **Configure Webhooks**
   - For webhook-triggered workflows, configure the webhook URLs in your LocalPro Super App
   - Update webhook endpoints to point to your n8n instance

4. **Set Up Credentials**
   - Configure HTTP Request credentials in n8n
   - Set up authentication for API calls
   - Configure email service credentials if needed

### Activation

1. **Activate Workflows**
   - Open each workflow in n8n
   - Review and adjust node configurations
   - Activate the workflows

2. **Test Workflows**
   - Test each workflow with sample data
   - Verify API connections
   - Check notification delivery

3. **Monitor Execution**
   - Monitor workflow executions in n8n
   - Check error logs
   - Review execution history

## Customization

### Adjusting Schedules
- Modify the schedule trigger nodes to change execution frequency
- Update cron expressions for different time patterns

### Modifying Notifications
- Update notification templates in the email nodes
- Adjust notification content and recipients
- Add additional notification channels

### Extending Functionality
- Add additional nodes for custom logic
- Integrate with external services
- Add data transformations

## API Endpoints Used

These workflows interact with the following LocalPro Super App API endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/marketplace/*` - Marketplace and booking endpoints
- `/api/communication/*` - Communication and notification endpoints
- `/api/paypal/*` - PayPal payment endpoints
- `/api/referrals/*` - Referral system endpoints
- `/api/localpro-plus/*` - Subscription endpoints
- `/api/email-marketing/*` - Email marketing endpoints
- `/api/error-monitoring/*` - Error monitoring endpoints
- `/api/escrows/*` - Escrow management endpoints
- `/api/database/optimization/*` - Database optimization endpoints
- `/api/logs/*` - Log management endpoints
- `/api/analytics/*` - Analytics endpoints
- `/api/jobs/*` - Job board endpoints
- `/api/academy/*` - Academy endpoints
- `/api/finance/*` - Finance endpoints
- `/api/supplies/*` - Supplies endpoints

## Notes

- All workflows use environment variables for configuration
- API keys and secrets should be stored securely in n8n credentials
- All workflows use API key authentication (X-API-Key and X-API-Secret headers)
- Webhook URLs need to be configured in the LocalPro Super App
- Some workflows require admin-level API access
- Test workflows in a development environment first
- Make sure your API key has the necessary scopes (read, write) for the endpoints used

## Support

For issues or questions:
- Check the LocalPro Super App API documentation
- Review n8n workflow execution logs
- Contact the development team

## License

These workflows are provided as-is for use with the LocalPro Super App.

