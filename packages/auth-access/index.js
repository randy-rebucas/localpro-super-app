const TokenManager = require('./lib/token');
const ScopeManager = require('./lib/scopes');

// Middleware exports
const expressMiddleware = require('./lib/middleware/express');
const fastifyMiddleware = require('./lib/middleware/fastify');
const graphqlMiddleware = require('./lib/middleware/graphql');

// Utility exports
const utils = require('./lib/utils');

let authAccessInstance = null;

/**
 * Initialize auth access
 * @param {Object} config - Configuration options
 * @param {string} [config.issuer] - Token issuer (default: 'localpro')
 * @param {string} [config.privateKey] - Private key for signing tokens
 * @param {string} [config.publicKey] - Public key for verifying tokens
 * @param {string} [config.algorithm] - JWT algorithm (default: 'RS256')
 * @param {string} [config.defaultExpiresIn] - Default token expiration (default: '1h')
 * @returns {Object} Auth access instance
 */
function initAuth(config = {}) {
  const tokenManager = new TokenManager({
    issuer: config.issuer,
    privateKey: config.privateKey,
    publicKey: config.publicKey,
    algorithm: config.algorithm,
    defaultExpiresIn: config.defaultExpiresIn
  });

  const scopeManager = new ScopeManager();

  authAccessInstance = {
    tokenManager,
    scopeManager
  };

  // Store globally for GraphQL context
  if (typeof global !== 'undefined') {
    global.authAccess = authAccessInstance;
  }

  return authAccessInstance;
}

/**
 * Get auth access instance
 * @returns {Object} Auth access instance
 */
function getAuthAccess() {
  if (!authAccessInstance) {
    throw new Error('Auth access not initialized. Call initAuth() first.');
  }
  return authAccessInstance;
}

/**
 * Issue a token
 * @param {Object} payload - Token payload
 * @param {string} payload.partnerId - Partner ID
 * @param {string} payload.role - Partner role
 * @param {string[]} [payload.scopes] - Additional scopes
 * @param {Object} [options] - Token options
 * @returns {Promise<string>} JWT token
 */
async function issueToken(payload, options = {}) {
  const instance = getAuthAccess();
  return instance.tokenManager.issueToken(payload, options);
}

/**
 * Validate a token
 * @param {string} token - JWT token
 * @param {Object} [options] - Validation options
 * @returns {Promise<Object>} Decoded token payload
 */
async function validateToken(token, options = {}) {
  const instance = getAuthAccess();
  return instance.tokenManager.validateToken(token, options);
}

/**
 * Check if token has required scopes
 * @param {Object} tokenPayload - Decoded token payload
 * @param {string|string[]} scopes - Required scopes
 * @returns {boolean} True if token has required scopes
 */
function checkScopes(tokenPayload, scopes) {
  const instance = getAuthAccess();
  return instance.scopeManager.checkScopes(tokenPayload, scopes);
}

/**
 * Refresh a token
 * @param {string} oldToken - Old token to refresh
 * @param {Object} [options] - Refresh options
 * @returns {Promise<string>} New JWT token
 */
async function refreshToken(oldToken, options = {}) {
  const instance = getAuthAccess();
  return instance.tokenManager.refreshToken(oldToken, options);
}


// Export initialization function
module.exports = {
  initAuth,
  getAuthAccess,
  issueToken,
  validateToken,
  checkScopes,
  refreshToken
};

// Export middleware
module.exports.authMiddleware = expressMiddleware.authMiddleware;
module.exports.requireScopes = expressMiddleware.requireScopes;
module.exports.requireRole = expressMiddleware.requireRole;

// Export Fastify middleware
module.exports.authPlugin = fastifyMiddleware.authPlugin;
module.exports.fastifyRequireScopes = fastifyMiddleware.requireScopes;
module.exports.fastifyRequireRole = fastifyMiddleware.requireRole;

// Export GraphQL middleware
module.exports.authGraphQL = graphqlMiddleware.authGraphQL;
module.exports.graphqlCheckScopes = graphqlMiddleware.checkScopes;
module.exports.graphqlCheckRole = graphqlMiddleware.checkRole;

// Export utilities
module.exports.utils = utils;

// Export classes for advanced usage
module.exports.TokenManager = TokenManager;
module.exports.ScopeManager = ScopeManager;
