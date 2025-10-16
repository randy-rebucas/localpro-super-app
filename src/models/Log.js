const mongoose = require('mongoose');

// Log schema for storing all application logs in database
const logSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  level: {
    type: String,
    required: true,
    enum: ['error', 'warn', 'info', 'http', 'debug']
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['application', 'http', 'error', 'performance', 'business', 'security', 'audit', 'system'],
    default: 'application'
  },
  source: {
    type: String,
    enum: ['winston', 'audit', 'error_monitoring', 'request_logger', 'manual'],
    default: 'winston'
  },
  request: {
    method: String,
    url: String,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    userId: mongoose.Schema.Types.ObjectId
  },
  response: {
    statusCode: Number,
    responseTime: Number,
    success: Boolean
  },
  error: {
    name: String,
    message: String,
    stack: String,
    code: String,
    statusCode: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  environment: {
    type: String,
    default: process.env.NODE_ENV || 'development'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  retentionDate: {
    type: Date,
    default: function() {
      // Default retention based on log level
      const retentionDays = {
        error: 90,    // 90 days for errors
        warn: 30,     // 30 days for warnings
        info: 14,     // 14 days for info logs
        http: 7,      // 7 days for HTTP logs
        debug: 3      // 3 days for debug logs
      };
      const days = retentionDays[this.level] || 14;
      return new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance and querying
logSchema.index({ logId: 1 });
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });
logSchema.index({ source: 1, timestamp: -1 });
logSchema.index({ 'request.userId': 1, timestamp: -1 });
logSchema.index({ 'request.url': 1, timestamp: -1 });
logSchema.index({ 'request.method': 1, timestamp: -1 });
logSchema.index({ 'response.statusCode': 1, timestamp: -1 });
logSchema.index({ 'error.name': 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ retentionDate: 1 });

// TTL index for automatic cleanup
logSchema.index({ retentionDate: 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted timestamp
logSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Static methods for log analysis
logSchema.statics.getLogStats = function(timeframe = '24h') {
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          level: '$level',
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.level',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]);
};

logSchema.statics.getErrorStats = function(timeframe = '24h') {
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

  return this.aggregate([
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
        messages: { $addToSet: '$error.message' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

logSchema.statics.getPerformanceStats = function(timeframe = '24h') {
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

  return this.aggregate([
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
        count: { $sum: 1 }
      }
    },
    {
      $sort: { avgResponseTime: -1 }
    }
  ]);
};

logSchema.statics.cleanupExpiredLogs = function() {
  const now = new Date();
  return this.deleteMany({
    retentionDate: { $lt: now }
  });
};

module.exports = mongoose.model('Log', logSchema);
