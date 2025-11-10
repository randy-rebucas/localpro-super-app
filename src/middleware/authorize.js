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

      // Check if user has required role (multi-role support)
      const userHasRole = user.hasAnyRole ? user.hasAnyRole(roles) : (user.roles || []).some(r => roles.includes(r));
      if (roles.length > 0 && !userHasRole) {
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
      const isAgencyAdmin = user.hasRole ? user.hasRole('agency_admin') : user.roles?.includes('agency_admin');
      const isAgencyOwner = user.hasRole ? user.hasRole('agency_owner') : user.roles?.includes('agency_owner');
      if (isAgencyAdmin || isAgencyOwner) {
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
// @param   {String} _currentUserRole - Role of current user (unused, kept for API compatibility)
const canManageUser = async (targetUserId, currentUserId, _currentUserRole) => {
  try {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return false;

    // Admin can manage anyone
    if (currentUser.hasRole ? currentUser.hasRole('admin') : currentUser.roles?.includes('admin')) {
      return true;
    }

    // Users can manage themselves
    if (targetUserId === currentUserId) {
      return true;
    }

    // Agency admins and owners can manage users in their agency
    const isAgencyAdmin = currentUser.hasRole ? currentUser.hasRole('agency_admin') : currentUser.roles?.includes('agency_admin');
    const isAgencyOwner = currentUser.hasRole ? currentUser.hasRole('agency_owner') : currentUser.roles?.includes('agency_owner');
    if (isAgencyAdmin || isAgencyOwner) {
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
// @param   {String} _currentUserRole - Role of current user (unused, kept for API compatibility)
const canViewUser = async (targetUserId, currentUserId, _currentUserRole) => {
  try {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return false;

    // Admin can view anyone
    if (currentUser.hasRole ? currentUser.hasRole('admin') : currentUser.roles?.includes('admin')) {
      return true;
    }

    // Users can view themselves
    if (targetUserId === currentUserId) {
      return true;
    }

    // Agency members can view each other
    const isAgencyAdmin = currentUser.hasRole ? currentUser.hasRole('agency_admin') : currentUser.roles?.includes('agency_admin');
    const isAgencyOwner = currentUser.hasRole ? currentUser.hasRole('agency_owner') : currentUser.roles?.includes('agency_owner');
    const isProvider = currentUser.hasRole ? currentUser.hasRole('provider') : currentUser.roles?.includes('provider');
    if (isAgencyAdmin || isAgencyOwner || isProvider) {
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

// @desc    Get user permissions based on roles
// @param   {Array|String} roles - User roles (array or single role)
const getUserPermissions = (roles) => {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  
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
      'view_agency_members',
      'create_services',
      'manage_services',
      'create_jobs',
      'manage_jobs'
    ],
    client: [
      'view_own_profile',
      'update_own_profile',
      'book_services',
      'apply_for_jobs'
    ],
    supplier: [
      'view_own_profile',
      'update_own_profile',
      'manage_supplies'
    ],
    instructor: [
      'view_own_profile',
      'update_own_profile',
      'create_courses',
      'manage_courses'
    ]
  };

  // Combine permissions from all roles
  const allPermissions = new Set();
  roles.forEach(role => {
    if (permissions[role]) {
      permissions[role].forEach(perm => allPermissions.add(perm));
    }
  });

  return Array.from(allPermissions);
};

// @desc    Check if user has specific permission
// @param   {Array|String} roles - User roles (array or single role)
// @param   {String} permission - Permission to check
const hasPermission = (roles, permission) => {
  const permissions = getUserPermissions(roles);
  return permissions.includes(permission);
};

module.exports = {
  authorize,
  canManageUser,
  canViewUser,
  getUserPermissions,
  hasPermission
};
