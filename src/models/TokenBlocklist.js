/**
 * TokenBlocklist – MongoDB-backed JWT revocation store.
 *
 * When a user logs out (or a magic-link token is consumed) the JWT's `jti`
 * claim is inserted here.  The `accessTokenAuth` middleware checks this
 * collection before granting access, effectively invalidating the token even
 * though the JWT signature is still technically valid.
 *
 * MongoDB automatically purges documents whose `expiresAt` has passed via the
 * TTL index, so the collection never grows unboundedly.
 */
const mongoose = require('mongoose');

const tokenBlocklistSchema = new mongoose.Schema(
  {
    jti: {
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
    /** Mirrors the JWT's own expiry so the TTL index cleans up at the right time. */
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

// MongoDB TTL index – document is automatically deleted when expiresAt is reached.
tokenBlocklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Check whether a JTI is present in the blocklist.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
tokenBlocklistSchema.statics.isBlocked = async function (jti) {
  if (!jti) return false;
  const doc = await this.findOne({ jti }).lean();
  return !!doc;
};

/**
 * Add a JTI to the blocklist.
 * @param {string} jti
 * @param {string|ObjectId} userId
 * @param {Date} expiresAt  – original JWT expiry
 */
tokenBlocklistSchema.statics.block = async function (jti, userId, expiresAt) {
  if (!jti) return;
  try {
    await this.create({ jti, userId, expiresAt });
  } catch (err) {
    // Duplicate key – token already blocked, that's fine.
    if (err.code !== 11000) throw err;
  }
};

module.exports = mongoose.model('TokenBlocklist', tokenBlocklistSchema);
