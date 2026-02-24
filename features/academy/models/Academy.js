const mongoose = require('mongoose');

// ============================================
// CONSTANTS
// ============================================

const VALID_COURSE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const VALID_LESSON_TYPES = ['video', 'text', 'quiz', 'practical', 'assignment', 'live'];
const VALID_CONTENT_TYPES = ['video', 'document', 'image', 'text', 'audio', 'pdf', 'presentation'];
const VALID_SESSION_TYPES = ['live', 'recorded', 'practical', 'webinar', 'workshop'];
const VALID_ENROLLMENT_STATUSES = ['enrolled', 'in_progress', 'completed', 'dropped', 'suspended', 'expired'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed', 'partial'];
const VALID_COURSE_STATUSES = ['draft', 'pending_review', 'published', 'archived', 'rejected'];
const VALID_REQUIREMENT_TYPES = ['course_completion', 'exam', 'practical', 'experience', 'assignment', 'project'];
const VALID_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'tl', 'fil'];
const VALID_CURRENCIES = ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD'];

// ============================================
// ACADEMY CATEGORY SCHEMA
// ============================================

const academyCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: String,
  image: {
    url: String,
    publicId: String
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademyCategory',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  courseCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate slug before saving
academyCategorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

academyCategorySchema.index({ isActive: 1 });
academyCategorySchema.index({ slug: 1 });
academyCategorySchema.index({ parentCategory: 1 });
academyCategorySchema.index({ isFeatured: 1, isActive: 1 });
academyCategorySchema.index({ order: 1 });

// ============================================
// COURSE SCHEMA
// ============================================

const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademyCategory',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademyCategory'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coInstructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner'
  },

  // Course Details
  level: {
    type: String,
    enum: VALID_COURSE_LEVELS,
    required: true
  },
  language: {
    type: String,
    enum: VALID_LANGUAGES,
    default: 'en'
  },
  subtitles: [{
    type: String,
    enum: VALID_LANGUAGES
  }],
  duration: {
    hours: {
      type: Number,
      required: true
    },
    weeks: Number,
    estimatedCompletionDays: Number
  },

  // Pricing & Discounts
  pricing: {
    regularPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountedPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      enum: VALID_CURRENCIES,
      default: 'PHP'
    },
    isFree: {
      type: Boolean,
      default: false
    },
    discountPercentage: Number,
    discountValidUntil: Date
  },

  // Coupons & Promotions
  coupons: [{
    code: {
      type: String,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: Number,
    maxUses: Number,
    usedCount: {
      type: Number,
      default: 0
    },
    validFrom: Date,
    validUntil: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    minPurchaseAmount: Number,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Curriculum
  curriculum: [{
    module: {
      type: String,
      required: true
    },
    moduleDescription: String,
    order: {
      type: Number,
      default: 0
    },
    lessons: [{
      title: String,
      description: String,
      duration: Number, // in minutes
      order: {
        type: Number,
        default: 0
      },
      type: {
        type: String,
        enum: VALID_LESSON_TYPES,
        default: 'video'
      },
      content: {
        url: String,
        publicId: String,
        type: {
          type: String,
          enum: VALID_CONTENT_TYPES
        },
        transcript: String,
        captions: [{
          language: String,
          url: String
        }]
      },
      resources: [{
        title: String,
        type: String,
        url: String,
        publicId: String,
        size: Number,
        downloadable: {
          type: Boolean,
          default: true
        }
      }],
      quiz: {
        questions: [{
          question: String,
          type: {
            type: String,
            enum: ['multiple_choice', 'true_false', 'fill_blank', 'essay'],
            default: 'multiple_choice'
          },
          options: [String],
          correctAnswer: mongoose.Schema.Types.Mixed,
          explanation: String,
          points: {
            type: Number,
            default: 1
          }
        }],
        passingScore: {
          type: Number,
          default: 70
        },
        timeLimit: Number, // in minutes
        allowRetakes: {
          type: Boolean,
          default: true
        },
        maxRetakes: Number
      },
      isFree: { type: Boolean, default: false },
      isPreview: { type: Boolean, default: false },
      isLocked: { type: Boolean, default: false },
      unlockDate: Date
    }]
  }],

  // Requirements & Outcomes
  prerequisites: [String],
  requirements: [String],
  targetAudience: [String],
  learningOutcomes: [String],
  skills: [String],

  // Certification
  certification: {
    isAvailable: { type: Boolean, default: false },
    name: String,
    issuer: String,
    validity: Number, // in months
    requirements: [String],
    template: {
      url: String,
      publicId: String
    },
    accreditation: String,
    credentialId: String
  },

  // Enrollment Settings
  enrollment: {
    current: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    maxCapacity: Number,
    isOpen: { type: Boolean, default: true },
    autoEnroll: { type: Boolean, default: false },
    waitlistEnabled: { type: Boolean, default: false },
    waitlistCount: { type: Number, default: 0 },
    enrollmentDeadline: Date,
    accessDuration: Number, // in days, null = lifetime
    allowLateEnrollment: { type: Boolean, default: true }
  },

  // Schedule (for scheduled/cohort courses)
  schedule: {
    type: {
      type: String,
      enum: ['self_paced', 'scheduled', 'cohort', 'live'],
      default: 'self_paced'
    },
    startDate: Date,
    endDate: Date,
    timezone: String,
    sessions: [{
      title: String,
      description: String,
      date: Date,
      startTime: String,
      endTime: String,
      type: {
        type: String,
        enum: VALID_SESSION_TYPES,
        default: 'live'
      },
      meetingUrl: String,
      meetingId: String,
      recordingUrl: String,
      isRecorded: { type: Boolean, default: false }
    }],
    recurrence: {
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom']
      },
      days: [Number], // 0-6 for Sunday-Saturday
      time: String,
      exceptions: [Date]
    }
  },

  // Reviews & Ratings
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: String,
    comment: String,
    pros: [String],
    cons: [String],
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    response: {
      text: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      respondedAt: Date
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],

  // Discussion/Q&A
  discussions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lessonId: String,
    title: String,
    content: {
      type: String,
      required: true
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      isInstructorReply: {
        type: Boolean,
        default: false
      },
      isAcceptedAnswer: {
        type: Boolean,
        default: false
      },
      upvotes: {
        type: Number,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [String],
    upvotes: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Announcements
  announcements: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    sendEmail: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Favorites
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  favoritesCount: {
    type: Number,
    default: 0
  },

  // Analytics & Metrics
  views: {
    type: Number,
    default: 0
  },
  uniqueViews: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  averageCompletionTime: Number, // in hours

  // SEO
  seo: {
    metaTitle: {
      type: String,
      maxlength: 70
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    keywords: [String],
    canonicalUrl: String,
    ogImage: {
      url: String,
      publicId: String
    }
  },

  // Media
  thumbnail: {
    url: String,
    publicId: String,
    thumbnail: String
  },
  previewVideo: {
    url: String,
    publicId: String,
    duration: Number
  },
  videos: [{
    title: String,
    url: String,
    publicId: String,
    duration: Number,
    order: Number
  }],

  // Status & Visibility
  status: {
    type: String,
    enum: VALID_COURSE_STATUSES,
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredOrder: Number,
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionEndDate: Date,
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted', 'password_protected'],
    default: 'public'
  },
  accessPassword: {
    type: String,
    select: false
  },

  // Publishing
  publishedAt: Date,
  lastPublishedAt: Date,
  submittedForReviewAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,

  // External Integrations
  externalIds: [{
    system: String,
    externalId: String,
    metadata: mongoose.Schema.Types.Mixed,
    syncedAt: Date
  }],

  // Tags & Classification
  tags: [String],

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    changes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: Date
  }]
}, {
  timestamps: true
});

// Generate slug before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
  next();
});

