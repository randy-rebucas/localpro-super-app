const { UserSubscription, FeatureUsage } = require('../../../models/LocalProPlus');

jest.mock('../../../models/LocalProPlus', () => ({
  UserSubscription: {
    findOne: jest.fn()
  },
  FeatureUsage: jest.fn()
}));

// Import service after mocking
const UsageTrackingService = require('../../../services/usageTrackingService');

describe('UsageTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackUsage', () => {
    test('should return error when no subscription found', async () => {
      UserSubscription.findOne = jest.fn().mockResolvedValue(null);

      const result = await UsageTrackingService.trackUsage('user123', 'feature1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No subscription found for user');
    });

    test('should track usage successfully', async () => {
      const mockSubscription = {
        _id: 'sub123',
        user: 'user123',
        hasFeatureAccess: jest.fn().mockReturnValue(true),
        checkUsageLimit: jest.fn().mockReturnValue(true),
        incrementUsage: jest.fn().mockResolvedValue(),
        usage: {
          feature1: { current: 5, limit: 100 }
        }
      };

      UserSubscription.findOne = jest.fn().mockResolvedValue(mockSubscription);
      
      const mockFeatureUsageInstance = {
        save: jest.fn().mockResolvedValue({})
      };
      FeatureUsage.mockImplementation(() => mockFeatureUsageInstance);

      const result = await UsageTrackingService.trackUsage('user123', 'feature1', 1);

      expect(result.success).toBe(true);
      expect(mockSubscription.incrementUsage).toHaveBeenCalledWith('feature1', 1);
      expect(result.currentUsage).toBe(5);
      expect(result.limit).toBe(100);
    });

    test('should return error when feature access not allowed', async () => {
      const mockSubscription = {
        _id: 'sub123',
        hasFeatureAccess: jest.fn().mockReturnValue(false)
      };

      UserSubscription.findOne = jest.fn().mockResolvedValue(mockSubscription);

      const result = await UsageTrackingService.trackUsage('user123', 'premium_feature');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not included in subscription plan');
    });

    test('should return error when usage limit exceeded', async () => {
      const mockSubscription = {
        _id: 'sub123',
        hasFeatureAccess: jest.fn().mockReturnValue(true),
        checkUsageLimit: jest.fn().mockReturnValue(false)
      };

      UserSubscription.findOne = jest.fn().mockResolvedValue(mockSubscription);

      const result = await UsageTrackingService.trackUsage('user123', 'feature1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Usage limit exceeded');
    });
  });

  describe('getUserUsageStats', () => {
    test('should get user usage statistics', async () => {
      const mockSubscription = {
        _id: 'sub123',
        user: 'user123',
        plan: 'premium',
        status: 'active',
        billingCycle: 'monthly',
        usage: {
          feature1: { current: 10, limit: 100 }
        }
      };

      UserSubscription.findOne = jest.fn().mockResolvedValue(mockSubscription);
      FeatureUsage.aggregate = jest.fn().mockResolvedValue([
        {
          _id: 'feature1',
          totalUsage: 10,
          count: 5
        }
      ]);

      const result = await UsageTrackingService.getUserUsageStats('user123', 'month');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(UserSubscription.findOne).toHaveBeenCalledWith({ user: 'user123' });
    });

    test('should return error when no subscription found for stats', async () => {
      UserSubscription.findOne = jest.fn().mockResolvedValue(null);

      const result = await UsageTrackingService.getUserUsageStats('user123', 'month');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No subscription found');
    });
  });
});

