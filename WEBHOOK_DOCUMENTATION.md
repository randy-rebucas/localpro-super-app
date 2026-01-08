# Webhook System Documentation

## Overview

The LocalPro Super App webhook system provides real-time event notifications for all supported user actions. The system consists of two parts:

1. **Event Storage**: All events are stored in the database and accessible via API endpoints
2. **HTTP Webhooks**: Events can be delivered to external URLs via HTTP POST requests (optional)

## Supported Events

The webhook system supports the following event types:

### Booking Events
- `booking.confirmed` - Booking confirmed by provider
- `booking.completed` - Service completed
- `booking.cancelled` - Booking cancelled by client or provider

### Message Events
- `message.received` - New message received in conversation

### Payment Events
- `payment.successful` - Payment processed successfully
- `payment.failed` - Payment failed

### Job Application Events
- `application.status_changed` - Job application status updated (pending, reviewing, shortlisted, hired, rejected)

### Referral Events
- `referral.completed` - Referral completed and reward earned

### Subscription Events
- `subscription.renewed` - LocalPro Plus subscription renewed
- `subscription.cancelled` - Subscription cancelled

## API Endpoints

### Get Webhook Events
```
GET /api/webhooks/events
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 50)
- `eventType` (optional): Filter by event type
- `status` (optional): Filter by status (pending, delivered, failed, read)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "event123",
      "eventType": "booking.confirmed",
      "userId": "user123",
      "data": {
        "bookingId": "booking456",
        "serviceTitle": "House Cleaning",
        "providerName": "John Doe",
        "scheduledDate": "2026-01-15T10:00:00Z",
        "totalAmount": 1500,
        "currency": "PHP"
      },
      "status": "pending",
      "createdAt": "2026-01-08T10:30:00Z",
      "updatedAt": "2026-01-08T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  },
  "unreadCount": 5
}
```

