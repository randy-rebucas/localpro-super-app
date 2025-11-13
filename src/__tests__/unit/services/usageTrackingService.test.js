const UsageTrackingService = require('../../../services/usageTrackingService');
const { UserSubscription, FeatureUsage } = require('../../../models/LocalProPlus');

jest.mock('../../../models/LocalProPlus', () => ({
  UserSubscription: {
    findOne: jest.fn()
  },
  FeatureUsage: jest.fn()
}));

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
        hasFeatureAccess: jest.fn().mockReturnValue(true),
        checkUsageLimit: jest.fn().mockReturnValue(true),
        incrementUsage: jest.fn().mockResolvedValue(),
        usage: {
          feature1: { current: 5, limit: 100 }
        }
      };

      UserSubscription.findOne = jest.fn().mockResolvedValue(mockSubscription);
      FeatureUsage.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({})
      }));

      const result = await UsageTrackingService.trackUsage('user123', 'feature1', 1);

      expect(result.success).toBe(true);
      expect(mockSubscription.incrementUsage).toHaveBeenCalled();
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
        usage: {}
      };

      UserSubscription.findOne = jest.fn().mockResolvedValue(mockSubscription);
      FeatureUsage.aggregate = jest.fn().mockResolvedValue([]);

      const result = await UsageTrackingService.getUserUsageStats('user123', 'month');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

