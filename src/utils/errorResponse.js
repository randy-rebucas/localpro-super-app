/**
 * Standardized Error Response Utility
 * Provides consistent error handling across all API endpoints
 */

class ErrorResponse {
  constructor() {
    // Error code definitions for consistent error handling
    this.errorCodes = {
      // Authentication & Authorization
      NO_TOKEN: { status: 401, message: 'Access token is required' },
      INVALID_TOKEN: { status: 401, message: 'Invalid or expired access token' },
      INSUFFICIENT_PERMISSIONS: { status: 403, message: 'Insufficient permissions to access this resource' },
      USER_NOT_VERIFIED: { status: 401, message: 'User account not verified' },
      INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },

      // User Management
      USER_EXISTS: { status: 409, message: 'User with this email or phone already exists' },
      USER_NOT_FOUND: { status: 404, message: 'User not found' },
      INVALID_CODE: { status: 400, message: 'Invalid verification code' },
      EMAIL_EXISTS: { status: 409, message: 'Email address already in use' },

      // Partners
      PARTNER_EXISTS: { status: 409, message: 'Partner with this email or slug already exists' },
      PARTNER_NOT_FOUND: { status: 404, message: 'Partner not found' },
      INCOMPLETE_ONBOARDING: { status: 400, message: 'Partner onboarding is incomplete' },

      // Validation
      VALIDATION_ERROR: { status: 400, message: 'Validation failed' },
      MISSING_REQUIRED_FIELD: { status: 400, message: 'Required field is missing' },
      INVALID_FORMAT: { status: 400, message: 'Invalid data format' },
      INVALID_ID: { status: 400, message: 'Invalid ID format' },

      // Business Logic
      INSUFFICIENT_FUNDS: { status: 402, message: 'Insufficient funds' },
      RESOURCE_NOT_AVAILABLE: { status: 409, message: 'Resource not available' },
      OPERATION_NOT_ALLOWED: { status: 403, message: 'Operation not allowed' },
      DUPLICATE_OPERATION: { status: 409, message: 'Operation already performed' },

      // Payment & Financial
      PAYMENT_FAILED: { status: 402, message: 'Payment processing failed' },
      ESCROW_NOT_FOUND: { status: 404, message: 'Escrow record not found' },
      INVALID_PAYMENT_METHOD: { status: 400, message: 'Invalid payment method' },
      PAYMENT_NOT_CAPTURED: { status: 400, message: 'Payment not captured' },

      // Services & Resources
      SERVICE_NOT_FOUND: { status: 404, message: 'Service not found' },
      BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found' },
      PROVIDER_NOT_FOUND: { status: 404, message: 'Provider not found' },
      JOB_NOT_FOUND: { status: 404, message: 'Job not found' },

      // Rate Limiting
      RATE_LIMIT_EXCEEDED: { status: 429, message: 'Too many requests. Please try again later.' },

      // File Upload
      FILE_TOO_LARGE: { status: 413, message: 'File size exceeds limit' },
      INVALID_FILE_TYPE: { status: 400, message: 'Invalid file type' },
      UPLOAD_FAILED: { status: 500, message: 'File upload failed' },

      // External Services
      EXTERNAL_SERVICE_ERROR: { status: 502, message: 'External service temporarily unavailable' },
      PAYMENT_GATEWAY_ERROR: { status: 502, message: 'Payment gateway error' },

      // System Errors
      DATABASE_ERROR: { status: 500, message: 'Database operation failed' },
      INTERNAL_SERVER_ERROR: { status: 500, message: 'Internal server error' },
      SERVICE_UNAVAILABLE: { status: 503, message: 'Service temporarily unavailable' },

      // Generic
      BAD_REQUEST: { status: 400, message: 'Bad request' },
      UNAUTHORIZED: { status: 401, message: 'Unauthorized access' },
      FORBIDDEN: { status: 403, message: 'Access forbidden' },
      NOT_FOUND: { status: 404, message: 'Resource not found' },
      METHOD_NOT_ALLOWED: { status: 405, message: 'Method not allowed' },
      CONFLICT: { status: 409, message: 'Resource conflict' },
      UNPROCESSABLE_ENTITY: { status: 422, message: 'Unprocessable entity' }
    };
  }

  /**
   * Send standardized error response
   */
  sendError(res, errorCode, details = null, customMessage = null) {
    const errorInfo = this.errorCodes[errorCode];

    if (!errorInfo) {
      // Fallback for unknown error codes
      return res.status(500).json({
        success: false,
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    const response = {
      success: false,
      message: customMessage || errorInfo.message,
      code: errorCode,
      timestamp: new Date().toISOString()
    };

    // Add additional details if provided
    if (details) {
      if (typeof details === 'string') {
        response.details = details;
      } else if (typeof details === 'object') {
        response.details = details;
      }
    }

    // Add validation errors if present
    if (errorCode === 'VALIDATION_ERROR' && details?.errors) {
      response.validationErrors = details.errors;
    }

    return res.status(errorInfo.status).json(response);
  }

  /**
   * Send success response (for consistency)
   */
  sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Create custom error response
   */
  createCustomError(statusCode, message, code, details = null) {
    return {
      status: statusCode,
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle validation errors from express-validator
   */
  handleValidationError(res, errors) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return this.sendError(res, 'VALIDATION_ERROR', {
      errors: formattedErrors
    });
  }

  /**
   * Handle mongoose errors
   */
  handleMongooseError(res, error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return this.sendError(res, 'VALIDATION_ERROR', {
        errors
      }, 'Data validation failed');
    }

    if (error.name === 'CastError') {
      return this.sendError(res, 'INVALID_ID', `Invalid ${error.path}: ${error.value}`);
    }

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return this.sendError(res, 'CONFLICT', `Duplicate value for field: ${field}`);
    }

    // Generic database error
    return this.sendError(res, 'DATABASE_ERROR', error.message);
  }

  /**
   * Handle JWT errors
   */
  handleJWTError(res, error) {
    if (error.name === 'TokenExpiredError') {
      return this.sendError(res, 'INVALID_TOKEN', 'Access token has expired');
    }

    if (error.name === 'JsonWebTokenError') {
      return this.sendError(res, 'INVALID_TOKEN', 'Invalid access token format');
    }

    return this.sendError(res, 'INVALID_TOKEN');
  }

  /**
   * Handle payment gateway errors
   */
  handlePaymentError(res, error, gateway = 'unknown') {
    const errorMessage = `Payment processing failed via ${gateway}`;

    return this.sendError(res, 'PAYMENT_FAILED', {
      gateway,
      originalError: error.message,
      code: error.code
    }, errorMessage);
  }

  /**
   * Handle file upload errors
   */
  handleFileUploadError(res, error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return this.sendError(res, 'FILE_TOO_LARGE');
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return this.sendError(res, 'BAD_REQUEST', 'Too many files uploaded');
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return this.sendError(res, 'INVALID_FILE_TYPE');
    }

    return this.sendError(res, 'UPLOAD_FAILED', error.message);
  }

  /**
   * Handle rate limiting errors
   */
  handleRateLimitError(res, retryAfter = 60) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: `${retryAfter} seconds`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get error info by code
   */
  getErrorInfo(errorCode) {
    return this.errorCodes[errorCode] || null;
  }

  /**
   * Add custom error code
   */
  addErrorCode(code, status, message) {
    this.errorCodes[code] = { status, message };
  }

  /**
   * Remove error code
   */
  removeErrorCode(code) {
    delete this.errorCodes[code];
  }

  /**
   * List all available error codes
   */
  listErrorCodes() {
    return Object.keys(this.errorCodes).map(code => ({
      code,
      ...this.errorCodes[code]
    }));
  }
}

module.exports = new ErrorResponse();
