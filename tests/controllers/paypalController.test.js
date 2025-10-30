// Mock services before importing controller
jest.mock('../../src/services/paypalService');
jest.mock('../../src/services/paypalSubscriptionService');

const paypalController = require('../../src/controllers/paypalController');
const PayPalService = require('../../src/services/paypalService');
const PayPalSubscriptionService = require('../../src/services/paypalSubscriptionService');

// Mock request and response helpers
const createMockRequest = () => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('PayPal Controller', () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    PayPalService.verifyWebhookSignature = jest.fn();
    PayPalService.processWebhookEvent = jest.fn();
    PayPalService.getWebhookEvents = jest.fn();
    PayPalSubscriptionService.processSubscriptionWebhook = jest.fn();
  });

  describe('Webhook Handling', () => {
    it('should handle subscription payment failed webhook', async () => {
      const webhookData = {
        event_type: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
        resource: {
          id: 'sub-123',
          status: 'SUSPENDED'
        }
      };

      req.body = webhookData;
      req.headers = { 'paypal-transmission-id': 'test-id' };

      PayPalService.verifyWebhookSignature.mockResolvedValue(true);
      PayPalService.processWebhookEvent.mockResolvedValue({ success: true });

      await paypalController.handlePayPalWebhook(req, res);

      expect(PayPalService.verifyWebhookSignature).toHaveBeenCalledWith(req.headers, JSON.stringify(webhookData));
      expect(PayPalService.processWebhookEvent).toHaveBeenCalledWith(webhookData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Webhook processed successfully' });
    });

    it('should handle invalid webhook signature', async () => {
      req.body = { event_type: 'test' };
      req.headers = { 'paypal-transmission-id': 'test-id' };

      PayPalService.verifyWebhookSignature.mockResolvedValue(false);

      await paypalController.handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid webhook signature' });
    });

    it('should handle webhook processing error', async () => {
      req.body = { event_type: 'test' };
      req.headers = { 'paypal-transmission-id': 'test-id' };

      PayPalService.verifyWebhookSignature.mockResolvedValue(true);
      PayPalService.processWebhookEvent.mockResolvedValue({ success: false, error: 'Processing failed' });

      await paypalController.handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Webhook processing failed' });
    });
  });

  describe('Get Webhook Events', () => {
    it('should get webhook events successfully', async () => {
      await paypalController.getWebhookEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook events endpoint - implement logging as needed',
        data: []
      });
    });
  });
});