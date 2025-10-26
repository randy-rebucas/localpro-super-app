const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['identity', 'identity_verification', 'business', 'address', 'bank_account', 'insurance', 'certification'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  documents: [{
    type: {
      type: String,
      enum: [
        'government_id', 'passport', 'driver_license', 'drivers_license', 'business_license',
        'tax_certificate', 'insurance_certificate', 'bank_statement',
        'utility_bill', 'certification_document', 'other'
      ],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    filename: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    ssn: String, // Encrypted
    phoneNumber: String,
    email: String
  },
  businessInfo: {
    businessName: String,
    businessType: String,
    registrationNumber: String,
    taxId: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  addressInfo: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  bankInfo: {
    accountNumber: String, // Encrypted
    routingNumber: String, // Encrypted
    bankName: String,
    accountType: String
  },
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    notes: String,
    rejectionReason: String,
    score: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const disputeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['service_dispute', 'payment_dispute', 'verification_dispute', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  context: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking' // References Booking from Marketplace.js
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job' // References Job from Job.js
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order' // References Order from Supplies.js
    },
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationRequest'
    }
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  evidence: [{
    type: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'other']
    },
    url: String,
    publicId: String,
    filename: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolution: String,
    outcome: {
      type: String,
      enum: ['resolved_in_favor_of_user', 'resolved_in_favor_of_other_party', 'no_fault', 'dismissed']
    },
    compensation: {
      amount: Number,
      currency: String,
      type: {
        type: String,
        enum: ['refund', 'credit', 'service_credit', 'none']
      }
    }
  },
  communication: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const trustScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  components: {
    identity: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      weight: {
        type: Number,
        default: 25
      },
      lastUpdated: Date
    },
    business: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      weight: {
        type: Number,
        default: 20
      },
      lastUpdated: Date
    },
    address: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      weight: {
        type: Number,
        default: 15
      },
      lastUpdated: Date
    },
    bank: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      weight: {
        type: Number,
        default: 15
      },
      lastUpdated: Date
    },
    behavior: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      weight: {
        type: Number,
        default: 25
      },
      lastUpdated: Date
    }
  },
  factors: {
    verificationStatus: {
      identityVerified: { type: Boolean, default: false },
      businessVerified: { type: Boolean, default: false },
      addressVerified: { type: Boolean, default: false },
      bankVerified: { type: Boolean, default: false }
    },
    activityMetrics: {
      totalBookings: { type: Number, default: 0 },
      completedBookings: { type: Number, default: 0 },
      cancelledBookings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 }
    },
    financialMetrics: {
      totalTransactions: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paymentSuccessRate: { type: Number, default: 0 },
      chargebackRate: { type: Number, default: 0 }
    },
    complianceMetrics: {
      disputesFiled: { type: Number, default: 0 },
      disputesResolved: { type: Number, default: 0 },
      policyViolations: { type: Number, default: 0 },
      accountAge: { type: Number, default: 0 } // in days
    }
  },
  badges: [{
    type: {
      type: String,
      enum: ['verified_identity', 'verified_business', 'verified_address', 'verified_bank',
             'top_rated', 'reliable', 'fast_response', 'excellent_service', 'trusted_provider']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  history: [{
    score: Number,
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
verificationRequestSchema.index({ user: 1, type: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ submittedAt: -1 });
verificationRequestSchema.index({ expiresAt: 1 });

disputeSchema.index({ user: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ type: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ createdAt: -1 });

// user already has unique: true which creates an index
trustScoreSchema.index({ overallScore: -1 });
trustScoreSchema.index({ lastCalculated: -1 });

// Method to calculate trust score
trustScoreSchema.methods.calculateScore = function() {
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(this.components).forEach(component => {
    const comp = this.components[component];
    if (comp.score > 0) {
      totalScore += comp.score * comp.weight;
      totalWeight += comp.weight;
    }
  });
  
  this.overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  this.lastCalculated = new Date();
  
  // Add to history
  this.history.push({
    score: this.overallScore,
    reason: 'Automatic calculation',
    timestamp: new Date()
  });
  
  // Keep only last 50 history entries
  if (this.history.length > 50) {
    this.history = this.history.slice(-50);
  }
  
  return this.overallScore;
};

// Method to update component score
trustScoreSchema.methods.updateComponentScore = function(component, score, reason = 'Manual update') {
  if (this.components[component]) {
    this.components[component].score = score;
    this.components[component].lastUpdated = new Date();
    
    // Recalculate overall score
    this.calculateScore();
    
    return this.save();
  }
  throw new Error(`Invalid component: ${component}`);
};

// Method to add badge
trustScoreSchema.methods.addBadge = function(badgeType, description) {
  const existingBadge = this.badges.find(badge => badge.type === badgeType);
  if (!existingBadge) {
    this.badges.push({
      type: badgeType,
      description: description
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove badge
trustScoreSchema.methods.removeBadge = function(badgeType) {
  this.badges = this.badges.filter(badge => badge.type !== badgeType);
  return this.save();
};

// Static method to get user trust score
trustScoreSchema.statics.getUserTrustScore = async function(userId) {
  let trustScore = await this.findOne({ user: userId });
  
  if (!trustScore) {
    trustScore = new this({ user: userId });
    await trustScore.save();
  }
  
  return trustScore;
};

// Static method to update trust score based on activity
trustScoreSchema.statics.updateFromActivity = async function(userId, activityType, data) {
  const trustScore = await this.getUserTrustScore(userId);
  
  switch (activityType) {
    case 'booking_completed':
      trustScore.factors.activityMetrics.completedBookings += 1;
      break;
    case 'booking_cancelled':
      trustScore.factors.activityMetrics.cancelledBookings += 1;
      break;
    case 'review_received':
      const { rating } = data;
      const currentTotal = trustScore.factors.activityMetrics.averageRating * trustScore.factors.activityMetrics.totalReviews;
      trustScore.factors.activityMetrics.totalReviews += 1;
      trustScore.factors.activityMetrics.averageRating = (currentTotal + rating) / trustScore.factors.activityMetrics.totalReviews;
      break;
    case 'payment_completed':
      trustScore.factors.financialMetrics.totalTransactions += 1;
      trustScore.factors.financialMetrics.totalAmount += data.amount || 0;
      break;
    case 'dispute_filed':
      trustScore.factors.complianceMetrics.disputesFiled += 1;
      break;
    case 'dispute_resolved':
      trustScore.factors.complianceMetrics.disputesResolved += 1;
      break;
  }
  
  // Recalculate behavior score based on activity
  const behaviorScore = this.calculateBehaviorScore(trustScore.factors);
  trustScore.updateComponentScore('behavior', behaviorScore, 'Activity-based update');
  
  return trustScore.save();
};

// Static method to calculate behavior score
trustScoreSchema.statics.calculateBehaviorScore = function(factors) {
  let score = 0;
  
  // Completion rate (40% weight)
  const totalBookings = factors.activityMetrics.totalBookings;
  if (totalBookings > 0) {
    const completionRate = factors.activityMetrics.completedBookings / totalBookings;
    score += completionRate * 40;
  }
  
  // Rating score (30% weight)
  score += (factors.activityMetrics.averageRating / 5) * 30;
  
  // Payment success rate (20% weight)
  score += factors.financialMetrics.paymentSuccessRate * 20;
  
  // Dispute resolution rate (10% weight)
  const totalDisputes = factors.complianceMetrics.disputesFiled;
  if (totalDisputes > 0) {
    const resolutionRate = factors.complianceMetrics.disputesResolved / totalDisputes;
    score += resolutionRate * 10;
  }
  
  return Math.round(score);
};

module.exports = {
  VerificationRequest: mongoose.model('VerificationRequest', verificationRequestSchema),
  Dispute: mongoose.model('Dispute', disputeSchema),
  TrustScore: mongoose.model('TrustScore', trustScoreSchema)
};