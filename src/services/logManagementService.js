const Log = require('../models/Log');
const { logger } = require('../config/logger');

class LogManagementService {
  constructor() {
    this.retentionPolicies = {
      error: 90,      // 90 days for errors
      warn: 30,       // 30 days for warnings
      info: 14,       // 14 days for info logs
      http: 7,        // 7 days for HTTP logs
      debug: 3,       // 3 days for debug logs
      audit: 2555,    // 7 years for audit logs
      error_tracking: 365 // 1 year for error tracking
    };
  }

  // Get comprehensive log statistics
  async getLogStatistics(timeframe = '24h') {
    try {
      const timeframes = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

      const [logStats, errorStats, auditStats, performanceStats] = await Promise.all([
        Log.getLogStats(timeframe),
        Log.getErrorStats(timeframe),
        Log.aggregate([
          {
            $match: {
              category: 'audit',
              timestamp: { $gte: since }
            }
          },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ]),
        Log.getPerformanceStats(timeframe)
      ]);

      return {
        timeframe,
        logs: {
          byLevel: logStats,
          errors: errorStats,
          performance: performanceStats
        },
        audit: {
          byCategory: auditStats
        },
        summary: {
          totalLogs: logStats.reduce((sum, stat) => sum + stat.totalCount, 0),
          totalErrors: errorStats.reduce((sum, stat) => sum + stat.count, 0),
          totalAuditEvents: auditStats.reduce((sum, stat) => sum + stat.count, 0)
        }
      };
    } catch (error) {
      logger.error('Failed to get log statistics', error);
      throw error;
    }
  }

