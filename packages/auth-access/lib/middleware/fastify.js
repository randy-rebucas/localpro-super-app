/**
 * Fastify Middleware
 * Provides authentication and subscription enforcement for Fastify
 */

/**
 * Create Fastify authentication plugin
 * @param {Object} options - Plugin options
 * @param {string|string[]} [options.requiredScopes] - Required scopes
 * @param {string} [options.requiredRole] - Required role
 * @returns {Function} Fastify plugin function
 */
function authPlugin(options = {}) {
  const {
    requiredScopes,
    requiredRole
  } = options;

  return async function (fastify, opts) {
    fastify.addHook('onRequest', async (request, reply) => {
      try {
        // Get token from Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
          });
        }

        const token = authHeader.substring(7);

        // Get auth components from Fastify instance
        const { tokenManager, scopeManager } = fastify.authAccess;
        
        if (!tokenManager) {
          return reply.code(500).send({
            success: false,
            error: 'Server Error',
            message: 'Authentication not configured'
          });
        }

        const decoded = await tokenManager.validateToken(token);

        // Check scopes if required
        if (requiredScopes) {
          if (!scopeManager.checkScopes(decoded, requiredScopes)) {
            return reply.code(403).send({
              success: false,
              error: 'Forbidden',
              message: 'Insufficient permissions'
            });
          }
        }

        // Check role if required
        if (requiredRole) {
          if (!scopeManager.hasRole(decoded.role, requiredRole)) {
            return reply.code(403).send({
              success: false,
              error: 'Forbidden',
              message: 'Insufficient role permissions'
            });
          }
        }

        // Attach user info to request
        request.user = decoded;
        request.partnerId = decoded.partnerId;
        request.role = decoded.role;
        request.scopes = decoded.scopes || [];
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired token'
          });
        }

        console.error('Auth plugin error:', error);
        return reply.code(500).send({
          success: false,
          error: 'Server Error',
          message: 'Authentication error'
        });
      }
    });
  };
}

/**
 * Require scopes decorator
 * @param {string|string[]} scopes - Required scopes
 * @returns {Function} Fastify plugin
 */
function requireScopes(scopes) {
  return authPlugin({
    requiredScopes: scopes
  });
}

/**
 * Require role decorator
 * @param {string} role - Required role
 * @returns {Function} Fastify plugin
 */
function requireRole(role) {
  return authPlugin({
    requiredRole: role
  });
}

module.exports = {
  authPlugin,
  requireScopes,
  requireRole
};
