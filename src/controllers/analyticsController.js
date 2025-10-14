const { AnalyticsEvent, ServiceAnalytics, UserAnalytics, PlatformAnalytics } = require('../models/Analytics');
const User = require('../models/User');
const { Service, Booking } = require('../models/Marketplace');

// @desc    Track analytics event
// @route   POST /api/analytics/track
// @access  Private
const trackEvent = async (req, res) => {
  try {
    const { event, category, subcategory, metadata } = req.body;
    const userId = req.user.id;

    const analyticsEvent = await AnalyticsEvent.create({
      user: userId,
      event: event,
      category: category,
      subcategory: subcategory,
      metadata: metadata,
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      data: analyticsEvent
    });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/analytics/user
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'monthly', startDate, endDate } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user analytics data
    const filter = { user: userId, period: period };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const analytics = await UserAnalytics.find(filter)
      .sort({ date: -1 })
      .limit(12); // Last 12 periods

    // Get recent events
    const recentEvents = await AnalyticsEvent.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(20);

    // Calculate summary metrics
    const summary = {
      totalBookings: 0,
      totalEarned: 0,
      totalSpent: 0,
      averageRating: 0,
      completionRate: 0,
      responseTime: 0
    };

    if (analytics.length > 0) {
      const latest = analytics[0];
      summary.totalBookings = latest.metrics.bookingsCreated + latest.metrics.bookingsReceived;
      summary.totalEarned = latest.metrics.totalEarned;
      summary.totalSpent = latest.metrics.totalSpent;
      summary.averageRating = latest.metrics.averageRating;
      summary.completionRate = latest.metrics.completionRate;
      summary.responseTime = latest.metrics.responseTime;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          role: user.role,
          trustScore: user.trustScore,
          rating: user.profile.rating,
          totalReviews: user.profile.totalReviews
        },
        analytics: analytics,
        recentEvents: recentEvents,
        summary: summary
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

// @desc    Get service analytics
// @route   GET /api/analytics/services/:serviceId
// @access  Private
const getServiceAnalytics = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const userId = req.user.id;
    const { period = 'monthly', startDate, endDate } = req.query;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user owns the service
    if (service.provider.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this service analytics'
      });
    }

    const filter = { service: serviceId, period: period };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const analytics = await ServiceAnalytics.find(filter)
      .sort({ date: -1 })
      .limit(12);

    // Get service events
    const serviceEvents = await AnalyticsEvent.find({
      event: { $in: ['service_view', 'service_search', 'booking_created'] },
      'metadata.serviceId': serviceId
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        service: {
          id: service._id,
          title: service.title,
          category: service.category,
          rating: service.rating
        },
        analytics: analytics,
        events: serviceEvents
      }
    });
  } catch (error) {
    console.error('Get service analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get platform analytics (Admin only)
// @route   GET /api/analytics/platform
// @access  Private (Admin)
const getPlatformAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const filter = { period: period };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const analytics = await PlatformAnalytics.find(filter)
      .sort({ date: -1 })
      .limit(12);

    // Get recent platform events
    const recentEvents = await AnalyticsEvent.find({})
      .sort({ timestamp: -1 })
      .limit(100);

    // Calculate growth metrics
    const growth = {
      userGrowth: 0,
      serviceGrowth: 0,
      bookingGrowth: 0,
      revenueGrowth: 0
    };

    if (analytics.length >= 2) {
      const current = analytics[0];
      const previous = analytics[1];

      growth.userGrowth = ((current.metrics.totalUsers - previous.metrics.totalUsers) / previous.metrics.totalUsers) * 100;
      growth.serviceGrowth = ((current.metrics.totalServices - previous.metrics.totalServices) / previous.metrics.totalServices) * 100;
      growth.bookingGrowth = ((current.metrics.totalBookings - previous.metrics.totalBookings) / previous.metrics.totalBookings) * 100;
      growth.revenueGrowth = ((current.metrics.totalRevenue - previous.metrics.totalRevenue) / previous.metrics.totalRevenue) * 100;
    }

    res.status(200).json({
      success: true,
      data: {
        analytics: analytics,
        recentEvents: recentEvents,
        growth: growth
      }
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get analytics dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let dashboardData = {};

    if (user.role === 'admin') {
      // Admin dashboard
      const totalUsers = await User.countDocuments();
      const totalServices = await Service.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const completedBookings = await Booking.countDocuments({ status: 'completed' });

      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('firstName lastName role createdAt');

      const recentBookings = await Booking.find()
        .populate('service', 'title')
        .populate('client', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

      dashboardData = {
        overview: {
          totalUsers,
          totalServices,
          totalBookings,
          completedBookings,
          completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
        },
        recentUsers,
        recentBookings
      };
    } else if (user.role === 'provider') {
      // Provider dashboard
      const userServices = await Service.find({ provider: userId });
      const userBookings = await Booking.find({ provider: userId });
      const completedBookings = await Booking.find({ provider: userId, status: 'completed' });

      const monthlyEarnings = await Booking.aggregate([
        { $match: { provider: userId, status: 'completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalEarnings: { $sum: '$pricing.totalAmount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ]);

      dashboardData = {
        overview: {
          totalServices: userServices.length,
          totalBookings: userBookings.length,
          completedBookings: completedBookings.length,
          completionRate: userBookings.length > 0 ? (completedBookings.length / userBookings.length) * 100 : 0,
          averageRating: user.profile.rating,
          trustScore: user.trustScore
        },
        monthlyEarnings,
        recentBookings: await Booking.find({ provider: userId })
          .populate('service', 'title')
          .populate('client', 'firstName lastName')
          .sort({ createdAt: -1 })
          .limit(5)
      };
    } else {
      // Client dashboard
      const userBookings = await Booking.find({ client: userId });
      const completedBookings = await Booking.find({ client: userId, status: 'completed' });

      dashboardData = {
        overview: {
          totalBookings: userBookings.length,
          completedBookings: completedBookings.length,
          completionRate: userBookings.length > 0 ? (completedBookings.length / userBookings.length) * 100 : 0
        },
        recentBookings: await Booking.find({ client: userId })
          .populate('service', 'title category')
          .populate('provider', 'firstName lastName')
          .sort({ createdAt: -1 })
          .limit(5)
      };
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  trackEvent,
  getUserAnalytics,
  getServiceAnalytics,
  getPlatformAnalytics,
  getDashboardData
};
