const jwt = require('jsonwebtoken');

/**
 * Token Management Module
 * Handles JWT token issuance, validation, and refresh with RS256 signing
 */
class TokenManager {
  constructor(config = {}) {
    this.privateKey = config.privateKey || process.env.AUTH_PRIVATE_KEY;
    this.publicKey = config.publicKey || process.env.AUTH_PUBLIC_KEY;
    this.issuer = config.issuer || process.env.AUTH_ISSUER || 'localpro';
    this.algorithm = config.algorithm || 'RS256';
    this.defaultExpiresIn = config.defaultExpiresIn || '1h';
  }

  /**
   * Issue a new JWT access token
   * @param {Object} payload - Token payload
   * @param {string} payload.partnerId - Partner ID
   * @param {string} payload.role - Partner role (partner:basic, partner:premium, admin, client)
   * @param {string[]} [payload.scopes] - Additional scopes
   * @param {Object} [options] - Token options
   * @param {string} [options.expiresIn] - Expiration time (default: '1h')
   * @param {string} [options.audience] - Token audience
   * @returns {Promise<string>} JWT token
   */
  async issueToken(payload, options = {}) {
    if (!this.privateKey) {
      throw new Error('Private key is required to issue tokens');
    }

    const {
      partnerId,
      role,
      scopes = [],
      ...additionalPayload
    } = payload;

    if (!partnerId) {
      throw new Error('partnerId is required');
    }

    if (!role) {
      throw new Error('role is required');
    }

    const tokenPayload = {
      partnerId,
      role,
      scopes: Array.isArray(scopes) ? scopes : [scopes],
      ...additionalPayload
    };

    const tokenOptions = {
      issuer: this.issuer,
      algorithm: this.algorithm,
      expiresIn: options.expiresIn || this.defaultExpiresIn,
      ...(options.audience && { audience: options.audience })
    };

    return new Promise((resolve, reject) => {
      jwt.sign(tokenPayload, this.privateKey, tokenOptions, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  }

  /**
   * Validate and decode a JWT token
   * @param {string} token - JWT token to validate
   * @param {Object} [options] - Validation options
   * @param {string} [options.audience] - Expected audience
   * @returns {Promise<Object>} Decoded token payload
   * @throws {Error} If token is invalid
   */
  async validateToken(token, options = {}) {
    if (!this.publicKey) {
      throw new Error('Public key is required to validate tokens');
    }

    if (!token) {
      throw new Error('Token is required');
    }

    const verifyOptions = {
      issuer: this.issuer,
      algorithms: [this.algorithm],
      ...(options.audience && { audience: options.audience })
    };

    return new Promise((resolve, reject) => {
      jwt.verify(token, this.publicKey, verifyOptions, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }

  /**
   * Refresh a token (issue new token with same payload but new expiration)
   * @param {string} oldToken - Old token to refresh
   * @param {Object} [options] - Refresh options
   * @param {string} [options.expiresIn] - New expiration time
   * @returns {Promise<string>} New JWT token
   */
  async refreshToken(oldToken, options = {}) {
    const decoded = await this.validateToken(oldToken);
    
    // Remove JWT standard claims that shouldn't be copied
    const { iat, exp, nbf, jti, ...payload } = decoded;
    
    return this.issueToken(payload, {
      expiresIn: options.expiresIn || this.defaultExpiresIn
    });
  }

  /**
   * Decode token without validation (for inspection only)
   * @param {string} token - JWT token
   * @returns {Object} Decoded token (not verified)
   */
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }
}

module.exports = TokenManager;
