# Academy Feature

## Overview

The Academy feature provides a comprehensive online learning platform for the LocalPro Super App. This feature enables course creation, enrollment management, progress tracking, and certification issuance for professional development and skill enhancement across various service industries.

## Key Features

- **Course Management**: Create, update, and manage comprehensive courses with multimedia content
- **Enrollment System**: Student enrollment with progress tracking and completion management
- **Certification Programs**: Issue and manage professional certifications upon course completion
- **Instructor Tools**: Comprehensive tools for course creators and instructors
- **Progress Tracking**: Detailed progress monitoring for students and instructors
- **Content Management**: Upload and manage course videos, documents, and materials
- **Review System**: Student reviews and ratings for courses
- **Analytics**: Course performance and enrollment analytics

## Documentation Structure

This feature documentation is organized into the following sections:

- **[Data Entities](data-entities.md)** - Detailed schema documentation for Course, Enrollment, and Certification models
- **[API Endpoints](api-endpoints.md)** - Complete API reference with request/response examples
- **[Usage Examples](usage-examples.md)** - Practical implementation examples and code snippets
- **[Best Practices](best-practices.md)** - Development guidelines and recommended patterns

## Quick Start

### Course Creation
```javascript
// Create a new course
const response = await fetch('/api/academy/courses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Professional Cleaning Techniques',
    description: 'Learn advanced cleaning methods and best practices',
    category: 'cleaning',
    level: 'intermediate',
    duration: { hours: 8, weeks: 2 },
    pricing: { regularPrice: 99.99, currency: 'USD' },
    curriculum: [
      {
        module: 'Introduction to Professional Cleaning',
        lessons: [
          {
            title: 'Safety First',
            description: 'Essential safety protocols',
            duration: 30,
            type: 'video'
          }
        ]
      }
    ]
  })
});
```

### Course Enrollment
```javascript
// Enroll in a course
const response = await fetch('/api/academy/courses/:courseId/enroll', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Progress Tracking
```javascript
// Update course progress
const response = await fetch('/api/academy/courses/:courseId/progress', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    progress: 75,
    completedLessons: ['lesson1', 'lesson2', 'lesson3']
  })
});
```

## Data Models

### Course
The main course model containing all course information and content:

- **Basic Information**: Title, description, category, level, instructor
- **Content Structure**: Curriculum with modules and lessons
- **Pricing**: Regular and discounted pricing with currency support
- **Enrollment**: Current enrollment count and capacity management
- **Schedule**: Course start/end dates and session scheduling
- **Certification**: Certification availability and requirements
- **Media**: Thumbnail and video content management
- **Reviews**: Student reviews and ratings

### Enrollment
Student enrollment tracking and progress management:

- **Student Information**: Reference to enrolled student
- **Course Information**: Reference to enrolled course
- **Progress Tracking**: Completed lessons and overall progress
- **Payment**: Enrollment payment status and transaction details
- **Certification**: Certificate issuance and download information
- **Status Management**: Enrollment status and completion tracking

### Certification
Professional certification management:

- **Certification Details**: Name, description, issuer information
- **Requirements**: Course completion, exam, practical, experience requirements
- **Validity**: Duration and renewal information
- **Exam System**: Question bank and passing score requirements
- **Status Management**: Active/inactive certification status

## API Endpoints

### Course Management
- `GET /api/academy/courses` - Get all courses with filtering
- `GET /api/academy/courses/:id` - Get single course details
- `POST /api/academy/courses` - Create new course (Instructor/Admin)
- `PUT /api/academy/courses/:id` - Update course (Instructor/Admin)
- `DELETE /api/academy/courses/:id` - Delete course (Instructor/Admin)
- `GET /api/academy/categories` - Get course categories
- `GET /api/academy/featured` - Get featured courses

### Content Management
- `POST /api/academy/courses/:id/thumbnail` - Upload course thumbnail
- `POST /api/academy/courses/:id/videos` - Upload course video
- `DELETE /api/academy/courses/:id/videos/:videoId` - Delete course video

### Enrollment Management
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `PUT /api/academy/courses/:id/progress` - Update course progress
- `GET /api/academy/my-courses` - Get user's enrolled courses
- `GET /api/academy/my-created-courses` - Get instructor's created courses

### Reviews and Analytics
- `POST /api/academy/courses/:id/reviews` - Add course review
- `GET /api/academy/statistics` - Get course statistics (Admin)

## Course Categories

### Professional Skills
- **Cleaning**: Residential and commercial cleaning techniques
- **Plumbing**: Basic and advanced plumbing skills
- **Electrical**: Electrical safety and repair techniques
- **Moving**: Professional moving and logistics

### Business Development
- **Business**: Entrepreneurship and business management
- **Safety**: Workplace safety and compliance
- **Certification**: Professional certification programs

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

## Key Benefits

1. **Professional Development**: Comprehensive skill development across service industries
2. **Certification Programs**: Industry-recognized certifications for career advancement
3. **Flexible Learning**: Self-paced learning with progress tracking
4. **Instructor Tools**: Powerful tools for course creation and management
5. **Progress Monitoring**: Detailed tracking for students and instructors
6. **Content Management**: Easy upload and organization of course materials
7. **Review System**: Community-driven course quality assurance
8. **Analytics**: Data-driven insights for course improvement

## Integration Points

- **User Management**: Integration with user profiles and roles
- **Payment System**: Course enrollment and certification fees
- **File Storage**: Cloudinary integration for course content
- **Email Service**: Enrollment notifications and course updates
- **Analytics**: Course performance and student progress tracking
- **Certification System**: Digital certificate generation and management

## Getting Started

1. Review the [Data Entities](data-entities.md) documentation to understand the course data structure
2. Check the [API Endpoints](api-endpoints.md) for available operations
3. Use the [Usage Examples](usage-examples.md) for implementation guidance
4. Follow the [Best Practices](best-practices.md) for optimal implementation

For more detailed information, explore the individual documentation files in this directory.
