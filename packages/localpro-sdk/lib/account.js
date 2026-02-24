/**
 * Account Security & Settings API – /api/account/*
 *
 * Covers:
 *  - Two-Factor Authentication (2FA)
 *  - Active Sessions
 *  - Password (reset request / validate token / reset / change)
 *  - Trusted Devices
 *  - Login History & Security Overview
 *  - OAuth Provider Connections
 *  - External Identity IDs
 *  - Privacy & Consent (GDPR, marketing, do-not-sell/track)
 *  - Account Deletion
 *  - Data Export
 *  - User Agreements (Terms, Privacy Policy)
 */
class AccountAPI {
  constructor(client) {
    this.client = client;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TWO-FACTOR AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initiate 2FA setup – returns a TOTP URI / QR code seed
   * @param {Object} [data]
   * @param {string} [data.method] - "totp" | "sms" (default: "totp")
   * @returns {Promise<Object>} { secret, qrCodeUrl }
   */
  async setup2FA(data = {}) {
    return this.client.post('/api/account/2fa/setup', data);
  }

  /**
   * Complete 2FA setup by verifying the first TOTP code
   * @param {Object} data
   * @param {string} data.code - 6-digit TOTP / SMS code
   * @returns {Promise<Object>} { backupCodes }
   */
  async verify2FA(data) {
    if (!data.code) throw new Error('code is required');
    return this.client.post('/api/account/2fa/verify', data);
  }

  /**
   * Disable 2FA for the authenticated user
   * @param {Object} [data]
   * @param {string} [data.code] - Current TOTP code (confirmation)
   * @returns {Promise<Object>}
   */
  async disable2FA(data = {}) {
    return this.client.delete('/api/account/2fa', data);
  }

  /**
   * Get current 2FA status
   * @returns {Promise<Object>} { enabled, method, setupAt }
   */
  async get2FAStatus() {
    return this.client.get('/api/account/2fa/status');
  }

  /**
   * Regenerate 2FA backup codes
   * @param {Object} [data]
   * @param {string} [data.code] - Current TOTP code (confirmation)
   * @returns {Promise<Object>} { backupCodes: string[] }
   */
  async regenerateBackupCodes(data = {}) {
    return this.client.post('/api/account/2fa/backup-codes', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all active sessions for the authenticated user
   * @returns {Promise<Object[]>} Array of session objects
   */
  async getSessions() {
    return this.client.get('/api/account/sessions');
  }

  /**
   * Revoke a specific session by ID
   * @param {string} sessionId - Session ObjectId
   * @returns {Promise<Object>}
   */
  async revokeSession(sessionId) {
    if (!sessionId) throw new Error('sessionId is required');
    return this.client.delete(`/api/account/sessions/${sessionId}`);
  }

  /**
   * Revoke all sessions except the current one
   * @returns {Promise<Object>}
   */
  async revokeAllSessions() {
    return this.client.post('/api/account/sessions/revoke-all');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Request a password-reset email
   * @param {Object} data
   * @param {string} data.email - Registered email address
   * @returns {Promise<Object>}
   */
  async requestPasswordReset(data) {
    if (!data.email) throw new Error('email is required');
    return this.client.post('/api/account/password/reset-request', data);
  }

  /**
   * Validate a password-reset token before showing the new-password form
   * @param {string} token - Token from the reset email link
   * @returns {Promise<Object>} { valid, expiresAt }
   */
  async validateResetToken(token) {
    if (!token) throw new Error('token is required');
    return this.client.get(`/api/account/password/validate-token/${token}`);
  }

  /**
   * Reset password using a valid reset token
   * @param {Object} data
   * @param {string} data.token    - Reset token
   * @param {string} data.password - New password
   * @returns {Promise<Object>}
   */
  async resetPassword(data) {
    if (!data.token || !data.password) throw new Error('token and password are required');
    return this.client.post('/api/account/password/reset', data);
  }

  /**
   * Change password while authenticated (requires current password)
   * @param {Object} data
   * @param {string} data.currentPassword - Existing password
   * @param {string} data.newPassword     - New password
   * @returns {Promise<Object>}
   */
  async changePassword(data) {
    if (!data.currentPassword || !data.newPassword) {
      throw new Error('currentPassword and newPassword are required');
    }
    return this.client.post('/api/account/password/change', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRUSTED DEVICES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all trusted devices
   * @returns {Promise<Object[]>}
   */
  async getTrustedDevices() {
    return this.client.get('/api/account/trusted-devices');
  }

  /**
   * Register the current device as trusted (skips 2FA on next login)
   * @param {Object} [data]
   * @param {string} [data.deviceName] - Human-readable device label
   * @returns {Promise<Object>}
   */
  async addTrustedDevice(data = {}) {
    return this.client.post('/api/account/trusted-devices', data);
  }

  /**
   * Remove a trusted device
   * @param {string} deviceId - Trusted-device ObjectId
   * @returns {Promise<Object>}
   */
  async removeTrustedDevice(deviceId) {
    if (!deviceId) throw new Error('deviceId is required');
    return this.client.delete(`/api/account/trusted-devices/${deviceId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN HISTORY & SECURITY OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get paginated login history
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<Object>}
   */
  async getLoginHistory(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.client.get(`/api/account/login-history${qs ? `?${qs}` : ''}`);
  }

  /**
   * Get security overview (2FA status, sessions, devices, recent activity)
   * @returns {Promise<Object>}
   */
  async getSecurityOverview() {
    return this.client.get('/api/account/security');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OAUTH PROVIDER CONNECTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List connected OAuth providers (Google, Facebook, Apple …)
   * @returns {Promise<Object[]>}
   */
  async getOAuthProviders() {
    return this.client.get('/api/account/oauth/providers');
  }

  /**
   * Connect an OAuth provider to the current account
   * @param {string} provider      - "google" | "facebook" | "apple"
   * @param {Object} data
   * @param {string} data.idToken  - ID token returned from the provider
   * @returns {Promise<Object>}
   */
  async connectOAuthProvider(provider, data) {
    if (!provider) throw new Error('provider is required');
    return this.client.post(`/api/account/oauth/${provider}/connect`, data);
  }

  /**
   * Disconnect an OAuth provider from the current account
   * @param {string} provider - "google" | "facebook" | "apple"
   * @returns {Promise<Object>}
   */
  async disconnectOAuthProvider(provider) {
    if (!provider) throw new Error('provider is required');
    return this.client.post(`/api/account/oauth/${provider}/disconnect`);
  }

  /**
   * Login / register via OAuth (social auth entry point)
   * @param {Object} data
   * @param {string} data.provider - "google" | "facebook" | "apple"
   * @param {string} data.idToken  - ID token from the provider SDK
   * @returns {Promise<Object>} Tokens + user
   */
  async oauthLogin(data) {
    if (!data.provider || !data.idToken) throw new Error('provider and idToken are required');
    return this.client.post('/api/account/oauth/login', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXTERNAL IDENTITY IDs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List external system IDs linked to the account
   * @returns {Promise<Object[]>}
   */
  async getExternalIds() {
    return this.client.get('/api/account/external-ids');
  }

  /**
   * Link an external system ID
   * @param {Object} data
   * @param {string} data.system     - External system name
   * @param {string} data.externalId - ID in that external system
   * @returns {Promise<Object>}
   */
  async addExternalId(data) {
    if (!data.system || !data.externalId) throw new Error('system and externalId are required');
    return this.client.post('/api/account/external-ids', data);
  }

  /**
   * Remove an external system ID
   * @param {string} system - External system name
   * @returns {Promise<Object>}
   */
  async removeExternalId(system) {
    if (!system) throw new Error('system is required');
    return this.client.delete(`/api/account/external-ids/${system}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVACY & CONSENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the user's privacy settings
   * @returns {Promise<Object>}
   */
  async getPrivacySettings() {
    return this.client.get('/api/account/privacy');
  }

  /**
   * Get all consent records for the authenticated user
   * @returns {Promise<Object>}
   */
  async getConsentRecords() {
    return this.client.get('/api/account/privacy/consent');
  }

  /**
   * Record GDPR consent
   * @param {Object} data
   * @param {boolean} data.consent - Whether the user consents
   * @returns {Promise<Object>}
   */
  async grantGdprConsent(data) {
    return this.client.post('/api/account/privacy/consent/gdpr', data);
  }

  /**
   * Withdraw GDPR consent
   * @returns {Promise<Object>}
   */
  async withdrawGdprConsent() {
    return this.client.delete('/api/account/privacy/consent/gdpr');
  }

  /**
   * Update marketing communications preference
   * @param {Object} data
   * @param {boolean} data.consent - Opt-in (true) or opt-out (false)
   * @returns {Promise<Object>}
   */
  async updateMarketingConsent(data) {
    return this.client.put('/api/account/privacy/consent/marketing', data);
  }

  /**
   * Update do-not-sell data preference
   * @param {Object} data
   * @param {boolean} data.doNotSell
   * @returns {Promise<Object>}
   */
  async updateDoNotSell(data) {
    return this.client.put('/api/account/privacy/do-not-sell', data);
  }

  /**
   * Update do-not-track preference
   * @param {Object} data
   * @param {boolean} data.doNotTrack
   * @returns {Promise<Object>}
   */
  async updateDoNotTrack(data) {
    return this.client.put('/api/account/privacy/do-not-track', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACCOUNT DELETION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get account deletion status or scheduled deletion date
   * @returns {Promise<Object>}
   */
  async getDeletionStatus() {
    return this.client.get('/api/account/deletion');
  }

  /**
   * Request account deletion (may be scheduled with a cooling-off period)
   * @param {Object} [data]
   * @param {string} [data.reason] - Optional reason for deletion
   * @returns {Promise<Object>}
   */
  async requestDeletion(data = {}) {
    return this.client.post('/api/account/deletion', data);
  }

  /**
   * Cancel a pending account deletion request
   * @returns {Promise<Object>}
   */
  async cancelDeletion() {
    return this.client.delete('/api/account/deletion');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DATA EXPORT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Request a data-export archive (GDPR Article 20 – portability)
   * Server will email a download link when the archive is ready.
   * @returns {Promise<Object>} { requestedAt, estimatedReadyAt }
   */
  async requestDataExport() {
    return this.client.get('/api/account/data/export');
  }

  /**
   * Download a previously generated data-export archive
   * @returns {Promise<Object|Buffer>} Archive file or download URL
   */
  async downloadDataExport() {
    return this.client.get('/api/account/data/download');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AGREEMENTS (Terms of Service / Privacy Policy)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all agreements the user has accepted
   * @returns {Promise<Object[]>}
   */
  async getAgreements() {
    return this.client.get('/api/account/agreements');
  }

  /**
   * Accept one or more legal agreements
   * @param {Object} data
   * @param {string[]} data.agreements - Agreement IDs / types (e.g. ["terms-v2", "privacy-v3"])
   * @returns {Promise<Object>}
   */
  async acceptAgreements(data) {
    if (!Array.isArray(data.agreements) || data.agreements.length === 0) {
      throw new Error('agreements array is required');
    }
    return this.client.post('/api/account/agreements', data);
  }

  /**
   * Check whether the user has accepted the latest version of all required agreements
   * @returns {Promise<Object>} { allAccepted: boolean, pending: string[] }
   */
  async checkAgreements() {
    return this.client.get('/api/account/agreements/check');
  }
}

module.exports = AccountAPI;
