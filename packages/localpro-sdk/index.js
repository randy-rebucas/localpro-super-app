const LocalProClient = require('./lib/client');
const EscrowAPI = require('./lib/escrow');
const ProvidersAPI = require('./lib/providers');
const MarketplaceAPI = require('./lib/marketplace');
const JobsAPI = require('./lib/jobs');
const AuthAPI = require('./lib/auth');
const FinanceAPI = require('./lib/finance');
const MapsAPI = require('./lib/maps');
const SuppliesAPI = require('./lib/supplies');
const RentalsAPI = require('./lib/rentals');
const SearchAPI = require('./lib/search');
const ReferralsAPI = require('./lib/referrals');
const CommunicationAPI = require('./lib/communication');
const SettingsAPI = require('./lib/settings');
const NotificationsAPI = require('./lib/notifications');
const AnalyticsAPI = require('./lib/analytics');
const SchedulingAPI = require('./lib/scheduling');
const TrustVerificationAPI = require('./lib/trustVerification');
const UserManagementAPI = require('./lib/userManagement');
const BroadcasterAPI = require('./lib/broadcaster');
const AIAPI = require('./lib/ai');
const AcademyAPI = require('./lib/academy');
const ActivitiesAPI = require('./lib/activities');
const AdsAPI = require('./lib/ads');
const AgenciesAPI = require('./lib/agencies');
const PartnersAPI = require('./lib/partners');
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
    this.auth = new AuthAPI(this.client);
    this.finance = new FinanceAPI(this.client);
    this.maps = new MapsAPI(this.client);
    this.supplies = new SuppliesAPI(this.client);
    this.rentals = new RentalsAPI(this.client);
    this.search = new SearchAPI(this.client);
    this.referrals = new ReferralsAPI(this.client);
    this.communication = new CommunicationAPI(this.client);
    this.settings = new SettingsAPI(this.client);
    this.notifications = new NotificationsAPI(this.client);
    this.analytics = new AnalyticsAPI(this.client);
    this.scheduling = new SchedulingAPI(this.client);
    this.trustVerification = new TrustVerificationAPI(this.client);
    this.userManagement = new UserManagementAPI(this.client);
    this.broadcaster = new BroadcasterAPI(this.client);
    this.ai = new AIAPI(this.client);
    this.academy = new AcademyAPI(this.client);
    this.activities = new ActivitiesAPI(this.client);
    this.ads = new AdsAPI(this.client);
    this.agencies = new AgenciesAPI(this.client);
    this.partners = new PartnersAPI(this.client);
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

// Export Academy API for advanced usage
module.exports.AcademyAPI = AcademyAPI;
module.exports.ActivitiesAPI = ActivitiesAPI;
module.exports.AdsAPI = AdsAPI;
module.exports.AgenciesAPI = AgenciesAPI;
module.exports.PartnersAPI = PartnersAPI;

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
