const axios = require('axios');

jest.mock('axios');
jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/paypalSubscriptionService');

describe('PayPalSubscriptionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAccessToken', () => {
    test('should get access token', async () => {
      process.env.PAYPAL_CLIENT_ID = 'test-id';
      process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
      
      axios.post.mockResolvedValue({
        data: {
          access_token: 'test-token',
          expires_in: 3600
        }
      });

      const token = await service.getAccessToken();
      
      expect(token).toBe('test-token');
      expect(axios.post).toHaveBeenCalled();
    });
  });
});

