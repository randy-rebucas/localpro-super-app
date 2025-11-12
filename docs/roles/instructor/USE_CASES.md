# Instructor Use Cases

## Overview
This document describes the primary use cases for instructors in the LocalPro Super App.

## Role Definition
**Instructor**: Users who create and manage educational courses in the Academy feature.

## Use Cases

### UC-IN-001: Create Course
**Description**: Instructor creates educational course

**Actors**: Instructor

**Preconditions**: Instructor is authenticated and verified

**Main Flow**:
1. Instructor creates course via `/api/academy/courses`
2. Instructor adds course details (title, description, category)
3. Instructor sets pricing and duration
4. Instructor uploads thumbnail via `/api/academy/courses/:id/thumbnail`
5. Instructor adds course modules and lessons
6. Instructor uploads videos via `/api/academy/courses/:id/videos`
7. Course becomes available for enrollment

**Related Endpoints**:
- `POST /api/academy/courses`
- `POST /api/academy/courses/:id/thumbnail`
- `POST /api/academy/courses/:id/videos`
- `GET /api/academy/my-created-courses`

---

### UC-IN-002: Manage Courses
**Description**: Instructor manages course content

**Actors**: Instructor

**Main Flow**:
1. Instructor views courses via `/api/academy/my-created-courses`
2. Instructor updates course via `/api/academy/courses/:id`
3. Instructor adds/removes videos
4. Instructor updates course content
5. Instructor manages enrollments

**Related Endpoints**:
- `GET /api/academy/my-created-courses`
- `PUT /api/academy/courses/:id`
- `DELETE /api/academy/courses/:id/videos/:videoId`

---

### UC-IN-003: Track Student Progress
**Description**: Instructor monitors student enrollment and progress

**Actors**: Instructor

**Main Flow**:
1. Instructor views course enrollments
2. Instructor tracks student progress
3. Instructor issues certificates upon completion
4. Instructor responds to student questions

**Related Endpoints**:
- `GET /api/academy/my-created-courses`
- Course enrollment data (via course details)

---

### UC-IN-004: Financial Management
**Description**: Instructor manages course earnings

**Actors**: Instructor

**Main Flow**:
1. Instructor views earnings via `/api/finance/earnings`
2. Instructor tracks course sales
3. Instructor requests withdrawal via `/api/finance/withdraw`

**Related Endpoints**:
- `GET /api/finance/overview`
- `GET /api/finance/earnings`
- `POST /api/finance/withdraw`

---

## Summary
Instructors create and manage educational courses, track student progress, and manage course-related finances. Focus is on educational content creation and delivery.

