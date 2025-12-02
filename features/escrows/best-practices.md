# Escrow Feature: Best Practices & Implementation Guide

## Table of Contents
1. [Security Best Practices](#security-best-practices)
2. [Implementation Patterns](#implementation-patterns)
3. [Error Handling](#error-handling)
4. [Webhook Integration](#webhook-integration)
5. [Testing Strategies](#testing-strategies)
6. [Performance Optimization](#performance-optimization)
7. [Compliance & Auditing](#compliance--auditing)
8. [Troubleshooting](#troubleshooting)

## Security Best Practices

### 1. Payment Data Protection

**DO:**
```javascript
// ✅ Hash sensitive payment info
const encryptPaymentData = (accountNumber) => {
  return bcrypt.hashSync(accountNumber, 10);
};

// ✅ Use HTTPS for all payment endpoints
app.use(helmet());

// ✅ Validate and sanitize user input
router.post('/escrows/create', [
  body('amount').isInt({ min: 1 }),
  body('currency').isIn(['USD', 'PHP', 'EUR', 'GBP', 'JPY']),
  body('holdProvider').isIn(['paymongo', 'xendit', 'stripe', 'paypal', 'paymaya'])
], createEscrow);
```

**DON'T:**
```javascript
// ❌ Store plain text payment info
const unsafeStore = {
  accountNumber: "1234567890" // NEVER store like this
};

// ❌ Log sensitive data
logger.info('Payment details:', { cardNumber: "1234-5678-9012-3456" }); // WRONG

// ❌ Pass sensitive data in URLs
const url = `http://api.example.com/pay?card=1234567890&cvv=123`; // WRONG
```

### 2. Authorization & Access Control

**DO:**
```javascript
// ✅ Verify user ownership before operations
const capturePayment = async (req, res) => {
  const escrow = await Escrow.findById(req.params.id);
  
  // Verify client ownership
  if (escrow.clientId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
  
  // Proceed with capture
};

// ✅ Use role-based access control
router.post('/:id/dispute/resolve', 
  authorize('admin'), // Only admins can resolve disputes
  resolveDispute
);
```

**DON'T:**
```javascript
// ❌ Skip authorization checks
const unsafeCapture = async (req, res) => {
  const escrow = await Escrow.findById(req.params.id);
  await captureFromGateway(escrow); // No ownership check!
};

// ❌ Trust user-provided IDs
router.get('/:userId/escrows', getEscrows); // WRONG: User could query others' data
```

### 3. Webhook Security

**DO:**
```javascript
// ✅ Verify webhook signatures
const verifyWebhook = (provider, signature, payload) => {
  const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`];
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};

// ✅ Whitelist webhook IPs
const allowedWebhookIPs = ['1.2.3.4', '5.6.7.8']; // From payment gateway
router.post('/webhooks/payments', (req, res, next) => {
  if (!allowedWebhookIPs.includes(req.ip)) {
    return res.status(403).json({ success: false });
  }
  next();
});

// ✅ Use idempotency for webhooks
const processWebhook = async (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  // Check if already processed
  const existing = await WebhookLog.findOne({ idempotencyKey });
  if (existing) {
    return res.status(200).json({ success: true }); // Return success without reprocessing
  }
  
  // Process webhook...
  await WebhookLog.create({ idempotencyKey, payload: req.body });
};
```

**DON'T:**
```javascript
// ❌ Skip signature verification
router.post('/webhooks/payments', handlePayment); // No signature check!

// ❌ Trust webhook content without validation
const unsafeHandler = (req, res) => {
  const payout = await Payout.findById(req.body.payoutId);
  payout.status = req.body.status; // WRONG: Trust user input
};

// ❌ Process duplicate webhooks
// Missing idempotency check can cause double charges
```

## Implementation Patterns

### 1. Client-Side Flow

```javascript
// Step 1: Client requests service from provider
const booking = await Booking.create({
  clientId: client._id,
  providerId: provider._id,
  serviceDetails: {...},
  pricing: { total: 50000 }
});

// Step 2: Client initiates payment
const escrow = await escrowService.createEscrow({
  bookingId: booking._id,
  clientId: client._id,
  providerId: provider._id,
  amount: booking.pricing.total,
  currency: 'USD',
  holdProvider: 'xendit'
});

// Update booking with escrow
booking.escrowId = escrow._id;
booking.status = 'PAYMENT_PENDING';
await booking.save();

// Step 3: Show client payment confirmation
res.json({
  success: true,
  message: 'Funds held. Please wait for provider to complete work.',
  escrow
});
```

### 2. Provider-Side Flow

```javascript
// Provider performs work
const workDetails = {
  description: 'Completed plumbing repair',
  startTime: new Date(),
  endTime: new Date()
};

// Upload proof of work
const documents = [
  {
    type: 'photo',
    url: 'https://cloudinary.com/.../before.jpg'
  },
  {
    type: 'photo',
    url: 'https://cloudinary.com/.../after.jpg'
  }
];

await escrowService.uploadProofOfWork(
  escrowId,
  provider._id,
  documents,
  'Work completed as agreed'
);

// Notify client to review
await emailService.sendEmail({
  to: client.email,
  subject: 'Work Completed - Please Review',
  template: 'proof_uploaded',
  data: { booking, escrow, documents }
});
```

### 3. Client Approval Flow

```javascript
// Client reviews proof of work
const escrow = await escrowService.getEscrowDetails(escrowId);

// Client approves
if (clientApproves) {
  const result = await escrowService.capturePayment(escrowId, client._id);
  
  // Update booking
  booking.status = 'AWAITING_PROVIDER_PAYOUT';
  await booking.save();
  
  // Notify provider
  await emailService.sendEmail({
    to: provider.email,
    subject: 'Client Approved - Request Your Payout',
    template: 'payment_captured'
  });
} else {
  // Client can dispute
  await escrowService.initiateDispute(escrowId, client._id, reason, evidence);
}
```

### 4. Payout Flow

```javascript
// Provider requests payout
const { payout } = await escrowService.processPayout(escrowId, provider._id);

// Monitor payout status via webhook
// Webhook will update payout.status to 'COMPLETED'

// On completion, update booking
booking.status = 'COMPLETED';
booking.completedAt = new Date();
await booking.save();

// Notify both parties
await emailService.notifyCompletion(client, provider, booking);
```

## Error Handling

### 1. Payment Gateway Errors

```javascript
const handleGatewayError = async (error, escrowId) => {
  const escrow = await Escrow.findById(escrowId);
  
  // Log error for debugging
  logger.error('Gateway error:', {
    escrowId,
    error: error.message,
    code: error.code,
    status: error.statusCode
  });
  
  // Take appropriate action
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // Refund the hold
    await escrowService.refundPayment(
      escrowId,
      'Payment failed: Insufficient funds',
      SYSTEM_USER
    );
  } else if (error.code === 'INVALID_CARD') {
    // Notify client to update payment method
    await emailService.sendEmail({
      to: escrow.client.email,
      subject: 'Payment Failed - Invalid Card',
      template: 'payment_failed'
    });
  }
};

// Implement retry logic
const createEscrowWithRetry = async (escrowData, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await escrowService.createEscrow(escrowData);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    }
  }
};
```

### 2. Webhook Processing Errors

```javascript
const safeWebhookHandler = async (req, res) => {
  const webhookId = req.headers['x-webhook-id'];
  
  try {
    // Process webhook
    await processPayoutWebhook(req.body);
    
    // Mark as processed
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', {
      webhookId,
      error: error.message,
      payload: req.body
    });
    
    // Return 500 so gateway retries
    res.status(500).json({
      success: false,
      message: 'Processing failed. Will retry.'
    });
  }
};
```

### 3. Validation Errors

```javascript
const validateEscrowCreation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};
```

## Webhook Integration

### 1. Setting Up Webhooks

```javascript
// In your gateway configuration:

// Xendit
const xenditWebhookUrl = `${process.env.API_BASE_URL}/webhooks/payments?provider=xendit`;
// Configure in Xendit dashboard: https://dashboard.xendit.co/webhooks

// PayMongo
const paymongo WebhookUrl = `${process.env.API_BASE_URL}/webhooks/payments?provider=paymongo`;
// Configure in PayMongo dashboard: https://dashboard.paymongo.com/webhooks

// Stripe
const stripeWebhookUrl = `${process.env.API_BASE_URL}/webhooks/payments?provider=stripe`;
// Configure via CLI: stripe listen --forward-to yourapp.com/webhooks/payments
```

### 2. Processing Events

```javascript
const handlePayoutSuccess = async (payoutData) => {
  const { id: gatewayPayoutId, reference_id: payoutId } = payoutData;
  
  try {
    // Find the payout
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      logger.warn(`Payout not found: ${payoutId}`);
      return;
    }
    
    // Update status
    await escrowService.completePayout(payoutId, payoutData);
    
    // Update related booking
    const escrow = await Escrow.findById(payout.escrowId);
    const booking = await Booking.findById(escrow.bookingId);
    booking.status = 'COMPLETED';
    await booking.save();
    
    // Send notifications
    await emailService.sendPayoutConfirmation(payout);
    
  } catch (error) {
    logger.error('Payout completion handler error:', error);
    throw error;
  }
};
```

## Testing Strategies

### 1. Unit Tests

```javascript
describe('EscrowService', () => {
  describe('createEscrow', () => {
    it('should create escrow with correct status', async () => {
      const escrow = await escrowService.createEscrow({
        bookingId: mockBooking._id,
        clientId: mockClient._id,
        providerId: mockProvider._id,
        amount: 50000,
        currency: 'USD',
        holdProvider: 'xendit'
      });
      
      expect(escrow.status).toBe('FUNDS_HELD');
      expect(escrow.amount).toBe(50000);
    });
    
    it('should log transaction', async () => {
      await escrowService.createEscrow(...);
      
      const transaction = await EscrowTransaction.findOne({
        transactionType: 'HOLD'
      });
      
      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('SUCCESS');
    });
  });
});
```

### 2. Integration Tests

```javascript
describe('Escrow Flow', () => {
  it('should complete full escrow cycle', async () => {
    // Create booking
    const booking = await Booking.create({...});
    
    // Create escrow
    const escrow = await escrowService.createEscrow({...});
    expect(escrow.status).toBe('FUNDS_HELD');
    
    // Upload proof
    await escrowService.uploadProofOfWork(...);
    
    // Capture payment
    const result = await escrowService.capturePayment(...);
    expect(result.escrow.status).toBe('IN_PROGRESS');
    
    // Request payout
    const payout = await escrowService.processPayout(...);
    expect(payout.status).toBe('PROCESSING');
  });
});
```

### 3. Webhook Testing

```javascript
describe('Webhook Handlers', () => {
  it('should handle payout success webhook', async () => {
    const webhook = {
      event: 'disbursement_succeeded',
      data: {
        id: 'xdt_payout_123',
        status: 'COMPLETED'
      }
    };
    
    const response = await request(app)
      .post('/webhooks/disbursements')
      .set('x-signature', validSignature)
      .send(webhook);
    
    expect(response.status).toBe(200);
    
    // Verify payout was updated
    const payout = await Payout.findOne({
      gatewayPayoutId: 'xdt_payout_123'
    });
    expect(payout.status).toBe('COMPLETED');
  });
});
```

## Performance Optimization

### 1. Database Indexing

```javascript
// In Escrow model
escrowSchema.index({ bookingId: 1, status: 1 });
escrowSchema.index({ clientId: 1, status: 1 });
escrowSchema.index({ providerId: 1, status: 1 });
escrowSchema.index({ createdAt: -1 });

// In Payout model
payoutSchema.index({ escrowId: 1 });
payoutSchema.index({ providerId: 1, status: 1 });

// In EscrowTransaction model (audit log)
escrowTransactionSchema.index({ escrowId: 1, timestamp: -1 });
```

### 2. Query Optimization

```javascript
// DON'T: N+1 queries
const escrows = await Escrow.find({ clientId });
for (const escrow of escrows) {
  const payout = await Payout.findOne({ escrowId: escrow._id }); // N+1!
}

// DO: Use populate or lean
const escrows = await Escrow.find({ clientId })
  .populate('providerId', 'name email')
  .lean(); // Use lean() for read-only queries

// Or aggregate
const escrows = await Escrow.aggregate([
  { $match: { clientId } },
  { $lookup: {
      from: 'payouts',
      localField: '_id',
      foreignField: 'escrowId',
      as: 'payout'
    }
  }
]);
```

### 3. Caching

```javascript
// Cache frequently accessed escrow details
const getEscrowDetailsWithCache = async (escrowId) => {
  const cacheKey = `escrow:${escrowId}`;
  
  // Try cache first
  let escrow = await redis.get(cacheKey);
  if (escrow) return JSON.parse(escrow);
  
  // Fetch from DB
  escrow = await Escrow.findById(escrowId);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(escrow));
  
  return escrow;
};
```

## Compliance & Auditing

### 1. Immutable Audit Log

```javascript
// All transactions are logged in immutable ledger
const logTransaction = async (transactionData) => {
  const transaction = new EscrowTransaction({
    ...transactionData,
    timestamp: new Date(),
    initiatedBy: req.user.id
  });
  
  await transaction.save();
  
  // Prevent updates
  transaction.pre('updateOne', function(next) {
    next(new Error('Transactions are immutable'));
  });
};
```

### 2. Compliance Reporting

```javascript
// Export transaction history for compliance
const generateComplianceReport = async (startDate, endDate) => {
  const transactions = await EscrowTransaction.find({
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: 1 });
  
  return transactions.map(t => ({
    date: t.timestamp,
    type: t.transactionType,
    amount: t.amount,
    status: t.status,
    actor: t.initiatedBy,
    gateway: t.gateway.provider
  }));
};
```

### 3. Money Laundering Prevention

```javascript
// Flag suspicious transactions
const checkForSuspiciousActivity = async (escrow) => {
  // Same user as both client and provider
  if (escrow.clientId === escrow.providerId) {
    logger.warn('Suspicious: Same user as client and provider');
    return { suspicious: true, reason: 'Self-transaction' };
  }
  
  // Large amounts
  if (escrow.amount > 5000000) { // $50,000
    logger.warn('Large transaction:', escrow.amount);
  }
  
  // Multiple rapid transactions
  const recentCount = await Escrow.countDocuments({
    clientId: escrow.clientId,
    createdAt: { $gte: new Date(Date.now() - 3600000) } // Last hour
  });
  
  if (recentCount > 10) {
    return { suspicious: true, reason: 'Rapid transactions' };
  }
  
  return { suspicious: false };
};
```

## Troubleshooting

### Issue: Webhook Not Received

**Check:**
1. Webhook URL is publicly accessible
2. Webhook signature is verified correctly
3. Gateway has correct endpoint configured
4. Firewall allows inbound traffic on port 443

**Solution:**
```javascript
// Test webhook signature locally
const testWebhookSignature = (provider, payload, receivedSignature) => {
  const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`];
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  console.log('Expected:', hash);
  console.log('Received:', receivedSignature);
  console.log('Match:', hash === receivedSignature);
};
```

### Issue: Payment Hold Failed

**Causes:**
- Invalid payment method
- Insufficient funds
- Card declined
- API credentials incorrect

**Solution:**
```javascript
// Detailed error logging
try {
  await gateway.createHold(escrowData);
} catch (error) {
  logger.error('Hold creation failed:', {
    errorCode: error.code,
    errorMessage: error.message,
    statusCode: error.statusCode,
    requestBody: {
      amount: escrowData.amount,
      currency: escrowData.currency
      // Don't log sensitive payment info
    }
  });
}
```

### Issue: Payout Stuck in PROCESSING

**Check:**
1. Payout status in gateway dashboard
2. Provider account verification status
3. Payout method validity
4. Webhook processed correctly

**Solution:**
```javascript
// Manual status check
const checkPayoutStatus = async (payoutId) => {
  const payout = await Payout.findById(payoutId);
  
  // Check with gateway
  const gatewayStatus = await gateway.getPayoutStatus(payout.gatewayPayoutId);
  
  // Sync status if different
  if (gatewayStatus !== payout.status) {
    payout.status = gatewayStatus;
    await payout.save();
  }
  
  return payout;
};
```

## Implementation Checklist

- [ ] Configure all payment gateways
- [ ] Set up webhook endpoints and verify signatures
- [ ] Implement all status transitions
- [ ] Create email templates for notifications
- [ ] Set up immutable audit logging
- [ ] Implement dispute resolution workflow
- [ ] Configure rate limiting
- [ ] Add comprehensive error handling
- [ ] Write unit and integration tests
- [ ] Set up monitoring and alerting
- [ ] Document API for clients
- [ ] Train support team on dispute resolution
- [ ] Create runbooks for common issues
- [ ] Set up compliance reporting
- [ ] Test full escrow cycle end-to-end
