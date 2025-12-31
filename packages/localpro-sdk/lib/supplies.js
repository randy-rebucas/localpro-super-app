/**
 * Supplies API methods for LocalPro SDK
 */
class SuppliesAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get list of supplies/products
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.search] - Search term
   * @param {number} [filters.minPrice] - Minimum price
   * @param {number} [filters.maxPrice] - Maximum price
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Paginated list of supplies
   */
  async list(filters = {}) {
    return await this.client.get('/api/supplies', filters);
  }

  /**
   * Get supply by ID
   * @param {string} supplyId - Supply ID
   * @returns {Promise<Object>} Supply details
   */
  async getById(supplyId) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    return await this.client.get(`/api/supplies/${supplyId}`);
  }

  /**
   * Get supply categories
   * @returns {Promise<Object>} List of categories
   */
  async getCategories() {
    return await this.client.get('/api/supplies/categories');
  }

  /**
   * Get featured supplies
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.limit] - Number of items
   * @returns {Promise<Object>} Featured supplies
   */
  async getFeatured(filters = {}) {
    return await this.client.get('/api/supplies/featured', filters);
  }

  /**
   * Get nearby supplies
   * @param {Object} locationData - Location data
   * @param {number} locationData.lat - Latitude
   * @param {number} locationData.lng - Longitude
   * @param {number} [locationData.radius] - Search radius in km
   * @param {number} [locationData.page] - Page number
   * @param {number} [locationData.limit] - Items per page
   * @returns {Promise<Object>} List of nearby supplies
   */
  async getNearby(locationData) {
    if (!locationData.lat || !locationData.lng) {
      throw new Error('Latitude and longitude are required');
    }

    return await this.client.get('/api/supplies/nearby', locationData);
  }

  /**
   * Create a new supply/product (Supplier only)
   * @param {Object} supplyData - Supply data
   * @param {string} supplyData.name - Supply name
   * @param {number} supplyData.price - Supply price
   * @param {string} [supplyData.description] - Supply description
   * @param {string} [supplyData.category] - Supply category
   * @returns {Promise<Object>} Created supply
   */
  async create(supplyData) {
    if (!supplyData.name || !supplyData.price) {
      throw new Error('Name and price are required');
    }

    return await this.client.post('/api/supplies', supplyData);
  }

  /**
   * Update supply (Supplier only)
   * @param {string} supplyId - Supply ID
   * @param {Object} supplyData - Supply data to update
   * @returns {Promise<Object>} Updated supply
   */
  async update(supplyId, supplyData) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    return await this.client.put(`/api/supplies/${supplyId}`, supplyData);
  }

  /**
   * Partially update supply (Supplier only)
   * @param {string} supplyId - Supply ID
   * @param {Object} supplyData - Partial supply data
   * @returns {Promise<Object>} Updated supply
   */
  async patch(supplyId, supplyData) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    return await this.client.patch(`/api/supplies/${supplyId}`, supplyData);
  }

  /**
   * Delete supply (Supplier only)
   * @param {string} supplyId - Supply ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(supplyId) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    return await this.client.delete(`/api/supplies/${supplyId}`);
  }

  /**
   * Upload supply images (Supplier only)
   * @param {string} supplyId - Supply ID
   * @param {FormData|Object} formData - Form data with images
   * @returns {Promise<Object>} Upload result
   */
  async uploadImages(supplyId, formData) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    return await this.client.upload(`/api/supplies/${supplyId}/images`, formData);
  }

  /**
   * Delete supply image (Supplier only)
   * @param {string} supplyId - Supply ID
   * @param {string} imageId - Image ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(supplyId, imageId) {
    if (!supplyId || !imageId) {
      throw new Error('Supply ID and image ID are required');
    }

    return await this.client.delete(`/api/supplies/${supplyId}/images/${imageId}`);
  }

  /**
   * Order supply item
   * @param {string} supplyId - Supply ID
   * @param {Object} orderData - Order data
   * @param {number} orderData.quantity - Order quantity
   * @param {Object} [orderData.shippingAddress] - Shipping address
   * @returns {Promise<Object>} Created order
   */
  async order(supplyId, orderData) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    if (!orderData.quantity) {
      throw new Error('Quantity is required');
    }

    return await this.client.post(`/api/supplies/${supplyId}/order`, orderData);
  }

  /**
   * Update order status
   * @param {string} supplyId - Supply ID
   * @param {string} orderId - Order ID
   * @param {Object} statusData - Status data
   * @param {string} statusData.status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(supplyId, orderId, statusData) {
    if (!supplyId || !orderId) {
      throw new Error('Supply ID and order ID are required');
    }

    if (!statusData.status) {
      throw new Error('Status is required');
    }

    return await this.client.put(
      `/api/supplies/${supplyId}/orders/${orderId}/status`,
      statusData
    );
  }

  /**
   * Add review to supply
   * @param {string} supplyId - Supply ID
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @returns {Promise<Object>} Created review
   */
  async addReview(supplyId, reviewData) {
    if (!supplyId) {
      throw new Error('Supply ID is required');
    }

    if (!reviewData.rating || !reviewData.comment) {
      throw new Error('Rating and comment are required');
    }

    return await this.client.post(`/api/supplies/${supplyId}/reviews`, reviewData);
  }

  /**
   * Get my supplies (Supplier only)
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my supplies
   */
  async getMySupplies(filters = {}) {
    return await this.client.get('/api/supplies/my-supplies', filters);
  }

  /**
   * Get my supply orders
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my orders
   */
  async getMyOrders(filters = {}) {
    return await this.client.get('/api/supplies/my-orders', filters);
  }

  /**
   * Generate supply description using AI (Supplier/Admin only)
   * @param {Object} descriptionData - Description data
   * @param {string} descriptionData.name - Supply name
   * @param {string} [descriptionData.category] - Supply category
   * @returns {Promise<Object>} Generated description
   */
  async generateDescription(descriptionData) {
    if (!descriptionData.name) {
      throw new Error('Supply name is required');
    }

    return await this.client.post('/api/supplies/generate-description', descriptionData);
  }
}

module.exports = SuppliesAPI;
