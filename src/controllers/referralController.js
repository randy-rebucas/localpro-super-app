const Referral = require('../models/Referral');
const User = require('../models/User');
const ReferralService = require('../services/referralService');
const EmailService = require('../services/emailService');

// @desc    Get user's referral information
// @route   GET /api/referrals/me
// @access  Private
const getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = 30, page = 1, limit = 10 } = req.query;

    // Get referral statistics
    const stats = await ReferralService.getReferralStats(userId, parseInt(timeRange));

    // Get referral links
    const referralLinks = await ReferralService.getReferralLinks(userId);

    // Get recent referrals
    const skip = (page - 1) * limit;
    const referrals = await Referral.find({ referrer: userId })
      .populate('referee', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments({ referrer: userId });

    res.status(200).json({
      success: true,
      data: {
        stats,
        referralLinks,
        referrals: {
          data: referrals,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      }
    });
  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get referral statistics
// @route   GET /api/referrals/stats
// @access  Private
const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = 30 } = req.query;

    const stats = await ReferralService.getReferralStats(userId, parseInt(timeRange));

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get referral links and sharing options
// @route   GET /api/referrals/links
// @access  Private
const getReferralLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const referralLinks = await ReferralService.getReferralLinks(userId);

    res.status(200).json({
      success: true,
      data: referralLinks
    });
  } catch (error) {
    console.error('Get referral links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Validate referral code
// @route   POST /api/referrals/validate
// @access  Public
const validateReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const validation = await ReferralService.validateReferralCode(referralCode);

    res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track referral click
// @route   POST /api/referrals/track
// @access  Public
const trackReferralClick = async (req, res) => {
  try {
    const { referralCode, trackingData } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    await ReferralService.trackReferralClick(referralCode, trackingData);

    res.status(200).json({
      success: true,
      message: 'Referral click tracked'
    });
  } catch (error) {
    console.error('Track referral click error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
// @access  Public
const getReferralLeaderboard = async (req, res) => {
  try {
    const { limit = 10, timeRange = 30 } = req.query;

    const leaderboard = await ReferralService.getReferralLeaderboard(
      parseInt(limit),
      parseInt(timeRange)
    );

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get referral leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send referral invitation
// @route   POST /api/referrals/invite
// @access  Private
const sendReferralInvitation = async (req, res) => {
  try {
    const { emails, phoneNumbers, message, method = 'email' } = req.body;
    const userId = req.user.id;

    if (!emails && !phoneNumbers) {
      return res.status(400).json({
        success: false,
        message: 'At least one email or phone number is required'
      });
    }

    const user = await User.findById(userId);
    const referralLinks = await ReferralService.getReferralLinks(userId);

    const results = [];

    // Send email invitations
    if (emails && emails.length > 0 && method === 'email') {
      for (const email of emails) {
        try {
          await EmailService.sendReferralInvitation(email, {
            referrerName: user.firstName,
            referralLink: referralLinks.referralLink,
            message: message || `Hi! I've been using LocalPro for local services and it's amazing! Join me and get started with a bonus.`
          });
          results.push({ email, status: 'sent' });
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          results.push({ email, status: 'failed', error: error.message });
        }
      }
    }

    // Send SMS invitations (if SMS service is available)
    if (phoneNumbers && phoneNumbers.length > 0 && method === 'sms') {
      // This would integrate with your SMS service
      for (const phoneNumber of phoneNumbers) {
        try {
          // await TwilioService.sendSMS(phoneNumber, referralLinks.shareOptions.sms);
          results.push({ phoneNumber, status: 'sent' });
        } catch (error) {
          console.error(`Failed to send SMS to ${phoneNumber}:`, error);
          results.push({ phoneNumber, status: 'failed', error: error.message });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Referral invitations sent',
      data: results
    });
  } catch (error) {
    console.error('Send referral invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update referral preferences
// @route   PUT /api/referrals/preferences
// @access  Private
const updateReferralPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { autoShare, shareOnSocial, emailNotifications, smsNotifications } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (autoShare !== undefined) user.referral.referralPreferences.autoShare = autoShare;
    if (shareOnSocial !== undefined) user.referral.referralPreferences.shareOnSocial = shareOnSocial;
    if (emailNotifications !== undefined) user.referral.referralPreferences.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) user.referral.referralPreferences.smsNotifications = smsNotifications;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Referral preferences updated successfully',
      data: user.referral.referralPreferences
    });
  } catch (error) {
    console.error('Update referral preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get referral rewards history
// @route   GET /api/referrals/rewards
// @access  Private
const getReferralRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      $or: [
        { referrer: userId },
        { referee: userId }
      ],
      status: 'completed'
    };

    if (status) {
      filter['rewardDistribution.referrerReward.status'] = status;
    }

    const skip = (page - 1) * limit;
    const referrals = await Referral.find(filter)
      .populate('referrer', 'firstName lastName profile.avatar')
      .populate('referee', 'firstName lastName profile.avatar')
      .sort({ 'timeline.completedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments(filter);

    // Calculate total rewards for the user
    const totalRewards = await Referral.aggregate([
      {
        $match: {
          $or: [
            { referrer: userId },
            { referee: userId }
          ],
          status: 'completed'
        }
      },
      {
        $project: {
          userReward: {
            $cond: [
              { $eq: ['$referrer', userId] },
              '$rewardDistribution.referrerReward.amount',
              '$rewardDistribution.refereeReward.amount'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: '$userReward' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        referrals,
        totalRewards: totalRewards[0]?.totalRewards || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get referral rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process referral completion (Internal use)
// @route   POST /api/referrals/process
// @access  Private (Admin/System)
const processReferralCompletion = async (req, res) => {
  try {
    const { referralId, triggerAction } = req.body;

    if (!referralId || !triggerAction) {
      return res.status(400).json({
        success: false,
        message: 'Referral ID and trigger action are required'
      });
    }

    const referral = await ReferralService.processReferralCompletion(referralId, triggerAction);

    res.status(200).json({
      success: true,
      message: 'Referral completion processed successfully',
      data: referral
    });
  } catch (error) {
    console.error('Process referral completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get referral analytics (Admin)
// @route   GET /api/referrals/analytics
// @access  Private (Admin)
const getReferralAnalytics = async (req, res) => {
  try {
    const { timeRange = 30, groupBy = 'day' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get referral trends
    const trends = await Referral.aggregate([
      {
        $match: {
          'timeline.referredAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              date: '$timeline.referredAt'
            }
          },
          totalReferrals: { $sum: 1 },
          completedReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRewards: {
            $sum: {
              $add: [
                '$rewardDistribution.referrerReward.amount',
                '$rewardDistribution.refereeReward.amount'
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top referral types
    const referralTypes = await Referral.aggregate([
      {
        $match: {
          'timeline.referredAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$referralType',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get conversion rates
    const conversionRates = await Referral.aggregate([
      {
        $match: {
          'timeline.referredAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          completedReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRewards: {
            $sum: {
              $add: [
                '$rewardDistribution.referrerReward.amount',
                '$rewardDistribution.refereeReward.amount'
              ]
            }
          }
        }
      }
    ]);

    const conversionRate = conversionRates[0] ? 
      (conversionRates[0].completedReferrals / conversionRates[0].totalReferrals * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        trends,
        referralTypes,
        conversionRate: Math.round(conversionRate * 100) / 100,
        summary: conversionRates[0] || {
          totalReferrals: 0,
          completedReferrals: 0,
          totalRewards: 0
        }
      }
    });
  } catch (error) {
    console.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMyReferrals,
  getReferralStats,
  getReferralLinks,
  validateReferralCode,
  trackReferralClick,
  getReferralLeaderboard,
  sendReferralInvitation,
  updateReferralPreferences,
  getReferralRewards,
  processReferralCompletion,
  getReferralAnalytics
};
