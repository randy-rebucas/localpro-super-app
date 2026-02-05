const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');

// ============================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ============================================

/**
 * Setup 2FA - Generate secret and QR code
 */
const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isTwoFactorEnabled()) {
      return res.status(400).json({ success: false, message: '2FA is already enabled' });
    }

    const { method = 'authenticator' } = req.body;

    if (method === 'authenticator') {
      // Generate secret for authenticator app
      const secret = speakeasy.generateSecret({
        name: `LocalPro:${user.email || user.phoneNumber}`,
        length: 32
      });

      // Store secret temporarily (not enabled yet)
      await user.enableTwoFactor('authenticator', secret.base32);

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      return res.json({
        success: true,
        message: '2FA setup initiated. Scan the QR code and verify with a code.',
        data: {
          secret: secret.base32,
          qrCode: qrCodeUrl,
          method: 'authenticator'
        }
      });
    } else if (method === 'sms' || method === 'email') {
      await user.enableTwoFactor(method);

      return res.json({
        success: true,
        message: `2FA setup initiated with ${method}. Verify to activate.`,
        data: { method }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid 2FA method' });
    }
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup 2FA', error: error.message });
  }
};

/**
 * Verify and activate 2FA
 */
const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const user = await User.findById(req.user.id).select('+twoFactor.secret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactor || user.twoFactor.method === 'none') {
      return res.status(400).json({ success: false, message: '2FA not configured. Run setup first.' });
    }

    if (user.twoFactor.method === 'authenticator') {
      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactor.secret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Invalid verification code' });
      }
    }

    // Activate 2FA
    await user.verifyAndActivateTwoFactor();

    // Generate backup codes
    const backupCodes = await user.generateBackupCodes();

    res.json({
      success: true,
      message: '2FA has been enabled successfully',
      data: {
        enabled: true,
        method: user.twoFactor.method,
        backupCodes // Only shown once!
      }
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA', error: error.message });
  }
};

/**
 * Disable 2FA
 */
const disable2FA = async (req, res) => {
  try {
    const { password, code } = req.body;

    const user = await User.findById(req.user.id).select('+password +twoFactor.secret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isTwoFactorEnabled()) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    // Verify password if set
    if (user.password) {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to disable 2FA' });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
    }

    // Verify 2FA code or backup code
    if (code && user.twoFactor.method === 'authenticator') {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactor.secret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        // Try backup code
        const usedBackup = await user.useBackupCode(code);
        if (!usedBackup) {
          return res.status(400).json({ success: false, message: 'Invalid code' });
        }
      }
    }

    await user.disableTwoFactor();

    res.json({
      success: true,
      message: '2FA has been disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA', error: error.message });
  }
};

/**
 * Get 2FA status
 */
const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const status = user.getTwoFactorStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get 2FA status', error: error.message });
  }
};

/**
 * Regenerate backup codes
 */
const regenerateBackupCodes = async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findById(req.user.id).select('+twoFactor.secret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isTwoFactorEnabled()) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    // Verify current 2FA code
    if (user.twoFactor.method === 'authenticator' && code) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactor.secret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Invalid verification code' });
      }
    }

    const backupCodes = await user.generateBackupCodes();

    res.json({
      success: true,
      message: 'New backup codes generated',
      data: {
        backupCodes // Only shown once!
      }
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate backup codes', error: error.message });
  }
};

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get active sessions
 */
const getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sessions = user.getActiveSessions();

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sessions', error: error.message });
  }
};

/**
 * Revoke a specific session
 */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.revokeSession(sessionId);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke session', error: error.message });
  }
};

/**
 * Revoke all sessions except current
 */
const revokeAllSessions = async (req, res) => {
  try {
    const { exceptCurrent = true } = req.body;
    const currentSessionId = req.sessionId; // Should be set by auth middleware

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.revokeAllSessions(exceptCurrent ? currentSessionId : null);

    res.json({
      success: true,
      message: exceptCurrent ? 'All other sessions revoked' : 'All sessions revoked'
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke sessions', error: error.message });
  }
};

// ============================================
// PASSWORD RESET
// ============================================

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    const query = email ? { email: email.toLowerCase() } : { phoneNumber };
    const user = await User.findOne(query);

    // Always return success to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link has been sent'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const token = await user.createPasswordResetToken(ipAddress);

    // TODO: Send email/SMS with reset link containing the token
    // For now, return token in development
    const responseData = {
      success: true,
      message: 'If an account exists, a password reset link has been sent'
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.data = { token, expiresIn: '1 hour' };
    }

    res.json(responseData);
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to request password reset', error: error.message });
  }
};

