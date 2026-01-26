// Middleware to require admin role
module.exports = function requireAdmin(req, res, next) {
  if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