// ============================================
// ENROLLMENT SCHEMA
// ============================================

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: VALID_ENROLLMENT_STATUSES,
    default: 'enrolled'
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],

  // Progress Tracking
  progress: {
    completedLessons: [{
      moduleIndex: Number,
      lessonIndex: Number,
      lessonId: String,
      completedAt: Date,
      timeSpent: Number // in seconds
    }],
    completedModules: [{
      moduleIndex: Number,
      completedAt: Date
    }],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAccessedLesson: {
      moduleIndex: Number,
      lessonIndex: Number,
      lessonId: String
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in seconds
    }
  },

  // Quiz/Assessment Results
  quizResults: [{
    lessonId: String,
    attemptNumber: Number,
    score: Number,
    totalPoints: Number,
    percentage: Number,
    passed: Boolean,
    answers: [{
      questionIndex: Number,
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      pointsEarned: Number
    }],
    startedAt: Date,
    completedAt: Date,
    timeSpent: Number // in seconds
  }],

  // Assignment Submissions
  assignments: [{
    lessonId: String,
    submissionUrl: String,
    submissionText: String,
    attachments: [{
      name: String,
      url: String,
      publicId: String,
      type: String,
      size: Number
    }],
    submittedAt: Date,
    grade: Number,
    maxGrade: Number,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded', 'returned'],
      default: 'pending'
    }
  }],

  // Notes
  notes: [{
    lessonId: String,
    content: String,
    timestamp: Number, // video timestamp in seconds
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],

  // Bookmarks
  bookmarks: [{
    lessonId: String,
    moduleIndex: Number,
    lessonIndex: Number,
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Payment
  payment: {
    amount: Number,
    originalAmount: Number,
    discountAmount: Number,
    currency: {
      type: String,
      enum: VALID_CURRENCIES,
      default: 'PHP'
    },
    status: {
      type: String,
      enum: VALID_PAYMENT_STATUSES,
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'gcash', 'maya', 'bank_transfer', 'wallet', 'free']
    },
    transactionId: String,
    paymentGateway: String,
    couponCode: String,
    couponDiscount: Number,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    invoiceNumber: String,
    invoiceUrl: String,
    receiptUrl: String
  },

  // Certificate
  certificate: {
    issued: { type: Boolean, default: false },
    issuedAt: Date,
    certificateId: String,
    certificateNumber: String,
    downloadUrl: String,
    publicId: String,
    expiresAt: Date,
    verificationUrl: String,
    credentials: {
      name: String,
      issuer: String,
      issueDate: Date,
      credentialId: String
    }
  },

  // Access Control
  accessExpires: Date,
  accessExtensions: [{
    extendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    extendedAt: Date,
    previousExpiry: Date,
    newExpiry: Date,
    reason: String
  }],

  // Completion
  completedAt: Date,
  completionCriteria: {
    lessonsCompleted: Boolean,
    quizzesPassed: Boolean,
    assignmentsSubmitted: Boolean,
    minimumTimeSpent: Boolean
  },

  // Engagement
  lastAccessedAt: Date,
  accessCount: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastStreakDate: Date,

  // Source & Attribution
  enrollmentSource: {
    type: String,
    enum: ['direct', 'referral', 'affiliate', 'promotion', 'gift', 'corporate', 'bundle'],
    default: 'direct'
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  affiliateCode: String,
  giftedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  giftMessage: String,

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Generate enrollment number
enrollmentSchema.pre('save', async function(next) {
  if (!this.enrollmentNumber) {
    const date = new Date();
    const prefix = 'ENR';
    const timestamp = date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.enrollmentNumber = `${prefix}${timestamp}${random}`;
  }
  next();
});

// ============================================
// CERTIFICATION SCHEMA
// ============================================

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  issuer: {
    type: String,
    required: true
  },
  issuerLogo: {
    url: String,
    publicId: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademyCategory'
  },
  categoryName: String,
  level: {
    type: String,
    enum: ['foundation', 'associate', 'professional', 'expert', 'master'],
    default: 'foundation'
  },

  // Prerequisites
  prerequisites: [{
    type: {
      type: String,
      enum: ['certification', 'course', 'experience', 'other']
    },
    certificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certification'
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    description: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],

  // Requirements
  requirements: [{
    type: {
      type: String,
      enum: VALID_REQUIREMENT_TYPES,
      required: true
    },
    description: String,
    value: String, // e.g., "80%" for exam, "2 years" for experience
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    weight: {
      type: Number,
      default: 1
    }
  }],

  // Required Courses
  requiredCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],

  // Validity & Renewal
  validity: {
    duration: Number, // in months, null = lifetime
    renewable: { type: Boolean, default: true },
    renewalRequirements: [String],
    renewalFee: Number,
    renewalCurrency: {
      type: String,
      enum: VALID_CURRENCIES,
      default: 'PHP'
    },
    gracePeriod: Number // in days
  },

  // Exam Configuration
  exam: {
    isRequired: { type: Boolean, default: true },
    title: String,
    description: String,
    duration: Number, // in minutes
    passingScore: Number, // percentage
    maxAttempts: {
      type: Number,
      default: 3
    },
    retakeWaitPeriod: Number, // in days
    retakeFee: Number,
    questionPool: [{
      question: String,
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'fill_blank', 'essay', 'matching'],
        default: 'multiple_choice'
      },
      options: [String],
      correctAnswer: mongoose.Schema.Types.Mixed,
      explanation: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      },
      points: {
        type: Number,
        default: 1
      },
      category: String,
      tags: [String]
    }],
    questionsPerExam: Number,
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    randomizeOptions: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    proctored: {
      type: Boolean,
      default: false
    }
  },

  // Practical Assessment
  practicalAssessment: {
    isRequired: { type: Boolean, default: false },
    description: String,
    submissionType: {
      type: String,
      enum: ['file_upload', 'url', 'live_demo', 'portfolio']
    },
    rubric: [{
      criterion: String,
      description: String,
      maxPoints: Number
    }],
    passingScore: Number
  },

  // Pricing
  pricing: {
    examFee: Number,
    certificationFee: Number,
    bundlePrice: Number,
    currency: {
      type: String,
      enum: VALID_CURRENCIES,
      default: 'PHP'
    }
  },

  // Certificate Template
  template: {
    url: String,
    publicId: String,
    backgroundColor: String,
    textColor: String,
    logoPosition: String,
    signatureImage: {
      url: String,
      publicId: String
    },
    signatoryName: String,
    signatoryTitle: String
  },

  // Stats
  stats: {
    totalIssued: {
      type: Number,
      default: 0
    },
    totalActive: {
      type: Number,
      default: 0
    },
    averageExamScore: Number,
    passRate: Number,
    averageCompletionTime: Number // in days
  },

  // Accreditation
  accreditation: {
    body: String,
    accreditationNumber: String,
    validFrom: Date,
    validUntil: Date,
    logo: {
      url: String,
      publicId: String
    }
  },

  // Skills & Keywords
  skills: [String],
  keywords: [String],

  // Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Generate slug
certificationSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// ============================================
// INDEXES
// ============================================

// Course indexes
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ 'schedule.startDate': 1 });
courseSchema.index({ 'enrollment.isOpen': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, category: 1 });
courseSchema.index({ 'certification.isAvailable': 1, category: 1 });
courseSchema.index({ createdAt: -1, isActive: 1 });
courseSchema.index({ updatedAt: -1, isActive: 1 });
courseSchema.index({ category: 1, level: 1, isActive: 1, status: 1 });
courseSchema.index({ instructor: 1, isActive: 1, category: 1 });
courseSchema.index({ 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, 'pricing.discountedPrice': 1, isActive: 1 });
courseSchema.index({ 'certification.isAvailable': 1, 'certification.issuer': 1, isActive: 1 });
courseSchema.index({ partner: 1, isActive: 1 });
courseSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1, isActive: 1 });
courseSchema.index({ tags: 1, isActive: 1 });
courseSchema.index({ favoritedBy: 1 });
courseSchema.index({ favoritesCount: -1 });
courseSchema.index({ isFeatured: 1, isActive: 1, status: 1 });
courseSchema.index({ isPromoted: 1, promotionEndDate: 1 });
courseSchema.index({ language: 1, isActive: 1 });
courseSchema.index({ 'rating.average': -1, isActive: 1 });
courseSchema.index({ views: -1, isActive: 1 });
courseSchema.index({ 'enrollment.total': -1, isActive: 1 });

