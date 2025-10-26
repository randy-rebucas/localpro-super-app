const { UserSubscription, FeatureUsage } = require('../models/LocalProPlus');
const logger = require('../utils/logger');

class UsageTrackingService {
  /**
   * Track feature usage
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @param {number} amount - Usage amount (default: 1)
   * @param {Object} metadata - Additional metadata
   */
  static async trackUsage(userId, feature, amount = 1, metadata = {}) {
    try {
      const subscription = await UserSubscription.findOne({ user: userId });

      if (!subscription) {
        throw new Error('No subscription found for user');
      }

      // Check if feature is included in plan
      if (!subscription.hasFeatureAccess(feature)) {
        throw new Error(`Feature ${feature} not included in subscription plan`);
      }

      // Check usage limits
      if (!subscription.checkUsageLimit(feature)) {
        throw new Error(`Usage limit exceeded for feature ${feature}`);
      }

      // Increment usage in subscription
      await subscription.incrementUsage(feature, amount);

      // Create feature usage record
      const featureUsage = new FeatureUsage({
        user: userId,
        subscription: subscription._id,
        feature,
        usage: {
          count: amount,
          metadata
        }
      });

      await featureUsage.save();

      return {
        success: true,
        currentUsage: subscription.usage[feature]?.current || 0,
        limit: subscription.usage[feature]?.limit || 'unlimited'
      };
    } catch (error) {
      logger.error('Usage tracking error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage statistics for a user
   * @param {string} userId - User ID
   * @param {string} period - Time period ('day', 'week', 'month', 'year')
   */
  static async getUserUsageStats(userId, period = 'month') {
    try {
      const subscription = await UserSubscription.findOne({ user: userId });

      if (!subscription) {
        return {
          success: false,
          error: 'No subscription found'
        };
      }

      const now = new Date();
      let startDate;

      switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get feature usage statistics
      const usageStats = await FeatureUsage.aggregate([
        {
          $match: {
            user: subscription.user,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$feature',
            totalUsage: { $sum: '$usage.count' },
            usageCount: { $sum: 1 },
            lastUsed: { $max: '$timestamp' }
          }
        },
        {
          $sort: { totalUsage: -1 }
        }
      ]);

      return {
        success: true,
        data: {
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            billingCycle: subscription.billingCycle
          },
          usage: subscription.usage,
          featureStats: usageStats,
          period,
          startDate,
          endDate: now
        }
      };
    } catch (error) {
      logger.error('Get usage stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user can perform an action based on usage limits
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @param {number} amount - Amount to check (default: 1)
   */
  static async canPerformAction(userId, feature, amount = 1) {
    try {
      const subscription = await UserSubscription.findOne({ user: userId });

      if (!subscription) {
        return {
          canPerform: false,
          reason: 'No subscription found'
        };
      }

      if (!subscription.isActive()) {
        return {
          canPerform: false,
          reason: 'Subscription is not active'
        };
      }

      if (!subscription.hasFeatureAccess(feature)) {
        return {
          canPerform: false,
          reason: 'Feature not included in subscription plan'
        };
      }

      const currentUsage = subscription.usage[feature]?.current || 0;
      const limit = subscription.usage[feature]?.limit;

      if (limit && (currentUsage + amount) > limit) {
        return {
          canPerform: false,
          reason: 'Usage limit would be exceeded',
          currentUsage,
          limit,
          remaining: limit - currentUsage
        };
      }

      return {
        canPerform: true,
        currentUsage,
        limit,
        remaining: limit ? limit - currentUsage : 'unlimited'
      };
    } catch (error) {
      logger.error('Check action permission error:', error);
      return {
        canPerform: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Reset usage counters (typically called monthly)
   * @param {string} userId - User ID
   */
  static async resetUsageCounters(userId) {
    try {
      const subscription = await UserSubscription.findOne({ user: userId });

      if (!subscription) {
        return {
          success: false,
          error: 'No subscription found'
        };
      }

      // Reset all usage counters
      Object.keys(subscription.usage).forEach(feature => {
        if (subscription.usage[feature].current) {
          subscription.usage[feature].current = 0;
        }
      });

      await subscription.save();

      return {
        success: true,
        message: 'Usage counters reset successfully'
      };
    } catch (error) {
      logger.error('Reset usage counters error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage analytics for admin
   * @param {Object} filters - Filter options
   */
  static async getUsageAnalytics(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        feature,
        userId,
        subscriptionId
      } = filters;

      const matchConditions = {};

      if (startDate) matchConditions.timestamp = { $gte: new Date(startDate) };
      if (endDate) {
        matchConditions.timestamp = {
          ...matchConditions.timestamp,
          $lte: new Date(endDate)
        };
      }
      if (feature) matchConditions.feature = feature;
      if (userId) matchConditions.user = userId;
      if (subscriptionId) matchConditions.subscription = subscriptionId;

      // Get usage statistics
      const usageStats = await FeatureUsage.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$feature',
            totalUsage: { $sum: '$usage.count' },
            uniqueUsers: { $addToSet: '$user' },
            usageCount: { $sum: 1 }
          }
        },
        {
          $project: {
            feature: '$_id',
            totalUsage: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            usageCount: 1
          }
        },
        { $sort: { totalUsage: -1 } }
      ]);

      // Get top users by usage
      const topUsers = await FeatureUsage.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$user',
            totalUsage: { $sum: '$usage.count' },
            featureCount: { $addToSet: '$feature' }
          }
        },
        {
          $project: {
            user: '$_id',
            totalUsage: 1,
            featureCount: { $size: '$featureCount' }
          }
        },
        { $sort: { totalUsage: -1 } },
        { $limit: 10 }
      ]);

      return {
        success: true,
        data: {
          usageStats,
          topUsers,
          filters: {
            startDate,
            endDate,
            feature,
            userId,
            subscriptionId
          }
        }
      };
    } catch (error) {
      logger.error('Get usage analytics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = UsageTrackingService;
