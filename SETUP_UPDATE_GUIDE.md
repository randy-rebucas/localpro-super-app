# Setup Files Update Guide

## Overview
The User model has been refactored to use separate models for related data. This guide outlines the changes needed in setup files.

## Key Changes

### 1. User Model Structure
- **Removed embedded objects**: `verification`, `trustScore`, `badges`, `responseTime`, `completionRate`, `cancellationRate`, `referral`, `wallet`, `status`, `lastLoginAt`, `lastLoginIP`, `loginCount`, `activity`, `subscription`, `preferences`
- **New structure**: These are now separate models referenced by ObjectId:
  - `UserTrust` - verification, trustScore, badges, responseTime, completionRate, cancellationRate
  - `UserReferral` - referral data
  - `UserWallet` - wallet data
  - `UserManagement` - status, lastLoginAt, lastLoginIP, loginCount
  - `UserActivity` - activity tracking
  - `LocalProPlus` - subscription data

### 2. User Creation Pattern

#### OLD (Don't use):
```javascript
const user = new User({
  phoneNumber: '+1234567890',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'client',  // ❌ Single role
  isVerified: true,
  verification: {  // ❌ Embedded
    phoneVerified: true,
    emailVerified: true
  },
  trustScore: 100,  // ❌ Embedded
  badges: [...],  // ❌ Embedded
  wallet: {  // ❌ Embedded
    balance: 0,
    currency: 'PHP'
  },
  status: 'active',  // ❌ Embedded
  lastLoginAt: new Date(),  // ❌ Embedded
  activity: {...}  // ❌ Embedded
});
await user.save();
```

#### NEW (Use this):
```javascript
// Create user with minimal fields
const user = new User({
  phoneNumber: '+1234567890',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  roles: ['client'],  // ✅ Array of roles
  isVerified: true,
  profile: {
    // profile data only
  }
});

// Save first to trigger post-save hook for related documents
await user.save();

// Set up verification status
await user.verify('phone');
await user.verify('email');
await user.verify('identity');  // if needed

// Add badges
await user.addBadge('verified_provider', 'Description');

// Update trust metrics (if needed)
const trust = await user.ensureTrust();
trust.updateResponseTime(10);
trust.updateCompletionRate(98, 100);
trust.updateCancellationRate(2, 100);
await trust.save();

// Update login info and status
await user.updateLoginInfo('127.0.0.1', 'User-Agent-String');
await user.updateStatus('active', null, null);

// Add wallet balance (if needed)
const wallet = await user.ensureWallet();
if (wallet.balance === 0) {
  await wallet.addCredit({
    category: 'initial_deposit',
    amount: 5000,
    currency: 'PHP',
    description: 'Initial wallet balance'
  });
}

// Generate referral code
await user.generateReferralCode();
```

### 3. Role References
- **OLD**: `user.role` (single string)
- **NEW**: `user.roles` (array of strings)
- **When searching**: `u.roles && u.roles.includes('admin')` instead of `u.role === 'admin'`

### 4. Available Helper Methods
- `user.ensureTrust()` - Get or create UserTrust document
- `user.ensureReferral()` - Get or create UserReferral document
- `user.ensureWallet()` - Get or create UserWallet document
- `user.ensureManagement()` - Get or create UserManagement document
- `user.ensureActivity()` - Get or create UserActivity document
- `user.verify(type)` - Verify phone, email, identity, business, address, bankAccount
- `user.addBadge(type, description)` - Add badge to user
- `user.updateLoginInfo(ip, userAgent)` - Update login information
- `user.updateStatus(status, reason, updatedBy)` - Update user status
- `user.generateReferralCode()` - Generate referral code

## Files to Update
1. ✅ `setup-app.js` - Partially updated
2. ⏳ `setup-auto.js` - Needs update
3. ⏳ `setup-install.js` - Needs update

## Notes
- Related documents (Trust, Activity, Management, Wallet, Referral) are created automatically via post-save hook
- Always use `roles` array instead of single `role` field
- Use helper methods instead of directly setting embedded objects
- Wallet balance should be set using `wallet.addCredit()` method for proper transaction tracking

