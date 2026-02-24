/**
 * privacyController – thin HTTP layer that delegates to privacyService.
 *
 * Business logic (User model calls, audit logging) lives in privacyService.js.
 * Controllers are only responsible for:
 *   - Extracting request data (body, params, query)
 *   - Calling the service
 *   - Sending the appropriate HTTP response
 */
const privacyService = require('../services/privacyService');
const logger = require('../../../src/config/logger');

// ─── Generic error handler ───────────────────────────────────────────────────
const handleError = (res, error, defaultMessage) => {
  logger.error(`[privacyController] ${defaultMessage}:`);
  const status = error.status || 500;
  res.status(status).json({ success: false, message: error.message || defaultMessage, ...(error.data && { data: error.data }) });
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT
// ─────────────────────────────────────────────────────────────────────────────

const getConsentStatus = async (req, res) => {
  try {
    const data = await privacyService.getConsentStatus(req.user.id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error, 'Failed to get consent status'); }
};

const giveGdprConsent = async (req, res) => {
  try {
    const { version } = req.body;
    if (!version) return res.status(400).json({ success: false, message: 'Consent version is required' });
    const data = await privacyService.giveGdprConsent(req.user.id, version, req.ip || req.connection?.remoteAddress);
    res.json({ success: true, message: 'GDPR consent recorded', data });
  } catch (error) { handleError(res, error, 'Failed to record consent'); }
};

const withdrawGdprConsent = async (req, res) => {
  try {
    const data = await privacyService.withdrawGdprConsent(req.user.id);
    res.json({ success: true, message: 'GDPR consent withdrawn', data });
  } catch (error) { handleError(res, error, 'Failed to withdraw consent'); }
};

const updateMarketingConsent = async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const data = await privacyService.updateMarketingConsent(req.user.id, { email, sms, push });
    res.json({ success: true, message: 'Marketing preferences updated', data });
  } catch (error) { handleError(res, error, 'Failed to update marketing preferences'); }
};

const setDoNotSell = async (req, res) => {
  try {
    const { doNotSell } = req.body;
    if (typeof doNotSell !== 'boolean') return res.status(400).json({ success: false, message: 'doNotSell must be a boolean' });
    const data = await privacyService.setDoNotSell(req.user.id, doNotSell);
    res.json({ success: true, message: `Do Not Sell preference ${doNotSell ? 'enabled' : 'disabled'}`, data });
  } catch (error) { handleError(res, error, 'Failed to update preference'); }
};

const setDoNotTrack = async (req, res) => {
  try {
    const { doNotTrack } = req.body;
    if (typeof doNotTrack !== 'boolean') return res.status(400).json({ success: false, message: 'doNotTrack must be a boolean' });
    const data = await privacyService.setDoNotTrack(req.user.id, doNotTrack);
    res.json({ success: true, message: `Do Not Track preference ${doNotTrack ? 'enabled' : 'disabled'}`, data });
  } catch (error) { handleError(res, error, 'Failed to update preference'); }
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DELETION
// ─────────────────────────────────────────────────────────────────────────────

const requestAccountDeletion = async (req, res) => {
  try {
    const { reason, password } = req.body;
    const data = await privacyService.requestAccountDeletion(req.user.id, reason, password);
    res.json({ success: true, message: 'Account deletion requested', data });
  } catch (error) { handleError(res, error, 'Failed to request account deletion'); }
};

const cancelAccountDeletion = async (req, res) => {
  try {
    await privacyService.cancelAccountDeletion(req.user.id);
    res.json({ success: true, message: 'Account deletion cancelled' });
  } catch (error) { handleError(res, error, 'Failed to cancel account deletion'); }
};

const getDeletionStatus = async (req, res) => {
  try {
    const data = await privacyService.getDeletionStatus(req.user.id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error, 'Failed to get deletion status'); }
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const exportUserData = async (req, res) => {
  try {
    const data = await privacyService.exportUserData(req.user.id);
    res.json({ success: true, message: 'User data exported successfully', data });
  } catch (error) { handleError(res, error, 'Failed to export user data'); }
};

const downloadUserData = async (req, res) => {
  try {
    const data = await privacyService.exportUserData(req.user.id);
    const filename = `user-data-${req.user.id}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) { handleError(res, error, 'Failed to download user data'); }
};

// ─────────────────────────────────────────────────────────────────────────────
// AGREEMENTS
// ─────────────────────────────────────────────────────────────────────────────

const acceptAgreement = async (req, res) => {
  try {
    const { type, version } = req.body;
    if (!type || !version) return res.status(400).json({ success: false, message: 'Agreement type and version are required' });
    const data = await privacyService.acceptAgreement(
      req.user.id, type, version,
      req.ip || req.connection?.remoteAddress,
      req.headers?.['user-agent']
    );
    res.json({ success: true, message: `${type} accepted`, data });
  } catch (error) { handleError(res, error, 'Failed to accept agreement'); }
};

const getAcceptedAgreements = async (req, res) => {
  try {
    const agreements = await privacyService.getAcceptedAgreements(req.user.id);
    res.json({ success: true, data: { agreements, count: agreements.length } });
  } catch (error) { handleError(res, error, 'Failed to get agreements'); }
};

const checkAgreement = async (req, res) => {
  try {
    const { type, version } = req.query;
    if (!type) return res.status(400).json({ success: false, message: 'Agreement type is required' });
    const result = await privacyService.checkAgreement(req.user.id, type, version);
    res.json({ success: true, data: { type, requestedVersion: version || 'any', ...result } });
  } catch (error) { handleError(res, error, 'Failed to check agreement'); }
};

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

const getPrivacySettings = async (req, res) => {
  try {
    const data = await privacyService.getPrivacySettings(req.user.id);
    res.json({ success: true, data });
  } catch (error) { handleError(res, error, 'Failed to get privacy settings'); }
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
    logger.error('Get consent status error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to get consent status'});
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
    logger.error('Give GDPR consent error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to record consent'});
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
    logger.error('Withdraw GDPR consent error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to withdraw consent'});
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
    logger.error('Update marketing consent error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to update marketing preferences'});
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
    logger.error('Set Do Not Sell error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to update preference'});
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
    logger.error('Set Do Not Track error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to update preference'});
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
    logger.error('Request account deletion error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to request account deletion'});
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
    logger.error('Cancel account deletion error:', { error: error.message, stack: error.stack });

    if (error.message === 'No deletion request found') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'Deletion already processed') {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to cancel account deletion'});
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
    logger.error('Get deletion status error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to get deletion status'});
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
    logger.error('Export user data error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to export user data'});
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
    logger.error('Download user data error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to download user data'});
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
    logger.error('Accept agreement error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to accept agreement'});
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
    logger.error('Get accepted agreements error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to get agreements'});
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
    logger.error('Check agreement error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to check agreement'});
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
    logger.error('Get privacy settings error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to get privacy settings'});
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
