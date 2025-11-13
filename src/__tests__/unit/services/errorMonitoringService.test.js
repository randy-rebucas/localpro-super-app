const logger = require('../../../config/logger');

// Track instances created by the mock constructor
let mockInstances = [];

jest.mock('mongoose', () => {
  const mockSchemaInstance = {
    index: jest.fn().mockReturnThis()
  };
  const mockSchema = jest.fn().mockImplementation(() => mockSchemaInstance);
  mockSchema.Types = {
    ObjectId: String,
    Mixed: Object,
    String: String
  };
  
  // Create mock model constructor
  function MockErrorTracking(data) {
    // Reset instances array for each test
    if (!mockInstances) mockInstances = [];
    
    // Copy all properties from data to this first
    if (data) {
      Object.keys(data).forEach(key => {
        this[key] = data[key];
      });
    }
    
    // Ensure required properties exist with defaults if not provided
    this.occurrences = data?.occurrences ?? 1;
    this.severity = data?.severity ?? 'low';
    this.errorType = data?.errorType ?? 'application';
    this.errorId = data?.errorId ?? 'test-error-id';
    this.message = data?.message ?? 'Test error';
    this.environment = data?.environment ?? 'development';
    this.metadata = data?.metadata ?? {};
    this.firstOccurred = data?.firstOccurred ?? new Date();
    this.lastOccurred = data?.lastOccurred ?? new Date();
    
    // Mock save method that returns the instance
    const self = this;
    this.save = jest.fn().mockImplementation(async function() {
      return Promise.resolve(self);
    });
    
    mockInstances.push(this);
  }
  
  // Add static methods
  MockErrorTracking.findOne = jest.fn();
  MockErrorTracking.find = jest.fn();
  MockErrorTracking.aggregate = jest.fn();
  MockErrorTracking.findOneAndUpdate = jest.fn();
  
  return {
    Schema: mockSchema,
    connection: {
      model: jest.fn()
    },
    model: jest.fn((modelName, schema) => {
      // Handle both cases: model(name) and model(name, schema)
      if (modelName === 'ErrorTracking') {
        return MockErrorTracking;
      }
      // Return the mock for any model name
      return MockErrorTracking;
    })
  };
});

jest.mock('../../../config/logger', () => ({
  error: jest.fn().mockImplementation(() => {}),
  warn: jest.fn().mockImplementation(() => {}),
  info: jest.fn().mockImplementation(() => {}),
  logError: jest.fn().mockImplementation(() => {})
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/errorMonitoringService');

describe('ErrorMonitoringService', () => {
  const mongoose = require('mongoose');
  let ErrorTracking;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockInstances = [];
    
    // Get the mock model
    ErrorTracking = mongoose.model('ErrorTracking');
    
    ErrorTracking.findOne.mockResolvedValue(null);
    ErrorTracking.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      })
    });
    ErrorTracking.aggregate.mockResolvedValue([]);
    logger.logError.mockImplementation(() => {});
  });

  describe('trackError', () => {
    test('should track error', async () => {
      const mockError = new Error('Test error');
      mockError.name = 'TestError';
      mockError.stack = 'Error: Test error\n    at test';
      
      // Mock that no existing error is found, so a new one will be created
      ErrorTracking.findOne.mockResolvedValue(null);
      
      // Verify the mock is set up correctly
      expect(ErrorTracking).toBeDefined();
      expect(ErrorTracking.findOne).toBeDefined();
      expect(typeof ErrorTracking).toBe('function'); // Should be a constructor

      const result = await service.trackError(mockError);

      expect(result).toBeDefined();
      expect(ErrorTracking.findOne).toHaveBeenCalled();
      if (result) {
        expect(result).toHaveProperty('errorId');
        expect(result).toHaveProperty('severity');
        expect(result).toHaveProperty('occurrences');
      }
    });
  });

  describe('getErrorStats', () => {
    test('should get error statistics', async () => {
      ErrorTracking.aggregate.mockResolvedValue([
        { _id: 'application', count: 10 }
      ]);

      const result = await service.getErrorStats('24h');

      expect(result).toBeDefined();
      expect(ErrorTracking.aggregate).toHaveBeenCalled();
    });
  });
});
