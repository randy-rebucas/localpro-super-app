// Mock dependencies first
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../src/config/envValidation', () => ({
  validateEnvironment: jest.fn(),
  getEnvironmentSummary: jest.fn()
}));

jest.mock('../../src/config/databaseTransport', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('mongoose', () => require('../__mocks__/mongoose'));

jest.mock('redis', () => ({
  createClient: jest.fn()
}));

jest.mock('../../src/models/Log', () => ({}));

jest.mock('../../src/services/emailService', () => {
  return jest.fn().mockImplementation(() => ({}));
});

const { StartupValidator } = require('../../src/utils/startupValidation');
const logger = require('../../src/config/logger');
const { validateEnvironment, getEnvironmentSummary } = require('../../src/config/envValidation');

describe('StartupValidator', () => {
  let startupValidator;

  beforeEach(() => {
    startupValidator = new StartupValidator();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with empty validation results and startup checks', () => {
      expect(startupValidator.checks).toEqual([]);
      expect(startupValidator.criticalFailures).toEqual([]);
      expect(startupValidator.warnings).toEqual([]);
    });
  });

  describe('addCheck', () => {
    it('should add a custom startup check', () => {
      const checkFunction = jest.fn();
      
      startupValidator.addCheck('Test Check', checkFunction, true);
      
      expect(startupValidator.checks).toHaveLength(1);
      expect(startupValidator.checks[0]).toEqual({
        name: 'Test Check',
        checkFn: checkFunction,
        isCritical: true,
        message: 'Test Check validation'
      });
    });

    it('should add non-critical check by default', () => {
      const checkFunction = jest.fn();
      
      startupValidator.addCheck('Test Check', checkFunction);
      
      expect(startupValidator.checks[0].isCritical).toBe(false);
    });
  });

  describe('runValidation', () => {
    beforeEach(() => {
      validateEnvironment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });
    });

    it('should run validation checks successfully', async () => {
      const checkFn = jest.fn().mockResolvedValue(true);
      startupValidator.addCheck('Test Check', checkFn, false);
      
      const result = await startupValidator.runValidation();
      
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.criticalFailures).toBe(0);
      expect(checkFn).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const checkFn = jest.fn().mockResolvedValue(false);
      startupValidator.addCheck('Failing Check', checkFn, true);
      
      const result = await startupValidator.runValidation();
      
      expect(result.passed).toBe(0);
      expect(result.criticalFailures).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle validation exceptions', async () => {
      const checkFn = jest.fn().mockRejectedValue(new Error('Validation error'));
      startupValidator.addCheck('Error Check', checkFn, true);
      
      const result = await startupValidator.runValidation();
      
      expect(result.passed).toBe(0);
      expect(result.criticalFailures).toBe(1);
    });
  });

  describe('canProceed', () => {
    it('should return true when no critical failures', () => {
      expect(startupValidator.canProceed()).toBe(true);
    });

    it('should return false when there are critical failures', () => {
      startupValidator.criticalFailures.push('Test failure');
      expect(startupValidator.canProceed()).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return validation summary', () => {
      startupValidator.addCheck('Test Check', jest.fn(), false);
      startupValidator.criticalFailures.push('Critical failure');
      startupValidator.warnings.push('Warning');
      
      const summary = startupValidator.getSummary();
      
      expect(summary.canProceed).toBe(false);
      expect(summary.criticalFailures).toEqual(['Critical failure']);
      expect(summary.warnings).toEqual(['Warning']);
      expect(summary.totalChecks).toBe(1);
    });
  });

});
