const EscrowClient = require('./lib/client');
const EscrowAPI = require('./lib/escrow');
const {
  LocalProEscrowError,
  LocalProEscrowAPIError,
  LocalProEscrowAuthenticationError,
  LocalProEscrowValidationError,
  LocalProEscrowNotFoundError,
  LocalProEscrowRateLimitError
} = require('./lib/errors');

/**
 * LocalPro Escrow SDK
 *
 * A focused SDK for managing the full escrow lifecycle on the LocalPro platform.
 * Supports escrow creation, fund holding, proof of work, disputes, and payouts.
 *
 * @example
 * const LocalProEscrow = require('@localpro/escrow');
 *
 * const escrow = new LocalProEscrow({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   baseURL: 'https://api.localpro.com' // optional, defaults to localhost:5000
 * });
 *
 * // Create an escrow
 * const newEscrow = await escrow.create({
 *   bookingId: 'booking-123',
 *   providerId: 'provider-456',
 *   amount: 50000, // in cents
 *   currency: 'PHP',
 *   holdProvider: 'paymongo'
 * });
 *
 * // List escrows
 * const list = await escrow.list({ status: 'FUNDS_HELD', page: 1, limit: 10 });
 *
 * // Submit proof of work
 * await escrow.submitProofOfWork(newEscrow.data._id, {
 *   documents: [{ url: 'https://cdn.example.com/proof.jpg' }],
 *   notes: 'Work completed as agreed'
 * });
 *
 * // Capture payment
 * await escrow.capture(newEscrow.data._id);
 *
 * // Open a dispute
 * await escrow.openDispute(newEscrow.data._id, {
 *   reason: 'Work not completed as described',
 *   evidence: [{ url: 'https://cdn.example.com/evidence.jpg' }]
 * });
 */
class LocalProEscrow {
  /**
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey     - Your LocalPro API key
   * @param {string} config.apiSecret  - Your LocalPro API secret
   * @param {string} [config.baseURL]  - Base URL (default: http://localhost:5000)
   * @param {number} [config.timeout]  - Request timeout in ms (default: 30000)
   * @param {Object} [config.headers]  - Additional request headers
   */
  constructor(config) {
    this._client = new EscrowClient(config);
    this._api = new EscrowAPI(this._client);

    // Expose all EscrowAPI methods directly on the instance for ergonomic use
    const methods = Object.getOwnPropertyNames(EscrowAPI.prototype).filter(
      (m) => m !== 'constructor' && !m.startsWith('_')
    );

    for (const method of methods) {
      this[method] = this._api[method].bind(this._api);
    }
  }

  /**
   * Access the underlying HTTP client (advanced usage)
   * @returns {EscrowClient}
   */
  getClient() {
    return this._client;
  }
}

module.exports = LocalProEscrow;

// Named exports for advanced / modular usage
module.exports.EscrowAPI = EscrowAPI;
module.exports.EscrowClient = EscrowClient;

// Error classes
module.exports.Errors = {
  LocalProEscrowError,
  LocalProEscrowAPIError,
  LocalProEscrowAuthenticationError,
  LocalProEscrowValidationError,
  LocalProEscrowNotFoundError,
  LocalProEscrowRateLimitError
};
