# Courses API Endpoints

## Overview

The Courses API provides comprehensive endpoints for managing courses, enrollments, and certifications in the academy. All endpoints follow RESTful conventions and return standardized response formats.

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📚 Course Endpoints

### Get All Courses
**GET** `/api/academy/courses`

Retrieve a paginated list of courses with filtering and sorting options.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | String | No | Text search across title, description, tags |
| `category` | String | No | Filter by course category |
| `level` | String | No | Filter by course level |
| `instructor` | String | No | Filter by instructor ID |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |
| `sortBy` | String | No | Sort field (default: createdAt) |
| `sortOrder` | String | No | Sort order: asc/desc (default: desc) |

#### Response Format
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Professional Cleaning Techniques",
      "description": "Learn advanced cleaning techniques...",
      "category": "cleaning",
      "level": "intermediate",
      "instructor": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg",
          "bio": "Experienced cleaning professional"
        }
      },
      "pricing": {
        "regularPrice": 99,
        "discountedPrice": 79,
        "currency": "USD"
      },
      "duration": {
        "hours": 20,
        "weeks": 4
      },
      "enrollment": {
        "current": 125,
        "maxCapacity": 200,
        "isOpen": true
      },
      "rating": {
        "average": 4.8,
        "count": 45
      },
      "certification": {
        "isAvailable": true,
        "name": "Certified Cleaning Professional",
        "issuer": "LocalPro Academy"
      },
      "thumbnail": {
        "url": "https://example.com/thumbnail.jpg",
        "thumbnail": "https://example.com/thumb_thumbnail.jpg"
      },
      "tags": ["cleaning", "professional", "certification"],
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Single Course
**GET** `/api/academy/courses/:id`

Retrieve detailed information about a specific course.

