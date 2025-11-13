const { StartupValidator, createDefaultChecks } = require('../../../utils/startupValidation');

describe('Startup Validation Utility', () => {
  let validator;

  beforeEach(() => {
    validator = new StartupValidator();
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.MONGODB_URI;
    delete process.env.NODE_ENV;
  });

  describe('StartupValidator', () => {
    test('should initialize with empty checks', () => {
      expect(validator.checks).toEqual([]);
      expect(validator.criticalFailures).toEqual([]);
      expect(validator.warnings).toEqual([]);
    });

    test('should add check', () => {
      validator.addCheck('Test Check', () => true, false, 'Test message');
      
      expect(validator.checks).toHaveLength(1);
      expect(validator.checks[0].name).toBe('Test Check');
      expect(validator.checks[0].isCritical).toBe(false);
    });

    test('should run validation and pass', async () => {
      validator.addCheck('Test Check', () => true, false);
      
      const results = await validator.runValidation();
      
      expect(results.passed).toBe(1);
      expect(results.failed).toBe(0);
    });

    test('should run validation and fail', async () => {
      validator.addCheck('Test Check', () => false, false);
      
      const results = await validator.runValidation();
      
      expect(results.passed).toBe(0);
      expect(results.failed).toBe(1);
    });

    test('should handle critical failures', async () => {
      validator.addCheck('Critical Check', () => false, true);
      
      const results = await validator.runValidation();
      
      expect(results.criticalFailures).toBe(1);
      expect(validator.canProceed()).toBe(false);
    });

    test('should handle warnings', async () => {
      validator.addCheck('Warning Check', () => 'Warning message', false);
      
      const results = await validator.runValidation();
      
      expect(results.warnings).toBe(1);
      expect(validator.canProceed()).toBe(true);
    });

    test('should handle errors in check function', async () => {
      validator.addCheck('Error Check', () => {
        throw new Error('Test error');
      }, false);
      
      const results = await validator.runValidation();
      
      expect(results.failed).toBe(1);
    });

    test('should get summary', async () => {
      validator.addCheck('Test Check', () => true, false);
      validator.addCheck('Critical Check', () => false, true);
      
      // Run validation first to populate failures
      await validator.runValidation();
      
      const summary = validator.getSummary();
      
      expect(summary.totalChecks).toBe(2);
      expect(summary.canProceed).toBe(false);
      expect(summary.criticalFailures.length).toBeGreaterThan(0);
    });

    test('should allow proceeding when no critical failures', () => {
      validator.addCheck('Test Check', () => true, false);
      
      expect(validator.canProceed()).toBe(true);
    });
  });

  describe('createDefaultChecks', () => {
    test('should create default checks', () => {
      createDefaultChecks(validator);
      
      expect(validator.checks.length).toBeGreaterThan(0);
    });

    test('should validate JWT Secret', async () => {
      createDefaultChecks(validator);
      await validator.runValidation();
      
      // Should pass with valid JWT_SECRET
      expect(validator.canProceed()).toBe(true);
    });

    test('should fail with short JWT Secret', async () => {
      process.env.JWT_SECRET = 'short';
      createDefaultChecks(validator);
      await validator.runValidation();
      
      expect(validator.canProceed()).toBe(false);
    });

    test('should validate MongoDB URI', async () => {
      createDefaultChecks(validator);
      await validator.runValidation();
      
      expect(validator.canProceed()).toBe(true);
    });

    test('should fail with invalid MongoDB URI', async () => {
      process.env.MONGODB_URI = 'invalid-uri';
      createDefaultChecks(validator);
      await validator.runValidation();
      
      expect(validator.canProceed()).toBe(false);
    });

    test('should validate Node Environment', async () => {
      process.env.NODE_ENV = 'development';
      createDefaultChecks(validator);
      await validator.runValidation();
      
      expect(validator.canProceed()).toBe(true);
    });

    test('should warn for missing optional configurations', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.CLOUDINARY_CLOUD_NAME;
      
      createDefaultChecks(validator);
      const results = await validator.runValidation();
      
      // Should still proceed but with warnings
      expect(validator.canProceed()).toBe(true);
      expect(results.warnings).toBeGreaterThan(0);
    });
  });
});

