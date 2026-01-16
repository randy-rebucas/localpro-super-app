/**
 * Search API methods for LocalPro SDK
 */
class SearchAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Global search across all entities
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.q - Search query (required, min 2 characters)
   * @param {string} [searchParams.type] - Filter by entity type (users, jobs, services, supplies, courses, rentals, agencies)
   * @param {string} [searchParams.category] - Filter by category
   * @param {string} [searchParams.location] - Filter by location/city
   * @param {number} [searchParams.minPrice] - Minimum price filter
   * @param {number} [searchParams.maxPrice] - Maximum price filter
   * @param {number} [searchParams.rating] - Minimum rating filter
   * @param {number} [searchParams.page] - Page number
   * @param {number} [searchParams.limit] - Items per page (default: 20, max: 100)
   * @param {string} [searchParams.sortBy] - Sort field (relevance, rating, price_low, price_high, newest)
   * @param {string} [searchParams.sortOrder] - Sort order (asc, desc)
   * @returns {Promise<Object>} Search results
   */
  async search(searchParams) {
    if (!searchParams.q || searchParams.q.length < 2) {
      throw new Error('Search query is required and must be at least 2 characters');
    }

    return await this.client.get('/api/search', searchParams);
  }

  /**
   * Get search suggestions/autocomplete
   * @param {Object} suggestionParams - Suggestion parameters
   * @param {string} suggestionParams.q - Search query (required, min 2 characters)
   * @param {number} [suggestionParams.limit] - Maximum number of suggestions (default: 10, max: 20)
   * @returns {Promise<Object>} Search suggestions
   */
  async getSuggestions(suggestionParams) {
    if (!suggestionParams.q || suggestionParams.q.length < 2) {
      throw new Error('Search query is required and must be at least 2 characters');
    }

    return await this.client.get('/api/search/suggestions', suggestionParams);
  }

  /**
   * Get popular search terms
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.limit] - Number of popular terms (default: 12, max: 50)
   * @returns {Promise<Object>} Popular searches
   */
  async getPopular(filters = {}) {
    return await this.client.get('/api/search/popular', filters);
  }

  /**
   * Advanced search with more filters
   * @param {Object} searchParams - Advanced search parameters
   * @param {string} searchParams.q - Search query (required)
   * @param {string} [searchParams.type] - Entity type filter
   * @param {string} [searchParams.dateFrom] - Filter results from this date
   * @param {string} [searchParams.dateTo] - Filter results to this date
   * @param {boolean} [searchParams.verified] - Filter for verified providers only
   * @param {string} [searchParams.availability] - Filter by availability (available, unavailable)
   * @param {string} [searchParams.serviceType] - Filter by service type
   * @param {string} [searchParams.experienceLevel] - Filter by experience level
   * @param {string} [searchParams.jobType] - Filter by job type
   * @param {boolean} [searchParams.isRemote] - Filter for remote work
   * @param {number} [searchParams.page] - Page number
   * @param {number} [searchParams.limit] - Items per page
   * @returns {Promise<Object>} Advanced search results
   */
  async advancedSearch(searchParams) {
    if (!searchParams.q || searchParams.q.length < 2) {
      throw new Error('Search query is required and must be at least 2 characters');
    }

    return await this.client.get('/api/search/advanced', searchParams);
  }

  /**
   * Search within a specific entity type
   * @param {string} entityType - Entity type (users, jobs, services, supplies, courses, rentals, agencies)
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.q - Search query (required)
   * @param {string} [searchParams.category] - Filter by category
   * @param {string} [searchParams.location] - Filter by location
   * @param {number} [searchParams.page] - Page number
   * @param {number} [searchParams.limit] - Items per page
   * @returns {Promise<Object>} Search results for specific entity type
   */
  async searchByType(entityType, searchParams) {
    if (!entityType) {
      throw new Error('Entity type is required');
    }

    if (!searchParams.q || searchParams.q.length < 2) {
      throw new Error('Search query is required and must be at least 2 characters');
    }

    return await this.client.get(`/api/search/entities/${entityType}`, searchParams);
  }

  /**
   * Get all available search categories
   * @returns {Promise<Object>} Search categories by entity type
   */
  async getCategories() {
    return await this.client.get('/api/search/categories');
  }

  /**
   * Get popular search locations
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.q] - Filter locations by query
   * @param {number} [filters.limit] - Number of locations
   * @returns {Promise<Object>} Popular locations
   */
  async getLocations(filters = {}) {
    return await this.client.get('/api/search/locations', filters);
  }

  /**
   * Get trending search terms
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.period] - Time period (today, week, month, default: week)
   * @param {number} [filters.limit] - Number of trending terms
   * @returns {Promise<Object>} Trending searches
   */
  async getTrending(filters = {}) {
    return await this.client.get('/api/search/trending', filters);
  }

  /**
   * Track search analytics (Admin only)
   * @param {Object} analyticsData - Analytics data
   * @param {string} analyticsData.query - Search query
   * @param {number} [analyticsData.results] - Number of results
   * @param {Object} [analyticsData.filters] - Applied filters
   * @param {string} [analyticsData.userId] - User ID
   * @param {string} [analyticsData.timestamp] - Timestamp
   * @returns {Promise<Object>} Analytics tracking result
   */
  async trackAnalytics(analyticsData) {
    if (!analyticsData.query) {
      throw new Error('Query is required');
    }

    return await this.client.post('/api/search/analytics', analyticsData);
  }
}

module.exports = SearchAPI;
