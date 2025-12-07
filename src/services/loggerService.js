/**
 * Logger Service
 * 
 * Enhanced logging service providing:
 * - Centralized log management
 * - Request correlation/tracing
 * - Structured logging utilities
 * - Log query and analysis helpers
 * - Runtime log level management
 * - Log metrics and statistics
 */

const Log = require('../models/Log');
const baseLogger = require('../config/logger');

class LoggerService {
  constructor() {
    this.correlationIds = new Map();
    this.logLevelOverrides = new Map();
    this.logMetrics = {
      totalLogs: 0,
      byLevel: { error: 0, warn: 0, info: 0, http: 0, debug: 0 },
      byCategory: {},
      lastReset: new Date()
    };

    // Log levels hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    };

    // Default log level
    this.defaultLevel = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Get or create a correlation ID for request tracing
   * @param {string} requestId - Request ID
   * @returns {string} - Correlation ID
   */
  getCorrelationId(requestId) {
    if (!requestId) {
      return this.generateCorrelationId();
    }

    if (!this.correlationIds.has(requestId)) {
      this.correlationIds.set(requestId, this.generateCorrelationId());
    }

    return this.correlationIds.get(requestId);
  }

  /**
   * Generate a new correlation ID
   * @returns {string} - New correlation ID
   */
  generateCorrelationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
  }

  /**
   * Clean up old correlation IDs
   * @param {number} maxAge - Max age in milliseconds (default: 1 hour)
   */
  cleanupCorrelationIds(maxAge = 3600000) {
    const now = Date.now();
    for (const [key, value] of this.correlationIds.entries()) {
      const timestamp = parseInt(value.split('-')[0], 36);
      if (now - timestamp > maxAge) {
        this.correlationIds.delete(key);
      }
    }
  }

  /**
   * Create a structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Log context
   * @returns {Object} - Structured log entry
   */
  createStructuredLog(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'localpro-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      ...context
    };

    // Add correlation ID if available
    if (context.requestId) {
      entry.correlationId = this.getCorrelationId(context.requestId);
    }

    // Add trace information if available
    if (context.traceId) {
      entry.trace = {
        id: context.traceId,
        parentId: context.parentTraceId,
        spanId: context.spanId
      };
    }

    // Update metrics
    this.updateMetrics(level, context.category);