#### Response Format
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Professional Cleaning Techniques",
    "description": "Learn advanced cleaning techniques...",
    "category": "cleaning",
    "level": "intermediate",
    "instructor": {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": "https://example.com/avatar.jpg",
        "bio": "Experienced cleaning professional",
        "rating": 4.9
      }
    },
    "partner": {
      "name": "TES",
      "logo": "https://example.com/tes-logo.png",
      "website": "https://tes.com"
    },
    "duration": {
      "hours": 20,
      "weeks": 4
    },
    "pricing": {
      "regularPrice": 99,
      "discountedPrice": 79,
      "currency": "USD"
    },
    "curriculum": [
      {
        "module": "Introduction to Professional Cleaning",
        "lessons": [
          {
            "title": "Cleaning Fundamentals",
            "description": "Basic cleaning principles...",
            "duration": 30,
            "type": "video",
            "content": {
              "url": "https://example.com/video1.mp4",
              "type": "video"
            },
            "isFree": true
          }
        ]
      }
    ],
    "prerequisites": ["Basic cleaning knowledge"],
    "learningOutcomes": [
      "Master advanced cleaning techniques",
      "Understand safety protocols",
      "Earn professional certification"
    ],
    "certification": {
      "isAvailable": true,
      "name": "Certified Cleaning Professional",
      "issuer": "LocalPro Academy",
      "validity": 24,
      "requirements": ["Complete all lessons", "Pass final exam"]
    },
    "enrollment": {
      "current": 125,
      "maxCapacity": 200,
      "isOpen": true
    },
    "schedule": {
      "startDate": "2024-02-01T00:00:00Z",
      "endDate": "2024-02-29T00:00:00Z",
      "sessions": [
        {
          "date": "2024-02-01T10:00:00Z",
          "startTime": "10:00",
          "endTime": "12:00",
          "type": "live"
        }
      ]
    },
    "rating": {
      "average": 4.8,
      "count": 45
    },
    "thumbnail": {
      "url": "https://example.com/thumbnail.jpg",
      "thumbnail": "https://example.com/thumb_thumbnail.jpg"
    },
    "tags": ["cleaning", "professional", "certification"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Create Course
**POST** `/api/academy/courses`
**Access**: Private (Instructor/Admin)

Create a new course listing.

#### Request Body
```json
{
  "title": "Professional Cleaning Techniques",
  "description": "Learn advanced cleaning techniques...",
  "category": "cleaning",
  "level": "intermediate",
  "duration": {
    "hours": 20,
    "weeks": 4
  },
  "pricing": {
    "regularPrice": 99,
    "discountedPrice": 79,
    "currency": "USD"
  },
  "curriculum": [
    {
      "module": "Introduction to Professional Cleaning",
      "lessons": [
        {
          "title": "Cleaning Fundamentals",
          "description": "Basic cleaning principles...",
          "duration": 30,
          "type": "video",
          "isFree": true
        }
      ]
    }
  ],
  "prerequisites": ["Basic cleaning knowledge"],
  "learningOutcomes": [
    "Master advanced cleaning techniques",
    "Understand safety protocols"
  ],
  "certification": {
    "isAvailable": true,
    "name": "Certified Cleaning Professional",
    "issuer": "LocalPro Academy",
    "validity": 24,
    "requirements": ["Complete all lessons", "Pass final exam"]
  },
  "enrollment": {
    "maxCapacity": 200,
    "isOpen": true
  },
  "schedule": {
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-29T00:00:00Z"
  },
  "tags": ["cleaning", "professional", "certification"]
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Professional Cleaning Techniques",
    "instructor": "64a1b2c3d4e5f6789012346",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Course
**PUT** `/api/academy/courses/:id`
**Access**: Private (Instructor/Admin)

Update an existing course.

#### Response Format
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Professional Cleaning Techniques - Updated",
    "pricing": {
      "regularPrice": 89,
      "discountedPrice": 69,
      "currency": "USD"
    },
    "updatedAt": "2024-01-15T11:30:00Z"
  }
}
```

### Delete Course
**DELETE** `/api/academy/courses/:id`
**Access**: Private (Instructor/Admin)

Soft delete a course (sets isActive to false).

#### Response Format
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### Upload Course Thumbnail
**POST** `/api/academy/courses/:id/thumbnail`
**Access**: Private (Instructor/Admin)

Upload a thumbnail image for a course.

#### Request Body
- **Content-Type**: `multipart/form-data`
- **thumbnail**: Image file

#### Response Format
```json
{
  "success": true,
  "message": "Thumbnail uploaded successfully",
  "data": {
    "url": "https://example.com/thumbnail.jpg",
    "publicId": "thumbnail-id",
    "thumbnail": "https://example.com/thumb_thumbnail.jpg"
  }
}
```

### Upload Course Video
**POST** `/api/academy/courses/:id/videos`
**Access**: Private (Instructor/Admin)

Upload a video lesson for a course.

#### Request Body
- **Content-Type**: `multipart/form-data`
- **video**: Video file
- **title**: String (optional)
- **duration**: Number (optional)

#### Response Format
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "title": "Cleaning Fundamentals",
    "url": "https://example.com/video1.mp4",
    "publicId": "video-id",
    "duration": 30,
    "order": 1
  }
}
```

### Delete Course Video
**DELETE** `/api/academy/courses/:id/videos/:videoId`
**Access**: Private (Instructor/Admin)

Delete a video lesson from a course.

#### Response Format
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

### Get Course Categories
**GET** `/api/academy/categories`
**Access**: Public

Get all course categories with counts.

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "_id": "cleaning",
      "count": 25
    },
    {
      "_id": "plumbing",
      "count": 15
    },
    {
      "_id": "electrical",
      "count": 20
    }
  ]
}
```

### Get Featured Courses
**GET** `/api/academy/featured`
**Access**: Public

Get featured courses.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | Number | No | Maximum number of courses (default: 10) |

