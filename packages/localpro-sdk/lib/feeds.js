// Feeds API module for LocalPro SDK
// Provides methods for interacting with the Feeds endpoints

class FeedsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get personalized feed for current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.contentTypes - Comma-separated list of content types
   * @param {string} params.categories - Comma-separated list of categories
   * @param {string} params.timeframe - Timeframe (1h, 1d, 7d, 30d, 90d, all)
   * @param {string} params.sortBy - Sort option (relevance, recent, trending, popular)
   * @param {boolean} params.includeRealtime - Include realtime content
   * @returns {Promise} Feed items with pagination
   */
  getFeed(params) {
    return this.client.get('/feeds', { params });
  }

  /**
   * Get trending feed items
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Maximum items to return
   * @param {string} params.timeframe - Timeframe (1h, 24h, 7d)
   * @returns {Promise} Trending items
   */
  getTrending(params) {
    return this.client.get('/feeds/trending', { params });
  }

  /**
   * Get featured feed items
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Maximum items to return
   * @returns {Promise} Featured items
   */
  getFeatured(params) {
    return this.client.get('/feeds/featured', { params });
  }

  /**
   * Get user's own feed items
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @returns {Promise} User's feed items
   */
  getMyFeed(params) {
    return this.client.get('/feeds/my', { params });
  }

  /**
   * Get feed analytics for current user
   * @param {Object} params - Query parameters
   * @param {string} params.timeframe - Timeframe (7d, 30d, 90d)
   * @returns {Promise} Feed analytics
   */
  getAnalytics(params) {
    return this.client.get('/feeds/analytics', { params });
  }

  /**
   * Get feed items by content type
   * @param {string} contentType - Content type (activity, job, service, course, etc.)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.timeframe - Timeframe
   * @param {string} params.sortBy - Sort option
   * @returns {Promise} Feed items of specified type
   */
  getByType(contentType, params) {
    return this.client.get(`/feeds/by-type/${contentType}`, { params });
  }

  /**
   * Get single feed item by ID
   * @param {string} id - Feed item ID
   * @returns {Promise} Feed item details
   */
  getFeedItem(id) {
    return this.client.get(`/feeds/${id}`);
  }

  /**
   * Create a new feed item
   * @param {Object} data - Feed item data
   * @param {string} data.contentType - Content type
   * @param {string} data.contentId - Content ID
   * @param {string} data.title - Feed item title
   * @param {string} data.description - Feed item description
   * @param {string} data.summary - Feed item summary
   * @param {string} data.category - Category
   * @param {Object} data.media - Media object
   * @param {Array} data.images - Images array
   * @param {string} data.visibility - Visibility level
   * @param {Object} data.targetAudience - Target audience settings
   * @param {number} data.priority - Priority (0-100)
   * @param {boolean} data.isFeatured - Featured flag
   * @param {Object} data.cta - Call to action
   * @param {Object} data.metadata - Additional metadata
   * @returns {Promise} Created feed item
   */
  create(data) {
    return this.client.post('/feeds', data);
  }

  /**
   * Update feed item
   * @param {string} id - Feed item ID
   * @param {Object} data - Updated data
   * @returns {Promise} Updated feed item
   */
  update(id, data) {
    return this.client.put(`/feeds/${id}`, data);
  }

  /**
   * Delete feed item (soft delete)
   * @param {string} id - Feed item ID
   * @returns {Promise} Deletion confirmation
   */
  delete(id) {
    return this.client.delete(`/feeds/${id}`);
  }

  /**
   * Add interaction to feed item
   * @param {string} id - Feed item ID
   * @param {Object} data - Interaction data
   * @param {string} data.type - Interaction type (like, share, comment, bookmark, click)
   * @returns {Promise} Interaction result
   */
  addInteraction(id, data) {
    return this.client.post(`/feeds/${id}/interactions`, data);
  }

  /**
   * Remove interaction from feed item
   * @param {string} id - Feed item ID
   * @param {Object} data - Interaction data
   * @param {string} data.type - Interaction type to remove
   * @returns {Promise} Interaction removal result
   */
  removeInteraction(id, data) {
    return this.client.delete(`/feeds/${id}/interactions`, { data });
  }

  /**
   * Promote feed item (Admin only)
   * @param {string} id - Feed item ID
   * @param {Object} data - Promotion data
   * @param {number} data.budget - Promotion budget
   * @param {string} data.startDate - Start date
   * @param {string} data.endDate - End date
   * @param {Object} data.targetAudience - Target audience settings
   * @returns {Promise} Promoted feed item
   */
  promote(id, data) {
    return this.client.post(`/feeds/${id}/promote`, data);
  }

  // Convenience methods

  /**
   * Like a feed item
   * @param {string} id - Feed item ID
   * @returns {Promise} Like result
   */
  like(id) {
    return this.addInteraction(id, { type: 'like' });
  }

  /**
   * Unlike a feed item
   * @param {string} id - Feed item ID
   * @returns {Promise} Unlike result
   */
  unlike(id) {
    return this.removeInteraction(id, { type: 'like' });
  }

  /**
   * Share a feed item
   * @param {string} id - Feed item ID
   * @returns {Promise} Share result
   */
  share(id) {
    return this.addInteraction(id, { type: 'share' });
  }

  /**
   * Bookmark a feed item
   * @param {string} id - Feed item ID
   * @returns {Promise} Bookmark result
   */
  bookmark(id) {
    return this.addInteraction(id, { type: 'bookmark' });
  }

  /**
   * Remove bookmark from a feed item
   * @param {string} id - Feed item ID
   * @returns {Promise} Remove bookmark result
   */
  removeBookmark(id) {
    return this.removeInteraction(id, { type: 'bookmark' });
  }

  /**
   * Track click on a feed item
   * @param {string} id - Feed item ID
   * @returns {Promise} Click tracking result
   */
  trackClick(id) {
    return this.addInteraction(id, { type: 'click' });
  }

  /**
   * Get jobs feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Jobs feed items
   */
  getJobs(params) {
    return this.getByType('job', params);
  }

  /**
   * Get courses feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Courses feed items
   */
  getCourses(params) {
    return this.getByType('course', params);
  }

  /**
   * Get services feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Services feed items
   */
  getServices(params) {
    return this.getByType('service', params);
  }

  /**
   * Get promos feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Promos feed items
   */
  getPromos(params) {
    return this.getByType('promo', params);
  }

  /**
   * Get ads feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Ads feed items
   */
  getAds(params) {
    return this.getByType('ad', params);
  }

  /**
   * Get agencies feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Agencies feed items
   */
  getAgencies(params) {
    return this.getByType('agency', params);
  }

  /**
   * Get supplies feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Supplies feed items
   */
  getSupplies(params) {
    return this.getByType('supply', params);
  }

  /**
   * Get rentals feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Rentals feed items
   */
  getRentals(params) {
    return this.getByType('rental', params);
  }

  /**
   * Get rewards feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Rewards feed items
   */
  getRewards(params) {
    return this.getByType('reward', params);
  }

  /**
   * Get activities feed
   * @param {Object} params - Query parameters
   * @returns {Promise} Activities feed items
   */
  getActivities(params) {
    return this.getByType('activity', params);
  }
}

module.exports = FeedsAPI;
