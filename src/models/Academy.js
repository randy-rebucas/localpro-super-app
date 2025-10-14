const mongoose = require('mongoose');

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
    type: String,
    enum: ['cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'],
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
      content: String, // URL or text content
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
  isActive: {
    type: Boolean,
    default: true
  },
  thumbnail: String,
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
    downloadUrl: String
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

certificationSchema.index({ category: 1 });
certificationSchema.index({ issuer: 1 });

module.exports = {
  Course: mongoose.model('Course', courseSchema),
  Enrollment: mongoose.model('Enrollment', enrollmentSchema),
  Certification: mongoose.model('Certification', certificationSchema)
};
