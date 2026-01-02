# Client Operations Without Mobile App - n8n Workflows Guide

This guide explains how to operate your LocalPro platform for clients without requiring a mobile app, using n8n workflows and alternative interaction methods.

## Overview

These workflows enable clients to:
- Book services via email/SMS/webhook
- Discover services and get recommendations
- Manage bookings (cancel, reschedule, view)
- Process payments
- Request support
- Receive weekly digests

## Available Workflows

### 1. Client Booking via Email (`11-client-booking-via-email.json`)

**Purpose**: Allows clients to book services through webhooks (triggered by email, web forms, phone calls, etc.)

**How It Works**:
1. Client submits booking request via webhook
2. System finds or creates user account
3. Creates booking in system
4. Sends confirmation email

**Webhook Endpoint**: `POST /client-booking-request`

**Request Body**:
```json
{
  "email": "client@example.com",
  "phone": "+1234567890",
  "name": "John Doe",
  "serviceId": "service_id_here",
  "serviceName": "House Cleaning",
  "providerId": "provider_id_here",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "10:00",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "notes": "Please bring cleaning supplies"
}
```

**Use Cases**:
- Web form submissions
- Email-to-booking conversion
- Phone call booking (staff enters via webhook)
- Integration with other systems

---

### 2. Client Service Discovery (`12-client-service-discovery.json`)

**Purpose**: Helps clients find services based on their needs and location

**How It Works**:
1. Client submits service inquiry
2. System geocodes location
3. Finds nearby services matching criteria
4. Sends personalized recommendations

**Webhook Endpoint**: `POST /service-inquiry`

**Request Body**:
```json
{
  "email": "client@example.com",
  "phone": "+1234567890",
  "name": "John Doe",
  "category": "cleaning",
  "location": "New York, NY",
  "budget": 100,
  "preferredDate": "2024-01-15",
  "notes": "Need deep cleaning"
}
```

**Use Cases**:
- "Find me a service" requests
- Location-based recommendations
- Budget-based filtering
- Category-specific searches

---

### 3. Client Booking Management (`13-client-booking-management.json`)

**Purpose**: Allows clients to manage existing bookings (view, cancel, reschedule)

**How It Works**:
1. Client submits management request
2. System retrieves booking
3. Performs requested action
4. Sends confirmation

**Webhook Endpoint**: `POST /manage-booking`

**Request Body Examples**:

**Cancel Booking**:
```json
{
  "action": "cancel",
  "bookingId": "booking_id_here",
  "email": "client@example.com",
  "reason": "Schedule conflict"
}
```

**Reschedule Booking**:
```json
{
  "action": "reschedule",
  "bookingId": "booking_id_here",
  "email": "client@example.com",
  "newDate": "2024-01-20",
  "newTime": "14:00"
}
```

**View Booking**:
```json
{
  "action": "view",
  "bookingId": "booking_id_here",
  "email": "client@example.com"
}
```

**Use Cases**:
- Email-based booking management
- SMS-based commands
- Web form updates
- Phone call processing

---

### 4. Client Payment Processing (`14-client-payment-processing.json`)

**Purpose**: Processes payments for bookings without mobile app

**How It Works**:
1. Client requests payment link
2. System creates payment session (PayPal/PayMaya)
3. Sends payment link via email
4. Client completes payment via web

**Webhook Endpoint**: `POST /process-payment`

**Request Body**:
```json
{
  "bookingId": "booking_id_here",
  "email": "client@example.com",
  "amount": 150.00,
  "paymentMethod": "paypal",
  "returnUrl": "https://your-site.com/payment-success",
  "cancelUrl": "https://your-site.com/payment-cancel"
}
```

**Use Cases**:
- Email payment links
- SMS payment links
- Web-based payment processing
- Manual payment initiation

---

### 5. Client Support Request (`15-client-support-request.json`)

**Purpose**: Handles client support requests and creates tickets

**How It Works**:
1. Client submits support request
2. System creates support ticket
3. Notifies support team
4. Confirms to client

**Webhook Endpoint**: `POST /client-support`

**Request Body**:
```json
{
  "email": "client@example.com",
  "phone": "+1234567890",
  "name": "John Doe",
  "subject": "Booking Issue",
  "message": "My booking was not confirmed",
  "category": "booking",
  "priority": "high",
  "bookingId": "booking_id_here"
}
```

**Use Cases**:
- Email support requests
- Web form submissions
- Phone call logging
- Issue tracking

---

### 6. Client Weekly Digest (`16-client-weekly-digest.json`)

**Purpose**: Sends weekly summary emails to active clients

