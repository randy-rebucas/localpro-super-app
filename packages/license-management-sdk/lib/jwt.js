// JWT/signed license validation
const jwt = require('jsonwebtoken');

/**
 * Validates a JWT-signed license.
 * @param {string} token - The JWT license token.
 * @param {object} options - { secretOrPublicKey, algorithms, ... }
 * @returns {object} Result with isValid, reason, and meta.
 */
function validateLicenseJWT(token, options = {}) {
  if (!token || typeof token !== 'string') {
    return { isValid: false, reason: 'License token missing or invalid', meta: null };
  }
  try {
    const payload = jwt.verify(token, options.secretOrPublicKey, { algorithms: options.algorithms || ['HS256', 'RS256'] });
    // Optionally, add more checks on payload (expiry, type, scope, etc.)
    return { isValid: true, reason: 'Valid signed license', meta: payload };
  } catch (e) {
    return { isValid: false, reason: 'Invalid or expired signed license', meta: { error: e.message } };
  }
}

module.exports = { validateLicenseJWT };
