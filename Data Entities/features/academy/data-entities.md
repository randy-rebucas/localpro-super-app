# Academy Data Entities

## Overview

The Academy feature uses three primary data models: `Course`, `Enrollment`, and `Certification`. These models work together to provide a comprehensive online learning platform with course management, student enrollment, progress tracking, and certification issuance.

## Course Model

### Schema Definition

```javascript
const courseSchema = new mongoose.Schema({
  // Basic Information
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

  // Course Content Structure
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

  // Certification Information
  certification: {
    isAvailable: { type: Boolean, default: false },
    name: String,
    issuer: String,
    validity: Number, // in months
    requirements: [String]
  },

  // Enrollment Management
  enrollment: {
    current: { type: Number, default: 0 },
    maxCapacity: Number,
    isOpen: { type: Boolean, default: true }
  },

  // Course Schedule
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

  // Rating and Reviews
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

  // Course Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Media Content
  thumbnail: {
    url: String,
    publicId: String,
    thumbnail: String
  },
  tags: [String]
}, {
  timestamps: true
});
```

### Key Features

#### Basic Information
- **Title**: Course title for identification and display
- **Description**: Detailed course description and overview
- **Category**: Course category for organization and filtering
- **Instructor**: Reference to course instructor/creator
- **Partner**: External partner organization information
- **Level**: Course difficulty level (beginner to expert)
- **Duration**: Course duration in hours and weeks

#### Content Structure
- **Curriculum**: Modular course structure with lessons
- **Lesson Types**: Video, text, quiz, and practical lessons
- **Content Management**: URL and Cloudinary integration for media
- **Free Content**: Option to mark lessons as free
- **Prerequisites**: Required knowledge or courses
- **Learning Outcomes**: Expected learning results

#### Pricing and Enrollment
- **Pricing**: Regular and discounted pricing options
- **Currency Support**: Multi-currency pricing support
- **Enrollment Management**: Current enrollment and capacity tracking
- **Enrollment Status**: Open/closed enrollment control

#### Schedule and Sessions
- **Course Dates**: Start and end date management
- **Session Planning**: Individual session scheduling
- **Session Types**: Live, recorded, and practical sessions
- **Time Management**: Start and end time tracking

#### Quality and Reviews
- **Rating System**: Average rating and review count
- **Review Management**: Student review collection and display
- **Quality Metrics**: Course performance indicators

### Database Indexes

#### Performance Indexes
```javascript
// Basic indexes
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ 'schedule.startDate': 1 });

// Enrollment and capacity indexes
courseSchema.index({ 'enrollment.isOpen': 1, isActive: 1 });
courseSchema.index({ 'enrollment.maxCapacity': 1, isActive: 1 });

// Pricing indexes
courseSchema.index({ 'pricing.regularPrice': 1, category: 1 });
courseSchema.index({ 'pricing.discountedPrice': 1, isActive: 1 });

// Certification indexes
courseSchema.index({ 'certification.isAvailable': 1, category: 1 });
courseSchema.index({ 'certification.issuer': 1, isActive: 1 });

// Partner and content indexes
courseSchema.index({ 'partner.name': 1, isActive: 1 });
courseSchema.index({ prerequisites: 1, isActive: 1 });
courseSchema.index({ tags: 1, isActive: 1 });

// Schedule indexes
courseSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1, isActive: 1 });

// Text search index
courseSchema.index({
  title: 'text',
  description: 'text',
  'learningOutcomes': 'text',
  tags: 'text'
});
```

## Enrollment Model

### Schema Definition

```javascript
const enrollmentSchema = new mongoose.Schema({
  // Student Information
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

  // Progress Tracking
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

  // Payment Information
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

  // Certification
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
```

### Key Features

#### Student Management
- **Student Reference**: Link to enrolled student
- **Course Reference**: Link to enrolled course
- **Enrollment Date**: When the student enrolled
- **Status Tracking**: Current enrollment status

#### Progress Tracking
- **Lesson Completion**: Individual lesson completion tracking
- **Overall Progress**: Percentage completion of entire course
- **Completion Timestamps**: When each lesson was completed
- **Progress History**: Detailed progress tracking over time

#### Payment Management
- **Payment Amount**: Course enrollment fee
- **Currency Support**: Multi-currency payment support
- **Payment Status**: Pending, paid, or refunded status
- **Transaction Tracking**: Payment transaction ID and date

#### Certification
- **Certificate Issuance**: Digital certificate generation
- **Certificate Download**: Download URL for certificate
- **Issuance Tracking**: When certificate was issued
- **Certificate ID**: Unique certificate identifier

### Database Indexes

#### Performance Indexes
```javascript
// Basic indexes
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });

// Compound indexes
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, course: 1, status: 1 });

// Progress tracking indexes
enrollmentSchema.index({ 'progress.completedLessons': 1, status: 1 });
enrollmentSchema.index({ 'progress.overallProgress': 1, status: 1 });

// Certificate tracking indexes
enrollmentSchema.index({ 'certificate.issuedAt': -1, status: 1 });
enrollmentSchema.index({ 'certificate.issued': 1, status: 1 });

// Payment tracking indexes
enrollmentSchema.index({ 'payment.status': 1, 'payment.paidAt': -1 });
enrollmentSchema.index({ 'payment.transactionId': 1 });
```

