const User = require('../models/User');

// ============================================
// OAUTH PROVIDER MANAGEMENT
// ============================================

/**
 * Get connected OAuth providers
 */
const getConnectedProviders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const providers = user.getConnectedProviders();

    res.json({
      success: true,
      data: {
        providers,
        count: providers.length
      }
    });
  } catch (error) {
    console.error('Get connected providers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get connected providers', error: error.message });
  }
};

/**
 * Connect OAuth provider (callback handler)
 * This would typically be called after OAuth flow completes
 */
const connectProvider = async (req, res) => {
  try {
    const { provider } = req.params;
    const { providerId, email, displayName, avatar, accessToken, refreshToken, tokenExpiresAt, scope, metadata } = req.body;

    if (!providerId) {
      return res.status(400).json({ success: false, message: 'Provider ID is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if this provider account is already linked to another user
    const existingUser = await User.findByOAuthProvider(provider, providerId);
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(409).json({
        success: false,
        message: 'This account is already linked to another user'
      });
    }

    await user.connectOAuthProvider(provider, {
      providerId,
      email,
      displayName,
      avatar,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      scope,
      metadata
    });

    res.json({
      success: true,
      message: `${provider} account connected successfully`,
      data: {
        provider,
        email,
        displayName,
        linkedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Connect provider error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect provider', error: error.message });
  }
};

/**
 * Disconnect OAuth provider
 */
const disconnectProvider = async (req, res) => {
  try {
    const { provider } = req.params;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.hasOAuthProvider(provider)) {
      return res.status(400).json({ success: false, message: `${provider} is not connected` });
    }

    await user.disconnectOAuthProvider(provider);

    res.json({
      success: true,
      message: `${provider} account disconnected successfully`
    });
  } catch (error) {
    console.error('Disconnect provider error:', error);

    if (error.message === 'Cannot disconnect last authentication method') {
      return res.status(400).json({
        success: false,
        message: 'Cannot disconnect - this is your only way to log in. Set a password first.'
      });
    }

    res.status(500).json({ success: false, message: 'Failed to disconnect provider', error: error.message });
  }
};

/**
 * Login with OAuth (find or create user)
 */
const loginWithOAuth = async (req, res) => {
  try {
    const { provider, providerId, email, displayName, avatar, accessToken, refreshToken, tokenExpiresAt, scope } = req.body;

    if (!provider || !providerId) {
      return res.status(400).json({ success: false, message: 'Provider and provider ID are required' });
    }

    // Find existing user by OAuth provider
    let user = await User.findByOAuthProvider(provider, providerId);
    let isNewUser = false;

    if (!user) {
      // Try to find by email if provided
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link OAuth to existing account
          await user.connectOAuthProvider(provider, {
            providerId,
            email,
            displayName,
            avatar,
            accessToken,
            refreshToken,
            tokenExpiresAt,
            scope
          });
        }
      }

      // Create new user if not found
      if (!user) {
        isNewUser = true;
        user = new User({
          email: email?.toLowerCase(),
          firstName: displayName?.split(' ')[0],
          lastName: displayName?.split(' ').slice(1).join(' '),
          isVerified: !!email, // Auto-verify if email provided by OAuth
          oauthProviders: [{
            provider,
            providerId,
            email,
            displayName,
            avatar,
            accessToken,
            refreshToken,
            tokenExpiresAt,
            scope,
            linkedAt: new Date(),
            lastUsedAt: new Date()
          }]
        });

        await user.save();
      }
    } else {
      // Update OAuth provider tokens
      await user.refreshOAuthToken(provider, {
        accessToken,
        refreshToken,
        tokenExpiresAt
      });
    }

    // Create session
    const deviceInfo = {
      deviceId: req.headers['x-device-id'],
      deviceName: req.headers['x-device-name'],
      deviceType: req.headers['x-device-type'] || 'unknown',
      browser: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const sessionId = await user.createSession(deviceInfo, 'oauth');

    // Record login
    await user.recordLoginAttempt(true, deviceInfo.ipAddress, deviceInfo.browser, 'oauth', sessionId);

    // Generate JWT token (you would use your existing JWT generation logic)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        roles: user.roles,
        isVerified: user.isVerified,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m' }
    );

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      isNewUser,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          isVerified: user.isVerified,
          avatar: user.profile?.avatar?.url || avatar
        },
        token,
        sessionId
      }
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({ success: false, message: 'OAuth login failed', error: error.message });
  }
};

// ============================================
// EXTERNAL ID MANAGEMENT
// ============================================

/**
 * Get external IDs
 */
const getExternalIds = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const externalIds = user.getAllExternalIds();

    res.json({
      success: true,
      data: {
        externalIds,
        count: externalIds.length
      }
    });
  } catch (error) {
    console.error('Get external IDs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get external IDs', error: error.message });
  }
};

/**
 * Link external ID
 */
const linkExternalId = async (req, res) => {
  try {
    const { system, externalId, metadata } = req.body;

    if (!system || !externalId) {
      return res.status(400).json({ success: false, message: 'System and external ID are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.linkExternalId(system, externalId, metadata);

    res.json({
      success: true,
      message: `External ID linked for ${system}`,
      data: {
        system,
        externalId,
        linkedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Link external ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to link external ID', error: error.message });
  }
};

/**
 * Unlink external ID
 */
const unlinkExternalId = async (req, res) => {
  try {
    const { system } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.unlinkExternalId(system);

    res.json({
      success: true,
      message: `External ID unlinked for ${system}`
    });
  } catch (error) {
    console.error('Unlink external ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlink external ID', error: error.message });
  }
};

module.exports = {
  getConnectedProviders,
  connectProvider,
  disconnectProvider,
  loginWithOAuth,
  getExternalIds,
  linkExternalId,
  unlinkExternalId
};
