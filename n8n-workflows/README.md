# LocalPro Super App - n8n Automation Workflows

Complete collection of n8n workflows for automating LocalPro Super App operations, including client operations without mobile app dependency.

## 📋 Table of Contents

- [Overview](#overview)
- [Workflow Categories](#workflow-categories)
- [Client Operations (No Mobile App Required)](#client-operations-no-mobile-app-required)
- [Business Operations](#business-operations)
- [Setup Instructions](#setup-instructions)
- [Quick Start](#quick-start)

## Overview

This collection includes **20+ n8n workflows** covering:
- ✅ Client operations (booking, payments, support) - **No mobile app needed**
- ✅ Business automation (reminders, notifications, reports)
- ✅ Payment processing (PayPal, PayMaya webhooks)
- ✅ User management and onboarding
- ✅ Marketing and engagement
- ✅ Analytics and reporting

## Workflow Categories

### 🎯 Client Operations (No Mobile App Required)

These workflows enable full client functionality without a mobile app:

| Workflow | Purpose | Webhook/Trigger |
|----------|---------|----------------|
| **11-client-booking-via-email.json** | Book services via webhook | `POST /client-booking-request` |
| **12-client-service-discovery.json** | Find services and get recommendations | `POST /service-inquiry` |
| **13-client-booking-management.json** | Manage bookings (cancel, reschedule) | `POST /manage-booking` |
| **14-client-payment-processing.json** | Process payments via email links | `POST /process-payment` |
| **15-client-support-request.json** | Submit support requests | `POST /client-support` |
| **16-client-weekly-digest.json** | Weekly summary emails | Cron (weekly) |
| **17-client-review-submission.json** | Submit reviews | `POST /submit-review` |
| **18-client-profile-update.json** | Update client profiles | `POST /update-profile` |
| **19-client-booking-reminder-sms.json** | SMS booking reminders | Cron (hourly) |
| **20-client-service-search-api.json** | Service search API endpoint | `GET /search-services` |

**See [CLIENT_OPERATIONS_GUIDE.md](CLIENT_OPERATIONS_GUIDE.md) for detailed documentation.**

### 🏢 Business Operations

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| **01-booking-reminders-automation.json** | Booking reminders (24h before) | Cron (hourly) |
| **02-paypal-webhook-processor.json** | Process PayPal payments | Webhook |
| **03-user-onboarding-automation.json** | User onboarding flow | Webhook |
| **04-referral-processing-automation.json** | Referral rewards & tiers | Webhook |
| **05-job-application-notifications.json** | Job application alerts | Webhook + Cron |
| **06-subscription-management.json** | Subscription renewals | Cron + Webhook |
| **07-email-marketing-campaign.json** | Email campaigns | Cron (daily) |
| **08-analytics-reporting.json** | Weekly analytics reports | Cron (weekly) |
| **09-provider-verification-automation.json** | Provider verification | Webhook |
| **10-escrow-management-automation.json** | Escrow management | Webhook + Cron |

### 🤖 AI Bot System

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| **21-ai-bot-human-escalation.json** | Handle human escalations from AI Bot | Webhook |
| **22-ai-bot-event-processor.json** | Process and route AI Bot events | Webhook |
| **23-ai-bot-analytics-reporting.json** | Daily AI Bot analytics reports | Cron (daily) |
| **24-ai-bot-guest-chat-support.json** | AI-powered guest/visitor chat support | Webhook |

**See [AI_BOT_WORKFLOWS_README.md](AI_BOT_WORKFLOWS_README.md) for detailed documentation.**

## Client Operations (No Mobile App Required)

### How Clients Can Interact

Clients can interact with LocalPro through multiple channels:

1. **Web Forms** → Submit to n8n webhooks
2. **Email** → Email parsing triggers workflows
3. **SMS** → SMS commands trigger workflows
4. **Phone Calls** → Staff enters data via webhooks
5. **Direct API** → Other systems call webhooks

### Key Client Workflows

#### 1. Booking Services
- **Webhook**: `POST /client-booking-request`
- **Input**: Email, phone, service details, date/time
- **Output**: Booking created, confirmation email sent
- **Use Cases**: Web forms, email booking, phone booking

#### 2. Finding Services
- **Webhook**: `POST /service-inquiry`
- **Input**: Location, category, budget
- **Output**: Personalized service recommendations
- **Use Cases**: "Find me a service" requests

#### 3. Managing Bookings
- **Webhook**: `POST /manage-booking`
- **Actions**: View, cancel, reschedule
- **Output**: Booking updated, confirmation sent
- **Use Cases**: Email commands, SMS commands

#### 4. Processing Payments
- **Webhook**: `POST /process-payment`
- **Input**: Booking ID, payment method
- **Output**: Payment link sent via email
- **Use Cases**: Email payment links, manual payment initiation

#### 5. Support Requests
- **Webhook**: `POST /client-support`
- **Input**: Issue description, category, priority
- **Output**: Support ticket created, notifications sent
- **Use Cases**: Email support, web forms, phone logging

## Setup Instructions

### 1. Import Workflows

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Import all JSON workflow files
4. Activate workflows you need

### 2. Configure Environment Variables

In n8n, go to **Settings** → **Environment Variables**:

```bash
LOCALPRO_API_URL=https://your-api-domain.com
LOCALPRO_API_KEY=lp_abc123xyz...
LOCALPRO_API_SECRET=lp_sec_xyz789abc...
```

### 3. Get Webhook URLs

After importing:
1. Open each workflow
2. Click on webhook nodes
3. Copy the webhook URL
4. Use these URLs in your integrations

### 4. Configure Email Templates

Ensure these email templates exist in your LocalPro app:
- `booking-confirmation`
- `service-recommendations`
- `booking-cancelled`
- `booking-rescheduled`
- `payment-link`
- `support-request-confirmation`
- `weekly-digest`
- `review-thank-you`
- `profile-updated`

## Quick Start

### For Client Operations

1. **Import client workflows** (11-20)
2. **Set up web forms** pointing to webhook URLs
3. **Configure email/SMS** integrations
4. **Test with sample requests**

### Example: Booking via Web Form

```html
<form action="YOUR_N8N_WEBHOOK_URL/client-booking-request" method="POST">
  <input name="email" type="email" required>
  <input name="phone" type="tel" required>
  <input name="name" type="text" required>
  <input name="serviceId" type="hidden" value="service_id">
  <input name="scheduledDate" type="date" required>
  <input name="scheduledTime" type="time" required>
  <button type="submit">Book Service</button>
</form>
```

### Example: Service Search API

```bash
curl "https://your-n8n-instance.com/webhook/search-services?q=cleaning&location=New York&category=cleaning"
```

## Integration Examples

### Web Form Integration

```html
<!-- Booking Form -->
<form action="YOUR_WEBHOOK_URL/client-booking-request" method="POST">
  <!-- Form fields -->
</form>
```

### Email Integration

Use email parsing services to convert emails to webhook calls:
- Zapier Email Parser
- Make.com Email Trigger
- n8n Email Trigger

### SMS Integration

Use Twilio or similar services:
- Parse SMS commands
- Trigger n8n webhooks
- Send SMS responses

## Documentation

- **[CLIENT_OPERATIONS_GUIDE.md](CLIENT_OPERATIONS_GUIDE.md)** - Complete guide for client operations
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Troubleshooting common issues
- **[USING_API_KEY_SECRET.md](USING_API_KEY_SECRET.md)** - API key/secret authentication guide

## Workflow Summary

| Category | Count | Workflows |
|----------|-------|-----------|
| **Client Operations** | 10 | 11-20 |
| **Business Automation** | 10 | 01-10 |
| **AI Bot System** | 4 | 21-24 |
| **Total** | **24** | All workflows |

## Support

For issues:
1. Check workflow execution logs in n8n
2. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Verify API credentials
4. Test webhooks with curl/Postman

## Next Steps

1. ✅ Import all workflows
2. ✅ Configure environment variables
3. ✅ Set up webhook integrations
4. ✅ Test each workflow
5. ✅ Deploy client-facing forms/interfaces
6. ✅ Monitor and optimize

---

**You can now operate LocalPro for clients without a mobile app!** 🎉

All client operations are available through webhooks, email, SMS, and web forms.
