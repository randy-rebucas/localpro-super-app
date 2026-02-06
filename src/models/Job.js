const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================
// CONSTANTS
// ============================================

const JOB_STATUSES = ['draft', 'pending_review', 'active', 'paused', 'closed', 'filled', 'expired', 'archived'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary', 'volunteer', 'apprenticeship'];
const EXPERIENCE_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'];
const EDUCATION_LEVELS = ['high_school', 'vocational', 'associate', 'bachelor', 'master', 'phd', 'professional', 'none_required'];
const COMPANY_SIZES = ['startup', 'small', 'medium', 'large', 'enterprise'];
const REMOTE_TYPES = ['on_site', 'hybrid', 'fully_remote', 'flexible'];
const SALARY_PERIODS = ['hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'project'];
const APPLICATION_STATUSES = ['pending', 'reviewing', 'screening', 'shortlisted', 'phone_screen', 'interview', 'assessment', 'reference_check', 'offer', 'hired', 'rejected', 'withdrawn'];
const INTERVIEW_TYPES = ['phone', 'video', 'in_person', 'panel', 'technical', 'behavioral', 'case_study', 'presentation'];
const INTERVIEW_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'];
const REJECTION_REASONS = ['not_qualified', 'overqualified', 'salary_mismatch', 'culture_fit', 'position_filled', 'withdrew', 'no_response', 'failed_assessment', 'background_check', 'other'];
const PROMOTION_TYPES = ['standard', 'premium', 'urgent', 'spotlight', 'homepage'];
const QUESTION_TYPES = ['text', 'textarea', 'select', 'multiselect', 'yes_no', 'number', 'date', 'file'];

const BENEFITS = [
  'health_insurance', 'dental_insurance', 'vision_insurance', 'life_insurance',
  'disability_insurance', 'retirement_401k', 'pension', 'stock_options', 'equity',
  'paid_time_off', 'unlimited_pto', 'sick_leave', 'maternity_leave', 'paternity_leave',
  'parental_leave', 'bereavement_leave', 'flexible_schedule', 'remote_work',
  'professional_development', 'tuition_reimbursement', 'gym_membership', 'wellness_program',
  'commuter_benefits', 'parking', 'company_car', 'relocation_assistance',
  'signing_bonus', 'performance_bonus', 'annual_bonus', 'profit_sharing',
  'free_meals', 'snacks_drinks', 'childcare', 'pet_friendly', 'sabbatical', 'other'
];

// ============================================
// JOB SCHEMA
// ============================================

const jobSchema = new mongoose.Schema({
  // Basic Information
  jobNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 10000
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // SEO & Discovery
  seo: {
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    keywords: [{ type: String, trim: true }],
    canonicalUrl: { type: String, trim: true }
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  searchKeywords: [{ type: String, trim: true, lowercase: true }],

  // Company Information (Enhanced)
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
      thumbnail: { type: String, trim: true }
    },
    coverImage: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true }
    },
    website: { type: String, trim: true },
    linkedIn: { type: String, trim: true },
    glassdoor: { type: String, trim: true },
    size: {
      type: String,
      enum: COMPANY_SIZES,
      default: 'small'
    },
    employeeCount: {
      min: { type: Number, min: 1 },
      max: { type: Number }
    },
    founded: { type: Number },
    industry: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 2000 },
    culture: {
      description: { type: String, trim: true, maxlength: 1000 },
      values: [{ type: String, trim: true }],
      perks: [{ type: String, trim: true }]
    },
    techStack: [{ type: String, trim: true }],
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    rating: {
      overall: { type: Number, min: 0, max: 5 },
      workLifeBalance: { type: Number, min: 0, max: 5 },
      compensation: { type: Number, min: 0, max: 5 },
      culture: { type: Number, min: 0, max: 5 },
      management: { type: Number, min: 0, max: 5 },
      reviewCount: { type: Number, default: 0 }
    }
  },

  // Location (Enhanced)
  location: {
    type: {
      type: String,
      enum: REMOTE_TYPES,
      default: 'on_site'
    },
    primary: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number] // [longitude, latitude]
      }
    },
    additionalLocations: [{
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true }
    }],
    remoteDetails: {
      timezone: { type: String, trim: true },
      timezoneFlexibility: { type: String, enum: ['strict', 'flexible', 'any'], default: 'flexible' },
      countriesAllowed: [{ type: String, trim: true }],
      countriesExcluded: [{ type: String, trim: true }],
      equipmentProvided: { type: Boolean, default: false },
      internetStipend: { type: Number, min: 0 }
    },
    travelRequired: {
      required: { type: Boolean, default: false },
      percentage: { type: Number, min: 0, max: 100 },
      description: { type: String, trim: true }
    },
    relocationOffered: { type: Boolean, default: false },
    relocationPackage: { type: String, trim: true }
  },

  // Employer/Recruiter
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hiringTeam: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['hiring_manager', 'recruiter', 'interviewer', 'coordinator', 'observer'] },
    addedAt: { type: Date, default: Date.now }
  }],
  department: { type: String, trim: true },
  reportingTo: { type: String, trim: true },

  // Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobCategory',
    required: true
  },
  subcategory: { type: String, trim: true },

  // Job Details
  jobType: {
    type: String,
    required: true,
    enum: JOB_TYPES
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: EXPERIENCE_LEVELS
  },
  positionsAvailable: { type: Number, default: 1, min: 1 },
  positionsFilled: { type: Number, default: 0, min: 0 },

  // Salary & Compensation (Enhanced)
  salary: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: 'PHP', trim: true },
    period: { type: String, enum: SALARY_PERIODS, default: 'monthly' },
    isNegotiable: { type: Boolean, default: false },
    isConfidential: { type: Boolean, default: false },
    showRange: { type: Boolean, default: true },
    // Additional compensation
    commission: {
      hasCommission: { type: Boolean, default: false },
      type: { type: String, enum: ['percentage', 'fixed', 'tiered'] },
      description: { type: String, trim: true }
    },
    equity: {
      hasEquity: { type: Boolean, default: false },
      percentage: { type: Number, min: 0, max: 100 },
      vestingPeriod: { type: Number }, // months
      vestingSchedule: { type: String, trim: true },
      description: { type: String, trim: true }
    },
    bonus: {
      hasBonus: { type: Boolean, default: false },
      type: { type: String, enum: ['signing', 'performance', 'annual', 'quarterly', 'retention'] },
      amount: { type: Number, min: 0 },
      percentage: { type: Number, min: 0, max: 100 },
      description: { type: String, trim: true }
    },
    overtimePay: { type: Boolean, default: false },
    thirteenthMonth: { type: Boolean, default: true } // Common in Philippines
  },

  // Benefits (Enhanced)
  benefits: [{
    type: { type: String, enum: BENEFITS },
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    value: { type: Number, min: 0 }, // Monetary value if applicable
    isHighlighted: { type: Boolean, default: false }
  }],

  // Requirements (Enhanced)
  requirements: {
    skills: [{
      name: { type: String, required: true, trim: true },
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
      yearsRequired: { type: Number, min: 0 },
      isRequired: { type: Boolean, default: true },
      category: { type: String, enum: ['technical', 'soft', 'tool', 'language', 'certification'] }
    }],
    education: {
      level: { type: String, enum: EDUCATION_LEVELS },
      fields: [{ type: String, trim: true }],
      isRequired: { type: Boolean, default: false },
      preferredInstitutions: [{ type: String, trim: true }]
    },
    experience: {
      minYears: { type: Number, min: 0 },
      maxYears: { type: Number },
      description: { type: String, trim: true },
      preferredIndustries: [{ type: String, trim: true }]
    },
    certifications: [{
      name: { type: String, trim: true },
      isRequired: { type: Boolean, default: false },
      validityRequired: { type: Boolean, default: false }
    }],
    languages: [{
      language: { type: String, required: true, trim: true },
      proficiency: { type: String, enum: ['basic', 'conversational', 'professional', 'fluent', 'native'] },
      isRequired: { type: Boolean, default: true }
    }],
    licenses: [{
      name: { type: String, trim: true },
      isRequired: { type: Boolean, default: false }
    }],
    clearance: {
      required: { type: Boolean, default: false },
      level: { type: String, trim: true },
      mustHave: { type: Boolean, default: false } // Must already have vs can obtain
    },
    physicalRequirements: { type: String, trim: true },
    backgroundCheck: { type: Boolean, default: false },
    drugTest: { type: Boolean, default: false },
    other: [{ type: String, trim: true }]
  },

  // Job Content
  responsibilities: [{
    text: { type: String, required: true, trim: true },
    priority: { type: Number, default: 0 }
  }],
  qualifications: [{
    text: { type: String, required: true, trim: true },
    isRequired: { type: Boolean, default: true }
  }],
  niceToHave: [{ type: String, trim: true }],
  dayInLife: { type: String, trim: true, maxlength: 2000 },
  growthOpportunities: { type: String, trim: true, maxlength: 1000 },

  // Screening Questions
  screeningQuestions: [{
    question: { type: String, required: true, trim: true },
    type: { type: String, enum: QUESTION_TYPES, default: 'text' },
    options: [{ type: String, trim: true }], // For select/multiselect
    isRequired: { type: Boolean, default: true },
    isKnockout: { type: Boolean, default: false }, // Auto-reject if wrong answer
    knockoutAnswer: mongoose.Schema.Types.Mixed, // The answer that causes rejection
    weight: { type: Number, default: 1, min: 0 }, // For scoring
    order: { type: Number, default: 0 }
  }],

  // Application Process (Enhanced)
  applicationProcess: {
    deadline: Date,
    startDate: Date, // When position starts
    applicationMethod: {
      type: String,
      enum: ['platform', 'email', 'website', 'phone', 'in_person'],
      default: 'platform'
    },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    applicationUrl: { type: String, trim: true },
    instructions: { type: String, trim: true, maxlength: 1000 },
    // Required materials
    requireResume: { type: Boolean, default: true },
    requireCoverLetter: { type: Boolean, default: false },
    requirePortfolio: { type: Boolean, default: false },
    requireVideo: { type: Boolean, default: false },
    videoPrompt: { type: String, trim: true },
    maxVideoLength: { type: Number }, // seconds
    customFields: [{
      label: { type: String, trim: true },
      type: { type: String, enum: QUESTION_TYPES },
      isRequired: { type: Boolean, default: false }
    }],
    // Process stages
    stages: [{
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      order: { type: Number, default: 0 },
      estimatedDuration: { type: Number }, // days
      isOptional: { type: Boolean, default: false }
    }],
    estimatedResponseTime: { type: Number }, // days
    interviewRounds: { type: Number, default: 2 }
  },

  // Applications (Enhanced ATS)
  applications: [{
    applicationId: { type: String, unique: true, sparse: true },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appliedAt: { type: Date, default: Date.now },
    source: {
      type: String,
      enum: ['direct', 'referral', 'job_board', 'linkedin', 'indeed', 'glassdoor', 'company_website', 'recruiter', 'social_media', 'event', 'other'],
      default: 'direct'
    },
    sourceDetails: { type: String, trim: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Application content
    coverLetter: { type: String, trim: true, maxlength: 5000 },
    resume: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
      filename: { type: String, trim: true },
      parsedData: mongoose.Schema.Types.Mixed // Parsed resume data
    },
    portfolio: {
      url: { type: String, trim: true },
      description: { type: String, trim: true }
    },
    videoIntro: {
      url: { type: String, trim: true },
      duration: { type: Number }
    },
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId },
      question: { type: String, trim: true },
      answer: mongoose.Schema.Types.Mixed
    }],
    customFieldAnswers: mongoose.Schema.Types.Mixed,

    // Compensation expectations
    expectedSalary: {
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'PHP' },
      period: { type: String, enum: SALARY_PERIODS }
    },
    availability: {
      startDate: Date,
      noticePeriod: { type: Number }, // days
      isImmediate: { type: Boolean, default: false }
    },
    willingToRelocate: { type: Boolean },

    // ATS Pipeline
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending'
    },
    stage: { type: String, trim: true }, // Current pipeline stage
    stageHistory: [{
      stage: { type: String, trim: true },
      status: { type: String, enum: APPLICATION_STATUSES },
      enteredAt: { type: Date, default: Date.now },
      exitedAt: Date,
      duration: { type: Number }, // hours in stage
      movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String, trim: true }
    }],

    // Scoring
    score: {
      overall: { type: Number, min: 0, max: 100 },
      screening: { type: Number, min: 0, max: 100 },
      skills: { type: Number, min: 0, max: 100 },
      experience: { type: Number, min: 0, max: 100 },
      cultural: { type: Number, min: 0, max: 100 },
      manual: { type: Number, min: 0, max: 100 },
      autoCalculated: { type: Boolean, default: true }
    },

    // Tags and notes
    tags: [{ type: String, trim: true }],
    notes: [{
      content: { type: String, trim: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
      isPrivate: { type: Boolean, default: false }
    }],

    // Interview scheduling
    interviews: [{
      interviewId: { type: String },
      type: { type: String, enum: INTERVIEW_TYPES },
      round: { type: Number, default: 1 },
      scheduledAt: Date,
      duration: { type: Number, default: 60 }, // minutes
      timezone: { type: String, default: 'Asia/Manila' },
      location: {
        type: { type: String, enum: ['in_person', 'video', 'phone'] },
        address: { type: String, trim: true },
        meetingLink: { type: String, trim: true },
        phone: { type: String, trim: true },
        platform: { type: String, enum: ['zoom', 'meet', 'teams', 'skype', 'other'] }
      },
      interviewers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, trim: true },
        role: { type: String, trim: true }
      }],
      status: { type: String, enum: INTERVIEW_STATUSES, default: 'scheduled' },
      confirmedAt: Date,
      completedAt: Date,
      feedback: [{
        interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        strengths: [{ type: String, trim: true }],
        weaknesses: [{ type: String, trim: true }],
        notes: { type: String, trim: true },
        recommendation: { type: String, enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'] },
        submittedAt: { type: Date, default: Date.now }
      }],
      rescheduleHistory: [{
        previousDate: Date,
        newDate: Date,
        reason: { type: String, trim: true },
        requestedBy: { type: String, enum: ['applicant', 'company'] },
        requestedAt: { type: Date, default: Date.now }
      }],
      reminders: [{
        type: { type: String, enum: ['email', 'sms', 'push'] },
        scheduledFor: Date,
        sentAt: Date
      }]
    }],

    // Assessments
    assessments: [{
      name: { type: String, trim: true },
      type: { type: String, enum: ['skills', 'personality', 'cognitive', 'technical', 'custom'] },
      url: { type: String, trim: true },
      sentAt: Date,
      completedAt: Date,
      score: { type: Number, min: 0, max: 100 },
      results: mongoose.Schema.Types.Mixed,
      expiresAt: Date
    }],

    // Offer
    offer: {
      status: { type: String, enum: ['pending', 'sent', 'viewed', 'accepted', 'declined', 'negotiating', 'expired', 'withdrawn'] },
      sentAt: Date,
      viewedAt: Date,
      respondedAt: Date,
      expiresAt: Date,
      salary: {
        amount: { type: Number, min: 0 },
        currency: { type: String, default: 'PHP' },
        period: { type: String, enum: SALARY_PERIODS }
      },
      startDate: Date,
      signingBonus: { type: Number, min: 0 },
      equity: { type: String, trim: true },
      benefits: [{ type: String, trim: true }],
      terms: { type: String, trim: true },
      letterUrl: { type: String, trim: true },
      negotiationNotes: { type: String, trim: true },
      declineReason: { type: String, trim: true }
    },

    // Rejection
    rejection: {
      rejectedAt: Date,
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, enum: REJECTION_REASONS },
      customReason: { type: String, trim: true },
      feedback: { type: String, trim: true },
      emailSent: { type: Boolean, default: false },
      emailSentAt: Date
    },

    // Communication
    lastContactedAt: Date,
    communicationHistory: [{
      type: { type: String, enum: ['email', 'phone', 'sms', 'in_app', 'meeting'] },
      subject: { type: String, trim: true },
      content: { type: String, trim: true },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date, default: Date.now },
      opened: { type: Boolean, default: false },
      openedAt: Date
    }],

    // EEO Data (anonymized for compliance reporting)
    eeoData: {
      hasProvided: { type: Boolean, default: false },
      gender: { type: String, enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'] },
      ethnicity: { type: String, trim: true },
      veteranStatus: { type: String, enum: ['veteran', 'not_veteran', 'prefer_not_to_say'] },
      disabilityStatus: { type: String, enum: ['yes', 'no', 'prefer_not_to_say'] }
    },

    // Flags
    isStarred: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isWatched: { type: Boolean, default: false }
  }],

  // Referral Program
  referralProgram: {
    enabled: { type: Boolean, default: false },
    bonus: {
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'PHP' },
      type: { type: String, enum: ['fixed', 'percentage'] },
      payoutCondition: { type: String, enum: ['hired', 'after_probation', 'after_6_months'] },
      description: { type: String, trim: true }
    },
    referrals: [{
      referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      referredEmail: { type: String, trim: true },
      referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      application: { type: mongoose.Schema.Types.ObjectId },
      status: { type: String, enum: ['pending', 'applied', 'hired', 'paid', 'rejected'] },
      referredAt: { type: Date, default: Date.now },
      hiredAt: Date,
      paidAt: Date,
      bonusAmount: { type: Number, min: 0 }
    }]
  },

  // Status & Approval
  status: {
    type: String,
    enum: JOB_STATUSES,
    default: 'draft'
  },
  approval: {
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'requires_changes'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    notes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true }
  },
  publishedAt: Date,
  closedAt: Date,
  filledAt: Date,
  expiresAt: Date,

  // Visibility & Promotion
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted', 'internal'],
    default: 'public'
  },
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredAt: Date,
    featuredUntil: Date,
    featuredPosition: { type: Number }
  },
  promoted: {
    isPromoted: { type: Boolean, default: false },
    promotedAt: Date,
    promotedUntil: Date,
    promotionType: { type: String, enum: PROMOTION_TYPES }
  },
  urgent: {
    isUrgent: { type: Boolean, default: false },
    urgentUntil: Date,
    reason: { type: String, trim: true }
  },

  // Analytics (Enhanced)
  analytics: {
    views: {
      total: { type: Number, default: 0 },
      unique: { type: Number, default: 0 },
      last7Days: { type: Number, default: 0 },
      last30Days: { type: Number, default: 0 }
    },
    applications: {
      total: { type: Number, default: 0 },
      last7Days: { type: Number, default: 0 },
      last30Days: { type: Number, default: 0 }
    },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    clicks: {
      apply: { type: Number, default: 0 },
      company: { type: Number, default: 0 },
      share: { type: Number, default: 0 }
    },
    conversionRate: { type: Number, default: 0 }, // views to applications
    avgTimeToApply: { type: Number }, // minutes
    sourceBreakdown: mongoose.Schema.Types.Mixed,
    // Funnel metrics
    funnel: {
      applied: { type: Number, default: 0 },
      screened: { type: Number, default: 0 },
      interviewed: { type: Number, default: 0 },
      offered: { type: Number, default: 0 },
      hired: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 }
    },
    // Time metrics
    timeMetrics: {
      avgTimeToScreen: { type: Number }, // days
      avgTimeToInterview: { type: Number },
      avgTimeToOffer: { type: Number },
      avgTimeToHire: { type: Number },
      avgTimeToReject: { type: Number }
    },
    lastViewedAt: Date,
    lastAppliedAt: Date
  },

  // Compliance & Legal
  compliance: {
    eeoStatement: { type: String, trim: true },
    eeoEnabled: { type: Boolean, default: true },
    diversityStatement: { type: String, trim: true },
    accommodationsStatement: { type: String, trim: true },
    legalDisclaimer: { type: String, trim: true },
    backgroundCheckDisclosure: { type: String, trim: true },
    dataRetentionDays: { type: Number, default: 365 }
  },

  // External Integrations
  externalIds: [{
    system: { type: String, required: true, trim: true }, // 'greenhouse', 'lever', 'workday', etc.
    externalId: { type: String, required: true, trim: true },
    metadata: mongoose.Schema.Types.Mixed,
    syncedAt: Date
  }],
  webhooks: [{
    url: { type: String, required: true },
    events: [{ type: String }], // 'application.new', 'application.status_changed', etc.
    secret: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastTriggeredAt: Date,
    failureCount: { type: Number, default: 0 }
  }],

  // Versioning
  version: { type: Number, default: 1 },
  versionHistory: [{
    version: { type: Number },
    changes: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true }
  }],

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: { type: Boolean, default: true },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

