/**
 * TrustVerificationAPI — manage identity, business, and professional verification
 * requests. Includes document upload, admin review, and trust-score statistics.
 *
 * All routes except `getVerifiedUsers` require a valid Bearer token.
 * Write routes are protected by `trustVerificationLimiter` (30 req / min).
 *
 * @example
 * const client = new LocalPro({ apiKey, apiSecret });
 *
 * // Submit a new identity verification request
 * const req = await client.trustVerification.createRequest({
 *   type: 'identity',
 *   documents: [{ type: 'government_id', url: '...', publicId: '...' }],
 *   personalInfo: { firstName: 'Jane', lastName: 'Doe' }
 * });
 *
 * // Admin: approve the request
 * await client.trustVerification.reviewRequest(req.data._id, {
 *   status: 'approved',
 *   trustScore: 85
 * });
 */
class TrustVerificationAPI {
  constructor(client) {
    this.client = client;
  }

  // ─── Public ────────────────────────────────────────────────────────────────

  /**
   * Get a paginated list of verified users (public — no auth required).
   *
   * @param {Object} [params={}]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {number} [params.minTrustScore] - Filter by minimum trust score.
   * @returns {Promise<Object>} Paginated list of verified users.
   */
  async getVerifiedUsers(params = {}) {
    return this.client.get('/api/trust-verification/verified-users', { params });
  }

  // ─── Listing & My Requests ──────────────────────────────────────────────────

  /**
   * Get all verification requests (admin/moderator view).
   *
   * @param {Object} [params={}]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.status] - Filter: pending | under_review | approved | rejected | expired.
   * @param {string} [params.type]   - Filter: identity | business | address | bank_account | insurance | certification.
   * @returns {Promise<Object>} Paginated verification requests.
   * @throws {LocalProRateLimitError} If trustVerificationLimiter threshold is exceeded.
   */
  async getRequests(params = {}) {
    return this.client.get('/api/trust-verification/requests', { params });
  }

  /**
   * Get the authenticated user's own verification requests.
   *
   * @param {Object} [params={}]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.status]
   * @param {string} [params.type]
   * @returns {Promise<Object>} Paginated list of the user's requests.
   */
  async getMyRequests(params = {}) {
    return this.client.get('/api/trust-verification/my-requests', { params });
  }

  // ─── Single Request CRUD ────────────────────────────────────────────────────

  /**
   * Get a single verification request by ID.
   *
   * @param {string} id - VerificationRequest ObjectId.
   * @returns {Promise<Object>} Request details with populated user and reviewer.
   * @throws {Error} If `id` is missing.
   */
  async getRequestById(id) {
    if (!id) throw new Error('TrustVerificationAPI.getRequestById: id is required');
    return this.client.get(`/api/trust-verification/requests/${id}`);
  }

  /**
   * Submit a new verification request.
   *
   * @param {Object} data
   * @param {string} data.type        - identity | business | address | bank_account | insurance | certification.
   * @param {Array}  data.documents   - At least one document object required.
   * @param {Object} [data.personalInfo]
   * @param {Object} [data.businessInfo]
   * @param {string} [data.additionalInfo]
   * @returns {Promise<Object>} Created VerificationRequest.
   * @throws {Error} If `type` or `documents` are missing.
   */
  async createRequest(data) {
    if (!data || !data.type) throw new Error('TrustVerificationAPI.createRequest: data.type is required');
    if (!data.documents || data.documents.length === 0) throw new Error('TrustVerificationAPI.createRequest: data.documents must have at least one entry');
    return this.client.post('/api/trust-verification/requests', data);
  }

  /**
   * Update a pending verification request (owner only).
   *
   * @param {string} id   - VerificationRequest ObjectId.
   * @param {Object} data - Fields to update: documents, additionalInfo, personalInfo.
   * @returns {Promise<Object>} Updated request.
   * @throws {Error} If `id` or `data` is missing.
   */
  async updateRequest(id, data) {
    if (!id) throw new Error('TrustVerificationAPI.updateRequest: id is required');
    if (!data || Object.keys(data).length === 0) throw new Error('TrustVerificationAPI.updateRequest: data is required');
    return this.client.put(`/api/trust-verification/requests/${id}`, data);
  }

  /**
   * Delete a verification request (owner or admin).
   *
   * @param {string} id - VerificationRequest ObjectId.
   * @returns {Promise<Object>} Confirmation message.
   * @throws {Error} If `id` is missing.
   */
  async deleteRequest(id) {
    if (!id) throw new Error('TrustVerificationAPI.deleteRequest: id is required');
    return this.client.delete(`/api/trust-verification/requests/${id}`);
  }

  // ─── Documents ──────────────────────────────────────────────────────────────

  /**
   * Upload documents to an existing verification request (owner only).
   * `formData` should be a multipart FormData object containing the file(s).
   *
   * @param {string} id       - VerificationRequest ObjectId.
   * @param {FormData} formData - Multipart form data with attached files.
   * @returns {Promise<Object>} Array of successfully uploaded document records.
   * @throws {Error} If `id` or `formData` is missing.
   */
  async uploadDocuments(id, formData) {
    if (!id) throw new Error('TrustVerificationAPI.uploadDocuments: id is required');
    if (!formData) throw new Error('TrustVerificationAPI.uploadDocuments: formData is required');
    return this.client.post(`/api/trust-verification/requests/${id}/documents`, formData);
  }

  /**
   * Delete a specific document from a verification request (owner only, pending status).
   *
   * @param {string} id         - VerificationRequest ObjectId.
   * @param {string} documentId - Subdocument ObjectId within request.documents.
   * @returns {Promise<Object>} Confirmation message.
   * @throws {Error} If `id` or `documentId` is missing.
   */
  async deleteDocument(id, documentId) {
    if (!id) throw new Error('TrustVerificationAPI.deleteDocument: id is required');
    if (!documentId) throw new Error('TrustVerificationAPI.deleteDocument: documentId is required');
    return this.client.delete(`/api/trust-verification/requests/${id}/documents/${documentId}`);
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  /**
   * Review (approve / reject / request more info) a verification request (admin only).
   *
   * @param {string} id   - VerificationRequest ObjectId.
   * @param {Object} data
   * @param {string} data.status      - approved | rejected | needs_more_info.
   * @param {string} [data.adminNotes]
   * @param {number} [data.trustScore] - Override trust score (0–100).
   * @returns {Promise<Object>} Updated request.
   * @throws {Error} If `id` or `data.status` is missing.
   */
  async reviewRequest(id, data) {
    if (!id) throw new Error('TrustVerificationAPI.reviewRequest: id is required');
    if (!data || !data.status) throw new Error('TrustVerificationAPI.reviewRequest: data.status is required');
    return this.client.put(`/api/trust-verification/requests/${id}/review`, data);
  }

  /**
   * Get verification statistics (admin only).
   *
   * @param {Object} [params={}]
   * @returns {Promise<Object>} Stats: totalRequests, requestsByStatus, requestsByType, monthlyTrends, averageProcessingTime.
   */
  async getStatistics(params = {}) {
    return this.client.get('/api/trust-verification/statistics', { params });
  }
}

module.exports = TrustVerificationAPI;
