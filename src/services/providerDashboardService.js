const Provider = require('../models/Provider');
const { logger } = require('../utils/logger');

class ProviderDashboardService {
  constructor() {
    this.timeframes = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
  }

  // Get comprehensive dashboard data
  async getDashboardData(userId, timeframe = '30d') {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        throw new Error('Provider profile not found');
      }

      const since = new Date(Date.now() - this.timeframes[timeframe]);

      const [
        overview,
        earnings,
        performance,
        recentActivity,
        notifications,
        trends
      ] = await Promise.all([
        this.getOverviewData(provider),
        this.getEarningsData(provider, since),
        this.getPerformanceData(provider, since),
        this.getRecentActivity(userId, since),
        this.getNotifications(userId),
        this.getTrendsData(provider, timeframe)
      ]);

      return {
        overview,
        earnings,
        performance,
        recentActivity,
        notifications,
        trends,
        timeframe,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to get dashboard data', error, { userId, timeframe });
      throw error;
    }
  }

  // Get overview data
  async getOverviewData(provider) {
    return {
      status: provider.status,
      rating: provider.performance.rating,
      totalReviews: provider.performance.totalReviews,
      totalJobs: provider.performance.totalJobs,
      completedJobs: provider.performance.completedJobs,
      completionRate: provider.performance.completionRate,
      responseTime: provider.performance.responseTime,
      repeatCustomerRate: provider.performance.repeatCustomerRate,
      profileViews: provider.metadata.profileViews,
      isVerified: provider.isVerified(),
      canAcceptJobs: provider.canAcceptJobs(),
      badges: provider.performance.badges,
      subscription: {
        plan: provider.subscription.plan,
        features: provider.subscription.features,
        limits: provider.subscription.limits
      }
    };
  }

  // Get earnings data
  async getEarningsData(provider, since) {
    return {
      total: provider.performance.earnings.total,
      thisMonth: provider.performance.earnings.thisMonth,
      lastMonth: provider.performance.earnings.lastMonth,
      pending: provider.performance.earnings.pending,
      period: {
        total: provider.performance.earnings.thisMonth,
        average: provider.performance.earnings.thisMonth / 30,
        growth: this.calculateGrowth(provider.performance.earnings.thisMonth, provider.performance.earnings.lastMonth)
      },
      breakdown: {
        byCategory: await this.getEarningsByCategory(provider._id, since),
        byPaymentMethod: await this.getEarningsByPaymentMethod(provider._id, since),
        byTimeframe: await this.getEarningsByTimeframe(provider._id, since)
      }
    };
  }

  // Get performance data
  async getPerformanceData(provider, since) {
    return {
      metrics: {
        rating: provider.performance.rating,
        totalReviews: provider.performance.totalReviews,
        responseTime: provider.performance.responseTime,
        completionRate: provider.performance.completionRate,
        repeatCustomerRate: provider.performance.repeatCustomerRate
      },
      trends: {
        ratingTrend: await this.getRatingTrend(provider._id, since),
        responseTimeTrend: await this.getResponseTimeTrend(provider._id, since),
        completionRateTrend: await this.getCompletionRateTrend(provider._id, since)
      },
      comparisons: {
        vsAverage: await this.getPerformanceComparisons(provider._id),
        vsTopPerformers: await this.getTopPerformersComparison(provider._id)
      }
    };
  }

  // Get recent activity
  async getRecentActivity(userId, since) {
    return {
      bookings: await this.getRecentBookings(userId, since),
      reviews: await this.getRecentReviews(userId, since),
      messages: await this.getRecentMessages(userId, since),
      payments: await this.getRecentPayments(userId, since),
      profileViews: await this.getRecentProfileViews(userId, since)
    };
  }

  // Get notifications
  async getNotifications(userId) {
    return {
      pendingJobs: await this.getPendingJobs(userId),
      unreadMessages: await this.getUnreadMessages(userId),
      pendingReviews: await this.getPendingReviews(userId),
      systemAlerts: await this.getSystemAlerts(userId),
      paymentNotifications: await this.getPaymentNotifications(userId)
    };
  }

  // Get trends data
  async getTrendsData(provider, timeframe) {
    const since = new Date(Date.now() - this.timeframes[timeframe]);

    return {
      jobs: await this.getJobTrends(provider._id, since),
      earnings: await this.getEarningsTrends(provider._id, since),
      ratings: await this.getRatingTrends(provider._id, since),
      profileViews: await this.getProfileViewTrends(provider._id, since),
      customerSatisfaction: await this.getCustomerSatisfactionTrends(provider._id, since)
    };
  }

  // Helper methods for data aggregation
  async getEarningsByCategory(providerId, since) {
    // TODO: Integrate with actual financial data from database
    return [];
  }

  async getEarningsByPaymentMethod(providerId, since) {
    // TODO: Integrate with actual financial data from database
    return [];
  }

  async getEarningsByTimeframe(providerId, since) {
    // TODO: Integrate with actual financial data from database
    return [];
  }

  async getRatingTrend(providerId, since) {
    // TODO: Integrate with actual review data from database
    return {
      current: 0,
      previous: 0,
      trend: 'neutral',
      change: 0
    };
  }

  async getResponseTimeTrend(providerId, since) {
    // TODO: Integrate with actual response data from database
    return {
      current: 0,
      previous: 0,
      trend: 'neutral',
      change: 0
    };
  }

  async getCompletionRateTrend(providerId, since) {
    // TODO: Integrate with actual job data from database
    return {
      current: 0,
      previous: 0,
      trend: 'neutral',
      change: 0
    };
  }

  async getPerformanceComparisons(providerId) {
    // TODO: Integrate with actual comparison data from database
    return {
      rating: { provider: 0, average: 0, percentile: 0 },
      responseTime: { provider: 0, average: 0, percentile: 0 },
      completionRate: { provider: 0, average: 0, percentile: 0 }
    };
  }

  async getTopPerformersComparison(providerId) {
    // TODO: Integrate with actual comparison data from database
    return {
      rating: { provider: 0, topPerformers: 0, gap: 0 },
      responseTime: { provider: 0, topPerformers: 0, gap: 0 },
      completionRate: { provider: 0, topPerformers: 0, gap: 0 }
    };
  }

  async getRecentBookings(userId, since) {
    // TODO: Integrate with actual booking data from database
    return [];
  }

  async getRecentReviews(userId, since) {
    // TODO: Integrate with actual review data from database
    return [];
  }

  async getRecentMessages(userId, since) {
    // TODO: Integrate with actual message data from database
    return [];
  }

  async getRecentPayments(userId, since) {
    // TODO: Integrate with actual payment data from database
    return [];
  }

  async getRecentProfileViews(userId, since) {
    // TODO: Integrate with actual view data from database
    return {
      total: 0,
      unique: 0,
      sources: {
        search: 0,
        direct: 0,
        referral: 0
      }
    };
  }

  async getPendingJobs(userId) {
    // TODO: Integrate with actual job data from database
    return 0;
  }

  async getUnreadMessages(userId) {
    // TODO: Integrate with actual message data from database
    return 0;
  }

  async getPendingReviews(userId) {
    // TODO: Integrate with actual review data from database
    return 0;
  }

  async getSystemAlerts(userId) {
    // TODO: Integrate with actual alert data from database
    return [];
  }

  async getPaymentNotifications(userId) {
    // TODO: Integrate with actual payment data from database
    return [];
  }

  async getJobTrends(providerId, since) {
    // TODO: Integrate with actual job data from database
    return [];
  }

  async getEarningsTrends(providerId, since) {
    // TODO: Integrate with actual earnings data from database
    return [];
  }

  async getRatingTrends(providerId, since) {
    // TODO: Integrate with actual rating data from database
    return [];
  }

  async getProfileViewTrends(providerId, since) {
    // TODO: Integrate with actual view data from database
    return [];
  }

  async getCustomerSatisfactionTrends(providerId, since) {
    // TODO: Integrate with actual satisfaction data from database
    return [];
  }

  // Utility methods
  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  // Get provider insights and recommendations
  async getInsights(userId) {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        throw new Error('Provider profile not found');
      }

      const insights = [];

      // Performance insights
      if (provider.performance.rating < 4.0) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Rating Below Average',
          message: 'Your current rating is below the platform average. Consider improving service quality.',
          action: 'Improve service quality and customer communication'
        });
      }

      if (provider.performance.responseTime > 60) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Slow Response Time',
          message: 'Your average response time is above 1 hour. Faster responses lead to more bookings.',
          action: 'Enable push notifications and respond faster to inquiries'
        });
      }

      if (provider.performance.completionRate < 90) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Low Completion Rate',
          message: 'Your job completion rate is below 90%. This may affect your ranking.',
          action: 'Complete all accepted jobs and communicate delays early'
        });
      }

      // Profile insights
      if (provider.metadata.profileViews < 50) {
        insights.push({
          type: 'info',
          category: 'profile',
          title: 'Low Profile Visibility',
          message: 'Your profile views are low. Consider optimizing your profile for better visibility.',
          action: 'Add more photos, update descriptions, and use relevant keywords'
        });
      }

      if (!provider.verification.portfolio.images || provider.verification.portfolio.images.length < 3) {
        insights.push({
          type: 'info',
          category: 'profile',
          title: 'Portfolio Needs Work',
          message: 'Add more portfolio images to showcase your work quality.',
          action: 'Upload high-quality before/after photos of your work'
        });
      }

      // Business insights
      if (provider.performance.earnings.thisMonth < provider.performance.earnings.lastMonth) {
        insights.push({
          type: 'warning',
          category: 'business',
          title: 'Earnings Decline',
          message: 'Your earnings this month are lower than last month.',
          action: 'Increase availability, improve pricing, or add new services'
        });
      }

      return insights;
    } catch (error) {
      logger.error('Failed to get insights', error, { userId });
      throw error;
    }
  }
}

module.exports = new ProviderDashboardService();
