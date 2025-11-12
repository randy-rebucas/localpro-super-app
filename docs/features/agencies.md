# Agencies Feature Documentation

## Overview
The Agencies feature enables agency owners to create and manage agencies, coordinate multiple providers, and manage agency operations.

## Base Path
`/api/agencies`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all agencies | page, limit, industry, location |
| GET | `/:id` | Get agency details | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/` | Create agency | AUTHENTICATED |
| PUT | `/:id` | Update agency | AUTHENTICATED |
| DELETE | `/:id` | Delete agency | AUTHENTICATED |
| POST | `/:id/logo` | Upload agency logo | AUTHENTICATED |
| POST | `/:id/providers` | Add provider | AUTHENTICATED |
| DELETE | `/:id/providers/:providerId` | Remove provider | AUTHENTICATED |
| PUT | `/:id/providers/:providerId/status` | Update provider status | AUTHENTICATED |
| POST | `/:id/admins` | Add admin | AUTHENTICATED |
| DELETE | `/:id/admins/:adminId` | Remove admin | AUTHENTICATED |
| GET | `/:id/analytics` | Get agency analytics | AUTHENTICATED |
| GET | `/my/agencies` | Get my agencies | AUTHENTICATED |
| POST | `/join` | Join agency | AUTHENTICATED |
| POST | `/leave` | Leave agency | AUTHENTICATED |

## Request/Response Examples

### Create Agency
```http
POST /api/agencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Manila Cleaning Services",
  "description": "Professional cleaning agency",
  "businessInfo": {
    "industry": "cleaning",
    "businessType": "corporation",
    "foundedYear": 2020
  },
  "contactInfo": {
    "email": "contact@manilacleaning.com",
    "phone": "+639123456789"
  },
  "location": {
    "city": "Manila",
    "address": "123 Business St"
  }
}
```

### Add Provider to Agency
```http
POST /api/agencies/:id/providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "providerId": "provider_id_here",
  "role": "provider",
  "permissions": ["view_bookings", "manage_services"]
}
```

## Agency Management Flow

1. **Agency Creation**:
   - Owner creates agency
   - Owner adds business information
   - Owner uploads logo
   - Agency becomes active

2. **Provider Management**:
   - Owner adds providers
   - Owner manages provider status
   - Owner assigns permissions

3. **Admin Management**:
   - Owner adds admins
   - Owner manages admin permissions
   - Admins assist with operations

4. **Analytics**:
   - Owner views agency performance
   - Owner tracks provider performance
   - Owner monitors bookings and revenue

## Related Features
- Providers
- User Management
- Analytics
- Marketplace

