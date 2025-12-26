const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  // General App Settings
  general: {
    appName: {
      type: String,
      default: 'LocalPro Super App'
    },
    appVersion: {
      type: String,
      default: '1.0.0'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    maintenanceMode: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        default: 'The app is currently under maintenance. Please try again later.'
      },
      estimatedEndTime: Date
    },
    forceUpdate: {
      enabled: {
        type: Boolean,
        default: false
      },
      minVersion: {
        type: String,
        default: '1.0.0'
      },
      message: {
        type: String,
        default: 'Please update to the latest version to continue using the app.'
      }
    }
  },

  // Business Settings
  business: {
    companyName: {
      type: String,
      default: 'LocalPro Super App'
    },
    companyEmail: {
      type: String,
      default: 'support@localpro.com'
    },
    companyPhone: {
      type: String,
      default: '+63-XXX-XXX-XXXX'
    },
    companyAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Philippines'
      }
    },
    businessHours: {
      timezone: {
        type: String,
        default: 'Asia/Manila'
      },
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String,
        endTime: String,
        isOpen: {
          type: Boolean,
          default: true
        }
      }]
    },
    supportChannels: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        address: {
          type: String,
          default: 'support@localpro.com'
        }
      },
      phone: {
        enabled: {
          type: Boolean,
          default: true
        },
        number: {
          type: String,
          default: '+63-XXX-XXX-XXXX'
        }
      },
      chat: {
        enabled: {
          type: Boolean,
          default: true
        },
        hours: {
          start: String,
          end: String
        }
      }
    }
  },

  // Feature Flags
  features: {
    marketplace: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewProviders: {
        type: Boolean,
        default: true
      },
      requireVerification: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    academy: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewCourses: {
        type: Boolean,
        default: true
      },
      requireInstructorVerification: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    jobBoard: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewJobs: {
        type: Boolean,
        default: true
      },
      requireCompanyVerification: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    referrals: {
      enabled: {
        type: Boolean,
        default: true
      },
      rewardAmount: {
        type: Number,
        default: 100
      },
      maxReferralsPerUser: {
        type: Number,
        default: 50
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    ads: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewAds: {
        type: Boolean,
        default: true
      },
      requireApproval: {
        type: Boolean,
        default: true
      },
      allowPromotion: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    facilityCare: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewServices: {
        type: Boolean,
        default: true
      },
      allowContracts: {
        type: Boolean,
        default: true
      },
      allowSubscriptions: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    finance: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowWithdrawals: {
        type: Boolean,
        default: true
      },
      allowLoans: {
        type: Boolean,
        default: true
      },
      allowSalaryAdvance: {
        type: Boolean,
        default: true
      },
      minimumWithdrawal: {
        type: Number,
        default: 100
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    supplies: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewProducts: {
        type: Boolean,
        default: true
      },
      allowOrders: {
        type: Boolean,
        default: true
      },
      allowSubscriptions: {
        type: Boolean,
        default: true
      },
      requireSupplierVerification: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    localProPlus: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowSubscriptions: {
        type: Boolean,
        default: true
      },
      allowUpgrades: {
        type: Boolean,
        default: true
      },
      plans: {
        basic: {
          enabled: {
            type: Boolean,
            default: true
          },
          price: {
            type: Number,
            default: 0
          }
        },
        premium: {
          enabled: {
            type: Boolean,
            default: true
          },
          price: {
            type: Number,
            default: 299
          }
        },
        enterprise: {
          enabled: {
            type: Boolean,
            default: true
          },
          price: {
            type: Number,
            default: 999
          }
        }
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    payments: {
      paypal: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      paymaya: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      gcash: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      bankTransfer: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    },
    analytics: {
      enabled: {
        type: Boolean,
        default: true
      },
      trackUserBehavior: {
        type: Boolean,
        default: true
      },
      trackPerformance: {
        type: Boolean,
        default: true
      },
      // Optional metadata
      description: String,
      icon: String,
      color: String,
      services: [String],
      route: String,
      category: String,
      users: Number,
      lastUpdated: String,
      featured: {
        type: Boolean,
        default: false
      }
    }
  },

  // Security Settings
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8,
        min: 6,
        max: 20
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: true
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: 3,
        max: 10
      },
      lockoutDuration: {
        type: Number,
        default: 15, // minutes
        min: 5,
        max: 60
      }
    },
    sessionSettings: {
      maxSessionDuration: {
        type: Number,
        default: 24, // hours
        min: 1,
        max: 168
      },
      allowMultipleSessions: {
        type: Boolean,
        default: true
      },
      maxConcurrentSessions: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
      }
    },
    dataProtection: {
      encryptSensitiveData: {
        type: Boolean,
        default: true
      },
      dataRetentionPeriod: {
        type: Number,
        default: 365, // days
        min: 30,
        max: 2555 // 7 years
      },
      allowDataExport: {
        type: Boolean,
        default: true
      },
      allowDataDeletion: {
        type: Boolean,
        default: true
      }
    }
  },


  // File Upload Settings
  uploads: {
    maxFileSize: {
      type: Number,
      default: 10485760, // 10MB in bytes
      min: 1048576, // 1MB
      max: 104857600 // 100MB
    },
    allowedImageTypes: [{
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }],
    allowedDocumentTypes: [{
      type: String,
      enum: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }],
    maxImagesPerUpload: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    imageCompression: {
      enabled: {
        type: Boolean,
        default: true
      },
      quality: {
        type: Number,
        default: 80,
        min: 10,
        max: 100
      }
    }
  },

  // Notification Settings
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['nodemailer', 'sendgrid', 'mailgun', 'ses'],
        default: 'nodemailer'
      },
      fromEmail: {
        type: String,
        default: 'noreply@localpro.com'
      },
      fromName: {
        type: String,
        default: 'LocalPro Super App'
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['twilio', 'vonage', 'aws_sns'],
        default: 'twilio'
      },
      fromNumber: {
        type: String,
        default: null
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['firebase', 'onesignal', 'pusher'],
        default: 'firebase'
      }
    }
  },

  // Payment Settings
  payments: {
    defaultCurrency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
    },
    supportedCurrencies: [{
      type: String,
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
    }],
    transactionFees: {
      percentage: {
        type: Number,
        default: 2.9,
        min: 0,
        max: 10
      },
      fixed: {
        type: Number,
        default: 0.30,
        min: 0,
        max: 10
      }
    },
    minimumPayout: {
      type: Number,
      default: 100,
      min: 0
    },
    payoutSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday
        default: 1 // Monday
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        default: 1
      }
    }
  },

  // Analytics Settings
  analytics: {
    googleAnalytics: {
      enabled: {
        type: Boolean,
        default: false
      },
      trackingId: String
    },
    mixpanel: {
      enabled: {
        type: Boolean,
        default: false
      },
      projectToken: String
    },
    customAnalytics: {
      enabled: {
        type: Boolean,
        default: true
      },
      retentionPeriod: {
        type: Number,
        default: 365, // days
        min: 30,
        max: 2555
      }
    }
  },

  // Integration Settings
  integrations: {
    googleMaps: {
      enabled: {
        type: Boolean,
        default: true
      },
      apiKey: String,
      defaultZoom: {
        type: Number,
        default: 13,
        min: 1,
        max: 20
      }
    },
    cloudinary: {
      enabled: {
        type: Boolean,
        default: true
      },
      cloudName: String,
      apiKey: String,
      apiSecret: String
    },
    socialLogin: {
      google: {
        enabled: {
          type: Boolean,
          default: false
        },
        clientId: String
      },
      facebook: {
        enabled: {
          type: Boolean,
          default: false
        },
        appId: String
      }
    }
  }
}, {
  timestamps: true
});

// Index for better performance
appSettingsSchema.index({ 'general.environment': 1 });

// Method to get setting by path
appSettingsSchema.methods.getSetting = function(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], this);
};

// Method to set setting by path
appSettingsSchema.methods.setSetting = function(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => {
    if (!obj[key]) obj[key] = {};
    return obj[key];
  }, this);
  target[lastKey] = value;
  return this.save();
};

// Method to update multiple settings
appSettingsSchema.methods.updateSettings = function(updates) {
  Object.keys(updates).forEach(key => {
    if (this[key]) {
      Object.assign(this[key], updates[key]);
    }
  });
  return this.save();
};

// Static method to get current app settings
appSettingsSchema.statics.getCurrentSettings = async function() {
  // Use lean() for faster query and select only needed fields
  let settings = await this.findOne().lean().maxTimeMS(1500); // 1.5 second max query time
  if (!settings) {
    // Create default settings document
    settings = new this();
    await settings.save();
    return settings.toObject(); // Convert to plain object for consistency
  }
  return settings;
};

// Static method to update app settings
appSettingsSchema.statics.updateAppSettings = async function(updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
  }
  return settings.updateSettings(updates);
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
