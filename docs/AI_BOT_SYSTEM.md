# LocalPro Super App AI Bot - AI Operating System

## Overview

The LocalPro Super App AI Bot is structured as an **AI Operating System** rather than a simple chatbot. It acts as a controller/orchestrator that listens to events, classifies intent, dispatches tasks to specialized sub-agents, executes workflows via n8n, and escalates only what requires human intervention.

**Core Philosophy**: The AI Bot is COO + Ops Manager + Support Lead + Dispatcher + Auditor.

## Architecture

### Core Components

1. **AI Bot Service** (`src/services/aiBotService.js`)
   - Main controller/orchestrator
   - Classifies intent using AI
   - Dispatches to sub-agents
   - Manages escalation
   - Executes n8n workflows

2. **Event Listener** (`src/services/aiBotEventListener.js`)
   - Listens to events from various sources
   - Queues events for processing
   - Supports: API, app, POS, payments, GPS, CRM, webhooks, n8n

3. **Sub-Agents** (`src/services/aiBotSubAgents/`)
   - Specialized agents for different domains:
     - `providerAgent`: Provider operations, verification, onboarding
     - `bookingAgent`: Booking management, scheduling, cancellations
     - `paymentAgent`: Payment processing, transactions, refunds
     - `escrowAgent`: Escrow management, disputes, settlements
     - `supportAgent`: Customer support, help requests
     - `operationsAgent`: System operations, maintenance, monitoring
     - `auditAgent`: Audit logs, compliance, security
     - `marketingAgent`: Marketing campaigns, promotions
     - `analyticsAgent`: Analytics, reports, insights

4. **n8n Integration** (`src/services/n8nService.js`)
   - Triggers n8n workflows
   - Manages workflow execution
   - Handles webhook communication

5. **Data Model** (`src/models/AIBot.js`)
   - Stores all AI Bot interactions
   - Tracks intent classification
   - Records actions taken
   - Manages escalation history

## How It Works

### 1. Event Reception

Events can come from multiple sources:
- **API**: HTTP requests to `/api/ai-bot/events`
- **App**: Mobile/web app actions
- **POS**: Point of sale transactions
- **Payments**: Payment gateway webhooks
- **GPS**: Location tracking events
- **CRM**: Customer relationship management updates
- **Webhooks**: External system webhooks
- **n8n**: Workflow-triggered events

### 2. Intent Classification

The AI Bot uses OpenAI (or configured AI provider) to classify event intent:

- `booking_management`: Booking operations
- `payment_processing`: Payment events
- `provider_operations`: Provider management
- `escrow_management`: Escrow operations
- `support_request`: Customer support
- `user_onboarding`: New user flows
- `verification`: Identity/document verification
- `dispute_resolution`: Conflicts and disputes
- `analytics_reporting`: Reports and insights
- `system_maintenance`: System operations
- `marketing_campaign`: Marketing activities
- `notification_delivery`: Notifications
- `data_sync`: Data synchronization
- `audit_review`: Audit and compliance

### 3. Sub-Agent Dispatch

Based on intent classification, events are dispatched to specialized sub-agents:

```javascript
// Example: Booking event
{
  intent: 'booking_management',
  subAgent: 'booking_agent',
  actions: [...],
  workflows: [...]
}
```

### 4. Workflow Execution

Sub-agents can trigger n8n workflows for automation:

```javascript
workflows.push({
  name: 'booking-reminders',
  workflowId: 'booking-reminders',
  data: { bookingId, eventType, timestamp }
});
```

### 5. Escalation

Events are escalated to humans when:
- Risk level is `critical`
- AI recommends human intervention
- Sub-agent determines escalation needed
- System errors occur

## API Endpoints

### Process Event
```http
POST /api/ai-bot/events
Content-Type: application/json

{
  "type": "booking_created",
  "source": "api",
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

### Get Interactions
```http
GET /api/ai-bot/interactions?status=completed&limit=50&page=1
```

### Get Interaction by ID
```http
GET /api/ai-bot/interactions/:eventId
```

### Get Analytics
```http
GET /api/ai-bot/analytics?timeRange=7d
```

### Emit App Event
```http
POST /api/ai-bot/events/app
Content-Type: application/json

{
  "type": "user_action",
  "data": { ... },
  "context": { ... }
}
```

### Emit POS Event
```http
POST /api/ai-bot/events/pos
Content-Type: application/json

{
  "transactionId": "...",
  "amount": 100.00,
  ...
}
```

### Emit Payment Event
```http
POST /api/ai-bot/events/payment
Content-Type: application/json

{
  "type": "payment_received",
  "data": { ... }
}
```

### Emit GPS Event
```http
POST /api/ai-bot/events/gps
Content-Type: application/json

{
  "userId": "...",
  "location": { "lat": 0, "lng": 0 },
  ...
}
```

### Emit CRM Event
```http
POST /api/ai-bot/events/crm
Content-Type: application/json

