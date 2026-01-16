/**
 * Express Middleware
 * Provides authentication and subscription enforcement for Express.js
 */

/**
 * Create Express authentication middleware
 * @param {Object} options - Middleware options
 * @param {string|string[]} [options.requiredScopes] - Required scopes
 * @param {string} [options.requiredRole] - Required role
 * @returns {Function} Express middleware function
 */
function authMiddleware(options = {}) {
  const {
    requiredScopes,
    requiredRole
  } = options;

  return async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7);

      // Get auth access instance
      // Try multiple ways to access it
      const authAccess = req.app.locals?.authAccess || 
                        req.app.get?.('authAccess') ||
                        global.authAccess;
      
      if (!authAccess || !authAccess.tokenManager) {
        return res.status(500).json({
          success: false,
          error: 'Server Error',
          message: 'Authentication not configured. Call initAuth() and attach to app.locals.authAccess'
        });
      }

      const { tokenManager, scopeManager } = authAccess;

      const decoded = await tokenManager.validateToken(token);

      // Check scopes if required
      if (requiredScopes) {
        if (!scopeManager.checkScopes(decoded, requiredScopes)) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Insufficient permissions'
          });
        }
      }

      // Check role if required
      if (requiredRole) {
        if (!scopeManager.hasRole(decoded.role, requiredRole)) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Insufficient role permissions'
          });
        }
      }

      // Attach user info to request
      req.user = decoded;
      req.partnerId = decoded.partnerId;
      req.role = decoded.role;
      req.scopes = decoded.scopes || [];

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }

      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Authentication error'
      });
    }
  };
}

/**
 * Require scopes middleware factory
 * @param {string|string[]} scopes - Required scopes
 * @returns {Function} Express middleware
 */
function requireScopes(scopes) {
  return authMiddleware({
    requiredScopes: scopes
  });
}

/**
 * Require role middleware factory
 * @param {string} role - Required role
 * @returns {Function} Express middleware
 */
function requireRole(role) {
  return authMiddleware({
    requiredRole: role
  });
}

module.exports = {
  authMiddleware,
  requireScopes,
  requireRole
};
