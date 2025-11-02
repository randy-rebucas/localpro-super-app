/**
 * Response Helper Utilities Tests
 * Comprehensive tests for response formatting utilities
 */

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
} = require('../../utils/responseHelper');

describe('Response Helper Utilities', () => {
  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendSuccess(res, { id: 1, name: 'Test' }, 'Success message', 200);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data: { id: 1, name: 'Test' }
      });
    });

    it('should send success response without data when data is null', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendSuccess(res, null, 'Success message', 200);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message'
      });
    });

    it('should include meta data in response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendSuccess(res, { id: 1 }, 'Success', 200, { timestamp: '2024-01-01' });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        timestamp: '2024-01-01',
        data: { id: 1 }
      });
    });

    it('should use default message and status code', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendSuccess(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 }
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        pages: 5,
        total: 10,
        limit: 2
      };

      sendPaginated(res, data, pagination, 'Items retrieved');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Items retrieved',
        data: data,
        pagination: {
          current: 1,
          pages: 5,
          total: 10,
          limit: 2,
          count: 2
        }
      });
    });
  });

  describe('sendCreated', () => {
    it('should send created response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendCreated(res, { id: 1, name: 'New Item' });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
        data: { id: 1, name: 'New Item' }
      });
    });

    it('should allow custom message', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendCreated(res, { id: 1 }, 'Custom created message');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom created message',
        data: { id: 1 }
      });
    });
  });

  describe('sendUpdated', () => {
    it('should send updated response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendUpdated(res, { id: 1, name: 'Updated Item' });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource updated successfully',
        data: { id: 1, name: 'Updated Item' }
      });
    });
  });

  describe('sendDeleted', () => {
    it('should send deleted response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendDeleted(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource deleted successfully'
      });
    });

    it('should allow custom message', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendDeleted(res, 'Item removed');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item removed'
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const errors = ['Field is required', 'Invalid format'];
      sendValidationError(res, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: errors
      });
    });
  });

  describe('sendAuthorizationError', () => {
    it('should send authorization error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendAuthorizationError(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized',
        code: 'UNAUTHORIZED'
      });
    });
  });

  describe('sendNotFoundError', () => {
    it('should send not found error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendNotFoundError(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('sendConflictError', () => {
    it('should send conflict error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendConflictError(res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource conflict',
        code: 'CONFLICT'
      });
    });
  });

  describe('sendServerError', () => {
    it('should send server error response in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const error = new Error('Test error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      sendServerError(res, error, 'Server error', 'SERVER_ERROR');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        code: 'SERVER_ERROR',
        error: 'Test error'
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const error = new Error('Test error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      sendServerError(res, error);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        error: undefined
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('sendRateLimitError', () => {
    it('should send rate limit error response', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      sendRateLimitError(res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    });
  });

  describe('createPagination', () => {
    it('should create pagination metadata', () => {
      const result = createPagination(2, 10, 25);

      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });
    });

    it('should handle edge cases', () => {
      expect(createPagination(1, 10, 0)).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    });
  });

  describe('createComprehensivePagination', () => {
    it('should create comprehensive pagination metadata', () => {
      const paginationParams = { page: 2, limit: 10 };
      const result = createComprehensivePagination(paginationParams, 25, 10);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.count).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
      expect(result.nextPage).toBe(3);
      expect(result.prevPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.startItem).toBe(11);
      expect(result.endItem).toBe(20);
      expect(result.isEmpty).toBe(false);
      expect(result.isFirstPage).toBe(false);
      expect(result.isLastPage).toBe(false);
    });

    it('should include performance metrics', () => {
      const paginationParams = { page: 1, limit: 10 };
      const performance = {
        queryTime: 150,
        indexUsed: 'idx_name',
        executionStats: { nReturned: 10 }
      };
      const result = createComprehensivePagination(paginationParams, 10, 10, performance);

      expect(result.queryTime).toBe(150);
      expect(result.indexUsed).toBe('idx_name');
      expect(result.executionStats).toEqual({ nReturned: 10 });
    });

    it('should handle first page correctly', () => {
      const paginationParams = { page: 1, limit: 10 };
      const result = createComprehensivePagination(paginationParams, 10, 10);

      expect(result.isFirstPage).toBe(true);
      expect(result.hasPrev).toBe(false);
      expect(result.prevPage).toBeNull();
    });

    it('should handle last page correctly', () => {
      const paginationParams = { page: 3, limit: 10 };
      const result = createComprehensivePagination(paginationParams, 25, 5);

      expect(result.isLastPage).toBe(true);
      expect(result.hasNext).toBe(false);
      expect(result.nextPage).toBeNull();
    });
  });

  describe('createCursorPagination', () => {
    it('should create cursor pagination metadata', () => {
      const paginationParams = { limit: 10, cursor: null };
      const results = [
        { id: 1, createdAt: new Date('2024-01-01') },
        { id: 2, createdAt: new Date('2024-01-02') }
      ];

      const result = createCursorPagination(paginationParams, results, 'createdAt');

      expect(result.limit).toBe(10);
      expect(result.count).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.cursor).toBeNull();
      // nextCursor can be null if hasMore is false and we haven't reached the limit
      // But if we have results and reached limit, nextCursor should be set
      expect(result.prevCursor).toBeTruthy();
      expect(result.isEmpty).toBe(false);
      expect(result.isFirstPage).toBe(true);
    });

    it('should handle hasMore when results exceed limit', () => {
      const paginationParams = { limit: 2, cursor: null };
      const results = [
        { id: 1, createdAt: new Date('2024-01-01') },
        { id: 2, createdAt: new Date('2024-01-02') },
        { id: 3, createdAt: new Date('2024-01-03') } // Extra item
      ];

      const result = createCursorPagination(paginationParams, results, 'createdAt');

      expect(result.hasMore).toBe(true);
      expect(result.count).toBe(2); // Should only return requested limit
    });

    it('should handle empty results', () => {
      const paginationParams = { limit: 10, cursor: 'cursor123' };
      const results = [];

      const result = createCursorPagination(paginationParams, results, 'createdAt');

      expect(result.isEmpty).toBe(true);
      expect(result.hasMore).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('formatResponseData', () => {
    it('should return null for null/undefined data', () => {
      expect(formatResponseData(null)).toBeNull();
      expect(formatResponseData(undefined)).toBeNull();
    });

    it('should format array data', () => {
      const data = [{ id: 1, name: 'Test' }];
      const result = formatResponseData(data);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toEqual({ id: 1, name: 'Test' });
    });

    it('should exclude specified fields', () => {
      const data = { id: 1, password: 'secret', email: 'test@test.com' };
      const options = { excludeFields: ['password'] };
      const result = formatResponseData(data, options);

      expect(result.password).toBeUndefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe('test@test.com');
    });

    it('should add specified fields', () => {
      const data = { id: 1, name: 'Test' };
      const options = { addFields: { timestamp: '2024-01-01' } };
      const result = formatResponseData(data, options);

      expect(result.timestamp).toBe('2024-01-01');
      expect(result.id).toBe(1);
    });

    it('should handle non-object data', () => {
      expect(formatResponseData('string')).toBe('string');
      expect(formatResponseData(123)).toBe(123);
      expect(formatResponseData(true)).toBe(true);
    });

    it('should format nested arrays', () => {
      const data = [
        [{ id: 1 }, { id: 2 }],
        [{ id: 3 }]
      ];
      const options = { excludeFields: [] };
      const result = formatResponseData(data, options);

      expect(Array.isArray(result)).toBe(true);
      expect(Array.isArray(result[0])).toBe(true);
    });
  });
});