// Basic indexes
jobSchema.index({ jobNumber: 1 }, { unique: true, sparse: true });
jobSchema.index({ slug: 1 }, { unique: true, sparse: true });
jobSchema.index({ status: 1, isActive: 1 });
jobSchema.index({ employer: 1, status: 1 });
jobSchema.index({ category: 1, subcategory: 1 });
jobSchema.index({ jobType: 1, experienceLevel: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ publishedAt: -1 });

// Location indexes
jobSchema.index({ 'location.primary.coordinates': '2dsphere' });
jobSchema.index({ 'location.primary.city': 1, 'location.primary.country': 1 });
jobSchema.index({ 'location.type': 1, status: 1 });

// Salary indexes
jobSchema.index({ 'salary.min': 1, 'salary.max': 1, 'salary.currency': 1 });

// Featured/Promoted indexes
jobSchema.index({ 'featured.isFeatured': 1, 'featured.featuredUntil': 1 });
jobSchema.index({ 'promoted.isPromoted': 1, 'promoted.promotedUntil': 1 });
jobSchema.index({ 'urgent.isUrgent': 1, 'urgent.urgentUntil': 1 });

// Application indexes
jobSchema.index({ 'applications.applicant': 1, 'applications.status': 1 });
jobSchema.index({ 'applications.appliedAt': -1 });
jobSchema.index({ 'applications.source': 1 });
jobSchema.index({ 'applications.score.overall': -1 });

