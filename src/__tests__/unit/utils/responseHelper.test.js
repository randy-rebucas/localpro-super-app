const {
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendValidationError,
  sendAuthorizationError,
  sendNotFoundError,
  sendConflictError,
  sendServerError,
  sendRateLimitError,
  createPagination,
  createComprehensivePagination,
  createCursorPagination,
  formatResponseData
} = require('../../../utils/responseHelper');

describe('Response Helper Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('sendSuccess', () => {
    test('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      sendSuccess(mockRes, data, 'Success', 200);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data
      });
    });

    test('should send success response without data', () => {
      sendSuccess(mockRes, null, 'Success');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success'
      });
    });

    test('should include metadata', () => {
      const meta = { count: 10 };
      sendSuccess(mockRes, [], 'Success', 200, meta);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        count: 10,
        data: []
      });
    });
  });

  describe('sendPaginated', () => {
    test('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        pages: 5,
        total: 50,
        limit: 10
      };

      sendPaginated(mockRes, data, pagination);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        pagination: {
          current: 1,
          pages: 5,
          total: 50,
          limit: 10,
          count: 2
        }
      });
    });
  });

  describe('sendCreated', () => {
    test('should send created response with 201 status', () => {
      const data = { id: 1, name: 'New Resource' };
      sendCreated(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
        data
      });
    });
  });

  describe('sendUpdated', () => {
    test('should send updated response', () => {
      const data = { id: 1, name: 'Updated Resource' };
      sendUpdated(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource updated successfully',
        data
      });
    });
  });

  describe('sendDeleted', () => {
    test('should send deleted response', () => {
      sendDeleted(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource deleted successfully'
      });
    });
  });

  describe('sendValidationError', () => {
    test('should send validation error response', () => {
      const errors = ['Field is required', 'Invalid format'];
      sendValidationError(mockRes, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    });
  });

  describe('sendAuthorizationError', () => {
    test('should send authorization error response', () => {
      sendAuthorizationError(mockRes, 'Not authorized', 'FORBIDDEN');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized',
        code: 'FORBIDDEN'
      });
    });
  });

  describe('sendNotFoundError', () => {
    test('should send not found error response', () => {
      sendNotFoundError(mockRes, 'Resource not found', 'NOT_FOUND');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('sendConflictError', () => {
    test('should send conflict error response', () => {
      sendConflictError(mockRes, 'Resource conflict', 'CONFLICT');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource conflict',
        code: 'CONFLICT'
      });
    });
  });

  describe('sendServerError', () => {
    test('should send server error response', () => {
      const error = new Error('Internal error');
      process.env.NODE_ENV = 'development';
      
      sendServerError(mockRes, error);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: 'Internal error'
      });
    });

    test('should hide error details in production', () => {
      const error = new Error('Internal error');
      process.env.NODE_ENV = 'production';
      
      sendServerError(mockRes, error);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: undefined
      });
    });
  });

  describe('sendRateLimitError', () => {
    test('should send rate limit error response', () => {
      sendRateLimitError(mockRes, 'Too many requests', 'RATE_LIMIT_EXCEEDED');

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    });
  });

  describe('createPagination', () => {
    test('should create pagination metadata', () => {
      const result = createPagination(2, 10, 25);

      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });

    test('should handle zero total', () => {
      const result = createPagination(1, 10, 0);
      expect(result.pages).toBe(0);
    });
  });

  describe('createComprehensivePagination', () => {
    test('should create comprehensive pagination metadata', () => {
      const paginationParams = { page: 2, limit: 10 };
      const total = 25;
      const count = 10;
      const performance = { queryTime: 50 };

      const result = createComprehensivePagination(paginationParams, total, count, performance);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.count).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
      expect(result.nextPage).toBe(3);
      expect(result.prevPage).toBe(1);
      expect(result.queryTime).toBe(50);
      expect(result.isFirstPage).toBe(false);
      expect(result.isLastPage).toBe(false);
    });
  });

  describe('createCursorPagination', () => {
    test('should create cursor pagination metadata', () => {
      const paginationParams = { limit: 10, cursor: 'cursor123' };
      const results = [
        { id: 1, createdAt: new Date('2025-01-01') },
        { id: 2, createdAt: new Date('2025-01-02') }
      ];
      const cursorField = 'createdAt';

      const result = createCursorPagination(paginationParams, results, cursorField);

      expect(result.limit).toBe(10);
      expect(result.count).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.cursor).toBe('cursor123');
      expect(result.hasNext).toBe(false);
    });
  });

  describe('formatResponseData', () => {
    test('should format array data', () => {
      const data = [{ id: 1, password: 'secret' }, { id: 2, password: 'secret' }];
      const options = { excludeFields: ['password'] };

      const result = formatResponseData(data, options);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).toHaveProperty('id');
    });

    test('should format object data', () => {
      const data = { id: 1, password: 'secret', email: 'test@example.com' };
      const options = { excludeFields: ['password'] };

      const result = formatResponseData(data, options);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    test('should add fields', () => {
      const data = { id: 1 };
      const options = { addFields: { timestamp: '2025-01-01' } };

      const result = formatResponseData(data, options);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
    });

    test('should return null for null input', () => {
      expect(formatResponseData(null)).toBeNull();
    });
  });
});

