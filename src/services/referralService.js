const Referral = require('../models/Referral');
const User = require('../models/User');
const EmailService = require('./emailService');

class ReferralService {
  constructor() {
    this.rewardConfigs = {
      signup: {
        referrer: { type: 'credit', amount: 10, currency: 'USD' },
        referee: { type: 'credit', amount: 5, currency: 'USD' }
      },
      service_booking: {
        referrer: { type: 'percentage', amount: 10, isPercentage: true, maxAmount: 50, currency: 'USD' },
        referee: { type: 'discount', amount: 15, discountType: 'percentage', currency: 'USD' }
      },
      supplies_purchase: {
        referrer: { type: 'percentage', amount: 5, isPercentage: true, maxAmount: 25, currency: 'USD' },
        referee: { type: 'discount', amount: 10, discountType: 'percentage', currency: 'USD' }
      },
      course_enrollment: {
        referrer: { type: 'credit', amount: 20, currency: 'USD' },
        referee: { type: 'discount', amount: 20, discountType: 'percentage', currency: 'USD' }
      },
      loan_application: {
        referrer: { type: 'credit', amount: 25, currency: 'USD' },
        referee: { type: 'credit', amount: 15, currency: 'USD' }
      },
      rental_booking: {
        referrer: { type: 'percentage', amount: 8, isPercentage: true, maxAmount: 30, currency: 'USD' },
        referee: { type: 'discount', amount: 12, discountType: 'percentage', currency: 'USD' }
      },
      subscription_upgrade: {
        referrer: { type: 'subscription_days', amount: 30, subscriptionDays: 30 },
        referee: { type: 'subscription_days', amount: 15, subscriptionDays: 15 }
      }
    };
  }

