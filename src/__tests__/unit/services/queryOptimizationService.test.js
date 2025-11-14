// logger is mocked below

jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/queryOptimizationService');

describe('QueryOptimizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with query cache', () => {
      expect(service.queryCache).toBeDefined();
      expect(service.cacheTimeout).toBe(5 * 60 * 1000);
      expect(service.maxCacheSize).toBe(1000);
    });
  });

  describe('optimizeFindQuery', () => {
    test('should optimize find query', () => {
      const query = { status: 'active', category: 'cleaning' };
      const result = service.optimizeFindQuery(query);

      expect(result).toBeDefined();
    });
  });

  describe('createOptimizedAggregation', () => {
    test('should create optimized aggregation pipeline', () => {
      const stages = [
        { $match: { status: 'active' } },
        { $group: { _id: '$category' } }
      ];
      const pipeline = service.createOptimizedAggregation(stages, { collection: 'Service' });

      expect(Array.isArray(pipeline)).toBe(true);
      expect(pipeline.length).toBeGreaterThan(0);
    });
  });
});

