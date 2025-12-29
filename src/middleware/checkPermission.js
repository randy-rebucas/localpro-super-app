const StaffPermission = require('../models/StaffPermission');
const { getUserPermissions } = require('./authorize');

/**
 * Middleware to check if user has required permission(s)
 * Supports both role-based and permission-based access control
 * 
 * @param {String|Array} requiredPermissions - Permission code(s) required
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
const checkPermission = (requiredPermissions, options = {}) => {
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
      
      // Convert to array if single permission
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Admin role has all permissions
      if (user.hasRole && user.hasRole('admin')) {
        return next();
      }

      // Check if user is staff
      const isStaff = user.hasRole && user.hasRole('staff');
      
      if (isStaff) {
        // Check staff permissions
        const hasAllPermissions = await StaffPermission.hasAnyPermission(user._id, permissions);
        
        if (hasAllPermissions) {
          return next();
        }
        
        // If requireAll option is set, check each permission individually
        if (options.requireAll) {
          for (const perm of permissions) {
            const hasPerm = await StaffPermission.hasPermission(user._id, perm);
            if (!hasPerm) {
              return res.status(403).json({
                success: false,
                message: `Missing required permission: ${perm}`
              });
            }
          }
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // For non-staff users, check role-based permissions
      const rolePermissions = getUserPermissions(user.roles || []);
      
      // Check if any of the required permissions match role permissions
      const hasRequiredPermission = permissions.some(perm => {
        // Check exact match
        if (rolePermissions.includes(perm)) {
          return true;
        }
        
        // Check module-level permissions (e.g., 'users.manage' grants 'users.view')
        const [module, action] = perm.split('.');
        if (module && action) {
          const moduleManage = `${module}.manage`;
          if (rolePermissions.includes(moduleManage)) {
            return true;
          }
        }
        
        return false;
      });

      if (hasRequiredPermission) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to check if user has permission for a specific module
 * 
 * @param {String} module - Module name
 * @param {String} action - Action (view, create, update, delete, manage)
 * @returns {Function} Express middleware
 */
const checkModulePermission = (module, action = 'view') => {
  const permissionCode = `${module}.${action}`;
  return checkPermission(permissionCode);
};

/**
 * Helper function to check permission programmatically
 * 
 * @param {Object} user - User object
 * @param {String|Array} permissions - Permission code(s) to check
 * @returns {Promise<Boolean>}
 */
const hasUserPermission = async (user, permissions) => {
  if (!user) {
    return false;
  }

  // Admin has all permissions
  if (user.hasRole && user.hasRole('admin')) {
    return true;
  }

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  // Check if user is staff
  if (user.hasRole && user.hasRole('staff')) {
    return await StaffPermission.hasAnyPermission(user._id, permissionArray);
  }

  // Check role-based permissions
  const rolePermissions = getUserPermissions(user.roles || []);
  return permissionArray.some(perm => {
    if (rolePermissions.includes(perm)) {
      return true;
    }
    
    // Check module-level permissions
    const [module, action] = perm.split('.');
    if (module && action) {
      const moduleManage = `${module}.manage`;
      if (rolePermissions.includes(moduleManage)) {
        return true;
      }
    }
    
    return false;
  });
};

module.exports = {
  checkPermission,
  checkModulePermission,
  hasUserPermission
};

