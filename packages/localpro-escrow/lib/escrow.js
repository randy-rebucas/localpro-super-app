/**
 * Escrow API - full lifecycle management for LocalPro escrows
 *
 * Escrow Statuses:
 *   CREATED       - Escrow created, awaiting payment hold
 *   FUNDS_HELD    - Payment held by provider (paymongo, xendit, stripe, etc.)
 *   IN_PROGRESS   - Job/service in progress
 *   PENDING_APPROVAL - Proof submitted, awaiting client approval
 *   COMPLETE      - Funds released to provider
 *   DISPUTE       - Dispute opened
 *   REFUNDED      - Funds refunded to client
 *   CANCELLED     - Escrow cancelled before funds were held
 */
class EscrowAPI {
  constructor(client) {
    this.client = client;
  }

  // ─── Core Lifecycle ────────────────────────────────────────────────────────

  /**
   * Create a new escrow and initiate a payment hold
   * @param {Object} data
   * @param {string} data.bookingId      - Booking ID
   * @param {string} data.providerId     - Provider user ID
   * @param {number} data.amount         - Amount in cents
   * @param {string} data.currency       - Currency code (PHP, USD, etc.)
   * @param {string} data.holdProvider   - Payment provider (paymongo, xendit, stripe, paypal, paymaya)
   * @param {string} [data.description]  - Optional description
   * @param {Object} [data.metadata]     - Optional key/value metadata
   * @returns {Promise<Object>} Created escrow
   */
  async create(data) {
    const { bookingId, providerId, amount, currency, holdProvider } = data;

    if (!bookingId || !providerId || !amount || !currency || !holdProvider) {
      throw new Error(
        'Missing required fields: bookingId, providerId, amount, currency, holdProvider'
      );
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    return this.client.post('/api/escrows/create', data);
  }

  /**
   * Get a single escrow by ID
   * @param {string} escrowId
   * @returns {Promise<Object>} Escrow with transactions and payout info
   */
  async getById(escrowId) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.get(`/api/escrows/${escrowId}`);
  }

  /**
   * List escrows for the authenticated user
   * @param {Object} [filters]
   * @param {string} [filters.status]  - Filter by status
   * @param {string} [filters.role]    - "client" | "provider"
   * @param {number} [filters.page]    - Page number (default: 1)
   * @param {number} [filters.limit]   - Items per page (default: 20)
   * @param {string} [filters.from]    - ISO date range start
   * @param {string} [filters.to]      - ISO date range end
   * @returns {Promise<Object>} Paginated list of escrows
   */
  async list(filters = {}) {
    return this.client.get('/api/escrows', filters);
  }

