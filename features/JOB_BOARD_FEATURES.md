# Job Board Features Documentation

## Overview

The Job Board feature enables job posting, application management, and job search functionality for employers and job seekers in the LocalPro Super App. It provides a comprehensive job board platform with rich postings, applications, employer management, and advanced search/filtering capabilities.

## Base Path
`/api/jobs`

---

## Core Features

### 1. Job Posting Management
- **Create Job Postings** - Employers (providers/admins) can create detailed job listings
- **Update Job Postings** - Modify job details, requirements, and application process
- **Delete Job Postings** - Remove job listings when no longer needed
- **Company Branding** - Upload company logos and manage company profiles
- **Job Status Management** - Control job visibility and status (draft, active, paused, closed, filled)
- **Featured Jobs** - Promote jobs with featured listings
- **Job Analytics** - Track views, applications, and engagement statistics

### 2. Job Discovery & Search
- **Browse Jobs** - Paginated listing of all available jobs
- **Advanced Search** - Full-text search with multiple filters:
  - Category and subcategory
  - Job type (full-time, part-time, contract, freelance, internship, temporary)
  - Experience level (entry, junior, mid, senior, lead, executive)
  - Location and remote work options
  - Salary range
  - Company name
  - Featured jobs
- **Sorting Options** - Sort by relevance, date, salary, etc.
- **Job Details** - Comprehensive job information including:
  - Full job description
  - Company information
  - Salary and benefits
  - Requirements and qualifications
  - Application process details

### 3. Application Management
- **Apply for Jobs** - Job seekers can apply with resume and cover letter
- **Application Tracking** - Track application status and history
- **Resume Upload** - Support for PDF, DOC, and DOCX formats
- **Portfolio Links** - Include portfolio URLs in applications
- **Application Status Updates** - Employers can update application status
- **Interview Scheduling** - Schedule and manage interviews
- **Application Feedback** - Employers can provide feedback and ratings

### 4. Employer Features
- **My Jobs Dashboard** - View all posted jobs
- **Application Review** - Review and manage applications for each job
- **Application Status Management** - Update application status throughout the hiring process
- **Job Statistics** - View analytics for each job posting:
  - View counts (total and unique)
  - Application counts
  - Share and save counts
- **Company Profile Management** - Manage company information and branding

### 5. Job Seeker Features
- **My Applications** - Track all job applications
- **Application Status** - Monitor application progress
- **Job Search** - Advanced search and filtering capabilities
- **Job Details** - View comprehensive job information
- **Application History** - Access past applications and feedback

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all jobs | `page`, `limit`, `search`, `category`, `subcategory`, `jobType`, `experienceLevel`, `location`, `isRemote`, `minSalary`, `maxSalary`, `company`, `sortBy`, `sortOrder`, `featured` |
| GET | `/search` | Full-text search jobs | Same as above |
| GET | `/:id` | Get job details | - |

### Authenticated Endpoints - Job Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create job posting | **provider, admin** |
| PUT | `/:id` | Update job posting | **provider, admin** |
| DELETE | `/:id` | Delete job posting | **provider, admin** |
| POST | `/:id/logo` | Upload company logo | **provider, admin** |
| GET | `/:id/stats` | Get job statistics | **provider, admin** |
| GET | `/my-jobs` | Get my job postings | **provider, admin** |

