/**
 * Tests for startupValidation.js utility
 */

const { StartupValidator, createDefaultChecks } = require('../../utils/startupValidation');

// Mock logger to avoid console output during tests
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('StartupValidator', () => {
  let validator;
  let originalEnv;

  beforeEach(() => {
    validator = new StartupValidator();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should create validator with empty checks', () => {
      expect(validator.checks).toEqual([]);
      expect(validator.criticalFailures).toEqual([]);
      expect(validator.warnings).toEqual([]);
    });
  });

  describe('addCheck', () => {
    it('should add a check to the list', () => {
      validator.addCheck('Test Check', () => true);
      expect(validator.checks.length).toBe(1);
      expect(validator.checks[0].name).toBe('Test Check');
    });

    it('should mark critical checks', () => {
      validator.addCheck('Critical Check', () => true, true);
      expect(validator.checks[0].isCritical).toBe(true);
    });

    it('should use custom message', () => {
      validator.addCheck('Custom', () => true, false, 'Custom message');
      expect(validator.checks[0].message).toBe('Custom message');
    });

    it('should use default message if not provided', () => {
      validator.addCheck('Default', () => true);
      expect(validator.checks[0].message).toBe('Default validation');
    });
  });

  describe('runValidation', () => {
    it('should pass all checks', async () => {
      validator.addCheck('Check 1', () => true);
      validator.addCheck('Check 2', () => true);

      const results = await validator.runValidation();

      expect(results.passed).toBe(2);
      expect(results.failed).toBe(0);
      expect(results.criticalFailures).toBe(0);
      expect(results.warnings).toBe(0);
    });

    it('should handle failing non-critical checks', async () => {
      validator.addCheck('Failing Check', () => false, false);

      const results = await validator.runValidation();

      expect(results.passed).toBe(0);
      expect(results.failed).toBe(1);
      expect(results.criticalFailures).toBe(0);
      expect(validator.warnings).toContain('Failing Check');
    });

    it('should handle failing critical checks', async () => {
      validator.addCheck('Critical Failing', () => false, true);

      const results = await validator.runValidation();

      expect(results.passed).toBe(0);
      expect(results.failed).toBe(0);
      expect(results.criticalFailures).toBe(1);
      expect(validator.criticalFailures).toContain('Critical Failing');
    });

    it('should handle async check functions', async () => {
      validator.addCheck('Async Check', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      });

      const results = await validator.runValidation();

      expect(results.passed).toBe(1);
    });

    it('should handle check functions that throw errors', async () => {
      validator.addCheck('Throwing Check', () => {
        throw new Error('Test error');
      }, false);

      const results = await validator.runValidation();

      expect(results.failed).toBe(1);
      expect(validator.warnings.length).toBeGreaterThan(0);
    });

    it('should handle critical checks that throw errors', async () => {
      validator.addCheck('Critical Throwing', () => {
        throw new Error('Critical error');
      }, true);

      const results = await validator.runValidation();

      expect(results.criticalFailures).toBe(1);
      expect(validator.criticalFailures.length).toBeGreaterThan(0);
    });

    it('should handle check that returns warning string', async () => {
      validator.addCheck('Warning Check', () => 'Warning message', false);

      const results = await validator.runValidation();

      expect(results.warnings).toBe(1);
      expect(validator.warnings).toContain('Warning Check: Warning message');
    });

    it('should return summary with all results', async () => {
      validator.addCheck('Pass', () => true);
      validator.addCheck('Fail', () => false, false);
      validator.addCheck('Critical', () => false, true);

      const results = await validator.runValidation();

      expect(results).toHaveProperty('passed');
      expect(results).toHaveProperty('failed');
      expect(results).toHaveProperty('warnings');
      expect(results).toHaveProperty('criticalFailures');
    });
  });

  describe('canProceed', () => {
    it('should return true when no critical failures', () => {
      expect(validator.canProceed()).toBe(true);
    });

    it('should return false when critical failures exist', async () => {
      validator.addCheck('Critical', () => false, true);
      await validator.runValidation();
      expect(validator.canProceed()).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return summary object', () => {
      const summary = validator.getSummary();
      expect(summary).toHaveProperty('canProceed');
      expect(summary).toHaveProperty('criticalFailures');
      expect(summary).toHaveProperty('warnings');
      expect(summary).toHaveProperty('totalChecks');
    });

    it('should reflect current state', async () => {
      validator.addCheck('Test', () => true);
      validator.addCheck('Critical', () => false, true);
      await validator.runValidation();

      const summary = validator.getSummary();
      expect(summary.canProceed).toBe(false);
      expect(summary.criticalFailures.length).toBe(1);
      expect(summary.totalChecks).toBe(2);
    });
  });

  describe('createDefaultChecks', () => {
    beforeEach(() => {
      // Set minimal required env vars for tests
      process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation-12345';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.NODE_ENV = 'test';
    });

    it('should add default checks to validator', () => {
      createDefaultChecks(validator);
      expect(validator.checks.length).toBeGreaterThan(0);
    });

    it('should validate JWT_SECRET as critical', async () => {
      process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation-12345';
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      // JWT check should pass with valid secret
      expect(results.criticalFailures).toBe(0);
    });

    it('should fail JWT_SECRET check if too short', async () => {
      process.env.JWT_SECRET = 'short';
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      expect(results.criticalFailures).toBeGreaterThan(0);
    });

    it('should validate MONGODB_URI as critical', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      createDefaultChecks(validator);
      expect(validator.checks.some(c => c.name === 'MongoDB URI')).toBe(true);
    });

    it('should fail MONGODB_URI check if invalid format', async () => {
      process.env.MONGODB_URI = 'invalid-uri';
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      expect(results.criticalFailures).toBeGreaterThan(0);
    });

    it('should validate NODE_ENV as non-critical', async () => {
      process.env.NODE_ENV = 'development';
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      // Should pass or warn, not critical
      expect(results.criticalFailures).toBe(0);
    });

    it('should warn if NODE_ENV not set', async () => {
      delete process.env.NODE_ENV;
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      // Should generate a warning
      expect(results.warnings).toBeGreaterThan(0);
    });

    it('should check Twilio configuration as optional', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_VERIFY_SERVICE_SID;
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      // Should warn but not fail critically
      expect(results.criticalFailures).toBe(0);
    });

    it('should check PayPal configuration as optional', async () => {
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      expect(results.criticalFailures).toBe(0);
    });

    it('should validate port configuration', async () => {
      process.env.PORT = '5000';
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      expect(results.criticalFailures).toBe(0);
    });

    it('should fail invalid port number', async () => {
      process.env.PORT = '99999'; // Invalid port
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      expect(results.failed).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete setup', async () => {
      process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation-12345';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.NODE_ENV = 'test';
      
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      const summary = validator.getSummary();
      
      expect(summary.canProceed).toBe(true);
      expect(results.criticalFailures).toBe(0);
    });
  });
});