**How It Works**:
1. Runs weekly (cron trigger)
2. Gets all active clients
3. Fetches recent bookings and featured services
4. Sends personalized digest

**Trigger**: Cron (weekly)

**Content Includes**:
- Recent bookings summary
- Featured services
- Booking statistics
- Personalized recommendations

**Use Cases**:
- Client engagement
- Service discovery
- Booking reminders
- Marketing

---

## Integration Methods

### Method 1: Web Forms

Create web forms that submit to n8n webhooks:

```html
<form action="https://your-n8n-instance.com/webhook/client-booking-request" method="POST">
  <input name="email" type="email" required>
  <input name="phone" type="tel" required>
  <input name="name" type="text" required>
  <input name="serviceId" type="hidden" value="service_id">
  <input name="scheduledDate" type="date" required>
  <input name="scheduledTime" type="time" required>
  <textarea name="notes"></textarea>
  <button type="submit">Book Service</button>
</form>
```

### Method 2: Email Integration

Use email parsing services (like Zapier, Make.com, or n8n's email trigger) to convert emails to webhook calls:

1. Client sends email to `bookings@yourdomain.com`
2. Email parser extracts data
3. Triggers n8n webhook with booking data

### Method 3: SMS Integration

Use SMS services (Twilio, etc.) to process SMS commands:

1. Client sends SMS: "BOOK cleaning 2024-01-15 10:00"
2. SMS service parses command
3. Triggers n8n webhook

### Method 4: Phone Call Integration

Use voice services to convert phone calls to webhook calls:

1. Client calls support line
2. Staff enters booking details
3. System triggers webhook

### Method 5: Direct API Integration

Other systems can call n8n webhooks directly:

```bash
curl -X POST https://your-n8n-instance.com/webhook/client-booking-request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "serviceId": "service_id",
    "scheduledDate": "2024-01-15"
  }'
```

---

## Setting Up Webhooks in n8n

1. **Import Workflows**: Import all workflow JSON files
2. **Get Webhook URLs**: Each webhook node provides a unique URL
3. **Configure External Systems**: Point your forms/emails/SMS to these URLs
4. **Set Environment Variables**:
   - `LOCALPRO_API_URL`
   - `LOCALPRO_API_KEY`
   - `LOCALPRO_API_SECRET`

---

## Email Templates Needed

Ensure these email templates exist in your LocalPro app:

- `booking-confirmation` - Booking created confirmation
- `service-recommendations` - Service discovery results
- `booking-cancelled` - Booking cancellation confirmation
- `booking-rescheduled` - Rescheduling confirmation
- `booking-details` - Booking information
- `payment-link` - Payment processing link
- `support-request-confirmation` - Support ticket confirmation
- `support-request-admin` - Admin notification
- `weekly-digest` - Weekly summary email

---

## SMS Integration (Optional)

To enable SMS-based operations, add SMS nodes to workflows:

1. Use Twilio node in n8n
2. Parse SMS commands
3. Trigger appropriate workflows
4. Send SMS responses

Example SMS Commands:
- `BOOK service_id 2024-01-15 10:00` - Book service
- `CANCEL booking_id` - Cancel booking
- `VIEW booking_id` - View booking details
- `FIND cleaning New York` - Find services

---

## Testing Workflows

### Test Booking Request

```bash
curl -X POST https://your-n8n-instance.com/webhook/client-booking-request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+1234567890",
    "name": "Test Client",
    "serviceId": "your_service_id",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "10:00",
    "address": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345"
    }
  }'
```

### Test Service Inquiry

```bash
curl -X POST https://your-n8n-instance.com/webhook/service-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test Client",
    "category": "cleaning",
    "location": "New York, NY"
  }'
```

---

## Best Practices

1. **Validate Input**: Always validate webhook data before processing
2. **Error Handling**: Implement proper error responses
3. **Rate Limiting**: Set up rate limiting on webhooks
4. **Logging**: Log all client operations for audit
5. **Security**: Use HTTPS for all webhooks
6. **Confirmation**: Always send confirmation emails/SMS
7. **Support**: Provide clear instructions for clients

---

## Monitoring

Monitor these metrics:
- Webhook success rate
- Booking conversion rate
- Average response time
- Client satisfaction
- Support ticket volume

---

## Next Steps

1. Import all workflows into n8n
2. Configure webhook URLs
3. Set up email templates
4. Test each workflow
5. Integrate with your client touchpoints
6. Monitor and optimize

---

## Support

For issues or questions:
- Check n8n execution logs
- Review API responses
- Verify webhook URLs
- Test with curl/Postman
- Contact LocalPro support
