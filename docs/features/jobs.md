# Jobs Feature Documentation

## Overview
The Jobs feature enables job posting, application management, and job search functionality for employers and job seekers.

## Base Path
`/api/jobs`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all jobs | page, limit, category, location, search |
| GET | `/search` | Search jobs | query, category, location, salaryRange |
| GET | `/:id` | Get job details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/` | Create job posting | **provider, admin** |
| PUT | `/:id` | Update job posting | **provider, admin** |
| DELETE | `/:id` | Delete job posting | **provider, admin** |
| POST | `/:id/logo` | Upload company logo | **provider, admin** |
| GET | `/:id/stats` | Get job statistics | **provider, admin** |
| POST | `/:id/apply` | Apply for job | AUTHENTICATED |
| GET | `/my-applications` | Get my applications | AUTHENTICATED |
| GET | `/my-jobs` | Get my job postings | **provider, admin** |
| GET | `/:id/applications` | Get job applications | **provider, admin** |
| PUT | `/:id/applications/:applicationId/status` | Update application status | **provider, admin** |

## Request/Response Examples

### Create Job Posting (Employer)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Plumber",
  "description": "Experienced plumber needed",
  "category": "plumbing",
  "employmentType": "full-time",
  "salary": {
    "min": 30000,
    "max": 40000,
    "currency": "PHP"
  },
  "location": {
    "city": "Manila",
    "address": "123 Main St"
  },
  "requirements": ["5+ years experience", "Valid license"],
  "benefits": ["Health insurance", "Paid leave"]
}
```

### Apply for Job (Job Seeker)
```http
POST /api/jobs/:id/apply
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "coverLetter": "I am interested in this position...",
  "resume": <file>
}
```

### Update Application Status (Employer)
```http
PUT /api/jobs/:id/applications/:applicationId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shortlisted",
  "notes": "Candidate meets requirements"
}
```

## Job Application Flow

1. **Job Posting**:
   - Employer creates job posting via `/`
   - Employer uploads company logo
   - Job becomes visible to job seekers

2. **Job Application**:
   - Job seeker browses/search jobs
   - Job seeker applies with resume and cover letter
   - Application status: `pending`

3. **Application Review**:
   - Employer reviews applications via `/:id/applications`
   - Employer updates status: `shortlisted`, `interview`, `rejected`, `hired`
   - Job seeker tracks status via `/my-applications`

## Application Status Flow

- `pending` → `shortlisted` → `interview` → `hired`
- Can be `rejected` at any stage

## Related Features
- Providers (Employers)
- User Management
- Communication
- Analytics

