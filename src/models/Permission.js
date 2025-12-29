const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  // Permission identifier (e.g., 'users.view', 'marketplace.create')
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // Human-readable name
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Description of what this permission allows
  description: {
    type: String,
    trim: true
  },
  // Category/Module this permission belongs to
  module: {
    type: String,
    required: true,
    enum: [
      'users',
      'providers',
      'marketplace',
      'bookings',
      'jobs',
      'agencies',
      'finance',
      'escrows',
      'subscriptions',
      'analytics',
      'supplies',
      'academy',
      'rentals',
      'ads',
      'facility_care',
      'referrals',
      'communication',
      'settings',
      'trust_verification',
      'partners',
      'system',
      'logs',
      'audit'
    ],
    trim: true
  },
  // Action type (view, create, update, delete, manage, etc.)
  action: {
    type: String,
    required: true,
    enum: [
      'view',
      'create',
      'update',
      'delete',
      'manage',
      'approve',
      'reject',
      'suspend',
      'activate',
      'export',
      'import',
      'configure'
    ],
    trim: true
  },
  // Feature this permission is for (optional, for more granular control)
  feature: {
    type: String,
    trim: true
  },
  // Whether this permission is active
  isActive: {
    type: Boolean,
    default: true
  },
  // Whether this is a system permission (cannot be deleted)
  isSystem: {
    type: Boolean,
    default: false
  },
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
// Note: code index is automatically created by unique: true in schema definition
permissionSchema.index({ module: 1, action: 1 });
permissionSchema.index({ module: 1, feature: 1 });
permissionSchema.index({ isActive: 1 });
permissionSchema.index({ isSystem: 1 });

// Static method to get permissions by module
permissionSchema.statics.getByModule = function(module) {
  return this.find({ module, isActive: true }).sort({ name: 1 });
};

// Static method to get permissions by action
permissionSchema.statics.getByAction = function(action) {
  return this.find({ action, isActive: true }).sort({ module: 1, name: 1 });
};

// Static method to find or create permission
permissionSchema.statics.findOrCreate = async function(data) {
  let permission = await this.findOne({ code: data.code });
  
  if (!permission) {
    permission = await this.create(data);
  }
  
  return permission;
};

