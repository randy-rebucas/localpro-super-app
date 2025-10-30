# Academy API Endpoints

## Overview

The Academy API provides comprehensive endpoints for managing courses, enrollments, and certifications in the online learning platform. All endpoints follow RESTful conventions and return standardized response formats.

## Base URLs

```
/api/academy          # Academy endpoints
```

## Authentication

Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Instructor and Admin endpoints require appropriate role permissions.

## Course Endpoints

### Get All Courses

Retrieve a paginated list of courses with filtering and sorting options.

```http
GET /api/academy/courses
```

**Query Parameters:**
- `search` (string, optional): Text search across title, description, tags
- `category` (string, optional): Filter by course category
- `level` (string, optional): Filter by course level
- `instructor` (string, optional): Filter by instructor ID
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `sortBy` (string, optional): Sort field (default: createdAt)
- `sortOrder` (string, optional): Sort order: asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Professional Cleaning Techniques",
      "description": "Learn advanced cleaning methods and best practices",
      "category": "cleaning",
      "level": "intermediate",
      "instructor": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
          },
          "bio": "Professional cleaning expert with 10+ years experience"
        }
      },
      "duration": {
        "hours": 8,
        "weeks": 2
      },
      "pricing": {
        "regularPrice": 99.99,
        "discountedPrice": 79.99,
        "currency": "USD"
      },
      "enrollment": {
        "current": 25,
        "maxCapacity": 50,
        "isOpen": true
      },
      "rating": {
        "average": 4.8,
        "count": 15
      },
      "thumbnail": {
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/thumbnail.jpg",
        "publicId": "thumbnail_1234567890",
        "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/thumbnail.jpg"
      },
      "tags": ["cleaning", "professional", "techniques"],
      "isActive": true,
      "createdAt": "2023-07-20T10:30:00.000Z",
      "updatedAt": "2023-09-20T10:30:00.000Z"
    }
  ]
}
```

### Get Single Course

Retrieve detailed information about a specific course.

```http
GET /api/academy/courses/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "Professional Cleaning Techniques",
    "description": "Learn advanced cleaning methods and best practices for residential and commercial cleaning",
    "category": "cleaning",
    "level": "intermediate",
    "instructor": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": {
          "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
          "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
        },
        "bio": "Professional cleaning expert with 10+ years experience",
        "rating": 4.9
      }
    },
    "partner": {
      "name": "Technical Education Services",
      "logo": "https://res.cloudinary.com/example/image/upload/v1234567890/tes_logo.png",
      "website": "https://tes.com"
    },
    "duration": {
      "hours": 8,
      "weeks": 2
    },
    "pricing": {
      "regularPrice": 99.99,
      "discountedPrice": 79.99,
      "currency": "USD"
    },
    "curriculum": [
      {
        "module": "Introduction to Professional Cleaning",
        "lessons": [
          {
            "title": "Safety First",
            "description": "Essential safety protocols and equipment",
            "duration": 30,
            "type": "video",
            "content": {
              "url": "https://res.cloudinary.com/example/video/upload/v1234567890/safety_intro.mp4",
              "publicId": "safety_intro_1234567890",
              "type": "video"
            },
            "isFree": true
          },
          {
            "title": "Equipment Overview",
            "description": "Understanding cleaning equipment and tools",
            "duration": 45,
            "type": "video",
            "content": {
              "url": "https://res.cloudinary.com/example/video/upload/v1234567890/equipment_overview.mp4",
              "publicId": "equipment_overview_1234567890",
              "type": "video"
            },
            "isFree": false
          }
        ]
      },
      {
        "module": "Advanced Cleaning Techniques",
        "lessons": [
          {
            "title": "Deep Cleaning Methods",
            "description": "Step-by-step deep cleaning procedures",
            "duration": 60,
            "type": "video",
            "content": {
              "url": "https://res.cloudinary.com/example/video/upload/v1234567890/deep_cleaning.mp4",
              "publicId": "deep_cleaning_1234567890",
              "type": "video"
            },
            "isFree": false
          }
        ]
      }
    ],
    "prerequisites": ["Basic cleaning knowledge", "Safety certification"],
    "learningOutcomes": [
      "Master professional cleaning techniques",
      "Understand safety protocols",
      "Learn equipment operation",
      "Develop efficiency strategies"
    ],
    "certification": {
      "isAvailable": true,
      "name": "Professional Cleaning Certificate",
      "issuer": "LocalPro Academy",
      "validity": 24,
      "requirements": ["Complete all lessons", "Pass final exam", "Submit practical assignment"]
    },
    "enrollment": {
      "current": 25,
      "maxCapacity": 50,
      "isOpen": true
    },
    "schedule": {
      "startDate": "2023-10-01T00:00:00.000Z",
      "endDate": "2023-10-15T00:00:00.000Z",
      "sessions": [
        {
          "date": "2023-10-01T00:00:00.000Z",
          "startTime": "09:00",
          "endTime": "17:00",
          "type": "live"
        },
        {
          "date": "2023-10-08T00:00:00.000Z",
          "startTime": "09:00",
          "endTime": "17:00",
          "type": "live"
        }
      ]
    },
    "rating": {
      "average": 4.8,
      "count": 15
    },
    "thumbnail": {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/thumbnail.jpg",
      "publicId": "thumbnail_1234567890",
      "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/thumbnail.jpg"
    },
    "tags": ["cleaning", "professional", "techniques", "safety"],
    "isActive": true,
    "createdAt": "2023-07-20T10:30:00.000Z",
    "updatedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### Create Course

