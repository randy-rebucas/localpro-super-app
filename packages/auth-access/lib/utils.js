/**
 * Utility Functions
 * Helper functions for token validation, scope checking, etc.
 */

/**
 * Validate token (utility function)
 * @param {string} token - JWT token
 * @param {Object} authAccess - Auth access instance
 * @returns {Promise<Object>} Decoded token payload
 */
async function validateToken(token, authAccess) {
  if (!authAccess || !authAccess.tokenManager) {
    throw new Error('Auth access not initialized');
  }
  return authAccess.tokenManager.validateToken(token);
}

/**
 * Check scopes (utility function)
 * @param {Object} tokenPayload - Decoded token payload
 * @param {string|string[]} scopes - Required scopes
 * @param {Object} authAccess - Auth access instance
 * @returns {boolean} True if token has required scopes
 */
function checkScopes(tokenPayload, scopes, authAccess) {
  if (!authAccess || !authAccess.scopeManager) {
    throw new Error('Auth access not initialized');
  }
  return authAccess.scopeManager.checkScopes(tokenPayload, scopes);
}

/**
 * Refresh token (utility function)
 * @param {string} oldToken - Old token to refresh
 * @param {Object} authAccess - Auth access instance
 * @param {Object} [options] - Refresh options
 * @returns {Promise<string>} New JWT token
 */
async function refreshToken(oldToken, authAccess, options = {}) {
  if (!authAccess || !authAccess.tokenManager) {
    throw new Error('Auth access not initialized');
  }
  return authAccess.tokenManager.refreshToken(oldToken, options);
}

module.exports = {
  validateToken,
  checkScopes,
  refreshToken
};
