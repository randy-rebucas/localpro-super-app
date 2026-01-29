// Analytics feature controller (fully migrated)
const { AnalyticsEvent } = require('../../models/Analytics');
const User = require('../../models/User');
const { Service, Booking } = require('../../models/Marketplace');
const Job = require('../../models/Job');
const Referral = require('../../models/Referral');
const Agency = require('../../models/Agency');
const analyticsService = require('../../services/analyticsService');
const { logger } = require('../../utils/logger');

// @desc    Get analytics overview
const getAnalyticsOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalAgencies = await Agency.countDocuments({ isActive: true });
    const totalReferrals = await Referral.countDocuments();
    const userRegistrations = await User.aggregate([
      { $match: dateFilter },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const serviceCategories = await Service.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const jobCategories = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const topProviders = await User.aggregate([
      { $match: { roles: 'provider' } },
      { $lookup: { from: 'services', localField: '_id', foreignField: 'provider', as: 'services' } },
      { $lookup: { from: 'bookings', localField: '_id', foreignField: 'provider', as: 'bookings' } },
      { $project: { firstName: 1, lastName: 1, 'profile.avatar': 1, 'profile.rating': 1, serviceCount: { $size: '$services' }, bookingCount: { $size: '$bookings' } } },
      { $sort: { 'profile.rating': -1, bookingCount: -1 } },
      { $limit: 10 }
    ]);
    const revenueAnalytics = await Booking.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, totalRevenue: { $sum: '$pricing.totalAmount' }, bookingCount: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const referralAnalytics = await Referral.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalReward: { $sum: '$rewardConfiguration.totalReward' } } }
    ]);
    res.status(200).json({
      success: true,
      data: {
        overview: { totalUsers, totalServices, totalJobs, totalAgencies, totalReferrals },
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userAnalytics = await analyticsService.getUserAnalytics(userId);
    res.status(200).json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current user analytics
const getCurrentUserAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userAnalytics = await analyticsService.getUserAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    console.error('Get current user analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get marketplace analytics
const getMarketplaceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }
    const marketplaceAnalytics = await analyticsService.getMarketplaceAnalytics(dateFilter);
    res.status(200).json({
      success: true,
      data: marketplaceAnalytics
    });
  } catch (error) {
    console.error('Get marketplace analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ...other analytics controller methods...

module.exports = {
  getAnalyticsOverview,
  getUserAnalytics,
  getCurrentUserAnalytics,
  getMarketplaceAnalytics
  // ...export other methods as needed...
};
