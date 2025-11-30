# PayMongo Testing & Implementation Guide

## Quick Start

### 1. Configure Environment

Create `.env.test` or update `.env`:

```env
NODE_ENV=development
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx
```

### 2. Install Dependencies

Dependencies are already in `package.json`:
- `axios` - HTTP client for PayMongo API calls
- `crypto` - For webhook signature verification

### 3. Test Payment Integration

#### Test Authorization (Hold)

```bash
curl -X POST http://localhost:5000/api/paymongo/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "amount": 50000,
    "currency": "PHP"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "intentId": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "publishableKey": "pk_test_xxx"
  }
}
```

#### Test Payment Confirmation

```bash
curl -X POST http://localhost:5000/api/paymongo/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "intentId": "pi_xxx",
    "paymentMethodId": "pm_xxx",
    "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "amount": 50000,
    "currency": "PHP"
  }'
```

## Unit Tests

Create `src/__tests__/unit/paymongoService.test.js`:

```javascript
const paymongoService = require('../../services/paymongoService');
const axios = require('axios');

jest.mock('axios');

describe('PayMongoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuthorization', () => {
    it('should create payment authorization', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'pi_test_123',
            attributes: {
              status: 'awaiting_payment_method',
              amount: 50000,
              currency: 'PHP'
            }
          }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await paymongoService.createAuthorization({
        amount: 50000,
        currency: 'PHP',
        clientId: 'user_123',
        bookingId: 'booking_123'
      });

      expect(result.success).toBe(true);
      expect(result.holdId).toBe('pi_test_123');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/payment_intents'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const result = await paymongoService.createAuthorization({
        amount: 50000,
        currency: 'PHP'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('API Error');
    });
  });

  describe('capturePayment', () => {
    it('should capture authorized payment', async () => {
      const mockGetResponse = {
        data: {
          data: {
            id: 'pi_test_123',
            attributes: {
              charges: {
                data: [
                  {
                    id: 'charge_123',
                    status: 'authorized'
                  }
                ]
              }
            }
          }
        }
      };

      const mockCaptureResponse = {
        data: {
          data: {
            id: 'charge_123',
            attributes: {
              status: 'captured',
              amount: 50000
            }
          }
        }
      };

      axios.get.mockResolvedValue(mockGetResponse);
      axios.post.mockResolvedValue(mockCaptureResponse);

      const result = await paymongoService.capturePayment('pi_test_123');

      expect(result.success).toBe(true);
      expect(result.captureId).toBe('charge_123');
    });
  });

  describe('refundPayment', () => {
    it('should create refund', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'refund_123',
            attributes: {
              status: 'pending',
              amount: 50000,
              charge_id: 'charge_123'
            }
          }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await paymongoService.refundPayment('charge_123', {
        amount: 50000,
        reason: 'customer_request'
      });

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund_123');
    });
  });
});
```

## Integration Tests

Create `src/__tests__/integration/escrow-paymongo.test.js`:

