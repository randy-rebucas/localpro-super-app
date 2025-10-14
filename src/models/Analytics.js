const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  event: {
    type: String,
    required: true,
    enum: [
      'page_view', 'service_search', 'service_view', 'booking_created', 'booking_cancelled',
      'booking_completed', 'review_submitted', 'message_sent', 'verification_started',
      'verification_completed', 'payment_made', 'profile_updated', 'service_created',
      'login', 'logout', 'registration', 'search_filtered', 'location_searched'
    ]
  },
  category: String,
  subcategory: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const serviceAnalyticsSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    views: { type: Number, default: 0 },
    searches: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // in minutes
    conversionRate: { type: Number, default: 0 }, // bookings/views
    completionRate: { type: Number, default: 0 } // completed/bookings
  },
  demographics: {
    ageGroups: {
      '18-24': { type: Number, default: 0 },
      '25-34': { type: Number, default: 0 },
      '35-44': { type: Number, default: 0 },
      '45-54': { type: Number, default: 0 },
      '55+': { type: Number, default: 0 }
    },
    gender: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    locations: [{
      city: String,
      count: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

const userAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    // For clients
    bookingsCreated: { type: Number, default: 0 },
    bookingsCompleted: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageBookingValue: { type: Number, default: 0 },
    reviewsGiven: { type: Number, default: 0 },
    
    // For providers
    servicesListed: { type: Number, default: 0 },
    bookingsReceived: { type: Number, default: 0 },
    bookingsCompleted: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    averageServiceValue: { type: Number, default: 0 },
    reviewsReceived: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    
    // General
    profileViews: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    loginCount: { type: Number, default: 0 },
    sessionDuration: { type: Number, default: 0 } // in minutes
  },
  behavior: {
    mostActiveHour: Number,
    mostActiveDay: String,
    preferredCategories: [String],
    searchTerms: [String],
    deviceTypes: {
      mobile: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

const platformAnalyticsSchema = new mongoose.Schema({
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    totalServices: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageBookingValue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    userRetention: { type: Number, default: 0 },
    churnRate: { type: Number, default: 0 }
  },
  categories: [{
    name: String,
    services: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  }],
  locations: [{
    city: String,
    users: { type: Number, default: 0 },
    services: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }],
  demographics: {
    ageGroups: {
      '18-24': { type: Number, default: 0 },
      '25-34': { type: Number, default: 0 },
      '35-44': { type: Number, default: 0 },
      '45-54': { type: Number, default: 0 },
      '55+': { type: Number, default: 0 }
    },
    gender: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Indexes
analyticsEventSchema.index({ user: 1, event: 1, timestamp: -1 });
analyticsEventSchema.index({ event: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1 });
analyticsEventSchema.index({ timestamp: -1 });

serviceAnalyticsSchema.index({ service: 1, period: 1, date: 1 });
serviceAnalyticsSchema.index({ provider: 1, period: 1, date: 1 });
serviceAnalyticsSchema.index({ date: -1 });

userAnalyticsSchema.index({ user: 1, period: 1, date: 1 });
userAnalyticsSchema.index({ date: -1 });

platformAnalyticsSchema.index({ period: 1, date: 1 });
platformAnalyticsSchema.index({ date: -1 });

module.exports = {
  AnalyticsEvent: mongoose.model('AnalyticsEvent', analyticsEventSchema),
  ServiceAnalytics: mongoose.model('ServiceAnalytics', serviceAnalyticsSchema),
  UserAnalytics: mongoose.model('UserAnalytics', userAnalyticsSchema),
  PlatformAnalytics: mongoose.model('PlatformAnalytics', platformAnalyticsSchema)
};
