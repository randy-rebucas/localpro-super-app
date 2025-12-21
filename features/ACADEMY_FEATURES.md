# Academy Features Documentation

## Overview

The Academy feature provides a comprehensive online learning platform for the LocalPro Super App. It enables course creation, enrollment management, progress tracking, and certification issuance for professional development and skill enhancement across various service industries. The platform supports instructors in creating rich multimedia courses and students in accessing flexible, self-paced learning experiences.

## Base Path
`/api/academy`

---

## Core Features

### 1. Course Management
- **Course Creation** - Instructors and admins can create comprehensive courses with multimedia content
- **Course Updates** - Modify course details, curriculum, pricing, and content
- **Course Deletion** - Soft delete courses (archive functionality)
- **Content Organization** - Structured curriculum with modules and lessons
- **Multimedia Support** - Upload videos, documents, images, and text content
- **Thumbnail Management** - Upload and manage course thumbnails
- **Course Status** - Control course visibility (draft, published, archived)
- **Pricing Management** - Set regular and discounted pricing with currency support
- **Enrollment Capacity** - Manage maximum enrollment and open/close enrollment

### 2. Course Discovery & Browsing
- **Browse Courses** - Paginated listing of all available courses
- **Advanced Filtering** - Filter by:
  - Category (cleaning, plumbing, electrical, moving, business, safety, certification)
  - Level (beginner, intermediate, advanced, expert)
  - Instructor
  - Search keywords
- **Featured Courses** - View featured/promoted courses
- **Category Browsing** - Browse courses by category with counts
- **Course Details** - Comprehensive course information including:
  - Full description and curriculum
  - Instructor profile
  - Pricing and enrollment status
  - Reviews and ratings
  - Schedule and sessions
  - Certification information

### 3. Enrollment System
- **Course Enrollment** - Students can enroll in courses
- **Enrollment Tracking** - Track enrollment status and history
- **Progress Monitoring** - Monitor learning progress through courses
- **Completion Tracking** - Track completed lessons and modules
- **Enrollment Status** - Status management (enrolled, in_progress, completed, dropped)
- **Access Control** - Control course access based on enrollment
- **Payment Integration** - Process course enrollment payments

### 4. Progress Tracking
- **Progress Updates** - Update course progress as students learn
- **Lesson Completion** - Track completed lessons with timestamps
- **Module Progress** - Monitor progress through course modules
- **Overall Progress** - Calculate and display overall course completion percentage
- **Last Accessed** - Track last access time for each course
- **Progress Analytics** - Detailed progress reports for students and instructors

### 5. Certification System
- **Certification Availability** - Courses can offer certifications upon completion
- **Certification Details** - Certification name, issuer, and validity period
- **Certification Requirements** - Define requirements for certification (lessons, exams, practical assignments)
- **Certificate Issuance** - Automatic certificate generation upon completion
- **Certificate Management** - Download and manage digital certificates
- **Validity Tracking** - Track certification validity periods

### 6. Review & Rating System
- **Course Reviews** - Students can review completed courses
- **Rating System** - 1-5 star rating system
- **Review Comments** - Detailed feedback and comments
- **Review Display** - Show reviews and ratings on course pages
- **Average Ratings** - Calculate and display average course ratings
- **Review Analytics** - Track review trends and feedback

### 7. Content Management
- **Video Upload** - Upload course videos with metadata
- **Document Management** - Upload and manage course documents
- **Image Management** - Upload images for course content
- **Content Organization** - Organize content by modules and lessons
- **Free Content** - Mark lessons as free preview content
- **Content Types** - Support for video, text, quiz, and practical content types
- **Cloudinary Integration** - Secure cloud storage for all media content

### 8. Instructor Tools
- **Course Dashboard** - View all created courses
- **Enrollment Analytics** - Track enrollment numbers and trends
- **Student Progress** - Monitor student progress in courses
- **Revenue Tracking** - Track course earnings and sales
- **Content Management** - Easy upload and organization of course materials
- **Course Statistics** - Comprehensive course performance metrics

