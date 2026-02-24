/**
 * User Management API — admin/agency operations on user accounts.
 *
 * All write routes are protected by `userManagementLimiter` (60 req / min).
 * Admin-only actions (delete, ban, bulk, resetPassword) require the `admin` role.
 *
 * @example
 * const client = new LocalPro({ apiKey, apiSecret });
 * const { data } = await client.userManagement.list({ role: 'provider', page: 1 });
 */
class UserManagementAPI {
  constructor(client) {
    this.client = client;
  }

  // ─── Listing & Stats ──────────────────────────────────────────────────────

  /**
   * List users with filtering and pagination.
   * @param {Object} [params={}] - Query filters.
   * @param {number} [params.page=1] - Page number.
   * @param {number} [params.limit=10] - Results per page.
   * @param {string} [params.role] - Filter by role (e.g. 'provider', 'client').
   * @param {boolean} [params.isActive] - Filter by active status.
   * @param {boolean} [params.isVerified] - Filter by verified status.
   * @param {string} [params.search] - Search by name, email, or phone.
   * @param {string} [params.sortBy='createdAt'] - Sort field.
   * @param {string} [params.sortOrder='desc'] - Sort direction: 'asc' | 'desc'.
   * @param {boolean} [params.includeDeleted=false] - Include soft-deleted users.
   * @param {string} [params.registrationMethod] - 'partner' | 'direct' | 'admin'.
   * @param {string} [params.partnerId] - Filter by partner ID.
   * @returns {Promise<Object>} Paginated user list with `users` and `pagination`.
   * @throws {LocalProAuthenticationError} If not authenticated.
   */
  async list(params = {}) {
    return this.client.get('/api/users', params);
  }

  /**
   * Get aggregate user statistics.
   * @param {Object} [params={}] - Optional filters (e.g. `agencyId`).
   * @returns {Promise<Object>} `{ totalUsers, activeUsers, verifiedUsers, usersByRole, recentUsers, topRatedUsers }`.
   * @throws {LocalProAuthenticationError} If not authenticated.
   */
  async getStats(params = {}) {
    return this.client.get('/api/users/stats', params);
  }

  // ─── Single User CRUD ─────────────────────────────────────────────────────

  /**
   * Get a single user by ID (includes provider profile if user has provider role).
   * @param {string} id - User ObjectId.
   * @param {Object} [params={}] - Optional: `{ includeDeleted: true }`.
   * @returns {Promise<Object>} Full user object.
   * @throws {LocalProValidationError} If `id` is missing.
   * @throws {LocalProNotFoundError} If user does not exist.
   */
  async getById(id, params = {}) {
    if (!id) throw new Error('id is required');
    return this.client.get(`/api/users/${id}`, params);
  }

  /**
   * Create a new user (Admin / Partner only).
   * @param {Object} data - User fields.
   * @param {string} data.phoneNumber - Required. International format (+63...).
   * @param {string} data.firstName - Required.
   * @param {string} data.lastName - Required.
   * @param {string} [data.email] - Optional.
   * @param {string} [data.gender] - 'male' | 'female' | 'other' | 'prefer_not_to_say'.
   * @param {string} [data.birthdate] - ISO 8601 date string.
   * @param {string} [data.registrationMethod='admin'] - 'partner' | 'direct' | 'admin'.
   * @param {string} [data.partnerId] - Partner ID if registrationMethod is 'partner'.
   * @returns {Promise<Object>} Created user.
   * @throws {LocalProValidationError} If required fields are missing.
   */
  async create(data) {
    if (!data || !data.phoneNumber) throw new Error('phoneNumber is required');
    if (!data.firstName) throw new Error('firstName is required');
    if (!data.lastName) throw new Error('lastName is required');
    return this.client.post('/api/users', data);
  }

  /**
   * Update a user's profile fields.
   * @param {string} id - User ObjectId.
   * @param {Object} data - Fields to update.
   * @returns {Promise<Object>} Updated user.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async update(id, data) {
    if (!id) throw new Error('id is required');
    return this.client.put(`/api/users/${id}`, data);
  }

  /**
   * Soft-delete a user (Admin only).
   * @param {string} id - User ObjectId.
   * @returns {Promise<Object>} Confirmation message.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async delete(id) {
    if (!id) throw new Error('id is required');
    return this.client.delete(`/api/users/${id}`);
  }

  // ─── Status & Verification ────────────────────────────────────────────────

  /**
   * Activate or deactivate a user account.
   * @param {string} id - User ObjectId.
   * @param {Object} data - `{ isActive: boolean, reason?: string }`.
   * @returns {Promise<Object>} `{ isActive }`.
   * @throws {LocalProValidationError} If `id` or `isActive` is missing.
   */
  async updateStatus(id, data) {
    if (!id) throw new Error('id is required');
    if (data.isActive === undefined) throw new Error('isActive is required');
    return this.client.patch(`/api/users/${id}/status`, data);
  }

  /**
   * Update verification flags on a user (phone, email, identity, business, address, bankAccount).
   * @param {string} id - User ObjectId.
   * @param {Object} data - `{ verification: { phoneVerified?, emailVerified?, ... } }`.
   * @returns {Promise<Object>} Updated verification summary and trust score.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async updateVerification(id, data) {
    if (!id) throw new Error('id is required');
    return this.client.patch(`/api/users/${id}/verification`, data);
  }

  // ─── Roles ────────────────────────────────────────────────────────────────

  /**
   * Get the roles assigned to a user.
   * @param {string} id - User ObjectId.
   * @returns {Promise<Object>} `{ userId, roles: string[] }`.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async getRoles(id) {
    if (!id) throw new Error('id is required');
    return this.client.get(`/api/users/${id}/roles`);
  }

  /**
   * Replace all roles for a user (Admin only).
   * Valid roles: client, provider, admin, supplier, instructor, agency_owner, agency_admin, partner, staff.
   * @param {string} id - User ObjectId.
   * @param {Object} data - `{ roles: string[] }`.
   * @returns {Promise<Object>} `{ userId, roles }`.
   * @throws {LocalProValidationError} If `id` or `roles` array is missing.
   */
  async updateRoles(id, data) {
    if (!id) throw new Error('id is required');
    if (!Array.isArray(data && data.roles)) throw new Error('roles array is required');
    return this.client.put(`/api/users/${id}/roles`, data);
  }

