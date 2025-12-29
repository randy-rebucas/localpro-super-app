# Staff & Permissions API Reference

Complete API reference for staff and permission management endpoints.

## Base URLs

- Staff: `/api/staff`
- Permissions: `/api/permissions`

---

## Staff Management Endpoints

### 1. Get All Staff Members

**GET** `/api/staff`

Get a paginated list of all staff members with their permissions.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search by name, email, or phone
- `isActive` (boolean) - Filter by active status
- `sortBy` (string, default: 'createdAt') - Sort field
- `sortOrder` (string, default: 'desc') - Sort order ('asc' or 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "+1234567890",
        "roles": ["client", "staff"],
        "isActive": true,
        "permissions": [
          {
            "code": "users.view",
            "name": "View Users",
            "module": "users",
            "action": "view"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

**Required Permission:** `staff.view` or `system.manage`

---

### 2. Get Staff Member by ID

**GET** `/api/staff/:id`

Get detailed information about a specific staff member.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "roles": ["client", "staff"],
    "isActive": true,
    "permissions": [
      {
        "code": "users.view",
        "name": "View Users",
        "module": "users",
        "action": "view",
        "description": "View user profiles and information"
      }
    ]
  }
}
```

**Required Permission:** `staff.view` or `system.manage`

---

### 3. Create Staff Member

**POST** `/api/staff`

Create a new staff member.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "male",
  "birthdate": "1990-01-01",
  "isActive": true
}
```

**Required Fields:**
- `phoneNumber` (string) - Phone number
- `firstName` (string) - First name
- `lastName` (string) - Last name

**Optional Fields:**
- `email` (string) - Email address
- `gender` (string) - 'male', 'female', 'other', 'prefer_not_to_say'
- `birthdate` (string) - ISO date string
- `isActive` (boolean, default: true) - Active status

**Response:**
```json
{
  "success": true,
  "message": "Staff member created successfully",
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

**Required Permission:** `staff.create` or `system.manage`

---

### 4. Update Staff Member

**PUT** `/api/staff/:id`

Update staff member information.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "gender": "female",
  "birthdate": "1992-05-15",
  "isActive": true
}
```

All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "message": "Staff member updated successfully",
  "data": {
    "_id": "...",
    "firstName": "Jane",
    ...
  }
}
```

**Required Permission:** `staff.update` or `system.manage`

---

### 5. Delete Staff Member

**DELETE** `/api/staff/:id`

Soft delete a staff member and revoke all permissions.

**Response:**
```json
{
  "success": true,
  "message": "Staff member deleted successfully"
}
```

**Required Permission:** `staff.manage` or `system.manage`

---

### 6. Get Staff Permissions

**GET** `/api/staff/:id/permissions`

Get all permissions assigned to a staff member.

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "code": "users.view",
        "name": "View Users",
        "module": "users",
        "action": "view",
        "description": "View user profiles and information"
      }
    ],
    "assignments": [
      {
        "permission": {
          "code": "users.view",
          "name": "View Users",
          "module": "users",
          "action": "view"
        },
        "grantedBy": {
          "_id": "...",
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com"
        },
        "grantedAt": "2024-01-01T00:00:00.000Z",
        "expiresAt": null,
        "notes": "Full access for support team"
      }
    ]
  }
}
```

**Required Permission:** `staff.view` or `staff.permissions` or `system.manage`

---

### 7. Assign Permissions to Staff

**POST** `/api/staff/:id/permissions`

Assign one or more permissions to a staff member.

**Request Body:**
```json
{
  "permissionCodes": [
    "users.view",
    "users.update",
    "marketplace.view",
    "analytics.view"
  ],
  "expiresAt": "2024-12-31T23:59:59Z",
  "notes": "Temporary access for project"
}
```

**Fields:**
- `permissionCodes` (array, required) - Array of permission codes
- `expiresAt` (string, optional) - ISO date string for expiration
- `notes` (string, optional) - Notes about the permission assignment

