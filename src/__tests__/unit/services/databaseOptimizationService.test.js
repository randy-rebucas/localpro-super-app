const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    db: {
      admin: jest.fn().mockReturnValue({
        currentOp: jest.fn().mockResolvedValue({ inprog: [] })
      }),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
    }
  }
}));

jest.mock('../../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/databaseOptimizationService');

describe('DatabaseOptimizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with performance metrics', () => {
      expect(service.performanceMetrics).toBeDefined();
      expect(service.performanceMetrics.slowQueries).toEqual([]);
      expect(service.performanceMetrics.missingIndexes).toEqual([]);
    });
  });

  describe('analyzeQueryPerformance', () => {
    test('should analyze query performance', async () => {
      const result = await service.analyzeQueryPerformance();

      expect(result).toBeDefined();
      expect(result.slowOperations).toBeDefined();
    });

    test('should throw error when database not connected', async () => {
      mongoose.connection.readyState = 0;

      await expect(service.analyzeQueryPerformance()).rejects.toThrow('Database not connected');
    });
  });

  describe('getSampleQueries', () => {
    test('should return empty array for sample queries', async () => {
      const result = await service.getSampleQueries('test-collection');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});

