const logger = require('../config/logger');
const mongoose = require('mongoose');

// Error tracking schema
const errorTrackingSchema = new mongoose.Schema({
  errorId: {
    type: String,
    required: true,
    unique: true
  },
  errorType: {
    type: String,
    required: true,
    enum: ['application', 'database', 'external_api', 'validation', 'authentication', 'authorization', 'rate_limit', 'payment', 'other']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  request: {
    method: String,
    url: String,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String
  },
  user: {
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    role: String
  },
  environment: {
    type: String,
    default: process.env.NODE_ENV || 'development'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  resolvedBy: mongoose.Schema.Types.ObjectId,
  resolution: String,
  occurrences: {
    type: Number,
    default: 1
  },
  firstOccurred: {
    type: Date,
    default: Date.now
  },
  lastOccurred: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
errorTrackingSchema.index({ errorId: 1 });
errorTrackingSchema.index({ errorType: 1, severity: 1 });
errorTrackingSchema.index({ resolved: 1, lastOccurred: -1 });
errorTrackingSchema.index({ 'user.userId': 1 });
errorTrackingSchema.index({ createdAt: -1 });

const ErrorTracking = mongoose.model('ErrorTracking', errorTrackingSchema);

class ErrorMonitoringService {
  constructor() {
    this.errorCounts = new Map();
    this.alertThresholds = {
      critical: 1,
      high: 5,
      medium: 10,
      low: 20
    };
  }

  // Generate unique error ID based on error characteristics
  generateErrorId(error, req = null) {
    const errorSignature = {
      message: error.message,
      stack: error.stack ? error.stack.split('\n')[0] : '',
      url: req ? req.originalUrl : '',
      method: req ? req.method : ''
    };
    
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(JSON.stringify(errorSignature))
      .digest('hex');
  }

  // Determine error severity based on error type and context
  determineSeverity(error, req = null) {
    // Critical errors
    if (error.name === 'MongoError' && error.code === 11000) return 'critical';
    if (error.name === 'ValidationError') return 'high';
    if (error.statusCode >= 500) return 'critical';
    if (error.name === 'JsonWebTokenError') return 'high';
    if (error.name === 'TokenExpiredError') return 'medium';
    
    // High severity
    if (error.statusCode >= 400 && error.statusCode < 500) return 'high';
    if (req && req.originalUrl.includes('/api/payment')) return 'high';
    if (req && req.originalUrl.includes('/api/auth')) return 'high';
    
    // Medium severity
    if (error.statusCode >= 300 && error.statusCode < 400) return 'medium';
    
    // Low severity
    return 'low';
  }

  // Determine error type based on error characteristics
  determineErrorType(error, req = null) {
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'CastError') return 'database';
    if (error.name === 'MongoError') return 'database';
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return 'authentication';
    if (error.statusCode === 403) return 'authorization';
    if (error.statusCode === 429) return 'rate_limit';
    if (req && req.originalUrl.includes('/api/payment')) return 'payment';
    if (req && req.originalUrl.includes('/api/paypal') || req.originalUrl.includes('/api/paymaya')) return 'external_api';
    
    return 'application';
  }

  // Track and log error
  async trackError(error, req = null, additionalInfo = {}) {
    try {
      const errorId = this.generateErrorId(error, req);
      const severity = this.determineSeverity(error, req);
      const errorType = this.determineErrorType(error, req);

      // Log to winston
      logger.logError(error, req, { errorId, severity, errorType, ...additionalInfo });

      // Check if error already exists
      let errorRecord = await ErrorTracking.findOne({ errorId });

      if (errorRecord) {
        // Update existing error record
        errorRecord.occurrences += 1;
        errorRecord.lastOccurred = new Date();
        errorRecord.metadata = { ...errorRecord.metadata, ...additionalInfo };
        await errorRecord.save();
      } else {
        // Create new error record
        const errorData = {
          errorId,
          errorType,
          severity,
          message: error.message,
          stack: error.stack,
          environment: process.env.NODE_ENV || 'development',
          metadata: additionalInfo
        };

        if (req) {
          errorData.request = {
            method: req.method,
            url: req.originalUrl,
            headers: this.sanitizeHeaders(req.headers),
            body: this.sanitizeBody(req.body),
            params: req.params,
            query: req.query,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          };
        }

        if (req && req.user) {
          errorData.user = {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role
          };
        }

        errorRecord = new ErrorTracking(errorData);
        await errorRecord.save();
      }

      // Check for alert thresholds
      await this.checkAlertThresholds(errorRecord);

      return errorRecord;
    } catch (trackingError) {
      // Fallback logging if error tracking fails
      logger.error('Error tracking failed', {
        originalError: error.message,
        trackingError: trackingError.message,
        stack: trackingError.stack
      });
    }
  }

  // Sanitize headers to remove sensitive information
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Sanitize request body to remove sensitive information
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'pin'];
    
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  // Check alert thresholds and send notifications
  async checkAlertThresholds(errorRecord) {
    const { severity, occurrences } = errorRecord;
    const threshold = this.alertThresholds[severity];

    if (occurrences >= threshold) {
      await this.sendAlert(errorRecord);
    }
  }

  // Send alert notification
  async sendAlert(errorRecord) {
    const alertData = {
      errorId: errorRecord.errorId,
      severity: errorRecord.severity,
      errorType: errorRecord.errorType,
      message: errorRecord.message,
      occurrences: errorRecord.occurrences,
      firstOccurred: errorRecord.firstOccurred,
      lastOccurred: errorRecord.lastOccurred,
      environment: errorRecord.environment
    };

    logger.warn('Error Alert Threshold Reached', alertData);

    // Here you can integrate with external alerting services
    // like Slack, Discord, email, or monitoring services like Sentry
    // For now, we'll just log the alert
  }

  // Get error statistics
  async getErrorStats(timeframe = '24h') {
    const timeframes = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - timeframes[timeframe] || timeframes['24h']);

    const stats = await ErrorTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            severity: '$severity',
            errorType: '$errorType'
          },
          count: { $sum: 1 },
          totalOccurrences: { $sum: '$occurrences' }
        }
      },
      {
        $group: {
          _id: '$_id.severity',
          errorTypes: {
            $push: {
              type: '$_id.errorType',
              count: '$count',
              occurrences: '$totalOccurrences'
            }
          },
          totalCount: { $sum: '$count' },
          totalOccurrences: { $sum: '$totalOccurrences' }
        }
      }
    ]);

    return stats;
  }

  // Get unresolved errors
  async getUnresolvedErrors(limit = 50) {
    return await ErrorTracking.find({ resolved: false })
      .sort({ lastOccurred: -1 })
      .limit(limit)
      .select('-stack -request.body -request.headers');
  }

  // Resolve error
  async resolveError(errorId, resolvedBy, resolution) {
    return await ErrorTracking.findOneAndUpdate(
      { errorId },
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolution
      },
      { new: true }
    );
  }

  // Get error details
  async getErrorDetails(errorId) {
    return await ErrorTracking.findOne({ errorId });
  }
}

module.exports = new ErrorMonitoringService();
