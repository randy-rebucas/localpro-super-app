const Provider = require('../models/Provider');
const User = require('../models/User');
const Escrow = require('../models/Escrow');
const EscrowTransaction = require('../models/EscrowTransaction');
const Payout = require('../models/Payout');
const ProviderPerformance = require('../models/ProviderPerformance');
const Marketplace = require('../models/Marketplace');
const Announcement = require('../models/Announcement');
const Communication = require('../models/Communication');
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
    // Get subscription from User model
    const user = await User.findById(provider.userId).populate('localProPlusSubscription');
    let subscription = null;
    
    if (user && user.localProPlusSubscription) {
      const sub = user.localProPlusSubscription;
      // Populate plan if it's an ObjectId
      if (sub.plan && typeof sub.plan === 'object' && sub.plan._id) {
        await sub.populate('plan');
      }
      subscription = {
        plan: sub.plan?.name || sub.plan || 'basic',
        features: sub.features || {},
        limits: {
          maxServices: sub.usage?.services?.limit || 5,
          maxBookingsPerMonth: sub.usage?.bookings?.limit || 50,
          prioritySupport: sub.features?.prioritySupport || false,
          advancedAnalytics: sub.features?.advancedAnalytics || false
        }
      };
    } else {
      // Default subscription if none exists
      subscription = {
        plan: 'basic',
        features: {},
        limits: {
          maxServices: 5,
          maxBookingsPerMonth: 50,
          prioritySupport: false,
          advancedAnalytics: false
        }
      };
    }
    
    const performance = await provider.ensurePerformance();
    
    return {
      status: provider.status,
      rating: performance.rating,
      totalReviews: performance.totalReviews,
      totalJobs: performance.totalJobs,
      completedJobs: performance.completedJobs,
      completionRate: performance.completionRate,
      responseTime: performance.responseTime,
      repeatCustomerRate: performance.repeatCustomerRate,
      profileViews: provider.metadata.profileViews,
      isVerified: await provider.isVerified(),
      canAcceptJobs: await provider.canAcceptJobs(),
      badges: performance.badges,
      subscription
    };
  }

  // Get earnings data
  async getEarningsData(provider, since) {
    const performance = await provider.ensurePerformance();
    return {
      total: performance.earnings.total,
      thisMonth: performance.earnings.thisMonth,
      lastMonth: performance.earnings.lastMonth,
      pending: performance.earnings.pending,
      period: {
        total: performance.earnings.thisMonth,
        average: performance.earnings.thisMonth / 30,
        growth: this.calculateGrowth(performance.earnings.thisMonth, performance.earnings.lastMonth)
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
    const performance = await provider.ensurePerformance();
    return {
      metrics: {
        rating: performance.rating,
        totalReviews: performance.totalReviews,
        responseTime: performance.responseTime,
        completionRate: performance.completionRate,
        repeatCustomerRate: performance.repeatCustomerRate
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
    try {
      const transactions = await EscrowTransaction.find({
        'metadata.tags': 'capture',
        status: 'SUCCESS',
        createdAt: { $gte: since }
      }).populate({
        path: 'escrowId',
        match: { providerId: providerId }
      });

      const categoryEarnings = {};

      for (const transaction of transactions) {
        if (transaction.escrowId) {
          // Get service category from escrow or related booking
          const escrow = await Escrow.findById(transaction.escrowId).populate('bookingId');
          if (escrow && escrow.bookingId) {
            const category = escrow.bookingId.category || 'other';
            categoryEarnings[category] = (categoryEarnings[category] || 0) + transaction.amount;
          }
        }
      }

      return Object.entries(categoryEarnings).map(([category, amount]) => ({
        category,
        amount: amount / 100, // Convert cents to dollars
        percentage: 0 // Will be calculated later
      }));
    } catch (error) {
      logger.error('Error getting earnings by category:', error);
      return [];
    }
  }

  async getEarningsByPaymentMethod(providerId, since) {
    try {
      const transactions = await EscrowTransaction.find({
        'metadata.tags': 'capture',
        status: 'SUCCESS',
        createdAt: { $gte: since }
      }).populate({
        path: 'escrowId',
        match: { providerId: providerId }
      });

      const methodEarnings = {};

      for (const transaction of transactions) {
        const method = transaction.gateway?.provider || 'unknown';
        methodEarnings[method] = (methodEarnings[method] || 0) + transaction.amount;
      }

      return Object.entries(methodEarnings).map(([method, amount]) => ({
        method,
        amount: amount / 100, // Convert cents to dollars
        percentage: 0 // Will be calculated later
      }));
    } catch (error) {
      logger.error('Error getting earnings by payment method:', error);
      return [];
    }
  }

  async getEarningsByTimeframe(providerId, since) {
    try {
      const transactions = await EscrowTransaction.aggregate([
        {
          $match: {
            'metadata.tags': 'capture',
            status: 'SUCCESS',
            createdAt: { $gte: since }
          }
        },
        {
          $lookup: {
            from: 'escrows',
            localField: 'escrowId',
            foreignField: '_id',
            as: 'escrow'
          }
        },
        {
          $match: {
            'escrow.providerId': providerId
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      return transactions.map(item => ({
        date: item._id,
        amount: item.amount / 100 // Convert cents to dollars
      }));
    } catch (error) {
      logger.error('Error getting earnings by timeframe:', error);
      return [];
    }
  }

  async getRatingTrend(providerId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: providerId });
      if (!performance) {
        return {
          current: 0,
          previous: 0,
          trend: 'neutral',
          change: 0
        };
      }

      // For now, we'll use current rating as both current and previous
      // In a real implementation, you'd track historical ratings
      const current = performance.rating;
      const previous = current; // Placeholder - would need historical data

      const change = current - previous;
      let trend = 'neutral';
      if (change > 0.1) trend = 'up';
      else if (change < -0.1) trend = 'down';

      return {
        current,
        previous,
        trend,
        change
      };
    } catch (error) {
      logger.error('Error getting rating trend:', error);
      return {
        current: 0,
        previous: 0,
        trend: 'neutral',
        change: 0
      };
    }
  }

  async getResponseTimeTrend(providerId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: providerId });
      if (!performance) {
        return {
          current: 0,
          previous: 0,
          trend: 'neutral',
          change: 0
        };
      }

      // Use current response time as both current and previous
      // In a real implementation, you'd track historical response times
      const current = performance.responseTime || 0;
      const previous = current; // Placeholder

      const change = previous - current; // Lower is better
      let trend = 'neutral';
      if (change > 5) trend = 'up'; // Response time decreased
      else if (change < -5) trend = 'down'; // Response time increased

      return {
        current,
        previous,
        trend,
        change
      };
    } catch (error) {
      logger.error('Error getting response time trend:', error);
      return {
        current: 0,
        previous: 0,
        trend: 'neutral',
        change: 0
      };
    }
  }

  async getCompletionRateTrend(providerId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: providerId });
      if (!performance) {
        return {
          current: 0,
          previous: 0,
          trend: 'neutral',
          change: 0
        };
      }

      const current = performance.completionRate || 0;
      const previous = current; // Placeholder

      const change = current - previous;
      let trend = 'neutral';
      if (change > 1) trend = 'up';
      else if (change < -1) trend = 'down';

      return {
        current,
        previous,
        trend,
        change
      };
    } catch (error) {
      logger.error('Error getting completion rate trend:', error);
      return {
        current: 0,
        previous: 0,
        trend: 'neutral',
        change: 0
      };
    }
  }

  async getPerformanceComparisons(providerId) {
    try {
      const providerPerformance = await ProviderPerformance.findOne({ provider: providerId });
      if (!providerPerformance) {
        return {
          rating: { provider: 0, average: 0, percentile: 0 },
          responseTime: { provider: 0, average: 0, percentile: 0 },
          completionRate: { provider: 0, average: 0, percentile: 0 }
        };
      }

      // Get all provider performances for comparison
      const allPerformances = await ProviderPerformance.find({
        rating: { $gt: 0 }, // Only include providers with ratings
        totalJobs: { $gte: 5 } // Only include providers with some experience
      }).select('rating responseTime completionRate');

      if (allPerformances.length === 0) {
        return {
          rating: { provider: providerPerformance.rating, average: 0, percentile: 0 },
          responseTime: { provider: providerPerformance.responseTime, average: 0, percentile: 0 },
          completionRate: { provider: providerPerformance.completionRate, average: 0, percentile: 0 }
        };
      }

      // Calculate averages
      const avgRating = allPerformances.reduce((sum, p) => sum + p.rating, 0) / allPerformances.length;
      const avgResponseTime = allPerformances.reduce((sum, p) => sum + p.responseTime, 0) / allPerformances.length;
      const avgCompletionRate = allPerformances.reduce((sum, p) => sum + p.completionRate, 0) / allPerformances.length;

      // Calculate percentiles
      const calculatePercentile = (value, values, ascending = true) => {
        if (ascending) {
          // For metrics where higher is better (rating, completion rate)
          const sorted = values.sort((a, b) => b - a);
          const index = sorted.findIndex(v => v <= value);
          return Math.round((index / sorted.length) * 100);
        } else {
          // For metrics where lower is better (response time)
          const sorted = values.sort((a, b) => a - b);
          const index = sorted.findIndex(v => v >= value);
          return Math.round((index / sorted.length) * 100);
        }
      };

      return {
        rating: {
          provider: providerPerformance.rating,
          average: Math.round(avgRating * 10) / 10,
          percentile: calculatePercentile(providerPerformance.rating, allPerformances.map(p => p.rating), true)
        },
        responseTime: {
          provider: providerPerformance.responseTime,
          average: Math.round(avgResponseTime),
          percentile: calculatePercentile(providerPerformance.responseTime, allPerformances.map(p => p.responseTime), false)
        },
        completionRate: {
          provider: providerPerformance.completionRate,
          average: Math.round(avgCompletionRate * 10) / 10,
          percentile: calculatePercentile(providerPerformance.completionRate, allPerformances.map(p => p.completionRate), true)
        }
      };
    } catch (error) {
      logger.error('Error getting performance comparisons:', error);
      return {
        rating: { provider: 0, average: 0, percentile: 0 },
        responseTime: { provider: 0, average: 0, percentile: 0 },
        completionRate: { provider: 0, average: 0, percentile: 0 }
      };
    }
  }

  async getTopPerformersComparison(providerId) {
    try {
      const providerPerformance = await ProviderPerformance.findOne({ provider: providerId });
      if (!providerPerformance) {
        return {
          rating: { provider: 0, topPerformers: 0, gap: 0 },
          responseTime: { provider: 0, topPerformers: 0, gap: 0 },
          completionRate: { provider: 0, topPerformers: 0, gap: 0 }
        };
      }

      // Get top 10% performers for comparison
      const allPerformances = await ProviderPerformance.find({
        rating: { $gt: 0 },
        totalJobs: { $gte: 10 } // Experienced providers only
      }).sort({ rating: -1, completionRate: -1 }).limit(50); // Get top performers

      if (allPerformances.length === 0) {
        return {
          rating: { provider: providerPerformance.rating, topPerformers: 0, gap: 0 },
          responseTime: { provider: providerPerformance.responseTime, topPerformers: 0, gap: 0 },
          completionRate: { provider: providerPerformance.completionRate, topPerformers: 0, gap: 0 }
        };
      }

      // Calculate top performer averages
      const topPerformersCount = Math.max(1, Math.floor(allPerformances.length * 0.1)); // Top 10%
      const topPerformers = allPerformances.slice(0, topPerformersCount);

      const avgTopRating = topPerformers.reduce((sum, p) => sum + p.rating, 0) / topPerformers.length;
      const avgTopResponseTime = topPerformers.reduce((sum, p) => sum + p.responseTime, 0) / topPerformers.length;
      const avgTopCompletionRate = topPerformers.reduce((sum, p) => sum + p.completionRate, 0) / topPerformers.length;

      return {
        rating: {
          provider: providerPerformance.rating,
          topPerformers: Math.round(avgTopRating * 10) / 10,
          gap: Math.round((avgTopRating - providerPerformance.rating) * 10) / 10
        },
        responseTime: {
          provider: providerPerformance.responseTime,
          topPerformers: Math.round(avgTopResponseTime),
          gap: Math.round((providerPerformance.responseTime - avgTopResponseTime) * 10) / 10 // Lower is better
        },
        completionRate: {
          provider: providerPerformance.completionRate,
          topPerformers: Math.round(avgTopCompletionRate * 10) / 10,
          gap: Math.round((avgTopCompletionRate - providerPerformance.completionRate) * 10) / 10
        }
      };
    } catch (error) {
      logger.error('Error getting top performers comparison:', error);
      return {
        rating: { provider: 0, topPerformers: 0, gap: 0 },
        responseTime: { provider: 0, topPerformers: 0, gap: 0 },
        completionRate: { provider: 0, topPerformers: 0, gap: 0 }
      };
    }
  }

  async getRecentBookings(userId, since) {
    try {
      const escrows = await Escrow.find({
        providerId: userId,
        createdAt: { $gte: since }
      })
      .populate('clientId', 'firstName lastName profile.avatar')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .limit(10);

      return escrows.map(escrow => ({
        id: escrow._id,
        client: escrow.clientId ? {
          name: `${escrow.clientId.firstName} ${escrow.clientId.lastName}`,
          avatar: escrow.clientId.profile?.avatar?.url
        } : null,
        service: escrow.bookingId?.title || 'Service Booking',
        amount: escrow.amount / 100, // Convert cents to dollars
        status: escrow.status,
        date: escrow.createdAt
      }));
    } catch (error) {
      logger.error('Error getting recent bookings:', error);
      return [];
    }
  }

  async getRecentReviews(userId, since) {
    try {
      // Get bookings that belong to this provider and have reviews
      const bookingsWithReviews = await Marketplace.find({
        'booking.provider': userId,
        'booking.review.rating': { $exists: true },
        'booking.review.createdAt': { $gte: since }
      })
      .populate('booking.client', 'firstName lastName profile.avatar')
      .populate('booking.provider', 'firstName lastName')
      .select('booking.review booking.client booking.provider title')
      .sort({ 'booking.review.createdAt': -1 })
      .limit(10);

      return bookingsWithReviews.map(booking => ({
        id: booking._id,
        bookingTitle: booking.title,
        rating: booking.booking.review.rating,
        comment: booking.booking.review.comment,
        categories: booking.booking.review.categories,
        wouldRecommend: booking.booking.review.wouldRecommend,
        client: booking.booking.client ? {
          name: `${booking.booking.client.firstName} ${booking.booking.client.lastName}`,
          avatar: booking.booking.client.profile?.avatar?.url
        } : null,
        date: booking.booking.review.createdAt,
        photos: booking.booking.review.photos || []
      }));
    } catch (error) {
      logger.error('Error getting recent reviews:', error);
      return [];
    }
  }

  async getRecentMessages(userId, since) {
    try {
      // Get messages from bookings where this user is the provider
      const bookingsWithMessages = await Marketplace.find({
        'booking.provider': userId,
        'booking.communication.messages': { $exists: true, $ne: [] }
      })
      .populate('booking.client', 'firstName lastName profile.avatar')
      .populate('booking.communication.messages.sender', 'firstName lastName')
      .select('booking.communication.messages booking.client title')
      .sort({ 'booking.communication.lastMessageAt': -1 })
      .limit(20);

      const messages = [];

      bookingsWithMessages.forEach(booking => {
        if (booking.booking?.communication?.messages) {
          booking.booking.communication.messages.forEach(message => {
            if (message.timestamp >= since) {
              messages.push({
                id: message._id,
                bookingTitle: booking.title,
                sender: message.sender ? {
                  name: `${message.sender.firstName} ${message.sender.lastName}`,
                  isProvider: message.sender._id.toString() === userId.toString()
                } : null,
                message: message.message,
                type: message.type,
                timestamp: message.timestamp,
                client: booking.booking.client ? {
                  name: `${booking.booking.client.firstName} ${booking.booking.client.lastName}`,
                  avatar: booking.booking.client.profile?.avatar?.url
                } : null
              });
            }
          });
        }
      });

      // Sort by timestamp and return most recent 10
      return messages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    } catch (error) {
      logger.error('Error getting recent messages:', error);
      return [];
    }
  }

  async getRecentPayments(userId, since) {
    try {
      const transactions = await EscrowTransaction.find({
        initiatedBy: userId,
        createdAt: { $gte: since }
      })
      .populate('escrowId')
      .sort({ createdAt: -1 })
      .limit(10);

      return transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.transactionType,
        amount: transaction.amount / 100, // Convert cents to dollars
        currency: transaction.currency,
        status: transaction.status,
        method: transaction.gateway?.provider || 'unknown',
        date: transaction.createdAt,
        description: transaction.metadata?.reason || 'Payment transaction'
      }));
    } catch (error) {
      logger.error('Error getting recent payments:', error);
      return [];
    }
  }

  async getRecentProfileViews(userId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: userId });

      return {
        total: performance?.profileViews || 0,
        unique: Math.floor((performance?.profileViews || 0) * 0.7), // Estimate unique views
        sources: {
          search: 0,
          direct: 0,
          referral: 0
        }
      };
    } catch (error) {
      logger.error('Error getting recent profile views:', error);
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
  }

  async getPendingJobs(userId) {
    try {
      const pendingCount = await Escrow.countDocuments({
        providerId: userId,
        status: { $in: ['FUNDS_HELD', 'PENDING'] }
      });
      return pendingCount;
    } catch (error) {
      logger.error('Error getting pending jobs:', error);
      return 0;
    }
  }

  async getUnreadMessages(userId) {
    try {
      // Count unread messages in conversations where user is a participant
      const conversations = await Communication.find({
        'participants.user': userId,
        'participants.role': 'provider'
      });

      let unreadCount = 0;

      for (const conversation of conversations) {
        const participant = conversation.participants.find(p =>
          p.user.toString() === userId.toString()
        );

        if (participant) {
          // Count messages after the participant's last read time
          const unreadMessages = conversation.messages.filter(message =>
            message.timestamp > participant.lastReadAt &&
            message.sender.toString() !== userId.toString()
          );
          unreadCount += unreadMessages.length;
        }
      }

      return unreadCount;
    } catch (error) {
      logger.error('Error getting unread messages count:', error);
      return 0;
    }
  }

  async getPendingReviews(userId) {
    try {
      // Count completed bookings that don't have reviews yet
      const pendingReviewsCount = await Marketplace.countDocuments({
        'booking.provider': userId,
        'booking.status': 'COMPLETED',
        $or: [
          { 'booking.review': { $exists: false } },
          { 'booking.review.rating': { $exists: false } }
        ]
      });

      return pendingReviewsCount;
    } catch (error) {
      logger.error('Error getting pending reviews count:', error);
      return 0;
    }
  }

  async getSystemAlerts(userId) {
    try {
      // Get user to determine their roles
      const user = await User.findById(userId).select('roles');
      if (!user) return [];

      // Build role filter for announcements
      const roleFilters = [];
      if (user.roles.includes('provider')) roleFilters.push('providers');
      if (user.roles.includes('client')) roleFilters.push('clients');
      if (user.roles.includes('admin')) roleFilters.push('admins');
      roleFilters.push('all'); // Include announcements for all users

      const alerts = await Announcement.find({
        status: 'published',
        targetAudience: { $in: roleFilters },
        priority: { $in: ['high', 'urgent'] }, // Only show important alerts
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      .sort({ priority: -1, createdAt: -1 })
      .limit(5)
      .select('title summary type priority createdAt');

      return alerts.map(alert => ({
        id: alert._id,
        title: alert.title,
        summary: alert.summary,
        type: alert.type,
        priority: alert.priority,
        date: alert.createdAt
      }));
    } catch (error) {
      logger.error('Error getting system alerts:', error);
      return [];
    }
  }

  async getPaymentNotifications(userId) {
    try {
      // Get recent payment-related events for this provider
      const notifications = [];

      // Check for pending payouts
      const pendingPayouts = await Payout.find({
        providerId: userId,
        status: { $in: ['PENDING', 'PROCESSING'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).sort({ createdAt: -1 }).limit(3);

      pendingPayouts.forEach(payout => {
        notifications.push({
          id: `payout-${payout._id}`,
          type: 'payout_pending',
          title: 'Payout Processing',
          message: `Your payout of $${(payout.amount / 100).toFixed(2)} is being processed`,
          status: payout.status.toLowerCase(),
          date: payout.createdAt,
          amount: payout.amount / 100
        });
      });

      // Check for failed payouts
      const failedPayouts = await Payout.find({
        providerId: userId,
        status: 'FAILED',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).sort({ createdAt: -1 }).limit(2);

      failedPayouts.forEach(payout => {
        notifications.push({
          id: `payout-failed-${payout._id}`,
          type: 'payout_failed',
          title: 'Payout Failed',
          message: `Your payout of $${(payout.amount / 100).toFixed(2)} could not be processed`,
          status: 'failed',
          date: payout.createdAt,
          amount: payout.amount / 100
        });
      });

      // Check for recent successful payouts
      const successfulPayouts = await Payout.find({
        providerId: userId,
        status: 'COMPLETED',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).sort({ createdAt: -1 }).limit(2);

      successfulPayouts.forEach(payout => {
        notifications.push({
          id: `payout-completed-${payout._id}`,
          type: 'payout_completed',
          title: 'Payout Completed',
          message: `$${((payout.amount - payout.fee) / 100).toFixed(2)} has been transferred to your account`,
          status: 'completed',
          date: payout.createdAt,
          amount: (payout.amount - payout.fee) / 100
        });
      });

      // Sort by date and return most recent
      return notifications
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    } catch (error) {
      logger.error('Error getting payment notifications:', error);
      return [];
    }
  }

  async getJobTrends(providerId, since) {
    try {
      // Get job counts by month for the timeframe
      const jobData = await Escrow.aggregate([
        {
          $match: {
            providerId: providerId,
            status: 'COMPLETED',
            updatedAt: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$updatedAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        },
        {
          $limit: 12 // Last 12 months
        }
      ]);

      return jobData.map(item => ({
        period: item._id,
        jobs: item.count
      }));
    } catch (error) {
      logger.error('Error getting job trends:', error);
      return [];
    }
  }

  async getEarningsTrends(providerId, since) {
    try {
      const earningsData = await EscrowTransaction.aggregate([
        {
          $match: {
            'metadata.tags': 'capture',
            status: 'SUCCESS',
            createdAt: { $gte: since }
          }
        },
        {
          $lookup: {
            from: 'escrows',
            localField: 'escrowId',
            foreignField: '_id',
            as: 'escrow'
          }
        },
        {
          $match: {
            'escrow.providerId': providerId
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$createdAt'
              }
            },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id': 1 }
        },
        {
          $limit: 12 // Last 12 months
        }
      ]);

      return earningsData.map(item => ({
        period: item._id,
        earnings: item.amount / 100 // Convert cents to dollars
      }));
    } catch (error) {
      logger.error('Error getting earnings trends:', error);
      return [];
    }
  }

  async getRatingTrends(providerId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: providerId });
      if (!performance) {
        return [];
      }

      // For now, return a simple rating trend
      // In a real implementation, you'd have historical rating data
      const ratingData = [{
        period: new Date().toISOString().substring(0, 7), // Current month
        rating: performance.rating
      }];

      return ratingData;
    } catch (error) {
      logger.error('Error getting rating trends:', error);
      return [];
    }
  }

  async getProfileViewTrends(providerId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: providerId });
      if (!performance || !performance.profileViews) {
        return [];
      }

      // For now, return monthly profile view data
      // In a real implementation, you'd track historical profile views
      const viewData = [{
        period: new Date().toISOString().substring(0, 7), // Current month
        views: performance.profileViews
      }];

      return viewData;
    } catch (error) {
      logger.error('Error getting profile view trends:', error);
      return [];
    }
  }

  async getCustomerSatisfactionTrends(providerId, _since) {
    try {
      const performance = await ProviderPerformance.findOne({ provider: providerId });
      if (!performance) {
        return [];
      }

      // Use rating as a proxy for customer satisfaction
      const satisfactionData = [{
        period: new Date().toISOString().substring(0, 7), // Current month
        satisfaction: performance.rating * 20 // Convert 5-star rating to percentage
      }];

      return satisfactionData;
    } catch (error) {
      logger.error('Error getting customer satisfaction trends:', error);
      return [];
    }
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
      const performance = await provider.ensurePerformance();
      if (performance.rating < 4.0) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Rating Below Average',
          message: 'Your current rating is below the platform average. Consider improving service quality.',
          action: 'Improve service quality and customer communication'
        });
      }

      if (performance.responseTime > 60) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Slow Response Time',
          message: 'Your average response time is above 1 hour. Faster responses lead to more bookings.',
          action: 'Enable push notifications and respond faster to inquiries'
        });
      }

      if (performance.completionRate < 90) {
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

      const verification = await provider.ensureVerification();
      if (!verification.portfolio?.images || verification.portfolio.images.length < 3) {
        insights.push({
          type: 'info',
          category: 'profile',
          title: 'Portfolio Needs Work',
          message: 'Add more portfolio images to showcase your work quality.',
          action: 'Upload high-quality before/after photos of your work'
        });
      }

      // Business insights
      if (performance.earnings.thisMonth < performance.earnings.lastMonth) {
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