Create a new course (Instructor/Admin only).

```http
POST /api/academy/courses
Authorization: Bearer <instructor_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Advanced Plumbing Techniques",
  "description": "Master advanced plumbing skills and troubleshooting",
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
          "description": "Understanding complex pipe systems",
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
    "startDate": "2023-11-01T00:00:00.000Z",
    "endDate": "2023-11-22T00:00:00.000Z"
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
    "curriculum": [
      {
        "module": "Advanced Pipe Systems",
        "lessons": [
          {
            "title": "Complex Pipe Configurations",
            "description": "Understanding complex pipe systems",
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
      "current": 0,
      "maxCapacity": 30,
      "isOpen": true
    },
    "schedule": {
      "startDate": "2023-11-01T00:00:00.000Z",
      "endDate": "2023-11-22T00:00:00.000Z",
      "sessions": []
    },
    "rating": {
      "average": 0,
      "count": 0
    },
    "isActive": true,
    "tags": ["plumbing", "advanced", "techniques", "troubleshooting"],
    "createdAt": "2023-09-20T10:30:00.000Z",
    "updatedAt": "2023-09-20T10:30:00.000Z"
  }
}
```

### Update Course

Update an existing course (Instructor/Admin only).

```http
PUT /api/academy/courses/:id
Authorization: Bearer <instructor_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Advanced Plumbing Techniques - Updated",
  "description": "Master advanced plumbing skills and troubleshooting with new techniques",
  "pricing": {
    "regularPrice": 159.99,
    "discountedPrice": 129.99
  },
  "enrollment": {
    "maxCapacity": 40
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    // Updated course object
  }
}
```

### Delete Course

Delete a course (soft delete) (Instructor/Admin only).

```http
DELETE /api/academy/courses/:id
Authorization: Bearer <instructor_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

## Content Management Endpoints

### Upload Course Thumbnail

Upload a thumbnail image for a course.

```http
POST /api/academy/courses/:id/thumbnail
Authorization: Bearer <instructor_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
thumbnail: <file>
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

Upload a video for a course lesson.

```http
POST /api/academy/courses/:id/videos
Authorization: Bearer <instructor_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
video: <file>
title: "Lesson Title"
duration: 90
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

### Delete Course Video

Delete a video from a course.

```http
DELETE /api/academy/courses/:id/videos/:videoId
Authorization: Bearer <instructor_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

## Enrollment Endpoints

### Enroll in Course

Enroll a student in a course.

```http
POST /api/academy/courses/:id/enroll
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "user": "60f7b3b3b3b3b3b3b3b3b3b6",
    "enrolledAt": "2023-09-20T10:30:00.000Z",
    "progress": 0,
    "status": "active"
  }
}
```

### Update Course Progress

Update a student's progress in a course.

```http
PUT /api/academy/courses/:id/progress
Authorization: Bearer <student_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "progress": 75,
  "completedLessons": [
    {
      "lessonId": "lesson1",
      "completedAt": "2023-09-20T10:30:00.000Z"
    },
    {
      "lessonId": "lesson2",
      "completedAt": "2023-09-20T11:30:00.000Z"
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
        "completedAt": "2023-09-20T10:30:00.000Z"
      },
      {
        "lessonId": "lesson2",
        "completedAt": "2023-09-20T11:30:00.000Z"
      }
    ],
    "lastAccessed": "2023-09-20T11:30:00.000Z",
    "status": "in_progress"
  }
}
```

## Review Endpoints

### Add Course Review

Add a review for a completed course.

```http
POST /api/academy/courses/:id/reviews
Authorization: Bearer <student_token>
Content-Type: application/json
```

**Request Body:**
```json
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
    "createdAt": "2023-09-20T10:30:00.000Z"
  }
}
```

## User-Specific Endpoints

### Get My Courses

Get courses enrolled by the current user.

