# Users Feature

## Overview

The Users feature provides comprehensive user management functionality for the LocalPro Super App platform. This feature handles user registration, authentication, profile management, verification, trust scoring, and role-based access control across all user types in the ecosystem.

## Key Features

- **User Registration & Authentication**: Phone-based registration with SMS verification
- **Profile Management**: Comprehensive user profiles with business information, skills, and portfolio
- **Role-Based Access Control**: Multiple user roles with different permission levels
- **Verification System**: Multi-level verification including phone, email, identity, and business verification
- **Trust & Reputation System**: Trust scoring, badges, and reputation management
- **Agency Management**: User relationships with agencies and organizational structures
- **Referral System**: Complete referral tracking and reward management
- **Activity Tracking**: User behavior monitoring and analytics
- **Status Management**: User lifecycle management with activation, suspension, and deletion

## Documentation Structure

This feature documentation is organized into the following sections:

- **[Data Entities](data-entities.md)** - Detailed schema documentation for User model and related entities
- **[API Endpoints](api-endpoints.md)** - Complete API reference with request/response examples
- **[Usage Examples](usage-examples.md)** - Practical implementation examples and code snippets
- **[Best Practices](best-practices.md)** - Development guidelines and recommended patterns

## Quick Start

### User Registration
```javascript
// Send verification code
const response = await fetch('/api/auth/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+1234567890' })
});

// Verify code and register
const verifyResponse = await fetch('/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    phoneNumber: '+1234567890',
    code: '123456'
  })
});
```

### Get User Profile
```javascript
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const user = await response.json();
```

### Update User Profile
```javascript
const response = await fetch('/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profile: {
      bio: 'Professional service provider',
      skills: ['cleaning', 'maintenance'],
      businessName: 'John\'s Services'
    }
  })
});
```

## Data Models

### User
The main user model containing all user information and relationships:

- **Basic Information**: Phone number, email, name, role
- **Profile Data**: Avatar, bio, address, skills, experience, rating
- **Business Information**: Business name, type, years in business, service areas
- **Verification Status**: Phone, email, identity, business, address, bank account verification
- **Trust & Reputation**: Trust score, badges, completion rate, response time
- **Agency Relationship**: Agency membership, role, commission rate
- **Referral System**: Referral code, referral stats, rewards
- **Activity Tracking**: Login history, session data, device information
- **Status Management**: Active status, verification status, user notes

### Related Models
- **UserSettings**: User preferences and configuration
- **Agency**: Organization structure for agency users
- **UserSubscription**: LocalPro Plus subscription information

## API Endpoints

### Authentication & Registration
- `POST /api/auth/send-code` - Send SMS verification code
- `POST /api/auth/verify-code` - Verify code and register/login
- `POST /api/auth/complete-onboarding` - Complete user onboarding
- `GET /api/auth/profile-completeness` - Check profile completeness
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/upload-avatar` - Upload profile avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio images
- `POST /api/auth/logout` - Logout user

### User Management (Admin/Agency)
- `GET /api/users` - Get all users with filtering
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status
- `PATCH /api/users/:id/verification` - Update verification status
- `POST /api/users/:id/badges` - Add badge to user
- `PATCH /api/users/bulk` - Bulk update users (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/stats` - Get user statistics

## User Roles

### Client
- **Description**: End users who book services
- **Permissions**: View and update own profile, book services, leave reviews
- **Features**: Service discovery, booking management, payment processing

### Provider
- **Description**: Service providers who offer services
- **Permissions**: Manage service listings, handle bookings, update availability
- **Features**: Service creation, booking management, earnings tracking

### Supplier
- **Description**: Equipment and supply providers
- **Permissions**: Manage product listings, handle orders
- **Features**: Product catalog, inventory management, order processing

### Instructor
- **Description**: Course instructors and trainers
- **Permissions**: Create and manage courses, track enrollments
- **Features**: Course creation, student management, certification issuance

### Agency Owner
- **Description**: Owners of service agencies
- **Permissions**: Manage agency, all agency users, agency settings
- **Features**: Agency management, user oversight, financial reporting

### Agency Admin
- **Description**: Administrators within agencies
- **Permissions**: Manage agency users, view agency analytics
- **Features**: User management, performance monitoring

### Admin
- **Description**: Platform administrators
- **Permissions**: Full platform access, all user management
- **Features**: Global user management, platform analytics, system configuration

## Key Benefits

1. **Comprehensive User Management**: Complete user lifecycle management from registration to deletion
2. **Flexible Role System**: Multiple user types with appropriate permissions
3. **Trust & Verification**: Multi-level verification system for user credibility
4. **Agency Support**: Organizational structure for service agencies
5. **Referral System**: Built-in referral tracking and rewards
6. **Activity Monitoring**: Complete user behavior tracking and analytics
7. **Security**: Robust authentication and authorization system
8. **Scalability**: Designed to handle large numbers of users efficiently

## Integration Points

- **Authentication System**: JWT-based authentication with role-based access
- **SMS Service**: Twilio integration for phone verification
- **Email Service**: Email notifications and communications
- **File Upload**: Cloudinary integration for avatar and portfolio images
- **Settings Management**: Integration with user settings system
- **Analytics**: User behavior tracking and reporting
- **Audit Logging**: Complete audit trail for user actions

## Getting Started

1. Review the [Data Entities](data-entities.md) documentation to understand the user data structure
2. Check the [API Endpoints](api-endpoints.md) for available operations
3. Use the [Usage Examples](usage-examples.md) for implementation guidance
4. Follow the [Best Practices](best-practices.md) for optimal implementation

For more detailed information, explore the individual documentation files in this directory.
