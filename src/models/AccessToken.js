const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const accessTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    index: true
  },
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scopes: {
    type: [String],
    required: true,
    default: ['read']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  refreshToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  refreshTokenHash: {
    type: String
  },
  refreshTokenExpiresAt: {
    type: Date
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  lastUsedIp: {
    type: String,
    default: null
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
accessTokenSchema.index({ tokenHash: 1, isActive: 1 });
accessTokenSchema.index({ apiKeyId: 1, isActive: 1 });
accessTokenSchema.index({ userId: 1, isActive: 1 });
accessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
accessTokenSchema.index({ refreshTokenHash: 1 });

// Generate access token
accessTokenSchema.statics.generateAccessToken = function(payload, expiresIn = '1h') {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    issuer: 'localpro-api',
    audience: 'localpro-api',
    expiresIn
  });
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  return {
    token,
    tokenHash
  };
};

// Generate refresh token
accessTokenSchema.statics.generateRefreshToken = function() {
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  return {
    refreshToken,
    refreshTokenHash
  };
};

// Hash token for storage
accessTokenSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Find token by hash
accessTokenSchema.statics.findByToken = function(token) {
  const tokenHash = this.hashToken(token);
  return this.findOne({ tokenHash, isActive: true });
};

// Find refresh token by hash
accessTokenSchema.statics.findByRefreshToken = function(refreshToken) {
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  return this.findOne({ refreshTokenHash, isActive: true });
};

// Check if token is expired
accessTokenSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Check if refresh token is expired
accessTokenSchema.methods.isRefreshTokenExpired = function() {
  if (!this.refreshTokenExpiresAt) {
    return false;
  }
  return new Date() > this.refreshTokenExpiresAt;
};

// Check if token has required scope
accessTokenSchema.methods.hasScope = function(requiredScope) {
  if (!this.scopes || this.scopes.length === 0) {
    return false;
  }
  
  // Check for exact match or wildcard
  if (this.scopes.includes('*') || this.scopes.includes('admin')) {
    return true;
  }
  
  return this.scopes.includes(requiredScope);
};

// Check if token has any of the required scopes
accessTokenSchema.methods.hasAnyScope = function(requiredScopes) {
  if (!Array.isArray(requiredScopes)) {
    return this.hasScope(requiredScopes);
  }
  
  return requiredScopes.some(scope => this.hasScope(scope));
};

// Update last used information
accessTokenSchema.methods.updateLastUsed = function(ip) {
  this.lastUsedAt = new Date();
  this.lastUsedIp = ip;
  return this.save();
};

// Revoke token
accessTokenSchema.methods.revoke = function() {
  this.isActive = false;
  return this.save();
};

// Transform output to exclude sensitive data
accessTokenSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.token;
  delete obj.tokenHash;
  delete obj.refreshToken;
  delete obj.refreshTokenHash;
  return obj;
};

module.exports = mongoose.model('AccessToken', accessTokenSchema);