### 9. Student Dashboard
- **My Courses** - View all enrolled courses
- **Progress Overview** - See progress across all courses
- **Completion Status** - Track course completion status
- **Certificates** - Access earned certificates
- **Learning History** - View learning history and achievements

### 10. Analytics & Reporting
- **Course Statistics** - Comprehensive course analytics (Admin)
- **Enrollment Trends** - Track enrollment trends over time
- **Category Distribution** - View course distribution by category
- **Instructor Performance** - Track instructor course performance
- **Student Analytics** - Monitor student engagement and completion rates

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/courses` | Get all courses | `page`, `limit`, `search`, `category`, `level`, `instructor`, `sortBy`, `sortOrder` |
| GET | `/courses/:id` | Get course details | - |
| GET | `/categories` | Get course categories | - |
| GET | `/featured` | Get featured courses | `limit` |

### Authenticated Endpoints - Course Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/courses` | Create course | **instructor, admin** |
| PUT | `/courses/:id` | Update course | **instructor, admin** |
| DELETE | `/courses/:id` | Delete course | **instructor, admin** |
| POST | `/courses/:id/thumbnail` | Upload course thumbnail | **instructor, admin** |
| POST | `/courses/:id/videos` | Upload course video | **instructor, admin** |
| DELETE | `/courses/:id/videos/:videoId` | Delete course video | **instructor, admin** |

### Authenticated Endpoints - Enrollment & Progress

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/courses/:id/enroll` | Enroll in course | AUTHENTICATED |
| PUT | `/courses/:id/progress` | Update course progress | AUTHENTICATED |
| GET | `/my-courses` | Get my enrolled courses | AUTHENTICATED |
| GET | `/my-created-courses` | Get my created courses | **instructor, admin** |

### Authenticated Endpoints - Reviews & Analytics

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/courses/:id/reviews` | Add course review | AUTHENTICATED |
| GET | `/statistics` | Get course statistics | **admin** |

---

## Request/Response Examples

### Create Course (Instructor)

```http
POST /api/academy/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced Plumbing Techniques",
  "description": "Master advanced plumbing skills and troubleshooting for complex systems",
  "category": "plumbing",
  "level": "advanced",
  "duration": {
    "hours": 12,
    "weeks": 3
  },
  "pricing": {
    "regularPrice": 149.99,
    "discountedPrice": 119.99,
    "currency": "USD"
  },
  "curriculum": [
    {
      "module": "Advanced Pipe Systems",
      "lessons": [
        {
          "title": "Complex Pipe Configurations",
          "description": "Understanding complex pipe systems and layouts",
          "duration": 90,
          "type": "video",
          "isFree": false
        }
      ]
    }
  ],
  "prerequisites": ["Basic plumbing knowledge", "Safety certification"],
  "learningOutcomes": [
    "Master advanced plumbing techniques",
    "Troubleshoot complex issues",
    "Understand code requirements"
  ],
  "certification": {
    "isAvailable": true,
    "name": "Advanced Plumbing Certificate",
    "issuer": "LocalPro Academy",
    "validity": 36,
    "requirements": ["Complete all lessons", "Pass practical exam"]
  },
  "enrollment": {
    "maxCapacity": 30,
    "isOpen": true
  },
  "schedule": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-22T00:00:00.000Z"
  },
  "tags": ["plumbing", "advanced", "techniques", "troubleshooting"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "title": "Advanced Plumbing Techniques",
    "description": "Master advanced plumbing skills and troubleshooting",
    "category": "plumbing",
    "level": "advanced",
    "instructor": "60f7b3b3b3b3b3b3b3b3b3b4",
    "duration": {
      "hours": 12,
      "weeks": 3
    },
    "pricing": {
      "regularPrice": 149.99,
      "discountedPrice": 119.99,
      "currency": "USD"
    },
    "enrollment": {
      "current": 0,
      "maxCapacity": 30,
      "isOpen": true
    },
    "rating": {
      "average": 0,
      "count": 0
    },
    "isActive": true,
    "createdAt": "2025-09-20T10:30:00.000Z",
    "updatedAt": "2025-09-20T10:30:00.000Z"
  }
}
```

