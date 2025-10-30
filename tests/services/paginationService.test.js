const { PaginationService } = require('../../src/services/paginationService');
const mongoose = require('mongoose');

// Mock Mongoose model
const mockModel = {
  collection: { name: 'test' },
  find: jest.fn(),
  countDocuments: jest.fn(),
  estimatedDocumentCount: jest.fn()
};

describe('PaginationService', () => {
  let paginationService;

  beforeEach(() => {
    paginationService = new PaginationService();
    jest.clearAllMocks();
  });

  describe('executeOffsetPagination', () => {
    it('should execute offset pagination successfully', async () => {
      const mockResults = [{ _id: '1', name: 'Test 1' }, { _id: '2', name: 'Test 2' }];
      const mockTotal = 50;

      mockModel.find.mockResolvedValue(mockResults);
      mockModel.countDocuments.mockResolvedValue(mockTotal);

      const paginationParams = {
        page: 2,
        limit: 10,
        skip: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await paginationService.executeOffsetPagination(
        mockModel,
        { status: 'active' },
        paginationParams
      );

      expect(result.results).toEqual(mockResults);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
      expect(result.performance.queryTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty results', async () => {
      mockModel.find.mockResolvedValue([]);
      mockModel.countDocuments.mockResolvedValue(0);

      const paginationParams = {
        page: 1,
        limit: 10,
        skip: 0,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await paginationService.executeOffsetPagination(
        mockModel,
        { status: 'active' },
        paginationParams
      );

      expect(result.results).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('executeCursorPagination', () => {
    it('should execute cursor pagination successfully', async () => {
      const mockResults = [
        { _id: '1', name: 'Test 1', createdAt: new Date('2023-01-02') },
        { _id: '2', name: 'Test 2', createdAt: new Date('2023-01-01') }
      ];

      mockModel.find.mockResolvedValue(mockResults);

      const paginationParams = {
        cursor: '2023-01-03T00:00:00.000Z',
        limit: 10,
        cursorField: 'createdAt',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await paginationService.executeCursorPagination(
        mockModel,
        { status: 'active' },
        paginationParams
      );

      expect(result.results).toEqual(mockResults);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.count).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.cursor).toBe('2023-01-03T00:00:00.000Z');
      expect(result.pagination.nextCursor).toBe(null);
    });

    it('should handle hasMore correctly', async () => {
      const mockResults = [
        { _id: '1', name: 'Test 1', createdAt: new Date('2023-01-02') },
        { _id: '2', name: 'Test 2', createdAt: new Date('2023-01-01') },
        { _id: '3', name: 'Test 3', createdAt: new Date('2022-12-31') }
      ];

      mockModel.find.mockResolvedValue(mockResults);

      const paginationParams = {
        cursor: '2023-01-03T00:00:00.000Z',
        limit: 2,
        cursorField: 'createdAt',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await paginationService.executeCursorPagination(
        mockModel,
        { status: 'active' },
        paginationParams
      );

      expect(result.results).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('executeHybridPagination', () => {
    it('should use offset pagination for small datasets', async () => {
      const mockResults = [{ _id: '1', name: 'Test 1' }];
      const mockTotal = 50;

      mockModel.find.mockResolvedValue(mockResults);
      mockModel.countDocuments.mockResolvedValue(mockTotal);

      const paginationParams = {
        page: 1,
        limit: 10,
        skip: 0,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await paginationService.executeHybridPagination(
        mockModel,
        { status: 'active' },
        paginationParams,
        { cursorThreshold: 1000 }
      );

      expect(result.results).toEqual(mockResults);
      expect(result.pagination.page).toBe(1);
    });

    it('should use cursor pagination when explicitly requested', async () => {
      const mockResults = [{ _id: '1', name: 'Test 1', createdAt: new Date() }];

      mockModel.find.mockResolvedValue(mockResults);

      const paginationParams = {
        cursor: '2023-01-01T00:00:00.000Z',
        limit: 10,
        cursorField: 'createdAt',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await paginationService.executeHybridPagination(
        mockModel,
        { status: 'active' },
        paginationParams,
        { useCursor: true }
      );

      expect(result.results).toEqual(mockResults);
      expect(result.pagination.cursor).toBe('2023-01-01T00:00:00.000Z');
    });
  });

  describe('optimizeForCollection', () => {
    it('should provide optimization recommendations', () => {
      const query = { status: 'active', category: 'test' };
      const sort = { createdAt: -1 };

      const recommendations = paginationService.optimizeForCollection('test', query, sort);

      expect(recommendations).toHaveProperty('recommendedIndexes');
      expect(recommendations).toHaveProperty('paginationStrategy');
      expect(recommendations).toHaveProperty('performanceTips');
      expect(recommendations.recommendedIndexes).toContainEqual({
        status: 'active',
        category: 'test',
        createdAt: -1
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should cache performance data', () => {
      const collectionName = 'test';
      const query = { status: 'active' };
      const queryTime = 100;

      paginationService.cachePerformanceData(collectionName, query, queryTime);

      const stats = paginationService.getPerformanceStats();
      expect(stats.totalQueries).toBe(1);
      expect(stats.averageQueryTime).toBe(100);
    });

    it('should track slow queries', () => {
      const collectionName = 'test';
      const query = { status: 'active' };
      const queryTime = 1500; // Slow query

      paginationService.cachePerformanceData(collectionName, query, queryTime);

      const stats = paginationService.getPerformanceStats();
      expect(stats.slowQueries).toBe(1);
    });

    it('should clear cache', () => {
      paginationService.cachePerformanceData('test', {}, 100);
      expect(paginationService.getPerformanceStats().totalQueries).toBe(1);

      paginationService.clearCache();
      expect(paginationService.getPerformanceStats().totalQueries).toBe(0);
    });
  });

  describe('Index Hints', () => {
    it('should set and use index hints', () => {
      const collectionName = 'test';
      const hint = { status: 1, createdAt: -1 };

      paginationService.setIndexHint(collectionName, hint);
      expect(paginationService.indexHints.get(collectionName)).toEqual(hint);
    });
  });
});
