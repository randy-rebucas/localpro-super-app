const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * JWT Configuration and Utilities
 * Centralized JWT management with proper security measures
 */

// JWT Configuration
const JWT_CONFIG = {
  // Token expiration times
  ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  
  // JWT Secrets - validate they exist and are secure
  ACCESS_TOKEN_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  
  // JWT Options
  ISSUER: process.env.JWT_ISSUER || 'localpro-api',
  AUDIENCE: process.env.JWT_AUDIENCE || 'localpro-mobile',
  ALGORITHM: 'HS256', // Explicitly specify algorithm for security
  
  // Security settings
  MIN_SECRET_LENGTH: 32, // Minimum secret length in characters
  MAX_TOKEN_AGE: 15 * 60 * 1000, // 15 minutes in milliseconds
};

/**
 * Validate JWT secrets are properly configured
 */
function validateJWTSecrets() {
  const errors = [];
  
  if (!JWT_CONFIG.ACCESS_TOKEN_SECRET) {
    errors.push('JWT_SECRET environment variable is required');
  } else if (JWT_CONFIG.ACCESS_TOKEN_SECRET.length < JWT_CONFIG.MIN_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${JWT_CONFIG.MIN_SECRET_LENGTH} characters long`);
  }
  
  if (!JWT_CONFIG.REFRESH_TOKEN_SECRET) {
    errors.push('JWT_REFRESH_SECRET environment variable is required (or JWT_SECRET will be used)');
  } else if (JWT_CONFIG.REFRESH_TOKEN_SECRET.length < JWT_CONFIG.MIN_SECRET_LENGTH) {
    errors.push(`JWT_REFRESH_SECRET must be at least ${JWT_CONFIG.MIN_SECRET_LENGTH} characters long`);
  }
  
  // Check if secrets are using default/example values
  const defaultSecrets = [
    'your-super-secret-jwt-key-here',
    'your-super-secure-production-jwt-secret-key-here',
    'test-secret',
    'secret',
    'jwt-secret'
  ];
  
  if (defaultSecrets.includes(JWT_CONFIG.ACCESS_TOKEN_SECRET)) {
    errors.push('JWT_SECRET is using a default/example value. Please set a secure, unique secret.');
  }
  
  if (defaultSecrets.includes(JWT_CONFIG.REFRESH_TOKEN_SECRET)) {
    errors.push('JWT_REFRESH_SECRET is using a default/example value. Please set a secure, unique secret.');
  }
  
  if (errors.length > 0) {
    const errorMessage = `JWT Configuration Errors:\n${errors.join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  logger.info('JWT secrets validated successfully');
  return true;
}

/**
 * Generate a secure JWT access token
 * @param {Object} user - User object
 * @param {Object} additionalPayload - Additional data to include in token
 * @returns {string} JWT access token
 */
function generateAccessToken(user, additionalPayload = {}) {
  const payload = {
    id: user._id,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
    onboardingComplete: isOnboardingComplete(user),
    type: 'access',
    ...additionalPayload
  };

  return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM
  });
}

/**
 * Generate a secure JWT refresh token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    id: user._id,
    type: 'refresh',
    tokenVersion: user.tokenVersion || 0 // For token invalidation
  };

  return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM
  });
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @param {Object} additionalPayload - Additional data for access token
 * @returns {Object} Object containing access and refresh tokens
 */
function generateTokenPair(user, additionalPayload = {}) {
  return {
    accessToken: generateAccessToken(user, additionalPayload),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN
  };
}

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithms: [JWT_CONFIG.ALGORITHM]
  });
}

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithms: [JWT_CONFIG.ALGORITHM]
  });
}

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
function decodeToken(token) {
  return jwt.decode(token, { complete: true });
}

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Token expiration date or null if invalid
 */
function getTokenExpiration(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to check if user has completed onboarding
 * @param {Object} user - User object
 * @returns {boolean} True if onboarding is complete
 */
function isOnboardingComplete(user) {
  if (!user) return false;
  
  // Define onboarding completion criteria
  const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'isVerified'];
  const hasRequiredFields = requiredFields.every(field => user[field] !== undefined && user[field] !== null);
  
  // Additional checks based on user role
  if (user.role === 'provider') {
    return hasRequiredFields && !!(user.businessName && user.businessAddress);
  }
  
  if (user.role === 'supplier') {
    return hasRequiredFields && !!(user.businessName && user.businessAddress);
  }
  
  if (user.role === 'instructor') {
    return hasRequiredFields && !!(user.businessName && user.businessAddress);
  }
  
  return hasRequiredFields;
}

/**
 * Generate a secure random string for token versioning
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
function generateTokenVersion(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// Validate JWT configuration on module load
try {
  validateJWTSecrets();
} catch (error) {
  logger.error('JWT configuration validation failed:', error.message);
  // Don't throw here to allow graceful startup with proper error handling
}

module.exports = {
  JWT_CONFIG,
  validateJWTSecrets,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  isOnboardingComplete,
  generateTokenVersion
};