  // ─── Badges ───────────────────────────────────────────────────────────────

  /**
   * Get badges for a user.
   * @param {string} id - User ObjectId.
   * @returns {Promise<Object>} `{ userId, badges: Array }`.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async getBadges(id) {
    if (!id) throw new Error('id is required');
    return this.client.get(`/api/users/${id}/badges`);
  }

  /**
   * Add a badge to a user (Admin / Agency Admin only).
   * Valid types: verified_provider, top_rated, fast_response, reliable, expert, newcomer, trusted.
   * @param {string} id - User ObjectId.
   * @param {Object} data - `{ type: string, description?: string }`.
   * @returns {Promise<Object>} Updated badges and trust score.
   * @throws {LocalProValidationError} If `id` or `type` is missing.
   */
  async addBadge(id, data) {
    if (!id) throw new Error('id is required');
    if (!data || !data.type) throw new Error('badge type is required');
    return this.client.post(`/api/users/${id}/badges`, data);
  }

  /**
   * Remove a badge from a user.
   * @param {string} id - User ObjectId.
   * @param {string} badgeId - Badge ObjectId.
   * @returns {Promise<Object>} Remaining badges.
   * @throws {LocalProValidationError} If `id` or `badgeId` is missing.
   */
  async deleteBadge(id, badgeId) {
    if (!id) throw new Error('id is required');
    if (!badgeId) throw new Error('badgeId is required');
    return this.client.delete(`/api/users/${id}/badges/${badgeId}`);
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  /**
   * Bulk-update multiple users in one request (Admin only).
   * @param {Object} data - `{ userIds: string[], updateData: Object }`.
   * @returns {Promise<Object>} `{ matchedCount, modifiedCount }`.
   * @throws {LocalProValidationError} If `userIds` or `updateData` is missing.
   */
  async bulkUpdate(data) {
    if (!data || !Array.isArray(data.userIds) || data.userIds.length === 0)
      throw new Error('userIds array is required');
    if (!data.updateData || Object.keys(data.updateData).length === 0)
      throw new Error('updateData is required');
    return this.client.patch('/api/users/bulk', data);
  }

  // ─── Lifecycle Actions ────────────────────────────────────────────────────

  /**
   * Restore a soft-deleted user (Admin only).
   * @param {string} id - User ObjectId.
   * @returns {Promise<Object>} Restored user data.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async restore(id) {
    if (!id) throw new Error('id is required');
    return this.client.patch(`/api/users/${id}/restore`);
  }

  /**
   * Ban a user (Admin only). Sets status to 'banned' and deactivates the account.
   * @param {string} id - User ObjectId.
   * @param {Object} data - `{ reason?: string }`.
   * @returns {Promise<Object>} `{ isActive: false, status: 'banned' }`.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async ban(id, data = {}) {
    if (!id) throw new Error('id is required');
    return this.client.post(`/api/users/${id}/ban`, data);
  }

  // ─── Admin Actions ────────────────────────────────────────────────────────

  /**
   * Reset a user's password to a temporary value and optionally email it to them.
   * @param {string} id - User ObjectId.
   * @param {Object} [data={}] - `{ sendEmail?: boolean }` (default: `true`).
   * @returns {Promise<Object>} Confirmation; includes `temporaryPassword` if `sendEmail` is false.
   * @throws {LocalProValidationError} If `id` is missing.
   * @throws {LocalProRateLimitError} If userManagementLimiter threshold is exceeded.
   */
  async resetPassword(id, data = {}) {
    if (!id) throw new Error('id is required');
    return this.client.post(`/api/users/${id}/reset-password`, data);
  }

  /**
   * Send a direct email to a user from the admin panel.
   * @param {string} id - User ObjectId.
   * @param {Object} data - `{ subject: string, message: string, template?: string, templateData?: Object }`.
   * @returns {Promise<Object>} `{ recipient, subject }`.
   * @throws {LocalProValidationError} If `id`, `subject`, or `message` is missing.
   */
  async sendEmail(id, data) {
    if (!id) throw new Error('id is required');
    if (!data || !data.subject) throw new Error('subject is required');
    if (!data.message) throw new Error('message is required');
    return this.client.post(`/api/users/${id}/send-email`, data);
  }

  /**
   * Export all data for a user (GDPR/data-portability).
   * @param {string} id - User ObjectId.
   * @param {Object} [params={}] - `{ format?: 'json' | 'csv' }` (default: 'json').
   * @returns {Promise<Object>} Full export including user, provider, management, wallet, activities.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async exportData(id, params = {}) {
    if (!id) throw new Error('id is required');
    return this.client.get(`/api/users/${id}/export`, params);
  }

  /**
   * Get admin notes attached to a user.
   * @param {string} id - User ObjectId.
   * @param {Object} [params={}] - `{ limit?, skip?, sortBy?, sortOrder? }`.
   * @returns {Promise<Object>} Array of note objects.
   * @throws {LocalProValidationError} If `id` is missing.
   */
  async getNotes(id, params = {}) {
    if (!id) throw new Error('id is required');
    return this.client.get(`/api/users/${id}/notes`, params);
  }
}

module.exports = UserManagementAPI;