### Enroll in Course

```http
POST /api/academy/courses/:id/enroll
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "user": "60f7b3b3b3b3b3b3b3b3b3b6",
    "course": "60f7b3b3b3b3b3b3b3b3b3b3",
    "enrolledAt": "2025-09-20T10:30:00.000Z",
    "progress": 0,
    "status": "enrolled"
  }
}
```

### Update Course Progress

```http
PUT /api/academy/courses/:id/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "progress": 75,
  "completedLessons": [
    {
      "lessonId": "lesson1",
      "completedAt": "2025-09-20T10:30:00.000Z"
    },
    {
      "lessonId": "lesson2",
      "completedAt": "2025-09-20T11:30:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course progress updated successfully",
  "data": {
    "progress": 75,
    "completedLessons": [
      {
        "lessonId": "lesson1",
        "completedAt": "2025-09-20T10:30:00.000Z"
      },
      {
        "lessonId": "lesson2",
        "completedAt": "2025-09-20T11:30:00.000Z"
      }
    ],
    "lastAccessed": "2025-09-20T11:30:00.000Z",
    "status": "in_progress"
  }
}
```

### Upload Course Thumbnail

```http
POST /api/academy/courses/:id/thumbnail
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "thumbnail": <file>
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thumbnail uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/example/image/upload/v1234567890/thumbnail.jpg",
    "publicId": "thumbnail_1234567890",
    "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/thumbnail.jpg"
  }
}
```

### Upload Course Video

```http
POST /api/academy/courses/:id/videos
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "video": <file>,
  "title": "Lesson Title",
  "duration": 90
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "title": "Lesson Title",
    "url": "https://res.cloudinary.com/example/video/upload/v1234567890/lesson_video.mp4",
    "publicId": "lesson_video_1234567890",
    "duration": 90,
    "order": 1
  }
}
```

### Add Course Review

```http
POST /api/academy/courses/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent course! Very informative and well-structured."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "user": "60f7b3b3b3b3b3b3b3b3b3b6",
    "rating": 5,
    "comment": "Excellent course! Very informative and well-structured.",
    "createdAt": "2025-09-20T10:30:00.000Z"
  }
}
```

---

## Course Enrollment Flow

### 1. Course Discovery
- Student browses courses via `/courses` endpoint
- Student applies filters by category, level, instructor, etc.
- Student views detailed course information
- Student checks instructor profile and course reviews

### 2. Enrollment
- Student enrolls in course via `/courses/:id/enroll`
- Payment processed (if paid course)
- Enrollment record created with status `enrolled`
- Access granted to course content
- Email notification sent

### 3. Learning
- Student accesses course content
- Student watches videos and completes lessons
- Progress tracked automatically via `/courses/:id/progress`
- Status updates: `enrolled` → `in_progress`
- Last accessed time updated

### 4. Completion
- Student completes all modules and lessons
- Progress reaches 100%
- Status updates: `in_progress` → `completed`
- Certificate issued (if certification available)
- Student can add review and rating

---

## Course Status Flow

```
draft → published → archived
```

**Status Details:**
- **draft** - Course being created, not visible to students
- **published** - Course available for enrollment
- **archived** - Course no longer available for new enrollments

---

## Enrollment Status Flow

```
enrolled → in_progress → completed
```

**Status Details:**
- **enrolled** - Student has enrolled, not yet started
- **in_progress** - Student is actively learning
- **completed** - Student has completed all course content
- **dropped** - Enrollment cancelled

---

## Course Categories

### Professional Skills
- **Cleaning** - Residential and commercial cleaning techniques
- **Plumbing** - Basic and advanced plumbing skills
- **Electrical** - Electrical safety and repair techniques
- **Moving** - Professional moving and logistics

