# Marketplace Job Endpoints Documentation

## Overview

This document provides a comprehensive analysis of the marketplace job-related endpoints in the LocalPro Super App. The system includes both marketplace services (for service providers and clients) and a dedicated job board module for employment opportunities.

## Architecture Summary

The LocalPro Super App implements a dual approach to job-related functionality:

1. **Marketplace Services** (`/api/marketplace/*`) - Service-based jobs (cleaning, maintenance, etc.)
2. **Job Board Module** (`/api/jobs/*`) - Traditional employment opportunities

## Marketplace Service Endpoints

### Public Endpoints

#### 1. Get All Services
```
GET /api/marketplace/services
```

**Query Parameters:**
- `category` - Service category filter
- `subcategory` - Service subcategory filter  
- `location` - Location-based filtering
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `rating` - Minimum rating filter
- `page` - Pagination (default: 1)
- `limit` - Results per page (default: 10)
- `sortBy` - Sort field (default: 'createdAt')
- `sortOrder` - Sort direction (default: 'desc')

**Implementation Notes:**
- Uses MongoDB text search with `$text` operator
- Implements advanced filtering with geospatial queries
- Supports Google Maps integration for location-based search
- Returns paginated results with metadata

**Response Structure:**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "data": [
    {
      "_id": "service_id",
      "title": "Service Title",
      "description": "Service Description",
      "category": "cleaning",
      "pricing": {
        "basePrice": 50,
        "currency": "USD",
        "type": "hourly"
      },
      "provider": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "avatar_url",
          "rating": 4.5
        }
      },
      "rating": {
        "average": 4.5,
        "count": 25
      },
      "serviceArea": ["City1", "City2"],
      "images": [],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2. Get Single Service
```
GET /api/marketplace/services/:id
```

**Implementation Notes:**
- Populates provider information with profile details
- Returns detailed service information
- Includes pricing, availability, and provider ratings

#### 3. Get Nearby Services
```
GET /api/marketplace/services/nearby
```

**Query Parameters:**
- `lat` - Latitude (required)
- `lng` - Longitude (required)
- `radius` - Search radius in meters (default: 50000)
- `category` - Service category filter
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `rating` - Minimum rating filter

**Implementation Notes:**
- Uses Google Maps API for distance calculations
- Implements geospatial filtering
- Calculates travel time and distance
- Filters results within specified radius

### Protected Endpoints (Authentication Required)

#### 4. Create Service
```
POST /api/marketplace/services
```

**Authorization:** Provider or Admin only

**Request Body:**
```json
{
  "title": "Service Title",
  "description": "Service Description",
  "category": "cleaning",
  "subcategory": "house_cleaning",
  "pricing": {
    "basePrice": 50,
    "currency": "USD",
    "type": "hourly"
  },
  "serviceArea": ["City1", "City2"],
  "availability": {
    "monday": ["09:00", "17:00"],
    "tuesday": ["09:00", "17:00"]
  }
}
```

**Implementation Notes:**
- Validates provider authorization
- Sets provider ID from authenticated user
- Supports multiple pricing models (hourly, fixed, per unit)
- Implements service area validation

#### 5. Update Service
```
PUT /api/marketplace/services/:id
```

**Authorization:** Provider or Admin only

**Implementation Notes:**
- Validates ownership of service
- Supports partial updates
- Maintains audit trail of changes
- Validates pricing and availability changes

#### 6. Delete Service
```
DELETE /api/marketplace/services/:id
```

**Authorization:** Provider or Admin only

**Implementation Notes:**
- Soft delete implementation (sets isActive: false)
- Prevents deletion if active bookings exist
- Maintains data integrity

#### 7. Upload Service Images
```
POST /api/marketplace/services/:id/images
```

**Authorization:** Provider or Admin only

**Implementation Notes:**
- Uses Cloudinary for image storage
- Supports multiple image uploads (max 5)
- Generates thumbnails automatically
- Implements image optimization

### Booking Management Endpoints

