/**
 * @classdesc Provides access to LocalPro Referrals API endpoints.
 * Covers public code validation and click tracking, authenticated user
 * operations (my referrals, stats, links, rewards, invitations, preferences),
 * and admin-only analytics and completion processing.
 *
 * @example
 * const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });
 *
 * // Validate a referral code before registration
 * const valid = await sdk.referrals.validateCode({ code: 'ABC123' });
 *
 * // Send invitations
 * await sdk.referrals.sendInvitation({ emails: ['friend@example.com'], method: 'email' });
 *
 * // Check own referral stats
 * const stats = await sdk.referrals.getStats();
 *
 * // Admin: view analytics
 * const analytics = await sdk.referrals.getAnalytics({ timeRange: 30, groupBy: 'day' });
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
    if (!data || !data.code) {
      throw new Error('Referral code is required');
    }
    return this.client.post('/api/referrals/validate', data);
  }

  /**
   * Track a referral click
   * @param {Object} data - Referral tracking data
   * @param {string} data.code - Referral code
   * @returns {Promise<Object>}
   */
  async trackClick(data) {
    if (!data || !data.code) {
      throw new Error('Referral code is required');
    }
    return this.client.post('/api/referrals/track', data);
  }

  /**
   * Get referral leaderboard
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit] - Number of results
   * @returns {Promise<Object>}
   */
  async getLeaderboard(params = {}) {
    return this.client.get('/api/referrals/leaderboard', params);
  }

  /**
   * Get my referrals
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Results per page
   * @returns {Promise<Object>}
   */
  async getMyReferrals(params = {}) {
    return this.client.get('/api/referrals/me', params);
  }

  /**
   * Get referral statistics
   * @returns {Promise<Object>}
   */
  async getStats(params = {}) {
    return this.client.get('/api/referrals/stats', params);
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
  async getRewards(params = {}) {
    return this.client.get('/api/referrals/rewards', params);
  }

  /**
   * Send referral invitation
   * @param {Object} data - Invitation data
   * @param {string} data.email - Email address to invite
   * @param {string} [data.message] - Optional invitation message
   * @returns {Promise<Object>}
   */
  async sendInvitation(data) {
    if (!data || (!data.emails && !data.phoneNumbers)) {
      throw new Error('At least one email or phone number is required');
    }
    return this.client.post('/api/referrals/invite', data);
  }

  /**
   * Update referral preferences
   * @param {Object} data - Preferences data
   * @returns {Promise<Object>}
   */
  async updatePreferences(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Preferences data is required');
    }
    return this.client.put('/api/referrals/preferences', data);
  }

  /**
   * Process referral completion (Admin only)
   * @param {Object} data - Completion data
   * @returns {Promise<Object>}
   */
  async processCompletion(data) {
    if (!data || !data.referralId || !data.triggerAction) {
      throw new Error('Referral ID and trigger action are required');
    }
    return this.client.post('/api/referrals/process', data);
  }

  /**
   * Get referral analytics (Admin only)
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    return this.client.get('/api/referrals/analytics', params);
  }
}

module.exports = ReferralsAPI;
