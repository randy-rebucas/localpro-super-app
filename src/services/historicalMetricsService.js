/**
 * Historical Metrics Service
 * Collects and stores time-series metrics for providers
 * Used for trend analysis and period-over-period comparisons
 */

const HistoricalMetrics = require('../models/HistoricalMetrics');
const ProviderPerformance = require('../models/ProviderPerformance');
const Provider = require('../models/Provider');
const { Booking } = require('../models/Marketplace');
const { Service } = require('../models/Marketplace');
const logger = require('../config/logger');

class HistoricalMetricsService {
  /**
   * Collect and store daily metrics for a provider
   * @param {string} providerId - Provider ID
   * @param {Date} date - Date to collect metrics for (defaults to yesterday)
   */
  async collectDailyMetrics(providerId, date = null) {
    try {
      // Default to yesterday if no date provided
      if (!date) {
        date = new Date();
        date.setDate(date.getDate() - 1);
      }
      
      // Set to start of day
      const periodStart = new Date(date);
      periodStart.setHours(0, 0, 0, 0);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setHours(23, 59, 59, 999);
      
      // Check if metrics already exist for this period
      const existing = await HistoricalMetrics.getPeriodMetrics(providerId, periodStart, 'daily');
      if (existing) {
        logger.info(`Daily metrics already exist for provider ${providerId} on ${periodStart.toISOString()}`);
        return existing;
      }
      
      // Get provider and performance data
      const [provider, performance] = await Promise.all([
        Provider.findById(providerId),
        ProviderPerformance.findOne({ provider: providerId })
      ]);
      
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`);
      }
      
      // Collect metrics for the period
      const metrics = await this._calculatePeriodMetrics(providerId, periodStart, periodEnd);
      
      // Create historical metrics record
      const historicalMetrics = new HistoricalMetrics({
        provider: providerId,
        period: 'daily',
        periodStart,
        periodEnd,
        metrics: {
          rating: {
            average: performance?.rating || 0,
            totalReviews: performance?.totalReviews || 0,
            newReviews: metrics.newReviews || 0
          },
          jobs: {
            total: metrics.totalJobs || 0,
            completed: metrics.completedJobs || 0,
            cancelled: metrics.cancelledJobs || 0,
            pending: metrics.pendingJobs || 0,
            completionRate: metrics.completionRate || 0
          },
          responseTime: {
            average: metrics.avgResponseTime || performance?.responseTime || 0,
            median: metrics.medianResponseTime || 0,
            fastest: metrics.fastestResponseTime || 0,
            slowest: metrics.slowestResponseTime || 0
          },
          earnings: {
            total: metrics.totalEarnings || 0,
            completed: metrics.completedEarnings || 0,
            pending: metrics.pendingEarnings || 0,
            averagePerJob: metrics.avgEarningsPerJob || 0
          },
          customers: {
            total: metrics.totalCustomers || 0,
            new: metrics.newCustomers || 0,
            repeat: metrics.repeatCustomers || 0,
            repeatRate: metrics.repeatRate || 0
          },
          services: {
            active: metrics.activeServices || 0,
            views: metrics.serviceViews || 0,
            bookings: metrics.serviceBookings || 0
          }
        }
      });
      
      await historicalMetrics.save();
      
      logger.info(`Daily metrics collected for provider ${providerId}`, {
        periodStart: periodStart.toISOString(),
        metrics: {
          jobs: metrics.totalJobs,
          earnings: metrics.totalEarnings,
          rating: performance?.rating
        }
      });
      
      return historicalMetrics;
    } catch (error) {
      logger.error(`Error collecting daily metrics for provider ${providerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate metrics for a specific period
   * @private
   */
  async _calculatePeriodMetrics(providerId, periodStart, periodEnd) {
    try {
      // Get bookings for the period
      const bookings = await Booking.find({
        provider: providerId,
        createdAt: {
          $gte: periodStart,
          $lte: periodEnd
        }
      }).populate('client', '_id');
      
      // Calculate job metrics
      const totalJobs = bookings.length;
      const completedJobs = bookings.filter(b => b.status === 'completed').length;
      const cancelledJobs = bookings.filter(b => b.status === 'cancelled').length;
      const pendingJobs = bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
      
      // Calculate earnings
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
      const pendingEarnings = bookings
        .filter(b => ['pending', 'confirmed'].includes(b.status))
        .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
      const avgEarningsPerJob = completedJobs > 0 ? totalEarnings / completedJobs : 0;
      
      // Calculate customer metrics
      const uniqueClients = new Set(bookings.map(b => b.client?._id?.toString()).filter(Boolean));
      const totalCustomers = uniqueClients.size;
      
      // Get previous period for repeat customer calculation
      const previousPeriodStart = new Date(periodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (periodEnd - periodStart) / (1000 * 60 * 60 * 24));
      const previousPeriodEnd = new Date(periodStart);
      
      const previousBookings = await Booking.find({
        provider: providerId,
        createdAt: {
          $gte: previousPeriodStart,
          $lt: previousPeriodEnd
        }
      }).select('client');
      
      const previousClients = new Set(previousBookings.map(b => b.client?.toString()).filter(Boolean));
      const repeatCustomers = Array.from(uniqueClients).filter(clientId => 
        previousClients.has(clientId)
      ).length;
      const newCustomers = totalCustomers - repeatCustomers;
      const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
      
      // Calculate response times (if available in booking data)
      const responseTimes = bookings
        .map(b => {
          if (b.timeline?.providerRespondedAt && b.timeline?.createdAt) {
            return (new Date(b.timeline.providerRespondedAt) - new Date(b.timeline.createdAt)) / (1000 * 60); // minutes
          }
          return null;
        })
        .filter(Boolean);
      
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
        : 0;
      
      const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
      const medianResponseTime = sortedResponseTimes.length > 0
        ? sortedResponseTimes[Math.floor(sortedResponseTimes.length / 2)]
        : 0;
      const fastestResponseTime = sortedResponseTimes.length > 0 ? sortedResponseTimes[0] : 0;
      const slowestResponseTime = sortedResponseTimes.length > 0 
        ? sortedResponseTimes[sortedResponseTimes.length - 1] 
        : 0;
      
      // Get service metrics
      const services = await Service.find({ provider: providerId, isActive: true });
      const activeServices = services.length;
      
      // Count new reviews (simplified - would need Review model)
      const newReviews = 0; // Placeholder - implement when Review model is available
      
      return {
        totalJobs,
        completedJobs,
        cancelledJobs,
        pendingJobs,
        completionRate,
        totalEarnings,
        completedEarnings: totalEarnings,
        pendingEarnings,
        avgEarningsPerJob,
        totalCustomers,
        newCustomers,
        repeatCustomers,
        repeatRate,
        avgResponseTime,
        medianResponseTime,
        fastestResponseTime,
        slowestResponseTime,
        activeServices,
        serviceViews: 0, // Placeholder
        serviceBookings: totalJobs,
        newReviews
      };
    } catch (error) {
      logger.error('Error calculating period metrics:', error);
      throw error;
    }
  }
  
  /**
   * Collect metrics for all active providers
   * Typically called by a scheduled job
   */
  async collectAllProvidersDailyMetrics(date = null) {
    try {
      const providers = await Provider.find({ 
        status: { $in: ['active', 'verified'] },
        deleted: { $ne: true }
      }).select('_id');
      
      const results = {
        total: providers.length,
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const provider of providers) {
        try {
          await this.collectDailyMetrics(provider._id, date);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            providerId: provider._id,
            error: error.message
          });
          logger.error(`Failed to collect metrics for provider ${provider._id}:`, error);
        }
      }
      
      logger.info('Daily metrics collection completed', results);
      return results;
    } catch (error) {
      logger.error('Error collecting metrics for all providers:', error);
      throw error;
    }
  }
  
  /**
   * Get trend data for a provider
   */
  async getTrendData(providerId, metricPath, period = 'daily', days = 30) {
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      const metrics = await HistoricalMetrics.getMetricsRange(providerId, startDate, endDate, period);
      
      // Extract metric values
      const getNestedValue = (obj, path) => {
        return path.split('.').reduce((o, p) => o && o[p], obj);
      };
      
      return metrics.map(m => ({
        date: m.periodStart,
        value: getNestedValue(m.metrics, metricPath) || 0
      }));
    } catch (error) {
      logger.error('Error getting trend data:', error);
      throw error;
    }
  }
}

module.exports = new HistoricalMetricsService();