  /**
   * Capture held payment after client approves the work
   * @param {string} escrowId
   * @returns {Promise<Object>} Updated escrow
   */
  async capture(escrowId) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.post(`/api/escrows/${escrowId}/capture`);
  }

  /**
   * Release funds to provider (alias for capture, admin/system use)
   * @param {string} escrowId
   * @returns {Promise<Object>} Updated escrow
   */
  async release(escrowId) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.post(`/api/escrows/${escrowId}/release`);
  }

  /**
   * Refund the held payment back to the client
   * @param {string} escrowId
   * @param {string} [reason] - Reason for the refund
   * @returns {Promise<Object>} Updated escrow
   */
  async refund(escrowId, reason) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.post(`/api/escrows/${escrowId}/refund`, { reason });
  }

  /**
   * Cancel an escrow (only valid while in CREATED status)
   * @param {string} escrowId
   * @param {string} [reason]
   * @returns {Promise<Object>} Updated escrow
   */
  async cancel(escrowId, reason) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.post(`/api/escrows/${escrowId}/cancel`, { reason });
  }

  // ─── Proof of Work ─────────────────────────────────────────────────────────

  /**
   * Submit proof of completed work (Provider only)
   * @param {string} escrowId
   * @param {Object} proof
   * @param {Array<{url: string, type?: string}>} proof.documents - Uploaded document references
   * @param {string} [proof.notes] - Notes/description about the work done
   * @returns {Promise<Object>} Updated escrow
   */
  async submitProofOfWork(escrowId, proof) {
    this._requireId(escrowId, 'Escrow ID');

    if (!proof || !Array.isArray(proof.documents) || proof.documents.length === 0) {
      throw new Error('At least one document is required for proof of work');
    }

    return this.client.post(`/api/escrows/${escrowId}/proof-of-work`, proof);
  }

  /**
   * Upload proof of work files (multipart/form-data)
   * @param {string} escrowId
   * @param {FormData} formData - FormData instance with files attached
   * @returns {Promise<Object>} Uploaded document references
   */
  async uploadProofFiles(escrowId, formData) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.upload(`/api/escrows/${escrowId}/proof-of-work/upload`, formData);
  }

  // ─── Disputes ──────────────────────────────────────────────────────────────

  /**
   * Open a dispute on an escrow
   * @param {string} escrowId
   * @param {Object} disputeData
   * @param {string} disputeData.reason - Reason for the dispute
   * @param {Array<{url: string}>} [disputeData.evidence] - Supporting evidence documents
   * @returns {Promise<Object>} Updated escrow with dispute details
   */
  async openDispute(escrowId, disputeData) {
    this._requireId(escrowId, 'Escrow ID');

    if (!disputeData?.reason) {
      throw new Error('Dispute reason is required');
    }

    return this.client.post(`/api/escrows/${escrowId}/dispute`, disputeData);
  }

  /**
   * Resolve an open dispute (Admin only)
   * @param {string} escrowId
   * @param {Object} resolution
   * @param {string} resolution.outcome - "release" | "refund" | "partial"
   * @param {number} [resolution.providerAmount] - Amount to release to provider (partial)
   * @param {number} [resolution.clientAmount]   - Amount to refund to client (partial)
   * @param {string} [resolution.notes]
   * @returns {Promise<Object>} Updated escrow
   */
  async resolveDispute(escrowId, resolution) {
    this._requireId(escrowId, 'Escrow ID');

    if (!resolution?.outcome) {
      throw new Error('Dispute resolution outcome is required (release | refund | partial)');
    }

    return this.client.post(`/api/escrows/${escrowId}/dispute/resolve`, resolution);
  }

  // ─── Payouts ───────────────────────────────────────────────────────────────

  /**
   * Request a payout after escrow is complete (Provider only)
   * @param {string} escrowId
   * @param {Object} [payoutOptions]
   * @param {string} [payoutOptions.method] - Payout method override
   * @returns {Promise<Object>} Payout details
   */
  async requestPayout(escrowId, payoutOptions = {}) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.post(`/api/escrows/${escrowId}/payout`, payoutOptions);
  }

  /**
   * Get payout details for an escrow
   * @param {string} escrowId
   * @returns {Promise<Object>} Payout details
   */
  async getPayoutDetails(escrowId) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.get(`/api/escrows/${escrowId}/payout`);
  }

  // ─── History & Transactions ────────────────────────────────────────────────

  /**
   * Get the transaction history for an escrow
   * @param {string} escrowId
   * @returns {Promise<Object>} List of transactions
   */
  async getTransactions(escrowId) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.get(`/api/escrows/${escrowId}/transactions`);
  }

  /**
   * Get the full audit/status history for an escrow
   * @param {string} escrowId
   * @returns {Promise<Object>} History entries
   */
  async getHistory(escrowId) {
    this._requireId(escrowId, 'Escrow ID');
    return this.client.get(`/api/escrows/${escrowId}/history`);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /**
   * List all escrows across all users (Admin only)
   * @param {Object} [filters]
   * @param {string} [filters.status]
   * @param {number} [filters.page]
   * @param {number} [filters.limit]
   * @returns {Promise<Object>} Paginated list of all escrows
   */
  async adminList(filters = {}) {
    return this.client.get('/api/admin/escrows', filters);
  }

  /**
   * Update escrow status manually (Admin only)
   * @param {string} escrowId
   * @param {string} status - New status
   * @param {string} [notes]
   * @returns {Promise<Object>} Updated escrow
   */
  async adminUpdateStatus(escrowId, status, notes) {
    this._requireId(escrowId, 'Escrow ID');

    if (!status) {
      throw new Error('Status is required');
    }

    return this.client.patch(`/api/admin/escrows/${escrowId}/status`, { status, notes });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * @private
   */
  _requireId(value, label) {
    if (!value) {
      throw new Error(`${label} is required`);
    }
  }
}

module.exports = EscrowAPI;