## Certification Model

### Schema Definition

```javascript
const certificationSchema = new mongoose.Schema({
  // Basic Information
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

  // Requirements
  requirements: [{
    type: {
      type: String,
      enum: ['course_completion', 'exam', 'practical', 'experience'],
      required: true
    },
    description: String,
    value: String // e.g., "80%" for exam, "2 years" for experience
  }],

  // Validity
  validity: {
    duration: Number, // in months
    renewable: { type: Boolean, default: true }
  },

  // Exam System
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

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
```

### Key Features

#### Certification Details
- **Name**: Certification title and identifier
- **Description**: Detailed certification description
- **Issuer**: Organization issuing the certification
- **Category**: Certification category for organization

#### Requirements System
- **Multiple Requirement Types**: Course completion, exam, practical, experience
- **Flexible Requirements**: Configurable requirement values
- **Requirement Descriptions**: Detailed requirement explanations
- **Value Tracking**: Specific values for each requirement type

#### Validity Management
- **Duration**: Certification validity period in months
- **Renewal**: Whether certification can be renewed
- **Expiration Tracking**: Automatic expiration management

#### Exam System
- **Exam Requirements**: Whether exam is required
- **Exam Duration**: Time limit for exam completion
- **Passing Score**: Minimum score required to pass
- **Question Bank**: Multiple choice questions with explanations
- **Answer Validation**: Correct answer tracking

### Database Indexes

#### Performance Indexes
```javascript
// Basic indexes
certificationSchema.index({ category: 1 });
certificationSchema.index({ issuer: 1 });
certificationSchema.index({ isActive: 1 });

// Compound indexes
certificationSchema.index({ category: 1, isActive: 1 });
certificationSchema.index({ issuer: 1, isActive: 1 });

// Requirements indexes
certificationSchema.index({ 'requirements.type': 1, isActive: 1 });
certificationSchema.index({ 'requirements.value': 1, isActive: 1 });

// Validity indexes
certificationSchema.index({ 'validity.duration': 1, isActive: 1 });
certificationSchema.index({ 'validity.renewable': 1, isActive: 1 });

// Exam indexes
certificationSchema.index({ 'exam.isRequired': 1, isActive: 1 });
certificationSchema.index({ 'exam.passingScore': 1, isActive: 1 });
```

## Data Relationships

### Course Relationships
- **Instructor**: Many-to-one relationship with User model
- **Enrollments**: One-to-many relationship with Enrollment model
- **Reviews**: Embedded reviews from enrolled students
- **Partner**: Optional relationship with external organizations

### Enrollment Relationships
- **Student**: Many-to-one relationship with User model
- **Course**: Many-to-one relationship with Course model
- **Certificate**: One-to-one relationship with generated certificates

### Certification Relationships
- **Requirements**: Can reference specific courses or exams
- **Issuer**: Relationship with issuing organization
- **Category**: Classification for organization and filtering

## Validation Rules

### Course Validation
- **Title**: Required, trimmed, maximum length validation
- **Description**: Required, minimum length validation
- **Category**: Must be one of the defined categories
- **Level**: Must be one of the defined levels
- **Instructor**: Must be a valid User ID with instructor role
- **Pricing**: Regular price required, discounted price optional
- **Duration**: Hours required, weeks optional

### Enrollment Validation
- **Student**: Must be a valid User ID
- **Course**: Must be a valid Course ID
- **Status**: Must be one of the defined statuses
- **Progress**: Must be between 0 and 100
- **Payment**: Amount and currency validation

### Certification Validation
- **Name**: Required, trimmed, unique validation
- **Description**: Required, minimum length validation
- **Issuer**: Required, trimmed validation
- **Category**: Required, must be valid category
- **Requirements**: Array of valid requirement objects
- **Validity**: Duration must be positive number

## Default Values

### Course Defaults
- **isActive**: true (active by default)
- **enrollment.current**: 0 (no enrollments initially)
- **enrollment.isOpen**: true (open for enrollment)
- **rating.average**: 0 (no rating initially)
- **rating.count**: 0 (no reviews initially)
- **pricing.currency**: 'USD' (US Dollar default)

### Enrollment Defaults
- **enrollmentDate**: Date.now() (current date)
- **status**: 'enrolled' (enrolled status)
- **progress.overallProgress**: 0 (no progress initially)
- **payment.status**: 'pending' (payment pending)
- **payment.currency**: 'USD' (US Dollar default)
- **certificate.issued**: false (no certificate initially)

### Certification Defaults
- **validity.renewable**: true (renewable by default)
- **exam.isRequired**: true (exam required by default)
- **isActive**: true (active by default)

## Performance Considerations

### Query Optimization
- Use `select()` to limit returned fields
- Use `lean()` for read-only operations
- Use `populate()` sparingly and only when needed
- Use aggregation pipelines for complex analytics

### Caching Strategy
- Cache frequently accessed course data
- Use Redis for course statistics and analytics
- Implement cache invalidation on course updates
- Cache enrollment progress data

### Indexing Strategy
- Create compound indexes for common query patterns
- Use sparse indexes for optional fields
- Implement text search indexes for search functionality
- Monitor index usage and performance

This comprehensive data model provides all the functionality needed for a robust online learning platform while maintaining performance and scalability.
