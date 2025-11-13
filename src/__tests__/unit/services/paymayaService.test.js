const PayMayaService = require('../../../services/paymayaService');
const axios = require('axios');
const logger = require('../../../config/logger');

jest.mock('axios');
jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

describe('PayMayaService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
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
      
      // Reset axios mock and set up proper response
      axios.post.mockClear();
      axios.post.mockResolvedValueOnce({
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
          contact: {
            phone: '+1234567890',
            email: 'test@example.com'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalled();
    });
  });
});

