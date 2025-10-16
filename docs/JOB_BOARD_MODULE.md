# Job Board Module Documentation

## Overview

The Job Board module is a comprehensive employment platform integrated into the LocalPro Super App. It allows employers to post job opportunities and job seekers to discover and apply for positions within the local services ecosystem.

## Features

### For Employers
- **Job Posting Management**: Create, edit, and manage job postings
- **Application Management**: Review, track, and manage job applications
- **Company Profiles**: Upload company logos and manage company information
- **Analytics**: Track job performance, views, and application metrics
- **Geographic Targeting**: Post jobs with location-based targeting
- **Remote Work Support**: Support for remote, hybrid, and on-site positions

### For Job Seekers
- **Job Discovery**: Search and filter jobs by various criteria
- **Application System**: Apply for jobs with cover letters and resume uploads
- **Application Tracking**: Track application status and receive updates
- **Profile Integration**: Leverage existing LocalPro user profiles
- **Location-Based Search**: Find jobs in specific geographic areas

## API Endpoints

### Public Endpoints

#### Get All Jobs
```
GET /api/jobs
```
**Query Parameters:**
- `search` - Text search across job titles and descriptions
- `category` - Filter by job category
- `subcategory` - Filter by job subcategory
- `jobType` - Filter by job type (full_time, part_time, contract, etc.)
- `experienceLevel` - Filter by experience level
- `location` - Filter by location
- `isRemote` - Filter for remote positions
- `minSalary` - Minimum salary filter
- `maxSalary` - Maximum salary filter
- `company` - Filter by company name
- `featured` - Show only featured jobs
- `page` - Page number for pagination
- `limit` - Number of results per page
- `sortBy` - Sort field (createdAt, salary, etc.)
- `sortOrder` - Sort order (asc, desc)

#### Search Jobs
```
GET /api/jobs/search
```
Advanced search with text search and multiple filters.

#### Get Single Job
```
GET /api/jobs/:id
```
Returns detailed job information including company details and application requirements.

### Protected Endpoints (Authentication Required)

#### Create Job Posting
```
POST /api/jobs
```
**Required Fields:**
- `title` - Job title
- `description` - Job description
- `company.name` - Company name
- `category` - Job category
- `subcategory` - Job subcategory
- `jobType` - Type of employment
- `experienceLevel` - Required experience level

**Optional Fields:**
- `company.logo` - Company logo URL
- `company.website` - Company website
- `company.size` - Company size
- `company.industry` - Company industry
- `company.location` - Company location details
- `salary` - Salary information
- `benefits` - List of benefits
- `requirements` - Job requirements
- `responsibilities` - Job responsibilities
- `qualifications` - Required qualifications
- `applicationProcess` - Application process details

#### Update Job Posting
```
PUT /api/jobs/:id
```
Update existing job posting (employer or admin only).

#### Delete Job Posting
```
DELETE /api/jobs/:id
```
Delete job posting (employer or admin only).

#### Apply for Job
```
POST /api/jobs/:id/apply
```
**Required Fields:**
- `coverLetter` - Cover letter text

**Optional Fields:**
- `expectedSalary` - Expected salary
- `availability` - Available start date
- `portfolio` - Portfolio URL
- `resume` - Resume file upload

#### Get My Applications
```
GET /api/jobs/my-applications
```
Get all job applications submitted by the authenticated user.

#### Get My Jobs (Employer)
```
GET /api/jobs/my-jobs
```
Get all job postings created by the authenticated employer.

#### Get Job Applications (Employer)
```
GET /api/jobs/:id/applications
```
Get all applications for a specific job (employer or admin only).

#### Update Application Status
```
PUT /api/jobs/:id/applications/:applicationId/status
```
Update the status of a job application (employer or admin only).

**Status Options:**
- `pending` - Initial status
- `reviewing` - Under review
- `shortlisted` - Shortlisted for interview
- `interviewed` - Interview completed
- `rejected` - Application rejected
- `hired` - Application accepted

#### Upload Company Logo
```
POST /api/jobs/:id/logo
```
Upload company logo for job posting (employer or admin only).

#### Get Job Statistics
```
GET /api/jobs/:id/stats
```
Get analytics and statistics for a job posting (employer or admin only).

## Data Models

### Job Schema

