const { AnalyticsEvent } = require('../models/Analytics');
const User = require('../models/User');
const { Service, Booking } = require('../models/Marketplace');
const Job = require('../models/Job');
const Referral = require('../models/Referral');
const Agency = require('../models/Agency');
const logger = require('../utils/logger');


// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getAnalyticsOverview = async(req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total services
    const totalServices = await Service.countDocuments();

    // Get total jobs
    const totalJobs = await Job.countDocuments();

    // Get total agencies
    const totalAgencies = await Agency.countDocuments({ isActive: true });

    // Get total referrals
    const totalReferrals = await Referral.countDocuments();

    // Get user registrations by month
    const userRegistrations = await User.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get service categories
    const serviceCategories = await Service.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get job categories
    const jobCategories = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get top performing providers
    const topProviders = await User.aggregate([
      {
        $match: { role: 'provider' }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'provider',
          as: 'services'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'provider',
          as: 'bookings'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          'profile.avatar': 1,
          'profile.rating': 1,
          serviceCount: { $size: '$services' },
          bookingCount: { $size: '$bookings' }
        }
      },
      {
        $sort: { 'profile.rating': -1, bookingCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get revenue analytics
    const revenueAnalytics = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get referral analytics
    const referralAnalytics = await Referral.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalReward: { $sum: '$rewardConfiguration.totalReward' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalServices,
          totalJobs,
          totalAgencies,
          totalReferrals
        },
        userRegistrations,
        serviceCategories,
        jobCategories,
        topProviders,
        revenueAnalytics,
        referralAnalytics
      }
    });
  } catch (error) {
    logger.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private
const getUserAnalytics = async(req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get user registrations by day
    const userRegistrations = await User.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users by location
    const usersByLocation = await User.aggregate([
      {
        $match: { 'profile.address.city': { $exists: true } }
      },
      {
        $group: {
          _id: '$profile.address.city',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get user engagement metrics
    const userEngagement = await User.aggregate([
      {
        $project: {
          role: 1,
          'profile.rating': 1,
          'profile.experience': 1,
          'profile.skills': 1,
          hasAvatar: { $cond: [{ $ne: ['$profile.avatar', null] }, 1, 0] },
          hasBio: { $cond: [{ $ne: ['$profile.bio', null] }, 1, 0] },
          hasSkills: { $cond: [{ $gt: [{ $size: { $ifNull: ['$profile.skills', []] } }, 0] }, 1, 0] }
        }
      },
      {
        $group: {
          _id: '$role',
          totalUsers: { $sum: 1 },
          avgRating: { $avg: '$profile.rating' },
          avgExperience: { $avg: '$profile.experience' },
          usersWithAvatar: { $sum: '$hasAvatar' },
          usersWithBio: { $sum: '$hasBio' },
          usersWithSkills: { $sum: '$hasSkills' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        userRegistrations,
        usersByRole,
        usersByLocation,
        userEngagement
      }
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get marketplace analytics
// @route   GET /api/analytics/marketplace
// @access  Private
const getMarketplaceAnalytics = async(req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get service analytics
    const serviceAnalytics = await Service.aggregate([
      {
        $match: { ...dateFilter }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.basePrice' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get booking analytics
    const bookingAnalytics = await Booking.aggregate([
      {
        $match: { ...dateFilter }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    // Get top services by bookings
    const topServices = await Service.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'service',
          as: 'bookings'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          'pricing.basePrice': 1,
          bookingCount: { $size: '$bookings' },
          totalRevenue: {
            $sum: '$bookings.pricing.totalAmount'
          }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get provider performance
    const providerPerformance = await User.aggregate([
      {
        $match: { role: 'provider' }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'provider',
          as: 'services'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'provider',
          as: 'bookings'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          'profile.avatar': 1,
          'profile.rating': 1,
          serviceCount: { $size: '$services' },
          bookingCount: { $size: '$bookings' },
          totalRevenue: {
            $sum: '$bookings.pricing.totalAmount'
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        serviceAnalytics,
        bookingAnalytics,
        topServices,
        providerPerformance
      }
    });
  } catch (error) {
    logger.error('Get marketplace analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get job board analytics
// @route   GET /api/analytics/jobs
// @access  Private
const getJobAnalytics = async(req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get job analytics by category
    const jobAnalytics = await Job.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary.max' },
          totalApplications: { $sum: { $size: '$applications' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get job status analytics
    const jobStatusAnalytics = await Job.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top employers
    const topEmployers = await Job.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$employer',
          jobCount: { $sum: 1 },
          totalApplications: { $sum: { $size: '$applications' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employer'
        }
      },
      {
        $unwind: '$employer'
      },
      {
        $project: {
          employerName: { $concat: ['$employer.firstName', ' ', '$employer.lastName'] },
          jobCount: 1,
          totalApplications: 1
        }
      },
      {
        $sort: { jobCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get application analytics
    const applicationAnalytics = await Job.aggregate([
      {
        $unwind: '$applications'
      },
      {
        $match: {
          'applications.createdAt': {
            $gte: startDate ? new Date(startDate) : new Date('2020-01-01'),
            $lte: endDate ? new Date(endDate) : new Date()
          }
        }
      },
      {
        $group: {
          _id: '$applications.status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        jobAnalytics,
        jobStatusAnalytics,
        topEmployers,
        applicationAnalytics
      }
    });
  } catch (error) {
    logger.error('Get job analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get referral analytics
// @route   GET /api/analytics/referrals
// @access  Private
const getReferralAnalytics = async(req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get referral analytics by status
    const referralStatusAnalytics = await Referral.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalReward: { $sum: '$rewardConfiguration.totalReward' }
        }
      }
    ]);

    // Get referral analytics by type
    const referralTypeAnalytics = await Referral.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$referralType',
          count: { $sum: 1 },
          totalReward: { $sum: '$rewardConfiguration.totalReward' }
        }
      }
    ]);

    // Get top referrers
    const topReferrers = await Referral.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$referrer',
          referralCount: { $sum: 1 },
          totalReward: { $sum: '$rewardConfiguration.totalReward' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'referrer'
        }
      },
      {
        $unwind: '$referrer'
      },
      {
        $project: {
          referrerName: { $concat: ['$referrer.firstName', ' ', '$referrer.lastName'] },
          referralCount: 1,
          totalReward: 1
        }
      },
      {
        $sort: { referralCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get referral conversion rates
    const referralConversion = await Referral.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          completedReferrals: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          totalReferrals: 1,
          completedReferrals: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$completedReferrals', '$totalReferrals'] },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        referralStatusAnalytics,
        referralTypeAnalytics,
        topReferrers,
        referralConversion
      }
    });
  } catch (error) {
    logger.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get agency analytics
// @route   GET /api/analytics/agencies
// @access  Private
const getAgencyAnalytics = async(req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get agency analytics
    const agencyAnalytics = await Agency.aggregate([
      {
        $match: { isActive: true, ...dateFilter }
      },
      {
        $project: {
          name: 1,
          'analytics.totalBookings': 1,
          'analytics.totalRevenue': 1,
          'analytics.averageRating': 1,
          providerCount: { $size: '$providers' },
          adminCount: { $size: '$admins' }
        }
      },
      {
        $sort: { 'analytics.totalRevenue': -1 }
      }
    ]);

    // Get agency performance metrics
    const agencyPerformance = await Agency.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $project: {
          name: 1,
          'analytics.totalBookings': 1,
          'analytics.totalRevenue': 1,
          'analytics.averageRating': 1,
          providerCount: { $size: '$providers' },
          revenuePerProvider: {
            $divide: [
              '$analytics.totalRevenue',
              { $size: '$providers' }
            ]
          }
        }
      },
      {
        $sort: { revenuePerProvider: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        agencyAnalytics,
        agencyPerformance
      }
    });
  } catch (error) {
    logger.error('Get agency analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track analytics event
// @route   POST /api/analytics/track
// @access  Private
const trackEvent = async(req, res) => {
  try {
    const { eventType, module, data } = req.body;

    if (!eventType || !module) {
      return res.status(400).json({
        success: false,
        message: 'Event type and module are required'
      });
    }

    const analytics = await AnalyticsEvent.create({
      eventType,
      userId: req.user.id,
      eventData: data,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      data: analytics
    });
  } catch (error) {
    logger.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get custom analytics
// @route   GET /api/analytics/custom
// @access  Private
const getCustomAnalytics = async(req, res) => {
  try {
    const { eventType, module, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (module) filter.module = module;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const analytics = await AnalyticsEvent.find(filter)
      .populate('userId', 'firstName lastName profile.avatar')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: analytics.length,
      data: analytics
    });
  } catch (error) {
    logger.error('Get custom analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAnalyticsOverview,
  getUserAnalytics,
  getMarketplaceAnalytics,
  getJobAnalytics,
  getReferralAnalytics,
  getAgencyAnalytics,
  trackEvent,
  getCustomAnalytics
};
