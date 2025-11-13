const logger = require('../../../config/logger');
const { createComprehensivePagination } = require('../../../utils/responseHelper');

jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

jest.mock('../../../utils/responseHelper', () => ({
  createComprehensivePagination: jest.fn().mockReturnValue({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
}));

// Import service after mocks (it exports both class and instance)
const { paginationService } = require('../../../services/paginationService');

describe('PaginationService', () => {
  let service;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();
    service = paginationService;
    mockModel = {
      find: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
          })
        })
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
      collection: {
        name: 'test-collection'
      }
    };
    
    // Mock getExecutionStats
    service.getExecutionStats = jest.fn().mockResolvedValue({});
  });

  describe('constructor', () => {
    test('should initialize with performance cache', () => {
      expect(service.performanceCache).toBeDefined();
      expect(service.indexHints).toBeDefined();
    });
  });

  describe('executeOffsetPagination', () => {
    test('should execute offset pagination', async () => {
      const result = await service.executeOffsetPagination(
        mockModel,
        {},
        { limit: 10, skip: 0, sortBy: 'createdAt', sortOrder: 'desc' }
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });
});

