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

#### Minimal Required Payload
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

#### Complete Payload Example
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

**Note:** The `employer` field is automatically set from the authenticated user's ID and should not be included in the payload.

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

## Data Validation

### Phone Number Uniqueness
- All user phone numbers are unique across the system (enforced at the User model level)
- Job applications reference users by their unique `phoneNumber` through the `applicant` User reference
- Contact phone numbers in job postings (`applicationProcess.contactPhone`) are for employer contact purposes and do not need to be unique

## Related Features
- Providers (Employers)
- User Management
- Communication
- Analytics