// Analytics indexes
jobSchema.index({ 'analytics.views.total': -1 });
jobSchema.index({ 'analytics.applications.total': -1 });

// External ID index
jobSchema.index({ 'externalIds.system': 1, 'externalIds.externalId': 1 }, { sparse: true });

// Text search index
jobSchema.index({
  title: 'text',
  description: 'text',
  'company.name': 'text',
  'requirements.skills.name': 'text',
  tags: 'text',
  searchKeywords: 'text'
}, {
  weights: {
    title: 10,
    tags: 8,
    searchKeywords: 6,
    'requirements.skills.name': 4,
    'company.name': 3,
    description: 1
  }
});

// ============================================
// PRE-SAVE HOOKS
// ============================================

jobSchema.pre('save', async function(next) {
  // Generate job number if not set
  if (!this.jobNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.jobNumber = `JOB${dateStr}${random}`;
  }

  // Generate slug if not set
  if (!this.slug && this.title) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;
    const Job = mongoose.model('Job');

    while (await Job.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  // Generate application IDs
  for (const app of this.applications) {
    if (!app.applicationId) {
      app.applicationId = `APP${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    }
  }

  // Update analytics
  if (this.analytics && this.analytics.views.total > 0 && this.analytics.applications.total > 0) {
    this.analytics.conversionRate = (this.analytics.applications.total / this.analytics.views.total) * 100;
  }

  next();
});

// ============================================
// VIRTUALS
// ============================================

jobSchema.virtual('applicationCount').get(function() {
  return this.applications.filter(a => !a.isArchived).length;
});

jobSchema.virtual('daysSincePosted').get(function() {
  if (!this.publishedAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.publishedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

jobSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

jobSchema.virtual('positionsRemaining').get(function() {
  return Math.max(0, this.positionsAvailable - this.positionsFilled);
});

// ============================================
// INSTANCE METHODS
// ============================================

// Status transitions
jobSchema.methods.publish = async function(userId) {
  if (this.status === 'draft' || this.status === 'pending_review') {
    this.status = 'active';
    this.publishedAt = new Date();
    await this.save();
  }
  return this;
};

jobSchema.methods.pause = async function(reason = '') {
  if (this.status === 'active') {
    this.status = 'paused';
    await this.save();
  }
  return this;
};

jobSchema.methods.close = async function(reason = '') {
  this.status = 'closed';
  this.closedAt = new Date();
  await this.save();
  return this;
};

jobSchema.methods.markFilled = async function() {
  this.status = 'filled';
  this.filledAt = new Date();
  await this.save();
  return this;
};

jobSchema.methods.reopen = async function() {
  if (['closed', 'paused', 'filled'].includes(this.status)) {
    this.status = 'active';
    this.closedAt = null;
    this.filledAt = null;
    await this.save();
  }
  return this;
};

jobSchema.methods.archive = async function(userId) {
  this.status = 'archived';
  this.isActive = false;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
  return this;
};

// Views tracking
jobSchema.methods.recordView = async function(isUnique = false) {
  this.analytics.views.total += 1;
  if (isUnique) {
    this.analytics.views.unique += 1;
  }
  this.analytics.lastViewedAt = new Date();
  await this.save();
  return this;
};

jobSchema.methods.recordClick = async function(clickType = 'apply') {
  if (this.analytics.clicks[clickType] !== undefined) {
    this.analytics.clicks[clickType] += 1;
  }
  await this.save();
  return this;
};

// Application management
jobSchema.methods.addApplication = async function(applicationData) {
  // Check if user already applied
  const existingApplication = this.applications.find(
    app => app.applicant.toString() === applicationData.applicant.toString() && !app.isArchived
  );

  if (existingApplication) {
    throw new Error('User has already applied for this job');
  }

  // Calculate screening score
  let screeningScore = 0;
  if (this.screeningQuestions.length > 0 && applicationData.answers) {
    for (const sq of this.screeningQuestions) {
      const answer = applicationData.answers.find(a =>
        a.questionId && a.questionId.toString() === sq._id.toString()
      );
      if (answer) {
        // Check knockout answers
        if (sq.isKnockout && sq.knockoutAnswer !== undefined) {
          if (answer.answer === sq.knockoutAnswer) {
            applicationData.status = 'rejected';
            applicationData.rejection = {
              rejectedAt: new Date(),
              reason: 'failed_assessment',
              customReason: 'Failed screening question'
            };
          }
        }
        // Add to score (simplified scoring)
        if (!sq.isKnockout || answer.answer !== sq.knockoutAnswer) {
          screeningScore += sq.weight || 1;
        }
      }
    }
    applicationData.score = applicationData.score || {};
    applicationData.score.screening = (screeningScore / this.screeningQuestions.length) * 100;
  }

  this.applications.push(applicationData);
  this.analytics.applications.total += 1;
  this.analytics.lastAppliedAt = new Date();
  this.analytics.funnel.applied += 1;

  await this.save();
  return this.applications[this.applications.length - 1];
};

jobSchema.methods.updateApplicationStatus = async function(applicationId, status, userId, notes = '') {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  const oldStatus = application.status;
  application.status = status;

  // Update stage history
  application.stageHistory.push({
    stage: application.stage,
    status: oldStatus,
    exitedAt: new Date(),
    duration: application.stageHistory.length > 0
      ? (Date.now() - application.stageHistory[application.stageHistory.length - 1].enteredAt) / 3600000
      : 0,
    movedBy: userId,
    notes
  });

  // Update funnel metrics
  if (status === 'screening' || status === 'reviewing') {
    this.analytics.funnel.screened += 1;
  } else if (status === 'interview' || status === 'phone_screen') {
    this.analytics.funnel.interviewed += 1;
  } else if (status === 'offer') {
    this.analytics.funnel.offered += 1;
  } else if (status === 'hired') {
    this.analytics.funnel.hired += 1;
    this.positionsFilled += 1;
  } else if (status === 'rejected') {
    this.analytics.funnel.rejected += 1;
  }

  await this.save();
  return application;
};

jobSchema.methods.withdrawApplication = async function(applicationId, userId) {
  const application = this.applications.id(applicationId);

  if (!application) {
    throw new Error('Application not found');
  }

  if (application.applicant.toString() !== userId.toString()) {
    throw new Error('Not authorized to withdraw this application');
  }

  if (application.status === 'hired') {
    throw new Error('Cannot withdraw an accepted application');
  }

  application.status = 'withdrawn';
  application.isArchived = true;

  await this.save();
  return application;
};

jobSchema.methods.rejectApplication = async function(applicationId, userId, reason, customReason = '', feedback = '') {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  application.status = 'rejected';
  application.rejection = {
    rejectedAt: new Date(),
    rejectedBy: userId,
    reason,
    customReason,
    feedback
  };

  this.analytics.funnel.rejected += 1;
  await this.save();
  return application;
};

// Interview management
jobSchema.methods.scheduleInterview = async function(applicationId, interviewData) {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  const interview = {
    interviewId: `INT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    ...interviewData,
    status: 'scheduled'
  };

  application.interviews.push(interview);

  // Update status if not already in interview stage
  if (!['interview', 'phone_screen'].includes(application.status)) {
    application.status = interviewData.type === 'phone' ? 'phone_screen' : 'interview';
  }

  await this.save();
  return interview;
};

jobSchema.methods.updateInterviewStatus = async function(applicationId, interviewId, status, feedback = null) {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  const interview = application.interviews.find(i => i.interviewId === interviewId);
  if (!interview) {
    throw new Error('Interview not found');
  }

  interview.status = status;
  if (status === 'completed') {
    interview.completedAt = new Date();
  }
  if (feedback) {
    interview.feedback.push(feedback);
  }

  await this.save();
  return interview;
};

jobSchema.methods.rescheduleInterview = async function(applicationId, interviewId, newDate, reason, requestedBy) {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  const interview = application.interviews.find(i => i.interviewId === interviewId);
  if (!interview) {
    throw new Error('Interview not found');
  }

  interview.rescheduleHistory.push({
    previousDate: interview.scheduledAt,
    newDate,
    reason,
    requestedBy
  });

  interview.scheduledAt = newDate;
  interview.status = 'rescheduled';

  await this.save();
  return interview;
};

// Offer management
jobSchema.methods.sendOffer = async function(applicationId, offerData) {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  application.status = 'offer';
  application.offer = {
    status: 'sent',
    sentAt: new Date(),
    ...offerData
  };

  this.analytics.funnel.offered += 1;
  await this.save();
  return application;
};

jobSchema.methods.respondToOffer = async function(applicationId, accepted, declineReason = '') {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  if (!application.offer) {
    throw new Error('No offer found for this application');
  }

  application.offer.respondedAt = new Date();

  if (accepted) {
    application.offer.status = 'accepted';
    application.status = 'hired';
    this.positionsFilled += 1;
    this.analytics.funnel.hired += 1;
  } else {
    application.offer.status = 'declined';
    application.offer.declineReason = declineReason;
    application.status = 'rejected';
  }

  await this.save();
  return application;
};

// Scoring
jobSchema.methods.updateScore = async function(applicationId, scores) {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  application.score = {
    ...application.score,
    ...scores,
    autoCalculated: false
  };

  // Calculate overall if not provided
  if (scores.overall === undefined) {
    const scoreFields = ['screening', 'skills', 'experience', 'cultural', 'manual'];
    const validScores = scoreFields
      .map(f => application.score[f])
      .filter(s => s !== undefined && s !== null);

    if (validScores.length > 0) {
      application.score.overall = validScores.reduce((a, b) => a + b, 0) / validScores.length;
    }
  }

  await this.save();
  return application;
};

// Referral management
jobSchema.methods.addReferral = async function(referrerId, referredEmail) {
  if (!this.referralProgram.enabled) {
    throw new Error('Referral program is not enabled for this job');
  }

  const existingReferral = this.referralProgram.referrals.find(
    r => r.referredEmail === referredEmail
  );

  if (existingReferral) {
    throw new Error('This email has already been referred');
  }

  this.referralProgram.referrals.push({
    referrer: referrerId,
    referredEmail,
    status: 'pending'
  });

  await this.save();
  return this.referralProgram.referrals[this.referralProgram.referrals.length - 1];
};

jobSchema.methods.linkReferralToApplication = async function(referredEmail, applicationId, userId) {
  const referral = this.referralProgram.referrals.find(
    r => r.referredEmail === referredEmail && r.status === 'pending'
  );

  if (referral) {
    referral.referredUser = userId;
    referral.application = applicationId;
    referral.status = 'applied';
    await this.save();
  }

  return referral;
};

jobSchema.methods.completeReferral = async function(referredEmail) {
  const referral = this.referralProgram.referrals.find(
    r => r.referredEmail === referredEmail && r.status === 'applied'
  );

  if (referral) {
    referral.status = 'hired';
    referral.hiredAt = new Date();
    referral.bonusAmount = this.referralProgram.bonus.amount;
    await this.save();
  }

  return referral;
};

// Featuring
jobSchema.methods.feature = async function(until, position = null) {
  this.featured.isFeatured = true;
  this.featured.featuredAt = new Date();
  this.featured.featuredUntil = until;
  if (position) this.featured.featuredPosition = position;
  await this.save();
  return this;
};

jobSchema.methods.unfeature = async function() {
  this.featured.isFeatured = false;
  this.featured.featuredAt = null;
  this.featured.featuredUntil = null;
  this.featured.featuredPosition = null;
  await this.save();
  return this;
};

jobSchema.methods.promote = async function(promotionType, until) {
  this.promoted.isPromoted = true;
  this.promoted.promotedAt = new Date();
  this.promoted.promotedUntil = until;
  this.promoted.promotionType = promotionType;
  await this.save();
  return this;
};

// Utility methods
jobSchema.methods.isJobActive = function() {
  if (!this.isActive || ['closed', 'filled', 'archived', 'expired'].includes(this.status)) {
    return false;
  }
  if (this.expiresAt && new Date() > this.expiresAt) {
    return false;
  }
  return true;
};

jobSchema.methods.getInactiveReason = function() {
  if (!this.isActive) return 'This job has been deactivated';
  if (this.status === 'closed') return 'This job posting has been closed';
  if (this.status === 'filled') return 'This position has been filled';
  if (this.status === 'archived') return 'This job posting has been archived';
  if (this.status === 'expired' || (this.expiresAt && new Date() > this.expiresAt)) {
    return 'This job posting has expired';
  }
  if (this.positionsRemaining <= 0) return 'All positions have been filled';
  return null;
};

jobSchema.methods.getSalaryDisplay = function() {
  if (this.salary.isConfidential) return 'Salary confidential';
  if (!this.salary.min && !this.salary.max) return 'Salary not specified';

  const currency = this.salary.currency || 'PHP';
  const period = this.salary.period || 'monthly';
  const negotiable = this.salary.isNegotiable ? ' (Negotiable)' : '';

  if (this.salary.min && this.salary.max) {
    return `${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()} ${currency}/${period}${negotiable}`;
  } else if (this.salary.min) {
    return `${this.salary.min.toLocaleString()}+ ${currency}/${period}${negotiable}`;
  } else {
    return `Up to ${this.salary.max.toLocaleString()} ${currency}/${period}${negotiable}`;
  }
};

// External ID management
jobSchema.methods.linkExternalId = async function(system, externalId, metadata = {}) {
  const existing = this.externalIds.find(e => e.system === system);
  if (existing) {
    existing.externalId = externalId;
    existing.metadata = metadata;
    existing.syncedAt = new Date();
  } else {
    this.externalIds.push({ system, externalId, metadata, syncedAt: new Date() });
  }
  await this.save();
  return this;
};

jobSchema.methods.getExternalId = function(system) {
  const entry = this.externalIds.find(e => e.system === system);
  return entry ? entry.externalId : null;
};

// Metadata
jobSchema.methods.setMetadata = async function(key, value) {
  if (!this.metadata) this.metadata = {};
  const keys = key.split('.');
  let current = this.metadata;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  this.markModified('metadata');
  await this.save();
  return this;
};

jobSchema.methods.getMetadata = function(key, defaultValue = null) {
  if (!this.metadata) return defaultValue;
  const keys = key.split('.');
  let current = this.metadata;
  for (const k of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = current[k];
  }
  return current !== undefined ? current : defaultValue;
};

// ============================================
// STATIC METHODS
// ============================================

jobSchema.statics.findByJobNumber = function(jobNumber) {
  return this.findOne({ jobNumber, isActive: true });
};

jobSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true, status: { $in: ['active', 'paused'] } });
};

