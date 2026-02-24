/**
 * tokenService – centralised token operations.
 *
 * Extracted from authController so that any controller / middleware can use
 * token logic without duplicating it.
 *
 * Covers:
 *  - Access token generation (JWT, with `sub` and `jti` claims)
 *  - Refresh token lifecycle via the RefreshToken model (multi-device)
 *  - JWT blocklist integration via the TokenBlocklist model
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../../src/models/RefreshToken');
const TokenBlocklist = require('../../src/models/TokenBlocklist');

// ─────────────────────────────────────────────────────────────────────────────
// Access Token
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT access token.
 *
 * Includes the standard `sub` claim (RFC 7519) and a unique `jti` (JWT ID)
 * so individual tokens can be blocklisted on logout.
 *
 * @param {Object} user - Mongoose User document (or plain object with _id, roles …)
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  const jti = crypto.randomUUID();

  const payload = {
    // Standard claims
    sub: user._id.toString(),
    jti,
    // App-specific claims
    id: user._id,
    phoneNumber: user.phoneNumber,
    roles: user.roles || ['client'],
    isVerified: user.isVerified,
    type: 'access'
  };

  const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';

  return jwt.sign(payload, process.env.JWT_SECRET, {
    issuer: 'localpro-api',
    audience: 'localpro-mobile',
    expiresIn
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Refresh Token (multi-device, persisted)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Issue a new refresh token for a user session.
 *
 * @param {string|ObjectId} userId
 * @param {Object} [deviceInfo]
 * @param {string} [deviceInfo.deviceId]
 * @param {string} [deviceInfo.deviceType] - "mobile" | "tablet" | "desktop"
 * @param {string} [deviceInfo.userAgent]
 * @param {string} [deviceInfo.ipAddress]
 * @returns {Promise<string>} Raw refresh token value
 */
const issueRefreshToken = async (userId, deviceInfo = {}) => {
  const doc = await RefreshToken.issue(userId, deviceInfo);
  return doc.token;
};

/**
 * Validate and (optionally) rotate a refresh token.
 *
 * @param {string} token  - The raw refresh token provided by the client
 * @param {Object} [deviceInfo] - Updated device metadata (for rotation)
 * @returns {Promise<{ userId: ObjectId, newToken: string }|null>}
 *          Returns null if the token is invalid or expired.
 */
const rotateRefreshToken = async (token, deviceInfo = {}) => {
  const doc = await RefreshToken.findActive(token);
  if (!doc) return null;

  // Update lastUsedAt
  doc.lastUsedAt = new Date();
  await doc.save();

  const shouldRotate = process.env.ROTATE_REFRESH_TOKEN !== 'false';
  let newToken = token;

  if (shouldRotate) {
    const newDoc = await RefreshToken.rotate(token, deviceInfo);
    newToken = newDoc.token;
  }

  return { userId: doc.userId, newToken };
};

/**
 * Revoke a single refresh token (on logout).
 * @param {string} token
 */
const revokeRefreshToken = async (token) => {
  return RefreshToken.revoke(token);
};

/**
 * Revoke all refresh tokens for a user (password change, "log out everywhere").
 * @param {string|ObjectId} userId
 * @param {string} [exceptToken] - Optionally keep one session alive
 */
const revokeAllRefreshTokens = async (userId, exceptToken) => {
  return RefreshToken.revokeAll(userId, exceptToken);
};

// ─────────────────────────────────────────────────────────────────────────────
// JWT Blocklist (for logout + magic-link one-time use)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a JWT's `jti` has been blocklisted.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
const isTokenBlocked = (jti) => TokenBlocklist.isBlocked(jti);

/**
 * Blocklist a JWT so it cannot be used again even before expiry.
 *
 * @param {string} jti       – JWT ID claim
 * @param {string} userId    – Owner's user ID
 * @param {Date}   expiresAt – The JWT's original expiry (for TTL cleanup)
 */
const blockToken = (jti, userId, expiresAt) => TokenBlocklist.block(jti, userId, expiresAt);

// ─────────────────────────────────────────────────────────────────────────────
// Magic-link token (short-lived signed JWT, one-time use)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a one-time magic-link token.
 * @param {string|ObjectId} userId
 * @returns {{ token: string, expiresAt: Date }}
 */
const generateMagicLinkToken = (userId) => {
  const jti = crypto.randomUUID();
  const expiresIn = '15m';
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const token = jwt.sign(
    { sub: userId.toString(), jti, type: 'magic_link' },
    process.env.JWT_SECRET,
    { expiresIn, issuer: 'localpro-api', audience: 'localpro-mobile' }
  );

  return { token, expiresAt };
};

/**
 * Verify a magic-link token and return the decoded payload.
 * Throws if invalid, expired, or blocklisted.
 *
 * @param {string} token
 * @returns {Promise<Object>} Decoded payload
 */
const verifyMagicLinkToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'localpro-api',
    audience: 'localpro-mobile'
  });

  if (decoded.type !== 'magic_link') {
    throw Object.assign(new Error('Invalid token type'), { code: 'INVALID_TOKEN_TYPE' });
  }

  const blocked = await isTokenBlocked(decoded.jti);
  if (blocked) {
    throw Object.assign(new Error('Magic link has already been used'), { code: 'TOKEN_ALREADY_USED' });
  }

  return decoded;
};

module.exports = {
  generateToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  isTokenBlocked,
  blockToken,
  generateMagicLinkToken,
  verifyMagicLinkToken
};
