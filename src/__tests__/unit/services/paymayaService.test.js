jest.mock('axios');
jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

const axios = require('axios');
const PayMayaService = require('../../../services/paymayaService');

describe('PayMayaService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Ensure axios.post is a mock function
    if (!axios.post || typeof axios.post.mockResolvedValue !== 'function') {
      axios.post = jest.fn();
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    test('should initialize with sandbox environment by default', () => {
      delete process.env.PAYMAYA_MODE;
      const service = new PayMayaService();
      
      expect(service.environment).toBe('sandbox');
    });

    test('should initialize with production environment', () => {
      process.env.PAYMAYA_MODE = 'production';
      const service = new PayMayaService();
      
      expect(service.environment).toBe('production');
    });
  });

  describe('createCheckout', () => {
    test('should create PayMaya checkout', async () => {
      process.env.PAYMAYA_PUBLIC_KEY = 'test-public-key';
      process.env.PAYMAYA_SECRET_KEY = 'test-secret-key';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      
      // Set up axios.post mock to return a successful response
      axios.post.mockResolvedValue({
        data: {
          checkoutId: 'checkout123',
          redirectUrl: 'https://paymaya.com/checkout',
          requestReferenceNumber: 'ref123'
        }
      });

      const result = await PayMayaService.createCheckout({
        totalAmount: 1000,
        currency: 'PHP',
        description: 'Test order',
        referenceId: 'ref123',
        buyer: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          email: 'test@example.com'
        }
      });

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalled();
    });
  });
});
