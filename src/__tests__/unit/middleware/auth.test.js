const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../../../middleware/auth');
const User = require('../../../models/User');

jest.mock('jsonwebtoken');
jest.mock('../../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn(),
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('auth middleware', () => {
    test('should return 401 if no token provided', async () => {
      req.header.mockReturnValue(undefined);

      await auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token, authorization denied'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if token is invalid', async () => {
      req.header.mockReturnValue('Bearer invalid-token');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if user not found', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 'user-id' });
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById = jest.fn().mockReturnValue({ select: mockSelect });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is not valid',
        code: 'USER_NOT_FOUND'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should set req.user and call next on valid token', async () => {
      const mockUser = { _id: 'user-id', email: 'test@example.com', isActive: true };
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 'user-id' });
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById = jest.fn().mockReturnValue({ select: mockSelect });

      await auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should extract token from Authorization header', async () => {
      const mockUser = { _id: 'user-id', email: 'test@example.com', isActive: true };
      req.header.mockReturnValue('Bearer token123');
      jwt.verify.mockReturnValue({ id: 'user-id' });
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById = jest.fn().mockReturnValue({ select: mockSelect });

      await auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(jwt.verify).toHaveBeenCalledWith('token123', 'test-secret');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    test('should return 401 if user not authenticated', () => {
      req.user = null;
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access if no roles specified', () => {
      req.user = { roles: ['client'] };
      const middleware = authorize();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access if user has required role', () => {
      req.user = { roles: ['admin'] };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access if user has any of multiple required roles', () => {
      req.user = { roles: ['provider'] };
      const middleware = authorize('admin', 'provider');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 403 if user does not have required role', () => {
      req.user = { roles: ['client'] };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User roles [client] are not authorized to access this route. Required: [admin]'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle multiple roles in error message', () => {
      req.user = { roles: ['client'] };
      const middleware = authorize('admin', 'provider');

      middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User roles [client] are not authorized to access this route. Required: [admin, provider]'
      });
    });

    test('should handle user with no roles array', () => {
      req.user = {};
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

