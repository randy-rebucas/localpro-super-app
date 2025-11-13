const mongoose = require('mongoose');
const logger = require('../../../config/logger');

jest.mock('mongoose', () => ({
  connection: {
    on: jest.fn(),
    readyState: 1,
    db: {
      admin: jest.fn().mockReturnValue({
        serverStatus: jest.fn().mockResolvedValue({
          connections: { current: 5, available: 10 }
        })
      })
    }
  },
  Query: {
    prototype: {
      exec: jest.fn(),
      find: jest.fn(),
      distinct: jest.fn()
    }
  },
  Aggregate: {
    prototype: {
      exec: jest.fn()
    }
  }
}));

jest.mock('../../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Import service after mocks (it's exported as an instance)
const monitor = require('../../../services/databasePerformanceMonitor');

describe('DatabasePerformanceMonitor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    test('should initialize with query stats', () => {
      expect(monitor.queryStats).toBeDefined();
      expect(monitor.slowQueries).toEqual([]);
      expect(monitor.connectionStats).toBeDefined();
    });
  });

  describe('updateConnectionStats', () => {
    test('should update connection statistics', async () => {
      await monitor.updateConnectionStats();

      expect(monitor.connectionStats).toBeDefined();
    });
  });

  describe('getQueryStats', () => {
    test('should get query statistics', () => {
      const stats = monitor.getQueryStats();

      expect(stats).toBeDefined();
    });
  });
});

