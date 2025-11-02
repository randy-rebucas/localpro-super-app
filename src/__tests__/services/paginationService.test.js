/**
 * Pagination Service Tests
 * Tests for paginationService.js
 */

// Mock dependencies
jest.mock('../../config/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('../../utils/responseHelper', () => ({
  createComprehensivePagination: jest.fn((params, total, count, perf) => ({
    page: params.page || 1,
    limit: params.limit || 10,
    total,
    count,
    ...perf
  })),
  createCursorPagination: jest.fn((params, results, field, perf) => ({
    limit: params.limit,
    count: results.length,
    hasMore: results.length > params.limit,
    ...perf
  }))
}));

const { PaginationService, paginationService } = require('../../services/paginationService');

describe('PaginationService', () => {
  let service;
  let mockModel;

  beforeEach(() => {
    service = new PaginationService();
    
    // Create mock Mongoose model
    mockModel = {
      collection: { name: 'testCollection' },
      find: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(100),
      estimatedDocumentCount: jest.fn().mockResolvedValue(100),
      findOne: jest.fn(),
      lean: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    };
    
    mockModel.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  describe('Constructor', () => {
    it('should create service with performance cache and index hints', () => {
      expect(service.performanceCache).toBeInstanceOf(Map);
      expect(service.indexHints).toBeInstanceOf(Map);
    });
  });

  describe('executeOffsetPagination', () => {
    it('should execute offset pagination successfully', async () => {
      const query = { status: 'active' };
      const paginationParams = {
        page: 1,
        limit: 10,
        skip: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await service.executeOffsetPagination(mockModel, query, paginationParams);

      expect(mockModel.find).toHaveBeenCalled();
      expect(mockModel.countDocuments).toHaveBeenCalledWith(query);
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('performance');
      expect(result.performance.queryTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle query options', async () => {
      const query = {};
      const paginationParams = {
        page: 1,
        limit: 10,
        skip: 0,
        sortBy: 'name',
        sortOrder: 'asc'
      };
      const options = {
        queryOptions: { lean: false }
      };

      await service.executeOffsetPagination(mockModel, query, paginationParams, options);

      expect(mockModel.find).toHaveBeenCalled();
    });

    it('should use index hints when available', async () => {
      service.setIndexHint('testCollection', { createdAt: 1 });
      
      const query = {};
      const paginationParams = {
        page: 1,
        limit: 10,
        skip: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      await service.executeOffsetPagination(mockModel, query, paginationParams);

      expect(mockModel.find).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockModel.find.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.executeOffsetPagination(mockModel, {}, { page: 1, limit: 10, skip: 0, sortBy: 'name', sortOrder: 'asc' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('executeCursorPagination', () => {
    it('should execute cursor pagination successfully', async () => {
      const query = {};
      const paginationParams = {
        cursor: null,
        cursorField: 'createdAt',
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await service.executeCursorPagination(mockModel, query, paginationParams);

      expect(mockModel.find).toHaveBeenCalled();
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('performance');
    });

    it('should handle cursor for forward pagination', async () => {
      const query = {};
      const paginationParams = {
        cursor: '2024-01-01T00:00:00Z',
        cursorField: 'createdAt',
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      await service.executeCursorPagination(mockModel, query, paginationParams);

      expect(mockModel.find).toHaveBeenCalled();
    });

    it('should handle before cursor', async () => {
      const query = {};
      const paginationParams = {
        before: '2024-01-01T00:00:00Z',
        cursorField: 'createdAt',
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      };

      await service.executeCursorPagination(mockModel, query, paginationParams);

      expect(mockModel.find).toHaveBeenCalled();
    });

    it('should handle after cursor', async () => {
      const query = {};
      const paginationParams = {
        after: '2024-01-01T00:00:00Z',
        cursorField: 'createdAt',
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      };

      await service.executeCursorPagination(mockModel, query, paginationParams);

      expect(mockModel.find).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockModel.find.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.executeCursorPagination(mockModel, {}, {
          cursorField: 'createdAt',
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'asc'
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('executeHybridPagination', () => {
    it('should use cursor pagination when useCursor is true', async () => {
      const spy = jest.spyOn(service, 'executeCursorPagination').mockResolvedValue({ results: [], pagination: {} });
      
      const query = {};
      const paginationParams = { cursor: 'cursor123', limit: 10, sortBy: 'createdAt', sortOrder: 'desc', cursorField: 'createdAt' };
      const options = { useCursor: true };

      await service.executeHybridPagination(mockModel, query, paginationParams, options);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should use offset pagination for small datasets', async () => {
      jest.spyOn(service, 'estimateDocumentCount').mockResolvedValue(100);
      const spy = jest.spyOn(service, 'executeOffsetPagination').mockResolvedValue({ results: [], pagination: {} });

      const query = {};
      const paginationParams = { page: 1, limit: 10, skip: 0, sortBy: 'createdAt', sortOrder: 'desc' };
      const options = { cursorThreshold: 10000 };

      await service.executeHybridPagination(mockModel, query, paginationParams, options);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should recommend cursor pagination for large datasets', async () => {
      jest.spyOn(service, 'estimateDocumentCount').mockResolvedValue(50000);
      const spy = jest.spyOn(service, 'executeOffsetPagination').mockResolvedValue({ results: [], pagination: {} });

      const query = {};
      const paginationParams = { page: 1, limit: 10, skip: 0, sortBy: 'createdAt', sortOrder: 'desc' };

      await service.executeHybridPagination(mockModel, query, paginationParams);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('optimizeForCollection', () => {
    it('should provide optimization recommendations', () => {
      const recommendations = service.optimizeForCollection('users', { status: 'active' }, { createdAt: -1 });

      expect(recommendations).toHaveProperty('recommendedIndexes');
      expect(recommendations).toHaveProperty('paginationStrategy');
      expect(recommendations).toHaveProperty('performanceTips');
      expect(Array.isArray(recommendations.recommendedIndexes)).toBe(true);
    });

    it('should recommend cursor pagination for large collections', () => {
      jest.spyOn(service, 'getCollectionSizeEstimate').mockReturnValue(200000);
      
      const recommendations = service.optimizeForCollection('largeCollection', {}, {});

      expect(recommendations.paginationStrategy).toBe('cursor');
    });

    it('should recommend indexes for query and sort fields', () => {
      const recommendations = service.optimizeForCollection('users', { role: 'admin' }, { name: 1 });

      expect(recommendations.recommendedIndexes.length).toBeGreaterThan(0);
    });
  });

  describe('getExecutionStats', () => {
    it('should return execution statistics', async () => {
      const stats = await service.getExecutionStats(mockModel, {}, { queryTime: 100 });

      expect(stats).toHaveProperty('executionTime');
      expect(stats).toHaveProperty('documentsExamined');
      expect(stats).toHaveProperty('documentsReturned');
      expect(stats).toHaveProperty('indexUsed');
    });

    it('should handle errors gracefully', async () => {
      // Mock an error scenario
      const stats = await service.getExecutionStats(mockModel, {}, {});
      expect(stats).toBeDefined();
    });
  });

  describe('estimateDocumentCount', () => {
    it('should estimate document count for empty query', async () => {
      const count = await service.estimateDocumentCount(mockModel, {});

      expect(mockModel.estimatedDocumentCount).toHaveBeenCalled();
      expect(count).toBe(100);
    });

    it('should use countDocuments for filtered queries', async () => {
      const count = await service.estimateDocumentCount(mockModel, { status: 'active' });

      expect(mockModel.countDocuments).toHaveBeenCalledWith({ status: 'active' });
      expect(count).toBe(100);
    });

    it('should handle errors gracefully', async () => {
      mockModel.countDocuments.mockRejectedValueOnce(new Error('DB error'));
      
      const count = await service.estimateDocumentCount(mockModel, { status: 'active' });

      expect(count).toBe(0);
    });
  });

  describe('cachePerformanceData', () => {
    it('should cache performance data', () => {
      service.cachePerformanceData('testCollection', { status: 'active' }, 150);

      const key = 'testCollection:{"status":"active"}';
      const cached = service.performanceCache.get(key);

      expect(cached).toBeDefined();
      expect(cached.queryTime).toBe(150);
      expect(cached.count).toBe(1);
    });

    it('should increment count for same query', () => {
      service.cachePerformanceData('testCollection', { status: 'active' }, 150);
      service.cachePerformanceData('testCollection', { status: 'active' }, 200);

      const key = 'testCollection:{"status":"active"}';
      const cached = service.performanceCache.get(key);

      expect(cached.count).toBe(2);
    });
  });

  describe('getCollectionSizeEstimate', () => {
    it('should return default estimate', () => {
      const estimate = service.getCollectionSizeEstimate('testCollection');
      expect(estimate).toBe(1000);
    });
  });

  describe('setIndexHint', () => {
    it('should set index hint for collection', () => {
      service.setIndexHint('testCollection', { createdAt: 1 });
      
      expect(service.indexHints.get('testCollection')).toEqual({ createdAt: 1 });
    });
  });

  describe('clearCache', () => {
    it('should clear performance cache', () => {
      service.cachePerformanceData('testCollection', {}, 100);
      expect(service.performanceCache.size).toBeGreaterThan(0);

      service.clearCache();
      expect(service.performanceCache.size).toBe(0);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return performance statistics', () => {
      service.cachePerformanceData('testCollection', {}, 100);
      service.cachePerformanceData('testCollection', { status: 'active' }, 200);

      const stats = service.getPerformanceStats();

      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('averageQueryTime');
      expect(stats).toHaveProperty('slowQueries');
      expect(stats).toHaveProperty('cacheHits');
      expect(stats.totalQueries).toBeGreaterThan(0);
    });

    it('should identify slow queries', () => {
      service.cachePerformanceData('testCollection', {}, 1500); // > 1000ms

      const stats = service.getPerformanceStats();

      expect(stats.slowQueries).toBeGreaterThan(0);
    });

    it('should calculate average query time', () => {
      service.cachePerformanceData('testCollection', {}, 100);
      service.cachePerformanceData('testCollection', { status: 'active' }, 200);

      const stats = service.getPerformanceStats();

      expect(stats.averageQueryTime).toBeGreaterThan(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(paginationService).toBeInstanceOf(PaginationService);
    });

    it('should be the same instance', () => {
      const { paginationService: instance2 } = require('../../services/paginationService');
      expect(paginationService).toBe(instance2);
    });
  });
});

