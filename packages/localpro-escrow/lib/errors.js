/**
 * Custom error classes for LocalPro Escrow SDK
 */

class LocalProEscrowError extends Error {
  constructor(message, code, statusCode, response) {
    super(message);
    this.name = 'LocalProEscrowError';
    this.code = code;
    this.statusCode = statusCode;
    this.response = response;
    Error.captureStackTrace(this, this.constructor);
  }
}

class LocalProEscrowAPIError extends LocalProEscrowError {
  constructor(message, code, statusCode, response) {
    super(message, code, statusCode, response);
    this.name = 'LocalProEscrowAPIError';
  }
}

class LocalProEscrowAuthenticationError extends LocalProEscrowError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'AUTH_ERROR', statusCode || 401, response);
    this.name = 'LocalProEscrowAuthenticationError';
  }
}

class LocalProEscrowValidationError extends LocalProEscrowError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'VALIDATION_ERROR', statusCode || 400, response);
    this.name = 'LocalProEscrowValidationError';
  }
}

class LocalProEscrowNotFoundError extends LocalProEscrowError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'NOT_FOUND', statusCode || 404, response);
    this.name = 'LocalProEscrowNotFoundError';
  }
}

class LocalProEscrowRateLimitError extends LocalProEscrowError {
  constructor(message, code, statusCode, response) {
    super(message, code || 'RATE_LIMIT_EXCEEDED', statusCode || 429, response);
    this.name = 'LocalProEscrowRateLimitError';
  }
}

module.exports = {
  LocalProEscrowError,
  LocalProEscrowAPIError,
  LocalProEscrowAuthenticationError,
  LocalProEscrowValidationError,
  LocalProEscrowNotFoundError,
  LocalProEscrowRateLimitError
};
