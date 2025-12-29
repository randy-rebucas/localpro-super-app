const mongoose = require('mongoose');

const staffPermissionSchema = new mongoose.Schema({
  // Staff user reference
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Permission reference
  permission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true,
    index: true
  },
  // Whether this permission is granted
  granted: {
    type: Boolean,
    default: true
  },
  // Who granted this permission
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // When this permission was granted
  grantedAt: {
    type: Date,
    default: Date.now
  },
  // Optional expiration date
  expiresAt: {
    type: Date,
    default: null
  },
  // Notes about this permission assignment
  notes: {
    type: String,
    trim: true
  },
  // Whether this permission assignment is active
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate permission assignments
staffPermissionSchema.index({ staff: 1, permission: 1 }, { unique: true });
staffPermissionSchema.index({ staff: 1, isActive: 1 });
staffPermissionSchema.index({ permission: 1, isActive: 1 });
staffPermissionSchema.index({ expiresAt: 1 });

// Method to check if permission is still valid
staffPermissionSchema.methods.isValid = function() {
  if (!this.isActive || !this.granted) {
    return false;
  }
  
  if (this.expiresAt && this.expiresAt < new Date()) {
    return false;
  }
  
  return true;
};

// Static method to get all active permissions for a staff member
staffPermissionSchema.statics.getStaffPermissions = async function(staffId) {
  const staffPermissions = await this.find({
    staff: staffId,
    isActive: true,
    granted: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('permission');
  
  return staffPermissions
    .filter(sp => sp.isValid())
    .map(sp => sp.permission);
};

// Static method to check if staff has a specific permission
staffPermissionSchema.statics.hasPermission = async function(staffId, permissionCode) {
  const Permission = mongoose.model('Permission');
  const permission = await Permission.findOne({ code: permissionCode, isActive: true });
  
  if (!permission) {
    return false;
  }
  
  const staffPermission = await this.findOne({
    staff: staffId,
    permission: permission._id,
    isActive: true,
    granted: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  return staffPermission && staffPermission.isValid();
};

// Static method to check if staff has any of the specified permissions
staffPermissionSchema.statics.hasAnyPermission = async function(staffId, permissionCodes) {
  const Permission = mongoose.model('Permission');
  const permissions = await Permission.find({
    code: { $in: permissionCodes },
    isActive: true
  });
  
  if (permissions.length === 0) {
    return false;
  }
  
  const permissionIds = permissions.map(p => p._id);
  
  const staffPermission = await this.findOne({
    staff: staffId,
    permission: { $in: permissionIds },
    isActive: true,
    granted: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  return staffPermission && staffPermission.isValid();
};

// Static method to grant permission to staff
staffPermissionSchema.statics.grantPermission = async function(staffId, permissionId, grantedBy, options = {}) {
  const { expiresAt, notes } = options;
  
  // Check if permission already exists
  let staffPermission = await this.findOne({
    staff: staffId,
    permission: permissionId
  });
  
  if (staffPermission) {
    // Update existing permission
    staffPermission.granted = true;
    staffPermission.grantedBy = grantedBy;
    staffPermission.grantedAt = new Date();
    staffPermission.isActive = true;
    if (expiresAt) staffPermission.expiresAt = expiresAt;
    if (notes) staffPermission.notes = notes;
    await staffPermission.save();
  } else {
    // Create new permission assignment
    staffPermission = await this.create({
      staff: staffId,
      permission: permissionId,
      granted: true,
      grantedBy,
      expiresAt,
      notes
    });
  }
  
  return staffPermission;
};

// Static method to revoke permission
staffPermissionSchema.statics.revokePermission = async function(staffId, permissionId, revokedBy) {
  const staffPermission = await this.findOne({
    staff: staffId,
    permission: permissionId
  });
  
  if (staffPermission) {
    staffPermission.granted = false;
    staffPermission.isActive = false;
    if (revokedBy) {
      staffPermission.grantedBy = revokedBy;
    }
    await staffPermission.save();
  }
  
  return staffPermission;
};

// Static method to bulk grant permissions
staffPermissionSchema.statics.bulkGrant = async function(staffId, permissionIds, grantedBy, options = {}) {
  const results = [];
  
  for (const permissionId of permissionIds) {
    try {
      const staffPermission = await this.grantPermission(staffId, permissionId, grantedBy, options);
      results.push({ permissionId, success: true, staffPermission });
    } catch (error) {
      results.push({ permissionId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Static method to bulk revoke permissions
staffPermissionSchema.statics.bulkRevoke = async function(staffId, permissionIds, revokedBy) {
  const results = [];
  
  for (const permissionId of permissionIds) {
    try {
      const staffPermission = await this.revokePermission(staffId, permissionId, revokedBy);
      results.push({ permissionId, success: true, staffPermission });
    } catch (error) {
      results.push({ permissionId, success: false, error: error.message });
    }
  }
  
  return results;
};

module.exports = mongoose.model('StaffPermission', staffPermissionSchema);

