const mongoose = require('mongoose');

const userManagementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Login tracking
  lastLoginAt: Date,
  lastLoginIP: String,
  loginCount: {
    type: Number,
    default: 0
  },
  // Status management
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification', 'banned'],
    default: 'pending_verification'
  },
  statusReason: String,
  statusUpdatedAt: Date,
  statusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Soft delete
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Notes for admin tracking
  notes: [{
    note: {
      type: String,
      required: true,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Tags for categorizing users
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
// Note: user already has unique: true which creates an index
userManagementSchema.index({ status: 1 });
userManagementSchema.index({ deletedAt: 1 });
userManagementSchema.index({ 'statusUpdatedBy': 1 });
userManagementSchema.index({ tags: 1 });
userManagementSchema.index({ lastLoginAt: -1 });
userManagementSchema.index({ status: 1, deletedAt: 1 });

// Compound indexes
userManagementSchema.index({ status: 1, lastLoginAt: -1 });

// Method to update login information
userManagementSchema.methods.updateLoginInfo = function(ip, _userAgent) {
  this.lastLoginAt = new Date();
  this.lastLoginIP = ip;
  this.loginCount += 1;
  return this.save();
};

// Method to update status
userManagementSchema.methods.updateStatus = function(status, reason, updatedBy) {
  const validStatuses = ['active', 'inactive', 'suspended', 'pending_verification', 'banned'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  
  // Don't allow status update if user is deleted
  if (this.deletedAt) {
    throw new Error('Cannot update status of deleted user');
  }
  
  this.status = status;
  this.statusReason = reason || null;
  this.statusUpdatedAt = new Date();
  this.statusUpdatedBy = updatedBy || null;
  
  return this.save();
};

// Method to soft delete user
userManagementSchema.methods.softDelete = function(deletedBy) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy || null;
  this.status = 'banned';
  this.statusReason = 'User account deleted';
  this.statusUpdatedAt = new Date();
  this.statusUpdatedBy = deletedBy || null;
  return this.save();
};

// Method to restore user
userManagementSchema.methods.restore = function(restoredBy) {
  this.deletedAt = null;
  this.deletedBy = null;
  this.status = 'active';
  this.statusReason = 'User account restored';
  this.statusUpdatedAt = new Date();
  this.statusUpdatedBy = restoredBy || null;
  return this.save();
};

// Method to add note
userManagementSchema.methods.addNote = function(note, addedBy) {
  if (!note || !note.trim()) {
    throw new Error('Note cannot be empty');
  }
  if (!addedBy) {
    throw new Error('addedBy is required');
  }
  
  this.notes.push({
    note: note.trim(),
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Method to remove note
userManagementSchema.methods.removeNote = function(noteId) {
  this.notes = this.notes.filter(note => note._id.toString() !== noteId.toString());
  return this.save();
};

// Method to get notes
userManagementSchema.methods.getNotes = function(options = {}) {
  const { limit, skip, sortBy = 'addedAt', sortOrder = -1 } = options;
  let notes = [...this.notes];
  
  // Sort notes
  notes.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return sortOrder === -1 ? bValue - aValue : aValue - bValue;
  });
  
  // Apply pagination
  if (skip) notes = notes.slice(skip);
  if (limit) notes = notes.slice(0, limit);
  
  return notes;
};

// Method to add tag
userManagementSchema.methods.addTag = function(tag) {
  if (!tag || !tag.trim()) {
    throw new Error('Tag cannot be empty');
  }
  
  const trimmedTag = tag.trim();
  if (!this.tags.includes(trimmedTag)) {
    this.tags.push(trimmedTag);
  }
  return this.save();
};

// Method to remove tag
userManagementSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Method to check if user has tag
userManagementSchema.methods.hasTag = function(tag) {
  return this.tags.includes(tag);
};

// Method to set tags (replaces all existing tags)
userManagementSchema.methods.setTags = function(tags) {
  if (!Array.isArray(tags)) {
    throw new Error('Tags must be an array');
  }
  this.tags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
  return this.save();
};

// Method to get management summary
userManagementSchema.methods.getSummary = function() {
  return {
    lastLoginAt: this.lastLoginAt,
    lastLoginIP: this.lastLoginIP,
    loginCount: this.loginCount,
    status: this.status,
    statusReason: this.statusReason,
    statusUpdatedAt: this.statusUpdatedAt,
    deletedAt: this.deletedAt,
    notesCount: this.notes.length,
    tags: this.tags,
    isDeleted: !!this.deletedAt
  };
};

// Static method to find or create management document for user
userManagementSchema.statics.findOrCreateForUser = async function(userId, defaultStatus = 'pending_verification') {
  let management = await this.findOne({ user: userId });
  
  if (!management) {
    management = await this.create({
      user: userId,
      status: defaultStatus
    });
  }
  
  return management;
};

// Static method to get users by status
userManagementSchema.statics.getUsersByStatus = function(status) {
  return this.find({ status, deletedAt: null }).populate('user');
};

// Static method to get active users
userManagementSchema.statics.getActiveUsers = function() {
  return this.find({ status: 'active', deletedAt: null }).populate('user');
};

// Static method to get deleted users
userManagementSchema.statics.getDeletedUsers = function() {
  return this.find({ deletedAt: { $ne: null } }).populate('user');
};

// Static method to get users by tag
userManagementSchema.statics.getUsersByTag = function(tag) {
  return this.find({ tags: tag, deletedAt: null }).populate('user');
};

module.exports = mongoose.model('UserManagement', userManagementSchema);

