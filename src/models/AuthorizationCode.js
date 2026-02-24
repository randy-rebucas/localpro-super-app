/**
 * AuthorizationCode – stores a short-lived OAuth 2.0 authorization code.
 *
 * Used by the authorization_code + PKCE flow (RFC 7636). The code is single-use
 * and expires after 10 minutes.  The `codeChallenge` and `codeChallengeMethod`
 * fields are required when the code is created, and are verified with the
 * `code_verifier` during token exchange.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const authorizationCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    scope: { type: String, default: 'read' },
    state: { type: String, default: null },
    /** S256 (required) – the only method we accept */
    codeChallengeMethod: {
      type: String,
      enum: ['S256'],
      required: true
    },
    /** BASE64URL(SHA256(code_verifier)) */
    codeChallenge: {
      type: String,
      required: true
    },
    /** whether this code has been exchanged */
    used: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

// TTL – auto-clean expired codes
authorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─────────────────────────────────────────────────────────────────────────────
// Statics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Issue a new authorization code.
 */
authorizationCodeSchema.statics.issue = function ({
  userId,
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  codeChallengeMethod = 'S256'
}) {
  return this.create({
    code: crypto.randomBytes(32).toString('hex'),
    userId,
    clientId,
    redirectUri,
    scope: scope || 'read',
    state: state || null,
    codeChallenge,
    codeChallengeMethod,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
};

/**
 * Find a valid (unused, non-expired) authorization code.
 */
authorizationCodeSchema.statics.findValid = function (code, clientId) {
  return this.findOne({
    code,
    clientId,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Verify a PKCE code_verifier against the stored code_challenge.
 * @param {string} codeVerifier  - Raw verifier from the client
 * @param {string} codeChallenge - Stored BASE64URL(SHA256(verifier))
 * @returns {boolean}
 */
authorizationCodeSchema.statics.verifyPKCE = function (codeVerifier, codeChallenge) {
  const computed = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url'); // Node 16+ – produces URL-safe base64 without padding
  return computed === codeChallenge;
};

module.exports = mongoose.model('AuthorizationCode', authorizationCodeSchema);
