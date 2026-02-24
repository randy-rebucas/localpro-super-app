const AccessToken = require('../../accessTokens/models/AccessToken');
const ApiKey = require('../../apiKeys/models/ApiKey');
const User = require('../../../src/models/User');
const AuthorizationCode = require('../../../src/models/AuthorizationCode');
const { validationResult } = require('express-validator');
const logger = require('../../../src/config/logger');

/**
 * @desc    Exchange API key/secret for access token
 * @route   POST /api/oauth/token
 * @access  Public (but requires valid API key/secret)
 */
const exchangeToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { grant_type, scope, expires_in } = req.body;

    // Supported grant types
    const SUPPORTED_GRANTS = ['client_credentials', 'authorization_code'];
    if (!SUPPORTED_GRANTS.includes(grant_type)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported grant type',
        code: 'UNSUPPORTED_GRANT_TYPE',
        supported: SUPPORTED_GRANTS
      });
    }

    // ── authorization_code + PKCE (RFC 7636) ─────────────────────────────────
    if (grant_type === 'authorization_code') {
      const { code, redirect_uri, code_verifier, client_id } = req.body;

      if (!code || !code_verifier || !client_id || !redirect_uri) {
        return res.status(400).json({
          success: false,
          message: 'code, code_verifier, client_id, and redirect_uri are required for authorization_code grant',
          code: 'MISSING_PARAMS'
        });
      }

      // Find the authorization code
      const authCode = await AuthorizationCode.findValid(code, client_id);
      if (!authCode) {
        return res.status(401).json({
          success: false,
          message: 'Invalid, expired, or already used authorization code',
          code: 'INVALID_GRANT'
        });
      }

      // Verify redirect_uri matches
      if (authCode.redirectUri !== redirect_uri) {
        return res.status(400).json({
          success: false,
          message: 'redirect_uri does not match',
          code: 'REDIRECT_URI_MISMATCH'
        });
      }

      // PKCE verification: BASE64URL(SHA256(code_verifier)) must equal stored code_challenge
      const pkceValid = AuthorizationCode.verifyPKCE(code_verifier, authCode.codeChallenge);
      if (!pkceValid) {
        // Mark code as used to prevent timing-based bruteforce
        authCode.used = true;
        await authCode.save();
        return res.status(401).json({
          success: false,
          message: 'PKCE verification failed: code_verifier does not match code_challenge',
          code: 'PKCE_VERIFICATION_FAILED'
        });
      }

      // Mark code as consumed (single-use)
      authCode.used = true;
      await authCode.save();

      // Fetch user and issue tokens
      const user = await User.findById(authCode.userId).select('-password');
      if (!user || !user.isActive) {
        return res.status(403).json({ success: false, message: 'User account is inactive', code: 'USER_INACTIVE' });
      }

      const tokenScopes = authCode.scope ? authCode.scope.split(' ') : ['read'];
      const expiresInSeconds = 3600;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      const clientIp = req.ip || req.connection?.remoteAddress;

      const { token, tokenHash } = AccessToken.generateAccessToken(
        { id: user._id, scopes: tokenScopes, type: 'access' },
        `${expiresInSeconds}s`
      );
      const { refreshToken: rt, refreshTokenHash: rth } = AccessToken.generateRefreshToken();
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await new AccessToken({
        token, tokenHash, userId: user._id, scopes: tokenScopes, expiresAt,
        refreshToken: rt, refreshTokenHash: rth, refreshTokenExpiresAt, lastUsedIp: clientIp
      }).save();

      return res.status(200).json({
        success: true,
        access_token: token,
        token_type: 'Bearer',
        expires_in: expiresInSeconds,
        expires_at: expiresAt.toISOString(),
        refresh_token: rt,
        scope: tokenScopes.join(' '),
        ...(authCode.state && { state: authCode.state })
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Get API key and secret from headers or body
    const accessKey = req.headers['x-api-key'] || req.headers['api-key'] || req.body.client_id;
    const secretKey = req.headers['x-api-secret'] || req.headers['api-secret'] || req.body.client_secret;

    if (!accessKey || !secretKey) {
      return res.status(401).json({
        success: false,
        message: 'API key and secret are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find and verify API key
    const apiKey = await ApiKey.findOne({ accessKey }).select('+secretKeyHash');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    if (!apiKey.isActive) {
      return res.status(403).json({
        success: false,
        message: 'API key is inactive',
        code: 'API_KEY_INACTIVE'
      });
    }

    if (apiKey.isExpired()) {
      return res.status(403).json({
        success: false,
        message: 'API key has expired',
        code: 'API_KEY_EXPIRED'
      });
    }

    if (!apiKey.verifySecret(secretKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API secret',
        code: 'INVALID_API_SECRET'
      });
    }

    // Check IP restrictions
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    if (!apiKey.isIpAllowed(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'IP address not allowed',
        code: 'IP_NOT_ALLOWED'
      });
    }

    // Get user
    const user = await User.findById(apiKey.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Determine scopes
    let tokenScopes = apiKey.scopes || ['read'];
    if (scope) {
      // Requested scopes must be subset of API key scopes
      const requestedScopes = scope.split(' ').filter(s => s.trim());
      const validScopes = requestedScopes.filter(s => apiKey.scopes.includes(s));
      
      if (validScopes.length === 0 && requestedScopes.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Requested scopes not allowed for this API key',
          code: 'INVALID_SCOPE',
          requested: requestedScopes,
          allowed: apiKey.scopes
        });
      }
      
      tokenScopes = validScopes.length > 0 ? validScopes : tokenScopes;
    }

    // Set expiration (default 1 hour, max 24 hours)
    const expiresInSeconds = expires_in 
      ? Math.min(Math.max(parseInt(expires_in), 300), 86400) // 5 min to 24 hours
      : 3600; // 1 hour default

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Generate access token
    const { token, tokenHash } = AccessToken.generateAccessToken({
      id: user._id,
      apiKeyId: apiKey._id,
      scopes: tokenScopes,
      type: 'access'
    }, `${expiresInSeconds}s`);

    // Generate refresh token (optional, expires in 30 days)
    const { refreshToken, refreshTokenHash } = AccessToken.generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create access token document
    const accessToken = new AccessToken({
      token,
      tokenHash,
      apiKeyId: apiKey._id,
      userId: user._id,
      scopes: tokenScopes,
      expiresAt,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
      lastUsedIp: clientIp
    });

    await accessToken.save();

    // Update API key last used
    apiKey.updateLastUsed(clientIp).catch(err => {
      logger.error('Failed to update API key last used:', err);
    });

    res.status(200).json({
      success: true,
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      expires_at: expiresAt.toISOString(),
      refresh_token: refreshToken,
      scope: tokenScopes.join(' ')
    });
  } catch (error) {
    logger.error('Error exchanging token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to exchange token',
      error: error.message
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/oauth/refresh
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { refresh_token, scope, expires_in } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Find refresh token
    const accessToken = await AccessToken.findByRefreshToken(refresh_token);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (!accessToken.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    if (accessToken.isRefreshTokenExpired()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    // Get API key and user
    const apiKey = await ApiKey.findById(accessToken.apiKeyId);
    if (!apiKey || !apiKey.isActive) {
      return res.status(403).json({
        success: false,
        message: 'API key is inactive',
        code: 'API_KEY_INACTIVE'
      });
    }

    const user = await User.findById(accessToken.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Determine scopes (can't request more than original)
    let tokenScopes = accessToken.scopes;
    if (scope) {
      const requestedScopes = scope.split(' ').filter(s => s.trim());
      const validScopes = requestedScopes.filter(s => apiKey.scopes.includes(s) && accessToken.scopes.includes(s));
      tokenScopes = validScopes.length > 0 ? validScopes : tokenScopes;
    }

    // Set expiration
    const expiresInSeconds = expires_in 
      ? Math.min(Math.max(parseInt(expires_in), 300), 86400)
      : 3600;

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Revoke old token
    await accessToken.revoke();

    // Generate new access token
    const { token, tokenHash } = AccessToken.generateAccessToken({
      id: user._id,
      apiKeyId: apiKey._id,
      scopes: tokenScopes,
      type: 'access'
    }, `${expiresInSeconds}s`);

    // Generate new refresh token
    const { refreshToken: newRefreshToken, refreshTokenHash: newRefreshTokenHash } = AccessToken.generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create new access token
    const newAccessToken = new AccessToken({
      token,
      tokenHash,
      apiKeyId: apiKey._id,
      userId: user._id,
      scopes: tokenScopes,
      expiresAt,
      refreshToken: newRefreshToken,
      refreshTokenHash: newRefreshTokenHash,
      refreshTokenExpiresAt,
      lastUsedIp: req.ip || req.connection.remoteAddress
    });

    await newAccessToken.save();

    res.status(200).json({
      success: true,
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      expires_at: expiresAt.toISOString(),
      refresh_token: newRefreshToken,
      scope: tokenScopes.join(' ')
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: error.message
    });
  }
};

/**
 * @desc    Revoke access token
 * @route   POST /api/oauth/revoke
 * @access  Public (but requires valid token)
 */
const revokeToken = async (req, res) => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Try to find and revoke token
    let accessToken = await AccessToken.findByToken(token);
    
    if (!accessToken && token_type_hint !== 'access_token') {
      // Try refresh token
      accessToken = await AccessToken.findByRefreshToken(token);
    }

    if (accessToken) {
      await accessToken.revoke();
    }

    // Always return success (per OAuth2 spec)
    res.status(200).json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke token',
      error: error.message
    });
  }
};

/**
 * @desc    Get token information
 * @route   GET /api/oauth/token-info
 * @access  Private (requires valid token)
 */
const getTokenInfo = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token required',
        code: 'MISSING_TOKEN'
      });
    }

    const accessToken = await AccessToken.findByToken(token);

    if (!accessToken || !accessToken.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        scopes: accessToken.scopes,
        expiresAt: accessToken.expiresAt,
        createdAt: accessToken.createdAt,
        lastUsedAt: accessToken.lastUsedAt
      }
    });
  } catch (error) {
    logger.error('Error getting token info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token info',
      error: error.message
    });
  }
};

