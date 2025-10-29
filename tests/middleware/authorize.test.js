const { authorize, canManageUser, canViewUser, getUserPermissions, hasPermission } = require('../../src/middleware/authorize');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/models/User');

describe('Advanced Authorization Middleware', () => {
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
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock User.findById
    User.findById = jest.fn();
  });

  describe('authorize middleware', () => {
    it('should return 401 if no user authenticated', async () => {
      req.user = null;

      await authorize(['admin'])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if user has required role', async () => {
      req.user = { role: 'admin', id: 'user-id' };

      await authorize(['admin'])(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access if user does not have required role', async () => {
      req.user = { role: 'client', id: 'user-id' };

      await authorize(['admin'])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow self access when allowSelf is true', async () => {
      req.user = { role: 'client', id: 'user-id' };
      req.params.id = 'user-id';

      await authorize(['admin'], { allowSelf: true })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow agency member access when allowAgencyMembers is true', async () => {
      const mockTargetUser = { agency: { agencyId: 'agency-1' } };
      req.user = { 
        role: 'provider', 
        id: 'user-id',
        agency: { agencyId: 'agency-1' }
      };
      req.params.id = 'target-user-id';
      User.findById.mockResolvedValue(mockTargetUser);

      await authorize(['admin'], { allowAgencyMembers: true })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny agency member access for different agencies', async () => {
      const mockTargetUser = { agency: { agencyId: 'agency-2' } };
      req.user = { 
        role: 'provider', 
        id: 'user-id',
        agency: { agencyId: 'agency-1' }
      };
      req.params.id = 'target-user-id';
      User.findById.mockResolvedValue(mockTargetUser);

      await authorize(['admin'], { allowAgencyMembers: true })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle agency admin restrictions', async () => {
      const mockTargetUser = { agency: { agencyId: 'agency-2' } };
      req.user = { 
        role: 'agency_admin', 
        id: 'user-id',
        agency: { agencyId: 'agency-1' }
      };
      req.params.id = 'target-user-id';
      User.findById.mockResolvedValue(mockTargetUser);

      await authorize(['agency_admin'])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Can only manage users within your agency'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      req.user = { 
        role: 'agency_admin', 
        id: 'user-id',
        agency: { agencyId: 'agency-1' }
      };
      req.params.id = 'target-user-id';
      User.findById.mockRejectedValue(new Error('Database error'));

      await authorize(['agency_admin'])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization error'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('canManageUser function', () => {
    it('should return true for admin users', async () => {
      const result = await canManageUser('target-id', 'admin-id', 'admin');
      expect(result).toBe(true);
    });

    it('should return true for self-management', async () => {
      const result = await canManageUser('user-id', 'user-id', 'client');
      expect(result).toBe(true);
    });

    it('should return true for agency admin managing same agency user', async () => {
      const mockCurrentUser = { agency: { agencyId: 'agency-1' } };
      const mockTargetUser = { agency: { agencyId: 'agency-1' } };
      User.findById
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockTargetUser);

      const result = await canManageUser('target-id', 'admin-id', 'agency_admin');
      expect(result).toBe(true);
    });

    it('should return false for agency admin managing different agency user', async () => {
      const mockCurrentUser = { agency: { agencyId: 'agency-1' } };
      const mockTargetUser = { agency: { agencyId: 'agency-2' } };
      User.findById
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockTargetUser);

      const result = await canManageUser('target-id', 'admin-id', 'agency_admin');
      expect(result).toBe(false);
    });

    it('should return false for unauthorized role', async () => {
      const result = await canManageUser('target-id', 'user-id', 'client');
      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      const result = await canManageUser('target-id', 'admin-id', 'agency_admin');
      expect(result).toBe(false);
    });
  });

  describe('canViewUser function', () => {
    it('should return true for admin users', async () => {
      const result = await canViewUser('target-id', 'admin-id', 'admin');
      expect(result).toBe(true);
    });

    it('should return true for self-viewing', async () => {
      const result = await canViewUser('user-id', 'user-id', 'client');
      expect(result).toBe(true);
    });

    it('should return true for agency members viewing each other', async () => {
      const mockCurrentUser = { agency: { agencyId: 'agency-1' } };
      const mockTargetUser = { agency: { agencyId: 'agency-1' } };
      User.findById
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockTargetUser);

      const result = await canViewUser('target-id', 'provider-id', 'provider');
      expect(result).toBe(true);
    });

    it('should return false for different agencies', async () => {
      const mockCurrentUser = { agency: { agencyId: 'agency-1' } };
      const mockTargetUser = { agency: { agencyId: 'agency-2' } };
      User.findById
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockTargetUser);

      const result = await canViewUser('target-id', 'provider-id', 'provider');
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions function', () => {
    it('should return admin permissions', () => {
      const permissions = getUserPermissions('admin');
      expect(permissions).toContain('manage_all_users');
      expect(permissions).toContain('view_all_users');
      expect(permissions).toContain('manage_system_settings');
    });

    it('should return agency owner permissions', () => {
      const permissions = getUserPermissions('agency_owner');
      expect(permissions).toContain('manage_agency_users');
      expect(permissions).toContain('view_agency_analytics');
      expect(permissions).not.toContain('manage_all_users');
    });

    it('should return client permissions', () => {
      const permissions = getUserPermissions('client');
      expect(permissions).toContain('view_own_profile');
      expect(permissions).toContain('update_own_profile');
      expect(permissions).not.toContain('manage_agency_users');
    });

    it('should return empty array for unknown role', () => {
      const permissions = getUserPermissions('unknown_role');
      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission function', () => {
    it('should return true if user has permission', () => {
      const result = hasPermission('admin', 'manage_all_users');
      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', () => {
      const result = hasPermission('client', 'manage_all_users');
      expect(result).toBe(false);
    });

    it('should return false for unknown role', () => {
      const result = hasPermission('unknown_role', 'manage_all_users');
      expect(result).toBe(false);
    });
  });
});