    return entry;
  }

  /**
   * Update log metrics
   * @param {string} level - Log level
   * @param {string} category - Log category
   */
  updateMetrics(level, category) {
    this.logMetrics.totalLogs++;
    
    if (this.logMetrics.byLevel[level] !== undefined) {
      this.logMetrics.byLevel[level]++;
    }

    if (category) {
      this.logMetrics.byCategory[category] = (this.logMetrics.byCategory[category] || 0) + 1;
    }
  }

  /**
   * Get log metrics
   * @returns {Object} - Log metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.logMetrics.lastReset.getTime();
    return {
      ...this.logMetrics,
      uptime,
      logsPerMinute: (this.logMetrics.totalLogs / (uptime / 60000)).toFixed(2)
    };
  }

  /**
   * Reset log metrics
   */
  resetMetrics() {
    this.logMetrics = {
      totalLogs: 0,
      byLevel: { error: 0, warn: 0, info: 0, http: 0, debug: 0 },
      byCategory: {},
      lastReset: new Date()
    };
  }

  /**
   * Set log level override for a specific module/context
   * @param {string} context - Module/context name
   * @param {string} level - Log level
   */
  setLogLevelOverride(context, level) {
    if (!this.levels[level]) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.logLevelOverrides.set(context, level);
  }

  /**
   * Remove log level override
   * @param {string} context - Module/context name
   */
  removeLogLevelOverride(context) {
    this.logLevelOverrides.delete(context);
  }

  /**
   * Get effective log level for a context
   * @param {string} context - Module/context name
   * @returns {string} - Effective log level
   */
  getEffectiveLogLevel(context) {
    if (context && this.logLevelOverrides.has(context)) {
      return this.logLevelOverrides.get(context);
    }
    return this.defaultLevel;
  }

  /**
   * Check if a message should be logged based on level
   * @param {string} messageLevel - Level of the message
   * @param {string} context - Context/module name
   * @returns {boolean} - Whether to log
   */
  shouldLog(messageLevel, context = null) {
    const effectiveLevel = this.getEffectiveLogLevel(context);
    return this.levels[messageLevel] <= this.levels[effectiveLevel];
  }

  /**
   * Set global default log level
   * @param {string} level - Log level
   */
  setDefaultLogLevel(level) {
    if (!this.levels[level]) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.defaultLevel = level;
  }

  /**
   * Get all log level overrides
   * @returns {Object} - Log level overrides
   */
  getLogLevelOverrides() {
    return Object.fromEntries(this.logLevelOverrides);
  }

  // ==================== Logging Methods ====================

  /**
   * Log with full context
   * @param {string} level - Log level
   * @param {string} message - Message
   * @param {Object} context - Additional context
   */
  log(level, message, context = {}) {
    if (!this.shouldLog(level, context.module)) {
      return;
    }

    const structuredLog = this.createStructuredLog(level, message, context);
    baseLogger[level](message, structuredLog);
  }

  /**
   * Log error with full context
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  error(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      category: 'error'
    };

    if (error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }

    this.log('error', message, errorContext);
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    this.log('warn', message, { ...context, category: context.category || 'warning' });
  }

  /**
   * Log info
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    this.log('info', message, { ...context, category: context.category || 'application' });
  }

  /**
   * Log HTTP request
   * @param {string} message - HTTP message
   * @param {Object} context - Request context
   */
  http(message, context = {}) {
    this.log('http', message, { ...context, category: 'http' });
  }

  /**
   * Log debug
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    this.log('debug', message, { ...context, category: context.category || 'debug' });
  }

  // ==================== Specialized Logging ====================

  /**
   * Log request with correlation
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {number} duration - Request duration
   */
  logRequest(req, res, duration) {
    const correlationId = this.getCorrelationId(req.id);
    
    this.http('HTTP Request', {
      correlationId,
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      contentLength: res.get('Content-Length'),
      referer: req.get('Referer')
    });
  }

  /**
   * Log database operation
   * @param {string} operation - DB operation (find, insert, update, delete)
   * @param {string} collection - Collection name
   * @param {number} duration - Operation duration
   * @param {Object} metadata - Additional metadata
   */
  logDatabaseOp(operation, collection, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : 'debug';
    
    this.log(level, `DB ${operation} on ${collection}`, {
      category: 'database',
      operation,
      collection,
      duration: `${duration}ms`,
      slow: duration > 1000,
      ...metadata
    });
  }

  /**
   * Log external API call
   * @param {string} service - Service name
   * @param {string} endpoint - API endpoint
   * @param {number} statusCode - Response status
   * @param {number} duration - Call duration
   * @param {Object} metadata - Additional metadata
   */
  logExternalApi(service, endpoint, statusCode, duration, metadata = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';

    this.log(level, `External API: ${service}`, {
      category: 'external_api',
      service,
      endpoint,
      statusCode,
      duration: `${duration}ms`,
      success: statusCode < 400,
      ...metadata
    });
  }

  /**
   * Log security event
   * @param {string} event - Security event type
   * @param {Object} context - Event context
   */
  logSecurityEvent(event, context = {}) {
    this.warn(`Security: ${event}`, {
      category: 'security',
      event,
      severity: context.severity || 'medium',
      ...context
    });
  }

  /**
   * Log audit event
   * @param {string} action - Action performed
   * @param {string} userId - User who performed action
   * @param {Object} context - Action context
   */
  logAudit(action, userId, context = {}) {
    this.info(`Audit: ${action}`, {
      category: 'audit',
      action,
      userId,
      ...context
    });
  }

  /**
   * Log business event
   * @param {string} event - Business event name
   * @param {Object} context - Event context
   */
  logBusinessEvent(event, context = {}) {
    this.info(`Business: ${event}`, {
      category: 'business',
      event,
      ...context
    });
  }

  /**
   * Log performance metric
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in ms
   * @param {Object} metadata - Additional metadata
   */
  logPerformance(operation, duration, metadata = {}) {
    const level = duration > 2000 ? 'warn' : (duration > 1000 ? 'info' : 'debug');

    this.log(level, `Performance: ${operation}`, {
      category: 'performance',
      operation,
      duration: `${duration}ms`,
      threshold: duration > 1000 ? 'exceeded' : 'normal',
      ...metadata
    });
  }

  // ==================== Query Methods ====================

  /**
   * Query logs from database
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Query results
   */
  async queryLogs(filters = {}, options = {}) {
    const {
      level,
      category,
      startDate,
      endDate,
      correlationId,
      userId,
      search
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const query = {};

    if (level) query.level = level;
    if (category) query.category = category;
    if (correlationId) query['metadata.correlationId'] = correlationId;
    if (userId) query['request.userId'] = userId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { message: new RegExp(search, 'i') },
        { 'error.message': new RegExp(search, 'i') }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Log.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get logs by correlation ID
   * @param {string} correlationId - Correlation ID
   * @returns {Promise<Array>} - Related logs
   */
  async getLogsByCorrelation(correlationId) {
    return Log.find({ 'metadata.correlationId': correlationId })
      .sort({ timestamp: 1 })
      .lean();
  }

  /**
   * Get error summary
   * @param {string} timeframe - Timeframe (1h, 24h, 7d, 30d)
   * @returns {Promise<Object>} - Error summary
   */
  async getErrorSummary(timeframe = '24h') {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

    const summary = await Log.aggregate([
      {
        $match: {
          level: 'error',
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$error.name',
          count: { $sum: 1 },
          messages: { $addToSet: '$error.message' },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const total = await Log.countDocuments({
      level: 'error',
      timestamp: { $gte: since }
    });

    return {
      timeframe,
      totalErrors: total,
      errorTypes: summary,
      since
    };
  }

  /**
   * Get log statistics
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Object>} - Log statistics
   */
  async getLogStatistics(timeframe = '24h') {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

    const [byLevel, byCategory, byHour] = await Promise.all([
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
      ])
    ]);

    return {
      timeframe,
      byLevel: Object.fromEntries(byLevel.map(l => [l._id, l.count])),
      byCategory: Object.fromEntries(byCategory.map(c => [c._id, c.count])),
      byHour: byHour.map(h => ({
        hour: `${h._id.year}-${String(h._id.month).padStart(2, '0')}-${String(h._id.day).padStart(2, '0')} ${String(h._id.hour).padStart(2, '0')}:00`,
        count: h.count
      })),
      since
    };
  }

  /**
   * Get slow operations
   * @param {number} threshold - Threshold in ms
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Array>} - Slow operations
   */
  async getSlowOperations(threshold = 1000, timeframe = '24h') {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

    return Log.find({
      category: { $in: ['performance', 'database', 'http'] },
      'response.responseTime': { $gte: threshold },
      timestamp: { $gte: since }
    })
      .sort({ 'response.responseTime': -1 })
      .limit(100)
      .lean();
  }

  // ==================== Cleanup Methods ====================

  /**
   * Clean up old logs based on retention policy
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupOldLogs() {
    const result = await Log.deleteMany({
      retentionDate: { $lt: new Date() }
    });

    this.info('Log cleanup completed', {
      category: 'maintenance',
      deletedCount: result.deletedCount
    });

    return {
      deletedCount: result.deletedCount,
      timestamp: new Date()
    };
  }

  /**
   * Archive logs to external storage
   * @param {Date} beforeDate - Archive logs before this date
   * @returns {Promise<Object>} - Archive result
   */
  async archiveLogs(beforeDate) {
    // This would typically export to S3, GCS, or another storage
    // For now, we'll just return the count of logs that would be archived
    const count = await Log.countDocuments({
      timestamp: { $lt: beforeDate }
    });

    this.info('Log archive initiated', {
      category: 'maintenance',
      beforeDate,
      logCount: count
    });

    return {
      logCount: count,
      beforeDate,
      timestamp: new Date()
    };
  }
}

// Create singleton instance
const loggerService = new LoggerService();

// Set up periodic cleanup of correlation IDs
setInterval(() => {
  loggerService.cleanupCorrelationIds();
}, 3600000); // Every hour

module.exports = loggerService;