#### Response Format
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Professional Cleaning Techniques",
      "category": "cleaning",
      "instructor": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg"
        }
      },
      "pricing": {
        "regularPrice": 99,
        "discountedPrice": 79,
        "currency": "USD"
      },
      "rating": {
        "average": 4.8,
        "count": 45
      },
      "thumbnail": {
        "url": "https://example.com/thumbnail.jpg"
      }
    }
  ]
}
```

## 📝 Enrollment Endpoints

### Enroll in Course
**POST** `/api/academy/courses/:id/enroll`
**Access**: Private

Enroll in a course.

#### Response Format
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "user": "64a1b2c3d4e5f6789012348",
    "enrolledAt": "2024-01-15T10:30:00Z",
    "progress": 0,
    "status": "active"
  }
}
```

### Update Course Progress
**PUT** `/api/academy/courses/:id/progress`
**Access**: Private

Update course progress for enrolled student.

#### Request Body
```json
{
  "progress": 50,
  "completedLessons": [
    {
      "lessonId": "lesson-1",
      "completedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Course progress updated successfully",
  "data": {
    "progress": 50,
    "completedLessons": [
      {
        "lessonId": "lesson-1",
        "completedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "status": "in_progress",
    "lastAccessed": "2024-01-15T10:30:00Z"
  }
}
```

### Get My Courses
**GET** `/api/academy/my-courses`
**Access**: Private

Get courses enrolled by the authenticated user.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |
| `status` | String | No | Filter by enrollment status |

#### Response Format
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Professional Cleaning Techniques",
      "category": "cleaning",
      "instructor": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg"
        }
      },
      "pricing": {
        "regularPrice": 99,
        "discountedPrice": 79,
        "currency": "USD"
      },
      "enrollment": {
        "current": 125,
        "maxCapacity": 200,
        "isOpen": true
      },
      "rating": {
        "average": 4.8,
        "count": 45
      },
      "thumbnail": {
        "url": "https://example.com/thumbnail.jpg"
      },
      "enrollment": {
        "user": "64a1b2c3d4e5f6789012348",
        "enrolledAt": "2024-01-15T10:30:00Z",
        "progress": 50,
        "status": "in_progress"
      }
    }
  ]
}
```

### Get My Created Courses
**GET** `/api/academy/my-created-courses`
**Access**: Private

Get courses created by the authenticated instructor.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |

#### Response Format
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Professional Cleaning Techniques",
      "category": "cleaning",
      "level": "intermediate",
      "enrollment": {
        "current": 125,
        "maxCapacity": 200,
        "isOpen": true
      },
      "rating": {
        "average": 4.8,
        "count": 45
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## ⭐ Review Endpoints

### Add Course Review
**POST** `/api/academy/courses/:id/reviews`
**Access**: Private

Add a review for a completed course.

#### Request Body
```json
{
  "rating": 5,
  "comment": "Excellent course! Very informative and well-structured."
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012348",
    "rating": 5,
    "comment": "Excellent course! Very informative and well-structured.",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## 📊 Statistics Endpoints

### Get Course Statistics
**GET** `/api/academy/statistics`
**Access**: Private (Admin Only)

Get comprehensive course statistics.

#### Response Format
```json
{
  "success": true,
  "data": {
    "totalCourses": 150,
    "coursesByCategory": [
      {
        "_id": "cleaning",
        "count": 45
      },
      {
        "_id": "plumbing",
        "count": 30
      },
      {
        "_id": "electrical",
        "count": 25
      }
    ],
    "totalEnrollments": 2500,
    "monthlyTrends": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "count": 25
      }
    ]
  }
}
```

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Codes
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **409** - Conflict (duplicate enrollment)
- **422** - Unprocessable Entity (validation failed)
- **500** - Internal Server Error

### Example Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Course title is required"
    },
    {
      "field": "category",
      "message": "Category must be one of: cleaning, plumbing, electrical..."
    }
  ]
}
```

---

*This documentation covers all available API endpoints. For implementation examples and best practices, see the related documentation files.*
