const LocalProClient = require('./lib/client');
const EscrowAPI = require('./lib/escrow');
const ProvidersAPI = require('./lib/providers');
const MarketplaceAPI = require('./lib/marketplace');
const JobsAPI = require('./lib/jobs');
const {
  LocalProError,
  LocalProAPIError,
  LocalProAuthenticationError,
  LocalProValidationError,
  LocalProNotFoundError,
  LocalProRateLimitError
} = require('./lib/errors');

/**
 * LocalPro SDK - Official SDK for LocalPro Super App API
 * 
 * @example
 * const LocalPro = require('@localpro/sdk');
 * 
 * const client = new LocalPro({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   baseURL: 'https://api.localpro.com' // optional
 * });
 * 
 * // Use different APIs
 * const services = await client.marketplace.getServices();
 * const provider = await client.providers.getById('provider-id');
 * const jobs = await client.jobs.search({ q: 'plumber' });
 * const escrow = await client.escrow.create({
 *   bookingId: '...',
 *   providerId: '...',
 *   amount: 10000, // in cents
 *   currency: 'USD',
 *   holdProvider: 'paymongo'
 * });
 */
class LocalPro {
  /**
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your LocalPro API key
   * @param {string} config.apiSecret - Your LocalPro API secret
   * @param {string} [config.baseURL] - Base URL for the API
   * @param {number} [config.timeout] - Request timeout in milliseconds
   * @param {Object} [config.headers] - Additional headers
   */
  constructor(config) {
    this.client = new LocalProClient(config);
    
    // Initialize API modules
    this.escrow = new EscrowAPI(this.client);
    this.providers = new ProvidersAPI(this.client);
    this.marketplace = new MarketplaceAPI(this.client);
    this.jobs = new JobsAPI(this.client);
  }

  /**
   * Get the underlying HTTP client (for advanced usage)
   * @returns {LocalProClient}
   */
  getClient() {
    return this.client;
  }
}

// Export main class
module.exports = LocalPro;

// Export error classes for error handling
module.exports.Errors = {
  LocalProError,
  LocalProAPIError,
  LocalProAuthenticationError,
  LocalProValidationError,
  LocalProNotFoundError,
  LocalProRateLimitError
};

// Export client class for advanced usage
module.exports.Client = LocalProClient;
