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

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  Schema: jest.fn().mockImplementation(() => ({
    virtual: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    index: jest.fn().mockReturnThis(),
    statics: {},
    methods: {}
  })),
  model: jest.fn()
}));

jest.mock('redis', () => ({
  createClient: jest.fn()
}));

jest.mock('../../src/models/Log', () => ({}));

jest.mock('../../src/services/emailService', () => {
  return jest.fn().mockImplementation(() => ({}));
});

const StartupValidator = require('../../src/utils/startupValidation');
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
      expect(startupValidator.validationResults).toBeNull();
      expect(startupValidator.startupChecks).toEqual([]);
    });
  });

  describe('addCheck', () => {
    it('should add a custom startup check', () => {
      const checkFunction = jest.fn();
      
      startupValidator.addCheck('Test Check', checkFunction, true);
      
      expect(startupValidator.startupChecks).toHaveLength(1);
      expect(startupValidator.startupChecks[0]).toEqual({
        name: 'Test Check',
        checkFunction,
        isCritical: true,
        result: null
      });
    });

    it('should add non-critical check by default', () => {
      const checkFunction = jest.fn();
      
      startupValidator.addCheck('Test Check', checkFunction);
      
      expect(startupValidator.startupChecks[0].isCritical).toBe(true);
    });
  });

  describe('validateEnvironmentVariables', () => {
    beforeEach(() => {
      validateEnvironment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });
    });

    it('should validate environment variables successfully', async () => {
      const result = await startupValidator.validateEnvironmentVariables();
      
      expect(result).toBe(true);
      expect(validateEnvironment).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('🔍 Validating environment variables...');
      expect(logger.info).toHaveBeenCalledWith('✅ Environment variables validated successfully');
    });

    it('should handle validation errors', async () => {
      validateEnvironment.mockReturnValue({
        isValid: false,
        errors: ['Missing required variable: DATABASE_URL'],
        warnings: ['Optional variable not set: REDIS_URL']
      });

      const result = await startupValidator.validateEnvironmentVariables();
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('❌ Environment validation failed');
      expect(logger.error).toHaveBeenCalledWith('  Missing required variable: DATABASE_URL');
      expect(logger.warn).toHaveBeenCalledWith('⚠️  Environment validation warnings:');
      expect(logger.warn).toHaveBeenCalledWith('  Optional variable not set: REDIS_URL');
    });

    it('should handle validation exceptions', async () => {
      validateEnvironment.mockImplementation(() => {
        throw new Error('Validation error');
      });

      const result = await startupValidator.validateEnvironmentVariables();
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('❌ Environment validation error:', expect.any(Error));
    });
  });

  describe('testDatabaseConnection', () => {
    it('should test database connection successfully', async () => {
      const mockMongoose = require('mongoose');
      const mockConnection = {
        connection: { host: 'localhost' }
      };
      
      mockMongoose.connect.mockResolvedValue(mockConnection);

      const result = await startupValidator.testDatabaseConnection();
      
      expect(result).toBe(true);
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app',
        {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        }
      );
      expect(logger.info).toHaveBeenCalledWith('🔍 Testing database connection...');
      expect(logger.info).toHaveBeenCalledWith('✅ Database connected successfully: localhost');
    });

    it('should handle database connection failure', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await startupValidator.testDatabaseConnection();
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('❌ Database connection failed:', 'Connection failed');
    });
  });

  describe('testRedisConnection', () => {
    it('should skip Redis test when not configured', async () => {
      delete process.env.REDIS_URL;

      const result = await startupValidator.testRedisConnection();
      
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('ℹ️  Redis not configured, skipping Redis connectivity test');
    });

    it('should test Redis connection successfully', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      const mockRedis = require('redis');
      const mockClient = {
        connect: jest.fn().mockResolvedValue(),
        ping: jest.fn().mockResolvedValue('PONG'),
        disconnect: jest.fn().mockResolvedValue()
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const result = await startupValidator.testRedisConnection();
      
      expect(result).toBe(true);
      expect(mockRedis.createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379'
      });
      expect(logger.info).toHaveBeenCalledWith('🔍 Testing Redis connection...');
      expect(logger.info).toHaveBeenCalledWith('✅ Redis connected successfully');
    });

    it('should handle Redis connection failure gracefully', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      const mockRedis = require('redis');
      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
      };
      mockRedis.createClient.mockReturnValue(mockClient);

      const result = await startupValidator.testRedisConnection();
      
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith('⚠️  Redis connection failed:', 'Redis connection failed');
      expect(logger.warn).toHaveBeenCalledWith('  Application will continue without Redis caching');
    });
  });

  describe('testExternalServices', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.EMAIL_SERVICE = 'resend';
      process.env.RESEND_API_KEY = 'test-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';
      process.env.GOOGLE_MAPS_API_KEY = 'test-maps-key';
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.PAYPAL_CLIENT_ID = 'test-paypal-id';
      process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-secret';
      process.env.PAYMAYA_PUBLIC_KEY = 'test-paymaya-public';
      process.env.PAYMAYA_SECRET_KEY = 'test-paymaya-secret';
    });

    it('should test all external services', async () => {
      const results = await startupValidator.testExternalServices();
      
      expect(results).toEqual({
        email: true,
        cloudinary: true,
        googleMaps: true,
        twilio: true,
        paypal: true,
        paymaya: true
      });
    });

    it('should handle missing service configurations', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.GOOGLE_MAPS_API_KEY;

      const results = await startupValidator.testExternalServices();
      
      expect(results.email).toBe(false);
      expect(results.cloudinary).toBe(false);
      expect(results.googleMaps).toBe(false);
    });
  });

  describe('runAllChecks', () => {
    beforeEach(() => {
      validateEnvironment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      });
      
      getEnvironmentSummary.mockReturnValue({
        environment: 'test',
        port: 3000,
        database: { configured: true },
        email: { service: 'resend', configured: true },
        fileUpload: { configured: true },
        maps: { configured: true },
        payments: { paypal: true, paymaya: true },
        sms: { configured: true },
        cache: { configured: true }
      });
      
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValue({
        connection: { host: 'localhost' }
      });
    });

    it('should run all checks successfully', async () => {
      const results = await startupValidator.runAllChecks();
      
      expect(results.overall).toBe(true);
      expect(results.environment).toBe(true);
      expect(results.database).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('🚀 Starting application startup validation...');
    });

    it('should handle environment validation failure', async () => {
      validateEnvironment.mockReturnValue({
        isValid: false,
        errors: ['Missing required variable'],
        warnings: []
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      getEnvironmentSummary.mockReturnValue({ environment: 'test' });

      const results = await startupValidator.runAllChecks();
      
      expect(results.overall).toBe(false);
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should handle database connection failure', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockRejectedValue(new Error('Database connection failed'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      getEnvironmentSummary.mockReturnValue({ environment: 'test' });

      const results = await startupValidator.runAllChecks();
      
      expect(results.overall).toBe(false);
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should run custom checks', async () => {
      const customCheck = jest.fn().mockResolvedValue(true);
      startupValidator.addCheck('Custom Check', customCheck, false);

      const results = await startupValidator.runAllChecks();
      
      expect(customCheck).toHaveBeenCalled();
      expect(results.customChecks['Custom Check']).toEqual({
        passed: true,
        critical: false
      });
    });

    it('should handle custom check failures', async () => {
      const customCheck = jest.fn().mockResolvedValue(false);
      startupValidator.addCheck('Failing Check', customCheck, true);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      getEnvironmentSummary.mockReturnValue({ environment: 'test' });

      const results = await startupValidator.runAllChecks();
      
      expect(results.overall).toBe(false);
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('getResults', () => {
    it('should return validation results', () => {
      const mockResults = { isValid: true };
      startupValidator.validationResults = mockResults;
      
      expect(startupValidator.getResults()).toBe(mockResults);
    });
  });
});
