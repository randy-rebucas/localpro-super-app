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
  formatResponseData
} = require('../../src/utils/responseHelper');

describe('Response Helper', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Success message';
      const statusCode = 200;
      const meta = { count: 1 };

      sendSuccess(mockRes, data, message, statusCode, meta);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        count: 1,
        data: { id: 1, name: 'Test' }
      });
    });

    it('should send success response without data', () => {
      sendSuccess(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success'
      });
    });

    it('should use default values', () => {
      sendSuccess(mockRes, null, 'Custom message');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom message'
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        pages: 5,
        total: 10,
        limit: 2
      };

      sendPaginated(mockRes, data, pagination, 'Paginated data');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Paginated data',
        pagination: {
          current: 1,
          pages: 5,
          total: 10,
          limit: 2,
          count: 2
        },
        data: [{ id: 1 }, { id: 2 }]
      });
    });
  });

  describe('sendCreated', () => {
    it('should send created response', () => {
      const data = { id: 1, name: 'New Item' };

      sendCreated(mockRes, data, 'Item created');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item created',
        data: { id: 1, name: 'New Item' }
      });
    });

    it('should use default message', () => {
      const data = { id: 1 };

      sendCreated(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
        data: { id: 1 }
      });
    });
  });

  describe('sendUpdated', () => {
    it('should send updated response', () => {
      const data = { id: 1, name: 'Updated Item' };

      sendUpdated(mockRes, data, 'Item updated');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item updated',
        data: { id: 1, name: 'Updated Item' }
      });
    });
  });

  describe('sendDeleted', () => {
    it('should send deleted response', () => {
      sendDeleted(mockRes, 'Item deleted');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item deleted'
      });
    });

    it('should use default message', () => {
      sendDeleted(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource deleted successfully'
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' }
      ];

      sendValidationError(mockRes, errors, 'Validation failed');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    });

    it('should use default message', () => {
      const errors = [{ field: 'name', message: 'Required' }];

      sendValidationError(mockRes, errors);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    });
  });

  describe('sendAuthorizationError', () => {
    it('should send authorization error response', () => {
      sendAuthorizationError(mockRes, 'Access denied', 'FORBIDDEN');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
        code: 'FORBIDDEN'
      });
    });

    it('should use default values', () => {
      sendAuthorizationError(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized',
        code: 'UNAUTHORIZED'
      });
    });
  });

  describe('sendNotFoundError', () => {
    it('should send not found error response', () => {
      sendNotFoundError(mockRes, 'User not found', 'USER_NOT_FOUND');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    });
  });

  describe('sendConflictError', () => {
    it('should send conflict error response', () => {
      sendConflictError(mockRes, 'Email already exists', 'EMAIL_CONFLICT');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        code: 'EMAIL_CONFLICT'
      });
    });
  });

  describe('sendServerError', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should send server error response in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed');

      sendServerError(mockRes, error, 'Internal error', 'DB_ERROR');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Server error:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal error',
        code: 'DB_ERROR',
        error: 'Database connection failed'
      });
    });

    it('should send server error response in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database connection failed');

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
    it('should send rate limit error response', () => {
      sendRateLimitError(mockRes, 'Too many requests', 'RATE_LIMIT');

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests',
        code: 'RATE_LIMIT'
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

    it('should handle string inputs', () => {
      const result = createPagination('1', '5', '12');

      expect(result).toEqual({
        page: 1,
        limit: 5,
        total: 12,
        pages: 3
      });
    });
  });

  describe('formatResponseData', () => {
    it('should return null for null data', () => {
      expect(formatResponseData(null)).toBeNull();
    });

    it('should return data as-is for non-object data', () => {
      expect(formatResponseData('string')).toBe('string');
      expect(formatResponseData(123)).toBe(123);
    });

    it('should format array data', () => {
      const data = [
        { id: 1, password: 'secret' },
        { id: 2, password: 'secret2' }
      ];

      const result = formatResponseData(data, {
        excludeFields: ['password']
      });

      expect(result).toEqual([
        { id: 1 },
        { id: 2 }
      ]);
    });

    it('should format object data', () => {
      const data = {
        id: 1,
        name: 'Test',
        password: 'secret',
        email: 'test@example.com'
      };

      const result = formatResponseData(data, {
        excludeFields: ['password'],
        addFields: { role: 'user' }
      });

      expect(result).toEqual({
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        role: 'user'
      });
    });

    it('should handle empty options', () => {
      const data = { id: 1, name: 'Test' };

      const result = formatResponseData(data);

      expect(result).toEqual({ id: 1, name: 'Test' });
    });
  });
});