**Response:**
```json
{
  "success": true,
  "message": "Permissions assigned successfully",
  "data": {
    "assigned": 4,
    "failed": 0,
    "results": [...]
  }
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 8. Revoke Permissions from Staff

**DELETE** `/api/staff/:id/permissions`

Revoke one or more permissions from a staff member.

**Request Body:**
```json
{
  "permissionCodes": [
    "users.view",
    "marketplace.view"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions revoked successfully",
  "data": {
    "revoked": 2,
    "failed": 0,
    "results": [...]
  }
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 9. Get Staff Statistics

**GET** `/api/staff/stats`

Get statistics about staff members and their permissions.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 20,
    "inactive": 5,
    "withPermissions": 18,
    "withoutPermissions": 7,
    "totalPermissionsAssigned": 45,
    "permissionsByModule": [
      {
        "module": "users",
        "count": 15
      },
      {
        "module": "marketplace",
        "count": 10
      }
    ]
  }
}
```

**Required Permission:** `staff.view` or `system.manage`

---

### 10. Bulk Update Staff Status

**PATCH** `/api/staff/bulk/status`

Update the active status of multiple staff members.

**Request Body:**
```json
{
  "staffIds": ["id1", "id2", "id3"],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff status updated successfully",
  "data": {
    "matched": 3,
    "modified": 3
  }
}
```

**Required Permission:** `staff.manage` or `system.manage`

---

### 11. Remove Staff Role

**PATCH** `/api/staff/:id/remove-role`

Remove the staff role from a user (converts back to regular user) and revokes all permissions.

**Response:**
```json
{
  "success": true,
  "message": "Staff role removed successfully",
  "data": {
    "_id": "...",
    "roles": ["client"],
    ...
  }
}
```

**Required Permission:** `staff.manage` or `system.manage`

---

## Permission Management Endpoints

### 1. Get All Permissions

**GET** `/api/permissions`

Get a paginated list of all permissions.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `module` (string) - Filter by module
- `action` (string) - Filter by action
- `isActive` (boolean) - Filter by active status
- `search` (string) - Search by name, code, or description
- `sortBy` (string, default: 'module') - Sort field
- `sortOrder` (string, default: 'asc') - Sort order

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 2. Get Permission by ID

**GET** `/api/permissions/:id`

Get detailed information about a specific permission.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "code": "users.view",
    "name": "View Users",
    "description": "View user profiles and information",
    "module": "users",
    "action": "view",
    "isActive": true,
    "isSystem": true
  }
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 3. Get Permissions by Module

**GET** `/api/permissions/module/:module`

Get all permissions for a specific module.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "code": "users.view",
      "name": "View Users",
      ...
    }
  ]
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 4. Create Permission

**POST** `/api/permissions`

Create a new custom permission.

**Request Body:**
```json
{
  "code": "custom.feature.action",
  "name": "Custom Feature Action",
  "description": "Allows custom feature action",
  "module": "system",
  "action": "manage",
  "feature": "custom_feature",
  "metadata": {
    "category": "custom"
  }
}
```

**Required Fields:**
- `code` (string) - Unique permission code
- `name` (string) - Human-readable name
- `module` (string) - Module name
- `action` (string) - Action type

**Optional Fields:**
- `description` (string) - Description
- `feature` (string) - Feature name
- `metadata` (object) - Additional metadata

**Response:**
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {
    "_id": "...",
    "code": "custom.feature.action",
    ...
  }
}
```

**Required Permission:** Admin only

---

### 5. Update Permission

**PUT** `/api/permissions/:id`

Update a permission (cannot update system permissions).

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isActive": true,
  "feature": "updated_feature"
}
```

All fields are optional. System permissions cannot be updated.

**Response:**
```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {
    "_id": "...",
    ...
  }
}
```

**Required Permission:** Admin only

---

### 6. Delete Permission

**DELETE** `/api/permissions/:id`

Soft delete a permission (cannot delete system permissions).

**Response:**
```json
{
  "success": true,
  "message": "Permission deleted successfully"
}
```

**Required Permission:** Admin only

---

### 7. Initialize System Permissions

**POST** `/api/permissions/initialize`

Initialize all system permissions (creates them if they don't exist).

**Response:**
```json
{
  "success": true,
  "message": "System permissions initialized successfully",
  "data": {
    "count": 50,
    "permissions": [...]
  }
}
```

**Required Permission:** Admin only

---

### 8. Get Permission Modules

**GET** `/api/permissions/modules`

Get list of all available modules.

**Response:**
```json
{
  "success": true,
  "data": [
    "users",
    "providers",
    "marketplace",
    "finance",
    ...
  ]
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 9. Get Available Actions

**GET** `/api/permissions/actions`

Get list of all available actions.

**Response:**
```json
{
  "success": true,
  "data": [
    "view",
    "create",
    "update",
    "delete",
    "manage",
    ...
  ]
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 10. Get Permission Statistics

**GET** `/api/permissions/stats`

Get statistics about permissions.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 95,
    "inactive": 5,
    "system": 50,
    "custom": 50,
    "byModule": [
      {
        "module": "users",
        "count": 15
      }
    ],
    "byAction": [
      {
        "action": "view",
        "count": 25
      }
    ],
    "mostAssigned": [
      {
        "permission": {
          "code": "users.view",
          "name": "View Users",
          "module": "users",
          "action": "view"
        },
        "assignedCount": 10
      }
    ]
  }
}
```

**Required Permission:** `staff.permissions` or `system.manage`

---

### 11. Bulk Create Permissions

**POST** `/api/permissions/bulk`

Create multiple permissions at once.

**Request Body:**
```json
{
  "permissions": [
    {
      "code": "custom1.action",
      "name": "Custom 1 Action",
      "module": "system",
      "action": "manage"
    },
    {
      "code": "custom2.action",
      "name": "Custom 2 Action",
      "module": "system",
      "action": "view"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions created",
  "data": {
    "created": 2,
    "failed": 0,
    "results": [...],
    "errors": []
  }
}
```

**Required Permission:** Admin only

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_EMAIL_FORMAT"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Staff member not found",
  "code": "STAFF_NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

---

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <token>
```

## Permission Codes Reference

### Common Permission Codes

- `staff.view` - View staff members
- `staff.create` - Create staff members
- `staff.update` - Update staff members
- `staff.manage` - Full staff management
- `staff.permissions` - Manage staff permissions
- `users.view` - View users
- `users.create` - Create users
- `users.update` - Update users
- `users.delete` - Delete users
- `users.manage` - Full user management
- `system.manage` - Full system management

See the Permission model for the complete list of system permissions.

