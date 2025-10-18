const User = require('../models/User');

// @desc    Authorization middleware to check user roles and permissions
// @param   {Array} roles - Array of allowed roles
// @param   {Object} options - Additional authorization options
const authorize = (roles = [], options = {}) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = req.user;
      const { allowSelf = false, allowAgencyMembers = false } = options;

      // Check if user has required role
      if (roles.length > 0 && !roles.includes(user.role)) {
        // Special case: allow users to access their own data
        if (allowSelf && req.params.id === user.id) {
          return next();
        }

        // Special case: allow agency members to access each other's data
        if (allowAgencyMembers && user.agency?.agencyId) {
          const targetUser = await User.findById(req.params.id);
          if (targetUser && targetUser.agency?.agencyId?.toString() === user.agency.agencyId.toString()) {
            return next();
          }
        }

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Additional role-specific checks
      if (user.role === 'agency_admin' || user.role === 'agency_owner') {
        // Agency admins and owners can only manage users within their agency
        if (req.params.id && req.params.id !== user.id) {
          const targetUser = await User.findById(req.params.id);
          if (!targetUser || targetUser.agency?.agencyId?.toString() !== user.agency?.agencyId?.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Can only manage users within your agency'
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// @desc    Check if user can manage specific user
// @param   {String} targetUserId - ID of user to manage
// @param   {String} currentUserId - ID of current user
// @param   {String} currentUserRole - Role of current user
const canManageUser = async (targetUserId, currentUserId, currentUserRole) => {
  try {
    // Admin can manage anyone
    if (currentUserRole === 'admin') {
      return true;
    }

    // Users can manage themselves
    if (targetUserId === currentUserId) {
      return true;
    }

    // Agency admins and owners can manage users in their agency
    if (currentUserRole === 'agency_admin' || currentUserRole === 'agency_owner') {
      const currentUser = await User.findById(currentUserId);
      const targetUser = await User.findById(targetUserId);
      
      if (currentUser?.agency?.agencyId?.toString() === targetUser?.agency?.agencyId?.toString()) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Can manage user error:', error);
    return false;
  }
};

// @desc    Check if user can view specific user data
// @param   {String} targetUserId - ID of user to view
// @param   {String} currentUserId - ID of current user
// @param   {String} currentUserRole - Role of current user
const canViewUser = async (targetUserId, currentUserId, currentUserRole) => {
  try {
    // Admin can view anyone
    if (currentUserRole === 'admin') {
      return true;
    }

    // Users can view themselves
    if (targetUserId === currentUserId) {
      return true;
    }

    // Agency members can view each other
    if (currentUserRole === 'agency_admin' || currentUserRole === 'agency_owner' || currentUserRole === 'provider') {
      const currentUser = await User.findById(currentUserId);
      const targetUser = await User.findById(targetUserId);
      
      if (currentUser?.agency?.agencyId?.toString() === targetUser?.agency?.agencyId?.toString()) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Can view user error:', error);
    return false;
  }
};

// @desc    Get user permissions based on role
// @param   {String} role - User role
const getUserPermissions = (role) => {
  const permissions = {
    admin: [
      'manage_all_users',
      'view_all_users',
      'create_users',
      'update_users',
      'delete_users',
      'manage_agencies',
      'view_analytics',
      'manage_system_settings'
    ],
    agency_owner: [
      'manage_agency_users',
      'view_agency_users',
      'create_agency_users',
      'update_agency_users',
      'view_agency_analytics',
      'manage_agency_settings'
    ],
    agency_admin: [
      'manage_agency_users',
      'view_agency_users',
      'update_agency_users',
      'view_agency_analytics'
    ],
    provider: [
      'view_own_profile',
      'update_own_profile',
      'view_agency_members'
    ],
    client: [
      'view_own_profile',
      'update_own_profile'
    ],
    supplier: [
      'view_own_profile',
      'update_own_profile'
    ],
    instructor: [
      'view_own_profile',
      'update_own_profile'
    ]
  };

  return permissions[role] || [];
};

// @desc    Check if user has specific permission
// @param   {String} role - User role
// @param   {String} permission - Permission to check
const hasPermission = (role, permission) => {
  const permissions = getUserPermissions(role);
  return permissions.includes(permission);
};

module.exports = {
  authorize,
  canManageUser,
  canViewUser,
  getUserPermissions,
  hasPermission
};
