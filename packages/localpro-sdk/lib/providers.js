/**
 * @classdesc Provides access to LocalPro Providers API endpoints.
 * Covers public provider browse and skills lookup, authenticated profile
 * management (create, update, patch, onboarding, documents), provider
 * dashboard and analytics, reviews, and admin operations.
 *
 * @example
 * const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });
 *
 * // Browse providers
 * const { data } = await sdk.providers.list({ providerType: 'individual', page: 1 });
 *
 * // Create a provider profile
 * const profile = await sdk.providers.createProfile({
 *   providerType: 'individual',
 *   professionalInfo: { specialties: [{ category: 'cleaning', serviceAreas: ['Manila'] }] }
 * });
 *
 * // Get dashboard overview
 * const dashboard = await sdk.providers.getDashboard();
 *
 * // Respond to a review
 * await sdk.providers.respondToReview('<reviewId>', { responseText: 'Thank you!' });
 */
class ProvidersAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get list of providers with optional filters
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.providerType] - Filter by type (individual, business, agency)
   * @param {string} [filters.search] - Search term
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Paginated list of providers
   */
  async list(filters = {}) {
    return await this.client.get('/api/providers', filters);
  }

  /**
   * Get provider by ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Provider details
   */
  async getById(providerId) {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    return await this.client.get(`/api/providers/${providerId}`);
  }

  /**
   * Get provider skills
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.category] - Filter by category ID or key
   * @returns {Promise<Object>} List of provider skills
   */
  async getSkills(filters = {}) {
    return await this.client.get('/api/providers/skills', filters);
  }

  /**
   * Get current user's provider profile
   * @returns {Promise<Object>} Provider profile
   */
  async getMyProfile() {
    return await this.client.get('/api/providers/profile/me');
  }

  /**
   * Create provider profile (upgrade from client)
   * @param {Object} profileData - Profile data
   * @param {string} profileData.providerType - Provider type (individual, business, agency)
   * @param {Object} [profileData.businessInfo] - Business information
   * @param {Object} [profileData.professionalInfo] - Professional information
   * @returns {Promise<Object>} Created provider profile
   */
  async createProfile(profileData) {
    if (!profileData.providerType) {
      throw new Error('Provider type is required');
    }

    return await this.client.post('/api/providers/profile', profileData);
  }

  /**
   * Update provider profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated provider profile
   */
  async updateProfile(profileData) {
    return await this.client.put('/api/providers/profile', profileData);
  }

  /**
   * Partially update provider profile
   * @param {Object} profileData - Partial profile data
   * @returns {Promise<Object>} Updated provider profile
   */
  async patchProfile(profileData) {
    return await this.client.patch('/api/providers/profile', profileData);
  }

  /**
   * Update onboarding step
   * @param {Object} stepData - Step data
   * @param {string} stepData.step - Onboarding step name
   * @param {Object} stepData.data - Step data
   * @returns {Promise<Object>} Updated profile
   */
  async updateOnboardingStep(stepData) {
    if (!stepData.step || !stepData.data) {
      throw new Error('Step and data are required');
    }

    return await this.client.put('/api/providers/onboarding/step', stepData);
  }

  /**
   * Upload provider documents
   * @param {FormData|Object} formData - Form data with documents
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocuments(formData) {
    return await this.client.upload('/api/providers/documents/upload', formData);
  }

  /**
   * Get provider dashboard overview
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard() {
    return await this.client.get('/api/providers/dashboard/overview');
  }

  /**
   * Get provider analytics
   * @param {Object} [options] - Analytics options
   * @param {string} [options.timeframe] - Timeframe (7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(options = {}) {
    return await this.client.get('/api/providers/analytics/performance', options);
  }

  /**
   * Get real-time provider metrics (today + this week performance)
   * @returns {Promise<Object>} Real-time metrics
   */
  async getMetrics() {
    return await this.client.get('/api/providers/dashboard/metrics');
  }

  /**
   * Get provider activity feed
   * @param {Object} [options] - Pagination and filter options
   * @param {number} [options.page] - Page number
   * @param {number} [options.limit] - Items per page
   * @param {string} [options.type] - Activity type (booking, review, payment, message)
   * @returns {Promise<Object>} Activity feed
   */
  async getActivity(options = {}) {
    return await this.client.get('/api/providers/dashboard/activity', options);
  }

  /**
   * Get provider reviews
   * @param {Object} [options] - Filter and pagination options
   * @param {number} [options.page] - Page number
   * @param {number} [options.limit] - Items per page
   * @param {number} [options.rating] - Filter by rating (1-5)
   * @param {string} [options.sortBy] - Sort field (createdAt, rating)
   * @returns {Promise<Object>} Provider reviews
   */
  async getReviews(options = {}) {
    return await this.client.get('/api/providers/reviews', options);
  }

  /**
   * Respond to a review (Provider only)
   * @param {string} reviewId - Review ID
   * @param {Object} data - Response data
   * @param {string} data.responseText - Response text (max 1000 chars)
   * @returns {Promise<Object>} Updated review
   */
  async respondToReview(reviewId, data) {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }
    if (!data || !data.responseText) {
      throw new Error('Response text is required');
    }
    return await this.client.post(`/api/providers/reviews/${reviewId}/respond`, data);
  }
}

module.exports = ProvidersAPI;
