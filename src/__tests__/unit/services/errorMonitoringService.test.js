const mongoose = require('mongoose');
const logger = require('../../../config/logger');

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
  
  return {
    Schema: mockSchema,
    connection: {
      model: jest.fn()
    },
    model: jest.fn()
  };
});

jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/errorMonitoringService');

describe('ErrorMonitoringService', () => {
  let mockErrorTracking;

  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorTracking = {
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      }),
      aggregate: jest.fn().mockResolvedValue([])
    };
    mongoose.connection.model = jest.fn().mockReturnValue(mockErrorTracking);
  });

  describe('trackError', () => {
    test('should track error', async () => {
      const mockError = new Error('Test error');
      mockError.name = 'TestError';
      
      mockErrorTracking.create.mockResolvedValue({
        _id: 'error123',
        errorId: 'test-error-id'
      });

      const result = await service.trackError(mockError);

      expect(result).toBeDefined();
    });
  });

  describe('getErrorStats', () => {
    test('should get error statistics', async () => {
      mockErrorTracking.aggregate.mockResolvedValue([
        { _id: 'application', count: 10 }
      ]);

      const result = await service.getErrorStats('24h');

      expect(result).toBeDefined();
    });
  });
});

