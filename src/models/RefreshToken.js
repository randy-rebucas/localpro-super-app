/**
 * RefreshToken – one document per active device / session.
 *
 * Replaces the single `user.refreshToken` field with a proper collection that
 * allows a user to be logged in from multiple devices simultaneously.  When a
 * user logs out on one device the token for that session is revoked without
 * affecting other sessions.
 *
 * MongoDB auto-purges expired tokens via the TTL index on `expiresAt`.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    /** Raw token value (opaque 64-byte hex string). */
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    /** Logical device identifier (e.g. from x-device-id header). */
    deviceId: { type: String, default: null },
    /** "mobile" | "tablet" | "desktop" | "unknown" */
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    /** Set when the token is explicitly revoked (logout / security event). */
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

// TTL – MongoDB removes documents automatically when expiresAt is reached.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─────────────────────────────────────────────────────────────────────────────
// Static helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create and persist a new refresh token for a user session.
 * @param {string|ObjectId} userId
 * @param {Object} [deviceInfo]
 * @returns {Promise<RefreshToken>} Saved document (use `.token` for the value)
 */
refreshTokenSchema.statics.issue = async function (userId, deviceInfo = {}) {
  const expiresInDays = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || '7', 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const doc = new this({
    token: crypto.randomBytes(64).toString('hex'),
    userId,
    deviceId: deviceInfo.deviceId || null,
    deviceType: deviceInfo.deviceType || 'unknown',
    userAgent: deviceInfo.userAgent || null,
    ipAddress: deviceInfo.ipAddress || null,
    expiresAt
  });

  return doc.save();
};

/**
 * Find an active (non-revoked, non-expired) token.
 * @param {string} token
 * @returns {Promise<RefreshToken|null>}
 */
refreshTokenSchema.statics.findActive = function (token) {
  return this.findOne({
    token,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Revoke a single token.
 * @param {string} token
 */
refreshTokenSchema.statics.revoke = function (token) {
  return this.findOneAndUpdate({ token }, { revokedAt: new Date() });
};

/**
 * Revoke all tokens for a user (optionally excluding one).
 * @param {string|ObjectId} userId
 * @param {string} [exceptToken] - Token to keep (e.g. current session)
 */
refreshTokenSchema.statics.revokeAll = function (userId, exceptToken) {
  const filter = { userId, revokedAt: null };
  if (exceptToken) filter.token = { $ne: exceptToken };
  return this.updateMany(filter, { revokedAt: new Date() });
};

/**
 * Rotate a refresh token (revoke old, issue new).
 * @param {string} oldToken
 * @param {Object} [extraDeviceInfo]
 * @returns {Promise<RefreshToken>} New token document
 */
refreshTokenSchema.statics.rotate = async function (oldToken, extraDeviceInfo = {}) {
  const existing = await this.findOne({ token: oldToken });
  if (!existing) throw new Error('Token not found');

  // Revoke the old token
  existing.revokedAt = new Date();
  await existing.save();

  // Issue replacement inheriting device info
  return this.issue(existing.userId, {
    deviceId: extraDeviceInfo.deviceId || existing.deviceId,
    deviceType: extraDeviceInfo.deviceType || existing.deviceType,
    userAgent: extraDeviceInfo.userAgent || existing.userAgent,
    ipAddress: extraDeviceInfo.ipAddress || existing.ipAddress
  });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