### Authenticated Endpoints - Applications

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/:id/apply` | Apply for job | AUTHENTICATED |
| GET | `/my-applications` | Get my applications | AUTHENTICATED |
| GET | `/:id/applications` | Get job applications | **provider, admin** |
| PUT | `/:id/applications/:applicationId/status` | Update application status | **provider, admin** |

---

## Request/Response Examples

### Create Job Posting (Employer) - Minimal

```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Plumber",
  "description": "Experienced plumber needed for residential and commercial projects. Must have valid license and 5+ years of experience.",
  "company": {
    "name": "ABC Plumbing Services"
  },
  "category": "65a1b2c3d4e5f6789012345",
  "subcategory": "Plumbing",
  "jobType": "full_time",
  "experienceLevel": "senior"
}
```

### Create Job Posting (Employer) - Complete

```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Plumber",
  "description": "Experienced plumber needed for residential and commercial projects. Must have valid license and 5+ years of experience.",
  "company": {
    "name": "ABC Plumbing Services",
    "website": "https://abcplumbing.com",
    "size": "medium",
    "industry": "Construction",
    "location": {
      "address": "123 Main Street, Manila, Metro Manila 1000",
      "city": "Manila",
      "state": "Metro Manila",
      "country": "Philippines",
      "coordinates": {
        "lat": 14.5995,
        "lng": 120.9842
      },
      "isRemote": false,
      "remoteType": "on_site"
    }
  },
  "category": "65a1b2c3d4e5f6789012345",
  "subcategory": "Plumbing",
  "jobType": "full_time",
  "experienceLevel": "senior",
  "salary": {
    "min": 30000,
    "max": 40000,
    "currency": "PHP",
    "period": "monthly",
    "isNegotiable": true,
    "isConfidential": false
  },
  "benefits": [
    "health_insurance",
    "paid_time_off",
    "sick_leave",
    "professional_development"
  ],
  "requirements": {
    "skills": [
      "Pipe installation",
      "Leak repair",
      "Water heater installation",
      "Drain cleaning"
    ],
    "education": {
      "level": "high_school",
      "field": "Plumbing",
      "isRequired": true
    },
    "experience": {
      "years": 5,
      "description": "Minimum 5 years of professional plumbing experience"
    },
    "certifications": [
      "Licensed Plumber",
      "OSHA Certification"
    ],
    "languages": [
      {
        "language": "English",
        "proficiency": "intermediate"
      },
      {
        "language": "Tagalog",
        "proficiency": "native"
      }
    ],
    "other": [
      "Valid driver's license",
      "Own transportation"
    ]
  },
  "responsibilities": [
    "Install and repair plumbing systems",
    "Diagnose plumbing issues",
    "Maintain plumbing equipment",
    "Provide customer service"
  ],
  "qualifications": [
    "Strong problem-solving skills",
    "Physical fitness for manual work",
    "Good communication skills"
  ],
  "applicationProcess": {
    "deadline": "2024-12-31T23:59:59.000Z",
    "startDate": "2025-01-15T00:00:00.000Z",
    "applicationMethod": "platform",
    "contactEmail": "hr@abcplumbing.com",
    "contactPhone": "+639171234567",
    "applicationUrl": "https://abcplumbing.com/careers",
    "instructions": "Please submit your resume and cover letter through the platform."
  },
  "status": "draft",
  "visibility": "public",
  "tags": [
    "plumbing",
    "construction",
    "full-time",
    "manila"
  ]
}
```

### Apply for Job (Job Seeker)

```http
POST /api/jobs/:id/apply
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "coverLetter": "I am interested in this position and have 5 years of experience in plumbing...",
  "resume": <file> // PDF, DOC, or DOCX
}
```

### Update Application Status (Employer)

```http
PUT /api/jobs/:id/applications/:applicationId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shortlisted",
  "notes": "Candidate meets requirements",
  "feedback": {
    "rating": 5,
    "comments": "Great fit for the position",
    "strengths": ["Strong experience", "Good communication"],
    "weaknesses": [],
    "recommendation": "strong_hire"
  }
}
```

### Upload Company Logo (Employer)

```http
POST /api/jobs/:id/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "logo": <image_file>
}
```

---

## Job Application Flow

### 1. Job Posting
- Employer creates job posting via `POST /api/jobs`
- Employer uploads company logo via `POST /api/jobs/:id/logo`
- Job status can be set to `draft`, `active`, `paused`, `closed`, or `filled`
- Job becomes visible to job seekers when status is `active` and visibility is `public`

### 2. Job Application
- Job seeker browses or searches for jobs
- Job seeker views job details
- Job seeker applies with resume and cover letter via `POST /api/jobs/:id/apply`
- Application status is set to `pending`
- System tracks application analytics

### 3. Application Review
- Employer reviews applications via `GET /api/jobs/:id/applications`
- Employer updates application status via `PUT /api/jobs/:id/applications/:applicationId/status`
- Application status progresses: `pending` → `reviewing` → `shortlisted` → `interviewed` → `hired`
- Application can be `rejected` at any stage
- Interview scheduling and feedback can be added
- Job seeker tracks status via `GET /api/jobs/my-applications`

---

## Application Status Flow

The application status follows this progression:

```
pending → reviewing → shortlisted → interviewed → hired
```

**Status Details:**
- **pending** - Initial application state, awaiting review
- **reviewing** - Application is being reviewed by employer
- **shortlisted** - Candidate has been shortlisted
- **interviewed** - Candidate has been interviewed
- **hired** - Candidate has been hired
- **rejected** - Application has been rejected (can occur at any stage)

---

## Job Data Model

### Job Fields

**Basic Information:**
- `title` - Job title (required, max 100 characters)
- `description` - Job description (required, max 2000 characters)
- `category` - Job category reference (required)
- `subcategory` - Job subcategory (required)
- `jobType` - Type of employment: `full_time`, `part_time`, `contract`, `freelance`, `internship`, `temporary`
- `experienceLevel` - Required experience: `entry`, `junior`, `mid`, `senior`, `lead`, `executive`

**Company Information:**
- `company.name` - Company name (required)
- `company.logo` - Company logo (URL and public ID)
- `company.website` - Company website URL
- `company.size` - Company size: `startup`, `small`, `medium`, `large`, `enterprise`
- `company.industry` - Industry sector
- `company.location` - Company location details:
  - `address`, `city`, `state`, `country`
  - `coordinates` (lat, lng)
  - `isRemote` - Remote work availability
  - `remoteType` - `fully_remote`, `hybrid`, `on_site`

**Compensation:**
- `salary.min` - Minimum salary
- `salary.max` - Maximum salary
- `salary.currency` - Currency code (default: USD)
- `salary.period` - Pay period: `hourly`, `daily`, `weekly`, `monthly`, `yearly`
- `salary.isNegotiable` - Whether salary is negotiable
- `salary.isConfidential` - Whether salary is confidential

**Benefits:**
- `benefits` - Array of benefit types:
  - `health_insurance`, `dental_insurance`, `vision_insurance`
  - `life_insurance`, `retirement_401k`
  - `paid_time_off`, `sick_leave`
  - `maternity_leave`, `paternity_leave`
  - `flexible_schedule`, `remote_work`
  - `professional_development`, `tuition_reimbursement`
  - `gym_membership`, `meal_allowance`, `transportation_allowance`

**Requirements:**
- `requirements.skills` - Required skills array
- `requirements.education` - Education requirements:
  - `level`: `high_school`, `associate`, `bachelor`, `master`, `phd`, `none_required`
  - `field` - Field of study
  - `isRequired` - Whether education is required
- `requirements.experience` - Experience requirements:
  - `years` - Years of experience
  - `description` - Experience description
- `requirements.certifications` - Required certifications array
- `requirements.languages` - Language requirements:
  - `language` - Language name
  - `proficiency`: `beginner`, `intermediate`, `advanced`, `native`
- `requirements.other` - Other requirements array

**Job Details:**
- `responsibilities` - Job responsibilities array
- `qualifications` - Preferred qualifications array
- `tags` - Job tags for searchability

**Application Process:**
- `applicationProcess.deadline` - Application deadline
- `applicationProcess.startDate` - Job start date
- `applicationProcess.applicationMethod` - `email`, `website`, `platform`, `phone`
- `applicationProcess.contactEmail` - Contact email
- `applicationProcess.contactPhone` - Contact phone
- `applicationProcess.applicationUrl` - External application URL
- `applicationProcess.instructions` - Application instructions

**Status & Visibility:**
- `status` - Job status: `draft`, `active`, `paused`, `closed`, `filled`
- `visibility` - Visibility level: `public`, `private`, `featured`
- `isActive` - Whether job is currently active
- `featured` - Featured job settings:
  - `isFeatured` - Whether job is featured
  - `featuredUntil` - Feature expiration date
  - `featuredAt` - Feature start date
- `promoted` - Promoted job settings:
  - `isPromoted` - Whether job is promoted
  - `promotedUntil` - Promotion expiration date
  - `promotedAt` - Promotion start date
  - `promotionType` - `standard`, `premium`, `urgent`

**Analytics:**
- `views` - View statistics:
  - `count` - Total views
  - `unique` - Unique views
- `analytics` - Analytics data:
  - `applicationsCount` - Number of applications
  - `viewsCount` - Total views
  - `sharesCount` - Number of shares
  - `savesCount` - Number of saves

**Applications:**
- `applications` - Array of job applications:
  - `applicant` - User reference
  - `appliedAt` - Application timestamp
  - `status` - Application status
  - `coverLetter` - Cover letter text
  - `resume` - Resume file (URL, public ID, filename)
  - `portfolio` - Portfolio URL and description
  - `expectedSalary` - Expected salary
  - `availability` - Availability information
  - `notes` - Application notes
  - `interviewSchedule` - Interview scheduling:
    - `date`, `time`, `type` (`phone`, `video`, `in_person`)
    - `location`, `interviewer`, `status`
    - `feedback` - Interview feedback
  - `feedback` - Application feedback:
    - `rating` - Rating (1-5)
    - `comments` - Feedback comments
    - `strengths` - Candidate strengths
    - `weaknesses` - Candidate weaknesses
    - `recommendation` - `strong_hire`, `hire`, `no_hire`, `strong_no_hire`

**Metadata:**
- `employer` - User reference (job poster)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Search:**
- `search` - Full-text search query
- `category` - Job category filter
- `subcategory` - Job subcategory filter
- `company` - Company name filter

**Filters:**
- `jobType` - Filter by job type
- `experienceLevel` - Filter by experience level
- `location` - Filter by location
- `isRemote` - Filter remote jobs (true/false)
- `minSalary` - Minimum salary filter
- `maxSalary` - Maximum salary filter
- `featured` - Filter featured jobs (true/false)

**Sorting:**
- `sortBy` - Sort field (e.g., `createdAt`, `salary`, `title`)
- `sortOrder` - Sort order: `asc` or `desc`

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
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

**Mutation Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {...}
}
```

