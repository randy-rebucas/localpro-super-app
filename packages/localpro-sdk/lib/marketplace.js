/**
 * Marketplace API methods for LocalPro SDK
 */
class MarketplaceAPI {
  constructor(client) {
    this.client = client;
  }

  // ==================== Services ====================

  /**
   * Get list of services
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.search] - Search term
   * @param {number} [filters.minPrice] - Minimum price
   * @param {number} [filters.maxPrice] - Maximum price
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Paginated list of services
   */
  async getServices(filters = {}) {
    return await this.client.get('/api/marketplace/services', filters);
  }

  /**
   * Get service by ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object>} Service details
   */
  async getService(serviceId) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.get(`/api/marketplace/services/${serviceId}`);
  }

  /**
   * Get nearby services
   * @param {Object} locationData - Location data
   * @param {number} locationData.latitude - Latitude
   * @param {number} locationData.longitude - Longitude
   * @param {number} [locationData.radius] - Search radius in km
   * @param {number} [locationData.page] - Page number
   * @param {number} [locationData.limit] - Items per page
   * @returns {Promise<Object>} List of nearby services
   */
  async getNearbyServices(locationData) {
    if (!locationData.latitude || !locationData.longitude) {
      throw new Error('Latitude and longitude are required');
    }

    return await this.client.get('/api/marketplace/services/nearby', locationData);
  }

  /**
   * Create a new service (Provider only)
   * @param {Object} serviceData - Service data
   * @param {string} serviceData.title - Service title
   * @param {string} serviceData.category - Category ID or key
   * @param {number} serviceData.price - Service price
   * @param {string} [serviceData.description] - Service description
   * @returns {Promise<Object>} Created service
   */
  async createService(serviceData) {
    if (!serviceData.title || !serviceData.category || !serviceData.price) {
      throw new Error('Title, category, and price are required');
    }

    return await this.client.post('/api/marketplace/services', serviceData);
  }

  /**
   * Update service (Provider only)
   * @param {string} serviceId - Service ID
   * @param {Object} serviceData - Service data to update
   * @returns {Promise<Object>} Updated service
   */
  async updateService(serviceId, serviceData) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.put(`/api/marketplace/services/${serviceId}`, serviceData);
  }

  /**
   * Delete service (Provider only)
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteService(serviceId) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.delete(`/api/marketplace/services/${serviceId}`);
  }

  /**
   * Activate service (Provider only)
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object>} Updated service
   */
  async activateService(serviceId) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.patch(`/api/marketplace/services/${serviceId}/activate`);
  }

  /**
   * Deactivate service (Provider only)
   * @param {string} serviceId - Service ID
   * @returns {Promise<Object>} Updated service
   */
  async deactivateService(serviceId) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.patch(`/api/marketplace/services/${serviceId}/deactivate`);
  }

  /**
   * Upload service images (Provider only)
   * @param {string} serviceId - Service ID
   * @param {FormData|Object} formData - Form data with images
   * @returns {Promise<Object>} Upload result
   */
  async uploadServiceImages(serviceId, formData) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.upload(`/api/marketplace/services/${serviceId}/images`, formData);
  }

  /**
   * Get my services (Provider only)
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status (active, inactive, pending)
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my services
   */
  async getMyServices(filters = {}) {
    return await this.client.get('/api/marketplace/my-services', filters);
  }

  /**
   * Get providers for a service
   * @param {string} serviceId - Service ID
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of providers
   */
  async getProvidersForService(serviceId, filters = {}) {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    return await this.client.get(`/api/marketplace/services/${serviceId}/providers`, filters);
  }

  /**
   * Get services by provider
   * @param {string} providerId - Provider ID
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of provider services
   */
  async getProviderServices(providerId, filters = {}) {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    return await this.client.get(`/api/marketplace/providers/${providerId}/services`, filters);
  }

  /**
   * Get provider details
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Provider details
   */
  async getProviderDetails(providerId) {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    return await this.client.get(`/api/marketplace/providers/${providerId}`);
  }

  // ==================== Service Categories ====================

  /**
   * Get service categories
   * @returns {Promise<Object>} List of service categories
   */
  async getCategories() {
    return await this.client.get('/api/marketplace/services/categories');
  }

  /**
   * Get category details
   * @param {string} category - Category ID or key
   * @returns {Promise<Object>} Category details
   */
  async getCategoryDetails(category) {
    if (!category) {
      throw new Error('Category is required');
    }

    return await this.client.get(`/api/marketplace/services/categories/${category}`);
  }

  // ==================== Bookings ====================

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @param {string} bookingData.serviceId - Service ID
   * @param {string} bookingData.providerId - Provider ID
   * @param {string} bookingData.scheduledDate - Scheduled date (ISO string)
   * @param {Object} [bookingData.address] - Service address
   * @param {string} [bookingData.notes] - Booking notes
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingData) {
    if (!bookingData.serviceId || !bookingData.providerId || !bookingData.scheduledDate) {
      throw new Error('Service ID, provider ID, and scheduled date are required');
    }

    return await this.client.post('/api/marketplace/bookings', bookingData);
  }

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Booking details
   */
  async getBooking(bookingId) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    return await this.client.get(`/api/marketplace/bookings/${bookingId}`);
  }

  /**
   * Get user's bookings
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status (pending, confirmed, completed, cancelled)
   * @param {string} [filters.role] - Filter by role (client, provider)
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of bookings
   */
  async getBookings(filters = {}) {
    return await this.client.get('/api/marketplace/bookings', filters);
  }

  /**
   * Get my bookings
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.role] - Filter by role (client, provider)
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my bookings
   */
  async getMyBookings(filters = {}) {
    return await this.client.get('/api/marketplace/my-bookings', filters);
  }

  /**
   * Update booking status
   * @param {string} bookingId - Booking ID
   * @param {Object} statusData - Status data
   * @param {string} statusData.status - New status (pending, confirmed, completed, cancelled)
   * @returns {Promise<Object>} Updated booking
   */
  async updateBookingStatus(bookingId, statusData) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    if (!statusData.status) {
      throw new Error('Status is required');
    }

    return await this.client.put(`/api/marketplace/bookings/${bookingId}/status`, statusData);
  }

  /**
   * Upload booking photos
   * @param {string} bookingId - Booking ID
   * @param {FormData|Object} formData - Form data with photos
   * @returns {Promise<Object>} Upload result
   */
  async uploadBookingPhotos(bookingId, formData) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    return await this.client.upload(`/api/marketplace/bookings/${bookingId}/photos`, formData);
  }

  /**
   * Add review to booking
   * @param {string} bookingId - Booking ID
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {FormData|Object} [formData] - Optional form data with photos
   * @returns {Promise<Object>} Created review
   */
  async addReview(bookingId, reviewData, formData = null) {
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    if (!reviewData.rating || !reviewData.comment) {
      throw new Error('Rating and comment are required');
    }

    if (formData) {
      return await this.client.upload(`/api/marketplace/bookings/${bookingId}/review`, formData);
    }

    return await this.client.post(`/api/marketplace/bookings/${bookingId}/review`, reviewData);
  }

  // ==================== PayPal Integration ====================

  /**
   * Approve PayPal booking
   * @param {Object} approvalData - Approval data
   * @param {string} approvalData.orderID - PayPal order ID
   * @param {string} approvalData.bookingId - Booking ID
   * @returns {Promise<Object>} Approval result
   */
  async approvePayPalBooking(approvalData) {
    if (!approvalData.orderID || !approvalData.bookingId) {
      throw new Error('Order ID and booking ID are required');
    }

    return await this.client.post('/api/marketplace/bookings/paypal/approve', approvalData);
  }

  /**
   * Get PayPal order details
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Order details
   */
  async getPayPalOrderDetails(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    return await this.client.get(`/api/marketplace/bookings/paypal/order/${orderId}`);
  }
}

module.exports = MarketplaceAPI;