// Text search index for courses
courseSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  learningOutcomes: 'text',
  tags: 'text',
  skills: 'text'
});

// Enrollment indexes
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentNumber: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ 'progress.overallProgress': 1, status: 1 });
enrollmentSchema.index({ 'certificate.issued': 1, 'certificate.issuedAt': -1 });
enrollmentSchema.index({ completedAt: -1 });
enrollmentSchema.index({ lastAccessedAt: -1 });
enrollmentSchema.index({ 'payment.status': 1 });
enrollmentSchema.index({ accessExpires: 1 });

// Certification indexes
certificationSchema.index({ slug: 1 });
certificationSchema.index({ category: 1 });
certificationSchema.index({ issuer: 1 });
certificationSchema.index({ isActive: 1 });
certificationSchema.index({ isFeatured: 1, isActive: 1 });
certificationSchema.index({ category: 1, isActive: 1 });
certificationSchema.index({ level: 1, isActive: 1 });
certificationSchema.index({ requiredCourses: 1 });

// ============================================
// COURSE INSTANCE METHODS
// ============================================

// Get course by slug
courseSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

// Check if user is enrolled
courseSchema.methods.isUserEnrolled = async function(userId) {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({
    course: this._id,
    student: userId,
    status: { $nin: ['dropped', 'expired'] }
  });
  return !!enrollment;
};