/**
 * Validate password reset token
 */
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const validation = user.validatePasswordResetToken(token);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email ? `${user.email.substring(0, 3)}***${user.email.split('@')[1]}` : null,
        phoneNumber: user.phoneNumber ? `***${user.phoneNumber.slice(-4)}` : null
      }
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate token', error: error.message });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const validation = user.validatePasswordResetToken(token);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    // Update password
    user.password = newPassword;
    await user.usePasswordResetToken();
    await user.save();

    // Revoke all sessions for security
    await user.revokeAllSessions();

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

/**
 * Change password (for logged-in users)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    if (user.password) {
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    // Update password
    user.password = newPassword;
    if (!user.security) user.security = {};
    user.security.passwordChangedAt = new Date();
    user.security.lastPasswordChangeIp = req.ip || req.connection.remoteAddress;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
};

// ============================================
// TRUSTED DEVICES
// ============================================

/**
 * Get trusted devices
 */
const getTrustedDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const devices = user.getTrustedDevices();

    res.json({
      success: true,
      data: {
        devices,
        count: devices.length
      }
    });
  } catch (error) {
    console.error('Get trusted devices error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trusted devices', error: error.message });
  }
};

/**
 * Add trusted device
 */
const addTrustedDevice = async (req, res) => {
  try {
    const { deviceName } = req.body;
    const deviceId = req.headers['x-device-id'] || req.body.deviceId;
    const deviceFingerprint = req.headers['x-device-fingerprint'] || req.body.deviceFingerprint;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.addTrustedDevice({
      deviceId,
      deviceFingerprint,
      deviceName: deviceName || 'Unknown Device'
    });

    res.json({
      success: true,
      message: 'Device added to trusted devices'
    });
  } catch (error) {
    console.error('Add trusted device error:', error);
    res.status(500).json({ success: false, message: 'Failed to add trusted device', error: error.message });
  }
};

/**
 * Remove trusted device
 */
const removeTrustedDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.removeTrustedDevice(deviceId);

    res.json({
      success: true,
      message: 'Device removed from trusted devices'
    });
  } catch (error) {
    console.error('Remove trusted device error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove trusted device', error: error.message });
  }
};

// ============================================
// LOGIN HISTORY
// ============================================

/**
 * Get login history
 */
const getLoginHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const history = user.getLoginHistory(parseInt(limit));

    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get login history', error: error.message });
  }
};

/**
 * Get account security overview
 */
const getSecurityOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const twoFactorStatus = user.getTwoFactorStatus();
    const activeSessions = user.getActiveSessions();
    const trustedDevices = user.getTrustedDevices();
    const loginHistory = user.getLoginHistory(5);
    const connectedProviders = user.getConnectedProviders();

    res.json({
      success: true,
      data: {
        twoFactor: twoFactorStatus,
        sessions: {
          active: activeSessions.length,
          recent: activeSessions.slice(0, 3)
        },
        trustedDevices: {
          count: trustedDevices.length,
          devices: trustedDevices.slice(0, 3)
        },
        loginHistory: {
          recent: loginHistory,
          lastSuccessfulLogin: loginHistory.find(l => l.success)
        },
        connectedAccounts: connectedProviders,
        passwordLastChanged: user.security?.passwordChangedAt,
        accountLocked: user.isAccountLocked(),
        mpinEnabled: user.mpinEnabled
      }
    });
  } catch (error) {
    console.error('Get security overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to get security overview', error: error.message });
  }
};

module.exports = {
  // 2FA
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
  // Sessions
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  // Password
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  changePassword,
  // Trusted devices
  getTrustedDevices,
  addTrustedDevice,
  removeTrustedDevice,
  // Login history
  getLoginHistory,
  getSecurityOverview
};
