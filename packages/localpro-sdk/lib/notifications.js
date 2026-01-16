/**
 * Notifications API Module
 * Handles push notifications, FCM tokens, and notification management
 */
class NotificationsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get user notifications
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Results per page
   * @param {boolean} [params.isRead] - Filter by read status
   * @param {string} [params.type] - Filter by notification type
   * @returns {Promise<Object>}
   */
  async getNotifications(params = {}) {
    return this.client.get('/api/notifications', { params });
  }

  /**
   * Get unread notification count
   * @returns {Promise<Object>}
   */
  async getUnreadCount() {
    return this.client.get('/api/notifications/unread-count');
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    return this.client.put(`/api/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>}
   */
  async markAllAsRead() {
    return this.client.put('/api/notifications/read-all');
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  async deleteNotification(notificationId) {
    return this.client.delete(`/api/notifications/${notificationId}`);
  }

  /**
   * Delete all notifications
   * @param {Object} [params] - Query parameters
   * @param {boolean} [params.readOnly] - Delete only read notifications
   * @returns {Promise<Object>}
   */
  async deleteAllNotifications(params = {}) {
    return this.client.delete('/api/notifications', { params });
  }

  /**
   * Register or update FCM token for push notifications
   * @param {Object} data - FCM token data
   * @param {string} data.token - FCM token
   * @param {string} data.deviceId - Device ID
   * @param {string} [data.deviceType] - Device type (ios, android, web)
   * @returns {Promise<Object>}
   */
  async registerFCMToken(data) {
    return this.client.post('/api/notifications/fcm-token', data);
  }

  /**
   * Remove FCM token
   * @param {string} tokenOrDeviceId - Token or device ID to remove
   * @returns {Promise<Object>}
   */
  async removeFCMToken(tokenOrDeviceId) {
    return this.client.delete(`/api/notifications/fcm-token/${tokenOrDeviceId}`);
  }

  /**
   * Get user's registered FCM tokens/devices
   * @returns {Promise<Object>}
   */
  async getFCMTokens() {
    return this.client.get('/api/notifications/fcm-tokens');
  }

  /**
   * Get user notification settings/preferences
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return this.client.get('/api/notifications/settings');
  }

  /**
   * Check if a specific notification type is enabled
   * @param {string} type - Notification type
   * @param {Object} [params] - Query parameters
   * @param {string} [params.channel] - Channel (push, email, sms)
   * @returns {Promise<Object>}
   */
  async checkEnabled(type, params = {}) {
    return this.client.get(`/api/notifications/check/${type}`, { params });
  }

  /**
   * Send a notification to a user (Admin only)
   * @param {Object} data - Notification data
   * @param {string} data.userId - User ID
   * @param {string} data.type - Notification type
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {Object} [data.data] - Additional data
   * @param {string} [data.priority] - Priority (low, medium, high, urgent)
   * @param {boolean} [data.forceChannels] - Force all channels
   * @returns {Promise<Object>}
   */
  async sendNotification(data) {
    return this.client.post('/api/notifications/send', data);
  }

  /**
   * Send notification to multiple users (Admin only)
   * @param {Object} data - Bulk notification data
   * @param {string[]} data.userIds - Array of user IDs
   * @param {string} data.type - Notification type
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {Object} [data.data] - Additional data
   * @param {string} [data.priority] - Priority
   * @returns {Promise<Object>}
   */
  async sendBulkNotification(data) {
    return this.client.post('/api/notifications/send-bulk', data);
  }

  /**
   * Send system announcement (Admin only)
   * @param {Object} data - Announcement data
   * @param {string} data.title - Announcement title
   * @param {string} data.message - Announcement message
   * @param {string[]} [data.userIds] - Specific user IDs (optional)
   * @param {string[]} [data.targetRoles] - Target roles (optional)
   * @param {string} [data.expiresAt] - Expiration date (ISO 8601)
   * @param {Object} [data.data] - Additional data
   * @returns {Promise<Object>}
   */
  async sendAnnouncement(data) {
    return this.client.post('/api/notifications/announcement', data);
  }

  /**
   * Send a test notification to the current user
   * @param {Object} [data] - Test notification data
   * @param {string} [data.type] - Test type (push, email, sms, all)
   * @returns {Promise<Object>}
   */
  async sendTest(data = {}) {
    return this.client.post('/api/notifications/test', data);
  }
}

module.exports = NotificationsAPI;