### Get Unread Count
```
GET /api/webhooks/events/unread-count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Mark Events as Read
```
POST /api/webhooks/events/mark-read
```

**Request Body:**
```json
{
  "eventIds": ["event123", "event456", "event789"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Events marked as read successfully"
}
```

## Webhook Subscriptions (HTTP Delivery)

If you want to receive events at your own HTTP endpoint, you can create webhook subscriptions.

### Get Webhook Subscriptions
```
GET /api/webhooks/subscriptions
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "sub123",
      "userId": "user123",
      "url": "https://myapp.com/webhooks/localpro",
      "eventTypes": ["booking.confirmed", "payment.successful"],
      "secret": "whsec_abc123...",
      "isActive": true,
      "deliveryStats": {
        "totalAttempts": 145,
        "successfulDeliveries": 143,
        "failedDeliveries": 2,
        "lastSuccessAt": "2026-01-08T10:30:00Z"
      },
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Create Webhook Subscription
```
POST /api/webhooks/subscriptions
```

**Request Body:**
```json
{
  "url": "https://myapp.com/webhooks/localpro",
  "eventTypes": ["booking.confirmed", "payment.successful", "message.received"],
  "description": "Production webhook endpoint",
  "contact": {
    "email": "dev@myapp.com",
    "phone": "+639171234567"
  }
}
```

**Special Event Types:**
- Use `"*"` in eventTypes array to subscribe to all events

**Response:**
```json
{
  "success": true,
  "message": "Webhook subscription created successfully",
  "data": {
    "_id": "sub123",
    "url": "https://myapp.com/webhooks/localpro",
    "eventTypes": ["booking.confirmed", "payment.successful", "message.received"],
    "secret": "whsec_abc123...",
    "isActive": true
  }
}
```

**Important:** Save the `secret` value - you'll need it to verify webhook signatures.

### Update Webhook Subscription
```
PUT /api/webhooks/subscriptions/:id
```

**Request Body:**
```json
{
  "url": "https://myapp.com/webhooks/localpro-v2",
  "eventTypes": ["booking.confirmed", "payment.successful"],
  "isActive": true,
  "description": "Updated webhook endpoint"
}
```

### Delete Webhook Subscription
```
DELETE /api/webhooks/subscriptions/:id
```

### Regenerate Webhook Secret
```
POST /api/webhooks/subscriptions/:id/regenerate-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook secret regenerated successfully",
  "data": {
    "secret": "whsec_new123..."
  }
}
```

### Test Webhook
```
POST /api/webhooks/subscriptions/:id/test
```

Sends a test event to your webhook URL to verify it's working correctly.

## Webhook Payload Format

When an event is delivered to your HTTP endpoint, it will be sent as a POST request with the following format:

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256_hmac_signature
X-Webhook-Event: booking.confirmed
X-Webhook-Id: event123
```

**Body:**
```json
{
  "eventId": "event123",
  "eventType": "booking.confirmed",
  "timestamp": "2026-01-08T10:30:00Z",
  "data": {
    "bookingId": "booking456",
    "serviceTitle": "House Cleaning",
    "providerName": "John Doe",
    "scheduledDate": "2026-01-15T10:00:00Z",
    "totalAmount": 1500,
    "currency": "PHP"
  }
}
```

## Verifying Webhook Signatures

To ensure the webhook is actually from LocalPro, you should verify the signature:

### Node.js Example
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

// In your webhook handler:
app.post('/webhooks/localpro', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'whsec_abc123...'; // Your webhook secret
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process the webhook event
  const { eventType, data } = req.body;
  console.log('Received event:', eventType, data);
  
  res.status(200).json({ received: true });
});
```

### PHP Example
```php
<?php
function verifyWebhookSignature($payload, $signature, $secret) {
    $expectedSignature = hash_hmac('sha256', json_encode($payload), $secret);
    return hash_equals($expectedSignature, $signature);
}

// In your webhook handler:
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];
$secret = 'whsec_abc123...'; // Your webhook secret
$payload = json_decode(file_get_contents('php://input'), true);

if (!verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Process the webhook event
$eventType = $payload['eventType'];
$data = $payload['data'];
error_log("Received event: $eventType");

http_response_code(200);
echo json_encode(['received' => true]);
?>
```

### Python Example
```python
import hmac
import hashlib
import json
from flask import Flask, request

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)

@app.route('/webhooks/localpro', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-Webhook-Signature')
    secret = 'whsec_abc123...'  # Your webhook secret
    payload = request.json
    
    if not verify_webhook_signature(payload, signature, secret):
        return {'error': 'Invalid signature'}, 401
    
    # Process the webhook event
    event_type = payload['eventType']
    data = payload['data']
    print(f'Received event: {event_type}')
    
    return {'received': True}, 200
```

## Webhook Delivery & Retry Logic

1. **Initial Delivery**: Webhook is sent immediately when event occurs
2. **Timeout**: 10 seconds
3. **Success**: HTTP status code 200-299
4. **Retry Policy**: 
   - Up to 3 retry attempts
   - Exponential backoff (2^attempt seconds)
   - Attempts at: 0s, 2s, 4s
5. **Auto-Disable**: Subscription is automatically disabled after 10 consecutive failures

## Event Data Formats

### booking.confirmed
```json
{
  "bookingId": "booking456",
  "serviceTitle": "House Cleaning",
  "providerName": "John Doe",
  "scheduledDate": "2026-01-15T10:00:00Z",
  "totalAmount": 1500,
  "currency": "PHP"
}
```

### booking.completed
```json
{
  "bookingId": "booking456",
  "serviceTitle": "House Cleaning",
  "completedDate": "2026-01-15T14:30:00Z",
  "totalAmount": 1500,
  "currency": "PHP"
}
```

### booking.cancelled
```json
{
  "bookingId": "booking456",
  "serviceTitle": "House Cleaning",
  "cancelledBy": "client",
  "reason": "Schedule conflict",
  "cancelledDate": "2026-01-10T10:00:00Z"
}
```

### message.received
```json
{
  "messageId": "msg789",
  "senderId": "user123",
  "senderName": "Jane Smith",
  "content": "Hello, I have a question about the booking",
  "conversationId": "conv456",
  "sentAt": "2026-01-08T10:30:00Z"
}
```

### payment.successful
```json
{
  "paymentId": "pay123",
  "amount": 1500,
  "currency": "PHP",
  "method": "paypal",
  "transactionId": "PAYPAL-TXN-123",
  "processedAt": "2026-01-08T10:30:00Z"
}
```

### payment.failed
```json
{
  "paymentId": "pay123",
  "amount": 1500,
  "currency": "PHP",
  "method": "paypal",
  "reason": "Insufficient funds",
  "failedAt": "2026-01-08T10:30:00Z"
}
```

### application.status_changed
```json
{
  "applicationId": "app789",
  "jobTitle": "Software Developer",
  "status": "shortlisted",
  "updatedAt": "2026-01-08T10:30:00Z"
}
```

### referral.completed
```json
{
  "referralId": "ref456",
  "referredUserName": "John",
  "rewardAmount": 100,
  "currency": "PHP",
  "completedAt": "2026-01-08T10:30:00Z"
}
```

### subscription.renewed
```json
{
  "subscriptionId": "sub123",
  "planName": "LocalPro Plus Annual",
  "amount": 999,
  "currency": "PHP",
  "renewedAt": "2026-01-08T10:30:00Z",
  "nextBillingDate": "2027-01-08T10:30:00Z"
}
```

### subscription.cancelled
```json
{
  "subscriptionId": "sub123",
  "planName": "LocalPro Plus Annual",
  "reason": "User requested cancellation",
  "cancelledAt": "2026-01-08T10:30:00Z",
  "validUntil": "2026-12-31T23:59:59Z"
}
```

## Best Practices

1. **Respond Quickly**: Your webhook endpoint should respond within 10 seconds
2. **Process Asynchronously**: Queue events for background processing
3. **Handle Duplicates**: Events may be delivered more than once - use eventId for deduplication
4. **Verify Signatures**: Always verify the webhook signature
5. **Monitor Failures**: Check delivery stats regularly
6. **Use HTTPS**: Only use HTTPS URLs for production webhooks
7. **Keep Secrets Secure**: Never commit webhook secrets to version control
8. **Handle All Event Types**: Even if you only subscribe to some events, handle all gracefully

## Troubleshooting

### Webhook Not Being Delivered
1. Check if subscription is active: `GET /api/webhooks/subscriptions`
2. Check delivery stats for errors
3. Verify your endpoint is accessible and responds with 200
4. Test your endpoint: `POST /api/webhooks/subscriptions/:id/test`

### Signature Verification Failing
1. Ensure you're using the correct secret
2. Verify you're stringifying the payload correctly (no extra whitespace)
3. Check you're using SHA256 HMAC

### Missing Events
1. Events are stored for 30 days then automatically deleted
2. Check event filters (eventType, status parameters)
3. Verify you're querying with the correct userId (authentication)

## Support

For webhook system support or questions, please contact the LocalPro development team or create an issue in the project repository.
