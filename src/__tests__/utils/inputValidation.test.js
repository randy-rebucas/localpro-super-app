/**
 * Input Validation Utilities Tests
 */

const {
  validateObjectId,
  validatePhoneNumber,
  validateEmail,
  validatePagination,
  validateVerificationCode,
  validatePriceRange,
  sanitizeString,
  validateEnum,
  validateCoordinates
} = require('../../utils/inputValidation');

describe('Input Validation Utilities', () => {
  describe('validateObjectId', () => {
    it('should validate correct ObjectId', () => {
      const result = validateObjectId('507f1f77bcf86cd799439011');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('507f1f77bcf86cd799439011');
    });

    it('should reject invalid ObjectId format', () => {
      const result = validateObjectId('invalid-id');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('24 characters');
    });

    it('should reject empty ObjectId', () => {
      const result = validateObjectId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should trim whitespace', () => {
      const result = validateObjectId('  507f1f77bcf86cd799439011  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number', () => {
      const result = validatePhoneNumber('+1234567890');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('+1234567890');
    });

    it('should reject phone without country code', () => {
      const result = validatePhoneNumber('1234567890');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('international format');
    });

    it('should reject empty phone number', () => {
      const result = validatePhoneNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const result = validateEmail('TEST@EXAMPLE.COM');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('validatePagination', () => {
    it('should validate correct pagination', () => {
      const result = validatePagination(1, 10);
      expect(result.valid).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should reject negative page', () => {
      const result = validatePagination(-1, 10);
      expect(result.valid).toBe(false);
    });

    it('should enforce max limit', () => {
      const result = validatePagination(1, 200, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });
  });

  describe('validateVerificationCode', () => {
    it('should validate correct 6-digit code', () => {
      const result = validateVerificationCode('123456');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('123456');
    });

    it('should reject code with wrong length', () => {
      const result = validateVerificationCode('12345');
      expect(result.valid).toBe(false);
    });

    it('should reject non-numeric code', () => {
      const result = validateVerificationCode('abcdef');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePriceRange', () => {
    it('should validate correct price range', () => {
      const result = validatePriceRange(10, 100);
      expect(result.valid).toBe(true);
      expect(result.minPrice).toBe(10);
      expect(result.maxPrice).toBe(100);
    });

    it('should reject min > max', () => {
      const result = validatePriceRange(100, 10);
      expect(result.valid).toBe(false);
    });

    it('should reject negative prices', () => {
      const result = validatePriceRange(-10, 100);
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim and normalize whitespace', () => {
      const result = sanitizeString('  hello   world  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('hello world');
    });

    it('should enforce max length', () => {
      const result = sanitizeString('hello world', 5);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEnum', () => {
    it('should validate allowed enum value', () => {
      const result = validateEnum('active', ['active', 'inactive'], 'Status');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('active');
    });

    it('should reject disallowed enum value', () => {
      const result = validateEnum('pending', ['active', 'inactive'], 'Status');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      const result = validateCoordinates(40.7128, -74.0060);
      expect(result.valid).toBe(true);
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.0060);
    });

    it('should reject invalid latitude', () => {
      const result = validateCoordinates(100, -74.0060);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const result = validateCoordinates(40.7128, -200);
      expect(result.valid).toBe(false);
    });
  });
});

