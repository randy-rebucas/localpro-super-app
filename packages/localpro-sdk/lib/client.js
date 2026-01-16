const axios = require('axios');
const {
  LocalProAPIError,
  LocalProAuthenticationError,
  LocalProValidationError,
  LocalProNotFoundError,
  LocalProRateLimitError
} = require('./errors');

/**
 * Base LocalPro API Client
 */
class LocalProClient {
  /**
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your LocalPro API key
   * @param {string} config.apiSecret - Your LocalPro API secret
   * @param {string} [config.baseURL] - Base URL for the API (default: http://localhost:5000)
   * @param {number} [config.timeout] - Request timeout in milliseconds (default: 30000)
   * @param {Object} [config.headers] - Additional headers to include in requests
   */
  constructor(config) {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error('API key and API secret are required');
    }

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = config.baseURL || 'http://localhost:5000';
    this.timeout = config.timeout || 30000;

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret,
        ...config.headers
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Handle API errors and convert to appropriate error types
   * @private
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message || 'API request failed';
      const code = data?.code || 'API_ERROR';

      switch (status) {
        case 401:
        case 403:
          throw new LocalProAuthenticationError(message, code, status, data);
        case 400:
          throw new LocalProValidationError(message, code, status, data);
        case 404:
          throw new LocalProNotFoundError(message, code, status, data);
        case 429:
          throw new LocalProRateLimitError(message, code, status, data);
        default:
          throw new LocalProAPIError(message, code, status, data);
      }
    } else if (error.request) {
      throw new LocalProAPIError(
        'No response received from API',
        'NO_RESPONSE',
        null,
        null
      );
    } else {
      throw new LocalProAPIError(
        error.message || 'Request setup error',
        'REQUEST_ERROR',
        null,
        null
      );
    }
  }

  /**
   * Make a GET request
   * @param {string} path - API endpoint path
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async get(path, params = {}) {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  /**
   * Make a POST request
   * @param {string} path - API endpoint path
   * @param {Object} [data] - Request body
   * @returns {Promise<Object>}
   */
  async post(path, data = {}) {
    const response = await this.client.post(path, data);
    return response.data;
  }

  /**
   * Make a PUT request
   * @param {string} path - API endpoint path
   * @param {Object} [data] - Request body
   * @returns {Promise<Object>}
   */
  async put(path, data = {}) {
    const response = await this.client.put(path, data);
    return response.data;
  }

  /**
   * Make a PATCH request
   * @param {string} path - API endpoint path
   * @param {Object} [data] - Request body
   * @returns {Promise<Object>}
   */
  async patch(path, data = {}) {
    const response = await this.client.patch(path, data);
    return response.data;
  }

  /**
   * Make a DELETE request
   * @param {string} path - API endpoint path
   * @returns {Promise<Object>}
   */
  async delete(path) {
    const response = await this.client.delete(path);
    return response.data;
  }

  /**
   * Upload a file (multipart/form-data)
   * @param {string} path - API endpoint path
   * @param {FormData|Object} formData - Form data with file
   * @returns {Promise<Object>}
   */
  async upload(path, formData) {
    const response = await this.client.post(path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

module.exports = LocalProClient;
