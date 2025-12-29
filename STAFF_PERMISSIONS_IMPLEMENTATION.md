# Staff Feature and Permission System Implementation

## Overview

This document describes the comprehensive staff feature and permission system that allows you to create staff members and assign granular permissions for accessing features, modules, or actions.

## Architecture

The system consists of three main components:

1. **Permission Model** - Defines available permissions (features, modules, actions)
2. **StaffPermission Model** - Links staff users to their assigned permissions
3. **Permission Middleware** - Validates permissions for route access

## Models

### Permission Model (`src/models/Permission.js`)

Stores all available permissions in the system.

**Key Fields:**
- `code`: Unique permission identifier (e.g., `users.view`, `marketplace.create`)
- `name`: Human-readable name
- `description`: What this permission allows
- `module`: Category/module (users, marketplace, finance, etc.)
- `action`: Action type (view, create, update, delete, manage, approve, etc.)
- `feature`: Optional feature-specific permission
- `isActive`: Whether permission is active
- `isSystem`: Whether it's a system permission (cannot be deleted)

**Available Modules:**
- users
- providers
- marketplace
- bookings
- jobs
- agencies
- finance
- escrows
- subscriptions
- analytics
- supplies
- academy
- rentals
- ads
- facility_care
- referrals
- communication
- settings
- trust_verification
- partners
- system
- logs
- audit

**Available Actions:**
- view
- create
- update
- delete
- manage
- approve
- reject
- suspend
- activate
- export
- import
- configure

### StaffPermission Model (`src/models/StaffPermission.js`)

Links staff users to their assigned permissions.

**Key Fields:**
- `staff`: Reference to User with staff role
- `permission`: Reference to Permission
- `granted`: Whether permission is granted
- `grantedBy`: Who granted the permission
- `grantedAt`: When permission was granted
- `expiresAt`: Optional expiration date
- `notes`: Notes about the permission assignment
- `isActive`: Whether assignment is active

## API Endpoints

### Staff Management

#### Get All Staff
```
GET /api/staff
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10)
  - search: Search term (name, email, phone)
  - isActive: Filter by active status
  - sortBy: Sort field (default: createdAt)
  - sortOrder: asc or desc (default: desc)

Required Permission: staff.view or system.manage
```

#### Get Staff by ID
```
GET /api/staff/:id

Required Permission: staff.view or system.manage
```

#### Create Staff
```
POST /api/staff
Body:
{
  "phoneNumber": "+1234567890",
  "email": "staff@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true
}

Required Permission: staff.create or system.manage
```

#### Update Staff
```
PUT /api/staff/:id
Body:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "isActive": true
}

Required Permission: staff.update or system.manage
```

#### Delete Staff
```
DELETE /api/staff/:id

Required Permission: staff.manage or system.manage
```

#### Get Staff Permissions
```
GET /api/staff/:id/permissions

Required Permission: staff.view or staff.permissions or system.manage
```

#### Assign Permissions to Staff
```
POST /api/staff/:id/permissions
Body:
{
  "permissionCodes": ["users.view", "marketplace.create", "finance.view"],
  "expiresAt": "2024-12-31T23:59:59Z", // Optional
  "notes": "Temporary access for project" // Optional
}

Required Permission: staff.permissions or system.manage
```

#### Revoke Permissions from Staff
```
DELETE /api/staff/:id/permissions
Body:
{
  "permissionCodes": ["users.view", "marketplace.create"]
}

Required Permission: staff.permissions or system.manage
```

### Permission Management

#### Get All Permissions
```
GET /api/permissions
Query Parameters:
  - module: Filter by module
  - action: Filter by action
  - isActive: Filter by active status
  - search: Search term
  - sortBy: Sort field (default: module)
  - sortOrder: asc or desc (default: asc)

Required Permission: staff.permissions or system.manage
```

#### Get Permission by ID
```
GET /api/permissions/:id

Required Permission: staff.permissions or system.manage
```

#### Get Permissions by Module
```
GET /api/permissions/module/:module

Required Permission: staff.permissions or system.manage
```

#### Get Available Modules
```
GET /api/permissions/modules

Required Permission: staff.permissions or system.manage
```

#### Create Permission
```
POST /api/permissions
Body:
{
  "code": "custom.feature.action",
  "name": "Custom Feature Action",
  "description": "Allows custom feature action",
  "module": "system",
  "action": "manage",
  "feature": "custom_feature"
}

Required Permission: admin only
```

#### Update Permission
```
PUT /api/permissions/:id
Body:
{
  "name": "Updated Name",
  "description": "Updated description",
  "isActive": true
}

Required Permission: admin only
Note: Cannot update system permissions
```

#### Delete Permission
```
DELETE /api/permissions/:id

Required Permission: admin only
Note: Cannot delete system permissions
```

#### Initialize System Permissions
```
POST /api/permissions/initialize

Required Permission: admin only
Note: Creates all default system permissions if they don't exist
```

## Usage Examples

### 1. Creating a Staff Member

