/**
 * @classdesc Provides access to LocalPro Partners API endpoints.
 * Covers public partner onboarding flow (start, business info, document upload,
 * verification, API setup, activation), authenticated admin partner management
 * (create, list, update, delete, notes), and partner analytics.
 *
 * @example
 * const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });
 *
 * // Public onboarding
 * const { data } = await sdk.partners.startOnboarding({ name: 'Acme Corp', email: 'acme@example.com', phoneNumber: '+639001234567' });
 * await sdk.partners.updateBusinessInfo(data.partner.id, { businessInfo: { companyName: 'Acme Corp', industry: 'Tech' } });
 * await sdk.partners.activate(data.partner.id);
 *
 * // Admin
 * const partners = await sdk.partners.list({ status: 'active' });
 * await sdk.partners.addNote('<partnerId>', { content: 'Follow up next week.' });
 * const analytics = await sdk.partners.getAnalytics('<partnerId>');
 */
class PartnersAPI {
  constructor(client) {
    this.client = client;
  }

  // ─── Public onboarding ────────────────────────────────────────────────────

  /**
   * Start partner onboarding (public)
   * @param {Object} data - Onboarding data
   * @param {string} data.name - Partner name
   * @param {string} data.email - Email address
   * @param {string} data.phoneNumber - Phone number (E.164 format)
   * @returns {Promise<Object>} Created partner with onboarding state
   */
  async startOnboarding(data) {
    if (!data || !data.name || !data.email || !data.phoneNumber) {
      throw new Error('name, email, and phoneNumber are required');
    }
    return await this.client.post('/api/partners/onboarding/start', data);
  }

  /**
   * Update business info during onboarding (public)
   * @param {string} partnerId - Partner ID
   * @param {Object} data - Business info payload
   * @param {Object} data.businessInfo - Business info object
   * @returns {Promise<Object>} Updated partner
   */
  async updateBusinessInfo(partnerId, data) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.put(`/api/partners/${partnerId}/business-info`, data);
  }

  /**
   * Upload a verification document (public)
   * @param {string} partnerId - Partner ID
   * @param {FormData} formData - Form data with a single 'document' file
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocument(partnerId, formData) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.upload(`/api/partners/${partnerId}/upload-documents`, formData);
  }

  /**
   * Attach a document to verification with a document type (public)
   * @param {string} partnerId - Partner ID
   * @param {string} documentType - Document type (e.g. 'business_permit')
   * @param {FormData} formData - Form data with a single 'document' file
   * @returns {Promise<Object>} Updated verification state
   */
  async attachDocument(partnerId, documentType, formData) {
    if (!partnerId || !documentType) {
      throw new Error('Partner ID and document type are required');
    }
    return await this.client.upload(`/api/partners/${partnerId}/attach-document/${documentType}`, formData);
  }

  /**
   * Delete an attached verification document (public)
   * @param {string} partnerId - Partner ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Updated verification state
   */
  async deleteDocument(partnerId, documentId) {
    if (!partnerId || !documentId) {
      throw new Error('Partner ID and document ID are required');
    }
    return await this.client.delete(`/api/partners/${partnerId}/delete-attach-document/${documentId}`);
  }

  /**
   * Complete verification step during onboarding (public)
   * @param {string} partnerId - Partner ID
   * @param {Object} [data] - Verification data
   * @returns {Promise<Object>} Updated partner
   */
  async completeVerification(partnerId, data = {}) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.put(`/api/partners/${partnerId}/verification`, data);
  }

  /**
   * Complete API setup step during onboarding (public)
   * @param {string} partnerId - Partner ID
   * @param {Object} [data] - API setup data
   * @param {string} [data.webhookUrl] - Webhook URL
   * @param {string} [data.callbackUrl] - Callback URL
   * @returns {Promise<Object>} Updated partner with API credentials
   */
  async completeApiSetup(partnerId, data = {}) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.put(`/api/partners/${partnerId}/api-setup`, data);
  }

  /**
   * Activate partner after completing all onboarding steps (public)
   * @param {string} partnerId - Partner ID
   * @returns {Promise<Object>} Activated partner with API key
   */
  async activate(partnerId) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.put(`/api/partners/${partnerId}/activate`);
  }

  // ─── Public lookups ───────────────────────────────────────────────────────

  /**
   * Get partner by slug (public — active partners only)
   * @param {string} slug - Partner slug
   * @returns {Promise<Object>} Partner details
   */
  async getBySlug(slug) {
    if (!slug) {
      throw new Error('Slug is required');
    }
    return await this.client.get(`/api/partners/slug/${slug}`);
  }

  // ─── Authenticated ────────────────────────────────────────────────────────

  /**
   * Get partner by manage ID (auth required)
   * @param {string} manageId - User ID of the managing user
   * @returns {Promise<Object>} Partner details
   */
  async getByManageId(manageId) {
    if (!manageId) {
      throw new Error('Manage ID is required');
    }
    return await this.client.get(`/api/partners/manage/${manageId}`);
  }

  /**
   * Get partner analytics (Admin or managing partner)
   * @param {string} partnerId - Partner ID
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(partnerId) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.get(`/api/partners/${partnerId}/analytics`);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  /**
   * Get all partners (Admin only)
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.search] - Search term
   * @param {boolean} [filters.onboardingCompleted] - Filter by onboarding completion
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Paginated partner list
   */
  async list(filters = {}) {
    return await this.client.get('/api/partners', filters);
  }

  /**
   * Get partner by ID (Admin only)
   * @param {string} partnerId - Partner ID
   * @returns {Promise<Object>} Partner details
   */
  async getById(partnerId) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.get(`/api/partners/${partnerId}`);
  }

  /**
   * Create a new partner (Admin only)
   * @param {Object} data - Partner data
   * @param {string} data.name - Partner name
   * @param {string} data.email - Email address
   * @param {string} data.phoneNumber - Phone number
   * @returns {Promise<Object>} Created partner
   */
  async create(data) {
    if (!data || !data.name || !data.email || !data.phoneNumber) {
      throw new Error('name, email, and phoneNumber are required');
    }
    return await this.client.post('/api/partners', data);
  }

  /**
   * Update partner (Admin/Partner)
   * @param {string} partnerId - Partner ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated partner
   */
  async update(partnerId, data) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.put(`/api/partners/${partnerId}`, data);
  }

  /**
   * Delete partner — soft delete (Admin only)
   * @param {string} partnerId - Partner ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(partnerId) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    return await this.client.delete(`/api/partners/${partnerId}`);
  }

  /**
   * Add a note to a partner (Admin only)
   * @param {string} partnerId - Partner ID
   * @param {Object} data - Note data
   * @param {string} data.content - Note content (1–1000 chars)
   * @returns {Promise<Object>} Result
   */
  async addNote(partnerId, data) {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }
    if (!data || !data.content) {
      throw new Error('Note content is required');
    }
    return await this.client.post(`/api/partners/${partnerId}/notes`, data);
  }
}

module.exports = PartnersAPI;
