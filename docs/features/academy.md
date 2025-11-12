# Academy Feature Documentation

## Overview
The Academy feature enables course creation, enrollment, learning progress tracking, and certification for instructors and students.

## Base Path
`/api/academy`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/courses` | Get all courses | page, limit, category, instructor, level |
| GET | `/courses/:id` | Get course details | - |
| GET | `/categories` | Get course categories | - |
| GET | `/featured` | Get featured courses | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/courses` | Create course | **instructor, admin** |
| PUT | `/courses/:id` | Update course | **instructor, admin** |
| DELETE | `/courses/:id` | Delete course | **instructor, admin** |
| POST | `/courses/:id/thumbnail` | Upload course thumbnail | **instructor, admin** |
| POST | `/courses/:id/videos` | Upload course video | **instructor, admin** |
| DELETE | `/courses/:id/videos/:videoId` | Delete course video | **instructor, admin** |
| POST | `/courses/:id/enroll` | Enroll in course | AUTHENTICATED |
| PUT | `/courses/:id/progress` | Update course progress | AUTHENTICATED |
| POST | `/courses/:id/reviews` | Add course review | AUTHENTICATED |
| GET | `/my-courses` | Get my enrolled courses | AUTHENTICATED |
| GET | `/my-created-courses` | Get my created courses | AUTHENTICATED |
| GET | `/statistics` | Get course statistics | **admin** |

## Request/Response Examples

### Create Course (Instructor)
```http
POST /api/academy/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced Plumbing Techniques",
  "description": "Learn advanced plumbing skills",
  "category": "plumbing",
  "level": "intermediate",
  "price": 5000,
  "duration": 40,
  "syllabus": [
    {
      "module": "Module 1",
      "lessons": ["Lesson 1", "Lesson 2"]
    }
  ]
}
```

### Enroll in Course
```http
POST /api/academy/courses/:id/enroll
Authorization: Bearer <token>
```

### Update Progress
```http
PUT /api/academy/courses/:id/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "moduleId": "module_id",
  "lessonId": "lesson_id",
  "completed": true,
  "progress": 50
}
```

## Course Enrollment Flow

1. **Course Discovery**:
   - Student browses courses
   - Student views course details
   - Student checks instructor profile

2. **Enrollment**:
   - Student enrolls in course
   - Payment processed (if paid course)
   - Access granted

3. **Learning**:
   - Student watches videos
   - Student completes lessons
   - Progress tracked automatically

4. **Completion**:
   - Student completes all modules
   - Certificate issued
   - Review can be added

## Course Status

- `draft` - Course being created
- `published` - Course available for enrollment
- `archived` - Course no longer available

## Enrollment Status

- `enrolled` - Student enrolled
- `in_progress` - Student learning
- `completed` - Course completed
- `dropped` - Enrollment cancelled

## Related Features
- Providers (Instructors)
- Finance (Course payments)
- Reviews & Ratings
- Certifications

