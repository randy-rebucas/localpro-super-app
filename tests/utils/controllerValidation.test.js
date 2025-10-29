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
} = require('../../src/utils/controllerValidation');

describe('Controller Validation Utilities', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('Pagination Validation', () => {
    it('should validate correct pagination parameters', () => {
      const query = { page: '2', limit: '20' };
      const result = validatePagination(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ page: 2, limit: 20 });
    });

    it('should use default values for missing parameters', () => {
      const query = {};
      const result = validatePagination(query);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ page: 1, limit: 10 });
    });

    it('should validate page number', () => {
      const invalidPages = ['0', '-1', 'abc', '1.5'];
      
      invalidPages.forEach(page => {
        const query = { page, limit: '10' };
        const result = validatePagination(query);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'page',
          message: 'Page number must be a positive integer',
          code: 'INVALID_PAGE_NUMBER'
        });
      });
    });

    it('should validate limit range', () => {
      const invalidLimits = ['0', '-1', '101', 'abc', '1.5'];
      
      invalidLimits.forEach(limit => {
        const query = { page: '1', limit };
        const result = validatePagination(query);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'limit',
          message: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT'
        });
      });
    });

    it('should handle multiple validation errors', () => {
      const query = { page: '0', limit: '101' };
      const result = validatePagination(query);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('ObjectId Validation', () => {
    it('should validate correct ObjectId format', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '000000000000000000000000',
        'ffffffffffffffffffffffff'
      ];

      validObjectIds.forEach(id => {
        expect(validateObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid ObjectId format', () => {
      const invalidObjectIds = [
        'invalid-id',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011g', // Invalid character
        '507f1f77bcf86cd7994390111', // Too long
        '', // Empty string
        null,
        undefined
      ];

      invalidObjectIds.forEach(id => {
        expect(validateObjectId(id)).toBe(false);
      });
    });
  });

  describe('Required Fields Validation', () => {
    it('should validate all required fields present', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      };
      const requiredFields = ['name', 'email', 'phone'];
      
      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data = {
        name: 'John Doe'
        // Missing email and phone
      };
      const requiredFields = ['name', 'email', 'phone'];
      
      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'email is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'phone is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    });

    it('should detect empty string fields', () => {
      const data = {
        name: 'John Doe',
        email: '', // Empty string
        phone: '   ' // Whitespace only
      };
      const requiredFields = ['name', 'email', 'phone'];
      
      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle null and undefined values', () => {
      const data = {
        name: 'John Doe',
        email: null,
        phone: undefined
      };
      const requiredFields = ['name', 'email', 'phone'];
      
      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Numeric Range Validation', () => {
    it('should validate numbers within range', () => {
      const result = validateNumericRange(50, 0, 100, 'score');
      
      expect(result.isValid).toBe(true);
    });

    it('should validate boundary values', () => {
      const minResult = validateNumericRange(0, 0, 100, 'score');
      const maxResult = validateNumericRange(100, 0, 100, 'score');
      
      expect(minResult.isValid).toBe(true);
      expect(maxResult.isValid).toBe(true);
    });

    it('should reject values outside range', () => {
      const belowMin = validateNumericRange(-10, 0, 100, 'score');
      const aboveMax = validateNumericRange(150, 0, 100, 'score');
      
      expect(belowMin.isValid).toBe(false);
      expect(belowMin.error.message).toBe('score must be between 0 and 100');
      
      expect(aboveMax.isValid).toBe(false);
      expect(aboveMax.error.message).toBe('score must be between 0 and 100');
    });

    it('should handle non-numeric values', () => {
      const result = validateNumericRange('abc', 0, 100, 'score');
      
      expect(result.isValid).toBe(false);
      expect(result.error.message).toBe('score must be a valid number');
    });

    it('should handle string numbers', () => {
      const result = validateNumericRange('50', 0, 100, 'score');
      
      expect(result.isValid).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const result = validateNumericRange(50.5, 0, 100, 'score');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@.com',
        'test@example.',
        'test@example..com',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate correct phone number formats', () => {
      const validPhoneNumbers = [
        '+1234567890',
        '+44123456789',
        '+8612345678901',
        '+33123456789',
        '+5511999999999'
      ];

      validPhoneNumbers.forEach(phoneNumber => {
        expect(validatePhoneNumber(phoneNumber)).toBe(true);
      });
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhoneNumbers = [
        '1234567890', // Missing +
        '+0123456789', // Starting with 0
        '+123', // Too short
        'invalid', // Not a number
        '+12345678901234567890', // Too long
        '+', // Just plus sign
        '++1234567890', // Double plus
        '+123-456-7890', // Contains dashes
        '+123 456 7890', // Contains spaces
        '',
        null,
        undefined
      ];

      invalidPhoneNumbers.forEach(phoneNumber => {
        expect(validatePhoneNumber(phoneNumber)).toBe(false);
      });
    });
  });

  describe('Error Response Helpers', () => {
    it('should send validation error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'phone', message: 'Phone number is required' }
      ];

      const result = sendValidationError(res, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
      expect(result).toBe(res);
    });

    it('should send authorization error response', () => {
      const result = sendAuthorizationError(res, 'Access denied', 'ACCESS_DENIED');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
      expect(result).toBe(res);
    });

    it('should send authorization error with default values', () => {
      const result = sendAuthorizationError(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized',
        code: 'UNAUTHORIZED'
      });
    });

    it('should send not found error response', () => {
      const result = sendNotFoundError(res, 'User not found', 'USER_NOT_FOUND');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      expect(result).toBe(res);
    });

    it('should send not found error with default values', () => {
      const result = sendNotFoundError(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      });
    });

    it('should send server error response', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Database connection failed');
      const result = sendServerError(res, error, 'Database error', 'DB_ERROR');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        code: 'DB_ERROR',
        error: error.message
      });
      expect(result).toBe(res);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should send server error with default values', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Something went wrong');
      const result = sendServerError(res, error);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: error.message
      });
      expect(result).toBe(res);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Sensitive error details');
      sendServerError(res, error);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: undefined
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays in validation', () => {
      const result = validateRequiredFields({}, []);
      expect(result.isValid).toBe(true);
    });

    it('should handle very large numbers', () => {
      const result = validateNumericRange(Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER, 'largeNumber');
      expect(result.isValid).toBe(true);
    });

    it('should handle very small numbers', () => {
      const result = validateNumericRange(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0, 'smallNumber');
      expect(result.isValid).toBe(true);
    });

    it('should handle special characters in email validation', () => {
      const specialEmails = [
        'test+tag@example.com',
        'test.tag@example.com',
        'test_tag@example.com',
        'test-tag@example.com'
      ];

      specialEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should handle international phone numbers', () => {
      const internationalPhones = [
        '+1234567890', // US
        '+44123456789', // UK
        '+8612345678901', // China
        '+33123456789', // France
        '+5511999999999' // Brazil
      ];

      internationalPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true);
      });
    });
  });
});
