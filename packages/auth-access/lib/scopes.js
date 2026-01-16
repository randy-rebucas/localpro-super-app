/**
 * RBAC / Scopes Module
 * Handles role-based access control and scope validation
 */
class ScopeManager {
  constructor() {
    // Define role hierarchy and default scopes
    this.roleHierarchy = {
      'client': 1,
      'partner:basic': 2,
      'partner:premium': 3,
      'admin': 4
    };

    this.defaultScopes = {
      'client': ['read:own', 'write:own'],
      'partner:basic': ['read:own', 'write:own', 'read:services', 'write:services'],
      'partner:premium': ['read:own', 'write:own', 'read:services', 'write:services', 'read:analytics', 'write:analytics'],
      'admin': ['*'] // Admin has all scopes
    };
  }

  /**
   * Get default scopes for a role
   * @param {string} role - User role
   * @returns {string[]} Array of scopes
   */
  getDefaultScopes(role) {
    return this.defaultScopes[role] || [];
  }

  /**
   * Check if token has required scopes
   * @param {Object} tokenPayload - Decoded token payload
   * @param {string|string[]} requiredScopes - Required scope(s)
   * @returns {boolean} True if token has required scopes
   */
  checkScopes(tokenPayload, requiredScopes) {
    if (!tokenPayload) {
      return false;
    }

    // Admin has all scopes
    if (tokenPayload.role === 'admin' || 
        (Array.isArray(tokenPayload.scopes) && tokenPayload.scopes.includes('*'))) {
      return true;
    }

    const tokenScopes = Array.isArray(tokenPayload.scopes) 
      ? tokenPayload.scopes 
      : (tokenPayload.scopes ? [tokenPayload.scopes] : []);

    // Add default scopes for the role
    const roleScopes = this.getDefaultScopes(tokenPayload.role);
    const allTokenScopes = [...new Set([...tokenScopes, ...roleScopes])];

    const required = Array.isArray(requiredScopes) 
      ? requiredScopes 
      : [requiredScopes];

    // Check if all required scopes are present
    return required.every(scope => {
      // Support wildcard matching
      if (scope.includes('*')) {
        const pattern = scope.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return allTokenScopes.some(s => regex.test(s));
      }
      return allTokenScopes.includes(scope);
    });
  }

  /**
   * Check if role has required permission level
   * @param {string} userRole - User's role
   * @param {string} requiredRole - Minimum required role
   * @returns {boolean} True if user role meets requirement
   */
  hasRole(userRole, requiredRole) {
    const userLevel = this.roleHierarchy[userRole] || 0;
    const requiredLevel = this.roleHierarchy[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  /**
   * Validate role format
   * @param {string} role - Role to validate
   * @returns {boolean} True if role is valid
   */
  isValidRole(role) {
    return Object.keys(this.roleHierarchy).includes(role);
  }
}

module.exports = ScopeManager;