// Static method to initialize system permissions
permissionSchema.statics.initializeSystemPermissions = async function() {
  const systemPermissions = [
    // Users Module
    { code: 'users.view', name: 'View Users', description: 'View user profiles and information', module: 'users', action: 'view', isSystem: true },
    { code: 'users.create', name: 'Create Users', description: 'Create new user accounts', module: 'users', action: 'create', isSystem: true },
    { code: 'users.update', name: 'Update Users', description: 'Update user information', module: 'users', action: 'update', isSystem: true },
    { code: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', module: 'users', action: 'delete', isSystem: true },
    { code: 'users.manage', name: 'Manage Users', description: 'Full user management access', module: 'users', action: 'manage', isSystem: true },
    { code: 'users.suspend', name: 'Suspend Users', description: 'Suspend user accounts', module: 'users', action: 'suspend', isSystem: true },
    { code: 'users.activate', name: 'Activate Users', description: 'Activate suspended users', module: 'users', action: 'activate', isSystem: true },
    
    // Providers Module
    { code: 'providers.view', name: 'View Providers', description: 'View provider profiles', module: 'providers', action: 'view', isSystem: true },
    { code: 'providers.create', name: 'Create Providers', description: 'Create provider accounts', module: 'providers', action: 'create', isSystem: true },
    { code: 'providers.update', name: 'Update Providers', description: 'Update provider information', module: 'providers', action: 'update', isSystem: true },
    { code: 'providers.approve', name: 'Approve Providers', description: 'Approve provider applications', module: 'providers', action: 'approve', isSystem: true },
    { code: 'providers.reject', name: 'Reject Providers', description: 'Reject provider applications', module: 'providers', action: 'reject', isSystem: true },
    { code: 'providers.manage', name: 'Manage Providers', description: 'Full provider management', module: 'providers', action: 'manage', isSystem: true },
    
    // Marketplace Module
    { code: 'marketplace.view', name: 'View Marketplace', description: 'View marketplace services', module: 'marketplace', action: 'view', isSystem: true },
    { code: 'marketplace.create', name: 'Create Services', description: 'Create marketplace services', module: 'marketplace', action: 'create', isSystem: true },
    { code: 'marketplace.update', name: 'Update Services', description: 'Update marketplace services', module: 'marketplace', action: 'update', isSystem: true },
    { code: 'marketplace.delete', name: 'Delete Services', description: 'Delete marketplace services', module: 'marketplace', action: 'delete', isSystem: true },
    { code: 'marketplace.manage', name: 'Manage Marketplace', description: 'Full marketplace management', module: 'marketplace', action: 'manage', isSystem: true },
    
    // Bookings Module
    { code: 'bookings.view', name: 'View Bookings', description: 'View booking information', module: 'bookings', action: 'view', isSystem: true },
    { code: 'bookings.create', name: 'Create Bookings', description: 'Create new bookings', module: 'bookings', action: 'create', isSystem: true },
    { code: 'bookings.update', name: 'Update Bookings', description: 'Update booking details', module: 'bookings', action: 'update', isSystem: true },
    { code: 'bookings.cancel', name: 'Cancel Bookings', description: 'Cancel bookings', module: 'bookings', action: 'delete', isSystem: true },
    { code: 'bookings.manage', name: 'Manage Bookings', description: 'Full booking management', module: 'bookings', action: 'manage', isSystem: true },
    
    // Jobs Module
    { code: 'jobs.view', name: 'View Jobs', description: 'View job postings', module: 'jobs', action: 'view', isSystem: true },
    { code: 'jobs.create', name: 'Create Jobs', description: 'Create job postings', module: 'jobs', action: 'create', isSystem: true },
    { code: 'jobs.update', name: 'Update Jobs', description: 'Update job postings', module: 'jobs', action: 'update', isSystem: true },
    { code: 'jobs.delete', name: 'Delete Jobs', description: 'Delete job postings', module: 'jobs', action: 'delete', isSystem: true },
    { code: 'jobs.manage', name: 'Manage Jobs', description: 'Full job board management', module: 'jobs', action: 'manage', isSystem: true },
    
    // Agencies Module
    { code: 'agencies.view', name: 'View Agencies', description: 'View agency information', module: 'agencies', action: 'view', isSystem: true },
    { code: 'agencies.create', name: 'Create Agencies', description: 'Create new agencies', module: 'agencies', action: 'create', isSystem: true },
    { code: 'agencies.update', name: 'Update Agencies', description: 'Update agency information', module: 'agencies', action: 'update', isSystem: true },
    { code: 'agencies.manage', name: 'Manage Agencies', description: 'Full agency management', module: 'agencies', action: 'manage', isSystem: true },
    
    // Finance Module
    { code: 'finance.view', name: 'View Finance', description: 'View financial information', module: 'finance', action: 'view', isSystem: true },
    { code: 'finance.manage', name: 'Manage Finance', description: 'Full financial management', module: 'finance', action: 'manage', isSystem: true },
    { code: 'finance.export', name: 'Export Finance', description: 'Export financial reports', module: 'finance', action: 'export', isSystem: true },
    
    // Escrows Module
    { code: 'escrows.view', name: 'View Escrows', description: 'View escrow accounts', module: 'escrows', action: 'view', isSystem: true },
    { code: 'escrows.manage', name: 'Manage Escrows', description: 'Full escrow management', module: 'escrows', action: 'manage', isSystem: true },
    { code: 'escrows.approve', name: 'Approve Escrows', description: 'Approve escrow transactions', module: 'escrows', action: 'approve', isSystem: true },
    
    // Analytics Module
    { code: 'analytics.view', name: 'View Analytics', description: 'View analytics and reports', module: 'analytics', action: 'view', isSystem: true },
    { code: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', module: 'analytics', action: 'export', isSystem: true },
    
    // Settings Module
    { code: 'settings.view', name: 'View Settings', description: 'View system settings', module: 'settings', action: 'view', isSystem: true },
    { code: 'settings.configure', name: 'Configure Settings', description: 'Configure system settings', module: 'settings', action: 'configure', isSystem: true },
    
    // System Module
    { code: 'system.manage', name: 'System Management', description: 'Full system management access', module: 'system', action: 'manage', isSystem: true },
    { code: 'system.logs', name: 'View System Logs', description: 'View system logs', module: 'system', action: 'view', isSystem: true },
    { code: 'system.audit', name: 'View Audit Logs', description: 'View audit logs', module: 'audit', action: 'view', isSystem: true },
    
    // Staff Management
    { code: 'staff.view', name: 'View Staff', description: 'View staff members', module: 'system', action: 'view', feature: 'staff', isSystem: true },
    { code: 'staff.create', name: 'Create Staff', description: 'Create staff accounts', module: 'system', action: 'create', feature: 'staff', isSystem: true },
    { code: 'staff.update', name: 'Update Staff', description: 'Update staff information', module: 'system', action: 'update', feature: 'staff', isSystem: true },
    { code: 'staff.manage', name: 'Manage Staff', description: 'Full staff management', module: 'system', action: 'manage', feature: 'staff', isSystem: true },
    { code: 'staff.permissions', name: 'Manage Staff Permissions', description: 'Assign permissions to staff', module: 'system', action: 'manage', feature: 'staff_permissions', isSystem: true }
  ];
  
  const results = [];
  for (const perm of systemPermissions) {
    const existing = await this.findOne({ code: perm.code });
    if (!existing) {
      const created = await this.create(perm);
      results.push(created);
    } else {
      results.push(existing);
    }
  }
  
  return results;
};

module.exports = mongoose.model('Permission', permissionSchema);