/**
 * @desc    List user's access tokens
 * @route   GET /api/oauth/tokens
 * @access  Private
 */
const listTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tokens, total] = await Promise.all([
      AccessToken.find({ userId })
        .populate('apiKeyId', 'name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AccessToken.countDocuments({ userId })
    ]);

    res.status(200).json({
      success: true,
      data: tokens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error listing tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list tokens',
      error: error.message
    });
  }
};

/**
 * @desc    Create an authorization code (PKCE flow – RFC 7636)
 * @route   POST /api/oauth/authorize
 * @access  Private (authenticated user)
 *
 * The client must supply:
 *   client_id, redirect_uri, code_challenge (BASE64URL(SHA256(code_verifier))),
 *   code_challenge_method = "S256", scope (optional), state (optional)
 */
const authorize = async (req, res) => {
  try {
    const {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method = 'S256',
      scope,
      state
    } = req.body;

    if (!client_id || !redirect_uri || !code_challenge) {
      return res.status(400).json({
        success: false,
        message: 'client_id, redirect_uri, and code_challenge are required',
        code: 'MISSING_PARAMS'
      });
    }

    if (code_challenge_method !== 'S256') {
      return res.status(400).json({
        success: false,
        message: 'Only code_challenge_method=S256 is supported (plain is not allowed)',
        code: 'UNSUPPORTED_CHALLENGE_METHOD'
      });
    }

    // Validate client_id (must be a valid API key access key)
    const apiKey = await ApiKey.findOne({ accessKey: client_id, isActive: true });
    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Invalid client_id', code: 'INVALID_CLIENT' });
    }

    if (!apiKey.allowedRedirectUris?.includes(redirect_uri) && !['localhost', '127.0.0.1'].some(h => redirect_uri.includes(h))) {
      return res.status(400).json({ success: false, message: 'redirect_uri not allowed for this client', code: 'REDIRECT_URI_NOT_ALLOWED' });
    }

    const authCode = await AuthorizationCode.issue({
      userId: req.user.id,
      clientId: client_id,
      redirectUri: redirect_uri,
      scope: scope || 'read',
      state,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method
    });

    logger.info('Authorization code issued', { userId: req.user.id, clientId: client_id });

    res.status(200).json({
      success: true,
      code: authCode.code,
      state: state || null,
      expires_in: 600 // 10 minutes
    });
  } catch (error) {
    logger.error('Error creating authorization code:', error);
    res.status(500).json({ success: false, message: 'Failed to create authorization code', error: error.message });
  }
};

module.exports = {
  authorize,
  exchangeToken,
  refreshToken,
  revokeToken,
  getTokenInfo,
  listTokens
};

