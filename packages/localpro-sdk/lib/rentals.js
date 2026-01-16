/**
 * Rentals API methods for LocalPro SDK
 */
class RentalsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get list of rental items
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.search] - Search term
   * @param {number} [filters.minPrice] - Minimum price
   * @param {number} [filters.maxPrice] - Maximum price
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Paginated list of rentals
   */
  async list(filters = {}) {
    return await this.client.get('/api/rentals', filters);
  }

  /**
   * Get rental item by ID
   * @param {string} rentalId - Rental ID
   * @returns {Promise<Object>} Rental details
   */
  async getById(rentalId) {
    if (!rentalId) {
      throw new Error('Rental ID is required');
    }

    return await this.client.get(`/api/rentals/${rentalId}`);
  }

  /**
   * Get rental categories
   * @returns {Promise<Object>} List of categories
   */
  async getCategories() {
    return await this.client.get('/api/rentals/categories');
  }

  /**
   * Get featured rental items
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.limit] - Number of items
   * @returns {Promise<Object>} Featured rentals
   */
  async getFeatured(filters = {}) {
    return await this.client.get('/api/rentals/featured', filters);
  }

  /**
   * Get nearby rental items
   * @param {Object} locationData - Location data
   * @param {number} locationData.lat - Latitude
   * @param {number} locationData.lng - Longitude
   * @param {number} [locationData.radius] - Search radius in km
   * @param {number} [locationData.page] - Page number
   * @param {number} [locationData.limit] - Items per page
   * @returns {Promise<Object>} List of nearby rentals
   */
  async getNearby(locationData) {
    if (!locationData.lat || !locationData.lng) {
      throw new Error('Latitude and longitude are required');
    }

    return await this.client.get('/api/rentals/nearby', locationData);
  }

  /**
   * Create a new rental item (Provider/Admin only)
   * @param {Object} rentalData - Rental data
   * @param {string} rentalData.name - Rental item name
   * @param {number} rentalData.price - Rental price
   * @param {string} [rentalData.description] - Rental description
   * @param {string} [rentalData.category] - Rental category
   * @returns {Promise<Object>} Created rental
   */
  async create(rentalData) {
    if (!rentalData.name || !rentalData.price) {
      throw new Error('Name and price are required');
    }

    return await this.client.post('/api/rentals', rentalData);
  }

  /**
   * Update rental item (Provider/Admin only)
   * @param {string} rentalId - Rental ID
   * @param {Object} rentalData - Rental data to update
   * @returns {Promise<Object>} Updated rental
   */
  async update(rentalId, rentalData) {
    if (!rentalId) {
      throw new Error('Rental ID is required');
    }

    return await this.client.put(`/api/rentals/${rentalId}`, rentalData);
  }

  /**
   * Delete rental item (Provider/Admin only)
   * @param {string} rentalId - Rental ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(rentalId) {
    if (!rentalId) {
      throw new Error('Rental ID is required');
    }

    return await this.client.delete(`/api/rentals/${rentalId}`);
  }

  /**
   * Upload rental images (Provider/Admin only)
   * @param {string} rentalId - Rental ID
   * @param {FormData|Object} formData - Form data with images
   * @returns {Promise<Object>} Upload result
   */
  async uploadImages(rentalId, formData) {
    if (!rentalId) {
      throw new Error('Rental ID is required');
    }

    return await this.client.upload(`/api/rentals/${rentalId}/images`, formData);
  }

  /**
   * Delete rental image (Provider/Admin only)
   * @param {string} rentalId - Rental ID
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(rentalId, imageId) {
    if (!rentalId || !imageId) {
      throw new Error('Rental ID and image ID are required');
    }

    return await this.client.delete(`/api/rentals/${rentalId}/images/${imageId}`);
  }

  /**
   * Book rental item
   * @param {string} rentalId - Rental ID
   * @param {Object} bookingData - Booking data
   * @param {string} bookingData.startDate - Start date (ISO string)
   * @param {string} bookingData.endDate - End date (ISO string)
   * @param {Object} [bookingData.deliveryAddress] - Delivery address
   * @returns {Promise<Object>} Created booking
   */
  async book(rentalId, bookingData) {
    if (!rentalId) {
      throw new Error('Rental ID is required');
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      throw new Error('Start date and end date are required');
    }

    return await this.client.post(`/api/rentals/${rentalId}/book`, bookingData);
  }

  /**
   * Update rental booking status
   * @param {string} rentalId - Rental ID
   * @param {string} bookingId - Booking ID
   * @param {Object} statusData - Status data
   * @param {string} statusData.status - New status (pending, confirmed, completed, cancelled)
   * @returns {Promise<Object>} Updated booking
   */
  async updateBookingStatus(rentalId, bookingId, statusData) {
    if (!rentalId || !bookingId) {
      throw new Error('Rental ID and booking ID are required');
    }

    if (!statusData.status) {
      throw new Error('Status is required');
    }

    return await this.client.put(
      `/api/rentals/${rentalId}/bookings/${bookingId}/status`,
      statusData
    );
  }

  /**
   * Add review to rental
   * @param {string} rentalId - Rental ID
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @returns {Promise<Object>} Created review
   */
  async addReview(rentalId, reviewData) {
    if (!rentalId) {
      throw new Error('Rental ID is required');
    }

    if (!reviewData.rating || !reviewData.comment) {
      throw new Error('Rating and comment are required');
    }

    return await this.client.post(`/api/rentals/${rentalId}/reviews`, reviewData);
  }

  /**
   * Get my rental items (Owner only)
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my rentals
   */
  async getMyRentals(filters = {}) {
    return await this.client.get('/api/rentals/my-rentals', filters);
  }

  /**
   * Get my rental bookings
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my bookings
   */
  async getMyBookings(filters = {}) {
    return await this.client.get('/api/rentals/my-bookings', filters);
  }

  /**
   * Generate rental description using AI (Provider/Admin only)
   * @param {Object} descriptionData - Description data
   * @param {string} descriptionData.name - Rental item name
   * @param {string} [descriptionData.category] - Rental category
   * @returns {Promise<Object>} Generated description
   */
  async generateDescription(descriptionData) {
    if (!descriptionData.name) {
      throw new Error('Rental name is required');
    }

    return await this.client.post('/api/rentals/generate-description', descriptionData);
  }
}

module.exports = RentalsAPI;
