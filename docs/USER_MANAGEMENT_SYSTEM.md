# User Management System Documentation

## Overview

The User Management System provides comprehensive functionality for managing users within the LocalPro Super App platform. It includes user creation, updates, status management, verification, and analytics capabilities.

## Features

### Core Functionality
- **User CRUD Operations**: Create, read, update, and delete users
- **Role-based Access Control**: Different permission levels for different user roles
- **User Status Management**: Activate, deactivate, suspend, or ban users
- **Verification System**: Manage user verification status across multiple criteria
- **Badge System**: Award badges to users for achievements
- **Bulk Operations**: Perform operations on multiple users simultaneously
- **User Analytics**: Comprehensive statistics and insights

### User Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all user management operations |
| **Agency Owner** | Manage users within their agency |
| **Agency Admin** | Manage and view users within their agency |
| **Provider** | View own profile and agency members |
| **Client** | View and update own profile only |
| **Supplier** | View and update own profile only |
| **Instructor** | View and update own profile only |

## API Endpoints

### Base URL
```
/api/users
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Documentation

### 1. Get All Users
**GET** `/api/users`

Retrieve a paginated list of users with filtering and sorting options.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `role` (string, optional): Filter by user role
- `isActive` (boolean, optional): Filter by active status
- `isVerified` (boolean, optional): Filter by verification status
- `search` (string, optional): Search in name, email, phone, or business name
- `sortBy` (string, optional): Sort field (default: 'createdAt')
- `sortOrder` (string, optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50,
      "limit": 10
    }
  }
}
```

**Access:** Admin, Agency Admin, Agency Owner

---

### 2. Get User Statistics
**GET** `/api/users/stats`

Retrieve comprehensive user statistics and analytics.

**Query Parameters:**
- `agencyId` (string, optional): Filter stats by agency

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "verifiedUsers": 100,
    "usersByRole": [
      { "_id": "client", "count": 80 },
      { "_id": "provider", "count": 50 }
    ],
    "recentUsers": [...],
    "topRatedUsers": [...]
  }
}
```

**Access:** Admin, Agency Admin, Agency Owner

---

### 3. Get User by ID
**GET** `/api/users/:id`

Retrieve detailed information about a specific user.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "role": "provider",
    "isActive": true,
    "isVerified": true,
    "profile": {...},
    "verification": {...},
    "badges": [...],
    "activity": {...}
  }
}
```

**Access:** Admin, Agency Admin, Agency Owner, Provider, Client (own profile)

---

### 4. Create User
**POST** `/api/users`

Create a new user account.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client",
  "agencyId": "agency_id", // optional
  "agencyRole": "provider" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    // ... other user fields
  }
}
```

**Access:** Admin only

---

### 5. Update User
**PUT** `/api/users/:id`

Update user information.

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "email": "updated@example.com",
  "profile": {
    "bio": "Updated bio"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    // Updated user object
  }
}
```

**Access:** Admin, Agency Admin, Agency Owner, Provider, Client (own profile)

---

### 6. Update User Status
**PATCH** `/api/users/:id/status`

