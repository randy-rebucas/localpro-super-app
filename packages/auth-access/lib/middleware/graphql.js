/**
 * GraphQL Middleware
 * Provides authentication context for Apollo Server / GraphQL
 */

/**
 * Create GraphQL authentication context
 * @param {Object} options - Context options
 * @returns {Function} GraphQL context function
 */
function authGraphQL(options = {}) {
  return async ({ req, connection }) => {
    // Handle WebSocket connections (subscriptions)
    if (connection) {
      const authToken = connection.context?.authorization || connection.context?.token;
      if (!authToken) {
        throw new Error('Authentication required for subscriptions');
      }
      return await validateAndAttachUser(authToken);
    }

    // Handle HTTP requests
    if (req) {
      const authHeader = req.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Return null context for unauthenticated requests
        // Let resolvers handle authentication requirements
        return null;
      }

      const token = authHeader.substring(7);
      return await validateAndAttachUser(token);
    }

    return null;
  };
}

/**
 * Validate token and attach user to context
 * @param {string} token - JWT token
 * @returns {Promise<Object>} GraphQL context with user info
 */
async function validateAndAttachUser(token) {
  // Get auth components from global or module-level storage
  // This should be set during initialization
  const { tokenManager, scopeManager } = global.authAccess || {};
  
  if (!tokenManager) {
    throw new Error('Authentication not configured');
  }

  try {
    const decoded = await tokenManager.validateToken(token);

    return {
      user: decoded,
      partnerId: decoded.partnerId,
      role: decoded.role,
      scopes: decoded.scopes || [],
      tokenManager,
      scopeManager
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new Error('Invalid or expired token');
    }
    throw error;
  }
}

/**
 * GraphQL directive/resolver helper to check scopes
 * @param {Object} context - GraphQL context
 * @param {string|string[]} requiredScopes - Required scopes
 * @throws {Error} If scopes are insufficient
 */
function checkScopes(context, requiredScopes) {
  if (!context || !context.scopeManager) {
    throw new Error('Authentication context not available');
  }

  if (!context.scopeManager.checkScopes(context.user, requiredScopes)) {
    throw new Error('Insufficient permissions');
  }
}

/**
 * GraphQL directive/resolver helper to check role
 * @param {Object} context - GraphQL context
 * @param {string} requiredRole - Required role
 * @throws {Error} If role is insufficient
 */
function checkRole(context, requiredRole) {
  if (!context || !context.scopeManager) {
    throw new Error('Authentication context not available');
  }

  if (!context.scopeManager.hasRole(context.role, requiredRole)) {
    throw new Error('Insufficient role permissions');
  }
}

module.exports = {
  authGraphQL,
  checkScopes,
  checkRole
};
