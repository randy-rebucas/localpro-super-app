/**
 * privacyService – business logic layer for privacy & consent operations.
 *
 * Extracted from privacyController so that the HTTP layer stays thin and the
 * logic can be reused (e.g. from cron jobs, admin tools, or other controllers).
 *
 * All methods return plain data objects; controllers are responsible for
 * constructing HTTP responses.
 */
const User = require('../../../src/models/User');
const SecurityAuditLog = require('../../../src/models/SecurityAuditLog');

// ─────────────────────────────────────────────────────────────────────────────
// Consent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @returns {Promise<Object>} Consent status object from user model
 */
const getConsentStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user.getConsentStatus();
};

/**
 * @param {string|ObjectId} userId
 * @param {string} version  - Consent document version (e.g. "1.2")
 * @param {string} ipAddress
 * @returns {Promise<{ given: true, version: string, givenAt: Date }>}
 */
const giveGdprConsent = async (userId, version, ipAddress) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await user.giveGdprConsent(version, ipAddress);

  SecurityAuditLog.log(userId, 'gdpr_consent_given', {
    ipAddress,
    metadata: { version }
  }).catch(() => {});

  return { given: true, version, givenAt: new Date() };
};

/**
 * @param {string|ObjectId} userId
 * @returns {Promise<{ given: false, withdrawnAt: Date }>}
 */
const withdrawGdprConsent = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await user.withdrawGdprConsent();

  SecurityAuditLog.log(userId, 'gdpr_consent_withdrawn').catch(() => {});

  return { given: false, withdrawnAt: new Date() };
};

/**
 * @param {string|ObjectId} userId
 * @param {{ email?: boolean, sms?: boolean, push?: boolean }} preferences
 * @returns {Promise<Object>}
 */
const updateMarketingConsent = async (userId, preferences) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await user.updateMarketingConsent(preferences);

  return {
    email: preferences.email !== undefined ? preferences.email : user.privacy?.marketingConsent?.email,
    sms: preferences.sms !== undefined ? preferences.sms : user.privacy?.marketingConsent?.sms,
    push: preferences.push !== undefined ? preferences.push : user.privacy?.marketingConsent?.push,
    updatedAt: new Date()
  };
};

/**
 * @param {string|ObjectId} userId
 * @param {boolean} doNotSell
 */
const setDoNotSell = async (userId, doNotSell) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  await user.setDoNotSell(doNotSell);
  return { doNotSell };
};

/**
 * @param {string|ObjectId} userId
 * @param {boolean} doNotTrack
 */
const setDoNotTrack = async (userId, doNotTrack) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  await user.setDoNotTrack(doNotTrack);
  return { doNotTrack };
};

// ─────────────────────────────────────────────────────────────────────────────
// Account Deletion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string|ObjectId} userId
 * @param {string} reason
 * @param {string} [password] - Required if the account has a password set
 * @returns {Promise<{ scheduledFor: Date, gracePeriodDays: number, canCancelUntil: Date }>}
 */
const requestAccountDeletion = async (userId, reason, password) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  if (user.password) {
    if (!password) {
      throw Object.assign(new Error('Password is required to request account deletion'), { status: 400 });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw Object.assign(new Error('Invalid password'), { status: 401 });
    }
  }

  if (user.isPendingDeletion()) {
    throw Object.assign(
      new Error('Account deletion already requested'),
      { status: 400, data: user.getDeletionStatus() }
    );
  }

  const scheduledFor = await user.requestAccountDeletion(reason);

  SecurityAuditLog.log(userId, 'account_deletion_requested', {
    metadata: { reason, scheduledFor }
  }).catch(() => {});

  return { scheduledFor, gracePeriodDays: 30, canCancelUntil: scheduledFor };
};

/**
 * @param {string|ObjectId} userId
 */
const cancelAccountDeletion = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await user.cancelAccountDeletion();

  SecurityAuditLog.log(userId, 'account_deletion_cancelled').catch(() => {});
};

/**
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>}
 */
const getDeletionStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user.getDeletionStatus();
};

// ─────────────────────────────────────────────────────────────────────────────
// Data Export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>} Full user data export
 */
const exportUserData = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  SecurityAuditLog.log(userId, 'data_export_requested').catch(() => {});

  return user.exportUserData();
};

// ─────────────────────────────────────────────────────────────────────────────
// Agreements
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string|ObjectId} userId
 * @param {string} type     - Agreement type (e.g. "terms", "privacy")
 * @param {string} version  - Document version
 * @param {string} ipAddress
 * @param {string} userAgent
 */
const acceptAgreement = async (userId, type, version, ipAddress, userAgent) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await user.acceptAgreement(type, version, ipAddress, userAgent);

  return { type, version, acceptedAt: new Date() };
};

/**
 * @param {string|ObjectId} userId
 */
const getAcceptedAgreements = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user.getAcceptedAgreements();
};

/**
 * @param {string|ObjectId} userId
 * @param {string} type
 * @param {string} [version]
 * @returns {Promise<{ accepted: boolean, latestAccepted: Object|null }>}
 */
const checkAgreement = async (userId, type, version) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  return {
    accepted: user.hasAcceptedAgreement(type, version || null),
    latestAccepted: user.getLatestAcceptedAgreement(type)
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string|ObjectId} userId
 */
const getPrivacySettings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  return {
    consent: user.getConsentStatus(),
    deletion: user.getDeletionStatus(),
    agreements: {
      accepted: user.getAcceptedAgreements(),
      count: user.getAcceptedAgreements().length
    },
    dataRetentionPolicy: user.privacy?.dataRetentionPolicy || 'standard'
  };
};

module.exports = {
  getConsentStatus,
  giveGdprConsent,
  withdrawGdprConsent,
  updateMarketingConsent,
  setDoNotSell,
  setDoNotTrack,
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionStatus,
  exportUserData,
  acceptAgreement,
  getAcceptedAgreements,
  checkAgreement,
  getPrivacySettings
};