---

## Key Metrics

- **Job Postings** - Total active job listings
- **Applications** - Number of job applications
- **Application Rate** - Applications per job
- **Hiring Rate** - Hired candidates per job
- **View Statistics** - Total and unique job views
- **Engagement Metrics** - Shares and saves
- **Category Distribution** - Jobs by category
- **Location Distribution** - Jobs by location

---

## Related Features

The Job Board feature integrates with several other features in the LocalPro Super App:

- **User Management** - Employer and job seeker profiles
- **Providers** - Employer profiles and management
- **Communication** - Messaging and notification system
- **Analytics** - Job performance and application analytics
- **File Storage** - Resume and logo uploads (Cloudinary)
- **Email Notifications** - Application notifications

---

## Common Use Cases

1. **Job Posting** - Employers create and manage job listings
2. **Job Search** - Job seekers search and filter available positions
3. **Job Application** - Job seekers apply for positions with resumes
4. **Application Review** - Employers review and manage applications
5. **Hiring Process** - Track candidates through interview and hiring stages
6. **Job Analytics** - Monitor job performance and application metrics

---

## Data Validation

### Phone Number Uniqueness
- All user phone numbers are unique across the system (enforced at the User model level)
- Job applications reference users by their unique `phoneNumber` through the `applicant` User reference
- Contact phone numbers in job postings (`applicationProcess.contactPhone`) are for employer contact purposes and do not need to be unique

### File Uploads
- **Resume Formats**: PDF, DOC, DOCX
- **Logo Formats**: Image files (JPG, PNG, etc.)
- Files are stored using Cloudinary service

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (missing required fields, invalid data)
- `403` - Unauthorized (insufficient permissions)
- `404` - Not found (job or application doesn't exist)
- `500` - Server error

---

*For detailed implementation guidance, see the individual documentation files in the `features/jobs/` and `docs/features/` directories.*

