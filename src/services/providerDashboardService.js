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
    // This would integrate with actual financial data
    return {
      total: provider.performance.earnings.total,
      thisMonth: provider.performance.earnings.thisMonth,
      lastMonth: provider.performance.earnings.lastMonth,
      pending: provider.performance.earnings.pending,
      period: {
        total: provider.performance.earnings.thisMonth, // Placeholder
        average: provider.performance.earnings.thisMonth / 30, // Placeholder
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
  async getRecentActivity(_userId, _since) {
    // This would integrate with actual activity data
    return {
      bookings: await this.getRecentBookings(_userId, _since),
      reviews: await this.getRecentReviews(_userId, _since),
      messages: await this.getRecentMessages(_userId, _since),
      payments: await this.getRecentPayments(_userId, _since),
      profileViews: await this.getRecentProfileViews(_userId, _since)
    };
  }

  // Get notifications
  async getNotifications(userId) {
    // This would integrate with actual notification system
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
  async getEarningsByCategory(_providerId, _since) {
    // Placeholder - would integrate with actual financial data
    return [
      { category: 'cleaning', amount: 1500, percentage: 40 },
      { category: 'plumbing', amount: 800, percentage: 25 },
      { category: 'electrical', amount: 600, percentage: 20 },
      { category: 'other', amount: 300, percentage: 15 }
    ];
  }

  async getEarningsByPaymentMethod(_providerId, _since) {
    // Placeholder - would integrate with actual financial data
    return [
      { method: 'bank_transfer', amount: 2000, percentage: 60 },
      { method: 'paypal', amount: 800, percentage: 25 },
      { method: 'paymaya', amount: 400, percentage: 15 }
    ];
  }

  async getEarningsByTimeframe(_providerId, _since) {
    // Placeholder - would integrate with actual financial data
    const days = Math.ceil((Date.now() - _since.getTime()) / (24 * 60 * 60 * 1000));
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 200) + 50
      });
    }

    return data;
  }

  async getRatingTrend(_providerId, _since) {
    // Placeholder - would integrate with actual review data
    return {
      current: 4.8,
      previous: 4.6,
      trend: 'up',
      change: 0.2
    };
  }

  async getResponseTimeTrend(_providerId, _since) {
    // Placeholder - would integrate with actual response data
    return {
      current: 15, // minutes
      previous: 20,
      trend: 'down',
      change: -5
    };
  }

  async getCompletionRateTrend(_providerId, _since) {
    // Placeholder - would integrate with actual job data
    return {
      current: 95, // percentage
      previous: 92,
      trend: 'up',
      change: 3
    };
  }

  async getPerformanceComparisons(_providerId) {
    // Placeholder - would integrate with actual comparison data
    return {
      rating: { provider: 4.8, average: 4.2, percentile: 85 },
      responseTime: { provider: 15, average: 45, percentile: 90 },
      completionRate: { provider: 95, average: 88, percentile: 80 }
    };
  }

  async getTopPerformersComparison(_providerId) {
    // Placeholder - would integrate with actual comparison data
    return {
      rating: { provider: 4.8, topPerformers: 4.9, gap: -0.1 },
      responseTime: { provider: 15, topPerformers: 10, gap: 5 },
      completionRate: { provider: 95, topPerformers: 98, gap: -3 }
    };
  }

  async getRecentBookings(_userId, _since) {
    // Placeholder - would integrate with actual booking data
    return [
      {
        id: '1',
        service: 'House Cleaning',
        customer: 'John Doe',
        date: new Date(),
        status: 'confirmed',
        amount: 150
      }
    ];
  }

  async getRecentReviews(_userId, _since) {
    // Placeholder - would integrate with actual review data
    return [
      {
        id: '1',
        customer: 'Jane Smith',
        rating: 5,
        comment: 'Excellent service!',
        date: new Date(),
        service: 'Plumbing Repair'
      }
    ];
  }

  async getRecentMessages(_userId, _since) {
    // Placeholder - would integrate with actual message data
    return [
      {
        id: '1',
        from: 'Customer',
        subject: 'Service Inquiry',
        date: new Date(),
        unread: true
      }
    ];
  }

  async getRecentPayments(_userId, _since) {
    // Placeholder - would integrate with actual payment data
    return [
      {
        id: '1',
        amount: 200,
        method: 'bank_transfer',
        date: new Date(),
        status: 'completed'
      }
    ];
  }

  async getRecentProfileViews(_userId, _since) {
    // Placeholder - would integrate with actual view data
    return {
      total: 45,
      unique: 38,
      sources: {
        search: 25,
        direct: 10,
        referral: 8
      }
    };
  }

  async getPendingJobs(_userId) {
    // Placeholder - would integrate with actual job data
    return 3;
  }

  async getUnreadMessages(_userId) {
    // Placeholder - would integrate with actual message data
    return 5;
  }

  async getPendingReviews(_userId) {
    // Placeholder - would integrate with actual review data
    return 2;
  }

  async getSystemAlerts(_userId) {
    // Placeholder - would integrate with actual alert data
    return [
      {
        type: 'info',
        message: 'Your profile is 90% complete',
        date: new Date()
      }
    ];
  }

  async getPaymentNotifications(_userId) {
    // Placeholder - would integrate with actual payment data
    return [
      {
        type: 'payment_received',
        amount: 150,
        date: new Date()
      }
    ];
  }

  async getJobTrends(_providerId, _since) {
    // Placeholder - would integrate with actual job data
    const days = Math.ceil((Date.now() - _since.getTime()) / (24 * 60 * 60 * 1000));
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      data.push({
        date: date.toISOString().split('T')[0],
        jobs: Math.floor(Math.random() * 5) + 1
      });
    }

    return data;
  }

  async getEarningsTrends(_providerId, _since) {
    // Placeholder - would integrate with actual earnings data
    return this.getEarningsByTimeframe(_providerId, _since);
  }

  async getRatingTrends(_providerId, _since) {
    // Placeholder - would integrate with actual rating data
    const days = Math.ceil((Date.now() - _since.getTime()) / (24 * 60 * 60 * 1000));
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      data.push({
        date: date.toISOString().split('T')[0],
        rating: 4.5 + (Math.random() * 0.5)
      });
    }

    return data;
  }

  async getProfileViewTrends(_providerId, _since) {
    // Placeholder - would integrate with actual view data
    const days = Math.ceil((Date.now() - _since.getTime()) / (24 * 60 * 60 * 1000));
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 20) + 5
      });
    }

    return data;
  }

  async getCustomerSatisfactionTrends(_providerId, _since) {
    // Placeholder - would integrate with actual satisfaction data
    const days = Math.ceil((Date.now() - _since.getTime()) / (24 * 60 * 60 * 1000));
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      data.push({
        date: date.toISOString().split('T')[0],
        satisfaction: 85 + (Math.random() * 15)
      });
    }

    return data;
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
