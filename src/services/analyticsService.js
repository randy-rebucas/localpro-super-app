/**
 * Analytics Service
 * 
 * Centralized service for all analytics operations including:
 * - Platform-wide analytics
 * - User analytics
 * - Provider analytics
 * - Financial analytics
 * - Real-time metrics
 * - Trends and comparisons
 */

const mongoose = require('mongoose');
const { AnalyticsEvent } = require('../models/Analytics');
const User = require('../models/User');
const { Service, Booking } = require('../models/Marketplace');
const Job = require('../models/Job');
const Referral = require('../models/Referral');
const Activity = require('../models/Activity');
const { logger } = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.timeframes = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
  }

  /**
   * Get date range filter
   * @param {string} timeframe - Timeframe string
   * @param {string} startDate - Custom start date
   * @param {string} endDate - Custom end date
   * @returns {Object} - Date filter object
   */
  getDateFilter(timeframe, startDate, endDate) {
    if (startDate || endDate) {
      const filter = {};
      if (startDate) filter.$gte = new Date(startDate);
      if (endDate) filter.$lte = new Date(endDate);
      return filter;
    }

    if (timeframe && this.timeframes[timeframe]) {
      return { $gte: new Date(Date.now() - this.timeframes[timeframe]) };
    }

    // Default to 30 days
    return { $gte: new Date(Date.now() - this.timeframes['30d']) };
  }

  /**
   * Get dashboard summary for admin
   * @param {string} timeframe - Timeframe for analytics
   * @returns {Promise<Object>} - Dashboard summary data
   */
  async getDashboardSummary(timeframe = '30d') {
    try {
      const dateFilter = this.getDateFilter(timeframe);
      const previousDateFilter = this.getPreviousPeriodFilter(timeframe);

      const [
        currentPeriod,
        previousPeriod,
        recentActivity,
        topMetrics
      ] = await Promise.all([
        this.getPeriodMetrics(dateFilter),
        this.getPeriodMetrics(previousDateFilter),
        this.getRecentActivity(10),
        this.getTopMetrics(dateFilter)
      ]);

      // Calculate growth percentages
      const growth = this.calculateGrowth(currentPeriod, previousPeriod);

      return {
        summary: {
          ...currentPeriod,
          growth
        },
        recentActivity,
        topMetrics,
        timeframe,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to get dashboard summary', error);
      throw error;
    }
  }

  /**
   * Get period metrics
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Object>} - Period metrics
   */
  async getPeriodMetrics(dateFilter) {
    const [
      userCount,
      newUsers,
      serviceCount,
      newServices,
      bookingCount,
      completedBookings,
      totalRevenue,
      jobCount,
      applicationCount,
      referralCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: dateFilter }),
      Service.countDocuments(),
      Service.countDocuments({ createdAt: dateFilter }),
      Booking.countDocuments({ createdAt: dateFilter }),
      Booking.countDocuments({ status: 'completed', createdAt: dateFilter }),
      Booking.aggregate([
        { $match: { status: 'completed', createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ]),
      Job.countDocuments({ createdAt: dateFilter }),
      Job.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: { $size: '$applications' } } } }
      ]),
      Referral.countDocuments({ createdAt: dateFilter })
    ]);

    return {
      users: {
        total: userCount,
        new: newUsers
      },
      services: {
        total: serviceCount,
        new: newServices
      },
      bookings: {
        total: bookingCount,
        completed: completedBookings,
        completionRate: bookingCount > 0 ? ((completedBookings / bookingCount) * 100).toFixed(1) : 0
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        currency: 'PHP'
      },
      jobs: {
        total: jobCount,
        applications: applicationCount[0]?.total || 0
      },
      referrals: {
        total: referralCount
      }
    };
  }

  /**
   * Get previous period filter for comparison
   * @param {string} timeframe - Timeframe string
   * @returns {Object} - Previous period date filter
   */
  getPreviousPeriodFilter(timeframe) {
    const duration = this.timeframes[timeframe] || this.timeframes['30d'];
    return {
      $gte: new Date(Date.now() - (duration * 2)),
      $lt: new Date(Date.now() - duration)
    };
  }

  /**
   * Calculate growth percentages
   * @param {Object} current - Current period metrics
   * @param {Object} previous - Previous period metrics
   * @returns {Object} - Growth percentages
   */
  calculateGrowth(current, previous) {
    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return (((curr - prev) / prev) * 100).toFixed(1);
    };

    return {
      users: calcGrowth(current.users.new, previous.users.new),
      services: calcGrowth(current.services.new, previous.services.new),
      bookings: calcGrowth(current.bookings.total, previous.bookings.total),
      revenue: calcGrowth(current.revenue.total, previous.revenue.total),
      jobs: calcGrowth(current.jobs.total, previous.jobs.total),
      referrals: calcGrowth(current.referrals.total, previous.referrals.total)
    };
  }

  /**
   * Get recent platform activity
   * @param {number} limit - Number of activities
   * @returns {Promise<Array>} - Recent activities
   */
  async getRecentActivity(limit = 10) {
    try {
      const activities = await Activity.find({
        visibility: 'public',
        isDeleted: false
      })
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        user: activity.user,
        createdAt: activity.createdAt
      }));
    } catch (error) {
      logger.error('Failed to get recent activity', error);
      return [];
    }
  }

  /**
   * Get top metrics
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Object>} - Top metrics
   */
  async getTopMetrics(dateFilter) {
    try {
      const [topProviders, topServices, topCategories] = await Promise.all([
        this.getTopProviders(dateFilter, 5),
        this.getTopServices(dateFilter, 5),
        this.getTopCategories(dateFilter, 5)
      ]);

      return {
        topProviders,
        topServices,
        topCategories
      };
    } catch (error) {
      logger.error('Failed to get top metrics', error);
      return { topProviders: [], topServices: [], topCategories: [] };
    }
  }

  /**
   * Get top providers by bookings/revenue
   * @param {Object} dateFilter - Date filter
   * @param {number} limit - Number of providers
   * @returns {Promise<Array>} - Top providers
   */
  async getTopProviders(dateFilter, limit = 10) {
    return User.aggregate([
      { $match: { roles: 'provider' } },
      {
        $lookup: {
          from: 'bookings',
          let: { providerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$provider', '$$providerId'] },
                status: 'completed',
                createdAt: dateFilter
              }
            }
          ],
          as: 'bookings'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          'profile.avatar': 1,
          'profile.rating': 1,
          bookingCount: { $size: '$bookings' },
          totalRevenue: { $sum: '$bookings.pricing.totalAmount' }
        }
      },
      { $match: { bookingCount: { $gt: 0 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Get top services by bookings
   * @param {Object} dateFilter - Date filter
   * @param {number} limit - Number of services
   * @returns {Promise<Array>} - Top services
   */
  async getTopServices(dateFilter, limit = 10) {
    return Service.aggregate([
      {
        $lookup: {
          from: 'bookings',
          let: { serviceId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$service', '$$serviceId'] },
                createdAt: dateFilter
              }
            }
          ],
          as: 'bookings'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          'pricing.basePrice': 1,
          bookingCount: { $size: '$bookings' },
          totalRevenue: { $sum: '$bookings.pricing.totalAmount' }
        }
      },
      { $match: { bookingCount: { $gt: 0 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Get top categories
   * @param {Object} dateFilter - Date filter
   * @param {number} limit - Number of categories
   * @returns {Promise<Array>} - Top categories
   */
  async getTopCategories(dateFilter, limit = 10) {
    return Service.aggregate([
      {
        $lookup: {
          from: 'bookings',
          let: { serviceId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$service', '$$serviceId'] },
                createdAt: dateFilter
              }
            }
          ],
          as: 'bookings'
        }
      },
      {
        $group: {
          _id: '$category',
          serviceCount: { $sum: 1 },
          bookingCount: { $sum: { $size: '$bookings' } },
          totalRevenue: { $sum: { $sum: '$bookings.pricing.totalAmount' } }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Get time-series data for charts
   * @param {string} metric - Metric to get (users, bookings, revenue, etc.)
   * @param {string} timeframe - Timeframe
   * @param {string} granularity - Granularity (hourly, daily, weekly, monthly)
   * @returns {Promise<Array>} - Time-series data
   */
  async getTimeSeriesData(metric, timeframe = '30d', granularity = 'daily') {
    try {
      const dateFilter = this.getDateFilter(timeframe);
      const groupBy = this.getGroupByFormat(granularity);

      let pipeline;
      let collection;

      switch (metric) {
        case 'users':
          collection = User;
          pipeline = this.buildTimeSeriesPipeline(dateFilter, groupBy, 'createdAt');
          break;
        case 'bookings':
          collection = Booking;
          pipeline = this.buildTimeSeriesPipeline(dateFilter, groupBy, 'createdAt');
          break;
        case 'revenue':
          collection = Booking;
          pipeline = this.buildRevenuePipeline(dateFilter, groupBy);
          break;
        case 'services':
          collection = Service;
          pipeline = this.buildTimeSeriesPipeline(dateFilter, groupBy, 'createdAt');
          break;
        case 'jobs':
          collection = Job;
          pipeline = this.buildTimeSeriesPipeline(dateFilter, groupBy, 'createdAt');
          break;
        default:
          throw new Error(`Unknown metric: ${metric}`);
      }

      const data = await collection.aggregate(pipeline);
      return this.fillMissingDates(data, timeframe, granularity);
    } catch (error) {
      logger.error('Failed to get time series data', error, { metric, timeframe });
      throw error;
    }
  }

  /**
   * Get group by format for aggregation
   * @param {string} granularity - Granularity level
   * @returns {Object} - MongoDB date group format
   */
  getGroupByFormat(granularity) {
    switch (granularity) {
      case 'hourly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
      case 'daily':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
      case 'weekly':
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
      case 'monthly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }

  /**
   * Build time series pipeline
   * @param {Object} dateFilter - Date filter
   * @param {Object} groupBy - Group by format
   * @param {string} dateField - Date field name
   * @returns {Array} - Aggregation pipeline
   */
  buildTimeSeriesPipeline(dateFilter, groupBy, dateField) {
    return [
      { $match: { [dateField]: dateFilter } },
      { $group: { _id: groupBy, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ];
  }

  /**
   * Build revenue pipeline
   * @param {Object} dateFilter - Date filter
   * @param {Object} groupBy - Group by format
   * @returns {Array} - Aggregation pipeline
   */
  buildRevenuePipeline(dateFilter, groupBy) {
    return [
      { $match: { status: 'completed', createdAt: dateFilter } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];
  }

  /**
   * Fill missing dates in time series
   * @param {Array} data - Time series data
   * @param {string} timeframe - Timeframe
   * @param {string} granularity - Granularity
   * @returns {Array} - Filled time series data
   */
  fillMissingDates(data, timeframe, granularity) {
    // Simple implementation - just return the data
    // Can be enhanced to fill gaps with zeros
    return data.map(item => ({
      date: this.formatDate(item._id, granularity),
      count: item.count,
      revenue: item.revenue || 0
    }));
  }

  /**
   * Format date from aggregation result
   * @param {Object} dateObj - Date object from aggregation
   * @param {string} granularity - Granularity
   * @returns {string} - Formatted date string
   */
  formatDate(dateObj, granularity) {
    if (!dateObj) return null;
    
    switch (granularity) {
      case 'hourly':
        return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')} ${String(dateObj.hour).padStart(2, '0')}:00`;
      case 'daily':
        return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
      case 'weekly':
        return `${dateObj.year}-W${String(dateObj.week).padStart(2, '0')}`;
      case 'monthly':
        return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}`;
      default:
        return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
    }
  }

  /**
   * Get provider-specific analytics
   * @param {string} providerId - Provider user ID
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Object>} - Provider analytics
   */
  async getProviderAnalytics(providerId, timeframe = '30d') {
    try {
      const dateFilter = this.getDateFilter(timeframe);
      const previousDateFilter = this.getPreviousPeriodFilter(timeframe);

      const [
        services,
        currentBookings,
        previousBookings,
        reviews,
        revenueData,
        bookingTrends
      ] = await Promise.all([
        Service.find({ provider: providerId }).select('_id title category status'),
        Booking.find({ provider: providerId, createdAt: dateFilter }),
        Booking.find({ provider: providerId, createdAt: previousDateFilter }),
        this.getProviderReviews(providerId, dateFilter),
        this.getProviderRevenue(providerId, dateFilter),
        this.getProviderBookingTrends(providerId, timeframe)
      ]);

      // Calculate metrics
      const completedBookings = currentBookings.filter(b => b.status === 'completed');
      const previousCompleted = previousBookings.filter(b => b.status === 'completed');

      const currentRevenue = completedBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
      const previousRevenue = previousCompleted.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

      return {
        overview: {
          totalServices: services.length,
          activeServices: services.filter(s => s.status === 'active').length,
          totalBookings: currentBookings.length,
          completedBookings: completedBookings.length,
          completionRate: currentBookings.length > 0 
            ? ((completedBookings.length / currentBookings.length) * 100).toFixed(1) 
            : 0,
          totalRevenue: currentRevenue,
          averageOrderValue: completedBookings.length > 0 
            ? (currentRevenue / completedBookings.length).toFixed(2) 
            : 0
        },
        growth: {
          bookings: this.calcSingleGrowth(currentBookings.length, previousBookings.length),
          revenue: this.calcSingleGrowth(currentRevenue, previousRevenue),
          completedBookings: this.calcSingleGrowth(completedBookings.length, previousCompleted.length)
        },
        reviews,
        revenue: revenueData,
        bookingTrends,
        services: services.map(s => ({
          id: s._id,
          title: s.title,
          category: s.category,
          status: s.status
        })),
        timeframe,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to get provider analytics', error, { providerId });
      throw error;
    }
  }

  /**
   * Calculate single growth percentage
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {number} - Growth percentage
   */
  calcSingleGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  }

  /**
   * Get provider reviews summary
   * @param {string} providerId - Provider ID
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Object>} - Reviews summary
   */
  async getProviderReviews(providerId, dateFilter) {
    const reviews = await Booking.aggregate([
      {
        $match: {
          provider: new mongoose.Types.ObjectId(providerId),
          'review.rating': { $exists: true },
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$review.rating' },
          totalReviews: { $sum: 1 },
          distribution: {
            $push: '$review.rating'
          }
        }
      }
    ]);

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews[0].distribution.forEach(r => {
      if (dist[r] !== undefined) dist[r]++;
    });

    return {
      averageRating: parseFloat((reviews[0].averageRating || 0).toFixed(1)),
      totalReviews: reviews[0].totalReviews,
      distribution: dist
    };
  }

  /**
   * Get provider revenue breakdown
   * @param {string} providerId - Provider ID
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Object>} - Revenue breakdown
   */
  async getProviderRevenue(providerId, dateFilter) {
    const revenue = await Booking.aggregate([
      {
        $match: {
          provider: new mongoose.Types.ObjectId(providerId),
          status: 'completed',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return revenue.map(r => ({
      month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
      revenue: r.revenue,
      bookings: r.bookings
    }));
  }

  /**
   * Get provider booking trends
   * @param {string} providerId - Provider ID
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Array>} - Booking trends
   */
  async getProviderBookingTrends(providerId, timeframe) {
    const dateFilter = this.getDateFilter(timeframe);

    const trends = await Booking.aggregate([
      {
        $match: {
          provider: new mongoose.Types.ObjectId(providerId),
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return trends.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      total: t.total,
      completed: t.completed,
      cancelled: t.cancelled
    }));
  }

  /**
   * Get financial analytics
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Object>} - Financial analytics
   */
  async getFinancialAnalytics(timeframe = '30d') {
    try {
      const dateFilter = this.getDateFilter(timeframe);
      const previousDateFilter = this.getPreviousPeriodFilter(timeframe);

      const [
        currentRevenue,
        previousRevenue,
        revenueByCategory,
        revenueByMonth,
        topEarners,
        paymentMethods
      ] = await Promise.all([
        this.getTotalRevenue(dateFilter),
        this.getTotalRevenue(previousDateFilter),
        this.getRevenueByCategory(dateFilter),
        this.getRevenueByMonth(timeframe),
        this.getTopEarners(dateFilter, 10),
        this.getPaymentMethodBreakdown(dateFilter)
      ]);

      return {
        summary: {
          totalRevenue: currentRevenue.total,
          transactionCount: currentRevenue.count,
          averageOrderValue: currentRevenue.count > 0 
            ? (currentRevenue.total / currentRevenue.count).toFixed(2) 
            : 0,
          growth: this.calcSingleGrowth(currentRevenue.total, previousRevenue.total)
        },
        revenueByCategory,
        revenueByMonth,
        topEarners,
        paymentMethods,
        timeframe,
        currency: 'PHP',
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to get financial analytics', error);
      throw error;
    }
  }

  /**
   * Get total revenue
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Object>} - Total revenue
   */
  async getTotalRevenue(dateFilter) {
    const result = await Booking.aggregate([
      { $match: { status: 'completed', createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return result[0] || { total: 0, count: 0 };
  }

  /**
   * Get revenue by category
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Array>} - Revenue by category
   */
  async getRevenueByCategory(dateFilter) {
    return Booking.aggregate([
      { $match: { status: 'completed', createdAt: dateFilter } },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      { $unwind: '$serviceInfo' },
      {
        $group: {
          _id: '$serviceInfo.category',
          revenue: { $sum: '$pricing.totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
  }

  /**
   * Get revenue by month
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Array>} - Revenue by month
   */
  async getRevenueByMonth(timeframe) {
    const dateFilter = this.getDateFilter(timeframe);

    return Booking.aggregate([
      { $match: { status: 'completed', createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).then(results => results.map(r => ({
      month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
      revenue: r.revenue,
      bookings: r.bookings
    })));
  }

  /**
   * Get top earners
   * @param {Object} dateFilter - Date filter
   * @param {number} limit - Number of top earners
   * @returns {Promise<Array>} - Top earners
   */
  async getTopEarners(dateFilter, limit = 10) {
    return Booking.aggregate([
      { $match: { status: 'completed', createdAt: dateFilter } },
      {
        $group: {
          _id: '$provider',
          revenue: { $sum: '$pricing.totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'provider'
        }
      },
      { $unwind: '$provider' },
      {
        $project: {
          revenue: 1,
          bookings: 1,
          provider: {
            firstName: '$provider.firstName',
            lastName: '$provider.lastName',
            avatar: '$provider.profile.avatar'
          }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Get payment method breakdown
   * @param {Object} dateFilter - Date filter
   * @returns {Promise<Array>} - Payment method breakdown
   */
  async getPaymentMethodBreakdown(dateFilter) {
    return Booking.aggregate([
      { $match: { status: 'completed', createdAt: dateFilter } },
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          total: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get real-time metrics
   * @returns {Promise<Object>} - Real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      const [
        activeUsersHour,
        activeUsers15Min,
        bookingsHour,
        revenueHour,
        newUsersHour
      ] = await Promise.all([
        Activity.distinct('user', { createdAt: { $gte: oneHourAgo } }),
        Activity.distinct('user', { createdAt: { $gte: fifteenMinutesAgo } }),
        Booking.countDocuments({ createdAt: { $gte: oneHourAgo } }),
        Booking.aggregate([
          { $match: { status: 'completed', createdAt: { $gte: oneHourAgo } } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]),
        User.countDocuments({ createdAt: { $gte: oneHourAgo } })
      ]);

      return {
        activeUsers: {
          lastHour: activeUsersHour.length,
          last15Minutes: activeUsers15Min.length
        },
        bookings: {
          lastHour: bookingsHour
        },
        revenue: {
          lastHour: revenueHour[0]?.total || 0
        },
        newUsers: {
          lastHour: newUsersHour
        },
        timestamp: now
      };
    } catch (error) {
      logger.error('Failed to get real-time metrics', error);
      throw error;
    }
  }

  /**
   * Track analytics event
   * @param {string} userId - User ID
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Object>} - Created event
   */
  async trackEvent(userId, eventType, eventData = {}, metadata = {}) {
    try {
      const event = await AnalyticsEvent.create({
        userId,
        eventType,
        eventData,
        metadata,
        timestamp: new Date()
      });

      logger.debug('Analytics event tracked', { userId, eventType });
      return event;
    } catch (error) {
      logger.error('Failed to track analytics event', error, { userId, eventType });
      throw error;
    }
  }

  /**
   * Export analytics data
   * @param {string} type - Export type (overview, users, revenue, etc.)
   * @param {string} timeframe - Timeframe
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<Object|string>} - Export data
   */
  async exportAnalytics(type, timeframe = '30d', format = 'json') {
    try {
      let data;

      switch (type) {
        case 'overview':
          data = await this.getDashboardSummary(timeframe);
          break;
        case 'users':
          data = await this.getUserAnalyticsExport(timeframe);
          break;
        case 'revenue':
          data = await this.getFinancialAnalytics(timeframe);
          break;
        case 'bookings':
          data = await this.getBookingsExport(timeframe);
          break;
        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      if (format === 'csv') {
        return this.convertToCSV(data, type);
      }

      return data;
    } catch (error) {
      logger.error('Failed to export analytics', error, { type, timeframe });
      throw error;
    }
  }

  /**
   * Get user analytics export data
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Array>} - User analytics data
   */
  async getUserAnalyticsExport(timeframe) {
    const dateFilter = this.getDateFilter(timeframe);
    
    return User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          roles: 1,
          createdAt: 1,
          isVerified: 1,
          'profile.city': '$profile.address.city'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
  }

  /**
   * Get bookings export data
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Array>} - Bookings data
   */
  async getBookingsExport(timeframe) {
    const dateFilter = this.getDateFilter(timeframe);

    return Booking.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      { $unwind: { path: '$serviceInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          status: 1,
          'pricing.totalAmount': 1,
          'serviceInfo.title': 1,
          'serviceInfo.category': 1,
          createdAt: 1,
          completedAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
  }

  /**
   * Convert data to CSV format
   * @param {Object|Array} data - Data to convert
   * @param {string} type - Data type
   * @returns {string} - CSV string
   */
  convertToCSV(data, type) {
    if (!data) return '';

    let rows = [];
    let headers = [];

    switch (type) {
      case 'users':
        headers = ['First Name', 'Last Name', 'Email', 'Roles', 'City', 'Verified', 'Created At'];
        rows = data.map(u => [
          u.firstName || '',
          u.lastName || '',
          u.email || '',
          (u.roles || []).join(';'),
          u.profile?.city || '',
          u.isVerified ? 'Yes' : 'No',
          u.createdAt?.toISOString() || ''
        ]);
        break;
      case 'bookings':
        headers = ['Service', 'Category', 'Status', 'Amount', 'Created At', 'Completed At'];
        rows = data.map(b => [
          b.serviceInfo?.title || '',
          b.serviceInfo?.category || '',
          b.status || '',
          b.pricing?.totalAmount || 0,
          b.createdAt?.toISOString() || '',
          b.completedAt?.toISOString() || ''
        ]);
        break;
      default:
        return JSON.stringify(data, null, 2);
    }

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

module.exports = new AnalyticsService();