```javascript
{
  title: String,                    // Job title
  description: String,              // Job description
  company: {
    name: String,                   // Company name
    logo: {                         // Company logo
      url: String,
      publicId: String
    },
    website: String,                // Company website
    size: String,                   // Company size
    industry: String,               // Company industry
    location: {                     // Company location
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      isRemote: Boolean,
      remoteType: String
    }
  },
  employer: ObjectId,               // Reference to User
  category: String,                 // Job category
  subcategory: String,              // Job subcategory
  jobType: String,                  // Employment type
  experienceLevel: String,          // Required experience
  salary: {                         // Salary information
    min: Number,
    max: Number,
    currency: String,
    period: String,
    isNegotiable: Boolean,
    isConfidential: Boolean
  },
  benefits: [String],               // List of benefits
  requirements: {                   // Job requirements
    skills: [String],
    education: {
      level: String,
      field: String,
      isRequired: Boolean
    },
    experience: {
      years: Number,
      description: String
    },
    certifications: [String],
    languages: [{
      language: String,
      proficiency: String
    }],
    other: [String]
  },
  responsibilities: [String],       // Job responsibilities
  qualifications: [String],         // Required qualifications
  applicationProcess: {             // Application details
    deadline: Date,
    startDate: Date,
    applicationMethod: String,
    contactEmail: String,
    contactPhone: String,
    applicationUrl: String,
    instructions: String
  },
  status: String,                   // Job status
  visibility: String,               // Job visibility
  applications: [{                  // Job applications
    applicant: ObjectId,
    appliedAt: Date,
    status: String,
    coverLetter: String,
    resume: {
      url: String,
      publicId: String,
      filename: String
    },
    portfolio: {
      url: String,
      description: String
    },
    expectedSalary: Number,
    availability: Date,
    notes: String,
    interviewSchedule: [{
      date: Date,
      time: String,
      type: String,
      location: String,
      interviewer: String,
      status: String,
      feedback: String
    }],
    feedback: {
      rating: Number,
      comments: String,
      strengths: [String],
      weaknesses: [String],
      recommendation: String
    }
  }],
  views: {                          // View tracking
    count: Number,
    unique: Number
  },
  analytics: {                      // Analytics data
    applicationsCount: Number,
    viewsCount: Number,
    sharesCount: Number,
    savesCount: Number
  },
  tags: [String],                   // Job tags
  isActive: Boolean,                // Job active status
  featured: {                       // Featured job settings
    isFeatured: Boolean,
    featuredUntil: Date,
    featuredAt: Date
  },
  promoted: {                       // Promoted job settings
    isPromoted: Boolean,
    promotedUntil: Date,
    promotedAt: Date,
    promotionType: String
  }
}
```

## Job Categories

The job board supports the following categories:

- **Technology** - Software development, IT support, data analysis
- **Healthcare** - Medical professionals, healthcare support
- **Education** - Teaching, training, educational support
- **Finance** - Banking, accounting, financial services
- **Marketing** - Digital marketing, content creation, advertising
- **Sales** - Sales representatives, account management
- **Customer Service** - Support representatives, call center
- **Human Resources** - HR professionals, recruitment
- **Operations** - Operations management, logistics
- **Design** - Graphic design, UI/UX, creative services
- **Engineering** - Civil, mechanical, electrical engineering
- **Construction** - Construction workers, contractors
- **Maintenance** - Property maintenance, equipment repair
- **Cleaning** - Janitorial services, housekeeping
- **Security** - Security guards, surveillance
- **Transportation** - Delivery drivers, logistics
- **Food Service** - Restaurant workers, catering
- **Retail** - Sales associates, store management
- **Hospitality** - Hotel staff, event management
- **Other** - Miscellaneous positions

## Job Types

- **Full Time** - Permanent full-time employment
- **Part Time** - Part-time employment
- **Contract** - Contract-based work
- **Freelance** - Freelance/independent contractor
- **Internship** - Internship positions
- **Temporary** - Temporary employment

## Experience Levels

- **Entry** - Entry-level positions (0-1 years)
- **Junior** - Junior level (1-3 years)
- **Mid** - Mid-level (3-5 years)
- **Senior** - Senior level (5-8 years)
- **Lead** - Lead/principal level (8+ years)
- **Executive** - Executive/C-level positions

## Email Notifications

The job board module includes automated email notifications:

