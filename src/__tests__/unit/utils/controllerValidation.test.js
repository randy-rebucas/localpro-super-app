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
} = require('../../../utils/controllerValidation');

describe('Controller Validation Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('validatePagination', () => {
    test('should validate correct pagination parameters', () => {
      const result = validatePagination({ page: 1, limit: 10 });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    test('should use default values', () => {
      const result = validatePagination({});

      expect(result.isValid).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    test('should reject invalid page number', () => {
      const result = validatePagination({ page: 0, limit: 10 });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject limit exceeding maximum', () => {
      const result = validatePagination({ page: 1, limit: 200 });

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_LIMIT');
    });

    test('should reject non-integer page', () => {
      const result = validatePagination({ page: 1.5, limit: 10 });

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateObjectId', () => {
    test('should validate correct ObjectId', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    test('should reject invalid ObjectId', () => {
      expect(validateObjectId('invalid')).toBe(false);
      expect(validateObjectId('123')).toBe(false);
      expect(validateObjectId('')).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    test('should validate all required fields present', () => {
      const data = {
        name: 'John',
        email: 'john@example.com'
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for missing fields', () => {
      const data = {
        name: 'John'
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].field).toBe('email');
    });

    test('should reject empty strings', () => {
      const data = {
        name: '   ',
        email: 'john@example.com'
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateNumericRange', () => {
    test('should validate value within range', () => {
      const result = validateNumericRange(50, 0, 100, 'price');

      expect(result.isValid).toBe(true);
    });

    test('should reject value below minimum', () => {
      const result = validateNumericRange(-10, 0, 100, 'price');

      expect(result.isValid).toBe(false);
      expect(result.error.field).toBe('price');
    });

    test('should reject value above maximum', () => {
      const result = validateNumericRange(150, 0, 100, 'price');

      expect(result.isValid).toBe(false);
    });

    test('should reject non-numeric value', () => {
      const result = validateNumericRange('invalid', 0, 100, 'price');

      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe('INVALID_NUMERIC_VALUE');
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@example.co.uk')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user..name@example.com')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    test('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('+639123456789')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('1234567890')).toBe(false);
      expect(validatePhoneNumber('+01234567890')).toBe(false);
      expect(validatePhoneNumber('+123')).toBe(false);
    });
  });

  describe('sendValidationError', () => {
    test('should send validation error response', () => {
      const errors = [
        { field: 'email', message: 'Email is required' }
      ];

      sendValidationError(mockRes, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    });
  });

  describe('sendAuthorizationError', () => {
    test('should send authorization error response', () => {
      sendAuthorizationError(mockRes, 'Not authorized', 'FORBIDDEN');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized',
        code: 'FORBIDDEN'
      });
    });
  });

  describe('sendNotFoundError', () => {
    test('should send not found error response', () => {
      sendNotFoundError(mockRes, 'Resource not found', 'NOT_FOUND');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('sendServerError', () => {
    test('should send server error response in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');

      sendServerError(mockRes, error);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: 'Test error'
      });
    });

    test('should hide error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');

      sendServerError(mockRes, error);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: undefined
      });
    });
  });
});

