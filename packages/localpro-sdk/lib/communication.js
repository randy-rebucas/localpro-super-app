/**
 * Communication API Module
 * Handles messaging, conversations, and notifications
 */
class CommunicationAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get user conversations
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Results per page
   * @returns {Promise<Object>}
   */
  async getConversations(params = {}) {
    return this.client.get('/api/communication/conversations', { params });
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>}
   */
  async getConversation(conversationId) {
    return this.client.get(`/api/communication/conversations/${conversationId}`);
  }

  /**
   * Create a new conversation
   * @param {Object} data - Conversation data
   * @param {string} data.participantId - Participant user ID
   * @param {string} [data.initialMessage] - Optional initial message
   * @returns {Promise<Object>}
   */
  async createConversation(data) {
    return this.client.post('/api/communication/conversations', data);
  }

  /**
   * Delete conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>}
   */
  async deleteConversation(conversationId) {
    return this.client.delete(`/api/communication/conversations/${conversationId}`);
  }

  /**
   * Get messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Results per page
   * @returns {Promise<Object>}
   */
  async getMessages(conversationId, params = {}) {
    return this.client.get(`/api/communication/conversations/${conversationId}/messages`, { params });
  }

  /**
   * Send a message
   * @param {string} conversationId - Conversation ID
   * @param {Object|FormData} data - Message data or FormData for file uploads
   * @param {string} [data.content] - Message content
   * @param {File[]} [data.attachments] - File attachments
   * @returns {Promise<Object>}
   */
  async sendMessage(conversationId, data) {
    return this.client.post(`/api/communication/conversations/${conversationId}/messages`, data, {
      headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Update a message
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {Object} data - Updated message data
   * @returns {Promise<Object>}
   */
  async updateMessage(conversationId, messageId, data) {
    return this.client.put(`/api/communication/conversations/${conversationId}/messages/${messageId}`, data);
  }

  /**
   * Delete a message
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>}
   */
  async deleteMessage(conversationId, messageId) {
    return this.client.delete(`/api/communication/conversations/${conversationId}/messages/${messageId}`);
  }

  /**
   * Mark conversation as read
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>}
   */
  async markAsRead(conversationId) {
    return this.client.put(`/api/communication/conversations/${conversationId}/read`);
  }

  /**
   * Get unread message count
   * @returns {Promise<Object>}
   */
  async getUnreadCount() {
    return this.client.get('/api/communication/unread-count');
  }

  /**
   * Search conversations
   * @param {Object} [params] - Search parameters
   * @param {string} [params.q] - Search query
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Results per page
   * @returns {Promise<Object>}
   */
  async searchConversations(params = {}) {
    return this.client.get('/api/communication/search', { params });
  }

  /**
   * Get or create conversation with a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getConversationWithUser(userId) {
    return this.client.get(`/api/communication/conversation-with/${userId}`);
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
    return this.client.get('/api/communication/notifications', { params });
  }

  /**
   * Get notification count
   * @returns {Promise<Object>}
   */
  async getNotificationCount() {
    return this.client.get('/api/communication/notifications/count');
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  async markNotificationAsRead(notificationId) {
    return this.client.put(`/api/communication/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>}
   */
  async markAllNotificationsAsRead() {
    return this.client.put('/api/communication/notifications/read-all');
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>}
   */
  async deleteNotification(notificationId) {
    return this.client.delete(`/api/communication/notifications/${notificationId}`);
  }

  /**
   * Send email notification
   * @param {Object} data - Email notification data
   * @returns {Promise<Object>}
   */
  async sendEmailNotification(data) {
    return this.client.post('/api/communication/notifications/email', data);
  }

  /**
   * Send SMS notification
   * @param {Object} data - SMS notification data
   * @returns {Promise<Object>}
   */
  async sendSMSNotification(data) {
    return this.client.post('/api/communication/notifications/sms', data);
  }
}

module.exports = CommunicationAPI;
