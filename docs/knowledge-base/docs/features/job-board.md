# Job Board Feature

## Overview

The Job Board feature provides a platform for employers to post job openings and job seekers to find employment opportunities in the service industry.

## Key Features

- **Job Postings** - Create and manage job listings
- **Job Applications** - Application submission and tracking
- **Job Search** - Advanced search and filtering
- **Employer Profiles** - Company information
- **Application Management** - Track application status

## API Endpoints

### Jobs

```
GET    /api/jobs                        # List jobs
GET    /api/jobs/:id                    # Get job details
POST   /api/jobs                        # Create job (employer/admin)
PUT    /api/jobs/:id                    # Update job
DELETE /api/jobs/:id                    # Delete job
```

### Applications

```
POST   /api/jobs/:id/apply              # Apply for job
GET    /api/jobs/my-applications        # Get user applications
GET    /api/jobs/:id/applications       # Get job applications (employer)
PUT    /api/jobs/applications/:id/status # Update application status
```

## Data Model

```typescript
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract';
  status: 'open' | 'closed';
}
```

## Related Features

- [Marketplace](./marketplace.md) - Service marketplace
- [Providers](../api/endpoints.md#providers) - Provider profiles

## Documentation

For complete API documentation:
- [Jobs API Endpoints](../../../features/jobs/api-endpoints.md)

