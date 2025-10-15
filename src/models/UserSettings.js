const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'contacts_only', 'private'],
      default: 'public'
    },
    showPhoneNumber: {
      type: Boolean,
      default: false
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    showRating: {
      type: Boolean,
      default: true
    },
    showPortfolio: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    allowJobInvitations: {
      type: Boolean,
      default: true
    },
    allowReferralRequests: {
      type: Boolean,
      default: true
    }
  },

  // Notification Settings
  notifications: {
    // Push Notifications
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      },
      jobMatches: {
        type: Boolean,
        default: true
      },
      bookingUpdates: {
        type: Boolean,
        default: true
      },
      paymentUpdates: {
        type: Boolean,
        default: true
      },
      referralUpdates: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    
    // Email Notifications
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      },
      jobMatches: {
        type: Boolean,
        default: true
      },
      bookingUpdates: {
        type: Boolean,
        default: true
      },
      paymentUpdates: {
        type: Boolean,
        default: true
      },
      referralUpdates: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      },
      weeklyDigest: {
        type: Boolean,
        default: true
      },
      monthlyReport: {
        type: Boolean,
        default: true
      }
    },
    
    // SMS Notifications
    sms: {
      enabled: {
        type: Boolean,
        default: true
      },
      urgentMessages: {
        type: Boolean,
        default: true
      },
      bookingReminders: {
        type: Boolean,
        default: true
      },
      paymentAlerts: {
        type: Boolean,
        default: true
      },
      securityAlerts: {
        type: Boolean,
        default: true
      }
    }
  },

  // Communication Preferences
  communication: {
    preferredLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'fil', 'es', 'zh', 'ja', 'ko']
    },
    timezone: {
      type: String,
      default: 'Asia/Manila'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    timeFormat: {
      type: String,
      default: '12h',
      enum: ['12h', '24h']
    },
    currency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
    },
    autoReply: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        default: 'Thank you for your message. I will get back to you soon.'
      }
    }
  },

  // Service Preferences
  service: {
    defaultServiceRadius: {
      type: Number,
      default: 25, // in kilometers
      min: 1,
      max: 100
    },
    autoAcceptJobs: {
      type: Boolean,
      default: false
    },
    minimumJobValue: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumJobValue: {
      type: Number,
      default: 100000,
      min: 0
    },
    preferredJobTypes: [{
      type: String,
      enum: ['cleaning', 'maintenance', 'repair', 'installation', 'consultation', 'other']
    }],
    workingHours: {
      start: {
        type: String,
        default: '08:00'
      },
      end: {
        type: String,
        default: '17:00'
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    emergencyService: {
      enabled: {
        type: Boolean,
        default: false
      },
      surcharge: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },

  // Payment Preferences
  payment: {
    preferredPaymentMethod: {
      type: String,
      enum: ['paypal', 'paymaya', 'gcash', 'bank_transfer', 'cash'],
      default: 'paypal'
    },
    autoWithdraw: {
      enabled: {
        type: Boolean,
        default: false
      },
      threshold: {
        type: Number,
        default: 1000,
        min: 0
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      }
    },
    invoiceSettings: {
      includeTax: {
        type: Boolean,
        default: true
      },
      taxRate: {
        type: Number,
        default: 12,
        min: 0,
        max: 100
      },
      invoiceTemplate: {
        type: String,
        default: 'standard',
        enum: ['standard', 'detailed', 'minimal']
      }
    }
  },

  // Security Settings
  security: {
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ['sms', 'email', 'authenticator'],
        default: 'sms'
      }
    },
    loginAlerts: {
      enabled: {
        type: Boolean,
        default: true
      },
      newDevice: {
        type: Boolean,
        default: true
      },
      suspiciousActivity: {
        type: Boolean,
        default: true
      }
    },
    sessionTimeout: {
      type: Number,
      default: 24, // hours
      min: 1,
      max: 168
    },
    passwordChangeReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: Number,
        default: 90, // days
        min: 30,
        max: 365
      }
    }
  },

  // App Preferences
  app: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    soundEffects: {
      enabled: {
        type: Boolean,
        default: true
      },
      volume: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      }
    },
    hapticFeedback: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    autoSave: {
      enabled: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 30, // seconds
        min: 10,
        max: 300
      }
    },
    dataUsage: {
      imageQuality: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      videoQuality: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      autoDownload: {
        type: Boolean,
        default: false
      }
    }
  },

  // Analytics and Tracking
  analytics: {
    shareUsageData: {
      type: Boolean,
      default: true
    },
    shareLocationData: {
      type: Boolean,
      default: true
    },
    sharePerformanceData: {
      type: Boolean,
      default: true
    },
    personalizedRecommendations: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for better performance
userSettingsSchema.index({ userId: 1 });

// Method to get default settings
userSettingsSchema.statics.getDefaultSettings = function() {
  return {
    privacy: {
      profileVisibility: 'public',
      showPhoneNumber: false,
      showEmail: false,
      showLocation: true,
      showRating: true,
      showPortfolio: true,
      allowDirectMessages: true,
      allowJobInvitations: true,
      allowReferralRequests: true
    },
    notifications: {
      push: {
        enabled: true,
        newMessages: true,
        jobMatches: true,
        bookingUpdates: true,
        paymentUpdates: true,
        referralUpdates: true,
        systemUpdates: true,
        marketing: false
      },
      email: {
        enabled: true,
        newMessages: true,
        jobMatches: true,
        bookingUpdates: true,
        paymentUpdates: true,
        referralUpdates: true,
        systemUpdates: true,
        marketing: false,
        weeklyDigest: true,
        monthlyReport: true
      },
      sms: {
        enabled: true,
        urgentMessages: true,
        bookingReminders: true,
        paymentAlerts: true,
        securityAlerts: true
      }
    },
    communication: {
      preferredLanguage: 'en',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'PHP',
      autoReply: {
        enabled: false,
        message: 'Thank you for your message. I will get back to you soon.'
      }
    },
    service: {
      defaultServiceRadius: 25,
      autoAcceptJobs: false,
      minimumJobValue: 0,
      maximumJobValue: 100000,
      preferredJobTypes: [],
      workingHours: {
        start: '08:00',
        end: '17:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      emergencyService: {
        enabled: false,
        surcharge: 0
      }
    },
    payment: {
      preferredPaymentMethod: 'paypal',
      autoWithdraw: {
        enabled: false,
        threshold: 1000,
        frequency: 'weekly'
      },
      invoiceSettings: {
        includeTax: true,
        taxRate: 12,
        invoiceTemplate: 'standard'
      }
    },
    security: {
      twoFactorAuth: {
        enabled: false,
        method: 'sms'
      },
      loginAlerts: {
        enabled: true,
        newDevice: true,
        suspiciousActivity: true
      },
      sessionTimeout: 24,
      passwordChangeReminder: {
        enabled: true,
        frequency: 90
      }
    },
    app: {
      theme: 'auto',
      fontSize: 'medium',
      soundEffects: {
        enabled: true,
        volume: 50
      },
      hapticFeedback: {
        enabled: true
      },
      autoSave: {
        enabled: true,
        interval: 30
      },
      dataUsage: {
        imageQuality: 'medium',
        videoQuality: 'medium',
        autoDownload: false
      }
    },
    analytics: {
      shareUsageData: true,
      shareLocationData: true,
      sharePerformanceData: true,
      personalizedRecommendations: true
    }
  };
};

// Method to update specific setting category
userSettingsSchema.methods.updateCategory = function(category, updates) {
  if (this[category]) {
    Object.assign(this[category], updates);
  }
  return this.save();
};

// Method to reset to defaults
userSettingsSchema.methods.resetToDefaults = function() {
  const defaults = this.constructor.getDefaultSettings();
  Object.assign(this, defaults);
  return this.save();
};

module.exports = mongoose.model('UserSettings', userSettingsSchema);
