# Multi-Role Implementation Guide

## Overview

The LocalPro Super App now supports **multi-role functionality**, allowing users to have multiple roles simultaneously. For example, a user can be both a `client` and a `provider`, or a `client`, `provider`, and `instructor` at the same time.

## What Changed

### 1. User Model (`src/models/User.js`)

- **New Field**: `roles` (array) - Replaces the single `role` field
- **Legacy Field**: `role` (string) - Kept for backward compatibility, synced automatically
- **Default**: All users start with `['client']` role

#### New Helper Methods

```javascript
// Check if user has a specific role
user.hasRole('provider') // returns true/false

// Check if user has any of the specified roles
user.hasAnyRole(['provider', 'instructor']) // returns true/false

// Check if user has all of the specified roles
user.hasAllRoles(['client', 'provider']) // returns true/false

// Add a role to user
user.addRole('provider')
await user.save()

// Remove a role from user
user.removeRole('provider')
await user.save()

// Set roles (replaces all existing roles)
user.setRoles(['client', 'provider', 'instructor'])
await user.save()
```

### 2. Authorization Middleware

Both `src/middleware/authorize.js` and `src/middleware/auth.js` now support multi-role checking:

```javascript
// Old way (still works for backward compatibility)
authorize('admin', 'provider')

// New way - checks if user has ANY of the specified roles
authorize('admin', 'provider') // User with either role can access
```

### 3. Database Queries

All queries now use the `roles` field:

```javascript
// Find users with specific role
User.find({ roles: 'provider' })

// Find users with any of multiple roles
User.find({ roles: { $in: ['provider', 'instructor'] } })

// Using the static method
User.getUsersByRole('provider')
User.getUsersByRole(['provider', 'instructor'])
```

### 4. Controllers Updated

All controllers now check roles using the helper methods:

```javascript
// Old way
if (req.user.role === 'admin') { ... }

// New way (supports multi-role)
const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
if (isAdmin) { ... }
```

## Migration

### Running the Migration Script

To migrate existing users from single `role` to `roles` array:

```bash
node scripts/migrate-roles-to-array.js
```

This script will:
1. Find all users without a `roles` array
2. Convert their `role` field to `roles` array
3. Ensure all users have at least `['client']` role
4. Show migration summary and role distribution

### Manual Migration

If you prefer to migrate manually:

```javascript
const users = await User.find({ roles: { $exists: false } });
for (const user of users) {
  user.roles = [user.role || 'client'];
  await user.save();
}
```

## Usage Examples

### Adding Roles to a User

```javascript
// Client wants to become a provider
const user = await User.findById(userId);
user.addRole('provider');
await user.save();

// User is now both client and provider
console.log(user.roles); // ['client', 'provider']
```

### Checking User Roles

```javascript
// In a controller
if (req.user.hasRole('provider')) {
  // User has provider role
}

if (req.user.hasAnyRole(['provider', 'instructor'])) {
  // User has either provider or instructor role
}
```

### Role-Based Access Control

```javascript
// Route protection
router.get('/services', auth, authorize('provider', 'admin'), getServices);

// This allows users with EITHER provider OR admin role to access
```

### Filtering Users by Role

```javascript
// Get all providers (including users who are both client and provider)
const providers = await User.find({ roles: 'provider' });

// Get users who are providers OR instructors
const serviceProviders = await User.find({ 
  roles: { $in: ['provider', 'instructor'] } 
});
```

## Role Hierarchy

The system ensures that:
- All users have at least the `client` role
- The `client` role cannot be removed if it's the only role
- Roles are stored in an array, allowing multiple roles per user

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Legacy `role` field**: Still exists and is synced automatically
2. **JWT tokens**: Include both `role` (primary) and `roles` (array)
3. **API responses**: Include both fields for compatibility
4. **Queries**: Support both `role` and `roles` fields during transition

## Common Use Cases

### 1. Client Becomes Provider

```javascript
const user = await User.findById(userId);
user.addRole('provider');
await user.save();
// User can now both book services (as client) and offer services (as provider)
```

### 2. Provider Becomes Instructor

```javascript
const user = await User.findById(userId);
user.addRole('instructor');
await user.save();
// User is now client, provider, and instructor
```

### 3. Agency Owner with Multiple Roles

```javascript
const user = await User.findById(userId);
user.setRoles(['client', 'provider', 'agency_owner']);
await user.save();
// User can manage agency, offer services, and book services
```

## Testing

After migration, test the following:

1. ✅ Users can have multiple roles
2. ✅ Authorization middleware works with multi-role
3. ✅ Role-based queries return correct results
4. ✅ Adding/removing roles works correctly
5. ✅ All users have at least 'client' role

## Notes

- The `client` role is always present and cannot be removed if it's the only role
- The primary role (first in array) is used for backward compatibility
- All role checks now support multi-role scenarios
- Database indexes have been updated to use `roles` field

## Support

For issues or questions, refer to:
- `src/models/User.js` - User model with role methods
- `src/middleware/authorize.js` - Authorization logic
- `scripts/migrate-roles-to-array.js` - Migration script