{
  "type": "customer_update",
  "data": { ... }
}
```

## Configuration

### Environment Variables

```bash
# Enable AI Bot
ENABLE_AI_BOT=true

# n8n Integration
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_URL=http://localhost:5678
N8N_WEBHOOK_PATH=/webhook
N8N_API_KEY=your-n8n-api-key-here

# AI Provider (for intent classification)
OPENAI_API_KEY=your-openai-api-key
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
```

### n8n Workflow Mapping

Map workflow names to webhook IDs in `n8nService.js`:

```javascript
this.workflowMapping = {
  'booking-reminders': process.env.N8N_WORKFLOW_BOOKING_REMINDERS,
  'paypal-webhook': process.env.N8N_WORKFLOW_PAYPAL_WEBHOOK,
  'user-onboarding': process.env.N8N_WORKFLOW_USER_ONBOARDING,
  // ... more workflows
};
```

## Usage Examples

### Example 1: Booking Created Event

```javascript
const aiBotService = require('./services/aiBotService');

await aiBotService.processEvent({
  type: 'booking_created',
  source: 'api',
  data: {
    bookingId: '...',
    clientId: '...',
    providerId: '...',
    status: 'pending'
  },
  context: {
    userId: '...',
    bookingId: '...'
  }
});
```

### Example 2: Payment Received Event

```javascript
await aiBotService.processEvent({
  type: 'payment_received',
  source: 'payments',
  data: {
    paymentId: '...',
    amount: 100.00,
    gateway: 'paypal',
    transactionId: '...'
  },
  context: {
    userId: '...',
    bookingId: '...'
  }
});
```

### Example 3: Provider Registration Event

```javascript
await aiBotService.processEvent({
  type: 'provider_registered',
  source: 'api',
  data: {
    userId: '...',
    providerType: 'individual'
  },
  context: {
    userId: '...'
  }
});
```

## Integration with Existing Systems

### Middleware Integration

You can integrate the AI Bot into existing middleware:

```javascript
const aiBotEventListener = require('./services/aiBotEventListener');

// In your booking controller
const createBooking = async (req, res) => {
  // ... create booking logic ...
  
  // Emit event to AI Bot
  await aiBotEventListener.listenToAppEvent({
    type: 'booking_created',
    data: {
      bookingId: booking._id,
      status: booking.status
    },
    context: {
      userId: req.user.id,
      bookingId: booking._id
    }
  });
  
  // ... rest of response ...
};
```

### Webhook Integration

For payment webhooks:

```javascript
// In PayPal webhook handler
app.post('/webhooks/paypal', async (req, res) => {
  // ... validate webhook ...
  
  // Emit to AI Bot
  await aiBotEventListener.listenToPaymentEvent({
    type: 'payment_received',
    data: {
      paymentId: webhookData.id,
      amount: webhookData.amount,
      gateway: 'paypal'
    }
  });
  
  // ... process webhook ...
});
```

## Monitoring and Analytics

### View Interactions

```http
GET /api/ai-bot/interactions?status=completed&limit=50
```

### View Analytics

```http
GET /api/ai-bot/analytics?timeRange=30d
```

Response includes:
- Total events processed
- Events by intent
- Events by status
- Events by sub-agent
- Escalation statistics
- Average processing time
- Top workflows executed

## Escalation

Events are automatically escalated when:
1. Risk level is `critical`
2. AI recommends human intervention
3. Sub-agent determines escalation needed
4. System errors occur

Escalated events:
- Are marked in the database
- Trigger n8n `human-escalation` workflow
- Can be assigned to specific admins
- Track resolution status

## Best Practices

1. **Event Structure**: Always include `type`, `source`, `data`, and `context`
2. **Error Handling**: Wrap event processing in try-catch
3. **Async Processing**: Events are queued and processed asynchronously
4. **Monitoring**: Regularly check analytics and escalation rates
5. **Workflow Design**: Design n8n workflows to handle common scenarios
6. **Escalation**: Only escalate when truly needed to reduce human workload

## Troubleshooting

### Events Not Processing

1. Check if AI Bot is enabled: `ENABLE_AI_BOT=true`
2. Verify event structure (must have `type` and `source`)
3. Check logs for errors
4. Verify n8n connection if workflows are involved

### High Escalation Rate

1. Review escalation rules in sub-agents
2. Adjust risk level thresholds
3. Improve AI intent classification prompts
4. Review event data quality

### Workflow Not Triggering

1. Verify n8n base URL and webhook path
2. Check workflow mapping in `n8nService.js`
3. Verify webhook ID in environment variables
4. Check n8n execution logs

## Future Enhancements

- [ ] Real-time event streaming
- [ ] Advanced ML models for intent classification
- [ ] Predictive escalation
- [ ] Multi-language support
- [ ] Custom sub-agents
- [ ] Workflow templates
- [ ] Performance optimization
- [ ] Advanced analytics dashboard

---

**The AI Bot is your AI Operating System - it orchestrates, dispatches, executes, and escalates, making your platform more intelligent and automated.**