// Get total lessons count
courseSchema.methods.getTotalLessons = function() {
  return this.curriculum?.reduce((total, module) => {
    return total + (module.lessons?.length || 0);
  }, 0) || 0;
};

// Get total duration in minutes
courseSchema.methods.getTotalDuration = function() {
  return this.curriculum?.reduce((total, module) => {
    return total + (module.lessons?.reduce((lessonTotal, lesson) => {
      return lessonTotal + (lesson.duration || 0);
    }, 0) || 0);
  }, 0) || 0;
};

// Calculate and update average rating
courseSchema.methods.updateRating = async function() {
  if (!this.reviews || this.reviews.length === 0) {
    this.rating = { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  } else {
    const approvedReviews = this.reviews.filter(r => r.isApproved);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    approvedReviews.forEach(review => {
      total += review.rating;
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    this.rating = {
      average: approvedReviews.length > 0 ? (total / approvedReviews.length).toFixed(2) : 0,
      count: approvedReviews.length,
      distribution
    };
  }

  await this.save();
  return this.rating;
};

// Add a review
courseSchema.methods.addReview = async function(userId, reviewData) {
  const existingReview = this.reviews?.find(r => r.user.toString() === userId.toString());
  if (existingReview) {
    throw new Error('User has already reviewed this course');
  }

  if (!this.reviews) {
    this.reviews = [];
  }

  this.reviews.push({
    user: userId,
    rating: reviewData.rating,
    title: reviewData.title,
    comment: reviewData.comment,
    pros: reviewData.pros,
    cons: reviewData.cons,
    isVerifiedPurchase: reviewData.isVerifiedPurchase || false,
    createdAt: new Date()
  });

  await this.updateRating();
  return this.reviews[this.reviews.length - 1];
};

// Apply coupon
courseSchema.methods.applyCoupon = function(couponCode) {
  const coupon = this.coupons?.find(c =>
    c.code === couponCode.toUpperCase() &&
    c.isActive &&
    (!c.validFrom || new Date(c.validFrom) <= new Date()) &&
    (!c.validUntil || new Date(c.validUntil) >= new Date()) &&
    (!c.maxUses || c.usedCount < c.maxUses)
  );

  if (!coupon) {
    return null;
  }

  const basePrice = this.pricing.discountedPrice || this.pricing.regularPrice;
  let discount = 0;

  if (coupon.discountType === 'percentage') {
    discount = (basePrice * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  return {
    code: coupon.code,
    discount: Math.min(discount, basePrice),
    finalPrice: Math.max(0, basePrice - discount)
  };
};

// Increment view count
courseSchema.methods.incrementViews = async function() {
  this.views = (this.views || 0) + 1;
  await this.save();
  return this.views;
};

// Publish course
courseSchema.methods.publish = async function() {
  if (this.status === 'published') {
    return this;
  }

  this.status = 'published';
  this.publishedAt = this.publishedAt || new Date();
  this.lastPublishedAt = new Date();
  this.isActive = true;

  await this.save();
  return this;
};

// Archive course
courseSchema.methods.archive = async function() {
  this.status = 'archived';
  this.isActive = false;
  await this.save();
  return this;
};

// ============================================
// ENROLLMENT INSTANCE METHODS
// ============================================

// Mark lesson as completed
enrollmentSchema.methods.completeLesson = async function(moduleIndex, lessonIndex, lessonId, timeSpent = 0) {
  if (!this.progress.completedLessons) {
    this.progress.completedLessons = [];
  }

  const existing = this.progress.completedLessons.find(l =>
    l.moduleIndex === moduleIndex && l.lessonIndex === lessonIndex
  );

  if (!existing) {
    this.progress.completedLessons.push({
      moduleIndex,
      lessonIndex,
      lessonId,
      completedAt: new Date(),
      timeSpent
    });
  }

  // Update total time spent
  this.progress.totalTimeSpent = (this.progress.totalTimeSpent || 0) + timeSpent;

  // Update last accessed lesson
  this.progress.lastAccessedLesson = { moduleIndex, lessonIndex, lessonId };

  // Calculate overall progress
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  if (course) {
    const totalLessons = course.getTotalLessons();
    this.progress.overallProgress = totalLessons > 0
      ? Math.round((this.progress.completedLessons.length / totalLessons) * 100)
      : 0;
  }

  // Update status
  if (this.status === 'enrolled') {
    this.status = 'in_progress';
  }

  await this.save();
  return this.progress;
};

// Check if course is completed
enrollmentSchema.methods.checkCompletion = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (!course) return false;

  const totalLessons = course.getTotalLessons();
  const completedLessons = this.progress.completedLessons?.length || 0;

  if (completedLessons >= totalLessons && this.progress.overallProgress >= 100) {
    this.status = 'completed';
    this.completedAt = new Date();
    await this.save();
    return true;
  }

  return false;
};

// Issue certificate
enrollmentSchema.methods.issueCertificate = async function(certificateData = {}) {
  if (!this.certificate) {
    this.certificate = {};
  }

  const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  this.certificate = {
    issued: true,
    issuedAt: new Date(),
    certificateId: certificateData.certificateId || new mongoose.Types.ObjectId(),
    certificateNumber: certNumber,
    downloadUrl: certificateData.downloadUrl,
    publicId: certificateData.publicId,
    expiresAt: certificateData.expiresAt,
    verificationUrl: certificateData.verificationUrl || `/verify/${certNumber}`,
    credentials: certificateData.credentials
  };

  await this.save();
  return this.certificate;
};

// Add quiz result
enrollmentSchema.methods.addQuizResult = async function(lessonId, result) {
  if (!this.quizResults) {
    this.quizResults = [];
  }

  const attemptNumber = this.quizResults.filter(q => q.lessonId === lessonId).length + 1;

  this.quizResults.push({
    lessonId,
    attemptNumber,
    score: result.score,
    totalPoints: result.totalPoints,
    percentage: result.percentage,
    passed: result.passed,
    answers: result.answers,
    startedAt: result.startedAt,
    completedAt: new Date(),
    timeSpent: result.timeSpent
  });

  await this.save();
  return this.quizResults[this.quizResults.length - 1];
};

// Update streak
enrollmentSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.lastStreakDate) {
    const lastStreak = new Date(this.lastStreakDate);
    lastStreak.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastStreak) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.streakDays = (this.streakDays || 0) + 1;
    } else if (diffDays > 1) {
      this.streakDays = 1;
    }
  } else {
    this.streakDays = 1;
  }

  if (this.streakDays > (this.longestStreak || 0)) {
    this.longestStreak = this.streakDays;
  }

  this.lastStreakDate = today;
  this.lastAccessedAt = new Date();
  this.accessCount = (this.accessCount || 0) + 1;

  await this.save();
  return { streakDays: this.streakDays, longestStreak: this.longestStreak };
};

