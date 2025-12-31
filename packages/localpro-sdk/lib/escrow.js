/**
 * Escrow API methods for LocalPro SDK
 */
class EscrowAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new escrow and initiate payment hold
   * @param {Object} escrowData - Escrow creation data
   * @param {string} escrowData.bookingId - Booking ID
   * @param {string} escrowData.providerId - Provider user ID
   * @param {number} escrowData.amount - Amount in cents
   * @param {string} escrowData.currency - Currency code (USD, PHP, etc.)
   * @param {string} escrowData.holdProvider - Payment provider (paymongo, xendit, stripe, etc.)
   * @returns {Promise<Object>} Created escrow object
   */
  async create(escrowData) {
    const { bookingId, providerId, amount, currency, holdProvider } = escrowData;

    if (!bookingId || !providerId || !amount || !currency || !holdProvider) {
      throw new Error('Missing required fields: bookingId, providerId, amount, currency, holdProvider');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    return await this.client.post('/api/escrows/create', {
      bookingId,
      providerId,
      amount,
      currency,
      holdProvider
    });
  }

  /**
   * Get escrow details by ID
   * @param {string} escrowId - Escrow ID
   * @returns {Promise<Object>} Escrow details with transactions and payout info
   */
  async getById(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return await this.client.get(`/api/escrows/${escrowId}`);
  }

  /**
   * Get user's escrows with optional filters
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status (CREATED, FUNDS_HELD, IN_PROGRESS, COMPLETE, DISPUTE, REFUNDED, etc.)
   * @param {number} [filters.page] - Page number (default: 1)
   * @param {number} [filters.limit] - Items per page (default: 20)
   * @returns {Promise<Object>} Paginated list of escrows
   */
  async list(filters = {}) {
    return await this.client.get('/api/escrows', filters);
  }

  /**
   * Capture held payment after client approval
   * @param {string} escrowId - Escrow ID
   * @returns {Promise<Object>} Updated escrow object
   */
  async capture(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return await this.client.post(`/api/escrows/${escrowId}/capture`);
  }

  /**
   * Refund payment (before capture)
   * @param {string} escrowId - Escrow ID
   * @param {string} [reason] - Reason for refund
   * @returns {Promise<Object>} Updated escrow object
   */
  async refund(escrowId, reason) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return await this.client.post(`/api/escrows/${escrowId}/refund`, {
      reason
    });
  }

  /**
   * Upload proof of work (Provider only)
   * @param {string} escrowId - Escrow ID
   * @param {Object} proofData - Proof of work data
   * @param {Array<Object>} proofData.documents - Array of document objects with url
   * @param {string} [proofData.notes] - Notes about the proof
   * @returns {Promise<Object>} Updated escrow object
   */
  async uploadProofOfWork(escrowId, proofData) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    // For file uploads, you would use FormData
    // This is a simplified version - actual implementation may need multipart/form-data
    return await this.client.post(`/api/escrows/${escrowId}/proof-of-work`, proofData);
  }

  /**
   * Initiate dispute
   * @param {string} escrowId - Escrow ID
   * @param {Object} disputeData - Dispute data
   * @param {string} disputeData.reason - Reason for dispute
   * @param {Array<Object>} [disputeData.evidence] - Evidence documents
   * @returns {Promise<Object>} Updated escrow object
   */
  async initiateDispute(escrowId, disputeData) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    if (!disputeData.reason) {
      throw new Error('Dispute reason is required');
    }

    return await this.client.post(`/api/escrows/${escrowId}/dispute`, disputeData);
  }

  /**
   * Request payout (Provider only)
   * @param {string} escrowId - Escrow ID
   * @returns {Promise<Object>} Payout information
   */
  async requestPayout(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return await this.client.post(`/api/escrows/${escrowId}/payout`);
  }

  /**
   * Get escrow transaction history
   * @param {string} escrowId - Escrow ID
   * @returns {Promise<Object>} Transaction history
   */
  async getTransactions(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return await this.client.get(`/api/escrows/${escrowId}/transactions`);
  }

  /**
   * Get payout details
   * @param {string} escrowId - Escrow ID
   * @returns {Promise<Object>} Payout details
   */
  async getPayoutDetails(escrowId) {
    if (!escrowId) {
      throw new Error('Escrow ID is required');
    }

    return await this.client.get(`/api/escrows/${escrowId}/payout`);
  }
}

module.exports = EscrowAPI;
