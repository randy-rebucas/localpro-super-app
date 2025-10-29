const PayMayaService = require('../../src/services/paymayaService');
const LocalProPlus = require('../../src/models/LocalProPlus');
const Finance = require('../../src/models/Finance');
const Marketplace = require('../../src/models/Marketplace');
const Supplies = require('../../src/models/Supplies');
const logger = require('../../src/config/logger');

// Mock dependencies
jest.mock('../../src/services/paymayaService', () => ({
  createCheckout: jest.fn(),
  getCheckout: jest.fn(),
  createPayment: jest.fn(),
  createInvoice: jest.fn(),
  verifyWebhookSignature: jest.fn(),
  processWebhookEvent: jest.fn(),
  validateConfig: jest.fn()
}));
jest.mock('../../src/models/LocalProPlus', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  findByIdAndDelete: jest.fn().mockResolvedValue({}),
  countDocuments: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/models/Finance', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  findByIdAndDelete: jest.fn().mockResolvedValue({}),
  countDocuments: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/models/Marketplace', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  findByIdAndDelete: jest.fn().mockResolvedValue({}),
  countDocuments: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/models/Supplies', () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  findByIdAndDelete: jest.fn().mockResolvedValue({}),
  countDocuments: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/config/logger');

// Import the controller functions
const paymayaController = require('../../src/controllers/paymayaController');

describe('PayMaya Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Create Checkout', () => {
    it('should create checkout successfully', async () => {
      req.body = {
        totalAmount: 1000,
        currency: 'PHP',
        description: 'Test payment',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            amount: 1000
          }
        ],
        redirectUrl: 'https://example.com/redirect'
      };

      PayMayaService.createCheckout.mockResolvedValue({
        success: true,
        data: {
          checkoutId: 'checkout-123',
          checkoutUrl: 'https://paymaya.com/checkout/123'
        }
      });

      await paymayaController.createCheckout(req, res);

      expect(PayMayaService.createCheckout).toHaveBeenCalledWith({
        totalAmount: 1000,
        currency: 'PHP',
        description: 'Test payment',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            amount: 1000
          }
        ],
        redirectUrl: 'https://example.com/redirect'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PayMaya checkout created successfully',
        data: {
          checkoutId: 'checkout-123',
          checkoutUrl: 'https://paymaya.com/checkout/123'
        }
      });
    });

    it('should handle missing required fields', async () => {
      req.body = {
        totalAmount: 1000
        // Missing description, referenceId, buyer
      };

      await paymayaController.createCheckout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: totalAmount, description, referenceId, buyer'
      });
    });

    it('should handle incomplete buyer information', async () => {
      req.body = {
        totalAmount: 1000,
        description: 'Test payment',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John'
          // Missing lastName and email
        }
      };

      await paymayaController.createCheckout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Buyer information incomplete: firstName, lastName, and email are required'
      });
    });

    it('should handle PayMaya service error', async () => {
      req.body = {
        totalAmount: 1000,
        currency: 'PHP',
        description: 'Test payment',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      };

      PayMayaService.createCheckout.mockResolvedValue({
        success: false,
        error: 'Payment failed',
        details: 'Insufficient funds'
      });

      await paymayaController.createCheckout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create PayMaya checkout',
        error: 'Payment failed',
        details: 'Insufficient funds'
      });
    });
  });

  describe('Get Checkout', () => {
    it('should get checkout details successfully', async () => {
      req.params.checkoutId = 'checkout-123';

      PayMayaService.getCheckout.mockResolvedValue({
        success: true,
        data: {
          checkoutId: 'checkout-123',
          status: 'pending',
          totalAmount: 1000
        }
      });

      await paymayaController.getCheckout(req, res);

      expect(PayMayaService.getCheckout).toHaveBeenCalledWith('checkout-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          checkoutId: 'checkout-123',
          status: 'pending',
          totalAmount: 1000
        }
      });
    });

    it('should handle missing checkout ID', async () => {
      req.params = {};

      await paymayaController.getCheckout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Checkout ID is required'
      });
    });

    it('should handle checkout not found', async () => {
      req.params.checkoutId = 'non-existent';

      PayMayaService.getCheckout.mockResolvedValue({
        success: false,
        error: 'Checkout not found'
      });

      await paymayaController.getCheckout(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Checkout not found',
        error: 'Checkout not found'
      });
    });
  });

  describe('Create Payment', () => {
    it('should create payment successfully', async () => {
      req.body = {
        vaultId: 'vault-123',
        amount: 1000,
        currency: 'PHP',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            amount: 1000
          }
        ],
        description: 'Test payment'
      };

      PayMayaService.createPayment.mockResolvedValue({
        success: true,
        data: {
          paymentId: 'payment-123',
          status: 'pending'
        }
      });

      await paymayaController.createPayment(req, res);

      expect(PayMayaService.createPayment).toHaveBeenCalledWith({
        vaultId: 'vault-123',
        amount: 1000,
        currency: 'PHP',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            amount: 1000
          }
        ],
        description: 'Test payment'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PayMaya payment created successfully',
        data: {
          paymentId: 'payment-123',
          status: 'pending'
        }
      });
    });

    it('should handle missing required fields', async () => {
      req.body = {
        amount: 1000
        // Missing vaultId, referenceId, buyer
      };

      await paymayaController.createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: vaultId, amount, referenceId, buyer'
      });
    });
  });

  describe('Create Invoice', () => {
    it('should create invoice successfully', async () => {
      req.body = {
        amount: 1000,
        currency: 'PHP',
        description: 'Test invoice',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            amount: 1000
          }
        ],
        redirectUrl: 'https://example.com/redirect'
      };

      PayMayaService.createInvoice.mockResolvedValue({
        success: true,
        data: {
          invoiceId: 'invoice-123',
          invoiceUrl: 'https://paymaya.com/invoice/123'
        }
      });

      await paymayaController.createInvoice(req, res);

      expect(PayMayaService.createInvoice).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'PHP',
        description: 'Test invoice',
        referenceId: 'REF-123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            amount: 1000
          }
        ],
        redirectUrl: 'https://example.com/redirect'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PayMaya invoice created successfully',
        data: {
          invoiceId: 'invoice-123',
          invoiceUrl: 'https://paymaya.com/invoice/123'
        }
      });
    });
  });

  describe('Webhook Handling', () => {
    it('should handle checkout success webhook', async () => {
      req.headers = {
        'paymaya-signature': 'valid-signature'
      };
      req.body = {
        eventType: 'CHECKOUT_SUCCESS',
        data: {
          checkoutId: 'checkout-123',
          requestReferenceNumber: 'REF-123'
        }
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(true);
      PayMayaService.processWebhookEvent.mockResolvedValue({ success: true });
      
      // Mock the updatePaymentStatus function by mocking the models
      LocalProPlus.findOne.mockResolvedValue({
        paymayaReferenceNumber: 'REF-123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      });

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(PayMayaService.verifyWebhookSignature).toHaveBeenCalled();
      expect(PayMayaService.processWebhookEvent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully'
      });
    });

    it('should handle invalid webhook signature', async () => {
      req.headers = {
        'paymaya-signature': 'invalid-signature'
      };
      req.body = {
        eventType: 'CHECKOUT_SUCCESS',
        data: {}
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(false);

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid webhook signature'
      });
    });

    it('should handle webhook processing error', async () => {
      req.headers = {
        'paymaya-signature': 'valid-signature'
      };
      req.body = {
        eventType: 'CHECKOUT_SUCCESS',
        data: {}
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(true);
      PayMayaService.processWebhookEvent.mockResolvedValue({
        success: false,
        error: 'Processing failed'
      });

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Webhook processing failed'
      });
    });
  });

  describe('Payment Status Updates', () => {
    it('should delegate webhook processing to PayMayaService', async () => {
      // Test that the webhook handler delegates to PayMayaService
      req.headers = { 'paymaya-signature': 'valid-signature' };
      req.body = {
        eventType: 'CHECKOUT_SUCCESS',
        data: {
          checkoutId: 'checkout-123',
          requestReferenceNumber: 'REF-123'
        }
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(true);
      PayMayaService.processWebhookEvent.mockResolvedValue({ success: true });

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(PayMayaService.verifyWebhookSignature).toHaveBeenCalledWith(req.headers, JSON.stringify(req.body));
      expect(PayMayaService.processWebhookEvent).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Webhook processed successfully' });
    });

    it('should handle Finance transaction webhook', async () => {
      req.headers = { 'paymaya-signature': 'valid-signature' };
      req.body = {
        eventType: 'PAYMENT_SUCCESS',
        data: {
          paymentId: 'payment-123',
          requestReferenceNumber: 'REF-123'
        }
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(true);
      PayMayaService.processWebhookEvent.mockResolvedValue({ success: true });

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(PayMayaService.verifyWebhookSignature).toHaveBeenCalledWith(req.headers, JSON.stringify(req.body));
      expect(PayMayaService.processWebhookEvent).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Webhook processed successfully' });
    });

    it('should handle Marketplace booking webhook', async () => {
      req.headers = { 'paymaya-signature': 'valid-signature' };
      req.body = {
        eventType: 'CHECKOUT_SUCCESS',
        data: {
          checkoutId: 'checkout-123',
          requestReferenceNumber: 'REF-123'
        }
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(true);
      PayMayaService.processWebhookEvent.mockResolvedValue({ success: true });

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(PayMayaService.verifyWebhookSignature).toHaveBeenCalledWith(req.headers, JSON.stringify(req.body));
      expect(PayMayaService.processWebhookEvent).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Webhook processed successfully' });
    });

    it('should handle Supplies order webhook', async () => {
      req.headers = { 'paymaya-signature': 'valid-signature' };
      req.body = {
        eventType: 'CHECKOUT_SUCCESS',
        data: {
          checkoutId: 'checkout-123',
          requestReferenceNumber: 'REF-123'
        }
      };

      PayMayaService.verifyWebhookSignature.mockResolvedValue(true);
      PayMayaService.processWebhookEvent.mockResolvedValue({ success: true });

      await paymayaController.handlePayMayaWebhook(req, res);

      expect(PayMayaService.verifyWebhookSignature).toHaveBeenCalledWith(req.headers, JSON.stringify(req.body));
      expect(PayMayaService.processWebhookEvent).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Webhook processed successfully' });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate PayMaya configuration', async () => {
      // Mock environment variables
      process.env.PAYMAYA_MODE = 'sandbox';
      process.env.PAYMAYA_PUBLIC_KEY = 'test-public-key';
      process.env.PAYMAYA_SECRET_KEY = 'test-secret-key';
      process.env.PAYMAYA_WEBHOOK_SECRET = 'test-webhook-secret';
      
      PayMayaService.validateConfig.mockReturnValue(true);

      await paymayaController.validateConfig(req, res);

      expect(PayMayaService.validateConfig).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: true,
          environment: 'sandbox',
          hasPublicKey: true,
          hasSecretKey: true,
          hasWebhookSecret: true
        }
      });
    });
  });
});
