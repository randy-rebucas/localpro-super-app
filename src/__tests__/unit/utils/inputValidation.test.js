const mongoose = require('mongoose');
const {
  validateObjectId,
  validatePhoneNumber,
  validateEmail,
  validatePagination,
  validateVerificationCode,
  validateDateRange,
  validatePriceRange,
  sanitizeString,
  validateEnum,
  validateURL,
  validateCoordinates
} = require('../../../utils/inputValidation');

describe('Input Validation Utility', () => {
  describe('validateObjectId', () => {
    test('should validate correct ObjectId', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const result = validateObjectId(validId);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(validId);
    });

    test('should reject invalid ObjectId', () => {
      const result = validateObjectId('invalid');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject wrong length', () => {
      const result = validateObjectId('123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('24 characters');
    });

    test('should reject empty value', () => {
      const result = validateObjectId('', 'userId');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('userId');
    });
  });

  describe('validatePhoneNumber', () => {
    test('should validate correct phone number', () => {
      const result = validatePhoneNumber('+1234567890');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('+1234567890');
    });

    test('should reject invalid phone number', () => {
      const result = validatePhoneNumber('1234567890');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject empty value', () => {
      const result = validatePhoneNumber('');

      expect(result.valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email', () => {
      const result = validateEmail('test@example.com');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    test('should lowercase and trim email', () => {
      const result = validateEmail('  TEST@EXAMPLE.COM  ');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    test('should reject invalid email', () => {
      const result = validateEmail('invalid');

      expect(result.valid).toBe(false);
    });

    test('should reject empty value', () => {
      const result = validateEmail('');

      expect(result.valid).toBe(false);
    });
  });

  describe('validatePagination', () => {
    test('should validate correct pagination', () => {
      const result = validatePagination(1, 10);

      expect(result.valid).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    test('should reject invalid page', () => {
      const result = validatePagination(0, 10);

      expect(result.valid).toBe(false);
    });

    test('should reject limit exceeding maximum', () => {
      const result = validatePagination(1, 200, 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });
  });

  describe('validateVerificationCode', () => {
    test('should validate correct verification code', () => {
      const result = validateVerificationCode('123456');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('123456');
    });

    test('should reject wrong length', () => {
      const result = validateVerificationCode('12345');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 digits');
    });

    test('should reject non-numeric code', () => {
      const result = validateVerificationCode('12345a');

      expect(result.valid).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    test('should validate correct date range', () => {
      const start = '2025-01-01';
      const end = '2025-01-31';
      const result = validateDateRange(start, end);

      expect(result.valid).toBe(true);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    test('should reject start date after end date', () => {
      const result = validateDateRange('2025-01-31', '2025-01-01');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('before');
    });

    test('should reject invalid date format', () => {
      const result = validateDateRange('invalid', '2025-01-01');

      expect(result.valid).toBe(false);
    });
  });

  describe('validatePriceRange', () => {
    test('should validate correct price range', () => {
      const result = validatePriceRange(10, 100);

      expect(result.valid).toBe(true);
    });

    test('should reject negative prices', () => {
      const result = validatePriceRange(-10, 100);

      expect(result.valid).toBe(false);
    });

    test('should reject min price greater than max', () => {
      const result = validatePriceRange(100, 10);

      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    test('should sanitize string', () => {
      const result = sanitizeString('  test  string  ');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('test string');
    });

    test('should reject empty string', () => {
      const result = sanitizeString('   ');

      expect(result.valid).toBe(false);
    });

    test('should enforce max length', () => {
      const result = sanitizeString('a'.repeat(101), 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });
  });

  describe('validateEnum', () => {
    test('should validate correct enum value', () => {
      const result = validateEnum('active', ['active', 'inactive'], 'status');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('active');
    });

    test('should reject invalid enum value', () => {
      const result = validateEnum('invalid', ['active', 'inactive'], 'status');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('status');
    });

    test('should reject empty value', () => {
      const result = validateEnum('', ['active', 'inactive']);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateURL', () => {
    test('should validate correct URL', () => {
      const result = validateURL('https://example.com');

      expect(result.valid).toBe(true);
      expect(result.value).toBe('https://example.com');
    });

    test('should reject invalid URL', () => {
      const result = validateURL('not-a-url');

      expect(result.valid).toBe(false);
    });

    test('should reject empty value', () => {
      const result = validateURL('');

      expect(result.valid).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    test('should validate correct coordinates', () => {
      const result = validateCoordinates(40.7128, -74.0060);

      expect(result.valid).toBe(true);
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.0060);
    });

    test('should reject invalid latitude', () => {
      const result = validateCoordinates(100, -74.0060);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Latitude');
    });

    test('should reject invalid longitude', () => {
      const result = validateCoordinates(40.7128, -200);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Longitude');
    });

    test('should reject non-numeric values', () => {
      const result = validateCoordinates('invalid', 'invalid');

      expect(result.valid).toBe(false);
    });
  });
});

