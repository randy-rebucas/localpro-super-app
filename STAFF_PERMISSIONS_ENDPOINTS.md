# Staff & Permissions API Endpoints

Complete list of all new endpoints for staff and permission management.

## Base URLs

- **Staff API**: `/api/staff`
- **Permissions API**: `/api/permissions`

---

## Staff Management Endpoints

### 1. Get All Staff Members

```
GET /api/staff
```

**Description:** Get a paginated list of all staff members with their assigned permissions.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `search` | string | - | Search by name, email, or phone |
| `isActive` | boolean | - | Filter by active status |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | Sort order (asc/desc) |

**Required Permission:** `staff.view` or `system.manage`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "staff": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### 2. Get Staff Statistics

```
GET /api/staff/stats
```

**Description:** Get statistics about staff members and their permissions.

**Required Permission:** `staff.view` or `system.manage`

**Response:** 200 OK
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
    "permissionsByModule": [...]
  }
}
```

---

### 3. Get Staff Member by ID

```
GET /api/staff/:id
```

**Description:** Get detailed information about a specific staff member including permissions.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

**Required Permission:** `staff.view` or `system.manage`

**Response:** 200 OK
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
    "permissions": [...]
  }
}
```

---

### 4. Create Staff Member

```
POST /api/staff
```

**Description:** Create a new staff member account.

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
- `isActive` (boolean) - Active status (default: true)

**Required Permission:** `staff.create` or `system.manage`

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Staff member created successfully",
  "data": {...}
}
```

---

### 5. Update Staff Member

```
PUT /api/staff/:id
```

**Description:** Update staff member information.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

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

**Required Permission:** `staff.update` or `system.manage`

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Staff member updated successfully",
  "data": {...}
}
```

---

### 6. Delete Staff Member

```
DELETE /api/staff/:id
```

**Description:** Soft delete a staff member and automatically revoke all permissions.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

**Required Permission:** `staff.manage` or `system.manage`

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Staff member deleted successfully"
}
```

---

### 7. Get Staff Permissions

```
GET /api/staff/:id/permissions
```

**Description:** Get all permissions assigned to a staff member with assignment details.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

**Required Permission:** `staff.view` or `staff.permissions` or `system.manage`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "permissions": [...],
    "assignments": [...]
  }
}
```

---

### 8. Assign Permissions to Staff

```
POST /api/staff/:id/permissions
```

**Description:** Assign one or more permissions to a staff member.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

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

**Required Fields:**
- `permissionCodes` (array) - Array of permission codes

**Optional Fields:**
- `expiresAt` (string) - ISO date string for expiration
- `notes` (string) - Notes about the assignment

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 9. Revoke Permissions from Staff

```
DELETE /api/staff/:id/permissions
```

**Description:** Revoke one or more permissions from a staff member.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

**Request Body:**
```json
{
  "permissionCodes": [
    "users.view",
    "marketplace.view"
  ]
}
```

**Required Fields:**
- `permissionCodes` (array) - Array of permission codes to revoke

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 10. Bulk Update Staff Status

```
PATCH /api/staff/bulk/status
```

**Description:** Update the active status of multiple staff members at once.

**Request Body:**
```json
{
  "staffIds": ["id1", "id2", "id3"],
  "isActive": true
}
```

**Required Fields:**
- `staffIds` (array) - Array of staff member IDs
- `isActive` (boolean) - New active status

**Required Permission:** `staff.manage` or `system.manage`

**Response:** 200 OK
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

---

### 11. Remove Staff Role

```
PATCH /api/staff/:id/remove-role
```

**Description:** Remove the staff role from a user (converts back to regular user) and revokes all permissions.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Staff member ID |

**Required Permission:** `staff.manage` or `system.manage`

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Staff role removed successfully",
  "data": {...}
}
```

---

## Permission Management Endpoints

### 1. Get All Permissions

```
GET /api/permissions
```

**Description:** Get a paginated list of all permissions.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `module` | string | - | Filter by module |
| `action` | string | - | Filter by action |
| `isActive` | boolean | - | Filter by active status |
| `search` | string | - | Search by name, code, or description |
| `sortBy` | string | module | Sort field |
| `sortOrder` | string | asc | Sort order (asc/desc) |

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 2. Get Permission Statistics

```
GET /api/permissions/stats
```

**Description:** Get comprehensive statistics about permissions.

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 95,
    "inactive": 5,
    "system": 50,
    "custom": 50,
    "byModule": [...],
    "byAction": [...],
    "mostAssigned": [...]
  }
}
```

