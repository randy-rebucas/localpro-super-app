/**
 * Provider Dashboard Service Tests
 * Tests for providerDashboardService.js
 */

// Mock dependencies
jest.mock('../../models/Provider', () => ({
  findOne: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

const providerDashboardService = require('../../services/providerDashboardService');
const Provider = require('../../models/Provider');

describe('ProviderDashboardService', () => {
  let mockProvider;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProvider = {
      _id: 'provider-123',
      userId: 'user-123',
      status: 'active',
      providerType: 'individual',
      performance: {
        rating: 4.5,
        totalReviews: 50,
        totalJobs: 100,
        completedJobs: 95,
        completionRate: 95,
        responseTime: 30,
        repeatCustomerRate: 60,
        earnings: {
          total: 10000,
          thisMonth: 1000,
          lastMonth: 900,
          pending: 200
        },
        badges: ['top_rated', 'fast_response']
      },
      metadata: {
        profileViews: 500
      },
      verification: {
        portfolio: {
          images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg']
        }
      },
      subscription: {
        plan: 'premium',
        features: ['feature1', 'feature2'],
        limits: { jobs: 100 }
      },
      isVerified: jest.fn().mockReturnValue(true),
      canAcceptJobs: jest.fn().mockReturnValue(true)
    };

    Provider.findOne.mockResolvedValue(mockProvider);
  });

  describe('getDashboardData', () => {
    it('should get comprehensive dashboard data', async () => {
      const result = await providerDashboardService.getDashboardData('user-123', '30d');

      expect(Provider.findOne).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('earnings');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('trends');
      expect(result.timeframe).toBe('30d');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle different timeframes', async () => {
      const result7d = await providerDashboardService.getDashboardData('user-123', '7d');
      expect(result7d.timeframe).toBe('7d');

      const result90d = await providerDashboardService.getDashboardData('user-123', '90d');
      expect(result90d.timeframe).toBe('90d');

      const result1y = await providerDashboardService.getDashboardData('user-123', '1y');
      expect(result1y.timeframe).toBe('1y');
    });

    it('should throw error when provider not found', async () => {
      Provider.findOne.mockResolvedValueOnce(null);

      await expect(
        providerDashboardService.getDashboardData('user-123')
      ).rejects.toThrow('Provider profile not found');
    });
  });

  describe('getOverviewData', () => {
    it('should get overview data', async () => {
      const overview = await providerDashboardService.getOverviewData(mockProvider);

      expect(overview).toHaveProperty('status', 'active');
      expect(overview).toHaveProperty('rating', 4.5);
      expect(overview).toHaveProperty('totalReviews', 50);
      expect(overview).toHaveProperty('totalJobs', 100);
      expect(overview).toHaveProperty('completedJobs', 95);
      expect(overview).toHaveProperty('completionRate', 95);
      expect(overview).toHaveProperty('responseTime', 30);
      expect(overview).toHaveProperty('repeatCustomerRate', 60);
      expect(overview).toHaveProperty('profileViews', 500);
      expect(overview).toHaveProperty('isVerified', true);
      expect(overview).toHaveProperty('canAcceptJobs', true);
      expect(overview).toHaveProperty('badges');
      expect(overview).toHaveProperty('subscription');
    });
  });

  describe('getEarningsData', () => {
    it('should get earnings data', async () => {
      const earnings = await providerDashboardService.getEarningsData(mockProvider, new Date());

      expect(earnings).toHaveProperty('total', 10000);
      expect(earnings).toHaveProperty('thisMonth', 1000);
      expect(earnings).toHaveProperty('lastMonth', 900);
      expect(earnings).toHaveProperty('pending', 200);
      expect(earnings).toHaveProperty('period');
      expect(earnings).toHaveProperty('breakdown');
    });

    it('should calculate growth percentage', async () => {
      const earnings = await providerDashboardService.getEarningsData(mockProvider, new Date());

      expect(earnings.period.growth).toBeDefined();
    });
  });

  describe('getPerformanceData', () => {
    it('should get performance data', async () => {
      const performance = await providerDashboardService.getPerformanceData(mockProvider, new Date());

      expect(performance).toHaveProperty('metrics');
      expect(performance).toHaveProperty('trends');
      expect(performance).toHaveProperty('comparisons');
      expect(performance.metrics).toHaveProperty('rating');
      expect(performance.metrics).toHaveProperty('totalReviews');
    });
  });

  describe('getRecentActivity', () => {
    it('should get recent activity', async () => {
      const activity = await providerDashboardService.getRecentActivity('user-123', new Date());

      expect(activity).toHaveProperty('bookings');
      expect(activity).toHaveProperty('reviews');
      expect(activity).toHaveProperty('messages');
      expect(activity).toHaveProperty('payments');
      expect(activity).toHaveProperty('profileViews');
    });
  });

  describe('getNotifications', () => {
    it('should get notifications', async () => {
      const notifications = await providerDashboardService.getNotifications('user-123');

      expect(notifications).toHaveProperty('pendingJobs');
      expect(notifications).toHaveProperty('unreadMessages');
      expect(notifications).toHaveProperty('pendingReviews');
      expect(notifications).toHaveProperty('systemAlerts');
      expect(notifications).toHaveProperty('paymentNotifications');
    });
  });

  describe('getTrendsData', () => {
    it('should get trends data', async () => {
      const trends = await providerDashboardService.getTrendsData(mockProvider, '30d');

      expect(trends).toHaveProperty('jobs');
      expect(trends).toHaveProperty('earnings');
      expect(trends).toHaveProperty('ratings');
      expect(trends).toHaveProperty('profileViews');
      expect(trends).toHaveProperty('customerSatisfaction');
    });
  });

  describe('calculateGrowth', () => {
    it('should calculate positive growth', () => {
      const growth = providerDashboardService.calculateGrowth(1100, 1000);
      expect(growth).toBe(10);
    });

    it('should calculate negative growth', () => {
      const growth = providerDashboardService.calculateGrowth(900, 1000);
      expect(growth).toBe(-10);
    });

    it('should handle zero previous value', () => {
      const growth1 = providerDashboardService.calculateGrowth(100, 0);
      expect(growth1).toBe(100);

      const growth2 = providerDashboardService.calculateGrowth(0, 0);
      expect(growth2).toBe(0);
    });
  });

  describe('getInsights', () => {
    it('should get insights for provider', async () => {
      const insights = await providerDashboardService.getInsights('user-123');

      expect(Array.isArray(insights)).toBe(true);
    });

    it('should flag low rating', async () => {
      mockProvider.performance.rating = 3.5;
      Provider.findOne.mockResolvedValueOnce(mockProvider);

      const insights = await providerDashboardService.getInsights('user-123');

      const ratingInsight = insights.find(i => i.title === 'Rating Below Average');
      expect(ratingInsight).toBeDefined();
      expect(ratingInsight.type).toBe('warning');
    });

    it('should flag slow response time', async () => {
      mockProvider.performance.responseTime = 90;
      Provider.findOne.mockResolvedValueOnce(mockProvider);

      const insights = await providerDashboardService.getInsights('user-123');

      const responseInsight = insights.find(i => i.title === 'Slow Response Time');
      expect(responseInsight).toBeDefined();
    });

    it('should flag low completion rate', async () => {
      mockProvider.performance.completionRate = 80;
      Provider.findOne.mockResolvedValueOnce(mockProvider);

      const insights = await providerDashboardService.getInsights('user-123');

      const completionInsight = insights.find(i => i.title === 'Low Completion Rate');
      expect(completionInsight).toBeDefined();
    });

    it('should flag low profile visibility', async () => {
      mockProvider.metadata.profileViews = 30;
      Provider.findOne.mockResolvedValueOnce(mockProvider);

      const insights = await providerDashboardService.getInsights('user-123');

      const visibilityInsight = insights.find(i => i.title === 'Low Profile Visibility');
      expect(visibilityInsight).toBeDefined();
    });

    it('should flag earnings decline', async () => {
      mockProvider.performance.earnings.thisMonth = 800;
      mockProvider.performance.earnings.lastMonth = 1000;
      Provider.findOne.mockResolvedValueOnce(mockProvider);

      const insights = await providerDashboardService.getInsights('user-123');

      const earningsInsight = insights.find(i => i.title === 'Earnings Decline');
      expect(earningsInsight).toBeDefined();
    });

    it('should throw error when provider not found', async () => {
      Provider.findOne.mockResolvedValueOnce(null);

      await expect(
        providerDashboardService.getInsights('user-123')
      ).rejects.toThrow('Provider profile not found');
    });
  });
});

