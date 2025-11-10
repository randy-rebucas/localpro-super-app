# Multi-Role System - How It Works

## 🎯 Core Concept

Instead of a single role, users now have an **array of roles**. This allows one person to be:
- A **client** (books services)
- A **provider** (offers services) 
- An **instructor** (teaches courses)
- A **supplier** (sells supplies)
- An **agency_owner** (manages an agency)
- All at the same time! 🚀

---

## 📝 Example Scenarios

### Scenario 1: Client Becomes Provider

**Before:**
```javascript
// User could only be ONE thing
user.role = 'client'  // Can only book services
```

**After:**
```javascript
// User starts as client
user.roles = ['client']

// User decides to also offer services
user.addRole('provider')
await user.save()

// Now user has BOTH roles
console.log(user.roles)  // ['client', 'provider']

// User can now:
// ✅ Book services (as client)
// ✅ Offer services (as provider)
```

### Scenario 2: Provider Adds Instructor Role

```javascript
const user = await User.findById(userId)

// User is already client + provider
console.log(user.roles)  // ['client', 'provider']

// User wants to teach courses too
user.addRole('instructor')
await user.save()

// Now user has THREE roles
console.log(user.roles)  // ['client', 'provider', 'instructor']

// User can now:
// ✅ Book services (client)
// ✅ Offer services (provider)  
// ✅ Create courses (instructor)
```

### Scenario 3: Agency Owner with Multiple Roles

```javascript
const user = await User.findById(userId)

// Set multiple roles at once
user.setRoles(['client', 'provider', 'agency_owner'])
await user.save()

console.log(user.roles)  // ['client', 'provider', 'agency_owner']

// User can now:
// ✅ Book services (client)
// ✅ Offer services (provider)
// ✅ Manage agency (agency_owner)
```

---

## 🔍 Checking Roles

### Method 1: Check for Single Role

```javascript
// Check if user has a specific role
if (user.hasRole('provider')) {
  console.log('User can offer services')
}

if (user.hasRole('instructor')) {
  console.log('User can create courses')
}
```

### Method 2: Check for Any Role

```javascript
// Check if user has ANY of these roles
if (user.hasAnyRole(['provider', 'instructor'])) {
  console.log('User can offer services OR teach courses')
}

// This returns true if user has:
// - provider role, OR
// - instructor role, OR  
// - both roles
```

### Method 3: Check for All Roles

```javascript
// Check if user has ALL of these roles
if (user.hasAllRoles(['client', 'provider'])) {
  console.log('User is both client AND provider')
}

// This only returns true if user has BOTH roles
```

---

## 🛡️ Authorization with Multiple Roles

### Route Protection

```javascript
// Allow users with EITHER provider OR admin role
router.post('/services', 
  auth, 
  authorize('provider', 'admin'), 
  createService
)

// This allows:
// ✅ Users with 'provider' role
// ✅ Users with 'admin' role  
// ✅ Users with BOTH roles
// ❌ Users with only 'client' role
```

### In Controllers

```javascript
// Old way (single role check)
if (req.user.role === 'admin') {
  // Only admins
}

// New way (multi-role check)
const userRoles = req.user.roles || (req.user.role ? [req.user.role] : [])
const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin')

if (isAdmin) {
  // Users with admin role (even if they have other roles too)
}
```

---

## 🔧 Managing Roles

### Adding a Role

```javascript
const user = await User.findById(userId)

// Add provider role
user.addRole('provider')
await user.save()

// User now has: ['client', 'provider']
```

### Removing a Role

```javascript
const user = await User.findById(userId)

// Remove provider role (but keep client)
user.removeRole('provider')
await user.save()

// User now has: ['client']
```

### Setting Multiple Roles

```javascript
const user = await User.findById(userId)

// Replace all roles
user.setRoles(['client', 'provider', 'instructor'])
await user.save()

// User now has exactly: ['client', 'provider', 'instructor']
```

