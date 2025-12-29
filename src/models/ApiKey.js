const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  accessKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  secretKey: {
    type: String,
    required: true,
    select: false // Don't include secret in queries by default
  },
  secretKeyHash: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  lastUsedIp: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  rateLimit: {
    type: Number,
    default: 1000, // requests per hour
    min: 1
  },
  allowedIPs: {
    type: [String],
    default: []
  },
  scopes: {
    type: [String],
    default: ['read', 'write'] // API scopes/permissions
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
apiKeySchema.index({ accessKey: 1, isActive: 1 });
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate access key and secret key
apiKeySchema.statics.generateKeys = function() {
  const accessKey = `lp_${crypto.randomBytes(16).toString('hex')}`;
  const secretKey = crypto.randomBytes(32).toString('hex');
  const secretKeyHash = crypto.createHash('sha256').update(secretKey).digest('hex');
  
  return {
    accessKey,
    secretKey,
    secretKeyHash
  };
};

// Verify secret key
apiKeySchema.methods.verifySecret = function(secretKey) {
  const hash = crypto.createHash('sha256').update(secretKey).digest('hex');
  return hash === this.secretKeyHash;
};

// Check if API key is expired
apiKeySchema.methods.isExpired = function() {
  if (!this.expiresAt) {
    return false;
  }
  return new Date() > this.expiresAt;
};

// Check if IP is allowed
apiKeySchema.methods.isIpAllowed = function(ip) {
  if (!this.allowedIPs || this.allowedIPs.length === 0) {
    return true; // No IP restrictions
  }
  return this.allowedIPs.includes(ip);
};

// Update last used information
apiKeySchema.methods.updateLastUsed = function(ip) {
  this.lastUsedAt = new Date();
  this.lastUsedIp = ip;
  return this.save();
};

// Virtual for masking secret key (only show last 4 characters)
apiKeySchema.virtual('maskedSecretKey').get(function() {
  if (!this.secretKey) {
    return '****';
  }
  return `****${this.secretKey.slice(-4)}`;
});

// Transform output to exclude sensitive data
apiKeySchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.secretKey;
  delete obj.secretKeyHash;
  return obj;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);

