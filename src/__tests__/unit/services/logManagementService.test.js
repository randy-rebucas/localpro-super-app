const Log = require('../../../models/Log');

jest.mock('../../../models/Log');
jest.mock('../../../config/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/logManagementService');

describe('LogManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with retention policies', () => {
      expect(service.retentionPolicies).toBeDefined();
      expect(service.retentionPolicies.error).toBe(90);
      expect(service.retentionPolicies.audit).toBe(2555);
    });
  });

  describe('getLogStatistics', () => {
    test('should get log statistics', async () => {
      Log.getLogStats = jest.fn().mockResolvedValue([
        { level: 'info', totalCount: 10 },
        { level: 'error', totalCount: 2 }
      ]);
      Log.getErrorStats = jest.fn().mockResolvedValue([
        { level: 'error', count: 2 }
      ]);
      Log.getPerformanceStats = jest.fn().mockResolvedValue({});
      Log.aggregate = jest.fn().mockResolvedValue([
        { _id: 'audit', count: 5 }
      ]);

      const result = await service.getLogStatistics('24h');

      expect(result).toBeDefined();
      expect(result.timeframe).toBe('24h');
      expect(result.summary).toBeDefined();
    });
  });
});

