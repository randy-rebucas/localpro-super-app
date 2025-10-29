const { auth, authorize } = require('../../src/middleware/auth');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
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
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Ensure User.findById is properly mocked after clearing
    User.findById = jest.fn();
  });

  describe('auth middleware', () => {
    it('should return 401 if no token provided', async () => {
      req.header.mockReturnValue(undefined);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token, authorization denied'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.header.mockReturnValue('Bearer invalid-token');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is not valid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 'user-id' });
      User.findById.mockResolvedValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is not valid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should set user in request and call next for valid token', async () => {
      const mockUser = { _id: 'user-id', phoneNumber: '+1234567890', role: 'client' };
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ id: 'user-id' });
      
      // Mock the chained query - make it thenable
      const mockQuery = {
        select: jest.fn().mockReturnThis()
      };
      mockQuery.then = jest.fn().mockImplementation((resolve) => {
        resolve(mockUser);
      });
      User.findById.mockReturnValue(mockQuery);

      // Set JWT_SECRET for the test
      process.env.JWT_SECRET = 'test-secret';

      await auth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', async () => {
      req.header.mockReturnValue('valid-token');
      jwt.verify.mockReturnValue({ id: 'user-id' });
      
      // Mock the chained query
      const mockQuery = {
        select: jest.fn().mockResolvedValue(null)
      };
      User.findById.mockReturnValue(mockQuery);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is not valid'
      });
    });
  });

  describe('authorize middleware', () => {
    it('should return 401 if no user in request', () => {
      req.user = null;

      authorize('admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role not in allowed roles', () => {
      req.user = { role: 'client' };

      authorize('admin', 'provider')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role client is not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is in allowed roles', () => {
      req.user = { role: 'admin' };

      authorize('admin', 'provider')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access with empty roles array', () => {
      req.user = { role: 'client' };

      authorize()(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
