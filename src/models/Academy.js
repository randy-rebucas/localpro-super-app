const mongoose = require('mongoose');

// Academy Category Schema
const academyCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

academyCategorySchema.index({ name: 1 }, { unique: true });
academyCategorySchema.index({ isActive: 1 });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademyCategory',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partner: {
    name: String, // e.g., "TES" (Technical Education Services)
    logo: String,
    website: String
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  duration: {
    hours: {
      type: Number,
      required: true
    },
    weeks: Number
  },
  pricing: {
    regularPrice: {
      type: Number,
      required: true
    },
    discountedPrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  curriculum: [{
    module: {
      type: String,
      required: true
    },
    lessons: [{
      title: String,
      description: String,
      duration: Number, // in minutes
      type: {
        type: String,
        enum: ['video', 'text', 'quiz', 'practical'],
        default: 'video'
      },
      content: {
        url: String,
        publicId: String,
        type: String // 'video', 'document', 'image', 'text'
      },
      isFree: { type: Boolean, default: false }
    }]
  }],
  prerequisites: [String],
  learningOutcomes: [String],
  certification: {
    isAvailable: { type: Boolean, default: false },
    name: String,
    issuer: String,
    validity: Number, // in months
    requirements: [String]
  },
  enrollment: {
    current: { type: Number, default: 0 },
    maxCapacity: Number,
    isOpen: { type: Boolean, default: true }
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    sessions: [{
      date: Date,
      startTime: String,
      endTime: String,
      type: {
        type: String,
        enum: ['live', 'recorded', 'practical'],
        default: 'live'
      }
    }]
  },
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
    }
  },
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  favoritesCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  thumbnail: {
    url: String,
    publicId: String,
    thumbnail: String
  },
  tags: [String]
}, {
  timestamps: true
});

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
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  progress: {
    completedLessons: [{
      lessonId: String,
      completedAt: Date
    }],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  payment: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  certificate: {
    issued: { type: Boolean, default: false },
    issuedAt: Date,
    certificateId: String,
    downloadUrl: String,
    publicId: String
  }
}, {
  timestamps: true
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  requirements: [{
    type: {
      type: String,
      enum: ['course_completion', 'exam', 'practical', 'experience'],
      required: true
    },
    description: String,
    value: String // e.g., "80%" for exam, "2 years" for experience
  }],
  validity: {
    duration: Number, // in months
    renewable: { type: Boolean, default: true }
  },
  exam: {
    isRequired: { type: Boolean, default: true },
    duration: Number, // in minutes
    passingScore: Number, // percentage
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ 'schedule.startDate': 1 });

enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });

// Note: category/level, instructor, and isActive indexes are defined above
courseSchema.index({ 'enrollment.isOpen': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, category: 1 });
courseSchema.index({ 'certification.isAvailable': 1, category: 1 });
courseSchema.index({ createdAt: -1, isActive: 1 });
courseSchema.index({ updatedAt: -1, isActive: 1 });

// Additional performance indexes
courseSchema.index({ category: 1, level: 1, isActive: 1 }); // Category and level filtering
courseSchema.index({ instructor: 1, isActive: 1, category: 1 }); // Instructor courses by category
courseSchema.index({ 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 }); // Enrollment status
courseSchema.index({ 'pricing.regularPrice': 1, 'pricing.discountedPrice': 1, isActive: 1 }); // Price filtering
courseSchema.index({ 'certification.isAvailable': 1, 'certification.issuer': 1, isActive: 1 }); // Certification filtering
courseSchema.index({ 'partner.name': 1, isActive: 1 }); // Partner filtering
courseSchema.index({ prerequisites: 1, isActive: 1 }); // Prerequisites filtering
courseSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1, isActive: 1 }); // Schedule filtering
courseSchema.index({ tags: 1, isActive: 1 }); // Tags filtering
courseSchema.index({ favoritedBy: 1 }); // Favorite lookups
courseSchema.index({ favoritesCount: -1 }); // Popular favorites

// Text search index for courses
courseSchema.index({
  title: 'text',
  description: 'text',
  'learningOutcomes': 'text',
  tags: 'text'
});

// Note: student, course, and status indexes are defined above
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, course: 1, status: 1 }); // Unique enrollment check
enrollmentSchema.index({ 'progress.completedModules': 1, status: 1 }); // Progress tracking
enrollmentSchema.index({ 'certificate.issuedAt': -1, status: 1 }); // Certificate tracking

certificationSchema.index({ category: 1 });
certificationSchema.index({ issuer: 1 });
certificationSchema.index({ isActive: 1 });
certificationSchema.index({ category: 1, isActive: 1 });
certificationSchema.index({ 'requirements.courses': 1, isActive: 1 });
certificationSchema.index({ 'validity.months': 1, isActive: 1 });

module.exports = {
  AcademyCategory: mongoose.model('AcademyCategory', academyCategorySchema),
  Course: mongoose.model('Course', courseSchema),
  Enrollment: mongoose.model('Enrollment', enrollmentSchema),
  Certification: mongoose.model('Certification', certificationSchema)
};
