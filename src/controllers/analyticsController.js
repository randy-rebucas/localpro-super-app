const { AnalyticsEvent } = require('../models/Analytics');
const User = require('../models/User');
const { Service, Booking } = require('../models/Marketplace');
const Job = require('../models/Job');
const Referral = require('../models/Referral');
const Agency = require('../models/Agency');
const analyticsService = require('../services/analyticsService');
const { logger } = require('../utils/logger');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getAnalyticsOverview = async (req, res) => {
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
        $match: { roles: 'provider' }
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
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private
const getUserAnalytics = async (req, res) => {
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
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get marketplace analytics
// @route   GET /api/analytics/marketplace
// @access  Private
const getMarketplaceAnalytics = async (req, res) => {
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
        $match: { roles: 'provider' }
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
    console.error('Get marketplace analytics error:', error);
    res.status(500).json({
        success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get job board analytics
// @route   GET /api/analytics/jobs
// @access  Private
const getJobAnalytics = async (req, res) => {
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
    console.error('Get job analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get referral analytics
// @route   GET /api/analytics/referrals
// @access  Private
const getReferralAnalytics = async (req, res) => {
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
    console.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get agency analytics
// @route   GET /api/analytics/agencies
// @access  Private
const getAgencyAnalytics = async (req, res) => {
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
    console.error('Get agency analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track analytics event
// @route   POST /api/analytics/track
// @access  Private
const trackEvent = async (req, res) => {
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
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get custom analytics
// @route   GET /api/analytics/custom
// @access  Private
const getCustomAnalytics = async (req, res) => {
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
    console.error('Get custom analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get dashboard analytics summary
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
const getDashboardAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const dashboard = await analyticsService.getDashboardSummary(timeframe);
    
    logger.info('Dashboard analytics retrieved', {
      userId: req.user.id,
      timeframe
    });

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error, {
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics'
    });
  }
};

// @desc    Get provider analytics
// @route   GET /api/analytics/provider
// @access  Private (Provider)
const getProviderAnalytics = async (req, res) => {
  try {
    const providerId = req.params.providerId || req.user.id;
    const { timeframe = '30d' } = req.query;

    // Verify user has permission to view these analytics
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    const isProvider = req.user.hasRole ? req.user.hasRole('provider') : userRoles.includes('provider');
    
    if (!isAdmin && providerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own analytics.'
      });
    }

    if (!isAdmin && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Provider role required.'
      });
    }

    const analytics = await analyticsService.getProviderAnalytics(providerId, timeframe);

    logger.info('Provider analytics retrieved', {
      userId: req.user.id,
      providerId,
      timeframe
    });

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get provider analytics error:', error, {
      userId: req.user?.id,
      providerId: req.params.providerId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider analytics'
    });
  }
};

// @desc    Get financial analytics
// @route   GET /api/analytics/financial
// @access  Private (Admin)
const getFinancialAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const analytics = await analyticsService.getFinancialAnalytics(timeframe);

    logger.info('Financial analytics retrieved', {
      userId: req.user.id,
      timeframe
    });

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get financial analytics error:', error, {
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve financial analytics'
    });
  }
};

// @desc    Get time series data for charts
// @route   GET /api/analytics/time-series
// @access  Private (Admin)
const getTimeSeriesData = async (req, res) => {
  try {
    const { metric = 'bookings', timeframe = '30d', granularity = 'daily' } = req.query;

    const validMetrics = ['users', 'bookings', 'revenue', 'services', 'jobs'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`
      });
    }

    const validGranularities = ['hourly', 'daily', 'weekly', 'monthly'];
    if (!validGranularities.includes(granularity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}`
      });
    }

    const data = await analyticsService.getTimeSeriesData(metric, timeframe, granularity);

    logger.info('Time series data retrieved', {
      userId: req.user.id,
      metric,
      timeframe,
      granularity
    });

    res.status(200).json({
      success: true,
      data: {
        metric,
        timeframe,
        granularity,
        series: data
      }
    });
  } catch (error) {
    logger.error('Get time series data error:', error, {
      userId: req.user?.id,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve time series data'
    });
  }
};

// @desc    Get real-time metrics
// @route   GET /api/analytics/realtime
// @access  Private (Admin)
const getRealTimeMetrics = async (req, res) => {
  try {
    const metrics = await analyticsService.getRealTimeMetrics();

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get real-time metrics error:', error, {
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve real-time metrics'
    });
  }
};

// @desc    Export analytics data
// @route   GET /api/analytics/export
// @access  Private (Admin)
const exportAnalytics = async (req, res) => {
  try {
    const { type = 'overview', timeframe = '30d', format = 'json' } = req.query;

    const validTypes = ['overview', 'users', 'revenue', 'bookings'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid export type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      });
    }

    const exportData = await analyticsService.exportAnalytics(type, timeframe, format);

    logger.info('Analytics exported', {
      userId: req.user.id,
      type,
      timeframe,
      format
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(exportData);
    } else {
      res.status(200).json({
        success: true,
        data: exportData,
        exportInfo: {
          type,
          timeframe,
          format,
          generatedAt: new Date()
        }
      });
    }
  } catch (error) {
    logger.error('Export analytics error:', error, {
      userId: req.user?.id,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics'
    });
  }
};

// @desc    Get comparison analytics (current vs previous period)
// @route   GET /api/analytics/comparison
// @access  Private (Admin)
const getComparisonAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const dashboard = await analyticsService.getDashboardSummary(timeframe);

    logger.info('Comparison analytics retrieved', {
      userId: req.user.id,
      timeframe
    });

    res.status(200).json({
      success: true,
      data: {
        current: dashboard.summary,
        growth: dashboard.summary.growth,
        timeframe,
        comparisonPeriod: `Previous ${timeframe}`
      }
    });
  } catch (error) {
    logger.error('Get comparison analytics error:', error, {
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comparison analytics'
    });
  }
};

// @desc    Get analytics metadata (available metrics, timeframes, etc.)
// @route   GET /api/analytics/metadata
// @access  Private
const getAnalyticsMetadata = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        timeframes: ['1h', '24h', '7d', '30d', '90d', '1y'],
        metrics: ['users', 'bookings', 'revenue', 'services', 'jobs', 'referrals'],
        granularities: ['hourly', 'daily', 'weekly', 'monthly'],
        exportTypes: ['overview', 'users', 'revenue', 'bookings'],
        exportFormats: ['json', 'csv'],
        categories: {
          services: ['cleaning', 'plumbing', 'electrical', 'carpentry', 'painting', 'gardening', 'other'],
          jobs: ['full-time', 'part-time', 'contract', 'freelance']
        }
      }
    });
  } catch (error) {
    logger.error('Get analytics metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics metadata'
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
  getCustomAnalytics,
  getDashboardAnalytics,
  getProviderAnalytics,
  getFinancialAnalytics,
  getTimeSeriesData,
  getRealTimeMetrics,
  exportAnalytics,
  getComparisonAnalytics,
  getAnalyticsMetadata
};