const mongoose = require('mongoose');
const {
  cleanObjectIdFields,
  getNestedValue,
  removeNestedField,
  isValidObjectId,
  validateObjectIdFields
} = require('../../../utils/objectIdUtils');

describe('ObjectId Utils', () => {
  describe('isValidObjectId', () => {
    test('should validate correct ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(isValidObjectId(validId)).toBe(true);
    });

    test('should reject invalid ObjectId', () => {
      expect(isValidObjectId('invalid')).toBe(false);
      expect(isValidObjectId('123')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId(null)).toBe(false);
      expect(isValidObjectId(undefined)).toBe(false);
    });

    test('should reject non-string types', () => {
      expect(isValidObjectId(123)).toBe(false);
      expect(isValidObjectId({})).toBe(false);
      expect(isValidObjectId([])).toBe(false);
    });
  });

  describe('getNestedValue', () => {
    test('should get nested value using dot notation', () => {
      const obj = {
        user: {
          profile: {
            name: 'John'
          }
        }
      };

      expect(getNestedValue(obj, 'user.profile.name')).toBe('John');
    });

    test('should return undefined for non-existent path', () => {
      const obj = { user: { profile: {} } };
      expect(getNestedValue(obj, 'user.profile.name')).toBeUndefined();
    });

    test('should return undefined for invalid path', () => {
      const obj = {};
      expect(getNestedValue(obj, 'invalid.path')).toBeUndefined();
    });
  });

  describe('removeNestedField', () => {
    test('should remove nested field', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            email: 'john@example.com'
          }
        }
      };

      removeNestedField(obj, 'user.profile.email');

      expect(obj.user.profile).not.toHaveProperty('email');
      expect(obj.user.profile).toHaveProperty('name');
    });

    test('should remove top-level field', () => {
      const obj = {
        name: 'John',
        email: 'john@example.com'
      };

      removeNestedField(obj, 'email');

      expect(obj).not.toHaveProperty('email');
      expect(obj).toHaveProperty('name');
    });

    test('should clean up empty nested objects', () => {
      const obj = {
        user: {
          profile: {
            name: 'John'
          }
        }
      };

      removeNestedField(obj, 'user.profile.name');

      expect(obj.user.profile).toEqual({});
    });
  });

  describe('cleanObjectIdFields', () => {
    test('should remove empty string ObjectId fields', () => {
      const data = {
        name: 'John',
        referredBy: '',
        agency: {
          agencyId: ''
        }
      };

      const cleaned = cleanObjectIdFields(data);

      expect(cleaned).not.toHaveProperty('referredBy');
      expect(cleaned.agency).not.toHaveProperty('agencyId');
      expect(cleaned).toHaveProperty('name');
    });

    test('should remove null ObjectId fields', () => {
      const data = {
        referredBy: null,
        settings: undefined
      };

      const cleaned = cleanObjectIdFields(data);

      expect(cleaned).not.toHaveProperty('referredBy');
      expect(cleaned).not.toHaveProperty('settings');
    });

    test('should keep valid ObjectId values', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const data = {
        referredBy: validId,
        settings: validId
      };

      const cleaned = cleanObjectIdFields(data);

      expect(cleaned.referredBy).toBe(validId);
      expect(cleaned.settings).toBe(validId);
    });

    test('should handle custom ObjectId fields', () => {
      const data = {
        customField: '',
        anotherField: null
      };

      const cleaned = cleanObjectIdFields(data, ['customField', 'anotherField']);

      expect(cleaned).not.toHaveProperty('customField');
      expect(cleaned).not.toHaveProperty('anotherField');
    });
  });

  describe('validateObjectIdFields', () => {
    test('should validate ObjectId fields correctly', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const data = {
        userId: validId,
        agencyId: validId
      };

      const result = validateObjectIdFields(data, ['userId', 'agencyId']);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for invalid ObjectId fields', () => {
      const data = {
        userId: 'invalid',
        agencyId: '123'
      };

      const result = validateObjectIdFields(data, ['userId', 'agencyId']);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('userId');
      expect(result.errors[1]).toContain('agencyId');
    });

    test('should skip missing fields', () => {
      const data = {
        name: 'John'
      };

      const result = validateObjectIdFields(data, ['userId']);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate nested ObjectId fields', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const data = {
        user: {
          profile: {
            referredBy: validId
          }
        }
      };

      const result = validateObjectIdFields(data, ['user.profile.referredBy']);

      expect(result.isValid).toBe(true);
    });
  });
});

