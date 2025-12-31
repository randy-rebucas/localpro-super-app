/**
 * Settings API Module
 * Handles user and app settings management
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
   * @param {Object} data - Settings data
   * @returns {Promise<Object>}
   */
  async updateUserSettings(data) {
    return this.client.put('/api/settings/user', data);
  }

  /**
   * Update user settings category
   * @param {string} category - Category name (privacy, notifications, communication, service, payment, security, app, analytics)
   * @param {Object} data - Category settings data
   * @returns {Promise<Object>}
   */
  async updateUserSettingsCategory(category, data) {
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
   * @param {Object} data - App settings data
   * @returns {Promise<Object>}
   */
  async updateAppSettings(data) {
    return this.client.put('/api/settings/app', data);
  }

  /**
   * Update app settings category (Admin only)
   * @param {string} category - Category name
   * @param {Object} data - Category settings data
   * @returns {Promise<Object>}
   */
  async updateAppSettingsCategory(category, data) {
    return this.client.put(`/api/settings/app/${category}`, data);
  }

  /**
   * Toggle feature flag (Admin only)
   * @param {Object} data - Feature flag data
   * @param {string} data.feature - Feature name
   * @param {boolean} data.enabled - Enable/disable flag
   * @returns {Promise<Object>}
   */
  async toggleFeatureFlag(data) {
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