jobSchema.statics.findByEmployer = function(employerId, options = {}) {
  const { status = null, page = 1, limit = 20 } = options;
  const query = { employer: employerId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

jobSchema.statics.findFeatured = function(limit = 10) {
  return this.find({
    'featured.isFeatured': true,
    'featured.featuredUntil': { $gt: new Date() },
    isActive: true,
    status: 'active'
  })
    .sort({ 'featured.featuredPosition': 1 })
    .limit(limit);
};

jobSchema.statics.findUrgent = function(limit = 10) {
  return this.find({
    'urgent.isUrgent': true,
    'urgent.urgentUntil': { $gt: new Date() },
    isActive: true,
    status: 'active'
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

jobSchema.statics.findNearby = function(coordinates, maxDistance = 50, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({
    'location.primary.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistance * 1000
      }
    },
    isActive: true,
    status: 'active'
  })
    .skip((page - 1) * limit)
    .limit(limit);
};

jobSchema.statics.findRemote = function(options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({
    'location.type': { $in: ['fully_remote', 'hybrid'] },
    isActive: true,
    status: 'active'
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

jobSchema.statics.search = function(query, filters = {}) {
  const searchQuery = { isActive: true, status: { $in: ['active'] } };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (filters.category) searchQuery.category = filters.category;
  if (filters.subcategory) searchQuery.subcategory = filters.subcategory;
  if (filters.jobType) searchQuery.jobType = filters.jobType;
  if (filters.experienceLevel) searchQuery.experienceLevel = filters.experienceLevel;
  if (filters.locationType) searchQuery['location.type'] = filters.locationType;
  if (filters.city) searchQuery['location.primary.city'] = new RegExp(filters.city, 'i');
  if (filters.country) searchQuery['location.primary.country'] = filters.country;

  if (filters.minSalary || filters.maxSalary) {
    if (filters.minSalary) searchQuery['salary.max'] = { $gte: filters.minSalary };
    if (filters.maxSalary) searchQuery['salary.min'] = { $lte: filters.maxSalary };
  }

  if (filters.skills && filters.skills.length > 0) {
    searchQuery['requirements.skills.name'] = { $in: filters.skills };
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || -1;

  return this.find(searchQuery)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);
};

jobSchema.statics.findByExternalId = function(system, externalId) {
  return this.findOne({
    'externalIds.system': system,
    'externalIds.externalId': externalId
  });
};

jobSchema.statics.getStats = async function(employerId, startDate, endDate) {
  const match = { employer: employerId };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalApplications: { $sum: '$analytics.applications.total' },
        totalViews: { $sum: '$analytics.views.total' },
        totalHired: { $sum: '$analytics.funnel.hired' }
      }
    }
  ]);

  return stats.reduce((acc, s) => {
    acc[s._id] = {
      count: s.count,
      applications: s.totalApplications,
      views: s.totalViews,
      hired: s.totalHired
    };
    return acc;
  }, {});
};

jobSchema.statics.getHiringFunnel = async function(jobId) {
  const job = await this.findById(jobId);
  if (!job) return null;

  return {
    applied: job.analytics.funnel.applied,
    screened: job.analytics.funnel.screened,
    interviewed: job.analytics.funnel.interviewed,
    offered: job.analytics.funnel.offered,
    hired: job.analytics.funnel.hired,
    rejected: job.analytics.funnel.rejected,
    conversionRate: job.analytics.conversionRate,
    timeMetrics: job.analytics.timeMetrics
  };
};

jobSchema.statics.getPendingReview = function() {
  return this.find({ status: 'pending_review' }).sort({ createdAt: 1 });
};

jobSchema.statics.getExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    expiresAt: { $lte: futureDate, $gt: new Date() },
    status: 'active',
    isActive: true
  }).sort({ expiresAt: 1 });
};

// ============================================
// MODEL EXPORT
// ============================================

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

module.exports = {
  Job,
  // Constants
  JOB_STATUSES,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  COMPANY_SIZES,
  REMOTE_TYPES,
  SALARY_PERIODS,
  APPLICATION_STATUSES,
  INTERVIEW_TYPES,
  INTERVIEW_STATUSES,
  REJECTION_REASONS,
  PROMOTION_TYPES,
  QUESTION_TYPES,
  BENEFITS
};
