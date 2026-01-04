# AI Bot n8n Workflows

This directory contains n8n workflows specifically designed for the LocalPro Super App AI Bot system.

## Workflows

### 21-ai-bot-human-escalation.json
**Purpose**: Handles human escalations from the AI Bot system.

**Trigger**: Webhook (`POST /webhook/human-escalation`)

**Features**:
- Receives escalation events from AI Bot
- Checks priority level (critical vs normal)
- Sends notifications to admins
- Sends email alerts
- Updates escalation status in database

**Configuration**:
- Set `ADMIN_EMAIL` environment variable
- Set `ADMIN_USER_ID` environment variable (optional)
- Configure API credentials in n8n environment variables

**Usage**:
The AI Bot service automatically triggers this workflow when an event requires human intervention.

---

### 22-ai-bot-event-processor.json
**Purpose**: Processes AI Bot events and routes them to appropriate handlers.

**Trigger**: Webhook (`POST /webhook/ai-bot-event`)

**Features**:
- Receives events from external sources
- Extracts and validates event data
- Routes events by intent (booking, payment, provider, escrow, support)
- Processes events through AI Bot API

**Configuration**:
- Set `LOCALPRO_API_URL` environment variable
- Set `LOCALPRO_API_KEY` environment variable
- Set `LOCALPRO_API_SECRET` environment variable

**Usage**:
External systems can send events to this webhook, which will then be processed by the AI Bot system.

**Example Request**:
```json
{
  "type": "booking_created",
  "source": "app",
  "data": {
    "bookingId": "...",
    "status": "pending"
  },
  "context": {
    "userId": "...",
    "bookingId": "..."
  }
}
```

---

### 23-ai-bot-analytics-reporting.json
**Purpose**: Generates daily analytics reports for the AI Bot system.

**Trigger**: Cron (Daily at configured time)

**Features**:
- Fetches AI Bot analytics (7-day period)
- Formats report data
- Checks escalation rate
- Sends email report to admins
- Sends alert if escalation rate is high (>10%)
- Saves analytics event to database

**Configuration**:
- Set `ADMIN_EMAIL` environment variable
- Configure cron schedule (default: daily)
- Set API credentials

**Report Includes**:
- Total events processed
- Escalation statistics
- Average processing time
- Events by intent
- Events by status
- Events by sub-agent
- Top workflows executed

---

## Installation

1. **Import Workflows**:
   - Open your n8n instance
   - Go to **Workflows** → **Import from File**
   - Import each JSON file

2. **Configure Environment Variables**:
   In n8n, go to **Settings** → **Environment Variables**:
   ```bash
   LOCALPRO_API_URL=https://your-api-domain.com
   LOCALPRO_API_KEY=lp_abc123xyz...
   LOCALPRO_API_SECRET=lp_sec_xyz789abc...
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_USER_ID=user_id_here
   ```

3. **Get Webhook URLs**:
   - Open each workflow
   - Click on webhook nodes
   - Copy the webhook URL
   - Update `n8nService.js` workflow mapping if needed

4. **Activate Workflows**:
   - Toggle the workflow to "Active"
   - For cron-based workflows, verify the schedule

---

## Integration with AI Bot Service

### Workflow Mapping

Update `src/services/n8nService.js` to map workflow names:

```javascript
this.workflowMapping = {
  'human-escalation': process.env.N8N_WORKFLOW_HUMAN_ESCALATION,
  'ai-bot-event': process.env.N8N_WORKFLOW_AI_BOT_EVENT,
  'ai-bot-analytics': process.env.N8N_WORKFLOW_AI_BOT_ANALYTICS,
  // ... other workflows
};
```

### Environment Variables

Add to your `.env` file:

```bash
# n8n Workflow Webhook IDs (get from n8n after importing)
N8N_WORKFLOW_HUMAN_ESCALATION=webhook-id-here
N8N_WORKFLOW_AI_BOT_EVENT=webhook-id-here
N8N_WORKFLOW_AI_BOT_ANALYTICS=webhook-id-here
```

---

## Workflow Details

### Human Escalation Workflow

**Flow**:
1. Webhook receives escalation event
2. Extract escalation data (eventId, reason, priority)
3. Check priority level
4. Send notification to admin (critical vs normal)
5. Send email alert
6. Update escalation status in database

**Priority Levels**:
- `critical`: Immediate notification
- `high`: High priority notification
- `medium`: Normal notification
- `low`: Normal notification

### Event Processor Workflow

**Flow**:
1. Webhook receives event
2. Extract and validate event data
3. Route by intent (switch node)
4. Process event through AI Bot API
5. Return response

**Supported Intents**:
- `booking_management`
- `payment_processing`
- `provider_operations`
- `escrow_management`
- `support_request`
- `other` (default)

### Analytics Reporting Workflow

**Flow**:
1. Cron triggers daily
2. Fetch AI Bot analytics (7-day period)
3. Format report data
4. Check escalation rate
5. Send escalation alert if rate > 10%
6. Send email report
7. Save analytics event

**Schedule**: Daily (configurable via cron)

---

## Testing

### Test Human Escalation

```bash
curl -X POST https://your-n8n-instance.com/webhook/human-escalation \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-123",
    "reason": "Test escalation",
    "priority": "high",
    "eventData": {},
    "context": {}
  }'
```

### Test Event Processor

```bash
curl -X POST https://your-n8n-instance.com/webhook/ai-bot-event \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking_created",
    "source": "app",
    "data": {
      "bookingId": "test-booking-123"
    },
    "context": {
      "userId": "test-user-123"
    }
  }'
```

### Test Analytics Reporting

The analytics workflow runs automatically on schedule. You can also trigger it manually from n8n.

---

## Troubleshooting

### Workflow Not Triggering

1. Check if workflow is active in n8n
2. Verify webhook URL is correct
3. Check n8n execution logs
4. Verify API credentials

### API Calls Failing

1. Verify `LOCALPRO_API_URL` is correct
2. Check API key and secret
3. Verify API endpoint exists
4. Check API logs for errors

### Email Not Sending

1. Verify `ADMIN_EMAIL` is set
2. Check email service configuration
3. Verify email template exists
4. Check email service logs

---

## Next Steps

1. ✅ Import all workflows
2. ✅ Configure environment variables
3. ✅ Get webhook URLs
4. ✅ Update workflow mapping in `n8nService.js`
5. ✅ Test each workflow
6. ✅ Monitor execution logs
7. ✅ Adjust schedules and thresholds as needed

---

**These workflows integrate seamlessly with the AI Bot system, providing automation, monitoring, and escalation capabilities.**
