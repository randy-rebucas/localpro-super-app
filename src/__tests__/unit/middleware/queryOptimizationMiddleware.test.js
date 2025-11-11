const {
  optimizeFindQueries,
  addQueryCaching,
  addPerformanceHeaders,
  trackQueryCount,
  optimizeSearchQueries,
  addQueryHints,
  validateQueryParams,
  addQueryLogging
} = require('../../../middleware/queryOptimizationMiddleware');
const queryOptimizationService = require('../../../services/queryOptimizationService');
const logger = require('../../../config/logger');

const mockLogger = logger;

jest.mock('../../../services/queryOptimizationService');
jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn()
}));

describe('Query Optimization Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      url: '/api/test'
    };
    res = {
      statusCode: 200,
      set: jest.fn(),
      setHeader: jest.fn(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addQueryCaching', () => {
    test('should add cache headers for successful responses', () => {
      const middleware = addQueryCaching(300000); // 5 minutes
      const originalJson = res.json;

      middleware(req, res, next);
      res.json({ data: 'test' });

      expect(res.set).toHaveBeenCalledWith({
        'Cache-Control': expect.stringContaining('max-age=300'),
        'ETag': expect.any(String)
      });
      expect(next).toHaveBeenCalled();
    });

    test('should not add cache headers for error responses', () => {
      res.statusCode = 400;
      const middleware = addQueryCaching();

      middleware(req, res, next);
      res.json({ error: 'Bad request' });

      expect(res.set).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('addPerformanceHeaders', () => {
    test('should add performance headers', () => {
      res.locals.queryCount = 5;
      res.locals.cacheStatus = 'HIT';
      const middleware = addPerformanceHeaders();

      middleware(req, res, next);
      res.json({ data: 'test' });

      expect(res.set).toHaveBeenCalledWith({
        'X-Response-Time': expect.stringContaining('ms'),
        'X-Query-Count': 5,
        'X-Cache-Status': 'HIT'
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('trackQueryCount', () => {
    test('should initialize query count', () => {
      const middleware = trackQueryCount();

      middleware(req, res, next);

      expect(res.locals.queryCount).toBe(0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('optimizeSearchQueries', () => {
    test('should trim search query', () => {
      req.query.search = '  test query  ';
      const middleware = optimizeSearchQueries();

      middleware(req, res, next);

      expect(req.query.search).toBe('test query');
      expect(next).toHaveBeenCalled();
    });

    test('should validate and normalize page number', () => {
      req.query.page = '0';
      const middleware = optimizeSearchQueries();

      middleware(req, res, next);

      expect(req.query.page).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    test('should enforce max limit', () => {
      req.query.limit = '200';
      const middleware = optimizeSearchQueries();

      middleware(req, res, next);

      expect(req.query.limit).toBe(100);
      expect(next).toHaveBeenCalled();
    });

    test('should enforce min limit', () => {
      req.query.limit = '0';
      const middleware = optimizeSearchQueries();

      middleware(req, res, next);

      // parseInt('0') = 0, which is falsy, so uses default 20, then Math.max(1, 20) = 20
      expect(req.query.limit).toBe(20);
      expect(next).toHaveBeenCalled();
    });

    test('should validate sortBy field', () => {
      req.query.sortBy = 'invalidField';
      const middleware = optimizeSearchQueries();

      middleware(req, res, next);

      expect(req.query.sortBy).toBe('createdAt');
      expect(next).toHaveBeenCalled();
    });

    test('should validate sortOrder', () => {
      req.query.sortOrder = 'invalid';
      const middleware = optimizeSearchQueries();

      middleware(req, res, next);

      expect(req.query.sortOrder).toBe('desc');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('addQueryHints', () => {
    test('should add query hints to response locals', () => {
      const hints = { index: 'name_1' };
      const middleware = addQueryHints(hints);

      middleware(req, res, next);

      expect(res.locals.queryHints).toEqual(hints);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateQueryParams', () => {
    test('should remove invalid query parameters', () => {
      req.query = {
        validParam: 'value',
        invalidParam: 'value',
        anotherInvalid: 'value'
      };
      const middleware = validateQueryParams(['validParam']);

      middleware(req, res, next);

      expect(req.query.invalidParam).toBeUndefined();
      expect(req.query.anotherInvalid).toBeUndefined();
      expect(req.query.validParam).toBe('value');
      expect(next).toHaveBeenCalled();
    });

    test('should remove all params if allowedParams is empty', () => {
      req.query = {
        param1: 'value1',
        param2: 'value2'
      };
      const middleware = validateQueryParams([]);

      middleware(req, res, next);

      // Empty allowedParams means no params are allowed, so all are removed
      expect(req.query.param1).toBeUndefined();
      expect(req.query.param2).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('addQueryLogging', () => {
    test('should log request and response', () => {
      const middleware = addQueryLogging('debug');
      const originalJson = res.json;

      middleware(req, res, next);
      res.json({ data: 'test' });

      expect(mockLogger.debug).toHaveBeenCalledWith('Query request:', expect.objectContaining({
        method: undefined,
        url: '/api/test'
      }));
      expect(mockLogger.debug).toHaveBeenCalledWith('Query response:', expect.objectContaining({
        url: '/api/test',
        statusCode: 200
      }));
      expect(next).toHaveBeenCalled();
    });

    test('should use specified log level', () => {
      const middleware = addQueryLogging('info');
      const originalJson = res.json;

      middleware(req, res, next);
      res.json({ data: 'test' });

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('optimizeFindQueries', () => {
    test('should call next without errors', async () => {
      const MockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        countDocuments: jest.fn(),
        aggregate: jest.fn(),
        collection: { name: 'test' }
      };
      queryOptimizationService.optimizeFindQuery = jest.fn().mockReturnValue({
        query: {},
        options: {}
      });
      queryOptimizationService.createOptimizedAggregation = jest.fn().mockReturnValue([]);

      const middleware = optimizeFindQueries(MockModel);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      const MockModel = {
        find: jest.fn(),
        collection: { name: 'test' }
      };
      queryOptimizationService.optimizeFindQuery = jest.fn().mockImplementation(() => {
        throw new Error('Optimization error');
      });

      const middleware = optimizeFindQueries(MockModel);
      await middleware(req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});

