const User = require('../models/User');

// ============================================
// GDPR CONSENT MANAGEMENT
// ============================================

/**
 * Get consent status
 */
const getConsentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const consentStatus = user.getConsentStatus();

    res.json({
      success: true,
      data: consentStatus
    });
  } catch (error) {
    console.error('Get consent status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get consent status', error: error.message });
  }
};

/**
 * Give GDPR consent
 */
const giveGdprConsent = async (req, res) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({ success: false, message: 'Consent version is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    await user.giveGdprConsent(version, ipAddress);

    res.json({
      success: true,
      message: 'GDPR consent recorded',
      data: {
        given: true,
        version,
        givenAt: new Date()
      }
    });
  } catch (error) {
    console.error('Give GDPR consent error:', error);
    res.status(500).json({ success: false, message: 'Failed to record consent', error: error.message });
  }
};

/**
 * Withdraw GDPR consent
 */
const withdrawGdprConsent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.withdrawGdprConsent();

    res.json({
      success: true,
      message: 'GDPR consent withdrawn',
      data: {
        given: false,
        withdrawnAt: new Date()
      }
    });
  } catch (error) {
    console.error('Withdraw GDPR consent error:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw consent', error: error.message });
  }
};

/**
 * Update marketing consent
 */
const updateMarketingConsent = async (req, res) => {
  try {
    const { email, sms, push } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.updateMarketingConsent({ email, sms, push });

    res.json({
      success: true,
      message: 'Marketing preferences updated',
      data: {
        email: email !== undefined ? email : user.privacy?.marketingConsent?.email,
        sms: sms !== undefined ? sms : user.privacy?.marketingConsent?.sms,
        push: push !== undefined ? push : user.privacy?.marketingConsent?.push,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update marketing consent error:', error);
    res.status(500).json({ success: false, message: 'Failed to update marketing preferences', error: error.message });
  }
};

/**
 * Set Do Not Sell preference (CCPA)
 */
const setDoNotSell = async (req, res) => {
  try {
    const { doNotSell } = req.body;

    if (typeof doNotSell !== 'boolean') {
      return res.status(400).json({ success: false, message: 'doNotSell must be a boolean' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.setDoNotSell(doNotSell);

    res.json({
      success: true,
      message: `Do Not Sell preference ${doNotSell ? 'enabled' : 'disabled'}`,
      data: { doNotSell }
    });
  } catch (error) {
    console.error('Set Do Not Sell error:', error);
    res.status(500).json({ success: false, message: 'Failed to update preference', error: error.message });
  }
};

/**
 * Set Do Not Track preference
 */
const setDoNotTrack = async (req, res) => {
  try {
    const { doNotTrack } = req.body;

    if (typeof doNotTrack !== 'boolean') {
      return res.status(400).json({ success: false, message: 'doNotTrack must be a boolean' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.setDoNotTrack(doNotTrack);

    res.json({
      success: true,
      message: `Do Not Track preference ${doNotTrack ? 'enabled' : 'disabled'}`,
      data: { doNotTrack }
    });
  } catch (error) {
    console.error('Set Do Not Track error:', error);
    res.status(500).json({ success: false, message: 'Failed to update preference', error: error.message });
  }
};

// ============================================
// ACCOUNT DELETION (GDPR Right to be Forgotten)
// ============================================

/**
 * Request account deletion
 */
const requestAccountDeletion = async (req, res) => {
  try {
    const { reason, password } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password if set
    if (user.password) {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to request account deletion' });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
    }

    // Check if already pending deletion
    if (user.isPendingDeletion()) {
      return res.status(400).json({
        success: false,
        message: 'Account deletion already requested',
        data: user.getDeletionStatus()
      });
    }

    const scheduledFor = await user.requestAccountDeletion(reason);

    res.json({
      success: true,
      message: 'Account deletion requested',
      data: {
        scheduledFor,
        gracePeriodDays: 30,
        canCancelUntil: scheduledFor
      }
    });
  } catch (error) {
    console.error('Request account deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to request account deletion', error: error.message });
  }
};

/**
 * Cancel account deletion
 */
const cancelAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.cancelAccountDeletion();

    res.json({
      success: true,
      message: 'Account deletion cancelled'
    });
  } catch (error) {
    console.error('Cancel account deletion error:', error);

    if (error.message === 'No deletion request found') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'Deletion already processed') {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to cancel account deletion', error: error.message });
  }
};

/**
 * Get account deletion status
 */
const getDeletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const status = user.getDeletionStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get deletion status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get deletion status', error: error.message });
  }
};

// ============================================
// DATA EXPORT (GDPR Right of Access)
// ============================================

/**
 * Export user data
 */
const exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const exportData = await user.exportUserData();

    res.json({
      success: true,
      message: 'User data exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ success: false, message: 'Failed to export user data', error: error.message });
  }
};

/**
 * Download user data as JSON file
 */
const downloadUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const exportData = await user.exportUserData();

    const filename = `user-data-${user._id}-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Download user data error:', error);
    res.status(500).json({ success: false, message: 'Failed to download user data', error: error.message });
  }
};

// ============================================
// TERMS & AGREEMENTS
// ============================================

/**
 * Accept agreement/terms
 */
const acceptAgreement = async (req, res) => {
  try {
    const { type, version } = req.body;

    if (!type || !version) {
      return res.status(400).json({ success: false, message: 'Agreement type and version are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await user.acceptAgreement(type, version, ipAddress, userAgent);

    res.json({
      success: true,
      message: `${type} accepted`,
      data: {
        type,
        version,
        acceptedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Accept agreement error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept agreement', error: error.message });
  }
};

/**
 * Get accepted agreements
 */
const getAcceptedAgreements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const agreements = user.getAcceptedAgreements();

    res.json({
      success: true,
      data: {
        agreements,
        count: agreements.length
      }
    });
  } catch (error) {
    console.error('Get accepted agreements error:', error);
    res.status(500).json({ success: false, message: 'Failed to get agreements', error: error.message });
  }
};

/**
 * Check if specific agreement is accepted
 */
const checkAgreement = async (req, res) => {
  try {
    const { type, version } = req.query;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Agreement type is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const accepted = user.hasAcceptedAgreement(type, version || null);
    const latestAccepted = user.getLatestAcceptedAgreement(type);

    res.json({
      success: true,
      data: {
        type,
        requestedVersion: version || 'any',
        accepted,
        latestAccepted
      }
    });
  } catch (error) {
    console.error('Check agreement error:', error);
    res.status(500).json({ success: false, message: 'Failed to check agreement', error: error.message });
  }
};

// ============================================
// PRIVACY SETTINGS OVERVIEW
// ============================================

/**
 * Get complete privacy settings
 */
const getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const consentStatus = user.getConsentStatus();
    const deletionStatus = user.getDeletionStatus();
    const agreements = user.getAcceptedAgreements();

    res.json({
      success: true,
      data: {
        consent: consentStatus,
        deletion: deletionStatus,
        agreements: {
          accepted: agreements,
          count: agreements.length
        },
        dataRetentionPolicy: user.privacy?.dataRetentionPolicy || 'standard'
      }
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get privacy settings', error: error.message });
  }
};

module.exports = {
  // Consent
  getConsentStatus,
  giveGdprConsent,
  withdrawGdprConsent,
  updateMarketingConsent,
  setDoNotSell,
  setDoNotTrack,
  // Account deletion
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionStatus,
  // Data export
  exportUserData,
  downloadUserData,
  // Agreements
  acceptAgreement,
  getAcceptedAgreements,
  checkAgreement,
  // Overview
  getPrivacySettings
};