#### 8. Create Booking
```
POST /api/marketplace/bookings
```

**Request Body:**
```json
{
  "serviceId": "service_id",
  "bookingDate": "2024-01-15T10:00:00.000Z",
  "duration": 2,
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "specialInstructions": "Special requirements",
  "paymentMethod": "paypal"
}
```

**Implementation Notes:**
- Validates service availability
- Calculates pricing based on duration
- Integrates with PayPal for payments
- Sends confirmation emails
- Validates service area coverage

#### 9. Get Bookings
```
GET /api/marketplace/bookings
```

**Query Parameters:**
- `status` - Booking status filter
- `type` - 'client', 'provider', or 'all'

**Implementation Notes:**
- Returns bookings for authenticated user
- Supports filtering by role (client/provider)
- Includes service and user details
- Implements pagination

#### 10. Update Booking Status
```
PUT /api/marketplace/bookings/:id/status
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Status Options:**
- `pending` - Initial status
- `confirmed` - Provider confirmed
- `in_progress` - Service in progress
- `completed` - Service completed
- `cancelled` - Booking cancelled

**Implementation Notes:**
- Validates authorization (client or provider)
- Updates completion timestamps
- Triggers status change notifications
- Maintains booking history

#### 11. Upload Booking Photos
```
POST /api/marketplace/bookings/:id/photos
```

**Request Body:**
- `type` - 'before' or 'after'
- `photos` - Image files

**Implementation Notes:**
- Supports before/after photo uploads
- Uses Cloudinary for storage
- Generates thumbnails
- Organizes photos by type

#### 12. Add Review
```
POST /api/marketplace/bookings/:id/review
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent service!",
  "categories": {
    "quality": 5,
    "communication": 4,
    "punctuality": 5
  }
}
```

**Implementation Notes:**
- Only allows reviews for completed bookings
- Updates service ratings automatically
- Supports photo attachments
- Prevents duplicate reviews

### PayPal Integration Endpoints

#### 13. Approve PayPal Booking
```
POST /api/marketplace/bookings/paypal/approve
```

**Request Body:**
```json
{
  "orderId": "paypal_order_id"
}
```

**Implementation Notes:**
- Captures PayPal payment
- Updates booking payment status
- Sends confirmation emails
- Handles payment failures gracefully

#### 14. Get PayPal Order Details
```
GET /api/marketplace/bookings/paypal/order/:orderId
```

**Implementation Notes:**
- Retrieves PayPal order information
- Validates order ownership
- Returns payment status and details

### User-Specific Endpoints

#### 15. Get My Services
```
GET /api/marketplace/my-services
```

**Query Parameters:**
- `category` - Service category filter
- `status` - 'all', 'active', 'inactive'
- `page` - Pagination
- `limit` - Results per page
- `sortBy` - Sort field
- `sortOrder` - Sort direction

**Implementation Notes:**
- Returns services created by authenticated user
- Includes service statistics
- Supports filtering and sorting
- Provides analytics data

#### 16. Get My Bookings
```
GET /api/marketplace/my-bookings
```

**Query Parameters:**
- `status` - Booking status filter
- `type` - 'all', 'client', 'provider'
- `paymentStatus` - Payment status filter
- `dateFrom` - Start date filter
- `dateTo` - End date filter

**Implementation Notes:**
- Returns bookings for authenticated user
- Supports role-based filtering
- Includes comprehensive statistics
- Provides earnings/spending analytics

## Job Board Module Endpoints

### Public Endpoints

#### 1. Get All Jobs
```
GET /api/jobs
```

**Query Parameters:**
- `search` - Text search
- `category` - Job category
- `subcategory` - Job subcategory
- `jobType` - Employment type
- `experienceLevel` - Experience level
- `location` - Location filter
- `isRemote` - Remote work filter
- `minSalary` - Minimum salary
- `maxSalary` - Maximum salary
- `company` - Company name
- `featured` - Featured jobs only
- `page` - Pagination
- `limit` - Results per page
- `sortBy` - Sort field
- `sortOrder` - Sort direction

**Implementation Notes:**
- Implements MongoDB text search
- Supports advanced filtering
- Includes featured job prioritization
- Returns paginated results

#### 2. Search Jobs
```
GET /api/jobs/search
```

**Implementation Notes:**
- Advanced search with multiple filters
- Text search across job content
- Location-based filtering
- Salary range filtering
- Company-based filtering

#### 3. Get Single Job
```
GET /api/jobs/:id
```

**Implementation Notes:**
- Increments view count
- Tracks unique views
- Populates employer information
- Includes application details

### Protected Endpoints

#### 4. Create Job
```
POST /api/jobs
```

**Authorization:** Provider or Admin only

**Request Body:**
```json
{
  "title": "Job Title",
  "description": "Job Description",
  "company": {
    "name": "Company Name",
    "website": "https://company.com",
    "size": "medium",
    "industry": "Technology",
    "location": {
      "address": "123 Business St",
      "city": "City",
      "state": "State",
      "country": "Country",
      "isRemote": false,
      "remoteType": "on_site"
    }
  },
  "category": "technology",
  "subcategory": "software_development",
  "jobType": "full_time",
  "experienceLevel": "mid",
  "salary": {
    "min": 60000,
    "max": 80000,
    "currency": "USD",
    "period": "yearly",
    "isNegotiable": true
  },
  "benefits": ["health_insurance", "retirement_401k"],
  "requirements": {
    "skills": ["JavaScript", "React", "Node.js"],
    "education": {
      "level": "bachelor",
      "field": "Computer Science",
      "isRequired": true
    },
    "experience": {
      "years": 3,
      "description": "3+ years of web development experience"
    }
  },
  "responsibilities": ["Develop web applications", "Code review"],
  "qualifications": ["Bachelor's degree", "3+ years experience"]
}
```

**Implementation Notes:**
- Geocodes company addresses using Google Maps
- Validates job requirements
- Sets employer from authenticated user
- Supports comprehensive job details

#### 5. Update Job
```
PUT /api/jobs/:id
```

**Authorization:** Provider or Admin only

**Implementation Notes:**
- Validates ownership
- Supports partial updates
- Re-geocodes addresses if changed
- Maintains application integrity

#### 6. Delete Job
```
DELETE /api/jobs/:id
```

**Authorization:** Provider or Admin only

**Implementation Notes:**
- Hard delete implementation
- Removes all associated applications
- Maintains data consistency

#### 7. Apply for Job
```
POST /api/jobs/:id/apply
```

**Request Body:**
```json
{
  "coverLetter": "Cover letter text",
  "expectedSalary": 70000,
  "availability": "2024-02-01",
  "portfolio": {
    "url": "https://portfolio.com",
    "description": "Portfolio description"
  }
}
```

**File Upload:**
- `resume` - Resume file (PDF, DOC, DOCX)

**Implementation Notes:**
- Validates job availability
- Prevents duplicate applications
- Uploads resume to Cloudinary
- Sends notification emails
- Tracks application metrics

#### 8. Get My Applications
```
GET /api/jobs/my-applications
```

**Query Parameters:**
- `status` - Application status filter
- `page` - Pagination
- `limit` - Results per page

**Implementation Notes:**
- Returns applications by authenticated user
- Supports status filtering
- Includes job and employer details
- Provides application history

#### 9. Get My Jobs (Employer)
```
GET /api/jobs/my-jobs
```

**Authorization:** Provider or Admin only

**Query Parameters:**
- `status` - Job status filter
- `page` - Pagination
- `limit` - Results per page

**Implementation Notes:**
- Returns jobs created by employer
- Includes application statistics
- Supports status filtering
- Provides job performance metrics

#### 10. Get Job Applications
```
GET /api/jobs/:id/applications
```

**Authorization:** Provider or Admin only

**Query Parameters:**
- `status` - Application status filter
- `page` - Pagination
- `limit` - Results per page

**Implementation Notes:**
- Returns applications for specific job
- Supports status filtering
- Includes applicant details
- Implements pagination

#### 11. Update Application Status
```
PUT /api/jobs/:id/applications/:applicationId/status
```

**Authorization:** Provider or Admin only

**Request Body:**
```json
{
  "status": "shortlisted",
  "feedback": {
    "rating": 4,
    "comments": "Strong candidate",
    "strengths": ["Technical skills", "Communication"],
    "weaknesses": ["Experience level"],
    "recommendation": "hire"
  }
}
```

**Status Options:**
- `pending` - Initial status
- `reviewing` - Under review
- `shortlisted` - Shortlisted for interview
- `interviewed` - Interview completed
- `rejected` - Application rejected
- `hired` - Application accepted

**Implementation Notes:**
- Updates application status
- Sends notification emails
- Tracks application metrics
- Maintains feedback history

#### 12. Upload Company Logo
```
POST /api/jobs/:id/logo
```

**Authorization:** Provider or Admin only

**File Upload:**
- `logo` - Company logo image

**Implementation Notes:**
- Uploads logo to Cloudinary
- Generates optimized versions
- Updates job with logo URL
- Supports various image formats

#### 13. Get Job Statistics
```
GET /api/jobs/:id/stats
```

**Authorization:** Provider or Admin only

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "totalViews": 150,
    "uniqueViews": 120,
    "totalApplications": 25,
    "applicationsByStatus": {
      "pending": 10,
      "reviewing": 5,
      "shortlisted": 3,
      "interviewed": 2,
      "rejected": 3,
      "hired": 2
    },
    "averageApplicationTime": 2.5,
    "daysSincePosted": 15
  }
}
```

