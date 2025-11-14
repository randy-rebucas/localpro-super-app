const PayPalService = require('../../../services/paypalService');
const paypal = require('@paypal/paypal-server-sdk');

jest.mock('@paypal/paypal-server-sdk');
jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

describe('PayPalService', () => {
  const originalEnv = process.env;
  let mockOrdersController;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockOrdersController = {
      ordersCreate: jest.fn(),
      ordersCapture: jest.fn()
    };
    paypal.OrdersController = jest.fn().mockImplementation(() => mockOrdersController);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createOrder', () => {
    test('should create PayPal order', async () => {
      process.env.PAYPAL_CLIENT_ID = 'test-id';
      process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      
      // The service creates a new OrdersController, so we need to mock the constructor
      const mockCreateOrder = jest.fn().mockResolvedValue({
        result: {
          id: 'order123',
          status: 'CREATED',
          links: []
        }
      });
      
      // Mock the OrdersController constructor to return our mock
      paypal.OrdersController.mockImplementation(() => ({
        createOrder: mockCreateOrder
      }));

      const result = await PayPalService.createOrder({
        amount: 100,
        currency: 'USD',
        description: 'Test order',
        referenceId: 'ref123'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockCreateOrder).toHaveBeenCalled();
    });
  });

  describe('captureOrder', () => {
    test('should capture PayPal order', async () => {
      const mockCaptureOrder = jest.fn().mockResolvedValue({
        result: {
          id: 'order123',
          status: 'COMPLETED'
        }
      });
      
      paypal.OrdersController.mockImplementation(() => ({
        captureOrder: mockCaptureOrder
      }));

      const result = await PayPalService.captureOrder('order123');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockCaptureOrder).toHaveBeenCalled();
    });
  });
});

