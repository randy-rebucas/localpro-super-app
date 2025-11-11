const { validateEnvironment, getEnvironmentSummary, ENV_SCHEMA } = require('../../../config/envValidation');

// Mock logger to avoid console output during tests
jest.mock('../../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set minimal required env vars for tests
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5000';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
    process.env.EMAIL_SERVICE = 'resend';
    process.env.FROM_EMAIL = 'test@example.com';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.GOOGLE_MAPS_API_KEY = 'test-maps-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('ENV_SCHEMA', () => {
    test('should export ENV_SCHEMA', () => {
      expect(ENV_SCHEMA).toBeDefined();
      expect(typeof ENV_SCHEMA).toBe('object');
    });

    test('should have required environment variables defined', () => {
      const requiredVars = [
        'NODE_ENV',
        'PORT',
        'FRONTEND_URL',
        'MONGODB_URI',
        'JWT_SECRET',
        'EMAIL_SERVICE',
        'FROM_EMAIL',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'GOOGLE_MAPS_API_KEY'
      ];

      requiredVars.forEach(varName => {
        expect(ENV_SCHEMA[varName]).toBeDefined();
        expect(ENV_SCHEMA[varName].required).toBe(true);
      });
    });
  });

  describe('validateEnvironment', () => {
    test('should be a function', () => {
      expect(typeof validateEnvironment).toBe('function');
    });

    test('should return validation result object', () => {
      const result = validateEnvironment();
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should validate successfully with all required variables', () => {
      // Add RESEND_API_KEY since EMAIL_SERVICE is set to 'resend'
      process.env.RESEND_API_KEY = 're_test_key';
      
      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should fail validation when required variable is missing', () => {
      delete process.env.MONGODB_URI;
      
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('MONGODB_URI'))).toBe(true);
    });

    test('should validate NODE_ENV valid values', () => {
      const validValues = ['development', 'production', 'test'];
      
      validValues.forEach(value => {
        process.env.NODE_ENV = value;
        const result = validateEnvironment();
        // Should not have errors for NODE_ENV validation
        expect(result.errors.filter(e => e.includes('NODE_ENV')).length).toBe(0);
      });
    });

    test('should fail validation for invalid NODE_ENV', () => {
      process.env.NODE_ENV = 'invalid';
      
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('NODE_ENV'))).toBe(true);
    });

    test('should validate PORT as number', () => {
      process.env.PORT = '5000';
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('PORT')).length).toBe(0);
    });

    test('should fail validation for invalid PORT', () => {
      process.env.PORT = 'invalid';
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
    });

    test('should validate JWT_SECRET minimum length', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('JWT_SECRET')).length).toBe(0);
    });

    test('should fail validation for JWT_SECRET too short', () => {
      process.env.JWT_SECRET = 'short';
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
    });

    test('should validate email format for FROM_EMAIL', () => {
      process.env.FROM_EMAIL = 'valid@example.com';
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('FROM_EMAIL')).length).toBe(0);
    });

    test('should fail validation for invalid email format', () => {
      process.env.FROM_EMAIL = 'invalid-email';
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
    });

    test('should validate URL format for FRONTEND_URL', () => {
      process.env.FRONTEND_URL = 'https://example.com';
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('FRONTEND_URL')).length).toBe(0);
    });

    test('should validate MongoDB URI pattern', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      const result = validateEnvironment();
      expect(result.errors.filter(e => e.includes('MONGODB_URI')).length).toBe(0);
    });

    test('should validate conditional requirements for email service', () => {
      process.env.EMAIL_SERVICE = 'resend';
      delete process.env.RESEND_API_KEY;
      
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('RESEND_API_KEY'))).toBe(true);
    });

    test('should validate conditional requirements for PayPal', () => {
      process.env.PAYPAL_CLIENT_ID = 'test-id';
      delete process.env.PAYPAL_CLIENT_SECRET;
      
      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('PAYPAL_CLIENT_SECRET'))).toBe(true);
    });

    test('should show warnings for production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short'; // Less than 64 chars
      
      const result = validateEnvironment();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('JWT_SECRET'))).toBe(true);
    });
  });

  describe('getEnvironmentSummary', () => {
    test('should be a function', () => {
      expect(typeof getEnvironmentSummary).toBe('function');
    });

    test('should return environment summary object', () => {
      const summary = getEnvironmentSummary();
      
      expect(summary).toHaveProperty('environment');
      expect(summary).toHaveProperty('port');
      expect(summary).toHaveProperty('database');
      expect(summary).toHaveProperty('email');
      expect(summary).toHaveProperty('fileUpload');
      expect(summary).toHaveProperty('maps');
      expect(summary).toHaveProperty('payments');
      expect(summary).toHaveProperty('sms');
    });

    test('should correctly identify configured services', () => {
      process.env.RESEND_API_KEY = 'test-key';
      process.env.PAYPAL_CLIENT_ID = 'test-id';
      process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
      
      const summary = getEnvironmentSummary();
      
      expect(summary.email.configured).toBe(true);
      expect(summary.payments.paypal).toBe(true);
    });

    test('should correctly identify unconfigured services', () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;
      
      const summary = getEnvironmentSummary();
      
      expect(summary.email.configured).toBe(false);
      expect(summary.payments.paypal).toBe(false);
    });
  });
});

