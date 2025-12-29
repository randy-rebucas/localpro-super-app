const { apiKeyAuth } = require('./apiKeyAuth');
const { accessTokenAuth } = require('./accessTokenAuth');

/**
 * Universal authentication middleware that supports:
 * 1. API key/secret authentication
 * 2. Access token authentication (OAuth2 style with scopes)
 * 3. JWT token authentication (legacy)
 */
const auth = async (req, res, next) => {
  try {
    // Check if API key authentication is being used
    const accessKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.apiKey;
    const secretKey = req.headers['x-api-secret'] || req.headers['api-secret'] || req.query.apiSecret;

    if (accessKey && secretKey) {
      // Use API key authentication
      return apiKeyAuth(req, res, next);
    }

    // Check for Bearer token (access token or JWT)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use access token authentication (handles both OAuth tokens and JWTs)
      return accessTokenAuth(req, res, next);
    }

    // No authentication provided
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'MISSING_AUTH',
      hint: 'Provide API key/secret, Bearer token, or Authorization header'
    });
  } catch (error) {
    // This should not be reached as accessTokenAuth handles errors
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // If no roles specified, allow access
    if (roles.length === 0) {
      return next();
    }

    // Check if user has any of the required roles (multi-role support)
    const userRoles = req.user.roles || [];
    const userHasRole = roles.some(role => userRoles.includes(role));
    
    if (!userHasRole) {
      return res.status(403).json({
        success: false,
        message: `User roles [${userRoles.join(', ')}] are not authorized to access this route. Required: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
