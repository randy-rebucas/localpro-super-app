/**
 * Referrals API Module
 * Handles referral system functionality including links, tracking, rewards, and analytics
 */
class ReferralsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Validate a referral code
   * @param {Object} data - Referral code data
   * @param {string} data.code - Referral code to validate
   * @returns {Promise<Object>}
   */
  async validateCode(data) {
    return this.client.post('/api/referrals/validate', data);
  }

  /**
   * Track a referral click
   * @param {Object} data - Referral tracking data
   * @param {string} data.code - Referral code
   * @returns {Promise<Object>}
   */
  async trackClick(data) {
    return this.client.post('/api/referrals/track', data);
  }

  /**
   * Get referral leaderboard
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit] - Number of results
   * @returns {Promise<Object>}
   */
  async getLeaderboard(params = {}) {
    return this.client.get('/api/referrals/leaderboard', { params });
  }

  /**
   * Get my referrals
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Results per page
   * @returns {Promise<Object>}
   */
  async getMyReferrals(params = {}) {
    return this.client.get('/api/referrals/me', { params });
  }

  /**
   * Get referral statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    return this.client.get('/api/referrals/stats');
  }

  /**
   * Get referral links
   * @returns {Promise<Object>}
   */
  async getLinks() {
    return this.client.get('/api/referrals/links');
  }

  /**
   * Get referral rewards
   * @returns {Promise<Object>}
   */
  async getRewards() {
    return this.client.get('/api/referrals/rewards');
  }

  /**
   * Send referral invitation
   * @param {Object} data - Invitation data
   * @param {string} data.email - Email address to invite
   * @param {string} [data.message] - Optional invitation message
   * @returns {Promise<Object>}
   */
  async sendInvitation(data) {
    return this.client.post('/api/referrals/invite', data);
  }

  /**
   * Update referral preferences
   * @param {Object} data - Preferences data
   * @returns {Promise<Object>}
   */
  async updatePreferences(data) {
    return this.client.put('/api/referrals/preferences', data);
  }

  /**
   * Process referral completion (Admin only)
   * @param {Object} data - Completion data
   * @returns {Promise<Object>}
   */
  async processCompletion(data) {
    return this.client.post('/api/referrals/process', data);
  }

  /**
   * Get referral analytics (Admin only)
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    return this.client.get('/api/referrals/analytics', { params });
  }
}

module.exports = ReferralsAPI;