Activate or deactivate a user account.

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Violation of terms of service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "isActive": false
  }
}
```

**Access:** Admin, Agency Admin

---

### 7. Update User Verification
**PATCH** `/api/users/:id/verification`

Update user verification status.

**Request Body:**
```json
{
  "verification": {
    "phoneVerified": true,
    "emailVerified": true,
    "identityVerified": true,
    "businessVerified": false,
    "addressVerified": true,
    "bankAccountVerified": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User verification updated successfully",
  "data": {
    "verification": {...},
    "isVerified": true,
    "trustScore": 75
  }
}
```

**Access:** Admin, Agency Admin

---

### 8. Add User Badge
**POST** `/api/users/:id/badges`

Award a badge to a user.

**Request Body:**
```json
{
  "type": "verified_provider",
  "description": "Completed identity verification"
}
```

**Available Badge Types:**
- `verified_provider`
- `top_rated`
- `fast_response`
- `reliable`
- `expert`
- `newcomer`

**Response:**
```json
{
  "success": true,
  "message": "Badge added successfully",
  "data": {
    "badges": [...],
    "trustScore": 80
  }
}
```

**Access:** Admin, Agency Admin

---

### 9. Bulk Update Users
**PATCH** `/api/users/bulk`

Update multiple users simultaneously.

**Request Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"],
  "updateData": {
    "tags": ["vip_customer"],
    "status": "active"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Updated 3 users successfully",
  "data": {
    "matchedCount": 3,
    "modifiedCount": 3
  }
}
```

**Access:** Admin only

---

### 10. Delete User
**DELETE** `/api/users/:id`

Soft delete a user (marks as inactive and adds deletion timestamp).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Access:** Admin only

## User Model Enhancements

The User model has been enhanced with additional fields for comprehensive user management:

### New Fields Added:
- `lastLoginAt`: Timestamp of last login
- `lastLoginIP`: IP address of last login
- `loginCount`: Total number of logins
- `status`: User status (active, inactive, suspended, pending_verification, banned)
- `statusReason`: Reason for status change
- `statusUpdatedAt`: When status was last updated
- `statusUpdatedBy`: Who updated the status
- `deletedAt`: Soft deletion timestamp
- `deletedBy`: Who deleted the user
- `notes`: Array of admin notes
- `tags`: Array of user tags for categorization
- `activity`: Activity tracking information

### New Methods Added:
- `updateLoginInfo(ip, userAgent)`: Update login information
- `addNote(note, addedBy)`: Add admin note
- `updateStatus(status, reason, updatedBy)`: Update user status
- `addTag(tag)`: Add user tag
- `removeTag(tag)`: Remove user tag
- `hasTag(tag)`: Check if user has tag
- `getActivitySummary()`: Get user activity summary

### Static Methods Added:
- `getUsersByStatus(status)`: Get users by status
- `getUsersByRole(role)`: Get users by role
- `getActiveUsers()`: Get active users
- `getLowTrustUsers(threshold)`: Get users with low trust score
- `getRecentUsers(days)`: Get recently registered users

## Authorization Middleware

The system includes a comprehensive authorization middleware (`src/middleware/authorize.js`) that provides:

- Role-based access control
- Agency-specific permissions
- Self-access permissions
- Permission checking utilities

### Usage Example:
```javascript
const { authorize } = require('../middleware/authorize');

// Only admins can access
router.get('/admin-only', authorize(['admin']), controller.adminOnly);

// Admins and agency admins can access
router.get('/management', authorize(['admin', 'agency_admin']), controller.management);

// Allow users to access their own data
router.get('/profile/:id', authorize(['admin', 'client'], { allowSelf: true }), controller.getProfile);
```

## Testing

A comprehensive test suite is provided in `test-user-management.js` that covers all endpoints and functionality.

### Running Tests:
```bash
# Set your admin token
export ADMIN_TOKEN="your-admin-jwt-token"

# Run the tests
node test-user-management.js
```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Role-based Authorization**: Different access levels based on user roles
3. **Agency Isolation**: Agency admins can only manage users within their agency
4. **Audit Logging**: All user management operations are logged
5. **Input Validation**: Comprehensive validation of all input data
6. **Rate Limiting**: API rate limiting to prevent abuse

## Error Handling

The system provides comprehensive error handling with appropriate HTTP status codes:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server errors

## Integration with Existing Systems

The User Management System integrates seamlessly with:

- **Authentication System**: Uses existing JWT authentication
- **Audit Logging**: All operations are logged for compliance
- **Email Service**: Sends notifications for status changes
- **Agency Management**: Supports agency-based user management
- **Referral System**: Maintains referral relationships
- **Trust Verification**: Updates trust scores based on verification status

## Best Practices

1. **Always use proper authorization**: Check user permissions before operations
2. **Log all changes**: Use audit logging for compliance and debugging
3. **Validate input**: Always validate and sanitize input data
4. **Handle errors gracefully**: Provide meaningful error messages
5. **Use pagination**: For large datasets, always implement pagination
6. **Soft delete**: Use soft deletion to maintain data integrity
7. **Update trust scores**: Recalculate trust scores when verification changes

## Future Enhancements

Potential future enhancements include:

1. **Advanced Filtering**: More sophisticated filtering options
2. **User Import/Export**: Bulk user import and export functionality
3. **Advanced Analytics**: More detailed user analytics and reporting
4. **Notification System**: Real-time notifications for user management events
5. **User Groups**: Ability to create and manage user groups
6. **Advanced Permissions**: More granular permission system
7. **API Rate Limiting**: Per-user rate limiting
8. **User Activity Tracking**: More detailed activity tracking and analytics
