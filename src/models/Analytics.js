const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'page_view', 'service_view', 'booking_created', 'booking_completed',
      'job_view', 'job_application', 'course_enrollment', 'product_purchase',
      'referral_click', 'referral_completed', 'subscription_upgrade',
      'payment_completed', 'search_performed', 'filter_applied',
      'user_registration', 'user_login', 'profile_update'
    ]
  },
  eventData: {
    // Flexible object to store event-specific data
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    sessionId: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop'
    },
    browser: String,
    os: String,
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
analyticsEventSchema.index({ userId: 1, eventType: 1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: -1 });

// User analytics summary schema
const userAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalBookings: {
      type: Number,
      default: 0
    },
    totalJobsApplied: {
      type: Number,
      default: 0
    },
    totalCoursesEnrolled: {
      type: Number,
      default: 0
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalReferrals: {
      type: Number,
      default: 0
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  },
  engagement: {
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  revenue: {
    totalEarned: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  monthlyStats: [{
    month: String,
    year: Number,
    views: Number,
    bookings: Number,
    revenue: Number,
    sessions: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Service analytics schema
const serviceAnalyticsSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service', // References Service from Marketplace.js
    required: true,
    unique: true
  },
  views: {
    total: {
      type: Number,
      default: 0
    },
    unique: {
      type: Number,
      default: 0
    },
    daily: [{
      date: Date,
      count: Number
    }]
  },
  bookings: {
    total: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    cancelled: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  revenue: {
    total: {
      type: Number,
      default: 0
    },
    average: {
      type: Number,
      default: 0
    },
    monthly: [{
      month: String,
      year: Number,
      amount: Number
    }]
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Platform analytics schema
const platformAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  users: {
    total: {
      type: Number,
      default: 0
    },
    new: {
      type: Number,
      default: 0
    },
    active: {
      type: Number,
      default: 0
    }
  },
  services: {
    total: {
      type: Number,
      default: 0
    },
    new: {
      type: Number,
      default: 0
    },
    active: {
      type: Number,
      default: 0
    }
  },
  bookings: {
    total: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  jobs: {
    total: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    }
  },
  courses: {
    total: {
      type: Number,
      default: 0
    },
    enrollments: {
      type: Number,
      default: 0
    }
  },
  referrals: {
    total: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
// userId already has unique: true which creates an index
// serviceId already has unique: true which creates an index
platformAnalyticsSchema.index({ date: -1 });

// Static methods for analytics
analyticsEventSchema.statics.getUserAnalytics = async function(userId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  const events = await this.find({
    userId: userId,
    timestamp: { $gte: startDate }
  });

  const analytics = {
    totalEvents: events.length,
    eventTypes: {},
    dailyActivity: {},
    topEvents: []
  };

  // Count events by type
  events.forEach(event => {
    analytics.eventTypes[event.eventType] = (analytics.eventTypes[event.eventType] || 0) + 1;
  });

  // Count daily activity
  events.forEach(event => {
    const date = event.timestamp.toISOString().split('T')[0];
    analytics.dailyActivity[date] = (analytics.dailyActivity[date] || 0) + 1;
  });

  // Get top events
  analytics.topEvents = Object.entries(analytics.eventTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([eventType, count]) => ({ eventType, count }));

  return analytics;
};

analyticsEventSchema.statics.getPlatformAnalytics = async function(timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  const events = await this.find({
    timestamp: { $gte: startDate }
  });

  const analytics = {
    totalEvents: events.length,
    uniqueUsers: new Set(events.map(e => e.userId.toString())).size,
    eventTypes: {},
    dailyActivity: {},
    topEvents: []
  };

  // Count events by type
  events.forEach(event => {
    analytics.eventTypes[event.eventType] = (analytics.eventTypes[event.eventType] || 0) + 1;
  });

  // Count daily activity
  events.forEach(event => {
    const date = event.timestamp.toISOString().split('T')[0];
    analytics.dailyActivity[date] = (analytics.dailyActivity[date] || 0) + 1;
  });

  // Get top events
  analytics.topEvents = Object.entries(analytics.eventTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([eventType, count]) => ({ eventType, count }));

  return analytics;
};

module.exports = {
  AnalyticsEvent: mongoose.model('AnalyticsEvent', analyticsEventSchema),
  UserAnalytics: mongoose.model('UserAnalytics', userAnalyticsSchema),
  ServiceAnalytics: mongoose.model('ServiceAnalytics', serviceAnalyticsSchema),
  PlatformAnalytics: mongoose.model('PlatformAnalytics', platformAnalyticsSchema)
};