// ============================================
// STATIC METHODS
// ============================================

// Get popular courses
courseSchema.statics.getPopularCourses = function(limit = 10) {
  return this.find({ isActive: true, status: 'published' })
    .sort({ 'enrollment.total': -1, 'rating.average': -1 })
    .limit(limit)
    .populate('instructor', 'firstName lastName profile.avatar')
    .populate('category', 'name slug');
};

// Get featured courses
courseSchema.statics.getFeaturedCourses = function(limit = 10) {
  return this.find({ isActive: true, status: 'published', isFeatured: true })
    .sort({ featuredOrder: 1, createdAt: -1 })
    .limit(limit)
    .populate('instructor', 'firstName lastName profile.avatar')
    .populate('category', 'name slug');
};

// Get courses by instructor
courseSchema.statics.getByInstructor = function(instructorId, options = {}) {
  const query = { instructor: instructorId };
  if (options.activeOnly !== false) {
    query.isActive = true;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('category', 'name slug');
};

// Search courses
courseSchema.statics.searchCourses = function(searchText, filters = {}) {
  const query = { isActive: true, status: 'published' };

  if (searchText) {
    query.$text = { $search: searchText };
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.level) {
    query.level = filters.level;
  }

  if (filters.language) {
    query.language = filters.language;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query['pricing.regularPrice'] = {};
    if (filters.minPrice !== undefined) {
      query['pricing.regularPrice'].$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      query['pricing.regularPrice'].$lte = filters.maxPrice;
    }
  }

  if (filters.isFree) {
    query['pricing.isFree'] = true;
  }

  return this.find(query)
    .populate('instructor', 'firstName lastName profile.avatar')
    .populate('category', 'name slug');
};

// Get user enrollments
enrollmentSchema.statics.getUserEnrollments = function(userId, status = null) {
  const query = { student: userId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('course', 'title slug thumbnail pricing level')
    .sort({ lastAccessedAt: -1 });
};

// Get course enrollments
enrollmentSchema.statics.getCourseEnrollments = function(courseId, options = {}) {
  const query = { course: courseId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query)
    .populate('student', 'firstName lastName email profile.avatar')
    .sort({ enrollmentDate: -1 });
};

// ============================================
// MODELS
// ============================================

const AcademyCategory = mongoose.model('AcademyCategory', academyCategorySchema);
const Course = mongoose.model('Course', courseSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
const Certification = mongoose.model('Certification', certificationSchema);

// ============================================
// EXPORTS
// ============================================

module.exports = {
  AcademyCategory,
  Course,
  Enrollment,
  Certification,
  // Constants
  VALID_COURSE_LEVELS,
  VALID_LESSON_TYPES,
  VALID_CONTENT_TYPES,
  VALID_SESSION_TYPES,
  VALID_ENROLLMENT_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_COURSE_STATUSES,
  VALID_REQUIREMENT_TYPES,
  VALID_LANGUAGES,
  VALID_CURRENCIES
};