  // Get logs with filtering and pagination
  async getLogs(filters = {}, pagination = {}) {
    try {
      const {
        level,
        category,
        source,
        startDate,
        endDate,
        userId,
        url,
        method,
        statusCode,
        search
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = pagination;

      const query = {};

      if (level) query.level = level;
      if (category) query.category = category;
      if (source) query.source = source;
      if (userId) query['request.userId'] = userId;
      if (url) query['request.url'] = new RegExp(url, 'i');
      if (method) query['request.method'] = method;
      if (statusCode) query['response.statusCode'] = statusCode;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      if (search) {
        query.$or = [
          { message: new RegExp(search, 'i') },
          { 'error.message': new RegExp(search, 'i') },
          { 'request.url': new RegExp(search, 'i') }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        Log.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-request.body -request.headers -metadata')
          .lean(),
        Log.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get logs', error);
      throw error;
    }
  }

  // Get log details
  async getLogDetails(logId) {
    try {
      const log = await Log.findOne({ logId });
      if (!log) {
        throw new Error('Log not found');
      }
      return log;
    } catch (error) {
      logger.error('Failed to get log details', error, { logId });
      throw error;
    }
  }

  // Get error trends
  async getErrorTrends(timeframe = '7d') {
    try {
      const timeframes = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['7d']));

      const trends = await Log.aggregate([
        {
          $match: {
            level: 'error',
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp'
                }
              },
              errorName: '$error.name'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            errors: {
              $push: {
                name: '$_id.errorName',
                count: '$count'
              }
            },
            totalCount: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return trends;
    } catch (error) {
      logger.error('Failed to get error trends', error);
      throw error;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(timeframe = '24h') {
    try {
      const timeframes = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

      const metrics = await Log.aggregate([
        {
          $match: {
            category: 'performance',
            timestamp: { $gte: since },
            'response.responseTime': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$request.url',
            avgResponseTime: { $avg: '$response.responseTime' },
            maxResponseTime: { $max: '$response.responseTime' },
            minResponseTime: { $min: '$response.responseTime' },
            count: { $sum: 1 },
            slowRequests: {
              $sum: {
                $cond: [{ $gt: ['$response.responseTime', 2000] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { avgResponseTime: -1 }
        }
      ]);

      return metrics;
    } catch (error) {
      logger.error('Failed to get performance metrics', error);
      throw error;
    }
  }

  // Get user activity logs
  async getUserActivityLogs(userId, timeframe = '7d') {
    try {
      const timeframes = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['7d']));

      const activity = await Log.aggregate([
        {
          $match: {
            'request.userId': new require('mongoose').Types.ObjectId(userId),
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp'
                }
              },
              url: '$request.url',
              method: '$request.method'
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$response.responseTime' }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            activities: {
              $push: {
                url: '$_id.url',
                method: '$_id.method',
                count: '$count',
                avgResponseTime: '$avgResponseTime'
              }
            },
            totalRequests: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);

      return activity;
    } catch (error) {
      logger.error('Failed to get user activity logs', error);
      throw error;
    }
  }

  // Export logs for analysis
  async exportLogs(filters = {}, format = 'json') {
    try {
      const logs = await this.getLogs(filters, { limit: 10000 });
      
      if (format === 'csv') {
        return this.convertToCSV(logs.logs);
      }
      
      return logs.logs;
    } catch (error) {
      logger.error('Failed to export logs', error);
      throw error;
    }
  }

  // Convert logs to CSV format
  convertToCSV(logs) {
    const headers = [
      'Log ID', 'Timestamp', 'Level', 'Category', 'Source', 'Message',
      'Request Method', 'Request URL', 'Response Status', 'Response Time',
      'Error Name', 'Error Message', 'User ID', 'IP Address'
    ];

    const rows = logs.map(log => [
      log.logId,
      log.timestamp,
      log.level,
      log.category,
      log.source,
      log.message,
      log.request?.method || '',
      log.request?.url || '',
      log.response?.statusCode || '',
      log.response?.responseTime || '',
      log.error?.name || '',
      log.error?.message || '',
      log.request?.userId || '',
      log.request?.ip || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Clean up expired logs
  async cleanupExpiredLogs() {
    try {
      const now = new Date();
      
      const [logCleanup, auditCleanup, errorCleanup] = await Promise.all([
        Log.cleanupExpiredLogs(),
        Log.deleteMany({ 
          category: 'audit',
          retentionDate: { $lt: now } 
        }),
        Log.deleteMany({
          level: 'error',
          timestamp: { $lt: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)) }
        })
      ]);

      const totalDeleted = logCleanup.deletedCount + auditCleanup.deletedCount + errorCleanup.deletedCount;

      logger.info('Log cleanup completed', {
        logCleanup: logCleanup.deletedCount,
        auditCleanup: auditCleanup.deletedCount,
        errorCleanup: errorCleanup.deletedCount,
        totalDeleted
      });

      return {
        logCleanup: logCleanup.deletedCount,
        auditCleanup: auditCleanup.deletedCount,
        errorCleanup: errorCleanup.deletedCount,
        totalDeleted
      };
    } catch (error) {
      logger.error('Failed to cleanup expired logs', error);
      throw error;
    }
  }

  // Get log dashboard summary
  async getLogDashboardSummary() {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const last7d = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      const [
        recentLogs,
        errorCount24h,
        errorCount7d,
        auditCount24h,
        auditCount7d,
        performanceIssues
      ] = await Promise.all([
        Log.find({ timestamp: { $gte: last24h } })
          .sort({ timestamp: -1 })
          .limit(10)
          .select('logId level message timestamp request.url response.statusCode')
          .lean(),
        
        Log.countDocuments({
          level: 'error',
          timestamp: { $gte: last24h }
        }),
        
        Log.countDocuments({
          level: 'error',
          timestamp: { $gte: last7d }
        }),
        
        Log.countDocuments({
          category: 'audit',
          timestamp: { $gte: last24h }
        }),
        
        Log.countDocuments({
          category: 'audit',
          timestamp: { $gte: last7d }
        }),
        
        Log.countDocuments({
          category: 'performance',
          'response.responseTime': { $gt: 2000 },
          timestamp: { $gte: last24h }
        })
      ]);

      return {
        recentLogs,
        statistics: {
          errors24h: errorCount24h,
          errors7d: errorCount7d,
          auditEvents24h: auditCount24h,
          auditEvents7d: auditCount7d,
          performanceIssues24h: performanceIssues
        },
        timestamp: now
      };
    } catch (error) {
      logger.error('Failed to get log dashboard summary', error);
      throw error;
    }
  }

  // Search logs across all collections
  async searchLogs(query, timeframe = '7d') {
    try {
      const timeframes = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['7d']));

      const searchRegex = new RegExp(query, 'i');

      const [logs, auditLogs, errorLogs] = await Promise.all([
        Log.find({
          $or: [
            { message: searchRegex },
            { 'error.message': searchRegex },
            { 'request.url': searchRegex }
          ],
          timestamp: { $gte: since }
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .select('logId level message timestamp source category')
        .lean(),

        Log.find({
          category: 'audit',
          $or: [
            { message: searchRegex },
            { 'metadata.action': searchRegex }
          ],
          timestamp: { $gte: since }
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .select('logId message category timestamp metadata')
        .lean(),

        Log.find({
          level: 'error',
          $or: [
            { message: searchRegex },
            { 'error.name': searchRegex }
          ],
          timestamp: { $gte: since }
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .select('logId message level timestamp error.name error.message')
        .lean()
      ]);

      return {
        logs: logs.map(log => ({ ...log, type: 'log' })),
        auditLogs: auditLogs.map(log => ({ ...log, type: 'audit' })),
        errorLogs: errorLogs.map(log => ({ ...log, type: 'error' })),
        totalResults: logs.length + auditLogs.length + errorLogs.length
      };
    } catch (error) {
      logger.error('Failed to search logs', error);
      throw error;
    }
  }

  // Flush all logs (delete all log entries)
  async flushAllLogs() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Delete all logs from database
      const dbResult = await Log.deleteMany({});
      
      // Delete all log files from both logs directories
      const logsDir = path.join(process.cwd(), 'logs');
      const routesLogsDir = path.join(process.cwd(), 'src', 'routes', 'logs');
      let totalFileCount = 0;
      let logsDirCount = 0;
      let routesLogsDirCount = 0;
      
      // Flush main logs directory
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(logsDir, file);
            fs.unlinkSync(filePath);
            logsDirCount++;
          }
        }
      }

      // Flush src/routes/logs directory
      if (fs.existsSync(routesLogsDir)) {
        const files = fs.readdirSync(routesLogsDir);
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(routesLogsDir, file);
            fs.unlinkSync(filePath);
            routesLogsDirCount++;
          }
        }
      }

      totalFileCount = logsDirCount + routesLogsDirCount;

      // Log the flush operation (this will create a new log entry)
      logger.info('Log flush completed', {
        deletedFromDB: dbResult.deletedCount,
        deletedFiles: totalFileCount,
        logsDirFiles: logsDirCount,
        routesLogsDirFiles: routesLogsDirCount,
        timestamp: new Date().toISOString()
      });

      return {
        deletedFromDB: dbResult.deletedCount,
        deletedFiles: totalFileCount,
        logsDirFiles: logsDirCount,
        routesLogsDirFiles: routesLogsDirCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to flush logs', error);
      throw error;
    }
  }

  // Flush logs by type (database only, file only, or both)
  async flushLogsByType(type = 'all') {
    try {
      const fs = require('fs');
      const path = require('path');
      let result = {
        deletedFromDB: 0,
        deletedFiles: 0,
        logsDirFiles: 0,
        routesLogsDirFiles: 0,
        timestamp: new Date().toISOString()
      };

      if (type === 'all' || type === 'database') {
        const dbResult = await Log.deleteMany({});
        result.deletedFromDB = dbResult.deletedCount;
      }

      if (type === 'all' || type === 'files') {
        const logsDir = path.join(process.cwd(), 'logs');
        const routesLogsDir = path.join(process.cwd(), 'src', 'routes', 'logs');
        let logsDirCount = 0;
        let routesLogsDirCount = 0;
        
        // Flush main logs directory
        if (fs.existsSync(logsDir)) {
          const files = fs.readdirSync(logsDir);
          for (const file of files) {
            if (file.endsWith('.log')) {
              const filePath = path.join(logsDir, file);
              fs.unlinkSync(filePath);
              logsDirCount++;
            }
          }
        }

        // Flush src/routes/logs directory
        if (fs.existsSync(routesLogsDir)) {
          const files = fs.readdirSync(routesLogsDir);
          for (const file of files) {
            if (file.endsWith('.log')) {
              const filePath = path.join(routesLogsDir, file);
              fs.unlinkSync(filePath);
              routesLogsDirCount++;
            }
          }
        }

        result.logsDirFiles = logsDirCount;
        result.routesLogsDirFiles = routesLogsDirCount;
        result.deletedFiles = logsDirCount + routesLogsDirCount;
      }

      // Log the flush operation
      logger.info('Log flush by type completed', {
        type,
        ...result
      });

      return result;
    } catch (error) {
      logger.error('Failed to flush logs by type', error);
      throw error;
    }
  }
}

module.exports = new LogManagementService();
