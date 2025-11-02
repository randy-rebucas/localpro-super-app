/**
 * Controller Validation Utilities Tests
 * Comprehensive tests for controllerValidation.js
 */

const {
  validatePagination,
  validateObjectId,
  validateRequiredFields,
  validateNumericRange,
  validateEmail,
  validatePhoneNumber,
  sendValidationError,
  sendAuthorizationError,
  sendNotFoundError,
  sendServerError
} = require('../../utils/controllerValidation');

describe('Controller Validation Utilities', () => {
  describe('validatePagination', () => {
    it('should validate correct pagination parameters', () => {
      const result = validatePagination({ page: 1, limit: 10 });
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    it('should use default values when not provided', () => {
      const result = validatePagination({});
      expect(result.isValid).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    it('should reject invalid page number', () => {
      const result = validatePagination({ page: -1, limit: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'page')).toBe(true);
    });

    it('should reject non-integer page number', () => {
      const result = validatePagination({ page: '1.5', limit: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'page')).toBe(true);
    });

    it('should reject invalid limit', () => {
      const result = validatePagination({ page: 1, limit: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'limit')).toBe(true);
    });

    it('should reject limit exceeding maximum', () => {
      const result = validatePagination({ page: 1, limit: 101 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'limit')).toBe(true);
    });

    it('should accept limit at maximum boundary', () => {
      const result = validatePagination({ page: 1, limit: 100 });
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateObjectId', () => {
    it('should validate correct ObjectId format', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(validateObjectId('507F1F77BCF86CD799439011')).toBe(true); // Case insensitive
    });

    it('should reject invalid ObjectId format', () => {
      expect(validateObjectId('invalid')).toBe(false);
      expect(validateObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
      expect(validateObjectId('507f1f77bcf86cd7994390111')).toBe(false); // Too long
      expect(validateObjectId('')).toBe(false);
      expect(validateObjectId(null)).toBe(false);
      expect(validateObjectId(undefined)).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate all required fields present', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const result = validateRequiredFields(data, ['name', 'email']);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject missing required fields', () => {
      const data = { name: 'John' };
      const result = validateRequiredFields(data, ['name', 'email']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should reject empty string values', () => {
      const data = { name: '  ', email: 'john@example.com' };
      const result = validateRequiredFields(data, ['name', 'email']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should handle empty required fields array', () => {
      const data = { name: 'John' };
      const result = validateRequiredFields(data, []);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateNumericRange', () => {
    it('should validate value within range', () => {
      const result = validateNumericRange(50, 0, 100, 'score');
      expect(result.isValid).toBe(true);
    });

    it('should reject value below minimum', () => {
      const result = validateNumericRange(-10, 0, 100, 'score');
      expect(result.isValid).toBe(false);
      expect(result.error.field).toBe('score');
      expect(result.error.code).toBe('INVALID_RANGE');
    });

    it('should reject value above maximum', () => {
      const result = validateNumericRange(150, 0, 100, 'score');
      expect(result.isValid).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const result = validateNumericRange('abc', 0, 100, 'score');
      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe('INVALID_NUMERIC_VALUE');
    });

    it('should handle boundary values', () => {
      expect(validateNumericRange(0, 0, 100, 'score').isValid).toBe(true);
      expect(validateNumericRange(100, 0, 100, 'score').isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test..test@example.com')).toBe(false); // Double dots
    });

    it('should reject non-string values', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail(123)).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('+442071234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('1234567890')).toBe(false); // Missing +
      expect(validatePhoneNumber('+0123456789')).toBe(false); // Starts with 0
      expect(validatePhoneNumber('+123')).toBe(false); // Too short
    });

    it('should reject non-string values', () => {
      expect(validatePhoneNumber(null)).toBe(false);
      expect(validatePhoneNumber(undefined)).toBe(false);
      expect(validatePhoneNumber(123)).toBe(false);
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const errors = [{ field: 'email', message: 'Invalid email' }];

      sendValidationError(res, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    });
  });

  describe('sendAuthorizationError', () => {
    it('should send authorization error response with default message', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendAuthorizationError(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized',
        code: 'UNAUTHORIZED'
      });
    });

    it('should send authorization error with custom message', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendAuthorizationError(res, 'Custom error', 'CUSTOM_CODE');

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error',
        code: 'CUSTOM_CODE'
      });
    });
  });

  describe('sendNotFoundError', () => {
    it('should send not found error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendNotFoundError(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('sendServerError', () => {
    it('should send server error response in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const error = new Error('Test error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      sendServerError(res, error);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: 'Test error'
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const error = new Error('Test error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      sendServerError(res, error);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: undefined
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});