**Implementation Notes:**
- Provides comprehensive job analytics
- Tracks view and application metrics
- Calculates performance indicators
- Supports business intelligence

## Data Models

### Service Schema (Marketplace)
```javascript
{
  title: String,
  description: String,
  category: String,
  subcategory: String,
  provider: ObjectId, // Reference to User
  pricing: {
    basePrice: Number,
    currency: String,
    type: String // 'hourly', 'fixed', 'per_unit'
  },
  serviceArea: [String],
  availability: {
    monday: [String],
    tuesday: [String],
    // ... other days
  },
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  rating: {
    average: Number,
    count: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Schema (Marketplace)
```javascript
{
  service: ObjectId, // Reference to Service
  client: ObjectId, // Reference to User
  provider: ObjectId, // Reference to User
  bookingDate: Date,
  duration: Number,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  specialInstructions: String,
  pricing: {
    basePrice: Number,
    totalAmount: Number,
    currency: String
  },
  payment: {
    method: String, // 'cash', 'paypal'
    status: String, // 'pending', 'paid', 'failed'
    paypalOrderId: String,
    paypalTransactionId: String,
    paidAt: Date
  },
  status: String, // 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  beforePhotos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  afterPhotos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  review: {
    rating: Number,
    comment: String,
    categories: Object,
    photos: [{
      url: String,
      publicId: String,
      thumbnail: String
    }],
    createdAt: Date
  },
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Job Schema (Job Board)
```javascript
{
  title: String,
  description: String,
  company: {
    name: String,
    logo: {
      url: String,
      publicId: String
    },
    website: String,
    size: String, // 'startup', 'small', 'medium', 'large', 'enterprise'
    industry: String,
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      isRemote: Boolean,
      remoteType: String // 'fully_remote', 'hybrid', 'on_site'
    }
  },
  employer: ObjectId, // Reference to User
  category: String,
  subcategory: String,
  jobType: String, // 'full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary'
  experienceLevel: String, // 'entry', 'junior', 'mid', 'senior', 'lead', 'executive'
  salary: {
    min: Number,
    max: Number,
    currency: String,
    period: String, // 'hourly', 'daily', 'weekly', 'monthly', 'yearly'
    isNegotiable: Boolean,
    isConfidential: Boolean
  },
  benefits: [String],
  requirements: {
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
  responsibilities: [String],
  qualifications: [String],
  applicationProcess: {
    deadline: Date,
    startDate: Date,
    applicationMethod: String,
    contactEmail: String,
    contactPhone: String,
    applicationUrl: String,
    instructions: String
  },
  status: String, // 'draft', 'active', 'paused', 'closed', 'filled'
  visibility: String, // 'public', 'private', 'featured'
  applications: [{
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
  views: {
    count: Number,
    unique: Number
  },
  analytics: {
    applicationsCount: Number,
    viewsCount: Number,
    sharesCount: Number,
    savesCount: Number
  },
  tags: [String],
  isActive: Boolean,
  featured: {
    isFeatured: Boolean,
    featuredUntil: Date,
    featuredAt: Date
  },
  promoted: {
    isPromoted: Boolean,
    promotedUntil: Date,
    promotedAt: Date,
    promotionType: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Implementation Notes

### Authentication & Authorization
- **JWT-based authentication** for protected endpoints
- **Role-based access control** (Provider, Admin, Client)
- **Resource ownership validation** for updates/deletes
- **Rate limiting** on API endpoints

### Database Optimization
- **MongoDB indexes** for performance:
  - Text search indexes for job/service content
  - Geospatial indexes for location-based queries
  - Compound indexes for filtering
  - Status and visibility indexes
- **Aggregation pipelines** for statistics
- **Pagination** for large result sets

### File Upload Handling
- **Cloudinary integration** for file storage
- **Image optimization** and thumbnail generation
- **File type validation** and size limits
- **Secure file URLs** with expiration

### Email Notifications
- **Automated email triggers** for:
  - Booking confirmations
  - Application notifications
  - Status updates
  - Payment confirmations
- **Template-based email system**
- **Error handling** for email failures

### Payment Integration
- **PayPal integration** for secure payments
- **Payment status tracking**
- **Refund handling**
- **Transaction logging**

### Google Maps Integration
- **Geocoding** for address validation
- **Distance calculations** for nearby services
- **Location-based filtering**
- **Service area validation**

### Performance Considerations
- **Caching strategy** for frequently accessed data
- **Database query optimization**
- **Image CDN** for fast loading
- **Pagination** for large datasets
- **Background job processing** for heavy operations

### Security Measures
- **Input validation** and sanitization
- **SQL injection prevention**
- **XSS protection**
- **File upload security**
- **Rate limiting** and DDoS protection

### Monitoring & Analytics
- **Application metrics** tracking
- **Performance monitoring**
- **Error logging** and alerting
- **User behavior analytics**
- **Business intelligence** reporting

## Error Handling

### Standard Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Testing

### API Testing
- **Unit tests** for individual endpoints
- **Integration tests** for complete workflows
- **Load testing** for performance validation
- **Security testing** for vulnerability assessment

### Test Data
- **Mock data** for development
- **Test fixtures** for consistent testing
- **Database seeding** for test environments
- **API documentation** with examples

## Deployment Considerations

### Environment Variables
- Database connection strings
- API keys for external services
- File storage configuration
- Email service configuration
- Payment gateway credentials

### Database Migrations
- Schema versioning
- Data migration scripts
- Index creation
- Data validation

### Monitoring Setup
- Application performance monitoring
- Error tracking and alerting
- Database performance monitoring
- User analytics tracking

## Future Enhancements

### Planned Features
- **Real-time notifications** using WebSockets
- **Advanced search** with AI-powered matching
- **Video interviews** integration
- **Skills assessment** tools
- **Referral system** implementation
- **Mobile app** optimization

### Integration Opportunities
- **CRM systems** for applicant tracking
- **Calendar integration** for scheduling
- **Social media** integration for job sharing
- **Analytics platforms** for business intelligence
- **Third-party job boards** for job distribution

---

*This documentation is maintained by the LocalPro development team. For updates and changes, please refer to the latest version.*
