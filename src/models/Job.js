const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      url: String,
      publicId: String
    },
    website: String,
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: 'small'
    },
    industry: String,
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      isRemote: { type: Boolean, default: false },
      remoteType: {
        type: String,
        enum: ['fully_remote', 'hybrid', 'on_site'],
        default: 'on_site'
      }
    }
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'technology',
      'healthcare',
      'education',
      'finance',
      'marketing',
      'sales',
      'customer_service',
      'human_resources',
      'operations',
      'design',
      'engineering',
      'construction',
      'maintenance',
      'cleaning',
      'security',
      'transportation',
      'food_service',
      'retail',
      'hospitality',
      'other'
    ]
  },
  subcategory: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    required: true,
    enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary']
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive']
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'yearly'
    },
    isNegotiable: { type: Boolean, default: false },
    isConfidential: { type: Boolean, default: false }
  },
  benefits: [{
    type: String,
    enum: [
      'health_insurance',
      'dental_insurance',
      'vision_insurance',
      'life_insurance',
      'retirement_401k',
      'paid_time_off',
      'sick_leave',
      'maternity_leave',
      'paternity_leave',
      'flexible_schedule',
      'remote_work',
      'professional_development',
      'gym_membership',
      'commuter_benefits',
      'stock_options',
      'bonus',
      'other'
    ]
  }],
  requirements: {
    skills: [String],
    education: {
      level: {
        type: String,
        enum: ['high_school', 'associate', 'bachelor', 'master', 'phd', 'none_required']
      },
      field: String,
      isRequired: { type: Boolean, default: true }
    },
    experience: {
      years: Number,
      description: String
    },
    certifications: [String],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native']
      }
    }],
    other: [String]
  },
  responsibilities: [String],
  qualifications: [String],
  applicationProcess: {
    deadline: Date,
    startDate: Date,
    applicationMethod: {
      type: String,
      enum: ['email', 'website', 'platform', 'phone'],
      default: 'platform'
    },
    contactEmail: String,
    contactPhone: String,
    applicationUrl: String,
    instructions: String
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'filled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'featured'],
    default: 'public'
  },
  applications: [{
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'rejected', 'hired'],
      default: 'pending'
    },
    coverLetter: String,
    resume: {
      url: String,
      publicId: String,
      filename: String
    },
    portfolio: {
      url: String,
      description: String
    },
    expectedSalary: Number,
    availability: Date,
    notes: String,
    interviewSchedule: [{
      date: Date,
      time: String,
      type: {
        type: String,
        enum: ['phone', 'video', 'in_person']
      },
      location: String,
      interviewer: String,
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
      },
      feedback: String
    }],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      strengths: [String],
      weaknesses: [String],
      recommendation: {
        type: String,
        enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire']
      }
    }
  }],
  views: {
    count: { type: Number, default: 0 },
    unique: { type: Number, default: 0 }
  },
  analytics: {
    applicationsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredUntil: Date,
    featuredAt: Date
  },
  promoted: {
    isPromoted: { type: Boolean, default: false },
    promotedUntil: Date,
    promotedAt: Date,
    promotionType: {
      type: String,
      enum: ['standard', 'premium', 'urgent']
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
jobSchema.index({ status: 1, isActive: 1 });
jobSchema.index({ category: 1, subcategory: 1 });
jobSchema.index({ 'company.location.city': 1, 'company.location.state': 1 });
jobSchema.index({ jobType: 1, experienceLevel: 1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'featured.isFeatured': 1, 'featured.featuredUntil': 1 });
jobSchema.index({ 'promoted.isPromoted': 1, 'promoted.promotedUntil': 1 });
jobSchema.index({ employer: 1, status: 1 });
jobSchema.index({ 'applications.applicant': 1, 'applications.status': 1 });

// Text search index
jobSchema.index({
  title: 'text',
  description: 'text',
  'company.name': 'text',
  'requirements.skills': 'text',
  tags: 'text'
});

// Virtual for application count
jobSchema.virtual('applicationCount').get(function() {
  return this.applications.length;
});

// Virtual for days since posted
jobSchema.virtual('daysSincePosted').get(function() {
  const now = new Date();
  const posted = this.createdAt;
  const diffTime = Math.abs(now - posted);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to add application
jobSchema.methods.addApplication = function(applicationData) {
  // Check if user already applied
  const existingApplication = this.applications.find(
    app => app.applicant.toString() === applicationData.applicant.toString()
  );
  
  if (existingApplication) {
    throw new Error('User has already applied for this job');
  }
  
  this.applications.push(applicationData);
  this.analytics.applicationsCount += 1;
  return this.save();
};

// Method to update application status
jobSchema.methods.updateApplicationStatus = function(applicationId, status, feedback = null) {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }
  
  application.status = status;
  if (feedback) {
    application.feedback = feedback;
  }
  
  return this.save();
};

// Method to increment views
jobSchema.methods.incrementViews = function(isUnique = false) {
  this.views.count += 1;
  if (isUnique) {
    this.views.unique += 1;
  }
  this.analytics.viewsCount += 1;
  return this.save();
};

// Method to check if job is still active
jobSchema.methods.isJobActive = function() {
  if (!this.isActive || this.status === 'closed' || this.status === 'filled') {
    return false;
  }
  
  if (this.applicationProcess.deadline && new Date() > this.applicationProcess.deadline) {
    return false;
  }
  
  return true;
};

// Method to get salary range display
jobSchema.methods.getSalaryDisplay = function() {
  if (this.salary.isConfidential) {
    return 'Salary confidential';
  }
  
  if (!this.salary.min && !this.salary.max) {
    return 'Salary not specified';
  }
  
  const currency = this.salary.currency || 'USD';
  const period = this.salary.period || 'yearly';
  
  if (this.salary.min && this.salary.max) {
    return `${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()} ${currency}/${period}`;
  } else if (this.salary.min) {
    return `${this.salary.min.toLocaleString()}+ ${currency}/${period}`;
  } else {
    return `Up to ${this.salary.max.toLocaleString()} ${currency}/${period}`;
  }
};

// Static method to search jobs
jobSchema.statics.searchJobs = function(query, filters = {}) {
  const searchQuery = { isActive: true, status: { $in: ['active', 'featured'] } };
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Apply filters
  if (filters.category) searchQuery.category = filters.category;
  if (filters.subcategory) searchQuery.subcategory = filters.subcategory;
  if (filters.jobType) searchQuery.jobType = filters.jobType;
  if (filters.experienceLevel) searchQuery.experienceLevel = filters.experienceLevel;
  if (filters.location) {
    searchQuery['company.location.city'] = new RegExp(filters.location, 'i');
  }
  if (filters.isRemote) {
    searchQuery['company.location.isRemote'] = filters.isRemote;
  }
  if (filters.minSalary || filters.maxSalary) {
    searchQuery['salary.min'] = {};
    if (filters.minSalary) searchQuery['salary.min'].$gte = filters.minSalary;
    if (filters.maxSalary) searchQuery['salary.min'].$lte = filters.maxSalary;
  }
  
  return this.find(searchQuery);
};

module.exports = mongoose.model('Job', jobSchema);