  /**
   * Create a new referral
   * @param {Object} referralData - Referral data
   * @returns {Promise<Object>} Created referral
   */
  async createReferral(referralData) {
    try {
      const { referrerId, refereeId, referralType, tracking = {} } = referralData;

      // Validate referrer and referee
      const referrer = await User.findById(referrerId);
      const referee = await User.findById(refereeId);

      if (!referrer || !referee) {
        throw new Error('Invalid referrer or referee');
      }

      // Check if referee was already referred by this referrer
      const existingReferral = await Referral.findOne({
        referrer: referrerId,
        referee: refereeId,
        status: { $in: ['pending', 'completed'] }
      });

      if (existingReferral) {
        throw new Error('User has already been referred by this referrer');
      }

      // Generate referral code
      const referralCode = Referral.generateReferralCode();

      // Create referral
      const referral = new Referral({
        referrer: referrerId,
        referee: refereeId,
        referralCode,
        referralType,
        tracking,
        timeline: {
          referredAt: new Date(),
          signupAt: referee.createdAt
        }
      });

      await referral.save();

      // Update referrer stats
      await referrer.updateReferralStats('referral_made');

      // Update referee's referredBy field
      const refereeReferral = await referee.ensureReferral();
      refereeReferral.referredBy = referrerId;
      refereeReferral.referralSource = tracking.source || 'direct_link';
      await refereeReferral.save();

      return referral;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  /**
   * Process referral completion
   * @param {string} referralId - Referral ID
   * @param {Object} triggerAction - Action that triggered the completion
   * @returns {Promise<Object>} Updated referral
   */
  async processReferralCompletion(referralId, triggerAction) {
    try {
      const referral = await Referral.findById(referralId);
      if (!referral) {
        throw new Error('Referral not found');
      }

      if (referral.status !== 'pending') {
        throw new Error('Referral is not in pending status');
      }

      // Mark referral as completed
      await referral.markCompleted(triggerAction);

      // Calculate and set rewards
      const rewardConfig = this.rewardConfigs[referral.referralType];
      if (rewardConfig) {
        const referrerReward = this.calculateReward(triggerAction.amount, rewardConfig.referrer);
        const refereeReward = this.calculateReward(triggerAction.amount, rewardConfig.referee);

        referral.rewardDistribution = {
          referrerReward: {
            amount: referrerReward,
            currency: rewardConfig.referrer.currency || 'USD',
            type: rewardConfig.referrer.type,
            status: 'pending'
          },
          refereeReward: {
            amount: refereeReward,
            currency: rewardConfig.referee.currency || 'USD',
            type: rewardConfig.referee.type,
            status: 'pending'
          }
        };

        await referral.save();

        // Process rewards
        await this.processRewards(referral);

        // Update user stats
        const referrer = await User.findById(referral.referrer);
        const referee = await User.findById(referral.referee);

        if (referrer) {
          await referrer.updateReferralStats('referral_completed');
          await referrer.updateReferralStats('reward_earned', referrerReward);
        }

        if (referee) {
          await referee.updateReferralStats('reward_earned', refereeReward);
        }

        // Send notification emails
        await this.sendCompletionNotifications(referral, referrer, referee);
      }

      return referral;
    } catch (error) {
      console.error('Error processing referral completion:', error);
      throw error;
    }
  }

  /**
   * Calculate reward amount
   * @param {number} triggerAmount - Amount that triggered the reward
   * @param {Object} rewardConfig - Reward configuration
   * @returns {number} Calculated reward amount
   */
  calculateReward(triggerAmount, rewardConfig) {
    if (rewardConfig.isPercentage) {
      const calculatedAmount = (triggerAmount * rewardConfig.amount) / 100;
      return Math.min(calculatedAmount, rewardConfig.maxAmount || Infinity);
    }
    return rewardConfig.amount;
  }

  /**
   * Process rewards for a completed referral
   * @param {Object} referral - Referral object
   * @returns {Promise<void>}
   */
  async processRewards(referral) {
    try {
      const { referrerReward, refereeReward } = referral.rewardDistribution;

      // Process referrer reward
      if (referrerReward.amount > 0) {
        await this.applyReward(referral.referrer, referrerReward, referral);
        referrerReward.status = 'processed';
        referrerReward.processedAt = new Date();
      }

      // Process referee reward
      if (refereeReward.amount > 0) {
        await this.applyReward(referral.referee, refereeReward, referral);
        refereeReward.status = 'processed';
        refereeReward.processedAt = new Date();
      }

      referral.timeline.rewardedAt = new Date();
      await referral.save();
    } catch (error) {
      console.error('Error processing rewards:', error);
      throw error;
    }
  }

  /**
   * Apply reward to user
   * @param {string} userId - User ID
   * @param {Object} reward - Reward object
   * @param {Object} referral - Referral object (optional, for metadata)
   * @returns {Promise<void>}
   */
  async applyReward(userId, reward, referral = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      switch (reward.type) {
        case 'credit':
          await user.addWalletCredit({
            category: 'referral_reward',
            amount: reward.amount,
            description: `Referral reward: ${reward.description || 'Referral bonus'}`,
            reference: referral ? {
              type: 'Referral',
              id: referral._id
            } : undefined,
            paymentMethod: 'internal',
            metadata: referral ? {
              referralId: referral._id,
              referralType: referral.referralType
            } : undefined
          });
          break;
        case 'discount':
          // Create discount code or apply directly
          // This would integrate with your discount system
          break;
        case 'subscription_days':
          // Extend subscription
          if (user.subscription.endDate) {
            const newEndDate = new Date(user.subscription.endDate);
            newEndDate.setDate(newEndDate.getDate() + reward.subscriptionDays);
            user.subscription.endDate = newEndDate;
          }
          break;
        case 'points':
          // Add points to user account
          // This would integrate with your points system
          break;
      }

      await user.save();
    } catch (error) {
      console.error('Error applying reward:', error);
      throw error;
    }
  }

  /**
   * Send completion notifications
   * @param {Object} referral - Referral object
   * @param {Object} referrer - Referrer user
   * @param {Object} referee - Referee user
   * @returns {Promise<void>}
   */
  async sendCompletionNotifications(referral, referrer, referee) {
    try {
      // Ensure referral is populated
      await referrer.populate('referral');
      await referee.populate('referral');
      
      // Send notification to referrer
      if (referrer.email && referrer.referral && referrer.referral.referralPreferences.emailNotifications) {
        await EmailService.sendReferralRewardNotification(referrer.email, {
          referrerName: referrer.firstName,
          refereeName: referee.firstName,
          rewardAmount: referral.rewardDistribution.referrerReward.amount,
          rewardType: referral.rewardDistribution.referrerReward.type,
          referralType: referral.referralType
        });
      }

      // Send notification to referee
      if (referee.email && referee.referral && referee.referral.referralPreferences.emailNotifications) {
        await EmailService.sendReferralRewardNotification(referee.email, {
          referrerName: referrer.firstName,
          refereeName: referee.firstName,
          rewardAmount: referral.rewardDistribution.refereeReward.amount,
          rewardType: referral.rewardDistribution.refereeReward.type,
          referralType: referral.referralType
        });
      }
    } catch (error) {
      console.error('Error sending completion notifications:', error);
      // Don't throw error as this shouldn't fail the referral process
    }
  }

  /**
   * Get referral statistics for a user
   * @param {string} userId - User ID
   * @param {number} timeRange - Time range in days
   * @returns {Promise<Object>} Referral statistics
   */
  async getReferralStats(userId, timeRange = 30) {
    try {
      const stats = await Referral.getReferralStats(userId, timeRange);
      const user = await User.findById(userId).populate('referral');
      
      if (!user.referral) {
        return {
          ...stats,
          tier: 'bronze',
          totalRewardsEarned: 0,
          totalRewardsPaid: 0
        };
      }
      
      return {
        ...stats,
        tier: user.referral.referralStats.referralTier,
        totalRewardsEarned: user.referral.referralStats.totalRewardsEarned,
        totalRewardsPaid: user.referral.referralStats.totalRewardsPaid
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    }
  }

  /**
   * Get referral leaderboard
   * @param {number} limit - Number of top referrers to return
   * @param {number} timeRange - Time range in days
   * @returns {Promise<Array>} Leaderboard data
   */
  async getReferralLeaderboard(limit = 10, timeRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const leaderboard = await Referral.aggregate([
        {
          $match: {
            status: 'completed',
            'timeline.completedAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$referrer',
            totalReferrals: { $sum: 1 },
            totalRewards: {
              $sum: '$rewardDistribution.referrerReward.amount'
            },
            totalValue: { $sum: '$triggerAction.amount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            userId: '$_id',
            userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            userAvatar: '$user.profile.avatar.url',
            totalReferrals: 1,
            totalRewards: 1,
            totalValue: 1,
            // Note: Tier lookup would need to be done separately or via $lookup to UserReferral
            tier: 'bronze' // Default tier, can be enhanced with additional lookup
          }
        },
        {
          $sort: { totalReferrals: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return leaderboard;
    } catch (error) {
      console.error('Error getting referral leaderboard:', error);
      throw error;
    }
  }

  /**
   * Validate referral code
   * @param {string} referralCode - Referral code to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateReferralCode(referralCode) {
    try {
      const referral = await Referral.findActiveByCode(referralCode);
      
      if (!referral) {
        return { valid: false, message: 'Invalid or expired referral code' };
      }

      const referrer = await User.findById(referral.referrer).select('firstName lastName profile.avatar');
      
      return {
        valid: true,
        referral,
        referrer: {
          id: referrer._id,
          name: `${referrer.firstName} ${referrer.lastName}`,
          avatar: referrer.profile.avatar?.url
        }
      };
    } catch (error) {
      console.error('Error validating referral code:', error);
      throw error;
    }
  }

  /**
   * Get user's referral links and sharing options
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Referral links and options
   */
  async getReferralLinks(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const baseUrl = process.env.FRONTEND_URL;
      const referralCode = await user.generateReferralCode();
      const referralLink = await user.getReferralLink(baseUrl);

      return {
        referralCode,
        referralLink,
        qrCode: `${baseUrl}/api/referrals/qr/${referralCode}`,
        shareOptions: {
          email: {
            subject: `Join me on LocalPro!`,
            body: `I've been using LocalPro for local services and it's amazing! Use my referral link to get started: ${referralLink}`
          },
          sms: `Check out LocalPro for local services! Use my referral link: ${referralLink}`,
          social: {
            facebook: `I love using LocalPro for local services! Join me: ${referralLink}`,
            twitter: `Discover amazing local services with LocalPro! ${referralLink}`,
            linkedin: `I recommend LocalPro for professional local services. Join me: ${referralLink}`
          }
        }
      };
    } catch (error) {
      console.error('Error getting referral links:', error);
      throw error;
    }
  }

  /**
   * Track referral click
   * @param {string} referralCode - Referral code
   * @param {Object} trackingData - Tracking data
   * @returns {Promise<void>}
   */
  async trackReferralClick(referralCode, _trackingData) {
    try {
      const referral = await Referral.findOne({ referralCode });
      if (referral) {
        referral.analytics.clickCount += 1;
        await referral.save();
      }
    } catch (error) {
      console.error('Error tracking referral click:', error);
      // Don't throw error as this shouldn't fail the main process
    }
  }
}

module.exports = new ReferralService();
