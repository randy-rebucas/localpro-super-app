const {
  authorize,
  canManageUser,
  canViewUser,
  getUserPermissions,
  hasPermission
} = require('../../../middleware/authorize');
const User = require('../../../models/User');

jest.mock('../../../models/User');

describe('Authorize Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authorize middleware', () => {
    test('should return 401 if user not authenticated', async () => {
      req.user = null;
      const middleware = authorize(['admin']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access if user has required role', async () => {
      req.user = {
        id: 'user-id',
        roles: ['admin'],
        hasAnyRole: jest.fn().mockReturnValue(true)
      };
      const middleware = authorize(['admin']);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access if user has any of multiple required roles', async () => {
      req.user = {
        id: 'user-id',
        roles: ['provider'],
        hasAnyRole: jest.fn().mockReturnValue(true)
      };
      const middleware = authorize(['admin', 'provider']);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return 403 if user does not have required role', async () => {
      req.user = {
        id: 'user-id',
        roles: ['client'],
        hasAnyRole: jest.fn().mockReturnValue(false)
      };
      const middleware = authorize(['admin']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow self access when allowSelf is true', async () => {
      req.user = {
        id: 'user-id',
        roles: ['client']
      };
      req.params.id = 'user-id';
      const middleware = authorize(['admin'], { allowSelf: true });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should allow agency member access when allowAgencyMembers is true', async () => {
      const agencyId = 'agency-123';
      req.user = {
        id: 'user-id',
        roles: ['client'],
        agency: { agencyId }
      };
      req.params.id = 'target-user-id';
      const targetUser = {
        _id: 'target-user-id',
        agency: { agencyId }
      };
      User.findById = jest.fn().mockResolvedValue(targetUser);
      const middleware = authorize(['admin'], { allowAgencyMembers: true });

      await middleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('target-user-id');
      expect(next).toHaveBeenCalled();
    });

    test('should restrict agency admin to same agency users', async () => {
      req.user = {
        id: 'admin-id',
        roles: ['agency_admin'],
        agency: { agencyId: 'agency-123' }
      };
      req.params.id = 'target-user-id';
      const targetUser = {
        _id: 'target-user-id',
        agency: { agencyId: 'agency-123' }
      };
      User.findById = jest.fn().mockResolvedValue(targetUser);
      const middleware = authorize(['agency_admin']);

      await middleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('target-user-id');
      expect(next).toHaveBeenCalled();
    });

    test('should block agency admin from accessing different agency users', async () => {
      req.user = {
        id: 'admin-id',
        roles: ['agency_admin'],
        agency: { agencyId: 'agency-123' }
      };
      req.params.id = 'target-user-id';
      const targetUser = {
        _id: 'target-user-id',
        agency: { agencyId: 'agency-456' }
      };
      User.findById = jest.fn().mockResolvedValue(targetUser);
      const middleware = authorize(['agency_admin']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Can only manage users within your agency'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      req.user = {
        id: 'user-id',
        roles: ['agency_admin'],
        agency: { agencyId: 'agency-123' }
      };
      req.params.id = 'target-id';
      // Make User.findById throw an error to trigger the catch block
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));
      const middleware = authorize(['agency_admin']);

      const originalError = console.error;
      console.error = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization error'
      });

      console.error = originalError;
    });
  });

  describe('canManageUser', () => {
    test('should return true for admin', async () => {
      const currentUser = {
        _id: 'admin-id',
        hasRole: jest.fn().mockReturnValue(true),
        roles: ['admin']
      };
      User.findById = jest.fn().mockResolvedValue(currentUser);

      const result = await canManageUser('target-id', 'admin-id', 'admin');

      expect(result).toBe(true);
    });

    test('should return true for self', async () => {
      const currentUser = {
        _id: 'user-id',
        roles: ['client']
      };
      User.findById = jest.fn().mockResolvedValue(currentUser);

      const result = await canManageUser('user-id', 'user-id', 'client');

      expect(result).toBe(true);
    });

    test('should return true for agency admin managing same agency user', async () => {
      const agencyId = 'agency-123';
      const currentUser = {
        _id: 'admin-id',
        roles: ['agency_admin'],
        agency: { agencyId }
      };
      const targetUser = {
        _id: 'target-id',
        agency: { agencyId }
      };
      User.findById = jest.fn()
        .mockResolvedValueOnce(currentUser)
        .mockResolvedValueOnce(targetUser);

      const result = await canManageUser('target-id', 'admin-id', 'agency_admin');

      expect(result).toBe(true);
    });

    test('should return false for agency admin managing different agency user', async () => {
      const currentUser = {
        _id: 'admin-id',
        roles: ['agency_admin'],
        agency: { agencyId: 'agency-123' }
      };
      const targetUser = {
        _id: 'target-id',
        agency: { agencyId: 'agency-456' }
      };
      User.findById = jest.fn()
        .mockResolvedValueOnce(currentUser)
        .mockResolvedValueOnce(targetUser);

      const result = await canManageUser('target-id', 'admin-id', 'agency_admin');

      expect(result).toBe(false);
    });

    test('should return false on error', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const originalError = console.error;
      console.error = jest.fn();

      const result = await canManageUser('target-id', 'user-id', 'client');

      expect(result).toBe(false);

      console.error = originalError;
    });
  });

  describe('canViewUser', () => {
    test('should return true for admin', async () => {
      const currentUser = {
        _id: 'admin-id',
        hasRole: jest.fn().mockReturnValue(true),
        roles: ['admin']
      };
      User.findById = jest.fn().mockResolvedValue(currentUser);

      const result = await canViewUser('target-id', 'admin-id', 'admin');

      expect(result).toBe(true);
    });

    test('should return true for self', async () => {
      const currentUser = {
        _id: 'user-id',
        roles: ['client']
      };
      User.findById = jest.fn().mockResolvedValue(currentUser);

      const result = await canViewUser('user-id', 'user-id', 'client');

      expect(result).toBe(true);
    });

    test('should return true for agency members viewing same agency user', async () => {
      const agencyId = 'agency-123';
      const currentUser = {
        _id: 'provider-id',
        roles: ['provider'],
        agency: { agencyId }
      };
      const targetUser = {
        _id: 'target-id',
        agency: { agencyId }
      };
      User.findById = jest.fn()
        .mockResolvedValueOnce(currentUser)
        .mockResolvedValueOnce(targetUser);

      const result = await canViewUser('target-id', 'provider-id', 'provider');

      expect(result).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    test('should return permissions for single role', () => {
      const permissions = getUserPermissions('admin');

      expect(permissions).toContain('manage_all_users');
      expect(permissions).toContain('view_all_users');
    });

    test('should return permissions for multiple roles', () => {
      const permissions = getUserPermissions(['provider', 'client']);

      expect(permissions).toContain('view_own_profile');
      expect(permissions).toContain('create_services');
      expect(permissions).toContain('book_services');
    });

    test('should return empty array for invalid role', () => {
      const permissions = getUserPermissions('invalid_role');

      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    test('should return true if user has permission', () => {
      const result = hasPermission('admin', 'manage_all_users');

      expect(result).toBe(true);
    });

    test('should return false if user does not have permission', () => {
      const result = hasPermission('client', 'manage_all_users');

      expect(result).toBe(false);
    });

    test('should work with multiple roles', () => {
      const result = hasPermission(['provider', 'client'], 'view_own_profile');

      expect(result).toBe(true);
    });
  });
});

