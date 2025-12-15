const mongoose = require('mongoose');

/**
 * Historical Metrics Schema
 * Stores time-series metrics snapshots for providers
 * Used for trend analysis and period-over-period comparisons
 */
const historicalMetricsSchema = new mongoose.Schema({
  // Provider reference
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true
  },
  
  // Metric period
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly'],
    index: true
  },
  
  // Period start date
  periodStart: {
    type: Date,
    required: true,
    index: true
  },
  
  // Period end date
  periodEnd: {
    type: Date,
    required: true
  },
  
  // Performance metrics
  metrics: {
    // Rating metrics
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: 0
      },
      newReviews: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Job metrics
    jobs: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      completed: {
        type: Number,
        default: 0,
        min: 0
      },
      cancelled: {
        type: Number,
        default: 0,
        min: 0
      },
      pending: {
        type: Number,
        default: 0,
        min: 0
      },
      completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    
    // Response time metrics
    responseTime: {
      average: {
        type: Number,
        default: 0,
        min: 0 // in minutes
      },
      median: {
        type: Number,
        default: 0,
        min: 0
      },
      fastest: {
        type: Number,
        default: 0,
        min: 0
      },
      slowest: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Earnings metrics
    earnings: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      completed: {
        type: Number,
        default: 0,
        min: 0
      },
      pending: {
        type: Number,
        default: 0,
        min: 0
      },
      averagePerJob: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Customer metrics
    customers: {
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      new: {
        type: Number,
        default: 0,
        min: 0
      },
      repeat: {
        type: Number,
        default: 0,
        min: 0
      },
      repeatRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    
    // Service metrics
    services: {
      active: {
        type: Number,
        default: 0,
        min: 0
      },
      views: {
        type: Number,
        default: 0,
        min: 0
      },
      bookings: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  
  // Metadata
  metadata: {
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    dataSource: {
      type: String,
      default: 'automated'
    },
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
historicalMetricsSchema.index({ provider: 1, periodStart: -1 });
historicalMetricsSchema.index({ provider: 1, period: 1, periodStart: -1 });
historicalMetricsSchema.index({ periodStart: -1, period: 1 });

// TTL index - auto-delete metrics older than 2 years
historicalMetricsSchema.index({ periodStart: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

/**
 * Get metrics for a specific period
 */
historicalMetricsSchema.statics.getPeriodMetrics = async function(providerId, periodStart, period) {
  return this.findOne({
    provider: providerId,
    periodStart,
    period
  });
};

/**
 * Get metrics for a date range
 */
historicalMetricsSchema.statics.getMetricsRange = async function(providerId, startDate, endDate, period = 'daily') {
  return this.find({
    provider: providerId,
    period,
    periodStart: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ periodStart: 1 });
};

/**
 * Get latest metrics for a provider
 */
historicalMetricsSchema.statics.getLatestMetrics = async function(providerId, period = 'daily') {
  return this.findOne({
    provider: providerId,
    period
  }).sort({ periodStart: -1 });
};

/**
 * Get previous period metrics for comparison
 */
historicalMetricsSchema.statics.getPreviousPeriodMetrics = async function(providerId, currentPeriodStart, period) {
  // Calculate previous period start based on period type
  let previousStart;
  const currentStart = new Date(currentPeriodStart);
  
  if (period === 'daily') {
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
  } else if (period === 'weekly') {
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
  } else if (period === 'monthly') {
    previousStart = new Date(currentStart);
    previousStart.setMonth(previousStart.getMonth() - 1);
  }
  
  return this.findOne({
    provider: providerId,
    period,
    periodStart: previousStart
  });
};

/**
 * Calculate trend between two periods
 */
historicalMetricsSchema.statics.calculateTrend = function(currentMetrics, previousMetrics, metricPath) {
  if (!currentMetrics || !previousMetrics) {
    return {
      current: 0,
      previous: 0,
      change: 0,
      trend: 'neutral',
      percentageChange: 0
    };
  }
  
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  };
  
  const current = getNestedValue(currentMetrics.metrics, metricPath) || 0;
  const previous = getNestedValue(previousMetrics.metrics, metricPath) || 0;
  
  const change = current - previous;
  const percentageChange = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0);
  
  let trend = 'neutral';
  if (change > 0) trend = 'up';
  else if (change < 0) trend = 'down';
  
  return {
    current,
    previous,
    change,
    trend,
    percentageChange: parseFloat(percentageChange.toFixed(2))
  };
};

const HistoricalMetrics = mongoose.model('HistoricalMetrics', historicalMetricsSchema);

module.exports = HistoricalMetrics;

