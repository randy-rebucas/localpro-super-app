# Academy Feature

## Overview

The Academy feature provides a comprehensive online learning platform where instructors can create courses and students can enroll, learn, and earn certifications.

## Key Features

- **Course Management** - Create and manage courses
- **Enrollment System** - Student enrollment with progress tracking
- **Video Content** - Video lesson hosting
- **Progress Tracking** - Real-time progress monitoring
- **Certifications** - Digital certificate issuance
- **Reviews & Ratings** - Course feedback system

## API Endpoints

### Courses

```
GET    /api/academy/courses              # List courses
GET    /api/academy/courses/:id          # Get course details
POST   /api/academy/courses              # Create course (instructor/admin)
PUT    /api/academy/courses/:id          # Update course
DELETE /api/academy/courses/:id          # Delete course
```

### Enrollment

```
POST   /api/academy/courses/:id/enroll   # Enroll in course
GET    /api/academy/my-courses           # Get enrolled courses
GET    /api/academy/courses/:id/progress # Get course progress
```

### Categories

```
GET    /api/academy/categories           # List categories
POST   /api/academy/categories          # Create category (admin)
PUT    /api/academy/categories/:id       # Update category
DELETE /api/academy/categories/:id       # Delete category
```

## Course Structure

```typescript
interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor: User;
  curriculum: {
    modules: Module[];
  };
  pricing: {
    regularPrice: number;
    discountedPrice?: number;
    currency: string;
  };
  enrollment: {
    current: number;
    maxCapacity?: number;
  };
  rating: {
    average: number;
    count: number;
  };
}
```

## Implementation

See [Frontend Implementation Guide](../frontend/implementation-guide.md#academy--courses) for examples.

## Documentation

For complete API documentation:
- [Academy API Endpoints](../../../features/academy/api-endpoints.md)
- [Courses API Endpoints](../../../features/courses/api-endpoints.md)