```javascript
// POST /api/staff
const response = await fetch('/api/staff', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    email: 'staff@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true
  })
});
```

### 2. Assigning Permissions to Staff

```javascript
// POST /api/staff/:staffId/permissions
const response = await fetch(`/api/staff/${staffId}/permissions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    permissionCodes: [
      'users.view',
      'users.update',
      'marketplace.view',
      'marketplace.create',
      'analytics.view'
    ],
    expiresAt: '2024-12-31T23:59:59Z', // Optional
    notes: 'Full access for support team'
  })
});
```

### 3. Using Permission Middleware in Routes

```javascript
const { checkPermission } = require('../middleware/checkPermission');

// Require single permission
router.get('/users',
  checkPermission('users.view'),
  getUsers
);

// Require any of multiple permissions
router.post('/users',
  checkPermission(['users.create', 'users.manage'], { requireAll: false }),
  createUser
);

// Require all permissions
router.delete('/users/:id',
  checkPermission(['users.delete', 'users.manage'], { requireAll: true }),
  deleteUser
);

// Module-level permission check
const { checkModulePermission } = require('../middleware/checkPermission');

router.get('/marketplace',
  checkModulePermission('marketplace', 'view'),
  getMarketplace
);
```

### 4. Checking Permissions Programmatically

```javascript
const { hasUserPermission } = require('../middleware/checkPermission');

// Check if user has permission
const canViewUsers = await hasUserPermission(user, 'users.view');

// Check if user has any of the permissions
const canManage = await hasUserPermission(user, ['users.manage', 'users.create']);

if (canViewUsers) {
  // Allow access
}
```

## Permission Hierarchy

1. **Admin Role**: Has all permissions automatically (bypasses permission checks)
2. **Staff Role**: Must have explicit permissions assigned
3. **Other Roles**: Use role-based permissions (defined in `authorize.js`)

## Permission Code Format

Permissions follow the format: `{module}.{action}` or `{module}.{action}.{feature}`

Examples:
- `users.view` - View users
- `users.create` - Create users
- `users.manage` - Full user management (includes all user actions)
- `marketplace.view` - View marketplace
- `finance.export` - Export financial data
- `system.manage` - Full system management

## System Permissions

The system comes with pre-defined permissions for all major modules. To initialize them:

```javascript
// POST /api/permissions/initialize
// This creates all system permissions if they don't exist
```

System permissions include:
- All CRUD operations for users, providers, marketplace, bookings, jobs, agencies
- Financial management permissions
- Analytics and reporting permissions
- System and settings management
- Staff management permissions

## Best Practices

1. **Principle of Least Privilege**: Only assign permissions that staff members actually need
2. **Use Expiration Dates**: For temporary access, set `expiresAt` when assigning permissions
3. **Document Permissions**: Use the `notes` field to document why permissions were assigned
4. **Regular Audits**: Periodically review staff permissions to ensure they're still needed
5. **Module-Level Permissions**: Use `{module}.manage` for full access to a module instead of assigning individual permissions
6. **System Permissions**: Don't modify or delete system permissions; create custom ones if needed

## Migration Guide

### Adding Staff Role to Existing User

```javascript
// Update user to have staff role
const user = await User.findById(userId);
user.addRole('staff');
await user.save();
```

### Initializing Permissions

```bash
# Make API call to initialize system permissions
curl -X POST http://localhost:5000/api/permissions/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Assigning Initial Permissions to Staff

```javascript
// After creating staff member, assign permissions
const permissionCodes = [
  'users.view',
  'users.update',
  'marketplace.view'
];

await fetch(`/api/staff/${staffId}/permissions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ permissionCodes })
});
```

## Security Considerations

1. **Admin Bypass**: Admin role automatically has all permissions - use carefully
2. **Permission Validation**: All permission checks are enforced at the middleware level
3. **Audit Logging**: All permission assignments and revocations are logged
4. **Expiration**: Expired permissions are automatically invalidated
5. **Soft Deletes**: Staff members are soft-deleted, preserving audit trail

## Troubleshooting

### Staff Member Cannot Access Route

1. Check if user has `staff` role: `user.roles.includes('staff')`
2. Verify permissions are assigned: `GET /api/staff/:id/permissions`
3. Check if permissions are expired: `expiresAt` field
4. Verify permission code matches exactly: Case-sensitive

### Permission Not Found

1. Initialize system permissions: `POST /api/permissions/initialize`
2. Check if permission exists: `GET /api/permissions?search=permission_code`
3. Verify permission is active: `isActive: true`

### Admin Cannot Access

Admin role should bypass all permission checks. If not working:
1. Verify user has `admin` role: `user.roles.includes('admin')`
2. Check middleware is checking admin role correctly
3. Verify authentication is working

## Future Enhancements

Potential improvements:
- Permission groups/roles for easier management
- Permission inheritance
- Time-based permissions (e.g., only during business hours)
- Location-based permissions
- Permission templates for common roles
- Bulk permission operations
- Permission analytics and reporting