---

## 🔐 Important Rules

### Rule 1: Client Role is Always Present

```javascript
// Every user MUST have 'client' role
user.roles = ['client']  // ✅ Valid
user.roles = ['provider']  // ❌ Invalid - will auto-add 'client'

// When you add other roles, 'client' is automatically added
user.addRole('provider')
// Result: ['client', 'provider']  ✅
```

### Rule 2: Cannot Remove Last Role

```javascript
// If user only has 'client' role
user.roles = ['client']

// Cannot remove it
user.removeRole('client')  // ❌ Won't work - user must have at least one role
```

### Rule 3: Authorization Checks "Any Match"

```javascript
// Route requires: authorize('provider', 'admin')

// User with roles: ['client', 'provider']
// ✅ ALLOWED - has 'provider' role

// User with roles: ['client', 'admin']  
// ✅ ALLOWED - has 'admin' role

// User with roles: ['client', 'provider', 'admin']
// ✅ ALLOWED - has both required roles

// User with roles: ['client']
// ❌ DENIED - doesn't have 'provider' or 'admin'
```

---

## 📊 Database Queries

### Find Users by Role

```javascript
// Find all providers (including users who are client+provider)
const providers = await User.find({ roles: 'provider' })

// Find users with ANY of these roles
const serviceProviders = await User.find({ 
  roles: { $in: ['provider', 'instructor'] } 
})

// Using static method
const providers = await User.getUsersByRole('provider')
const multiRole = await User.getUsersByRole(['provider', 'instructor'])
```

### Aggregation Example

```javascript
// Count users by role (unwind to handle arrays)
const roleStats = await User.aggregate([
  { $unwind: '$roles' },
  { $group: { _id: '$roles', count: { $sum: 1 } } }
])

// Result:
// [
//   { _id: 'client', count: 1000 },
//   { _id: 'provider', count: 250 },
//   { _id: 'instructor', count: 50 }
// ]
```

---

## 🎬 Real-World Example

```javascript
// Sarah starts as a client
const sarah = await User.create({
  phoneNumber: '+1234567890',
  firstName: 'Sarah',
  lastName: 'Johnson'
})
console.log(sarah.roles)  // ['client']

// Sarah books a service (as client) ✅

// Later, Sarah decides to offer cleaning services
sarah.addRole('provider')
await sarah.save()
console.log(sarah.roles)  // ['client', 'provider']

// Now Sarah can:
// ✅ Book services (as client)
// ✅ Offer cleaning services (as provider)

// Sarah also wants to teach cleaning courses
sarah.addRole('instructor')
await sarah.save()
console.log(sarah.roles)  // ['client', 'provider', 'instructor']

// Now Sarah can:
// ✅ Book services (client)
// ✅ Offer services (provider)
// ✅ Create and teach courses (instructor)

// Check what Sarah can do
if (sarah.hasRole('provider')) {
  console.log('Sarah can offer services')
}

if (sarah.hasAnyRole(['provider', 'instructor'])) {
  console.log('Sarah can offer services OR teach')
}

if (sarah.hasAllRoles(['client', 'provider'])) {
  console.log('Sarah is both client AND provider')
}
```

---

## 🔄 Backward Compatibility

The system maintains backward compatibility:

```javascript
// Old code still works
const primaryRole = user.role  // Returns first role in array

// New code uses array
const allRoles = user.roles  // Returns ['client', 'provider', ...]

// JWT tokens include both
{
  "id": "...",
  "roles": ["client", "provider"],  // New
  "role": "client"  // Primary role (backward compatibility)
}
```

---

## ✅ Summary

1. **Users have multiple roles** stored in `roles` array
2. **Client role is always present** (cannot be removed if it's the only role)
3. **Authorization checks if user has ANY required role**
4. **Helper methods** make role management easy
5. **Backward compatible** with existing code

This allows users to seamlessly transition between roles and have multiple capabilities simultaneously! 🎉