### For Employers
- **New Application Notification**: Sent when a new application is received
- **Application Status Updates**: Notifications for application status changes

### For Job Seekers
- **Application Status Updates**: Notifications when application status changes
- **Interview Invitations**: Notifications for interview scheduling
- **Job Recommendations**: Periodic job recommendations based on profile

## File Uploads

The module supports file uploads through Cloudinary:

- **Company Logos**: Upload company logos for job postings
- **Resumes**: Job seekers can upload resumes when applying
- **Portfolio Files**: Support for portfolio attachments

## Security & Permissions

### Role-Based Access Control
- **Public Access**: Browse and search jobs, view job details
- **Authenticated Users**: Apply for jobs, track applications
- **Employers/Providers**: Create and manage job postings
- **Admins**: Full access to all job board features

### Data Validation
- Input validation for all job posting fields
- File type validation for uploads
- Rate limiting on API endpoints
- Authentication required for protected endpoints

## Integration Points

### Google Maps Integration
- Geocoding of company addresses
- Location-based job search
- Distance calculations for job recommendations

### Email Service Integration
- Automated email notifications
- Template-based email system
- Support for multiple email providers

### Cloudinary Integration
- File upload and management
- Image optimization and transformation
- Secure file storage

### User Profile Integration
- Leverages existing user profiles
- Skills and experience from user profiles
- Trust and verification system integration

## Performance Optimizations

### Database Indexing
- Text search indexes for job content
- Category and location indexes
- Status and visibility indexes
- Featured and promoted job indexes

### Caching Strategy
- Job listing caching
- Search result caching
- Company information caching

### Pagination
- Efficient pagination for large result sets
- Configurable page sizes
- Cursor-based pagination for real-time updates

## Monitoring & Analytics

### Job Performance Metrics
- View counts and unique visitors
- Application conversion rates
- Time to fill positions
- Geographic distribution of applications

### User Engagement Metrics
- Job search patterns
- Application success rates
- User retention in job board
- Popular job categories and types

## Future Enhancements

### Planned Features
- **Advanced Matching**: AI-powered job matching based on skills and preferences
- **Video Interviews**: Integrated video interview scheduling
- **Skills Assessment**: Built-in skills testing and certification
- **Referral System**: Employee referral tracking and rewards
- **Salary Insights**: Market salary data and insights
- **Company Reviews**: Employee reviews and company ratings
- **Job Alerts**: Personalized job alert system
- **Mobile App**: Dedicated mobile application for job board

### Integration Opportunities
- **LinkedIn Integration**: Import profiles and connections
- **Calendar Integration**: Interview scheduling
- **CRM Integration**: Applicant tracking system
- **Analytics Integration**: Advanced reporting and insights

## Getting Started

### For Developers

1. **Environment Setup**: Ensure all required environment variables are configured
2. **Database Migration**: Run database migrations to create job-related collections
3. **File Storage**: Configure Cloudinary for file uploads
4. **Email Service**: Set up email service for notifications
5. **API Testing**: Use the provided API endpoints to test functionality

### For Employers

1. **Account Setup**: Create an employer account or upgrade existing account
2. **Company Profile**: Complete company profile with logo and details
3. **Job Posting**: Create your first job posting
4. **Application Management**: Set up application review process
5. **Analytics**: Monitor job performance and application metrics

### For Job Seekers

1. **Profile Completion**: Complete your user profile with skills and experience
2. **Job Search**: Use search and filters to find relevant positions
3. **Application Process**: Apply for jobs with cover letters and resumes
4. **Application Tracking**: Monitor application status and updates
5. **Profile Optimization**: Keep profile updated for better job matches

## Support & Documentation

For additional support and documentation:
- API Documentation: Available at `/api` endpoint
- Email Support: Contact support team for assistance
- Community Forum: Join the LocalPro community for tips and best practices
- Video Tutorials: Available in the academy module

## Version History

- **v1.0.0** - Initial release with basic job posting and application functionality
- **v1.1.0** - Added advanced search and filtering capabilities
- **v1.2.0** - Integrated email notifications and file uploads
- **v1.3.0** - Added analytics and reporting features
- **v1.4.0** - Enhanced mobile responsiveness and performance optimizations

---

*This documentation is maintained by the LocalPro development team. For updates and changes, please refer to the latest version.*