```http
GET /api/academy/my-courses
Authorization: Bearer <student_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by enrollment status

**Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Professional Cleaning Techniques",
      "description": "Learn advanced cleaning methods and best practices",
      "category": "cleaning",
      "level": "intermediate",
      "instructor": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
          }
        }
      },
      "enrollment": {
        "user": "60f7b3b3b3b3b3b3b3b3b3b6",
        "enrolledAt": "2023-09-15T10:30:00.000Z",
        "progress": 75,
        "status": "in_progress",
        "lastAccessed": "2023-09-20T10:30:00.000Z"
      },
      "createdAt": "2023-07-20T10:30:00.000Z",
      "updatedAt": "2023-09-20T10:30:00.000Z"
    }
  ]
}
```

### Get My Created Courses

Get courses created by the current instructor.

```http
GET /api/academy/my-created-courses
Authorization: Bearer <instructor_token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Professional Cleaning Techniques",
      "description": "Learn advanced cleaning methods and best practices",
      "category": "cleaning",
      "level": "intermediate",
      "enrollment": {
        "current": 25,
        "maxCapacity": 50,
        "isOpen": true
      },
      "rating": {
        "average": 4.8,
        "count": 15
      },
      "isActive": true,
      "createdAt": "2023-07-20T10:30:00.000Z",
      "updatedAt": "2023-09-20T10:30:00.000Z"
    }
  ]
}
```

## Public Endpoints

### Get Course Categories

Get available course categories with counts.

```http
GET /api/academy/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "cleaning",
      "count": 15
    },
    {
      "_id": "plumbing",
      "count": 12
    },
    {
      "_id": "electrical",
      "count": 8
    },
    {
      "_id": "business",
      "count": 6
    }
  ]
}
```

### Get Featured Courses

Get featured courses.

```http
GET /api/academy/featured
```

**Query Parameters:**
- `limit` (number, optional): Number of courses to return (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "Professional Cleaning Techniques",
      "description": "Learn advanced cleaning methods and best practices",
      "category": "cleaning",
      "level": "intermediate",
      "instructor": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
            "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
          }
        }
      },
      "rating": {
        "average": 4.8,
        "count": 15
      },
      "thumbnail": {
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/thumbnail.jpg",
        "thumbnail": "https://res.cloudinary.com/example/image/upload/w_300,h_200,c_fill/thumbnail.jpg"
      },
      "createdAt": "2023-07-20T10:30:00.000Z"
    }
  ]
}
```

## Admin Endpoints

### Get Course Statistics

Get comprehensive course statistics (Admin only).

```http
GET /api/academy/statistics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 50,
    "coursesByCategory": [
      {
        "_id": "cleaning",
        "count": 15
      },
      {
        "_id": "plumbing",
        "count": 12
      },
      {
        "_id": "electrical",
        "count": 8
      }
    ],
    "totalEnrollments": 1250,
    "monthlyTrends": [
      {
        "_id": {
          "year": 2023,
          "month": 7
        },
        "count": 5
      },
      {
        "_id": {
          "year": 2023,
          "month": 8
        },
        "count": 8
      },
      {
        "_id": {
          "year": 2023,
          "month": 9
        },
        "count": 12
      }
    ]
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid course ID format"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Not authorized to update this course"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Course not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "You are already enrolled in this course"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

## Rate Limiting

- **Course Creation**: 10 requests per hour per instructor
- **Video Upload**: 20 requests per hour per instructor
- **Enrollment**: 50 requests per hour per student
- **Progress Updates**: 100 requests per hour per student

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

## Examples

### Complete Course Creation Flow

```javascript
// 1. Create course
const createCourse = async (courseData) => {
  const response = await fetch('/api/academy/courses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${instructorToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(courseData)
  });
  
  return await response.json();
};

// 2. Upload thumbnail
const uploadThumbnail = async (courseId, thumbnailFile) => {
  const formData = new FormData();
  formData.append('thumbnail', thumbnailFile);
  
  const response = await fetch(`/api/academy/courses/${courseId}/thumbnail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${instructorToken}`
    },
    body: formData
  });
  
  return await response.json();
};

// 3. Upload course videos
const uploadVideo = async (courseId, videoFile, title, duration) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', title);
  formData.append('duration', duration);
  
  const response = await fetch(`/api/academy/courses/${courseId}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${instructorToken}`
    },
    body: formData
  });
  
  return await response.json();
};
```

### Student Enrollment Flow

```javascript
// 1. Browse courses
const browseCourses = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/academy/courses?${queryParams}`);
  return await response.json();
};

// 2. Enroll in course
const enrollInCourse = async (courseId) => {
  const response = await fetch(`/api/academy/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });
  
  return await response.json();
};

// 3. Update progress
const updateProgress = async (courseId, progress, completedLessons) => {
  const response = await fetch(`/api/academy/courses/${courseId}/progress`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ progress, completedLessons })
  });
  
  return await response.json();
};

// 4. Add review after completion
const addReview = async (courseId, rating, comment) => {
  const response = await fetch(`/api/academy/courses/${courseId}/reviews`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rating, comment })
  });
  
  return await response.json();
};
```
