const { auth, authorize } = require('../../../middleware/auth');
const { accessTokenAuth } = require('../../../middleware/accessTokenAuth');
const { apiKeyAuth } = require('../../../middleware/apiKeyAuth');

jest.mock('../../../middleware/accessTokenAuth');
jest.mock('../../../middleware/apiKeyAuth');

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
    // Reset mocks
    accessTokenAuth.mockClear();
    apiKeyAuth.mockClear();
  });

  describe('auth middleware', () => {
    test('should return 401 if no token provided', async () => {
      req.header = jest.fn().mockReturnValue(undefined);
      req.headers = {};
      req.query = {};

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        code: 'MISSING_AUTH',
        hint: 'Provide API key/secret, Bearer token, or Authorization header'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should delegate to accessTokenAuth for Bearer tokens', async () => {
      req.header = jest.fn().mockReturnValue('Bearer invalid-token');
      req.headers = {};
      req.query = {};
      
      // Mock accessTokenAuth to call next (simulating it handles the auth)
      accessTokenAuth.mockImplementation((req, res, _next) => {
        res.status(401).json({
          success: false,
          message: 'Invalid access token',
          code: 'INVALID_TOKEN'
        });
      });

      await auth(req, res, next);

      expect(accessTokenAuth).toHaveBeenCalledWith(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle user not found via accessTokenAuth', async () => {
      req.header = jest.fn().mockReturnValue('Bearer valid-token');
      req.headers = {};
      req.query = {};
      
      // Mock accessTokenAuth to return user not found
      accessTokenAuth.mockImplementation((req, res, _next) => {
        res.status(401).json({
          success: false,
          message: 'Token is not valid',
          code: 'USER_NOT_FOUND'
        });
      });

      await auth(req, res, next);

      expect(accessTokenAuth).toHaveBeenCalledWith(req, res, next);
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
      req.header = jest.fn().mockReturnValue('Bearer valid-token');
      req.headers = {};
      req.query = {};
      
      // Mock accessTokenAuth to set user and call next
      accessTokenAuth.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      await auth(req, res, next);

      expect(accessTokenAuth).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should extract token from Authorization header', async () => {
      const mockUser = { _id: 'user-id', email: 'test@example.com', isActive: true };
      req.header = jest.fn().mockReturnValue('Bearer token123');
      req.headers = {};
      req.query = {};
      
      // Mock accessTokenAuth to set user and call next
      accessTokenAuth.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      await auth(req, res, next);

      expect(accessTokenAuth).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    test('should delegate to apiKeyAuth when API key and secret are provided', async () => {
      const mockUser = { _id: 'user-id', email: 'test@example.com', isActive: true };
      req.header = jest.fn().mockReturnValue(undefined);
      req.headers = {
        'x-api-key': 'test-api-key',
        'x-api-secret': 'test-api-secret'
      };
      req.query = {};
      
      // Mock apiKeyAuth to set user and call next
      apiKeyAuth.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      await auth(req, res, next);

      expect(apiKeyAuth).toHaveBeenCalledWith(req, res, next);
      expect(accessTokenAuth).not.toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
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