```javascript
const request = require('supertest');
const app = require('../../server');
const Escrow = require('../../models/Escrow');
const User = require('../../models/User');
const Booking = require('../../models/Marketplace');
const jwt = require('jsonwebtoken');

describe('Escrow with PayMongo Integration', () => {
  let clientToken, providerToken, booking;

  beforeAll(async () => {
    // Create test users
    const client = await User.create({
      name: 'Test Client',
      email: 'client@test.com',
      password: 'password123'
    });

    const provider = await User.create({
      name: 'Test Provider',
      email: 'provider@test.com',
      password: 'password123'
    });

    // Create tokens
    clientToken = jwt.sign(
      { id: client._id, role: 'client' },
      process.env.JWT_SECRET
    );

    providerToken = jwt.sign(
      { id: provider._id, role: 'provider' },
      process.env.JWT_SECRET
    );

    // Create booking
    booking = await Booking.create({
      clientId: client._id,
      providerId: provider._id,
      serviceType: 'plumbing',
      pricing: { total: 50000 },
      status: 'pending'
    });
  });

  describe('Full Escrow Cycle with PayMongo', () => {
    let escrowId;

    it('should create escrow with PayMongo authorization', async () => {
      const res = await request(app)
        .post('/api/escrows/create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          bookingId: booking._id,
          providerId: booking.providerId,
          amount: 50000,
          currency: 'PHP',
          holdProvider: 'paymongo'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('FUNDS_HELD');
      expect(res.body.data.holdProvider).toBe('paymongo');

      escrowId = res.body.data._id;
    });

    it('should retrieve escrow details', async () => {
      const res = await request(app)
        .get(`/api/escrows/${escrowId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escrow.status).toBe('FUNDS_HELD');
    });

    it('should upload proof of work', async () => {
      const res = await request(app)
        .post(`/api/escrows/${escrowId}/proof-of-work`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          documents: [
            {
              type: 'photo',
              url: 'https://example.com/proof.jpg'
            }
          ],
          notes: 'Work completed successfully'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proofOfWork.notes).toBe('Work completed successfully');
    });

    it('should capture payment on client approval', async () => {
      const res = await request(app)
        .post(`/api/escrows/${escrowId}/capture`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.clientApproval.approved).toBe(true);
    });

    it('should process payout to provider', async () => {
      const res = await request(app)
        .post(`/api/escrows/${escrowId}/payout`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escrow.status).toBe('PAYOUT_INITIATED');
    });

    it('should retrieve transaction history', async () => {
      const res = await request(app)
        .get(`/api/escrows/${escrowId}/transactions`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      const transactionTypes = res.body.data.map(t => t.transactionType);
      expect(transactionTypes).toContain('HOLD');
      expect(transactionTypes).toContain('CAPTURE');
    });
  });

  describe('Dispute Handling with PayMongo', () => {
    let escrowId;

    beforeEach(async () => {
      // Create new escrow for dispute test
      const res = await request(app)
        .post('/api/escrows/create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          bookingId: booking._id,
          providerId: booking.providerId,
          amount: 50000,
          currency: 'PHP',
          holdProvider: 'paymongo'
        });

      escrowId = res.body.data._id;
    });

    it('should initiate dispute', async () => {
      const res = await request(app)
        .post(`/api/escrows/${escrowId}/dispute`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'Work not completed',
          evidence: [
            {
              type: 'photo',
              url: 'https://example.com/evidence.jpg'
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DISPUTE');
    });

    it('should refund on dispute resolution', async () => {
      const res = await request(app)
        .post(`/api/escrows/${escrowId}/dispute`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'Work not completed',
          evidence: []
        });

      const disputeEscrowId = res.body.data._id;

      // Resolve dispute with refund
      const resolveRes = await request(app)
        .post(`/api/escrows/${disputeEscrowId}/dispute/resolve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          decision: 'REFUND_CLIENT',
          notes: 'Work was not satisfactory'
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.success).toBe(true);
    });
  });
});
```

## Webhook Testing

### Test Webhook Locally

Use ngrok to expose localhost:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok (in another terminal)
ngrok http 5000

# Configure PayMongo with ngrok URL
# https://xxxxxxxx.ngrok.io/webhooks/payments?provider=paymongo
```

### Simulate Webhook Locally

Create `test-webhook.js`:

```javascript
const crypto = require('crypto');
const axios = require('axios');

const testPaymentSuccessWebhook = async () => {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  
  const payload = {
    type: 'payment_intent.succeeded',
    data: {
      id: 'pi_test_123',
      attributes: {
        status: 'succeeded',
        amount: 50000,
        currency: 'PHP',
        charges: {
          data: [
            {
              id: 'charge_test_123',
              attributes: {
                status: 'authorized',
                amount: 50000
              }
            }
          ]
        }
      }
    }
  };

  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');

  try {
    const response = await axios.post(
      'http://localhost:5000/webhooks/payments?provider=paymongo',
      payload,
      {
        headers: {
          'x-signature': signature
        }
      }
    );

    console.log('Webhook test successful:', response.data);
  } catch (error) {
    console.error('Webhook test failed:', error.response?.data || error.message);
  }
};

testPaymentSuccessWebhook();
```

Run it:

```bash
PAYMONGO_WEBHOOK_SECRET=whsec_test_xxx node test-webhook.js
```

## Debugging

### Enable Detailed Logging

Add to your service:

```javascript
// In paymongoService.js
logger.debug('PayMongo Request', {
  method: 'POST',
  url: `${this.baseUrl}/payment_intents`,
  headers: { Authorization: 'Basic [redacted]' },
  body: payload
});
```

### Check PayMongo Dashboard

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Click on "Logs" section
3. Review API requests and responses
4. Check webhook delivery status

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API keys in .env |
| 422 Invalid Request | Verify amount in cents, currency code |
| Webhook not received | Check webhook URL, verify firewall, test signature |
| Rate limit exceeded | Implement exponential backoff retry logic |
| Charge not capturing | Verify authorization still valid (< 7 days) |

## Performance Testing

### Load Test with Artillery

Create `load-test.yml`:

```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 30
      name: "Sustained load"

scenarios:
  - name: "Create Intent Flow"
    flow:
      - post:
          url: "/api/paymongo/create-intent"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            bookingId: "64f1a2b3c4d5e6f7g8h9i0j1"
            providerId: "64f1a2b3c4d5e6f7g8h9i0j2"
            amount: 50000
            currency: "PHP"
```

Run:

```bash
npm install -g artillery
artillery run load-test.yml
```

## Production Checklist

- [ ] Use live API keys (not test)
- [ ] Enable webhook signature verification
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test all error scenarios
- [ ] Configure HTTPS
- [ ] Enable audit logging
- [ ] Set up PCI compliance
- [ ] Document runbooks
- [ ] Train support team
