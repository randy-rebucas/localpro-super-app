# Courses Data Entities

## Overview

The Courses feature uses three main data entities to manage courses, enrollments, and certifications. These entities are designed to support a comprehensive learning management system with structured curricula, progress tracking, and certification issuance.

## 🎓 Course Entity

The main entity representing course offerings in the academy.

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
  
  // Classification
  category: {
    type: String,
    enum: ['cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'],
    required: true
  },
  
  // Instructor Information
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Partner Information
  partner: {
    name: String, // e.g., "TES" (Technical Education Services)
    logo: String,
    website: String
  },
  
  // Course Level
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  
  // Duration Information
  duration: {
    hours: {
      type: Number,
      required: true
    },
    weeks: Number
  },
  
  // Pricing Structure
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
  
  // Curriculum Structure
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
  
  // Prerequisites and Learning Outcomes
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
  
  // Schedule Information
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
  
  // Rating System
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
  
  // Status and Media
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
```

### Key Features

- **Comprehensive Course Info** - Title, description, and detailed specifications
- **Category System** - Professional category classification
- **Instructor Assignment** - Direct instructor reference
- **Partner Integration** - Support for educational partners
- **Level System** - Beginner to expert levels
- **Flexible Pricing** - Regular and discounted pricing options
- **Structured Curriculum** - Module-based curriculum with multiple lesson types
- **Prerequisites** - Course prerequisite requirements
- **Learning Outcomes** - Expected learning outcomes
- **Certification Support** - Built-in certification information
- **Enrollment Management** - Capacity and enrollment status tracking
- **Schedule Management** - Start/end dates and session scheduling
- **Rating System** - Average rating and review count

### Indexes

```javascript
// Core indexes
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ 'schedule.startDate': 1 });

// Advanced filtering indexes
courseSchema.index({ 'enrollment.isOpen': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, category: 1 });
courseSchema.index({ 'certification.isAvailable': 1, category: 1 });
courseSchema.index({ createdAt: -1, isActive: 1 });
courseSchema.index({ updatedAt: -1, isActive: 1 });
courseSchema.index({ category: 1, level: 1, isActive: 1 });
courseSchema.index({ instructor: 1, isActive: 1, category: 1 });
courseSchema.index({ 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, 'pricing.discountedPrice': 1, isActive: 1 });
courseSchema.index({ 'certification.isAvailable': 1, 'certification.issuer': 1, isActive: 1 });
courseSchema.index({ 'partner.name': 1, isActive: 1 });
courseSchema.index({ prerequisites: 1, isActive: 1 });
courseSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1, isActive: 1 });
courseSchema.index({ tags: 1, isActive: 1 });

// Text search index
courseSchema.index({
  title: 'text',
  description: 'text',
  'learningOutcomes': 'text',
  tags: 'text'
});
```

## 📋 Enrollment Entity

The entity representing individual student enrollments with progress tracking.

### Schema Definition

```javascript
const enrollmentSchema = new mongoose.Schema({
  // Student Reference
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Course Reference
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Enrollment Date
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  
  // Enrollment Status
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
  
  // Certificate Information
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

- **Student-Course Relationship** - Direct reference to student and course
- **Status Tracking** - Enrollment status from enrolled to completed
- **Progress Tracking** - Lesson completion and overall progress percentage
- **Payment Management** - Payment status and transaction tracking
- **Certificate Issuance** - Certificate generation and download tracking

### Indexes

```javascript
// Core indexes
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });

// Advanced filtering indexes
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, course: 1, status: 1 }); // Unique enrollment check
enrollmentSchema.index({ 'progress.overallProgress': 1, status: 1 }); // Progress tracking
enrollmentSchema.index({ 'certificate.issuedAt': -1, status: 1 }); // Certificate tracking
```

## 🏆 Certification Entity

The entity representing certification programs with exam requirements.

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
  
  // Issuer Information
  issuer: {
    type: String,
    required: true
  },
  
  // Category Classification
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
  
  // Validity Information
  validity: {
    duration: Number, // in months
    renewable: { type: Boolean, default: true }
  },
  
  // Exam Information
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

- **Certification Details** - Name, description, and issuer information
- **Category Classification** - Categorization by professional area
- **Flexible Requirements** - Multiple requirement types (course, exam, practical, experience)
- **Validity Management** - Duration and renewal information
- **Exam System** - Built-in exam with questions and passing scores

### Indexes

```javascript
// Core indexes
certificationSchema.index({ category: 1 });
certificationSchema.index({ issuer: 1 });
certificationSchema.index({ isActive: 1 });

// Advanced filtering indexes
certificationSchema.index({ category: 1, isActive: 1 });
certificationSchema.index({ 'requirements.type': 1, isActive: 1 });
certificationSchema.index({ 'validity.duration': 1, isActive: 1 });
```

## 🔗 Relationships

### Course Relationships
- **Instructor** → `User` (Many-to-One)
- **Enrollments** → `Enrollment` (One-to-Many, via course reference)
- **Certifications** → `Certification` (Many-to-Many, via requirements)

### Enrollment Relationships
- **Student** → `User` (Many-to-One)
- **Course** → `Course` (Many-to-One)
- **Certificate** → `Certification` (One-to-One, via certificate reference)

### Certification Relationships
- **Requirements** → `Course` (Many-to-Many, via course completion requirements)

## 📊 Data Validation

### Course Validation
- **Required Fields**: title, description, category, instructor, level, duration.hours, pricing.regularPrice
- **Enum Values**: category, level, lesson.type, session.type
- **Numeric Ranges**: duration.hours (≥0), rating.average (0-5), enrollment.current (≥0)

### Enrollment Validation
- **Required Fields**: student, course
- **Status Enums**: status, payment.status
- **Progress Validation**: progress.overallProgress (0-100)
- **Date Validation**: enrollmentDate, paidAt, certificate.issuedAt

### Certification Validation
- **Required Fields**: name, description, issuer, category
- **Requirement Types**: course_completion, exam, practical, experience
- **Exam Validation**: passingScore (0-100), exam duration (≥0)

## 🚀 Performance Considerations

### Query Optimization
- **Compound Indexes** - Multi-field indexes for complex filtering
- **Text Search** - Full-text search across course fields
- **Pagination** - Efficient large dataset handling
- **Populate Optimization** - Selective field population

### Caching Strategy
- **Course Listings** - Cache frequently accessed course lists
- **Category Data** - Cache category aggregations
- **Search Results** - Cache search queries and filters
- **Progress Data** - Cache student progress for quick access

### Data Consistency
- **Status Updates** - Atomic operations for enrollment status changes
- **Progress Calculation** - Automatic progress percentage updates
- **Rating Calculation** - Automatic average rating updates
- **Enrollment Limits** - Validation of enrollment capacity

---

*This documentation covers the core data structures. For API usage and implementation examples, see the related documentation files.*
