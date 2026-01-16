/**
 * Custom error classes for LocalPro SDK
 */

class LocalProError extends Error {
  constructor(message, code, statusCode, response) {
    super(message);
    this.name = 'LocalProError';
    this.code = code;
    this.statusCode = statusCode;
    this.response = response;
    Error.captureStackTrace(this, this.constructor);
  }
}

class LocalProAPIError extends LocalProError {
  constructor(message, code, statusCode, response) {
    super(message, code, statusCode, response);
    this.name = 'LocalProAPIError';
  }
}

class LocalProAuthenticationError extends LocalProError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'AUTH_ERROR', statusCode || 401, response);
    this.name = 'LocalProAuthenticationError';
  }
}

class LocalProValidationError extends LocalProError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'VALIDATION_ERROR', statusCode || 400, response);
    this.name = 'LocalProValidationError';
  }
}

class LocalProNotFoundError extends LocalProError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'NOT_FOUND', statusCode || 404, response);
    this.name = 'LocalProNotFoundError';
  }
}

class LocalProRateLimitError extends LocalProError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'RATE_LIMIT_EXCEEDED', statusCode || 429, response);
    this.name = 'LocalProRateLimitError';
  }
}

module.exports = {
  LocalProError,
  LocalProAPIError,
  LocalProAuthenticationError,
  LocalProValidationError,
  LocalProNotFoundError,
  LocalProRateLimitError
};