---

### 3. Get Permission Modules

```
GET /api/permissions/modules
```

**Description:** Get list of all available permission modules.

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 4. Get Available Actions

```
GET /api/permissions/actions
```

**Description:** Get list of all available permission actions.

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 5. Get Permission by ID

```
GET /api/permissions/:id
```

**Description:** Get detailed information about a specific permission.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Permission ID |

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 6. Get Permissions by Module

```
GET /api/permissions/module/:module
```

**Description:** Get all permissions for a specific module.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `module` | string | Module name (e.g., 'users', 'marketplace') |

**Required Permission:** `staff.permissions` or `system.manage`

**Response:** 200 OK
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

---

### 7. Create Permission

```
POST /api/permissions
```

**Description:** Create a new custom permission.

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

**Required Permission:** Admin only

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Permission created successfully",
  "data": {...}
}
```

---

### 8. Update Permission

```
PUT /api/permissions/:id
```

**Description:** Update a permission (cannot update system permissions).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Permission ID |

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

**Required Permission:** Admin only

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Permission updated successfully",
  "data": {...}
}
```

---

### 9. Delete Permission

```
DELETE /api/permissions/:id
```

**Description:** Soft delete a permission (cannot delete system permissions).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Permission ID |

**Required Permission:** Admin only

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Permission deleted successfully"
}
```

---

### 10. Initialize System Permissions

```
POST /api/permissions/initialize
```

**Description:** Initialize all system permissions (creates them if they don't exist).

**Required Permission:** Admin only

**Response:** 200 OK
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

---

### 11. Bulk Create Permissions

```
POST /api/permissions/bulk
```

**Description:** Create multiple permissions at once.

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

**Required Fields:**
- `permissions` (array) - Array of permission objects

**Required Permission:** Admin only

**Response:** 201 Created
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

---

## Summary

### Staff Endpoints (11 total)
- ✅ `GET /api/staff` - List all staff
- ✅ `GET /api/staff/stats` - Staff statistics
- ✅ `GET /api/staff/:id` - Get staff by ID
- ✅ `POST /api/staff` - Create staff
- ✅ `PUT /api/staff/:id` - Update staff
- ✅ `DELETE /api/staff/:id` - Delete staff
- ✅ `GET /api/staff/:id/permissions` - Get staff permissions
- ✅ `POST /api/staff/:id/permissions` - Assign permissions
- ✅ `DELETE /api/staff/:id/permissions` - Revoke permissions
- ✅ `PATCH /api/staff/bulk/status` - Bulk update status
- ✅ `PATCH /api/staff/:id/remove-role` - Remove staff role

### Permission Endpoints (11 total)
- ✅ `GET /api/permissions` - List all permissions
- ✅ `GET /api/permissions/stats` - Permission statistics
- ✅ `GET /api/permissions/modules` - Get modules
- ✅ `GET /api/permissions/actions` - Get actions
- ✅ `GET /api/permissions/:id` - Get permission by ID
- ✅ `GET /api/permissions/module/:module` - Get by module
- ✅ `POST /api/permissions` - Create permission
- ✅ `PUT /api/permissions/:id` - Update permission
- ✅ `DELETE /api/permissions/:id` - Delete permission
- ✅ `POST /api/permissions/initialize` - Initialize system permissions
- ✅ `POST /api/permissions/bulk` - Bulk create permissions

**Total: 22 new endpoints**

---

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## Permission Requirements

Most endpoints require specific permissions:
- **Admin role** - Has access to all endpoints automatically
- **Staff role** - Requires explicit permission assignments
- **Other roles** - Use role-based permissions (existing system)

## Error Codes

Common error codes returned:
- `VALIDATION_ERROR` - Input validation failed
- `STAFF_NOT_FOUND` - Staff member not found
- `PERMISSION_NOT_FOUND` - Permission not found
- `DUPLICATE_ERROR` - Duplicate entry (email, phone, etc.)
- `INVALID_ID` - Invalid ID format
- `INVALID_EMAIL_FORMAT` - Invalid email format
- `EMAIL_ALREADY_EXISTS` - Email already in use

