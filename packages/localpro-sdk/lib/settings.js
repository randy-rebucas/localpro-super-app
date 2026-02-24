/**
 * @class SettingsAPI
 * @classdesc Manages user preferences and global app configuration.
 *
 * User settings cover privacy, notifications, communication, service, payment,
 * security, and analytics categories.  App settings (admin-only) govern global
 * feature flags, upload limits, payments configuration, and maintenance mode.
 * Public routes (`getPublicAppSettings`, `getAppHealth`) require no auth token.
 *
 * @example
 * const { LocalProSDK } = require('@localpro/sdk');
 * const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.com', token: 'JWT' });
 *
 * // Read current user settings
 * const { data } = await sdk.settings.getUserSettings();
 *
 * // Silence push notifications
 * await sdk.settings.updateUserSettingsCategory('notifications', {
 *   push: { enabled: false }
 * });
 *
 * // Admin: disable a feature flag
 * await sdk.settings.toggleFeatureFlag({ feature: 'referrals', enabled: false });
 */
class SettingsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get user settings
   * @returns {Promise<Object>}
   */
  async getUserSettings() {
    return this.client.get('/api/settings/user');
  }

  /**
   * Update user settings
   * @param {Object} data - Settings data to merge
   * @returns {Promise<Object>}
   * @throws {Error} If `data` is not a non-null object
   */
  async updateUserSettings(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('updateUserSettings: data must be a non-null object');
    }
    return this.client.put('/api/settings/user', data);
  }

  /**
   * Update user settings category
   * @param {string} category - Category name (privacy, notifications, communication, service, payment, security, app, analytics)
   * @param {Object} data - Category settings data
   * @returns {Promise<Object>}
   * @throws {Error} If `category` is empty or `data` is not an object
   */
  async updateUserSettingsCategory(category, data) {
    if (!category || typeof category !== 'string') {
      throw new Error('updateUserSettingsCategory: category must be a non-empty string');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('updateUserSettingsCategory: data must be a non-null object');
    }
    return this.client.put(`/api/settings/user/${category}`, data);
  }

  /**
   * Reset user settings to defaults
   * @returns {Promise<Object>}
   */
  async resetUserSettings() {
    return this.client.post('/api/settings/user/reset');
  }

  /**
   * Delete user settings
   * @returns {Promise<Object>}
   */
  async deleteUserSettings() {
    return this.client.delete('/api/settings/user');
  }

  /**
   * Get app settings (Admin only)
   * @returns {Promise<Object>}
   */
  async getAppSettings() {
    return this.client.get('/api/settings/app');
  }

  /**
   * Get public app settings (No auth required)
   * @returns {Promise<Object>}
   */
  async getPublicAppSettings() {
    return this.client.get('/api/settings/app/public');
  }

  /**
   * Update app settings (Admin only)
   * @param {Object} data - App settings data to merge
   * @returns {Promise<Object>}
   * @throws {Error} If `data` is not a non-null object
   */
  async updateAppSettings(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('updateAppSettings: data must be a non-null object');
    }
    return this.client.put('/api/settings/app', data);
  }

  /**
   * Update app settings category (Admin only)
   * @param {string} category - Category name (general, business, features, uploads, payments, notifications, integrations, security)
   * @param {Object} data - Category settings data
   * @returns {Promise<Object>}
   * @throws {Error} If `category` is empty or `data` is not an object
   */
  async updateAppSettingsCategory(category, data) {
    if (!category || typeof category !== 'string') {
      throw new Error('updateAppSettingsCategory: category must be a non-empty string');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('updateAppSettingsCategory: data must be a non-null object');
    }
    return this.client.put(`/api/settings/app/${category}`, data);
  }

  /**
   * Toggle feature flag (Admin only)
   * @param {Object} data - Feature flag data
   * @param {string} data.feature - Feature name (e.g. 'marketplace', 'academy', 'referrals')
   * @param {boolean} data.enabled - Enable/disable flag
   * @returns {Promise<Object>}
   * @throws {Error} If `data.feature` is missing or `data.enabled` is not boolean
   */
  async toggleFeatureFlag(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('toggleFeatureFlag: data must be an object with feature and enabled fields');
    }
    if (!data.feature || typeof data.feature !== 'string') {
      throw new Error('toggleFeatureFlag: data.feature must be a non-empty string');
    }
    if (typeof data.enabled !== 'boolean') {
      throw new Error('toggleFeatureFlag: data.enabled must be a boolean');
    }
    return this.client.post('/api/settings/app/features/toggle', data);
  }

  /**
   * Get app health status
   * @returns {Promise<Object>}
   */
  async getAppHealth() {
    return this.client.get('/api/settings/app/health');
  }
}

module.exports = SettingsAPI;