### Business Development
- **Business** - Entrepreneurship and business management
- **Safety** - Workplace safety and compliance
- **Certification** - Professional certification programs

---

## Course Levels

### Beginner
- **Description**: Introduction to basic concepts and techniques
- **Duration**: 2-4 hours typically
- **Prerequisites**: None
- **Target Audience**: New professionals or those exploring the field

### Intermediate
- **Description**: Building on basic knowledge with practical applications
- **Duration**: 4-8 hours typically
- **Prerequisites**: Basic understanding or completion of beginner courses
- **Target Audience**: Working professionals looking to improve skills

### Advanced
- **Description**: Complex techniques and specialized knowledge
- **Duration**: 8-16 hours typically
- **Prerequisites**: Intermediate level knowledge and experience
- **Target Audience**: Experienced professionals seeking specialization

### Expert
- **Description**: Mastery level knowledge and leadership skills
- **Duration**: 16+ hours typically
- **Prerequisites**: Advanced level knowledge and significant experience
- **Target Audience**: Senior professionals and instructors

---

## Data Models

### Course Model

```javascript
{
  // Basic Information
  title: String,                    // Required, 3-100 characters
  description: String,             // Required, minimum 50 characters
  category: String,                // Required, enum: cleaning, plumbing, electrical, moving, business, safety, certification
  instructor: ObjectId,            // Required, User reference
  partner: {
    name: String,                  // Partner organization name
    logo: String,                   // Partner logo URL
    website: String                 // Partner website
  },
  level: String,                   // Required, enum: beginner, intermediate, advanced, expert
  duration: {
    hours: Number,                  // Required, positive number
    weeks: Number                   // Optional
  },
  
  // Pricing
  pricing: {
    regularPrice: Number,          // Required, positive number
    discountedPrice: Number,       // Optional
    currency: String               // Default: USD
  },
  
  // Course Content Structure
  curriculum: [{
    module: String,                // Required, module name
    lessons: [{
      title: String,              // Lesson title
      description: String,       // Lesson description
      duration: Number,            // Duration in minutes
      type: String,               // enum: video, text, quiz, practical
      content: {
        url: String,              // Content URL
        publicId: String,         // Cloudinary public ID
        type: String             // Content type
      },
      isFree: Boolean            // Free preview option
    }]
  }],
  prerequisites: [String],        // Required prerequisites
  learningOutcomes: [String],     // Expected learning outcomes
  
  // Certification Information
  certification: {
    isAvailable: Boolean,         // Default: false
    name: String,                 // Certification name
    issuer: String,               // Issuing organization
    validity: Number,             // Validity in months
    requirements: [String]         // Certification requirements
  },
  
  // Enrollment Management
  enrollment: {
    current: Number,              // Current enrollment count
    maxCapacity: Number,         // Maximum enrollment
    isOpen: Boolean              // Enrollment open/closed
  },
  
  // Course Schedule
  schedule: {
    startDate: Date,             // Course start date
    endDate: Date,               // Course end date
    sessions: [{
      date: Date,                // Session date
      startTime: String,         // Start time
      endTime: String,          // End time
      type: String              // enum: live, recorded, practical
    }]
  },
  
  // Rating and Reviews
  rating: {
    average: Number,             // Average rating (0-5)
    count: Number                // Review count
  },
  
  // Media Content
  thumbnail: {
    url: String,                 // Thumbnail URL
    publicId: String,            // Cloudinary public ID
    thumbnail: String           // Thumbnail variant URL
  },
  tags: [String],                // Course tags
  
  // Status
  isActive: Boolean,             // Course active status
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

### Enrollment Model

```javascript
{
  user: ObjectId,                // Student user reference
  course: ObjectId,              // Course reference
  enrolledAt: Date,             // Enrollment timestamp
  progress: Number,              // Progress percentage (0-100)
  completedLessons: [{
    lessonId: String,            // Lesson identifier
    completedAt: Date           // Completion timestamp
  }],
  status: String,                // enum: enrolled, in_progress, completed, dropped
  lastAccessed: Date,           // Last access timestamp
  payment: {
    amount: Number,              // Payment amount
    currency: String,           // Currency code
    transactionId: String,      // Payment transaction ID
    status: String              // Payment status
  },
  certificate: {
    issued: Boolean,            // Certificate issued flag
    issuedAt: Date,             // Issue timestamp
    certificateId: String,     // Certificate reference
    downloadUrl: String         // Certificate download URL
  }
}
```

### Certification Model

```javascript
{
  name: String,                  // Certification name
  description: String,           // Certification description
  issuer: String,                // Issuing organization
  validity: Number,              // Validity in months
  requirements: {
    courseCompletion: Boolean,   // Complete course requirement
    exam: {
      required: Boolean,         // Exam required
      passingScore: Number,      // Passing score percentage
      questionBank: [{
        question: String,        // Question text
        options: [String],       // Answer options
        correctAnswer: Number,   // Correct answer index
        points: Number          // Question points
      }]
    },
    practical: {
      required: Boolean,        // Practical required
      description: String       // Practical description
    },
    experience: {
      required: Boolean,        // Experience required
      years: Number             // Required years
    }
  },
  status: String,                // enum: active, inactive
  createdAt: Date,
  updatedAt: Date
}
```

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Search:**
- `search` - Full-text search across title, description, tags

**Filters:**
- `category` - Filter by course category
- `level` - Filter by course level
- `instructor` - Filter by instructor ID

**Sorting:**
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: asc/desc (default: desc)

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

**Detail Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

## Key Metrics

- **Total Courses** - Total number of courses
- **Courses by Category** - Course distribution by category
- **Total Enrollments** - Total enrollment count
- **Enrollment Trends** - Monthly enrollment trends
- **Completion Rate** - Course completion percentage
- **Average Rating** - Average course ratings
- **Instructor Performance** - Courses and enrollments per instructor
- **Revenue** - Course sales and earnings

---

## Related Features

The Academy feature integrates with several other features in the LocalPro Super App:

- **User Management** - Instructor and student profiles
- **Providers** - Instructor profiles and management
- **Finance** - Course payment processing
- **File Storage** - Cloudinary integration for course content
- **Email Service** - Enrollment notifications and course updates
- **Analytics** - Course performance and student progress tracking
- **Certification System** - Digital certificate generation and management
- **Reviews & Ratings** - Course review system

---

## Common Use Cases

1. **Course Creation** - Instructors create comprehensive courses with multimedia content
2. **Course Discovery** - Students browse and search for courses
3. **Course Enrollment** - Students enroll in courses with payment processing
4. **Learning** - Students access course content and track progress
5. **Course Completion** - Students complete courses and receive certificates
6. **Course Reviews** - Students review and rate completed courses
7. **Instructor Analytics** - Instructors monitor course performance and student progress

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (course doesn't exist)
- `409` - Conflict (already enrolled, enrollment closed)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

## Rate Limiting

- **Course Creation**: 10 requests per hour per instructor
- **Video Upload**: 20 requests per hour per instructor
- **Enrollment**: 50 requests per hour per student
- **Progress Updates**: 100 requests per hour per student

---

## Validation Rules

### Course Validation
- **Title**: Required, 3-100 characters
- **Description**: Required, minimum 50 characters
- **Category**: Must be one of the defined categories
- **Level**: Must be one of the defined levels
- **Instructor**: Must be a valid User ID with instructor role
- **Duration**: Hours required, must be positive
- **Pricing**: Regular price required, must be positive

### Enrollment Validation
- **Student**: Must be a valid User ID
- **Course**: Must be a valid Course ID
- **Status**: Must be one of the defined statuses
- **Progress**: Must be between 0 and 100

### Review Validation
- **Rating**: Required, must be between 1 and 5
- **Comment**: Optional, maximum 500 characters
- **Course Completion**: Student must have completed the course

---

*For detailed implementation guidance, see the individual documentation files in the `features/academy/` and `docs/features/` directories.*

