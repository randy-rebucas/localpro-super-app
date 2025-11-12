# Providers Feature Documentation

## Overview
The Providers feature manages service provider profiles, onboarding, verification, and dashboard analytics.

## Base Path
`/api/providers`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all providers | status, providerType, category, city, state, minRating, featured, promoted, page, limit |
| GET | `/:id` | Get provider details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/profile/me` | Get my provider profile | AUTHENTICATED |
| POST | `/profile` | Create provider profile | AUTHENTICATED |
| PUT | `/profile` | Update provider profile | AUTHENTICATED |
| PUT | `/onboarding/step` | Update onboarding step | AUTHENTICATED |
| POST | `/documents/upload` | Upload documents | AUTHENTICATED |
| GET | `/dashboard/overview` | Get provider dashboard | AUTHENTICATED |
| GET | `/analytics/performance` | Get provider analytics | AUTHENTICATED |
| GET | `/admin/all` | Get all providers (admin) | AUTHENTICATED |
| PUT | `/admin/:id/status` | Update provider status | AUTHENTICATED |

## Request/Response Examples

### Create Provider Profile
```http
POST /api/providers/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "providerType": "individual",
  "businessInfo": {
    "businessName": "John's Plumbing",
    "businessType": "small_business",
    "yearsInBusiness": 5
  },
  "professionalInfo": {
    "specialties": ["plumbing", "repair"],
    "certifications": ["Licensed Plumber"],
    "experience": 10
  },
  "serviceArea": {
    "cities": ["Manila", "Quezon City"],
    "radius": 15
  }
}
```

### Upload Documents
```http
POST /api/providers/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "documentType": "license",
  "files": [<file1>, <file2>],
  "category": "professional"
}
```

### Update Onboarding Step
```http
PUT /api/providers/onboarding/step
Authorization: Bearer <token>
Content-Type: application/json

{
  "step": "documents",
  "data": {
    "documentsUploaded": true
  }
}
```

## Provider Onboarding Flow

1. **Profile Setup**:
   - User creates provider profile via `/profile`
   - Step: `profile_setup`

2. **Business Information**:
   - User adds business details
   - Step: `business_info`

3. **Professional Information**:
   - User adds specialties, certifications
   - Step: `professional_info`

4. **Verification**:
   - User submits verification documents
   - Step: `verification`

5. **Documents**:
   - User uploads licenses, insurance
   - Step: `documents`

6. **Portfolio**:
   - User adds portfolio images
   - Step: `portfolio`

7. **Preferences**:
   - User sets service preferences
   - Step: `preferences`

8. **Review**:
   - Admin reviews and approves
   - Step: `review`
   - Status: `active`

## Provider Status

- `pending` - Profile created, awaiting verification
- `active` - Verified and active
- `suspended` - Temporarily suspended
- `inactive` - Deactivated

## Related Features
- Authentication
- Trust Verification
- Marketplace
- Finance
- Analytics

