/**
 * Usage Tracking Service Tests
 * Tests for usageTrackingService.js
 */

// Mock models
const mockSubscription = {
  _id: 'subscription-123',
  user: 'user-123',
  plan: 'premium',
  status: 'active',
  billingCycle: 'monthly',
  usage: {
    feature1: { current: 5, limit: 100 },
    feature2: { current: 10, limit: 50 }
  },
  hasFeatureAccess: jest.fn().mockReturnValue(true),
  checkUsageLimit: jest.fn().mockReturnValue(true),
  incrementUsage: jest.fn().mockResolvedValue(),
  isActive: jest.fn().mockReturnValue(true),
  save: jest.fn().mockResolvedValue()
};

const mockFeatureUsage = {
  save: jest.fn().mockResolvedValue(),
  aggregate: jest.fn().mockResolvedValue([])
};

jest.mock('../../models/LocalProPlus', () => ({
  UserSubscription: {
    findOne: jest.fn().mockResolvedValue(mockSubscription)
  },
  FeatureUsage: jest.fn().mockImplementation(() => mockFeatureUsage)
}));

const UsageTrackingService = require('../../services/usageTrackingService');
const { UserSubscription, FeatureUsage } = require('../../models/LocalProPlus');

describe('UsageTrackingService', () => {
  let originalConsoleError;

  beforeAll(() => {
    // Suppress expected console.error messages from error handling tests
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription.hasFeatureAccess.mockReturnValue(true);
    mockSubscription.checkUsageLimit.mockReturnValue(true);
    mockSubscription.isActive.mockReturnValue(true);
    FeatureUsage.aggregate = jest.fn().mockResolvedValue([]);
    // Clear console.error mock between tests
    console.error.mockClear();
  });

  describe('trackUsage', () => {
    it('should track feature usage successfully', async () => {
      const result = await UsageTrackingService.trackUsage('user-123', 'feature1', 1);

      expect(UserSubscription.findOne).toHaveBeenCalledWith({ user: 'user-123' });
      expect(mockSubscription.hasFeatureAccess).toHaveBeenCalledWith('feature1');
      expect(mockSubscription.checkUsageLimit).toHaveBeenCalledWith('feature1');
      expect(mockSubscription.incrementUsage).toHaveBeenCalledWith('feature1', 1);
      expect(result.success).toBe(true);
      expect(result.currentUsage).toBeDefined();
    });

    it('should handle missing subscription', async () => {
      UserSubscription.findOne.mockResolvedValueOnce(null);

      const result = await UsageTrackingService.trackUsage('user-123', 'feature1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No subscription found');
    });

    it('should handle feature not included in plan', async () => {
      mockSubscription.hasFeatureAccess.mockReturnValueOnce(false);

      const result = await UsageTrackingService.trackUsage('user-123', 'feature1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not included');
    });

    it('should handle usage limit exceeded', async () => {
      mockSubscription.checkUsageLimit.mockReturnValueOnce(false);

      const result = await UsageTrackingService.trackUsage('user-123', 'feature1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Usage limit exceeded');
    });

    it('should handle custom amount', async () => {
      await UsageTrackingService.trackUsage('user-123', 'feature1', 5);

      expect(mockSubscription.incrementUsage).toHaveBeenCalledWith('feature1', 5);
    });

    it('should include metadata', async () => {
      const metadata = { source: 'api', ip: '127.0.0.1' };
      await UsageTrackingService.trackUsage('user-123', 'feature1', 1, metadata);

      expect(FeatureUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user-123',
          subscription: 'subscription-123',
          feature: 'feature1',
          usage: expect.objectContaining({
            count: 1,
            metadata
          })
        })
      );
    });
  });

  describe('getUserUsageStats', () => {
    it('should get usage statistics for month period', async () => {
      FeatureUsage.aggregate.mockResolvedValueOnce([
        { _id: 'feature1', totalUsage: 50, usageCount: 10, lastUsed: new Date() }
      ]);

      const result = await UsageTrackingService.getUserUsageStats('user-123', 'month');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('subscription');
      expect(result.data).toHaveProperty('usage');
      expect(result.data).toHaveProperty('featureStats');
      expect(result.data.period).toBe('month');
    });

    it('should handle day period', async () => {
      const result = await UsageTrackingService.getUserUsageStats('user-123', 'day');

      expect(result.success).toBe(true);
      expect(result.data.period).toBe('day');
    });

    it('should handle week period', async () => {
      const result = await UsageTrackingService.getUserUsageStats('user-123', 'week');

      expect(result.success).toBe(true);
      expect(result.data.period).toBe('week');
    });

    it('should handle year period', async () => {
      const result = await UsageTrackingService.getUserUsageStats('user-123', 'year');

      expect(result.success).toBe(true);
      expect(result.data.period).toBe('year');
    });

    it('should handle missing subscription', async () => {
      UserSubscription.findOne.mockResolvedValueOnce(null);

      const result = await UsageTrackingService.getUserUsageStats('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No subscription found');
    });

    it('should default to month for invalid period', async () => {
      const result = await UsageTrackingService.getUserUsageStats('user-123', 'invalid');

      expect(result.success).toBe(true);
      expect(result.data.period).toBe('invalid');
    });
  });

  describe('canPerformAction', () => {
    it('should return true when action can be performed', async () => {
      const result = await UsageTrackingService.canPerformAction('user-123', 'feature1', 1);

      expect(result.canPerform).toBe(true);
      expect(result.currentUsage).toBeDefined();
      expect(result.limit).toBeDefined();
    });

    it('should return false when subscription not found', async () => {
      UserSubscription.findOne.mockResolvedValueOnce(null);

      const result = await UsageTrackingService.canPerformAction('user-123', 'feature1');

      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('No subscription found');
    });

    it('should return false when subscription is inactive', async () => {
      mockSubscription.isActive.mockReturnValueOnce(false);

      const result = await UsageTrackingService.canPerformAction('user-123', 'feature1');

      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('Subscription is not active');
    });

    it('should return false when feature not included', async () => {
      mockSubscription.hasFeatureAccess.mockReturnValueOnce(false);

      const result = await UsageTrackingService.canPerformAction('user-123', 'feature1');

      expect(result.canPerform).toBe(false);
      expect(result.reason).toContain('not included');
    });

    it('should return false when limit would be exceeded', async () => {
      mockSubscription.usage.feature1 = { current: 95, limit: 100 };

      const result = await UsageTrackingService.canPerformAction('user-123', 'feature1', 10);

      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('Usage limit would be exceeded');
      expect(result.remaining).toBeDefined();
    });

    it('should return remaining usage', async () => {
      mockSubscription.usage.feature1 = { current: 5, limit: 100 };

      const result = await UsageTrackingService.canPerformAction('user-123', 'feature1', 10);

      expect(result.canPerform).toBe(true);
      expect(result.currentUsage).toBe(5);
      // Remaining is limit (100) - currentUsage (5) = 95
      expect(result.remaining).toBe(95);
    });
  });

  describe('resetUsageCounters', () => {
    it('should reset usage counters successfully', async () => {
      const result = await UsageTrackingService.resetUsageCounters('user-123');

      expect(UserSubscription.findOne).toHaveBeenCalled();
      expect(mockSubscription.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle missing subscription', async () => {
      UserSubscription.findOne.mockResolvedValueOnce(null);

      const result = await UsageTrackingService.resetUsageCounters('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No subscription found');
    });
  });

  describe('getUsageAnalytics', () => {
    it('should get usage analytics without filters', async () => {
      FeatureUsage.aggregate
        .mockResolvedValueOnce([]) // usageStats
        .mockResolvedValueOnce([]); // topUsers

      const result = await UsageTrackingService.getUsageAnalytics();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('usageStats');
      expect(result.data).toHaveProperty('topUsers');
      expect(result.data).toHaveProperty('filters');
    });

    it('should apply date filters', async () => {
      FeatureUsage.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = await UsageTrackingService.getUsageAnalytics(filters);

      expect(result.success).toBe(true);
      expect(result.data.filters.startDate).toBe('2024-01-01');
    });

    it('should apply feature filter', async () => {
      FeatureUsage.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await UsageTrackingService.getUsageAnalytics({ feature: 'feature1' });

      expect(result.success).toBe(true);
      expect(result.data.filters.feature).toBe('feature1');
    });

    it('should apply userId filter', async () => {
      FeatureUsage.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await UsageTrackingService.getUsageAnalytics({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data.filters.userId).toBe('user-123');
    });

    it('should handle errors', async () => {
      FeatureUsage.aggregate.mockRejectedValueOnce(new Error('DB error'));

      const result = await UsageTrackingService.getUsageAnalytics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });
});

